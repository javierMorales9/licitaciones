import { XMLParser } from "fast-xml-parser";
import Airtable from "airtable";
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
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { exit } from "process";
import { Licitation } from "./domain/Licitation.js";
import { Doc } from "./domain/Doc.js";
import { Lot } from "./domain/Lot.js";
import { Party } from "./domain/Party.js";
import { Event, EventType } from "./domain/Event.js";
import { CursorRepository } from "./infra/CursorRepository.js";
import { LicitationRepository } from "./infra/LicitationRepository.js";
import { LotsRepository } from "./infra/LotsRepository.js";
import { PartyRepository } from "./infra/PartyRepository.js";
import { DocRepository } from "./infra/DocRepository.js";
import { EventRepository } from "./infra/EventRepository.js";
import { Notifier } from "./infra/Notifier.js";
import { Notifications } from "./domain/Notifications.js";

const IS_PROD = process.env.NODE_ENV === "production";

if (!IS_PROD) {
  dotenv.config();
}

if (!process.env.BASE_FEED_URL) {
  throw new Error("BASE FEED URL env var not present");
}

if (!process.env.CPVS) {
  throw new Error("CPVs env var not present");
}

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error("Airtable api key env var not present");
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error("Airtable base Id env var not present");
}

const BASE_FEED_URL = process.env.BASE_FEED_URL;
const CPVS = process.env.CPVS.split(",");
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export const logger = pino(
  IS_PROD
    ? { level: process.env.LOG_LEVEL || "info" }
    : {
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l o",
          ignore: "pid,hostname",
        },
      },
    }
);

async function start(baseUrl: string) {
  const runId = randomUUID();
  const start = Date.now();
  const rlog = logger.child({ runId, baseUrl });

  // métricas del run
  const m = {
    pagesFetched: 0,
    entriesProcessed: 0,
    entriesCreated: 0,
    entriesUpdated: 0,
    eventsEmitted: 0
  };

  const notifications = new Notifications();

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
    AIRTABLE_BASE_ID,
  );

  const cursorRepo = new CursorRepository(base);
  const licitationsRepo = new LicitationRepository(base);
  const lotsRepo = new LotsRepository(base);
  const partyRepo = new PartyRepository(base);
  const docRepo = new DocRepository(base);
  const eventRepo = new EventRepository(base);

  try {
    const lastUpdate = await cursorRepo.getLastCursor();
    if (!lastUpdate) {
      rlog.error({ stage: "init" }, "No previous cursor");
      return;
    }
    rlog.info({ stage: "init", lastUpdate }, "Job start");

    const { newEntries, newLastExtracted } = await extractNewEntries(baseUrl, lastUpdate, rlog, m);
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

          if (lic.updated >= entry.updated) {
            elog.debug({ licUpdated: lic.updated }, "Skip: stale entry");
            continue;
          }

          const prevStatus = lic.statusCode;
          const prevAdjLots = lic.lotsAdj;

          const docs = await docRepo.get(lic.id);
          const lots = await lotsRepo.getByLicitation(lic.id);

          const newDocs: Doc[] = [];
          const newLots: Lot[] = [];

          if (lic.statusCode === "PUB" && entry.statusCode === "EV") {
            const event = new Event({
              type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
              createdAt: new Date(),
              licitationId: lic.id,
            });
            events.push(event);
            notifications.add(event, lic);
          }
          else if (lic.statusCode !== "RES" && entry.statusCode === "RES") {
            const event = new Event({
              type: EventType.LICITATION_RESOLVED,
              createdAt: new Date(),
              licitationId: lic.id,
            });
            events.push(event);
            notifications.add(event, lic);
          }

          lic.update(entry);

          for (const parsedLot of entry.lots) {
            const lot = lots.find(el => el.lot_id === parsedLot.lot_id);

            if (!lot) {
              newLots.push(Lot.fromParsed(parsedLot, lic.id));
            } else {
              if (lot.winning_nif === undefined && parsedLot.winning_nif !== undefined) {
                const event = new Event({
                  createdAt: new Date(),
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
            const doc = docs.find(el => el.name === parsedDoc.name);
            if (!doc) {
              newDocs.push(Doc.fromParsed(parsedDoc, lic.id));
            } else {
              doc.update(parsedDoc);
            }
          }

          const lotsAmount = lots.length && newLots.length;
          if (prevAdjLots < lotsAmount && lic.lotsAdj === lotsAmount) {
            const event = new Event({
              createdAt: new Date(),
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

          await lotsRepo.create(entry.lots.map(el => Lot.fromParsed(el, licId)));
          await docRepo.create(entry.documents.map(el => Doc.fromParsed(el, licId)));

          const event = new Event({
            createdAt: new Date(),
            type: EventType.LICITATION_CREATED,
            licitationId: licId
          });
          events.push(event);
          notifications.add(event, lic);

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

    const notifier = new Notifier(notifications);
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
  m: { pagesFetched: number },
) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
    textNodeName: "_",
  });

  let next: string | undefined = baseUrl;
  let newLastExtracted = null;
  let newEntries: ParsedEntry[] = [];
  let deletedEntries: ParsedDeletedEntry[] = [];
  while (next) {
    const pageLog = rlog.child({ pageUrl: next });
    pageLog.debug("Fetching page");

    try {
      const res = await fetch(next, {
        method: 'GET',
      });
      const data = await res.text();

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

start(BASE_FEED_URL).then(() => exit(0));
