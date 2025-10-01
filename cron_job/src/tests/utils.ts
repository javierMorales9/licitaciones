import { TestCursorRepository } from "./infra/TestCursorRepository.js";
import { TestDocRepository } from "./infra/TestDocRepository.js";
import { TestEventRepository } from "./infra/TestEventRepository.js";
import { TestLicitationRepository } from "./infra/TestLicitationRepository.js";
import { TestLotsRepository } from "./infra/TestLotsRepository.js";
import { TestPartyRepository } from "./infra/TestPartyRepository.js";
import { start } from "../cronJob.js";
import { test } from "@jest/globals"
import { TestAtomFetcher } from "./infra/TestAtomFetcher.js";
import fs from "fs";
import { Licitation } from "./../domain/Licitation.js";
import { Party } from "../domain/Party.js";
import { Lot } from "../domain/Lot.js";
import { Doc } from "../domain/Doc.js";
import {
  compareEvents,
  compareLicitation,
  compareLots,
  compareParty,
  compareDocs,
} from "./compareFunctions.js";
import { Event } from "../domain/Event.js";
import { testLogger } from "./testLogger.js";

const BASE_FEED_URL = 'https://test-feed.org';
export function testNewLicitation(
  name: string,
  version: string,
  expectedLicitation: Licitation | null,
  expectedLots: Lot[],
  expectedParty: Party | null,
  expectedEvents: Event[],
  LAST_CURSOR_DATE: Date,
  CPVS: string[],
  expectedDocs?: Doc[],
) {
  test(name, async () => {
    const cursorRepo = new TestCursorRepository(LAST_CURSOR_DATE);
    const licitationsRepo = new TestLicitationRepository(null);
    const lotsRepo = new TestLotsRepository([]);
    const partyRepo = new TestPartyRepository(null);
    const docRepo = new TestDocRepository([]);
    const eventRepo = new TestEventRepository();
    const atomFetcher = new TestAtomFetcher(fs.readFileSync(version).toString());

    await start(
      BASE_FEED_URL,
      CPVS,
      cursorRepo,
      licitationsRepo,
      lotsRepo,
      partyRepo,
      docRepo,
      eventRepo,
      atomFetcher,
      testLogger,
    );

    compareLicitation(licitationsRepo.getCreateArgs(), expectedLicitation);
    compareLots(lotsRepo.getCreateArgs(), expectedLots);
    compareParty(partyRepo.getCreateArgs(), expectedParty);
    compareEvents(eventRepo.getAddArgs(), expectedEvents);
    if (expectedDocs)
      compareDocs(docRepo.getCreateArgs(), expectedDocs);
  });
}

export function testLicitationUpdate(
  name: string,
  version: string,
  prevLicitation: Licitation | null,
  prevLots: Lot[],
  prevParty: Party | null,
  expectedLicitation: Licitation | null,
  expectedLots: Lot[],
  expectedParty: Party | null,
  expectedEvents: Event[],
  LAST_CURSOR_DATE: Date,
  CPVS: string[],
  prevDocs?: Doc[],
  expectedCreatedDocs?: Doc[],
  expectedUpdatedDocs?: Doc[],
) {
  test(name, async () => {
    const cursorRepo = new TestCursorRepository(LAST_CURSOR_DATE);
    const licitationsRepo = new TestLicitationRepository(prevLicitation);
    const lotsRepo = new TestLotsRepository(prevLots);
    const partyRepo = new TestPartyRepository(prevParty);
    const docRepo = new TestDocRepository(prevDocs ?? []);
    const eventRepo = new TestEventRepository();
    const atomFetcher = new TestAtomFetcher(fs.readFileSync(version).toString());

    await start(
      BASE_FEED_URL,
      CPVS,
      cursorRepo,
      licitationsRepo,
      lotsRepo,
      partyRepo,
      docRepo,
      eventRepo,
      atomFetcher,
      testLogger,
    );

    compareLicitation(licitationsRepo.getSaveArgs(), expectedLicitation);
    compareLots(lotsRepo.getSaveArgs(), expectedLots);
    compareParty(partyRepo.getSaveArgs(), expectedParty);
    compareEvents(eventRepo.getAddArgs(), expectedEvents);
    if (expectedCreatedDocs)
      compareDocs(docRepo.getCreateArgs(), expectedCreatedDocs);
    if (expectedUpdatedDocs)
      compareDocs(docRepo.getSaveArgs(), expectedUpdatedDocs);
  });
}
