import Airtable from "airtable";
import pino from "pino";
import dotenv from "dotenv";
import { exit } from "process";
import { AirtableCursorRepository } from "./infra/AirtableCursorRepository.js";
import { AirtableLicitationRepository } from "./infra/AirtableLicitationRepository.js";
import { AirtableLotsRepository } from "./infra/AirtableLotsRepository.js";
import { AirtablePartyRepository } from "./infra/AirtablePartyRepository.js";
import { AirtableDocRepository } from "./infra/AirtableDocRepository.js";
import { AirtableEventRepository } from "./infra/AirtableEventRepository.js";
import { start } from "./cronJob.js";
import { ProdAtomFetcher } from "./infra/ProdAtomFetcher.js";

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

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
  AIRTABLE_BASE_ID,
);

const cursorRepo = new AirtableCursorRepository(base);
const licitationsRepo = new AirtableLicitationRepository(base);
const lotsRepo = new AirtableLotsRepository(base);
const partyRepo = new AirtablePartyRepository(base);
const docRepo = new AirtableDocRepository(base);
const eventRepo = new AirtableEventRepository(base);
const atomFetcher = new ProdAtomFetcher();

start(
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
).then(() => exit(0));
