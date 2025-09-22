import { TestCursorRepository } from "./infra/TestCursorRepository.js";
import { TestDocRepository } from "./infra/TestDocRepository.js";
import { TestEventRepository } from "./infra/TestEventRepository.js";
import { TestLicitationRepository } from "./infra/TestLicitationRepository.js";
import { TestLotsRepository } from "./infra/TestLotsRepository.js";
import { TestPartyRepository } from "./infra/TestPartyRepository.js";
import { start } from "../cronJob.js";
import { pino } from "pino";
import { describe, test, expect } from "@jest/globals"
import { TestAtomFetcher } from "./infra/TestAtomFetcher.js";
import fs from "fs";

const logger = pino(
  {
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

describe('Creation test', () => {
  test('Ret', async () => {
    const BASE_FEED_URL = "https://www.test_feed.com";
    const CPVS = ["34410000", "66114000", "34114100"];
    const cursorRepo = new TestCursorRepository(new Date('2025-08-17'));
    const licitationsRepo = new TestLicitationRepository(null);
    const lotsRepo = new TestLotsRepository([]);
    const partyRepo = new TestPartyRepository(null);
    const docRepo = new TestDocRepository([]);
    const eventRepo = new TestEventRepository();
    const atomFetcher = new TestAtomFetcher(fs.readFileSync("src/tests/first.atom").toString());

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
      logger,
    );

    console.log(partyRepo.getCreateCall());
    expect(partyRepo.getCreateCall()?.zip).toEqual("46701");
  });
});
