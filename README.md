# PCSP → Airtable Automation (ATOM feed watcher)

A small worker that **polls a PCSP ATOM feed**, **filters tenders by CPV prefixes**, **upserts the resulting data into Airtable**, and **emits lifecycle events** that can be forwarded to Make.com and/or email.

> This repository focuses on **incremental monitoring** (not scraping): it follows the official syndication feed, uses a cursor to avoid reprocessing, and only processes entries newer than the last run.

## What this repo does

- Fetches the ATOM feed starting from `BASE_FEED_URL` and follows pagination (`rel="next"`).
- Stops scanning when the feed page is older than the persisted **cursor** timestamp.
- Parses:
  - `<entry>` items (tenders / “expedientes”)
  - `<at:deleted-entry>` tombstones (deletions/withdrawals/archivals depending on the feed)
- Filters by CPV **prefix match**:
  - keep an entry if any entry CPV starts with any configured prefix in `CPVS`.
- Upserts domain entities into Airtable via repository implementations:
  - Licitations, Lots, Docs, Parties, Events (exact mapping depends on your Airtable base).
- Emits domain events (created, submission period finished, awarded, resolved, lot awarded).
- Sends notifications using the configured `Notifier` (e.g., Make webhook, email).

## How the PCSP ATOM feed works (high-level)

PCSP exposes tender publications as an **ATOM feed**:

- A `<feed>` document contains general metadata plus **one or more `<entry>` items**.
- Each `<entry>` represents a tender record and is identified by a stable `<id>` URI.
- The same `<id>` can be republished as the tender evolves. The newest version should be chosen by comparing `entry/updated`.
- Feeds are paginated using links like:
  - `<link rel="next" href="...">`
  - and optionally `prev/first/last`.
- Tombstones can appear as `<at:deleted-entry>`:
  - `ref` points to the deleted entry id
  - `when` indicates the deletion time

Inside each `<entry>`, you typically get:
- `<id>`, `<title>`, `<summary>`, `<updated>`
- `<link>` to the tender detail page
- A **CODICE XML block** that contains structured data (authority, lots, CPVs, dates, documents, etc.)

```xml
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:at="http://purl.org/atompub/tombstones/1.0">
  <id>...</id>
  <title>...</title>
  <updated>2025-12-26T10:15:30Z</updated>

  <!-- Pagination -->
  <link rel="self" href="..."/>
  <link rel="next" href="..."/>

  <!-- A tender publication -->
  <entry>
    <id>urn:...:expediente:...</id>
    <title>...</title>
    <summary>...</summary>
    <updated>2025-12-26T09:58:12Z</updated>
    <link rel="alternate" href="https://contrataciondelsectorpublico.gob.es/..."/>

    <!-- Structured payload (CODICE) lives here; exact shape varies -->
    <content type="application/xml">
      <!-- CODICE XML -->
    </content>
  </entry>

  <!-- Tombstone (deleted/withdrawn/archived) -->
  <at:deleted-entry ref="urn:...:expediente:..." when="2025-12-26T08:00:00Z" />
</feed>
```

## Cron job runner

This repository includes a `cron_job/` folder that packages the ingestion as a **scheduled job**.

Typical responsibilities of the cron runner:

- Execute the worker on a schedule (every X minutes).
- Provide a production-friendly entrypoint (e.g., a wrapper script, container entrypoint, or system service config).
- Ensure environment variables are loaded (Airtable credentials, feed URL, CPVs, etc.).
- Centralize logging (stdout/stderr) so it can be collected by your runtime (systemd, Docker logs, Cloud logging, etc.).

## Requirements

- Node.js **18+** (Node 20+ recommended)
- An Airtable base with the required tables/fields
- An Airtable Personal Access Token (PAT) with access to that base

## Configuration

Create a local `.env` file (never commit secrets):

```dotenv
NODE_ENV=development

# PCSP syndication feed (ATOM)
BASE_FEED_URL=https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom

# Comma-separated CPV prefixes (examples)
CPVS=09100000,09120000

# Airtable
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Optional: Make.com webhook + API key (if your Notifier uses it)
MAKE_WEBHOOK=https://hook.eu2.make.com/XXXXXXXXXXXX
MAKE_API_KEY=XXXXXXXX
```

### CPV filtering rules

- `CPVS` is treated as a list of **prefixes**.
- An entry is kept if **any** entry CPV starts with **any** configured prefix.
  - Example: `CPVS=09100000` will match `09100000`, `09123000`, `09132100`, etc.

## Install

```bash
npm install
```

## Run (dev)

```bash
npm run dev
```

## Build & run (prod)

```bash
npm run build
npm start
```

## Tests

Unit tests live under `tests/`.

Run them with:

```bash
npm run test
```

## License

ISC (see `package.json`).
