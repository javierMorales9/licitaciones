import { XMLParser } from "fast-xml-parser";
import util from "util";
import {
  parseEntries,
  parseDeletedEntries,
} from "./feedParser.js";

import type { AtomRootRaw, } from "./feedParser.js";

const BASE_FEED_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';
const CPVS = ["9132", "9134"];
const AIRTABLE_API_KEY = "";
const AIRTABLE_BASE_ID = "";

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
  })
