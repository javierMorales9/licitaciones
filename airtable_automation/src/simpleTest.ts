import { XMLParser } from "fast-xml-parser";
import util from "util";
import Airtable from "airtable";
import type { AirtableBase } from "airtable/lib/airtable_base.js";
import {
  parseEntries,
  parseDeletedEntries,
} from "./feedParser.js";

import type { AtomRootRaw, } from "./feedParser.js";

const BASE_FEED_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';
const CPVS = ["9132", "9134"];
const AIRTABLE_API_KEY = "patPa3vrKFZzCjmEZ.09f5ce7555aad195f2e2973d59d917ea21da75ca4024b0be5ce0527416b3c7c2";
const AIRTABLE_BASE_ID = "appHCHKp389SLrdkg";

/*
fetch(
  'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom', {
  //'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3_20250818_175602_3.atom', {
  method: 'GET',
})
  .then(res => res.text()).then(async data => {
    console.log("Parsing XML...");
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      trimValues: true,
      textNodeName: "_",
    });
    let root: AtomRootRaw = parser.parse(data);

    if (!process.argv[2]) {
      return;
    }

    const entryIndex = parseInt(process.argv[2]);
    console.log('entries', util.inspect(root.feed.entry[entryIndex], { depth: null, colors: true }));

    console.log("Parsing entries...");
    const entries = parseEntries(root);
    const { ...rest } = entries[entryIndex];
    console.log('entries', util.inspect(rest, { depth: null, colors: true }));

    const deletedEntries = parseDeletedEntries(root);
    console.log(deletedEntries);
    console.log('next', root.feed.link.find(el => el.rel === 'next')?.href);

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
      AIRTABLE_BASE_ID,
    );

    try {
      if (!entries[entryIndex])
        return;

      const id = 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17328740';
      const records = await base("Licitaciones").select({
        filterByFormula: `{Id} = "${id}"`,
        maxRecords: 1,
      }).all();
      console.log('records', records[0]?.fields);

      const { entry_id, updated, cpvs, party, lots, documents, ...rest } = entries[entryIndex];
      await base("Licitaciones").create([
        {
          fields: {
            Id: entries[entryIndex]?.entry_id,
            updated: updated.toDateString(),
            cpvs: cpvs?.join(','),
            ...rest,
          },
        },
      ]);
    } catch (e) {
      console.error(e);
    }
  })
*/
