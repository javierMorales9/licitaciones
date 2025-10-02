import { XMLParser } from "fast-xml-parser";
import {
  parseEntries,
  parseDeletedEntries,
} from "./feedParser.js";
import type {
  AtomRootRaw,
  ParsedEntry,
  ParsedDeletedEntry,
} from "./feedParser.js";
import pino from "pino";
import { randomUUID } from "crypto";
import { Licitation } from "./domain/Licitation.js";
import { Doc } from "./domain/Doc.js";
import { Lot } from "./domain/Lot.js";
import { Party } from "./domain/Party.js";
import { Event, EventType } from "./domain/Event.js";
import { EmailNotifier } from "./infra/EmailNotifier.js";
import { Notifications } from "./domain/Notifications.js";
import type { CursorRepository } from "./domain/CursorRepository.js";
import type { LicitationRepository } from "./domain/LicitationRepository.js";
import type { LotRepository } from "./domain/LotRepository.js";
import type { PartyRepository } from "./domain/PartyRepository.js";
import type { DocRepository } from "./domain/DocRepository.js";
import type { EventRepository } from "./domain/EventRepository.js";
import type { AtomFetcher } from "./domain/AtomFetcher.js";

export async function start(
  baseUrl: string,
  CPVS: string[],
  cursorRepo: CursorRepository,
  licitationsRepo: LicitationRepository,
  lotsRepo: LotRepository,
  partyRepo: PartyRepository,
  docRepo: DocRepository,
  eventRepo: EventRepository,
  atomFetcher: AtomFetcher,
  logger: pino.Logger,
) {
  const runId = randomUUID();
  const start = Date.now();
  const rlog = logger.child({ runId, baseUrl });

  const m = {
    pagesFetched: 0,
    entriesProcessed: 0,
    entriesCreated: 0,
    entriesUpdated: 0,
    eventsEmitted: 0
  };

  const notifications = new Notifications();

  try {
    const lastUpdate = await cursorRepo.getLastCursor();
    if (!lastUpdate) {
      rlog.error({ stage: "init" }, "No previous cursor");
      return;
    }
    rlog.info({ stage: "init", lastUpdate }, "Job start");

    const { newEntries, newLastExtracted } = await extractNewEntries(
      baseUrl,
      lastUpdate,
      rlog,
      CPVS,
      m,
      atomFetcher,
    );
    rlog.info({
      stage: "fetch",
      pagesFetched: m.pagesFetched,
      entriesFetched: newEntries.length,
      newLastExtracted
    }, "Feed fetched");

    for (const entry of newEntries) {
      m.entriesProcessed++;
      const elog = rlog.child({
        entry_id: entry.entry_id,
        entryUpdated: entry.updated,
        statusNew: entry.statusCode
      });

      try {
        const lic = await licitationsRepo.get(entry.entry_id);
        const org = await partyRepo.get(entry.party.nif);

        const events: Event[] = [];

        if (lic) {
          if (!lic.id) {
            elog.warn({ reason: "missing_lic_id" }, "Unexpected: licitation without id")
            continue;
          }

          if (!org) {
            elog.error({ reason: "missing_org" }, "Unexpected: org must exist for an existing licitation");
            continue;
          }

          if (!org.id) {
            elog.error({ reason: "missing_org" }, "Unexpected: org must have an id");
            continue;
          }

          if (lic.updated >= entry.updated) {
            elog.debug({ licUpdated: lic.updated }, "Skip: stale entry");
            continue;
          }

          const prevStatus = lic.statusCode;
          const prevAdjLots = lic.lotsAdj;

          const docs = await docRepo.get(lic);
          const lots = await lotsRepo.getByLicitation(lic);

          const newDocs: Doc[] = [];
          const newLots: Lot[] = [];

          if (lic.statusCode === "PUB" && entry.statusCode === "EV") {
            const event = new Event({
              type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
              createdAt: new Date(entry.updated),
              licitationId: lic.id,
            });
            events.push(event);
            notifications.add(event, Licitation.fromParsedEntry(entry, org.id));
          }
          else if (lic.statusCode !== "RES" && entry.statusCode === "RES") {
            const event = new Event({
              type: EventType.LICITATION_RESOLVED,
              createdAt: new Date(entry.updated),
              licitationId: lic.id,
            });
            events.push(event);
            notifications.add(event, Licitation.fromParsedEntry(entry, org.id));
          }

          lic.update(entry);

          for (const parsedLot of entry.lots) {
            const lot = lots.find(el => el.lot_id === parsedLot.lot_id);

            if (!lot) {
              newLots.push(Lot.fromParsed(parsedLot, lic.id));
            } else {
              //Alternave: Use tender_result_code === 3 that means that the lot is desisted.
              if (lot.winning_nif === undefined && parsedLot.winning_nif !== undefined) {
                const event = new Event({
                  createdAt: parsedLot.award_date ? new Date(parsedLot.award_date) : lic.updated,
                  type: EventType.LICITATION_LOT_AWARDED,
                  licitationId: lic.id,
                  lotId: lot.lot_id.toString(),
                });
                events.push(event);
                notifications.add(event, lic, lot);
              }
              lot.update(parsedLot);
            }
          }

          for (const parsedDoc of entry.documents) {
            const doc = docs.find(el => el.docId === parsedDoc.docId);
            if (!doc) {
              newDocs.push(Doc.fromParsed(parsedDoc, lic.id));
            } else {
              doc.update(parsedDoc);
            }
          }

          const lotsAmount = lots.length + newLots.length;
          if (prevAdjLots < lotsAmount && lic.lotsAdj === lotsAmount) {
            const event = new Event({
              createdAt: lic.award_date ? new Date(lic.award_date) : lic.updated,
              type: EventType.LICITATION_AWARDED,
              licitationId: lic.id
            });
            events.push(event);
            notifications.add(event, lic);
          }

          if (org) {
            //Should always enter here
            org.update(entry.party);
            await partyRepo.save(org);
          }

          await licitationsRepo.save(lic);

          await lotsRepo.saveLots(lots);
          await lotsRepo.create(newLots);

          await docRepo.saveDocs(docs);
          await docRepo.create(newDocs);

          await eventRepo.add(events);

          m.entriesUpdated++;
          m.eventsEmitted += events.length;

          elog.info({
            action: "updated",
            statusPrev: prevStatus,
            statusCurr: lic.statusCode,
            lotsUpdated: lots.length,
            lotsCreated: newLots.length,
            docsUpdated: docs.length,
            docsCreated: newDocs.length,
            events: events.map(e => e.type)
          }, "Licitation Updated");
        } else {
          rlog.info({ org });
          let orgId = org?.id;
          if (!org) {
            orgId = await partyRepo.create(Party.fromParsed(entry.party));
          } else if (org.updated < new Date(entry.party.updated)) {
            org.update(entry.party);
          }
          if (!orgId) {
            elog.warn({ reason: "missing_org_id" }, "Unexpected: party id is undefined after upsert");
            continue;
          }

          const lic = Licitation.fromParsedEntry(entry, orgId);
          const licId = await licitationsRepo.create(lic);

          const lots = entry.lots.map(el => Lot.fromParsed(el, licId));

          if (lic.statusCode === 'ADJ') {
            for (const l of lots) {
              if (l.winning_nif !== undefined) {
                const event = new Event({
                  createdAt: l.award_date ? new Date(l.award_date) : lic.updated,
                  type: EventType.LICITATION_LOT_AWARDED,
                  licitationId: licId,
                  lotId: l.id,
                });
                events.push(event);
                notifications.add(event, lic);
              }
            }
          }

          const docs = entry.documents.map(el => Doc.fromParsed(el, licId));

          await lotsRepo.create(lots);
          await docRepo.create(docs);

          if (lic.statusCode === "PUB") {
            const event = new Event({
              createdAt: lic.publishedDate ? new Date(lic.publishedDate) : lic.updated,
              type: EventType.LICITATION_CREATED,
              licitationId: licId
            });
            events.push(event);
            notifications.add(event, lic);
          } else if (lic.statusCode === "EV") {
            const event = new Event({
              createdAt: lic.updated,
              type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
              licitationId: licId
            });
            events.push(event);
            notifications.add(event, lic);
          } else if (lic.statusCode === "ADJ" && lic.lotsAdj == entry.lots.length) {
            const event = new Event({
              createdAt: lic.updated,
              type: EventType.LICITATION_AWARDED,
              licitationId: licId
            });
            events.push(event);
            notifications.add(event, lic);
          } else if (lic.statusCode === "RES") {
            const event = new Event({
              createdAt: lic.updated,
              type: EventType.LICITATION_RESOLVED,
              licitationId: licId
            });
            events.push(event);
            notifications.add(event, lic);
          }

          await eventRepo.add(events);

          m.entriesCreated++;
          m.eventsEmitted += events.length;

          elog.info({
            action: "created",
            lotsCreated: entry.lots.length,
            docsCreated: entry.documents.length,
            events: events.map(e => e.type),
          }, "Licitation created");
        }
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.error({
          runId,
          entry_id: entry.entry_id,
          err,
          stack: err.stack
        }, "Entry processing error");
      }
    }

    await cursorRepo.updateCursor(newLastExtracted, newEntries.length);

    const notifier = new EmailNotifier(notifications);
    await notifier.send();

    rlog.info({
      stage: "done",
      pagesFetched: m.pagesFetched,
      entriesProcessed: m.entriesProcessed,
      entriesCreated: m.entriesCreated,
      entriesUpdated: m.entriesUpdated,
      eventsEmitted: m.eventsEmitted,
      durationMs: Date.now() - start
    }, "Job finished");
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    rlog.error({
      stage: "fatal",
      err,
      stack: err.stack
    }, "Job crashed");
  }
}

async function extractNewEntries(
  baseUrl: string,
  lastUpdate: Date,
  rlog: pino.Logger,
  CPVS: string[],
  m: { pagesFetched: number },
  atomFetcher: AtomFetcher,
) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "_",
    trimValues: true,
    parseTagValue: false,
    //parseAttributeValue: true,
  });

  let next: string | undefined = baseUrl;
  let newLastExtracted = null;
  let newEntries: ParsedEntry[] = [];
  let deletedEntries: ParsedDeletedEntry[] = [];
  while (next) {
    const pageLog = rlog.child({ pageUrl: next });
    pageLog.debug("Fetching page");

    try {
      const data = await atomFetcher.fetch(next);

      let root: AtomRootRaw = parser.parse(data);

      function truncateToSeconds(date: Date): Date {
        return new Date(Math.floor(date.getTime() / 1000) * 1000);
      }
      const pageUpdated = truncateToSeconds(new Date(root.feed.updated));
      const cursorTime = truncateToSeconds(lastUpdate);

      if (pageUpdated <= cursorTime) {
        pageLog.info({ pageUpdated, cursorTime }, "Stop: page is older than last cursor");
        break;
      }

      const newDeletedEntries = parseDeletedEntries(root);
      deletedEntries = deletedEntries.concat(newDeletedEntries);

      const entries = parseEntries(root)
      const filtered = entries.filter(el => el.cpvs?.some(entryCPV =>
        CPVS.some(validCPV => entryCPV.toString().startsWith(validCPV))
      ));
      newEntries = newEntries.concat(filtered);

      if (!newLastExtracted) {
        newLastExtracted = pageUpdated;
      }

      next = root.feed.link.find(el => el.rel === 'next')?.href;
      if (!next) pageLog.debug("No next page");

      m.pagesFetched++;
      pageLog.info({
        pageUpdated,
        entriesTotal: entries.length,
        entriesKept: filtered.length,
        deletedEntries: newDeletedEntries.length
      }, "Page parsed");
    } catch (e) {
      pageLog.error({ err: e }, "Error procesando página, se detiene el bucle");
      break;
    }
  }

  return { newLastExtracted, newEntries, deletedEntries };
}

