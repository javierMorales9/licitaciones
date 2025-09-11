const { XMLParser } = require("fast-xml-parser");
const fs = require("fs/promises");
const util = require("util");
const Airtable = require("airtable");

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
    let root = parser.parse(data);

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
      const id = 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17328740';
      const records = await base("Licitaciones").select({
        filterByFormula: `{Id} = "${id}"`,
        maxRecords: 1,
      }).all();
      console.log('records', records[0].fields);

      const { entry_id, updated, cpvs, party, lots, documents, ...rest } = entries[entryIndex];
      await base("Licitaciones").create([
        {
          fields: {
            Id: entries[entryIndex].entry_id,
            updated: updated.toDateString(),
            cpvs: cpvs.join(','),
            ...rest,
          },
        },
      ]);
    } catch (e) {
      console.error(e);
    }
  })
*/

class CursorRepository {
  constructor(base) {
    this.base = base;
  }

  async getLastCursor() {
    const records = await this.base("Cursor").select({
      sort: [{ field: 'Fecha Última Revisión', direction: "desc" }],
      maxRecords: 1,
    }).all();
    if (!records[0]?.fields) {
      return null;
    }

    return new Date(records[0].fields['Fecha Última Revisión']);
  }

  async updateCursor(newLastExtracted, entriesProcessed) {
    if (newLastExtracted) {
      await this.base("Cursor").create([
        {
          fields: {
            'Fecha Última Revisión': newLastExtracted,
            'Entradas procesadas': entriesProcessed,
          },
        },
      ]);
    }
  }
}

class LicitationRepository {
  constructor(base) {
    this.base = base;
  }

  async get(id) {
    const records = await this.base("Licitaciones").select({
      filterByFormula: `{Id} = "${id}"`,
      maxRecords: 1,
    }).all();

    if (!records[0]?.fields)
      return null

    return records[0].fields
  }

  async save(entry) {
    const { entry_id, updated, cpvs, party, lots, documents, lot_id, ...rest } = entry;
    await this.base("Licitaciones").create([
      {
        fields: {
          Id: entry_id,
          updated: updated,
          cpvs: cpvs.join(','),
          ...rest,
        },
      },
    ]);
  }
}

start(BASE_FEED_URL);

async function start(baseUrl) {
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
    AIRTABLE_BASE_ID,
  );

  const cursorRepo = new CursorRepository(base);
  const licitationsRepo = new LicitationRepository(base);

  try {
    const lastUpdate = await cursorRepo.getLastCursor();
    if (!lastUpdate) {
      throw new Error("No previous cursor");
    }

    const { newEntries, newLastExtracted } = await extractNewEntries(baseUrl, lastUpdate);

    for (entry of newEntries) {
      const lic = await licitationsRepo.get(entry.entry_id);
      if (lic) {
      } else {
        console.log(entry.updated, entry);
        await licitationsRepo.save(entry);
      }
    }

    //await cursorRepo.updateCursor(newLastExtracted, newEntries.length);
  } catch (e) {
    console.error(e);
  }
}

async function extractNewEntries(baseUrl, lastUpdate) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
    textNodeName: "_",
  });

  let next = baseUrl;
  let newLastExtracted = null;
  let newEntries = [];
  let deletedEntries = [];
  while (next) {
    console.log("Processing", next);
    const res = await fetch(next, {
      method: 'GET',
    });
    const data = await res.text();

    let root = parser.parse(data);

    if (new Date(root.feed.updated) <= lastUpdate) {
      break;
    }

    const newDeletedEntries = parseDeletedEntries(root);
    deletedEntries = deletedEntries.concat(newDeletedEntries);

    const entries = parseEntries(root)
    newEntries = newEntries.concat(
      entries.filter(el => el.cpvs.some(entryCPV =>
        CPVS.some(validCPV => entryCPV.toString().startsWith(validCPV))
      )),
    );

    if (!newLastExtracted) {
      newLastExtracted = new Date(root.feed.updated);
    }

    next = root.feed.link.find(el => el.rel === 'next')?.href;
  }

  return { newLastExtracted, newEntries, deletedEntries };
}

function parseEntries(root) {
  const feed = root.feed ?? root;

  // === 1) ENTRIES normales ===
  let entries = arr(feed.entry);
  const normalItems = entries.map((e) => {
    const id = text(e.id);
    const updated = new Date(e.updated);
    const title = text(e.title);
    const summary = text(e.summary._);
    const platform_url = text(e.link.href);

    const CFS = e["cac-place-ext:ContractFolderStatus"] ?? {};
    const statusCode = CFS["cbc-place-ext:ContractFolderStatusCode"]?._;

    const party = collectParty(CFS)

    const procurement = collectProcurement(CFS["cac:ProcurementProject"]);

    let projectLot = CFS["cac:ProcurementProjectLot"];
    let lots = undefined;
    let tender_result = {};
    let lotsAdj = 0;
    if (projectLot) {
      projectLot = Array.isArray(projectLot) ? projectLot : [projectLot];

      let tender_result_raw = CFS["cac:TenderResult"];
      tender_result_raw = !tender_result_raw
        ? tender_result_raw
        : Array.isArray(tender_result_raw)
          ? tender_result_raw
          : [tender_result_raw];
      let tender_results = [];
      if (tender_result_raw) {
        tender_results = tender_result_raw.map(el => processTenderResult(el));
      }

      lots = projectLot.map(lo => {
        const id = lo["cbc:ID"]._;
        const procurement = lo["cac:ProcurementProject"];
        const budget = procurement["cac:BudgetAmount"];
        const realizedLocation = procurement["cac:RealizedLocation"];

        let commodities = procurement["cac:RequiredCommodityClassification"];
        commodities = !commodities ? commodities : Array.isArray(commodities) ? commodities : [commodities];

        let lotTenderResult = tender_results.find(el => el.lot_id === id);
        if (lotTenderResult)
          lotsAdj += 1
        else
          lotTenderResult = {}

        return {
          id,
          name: procurement["cbc:Name"],
          cost_with_taxes: budget["cbc:TotalAmount"]?._,
          cost_without_taxes: budget["cbc:TaxExclusiveAmount"]?._,
          cpvs: commodities && commodities.map(el => el["cbc:ItemClassificationCode"]._),
          place: realizedLocation && realizedLocation["cbc:CountrySubentity"],
          city: realizedLocation && realizedLocation["cac:Address"]?.["cbc:CityName"],
          zip: realizedLocation && realizedLocation["cac:Address"]?.["cbc:PostalZone"],
          country: realizedLocation && realizedLocation["cac:Address"]?.["cac:Country"]["cbc:IdentificationCode"]?._,
          ...lotTenderResult
        };
      });
    } else {
      let tender_result_raw = CFS["cac:TenderResult"];

      if (tender_result_raw) {
        tender_result_raw = Array.isArray(tender_result_raw) ? tender_result_raw[0] : tender_result_raw;
        tender_result = processTenderResult(tender_result_raw);
        lotsAdj = 1;
      }

      lots = [
        {
          ...procurement,
          ...tender_result,
        },
      ];
    }

    const tendering_process = CFS["cac:TenderingProcess"]
    const procedure_code = tendering_process["cbc:ProcedureCode"]._;
    const urgency_code = tendering_process["cbc:UrgencyCode"]._;
    const part_presentation_code = tendering_process["cbc:PartPresentationCode"]?._;
    const contracting_system_code = tendering_process[
      "cbc:ContractingSystemCode"]?._;
    const submission_method_code = tendering_process["cbc:SubmissionMethodCode"]?._;
    const over_threshold_indicator = tendering_process[
      "cbc:OverThresholdIndicator"];

    const availability_period = tendering_process["cac:DocumentAvailabilityPeriod"]
    const end_availability_period = availability_period && availability_period["cbc:EndDate"]
    const end_availability_hour = availability_period && availability_period["cbc:EndTime"]

    const deadline_period = tendering_process["cac:TenderSubmissionDeadlinePeriod"]
    const end_date = deadline_period && deadline_period["cbc:EndDate"]
    const end_hour = deadline_period && deadline_period[
      "cbc:EndTime"];

    const documents = collectDocs(CFS);

    const notices = collectNotices(CFS);

    let publishedDate = undefined;
    publishedDate = notices.find(n => n.code === "DOC_CN")?.document_reference?.map(el => el.issue_date);
    if (!publishedDate)
      publishedDate = notices.find(n => n.code === "DOC_PIN")?.document_reference?.map(el => el.issue_date);
    if (!publishedDate)
      publishedDate = notices.find(n => n.code === "DOC_CAN_ADJ")?.document_reference?.map(el => el.issue_date);

    if (publishedDate)
      publishedDate = publishedDate.sort(function(a, b) {
        return new Date(a) - new Date(b);
      })[0]

    return {
      entry_id: id,
      statusCode,
      publishedDate,
      updated,
      title,
      summary,
      platform_url,
      party,
      ...procurement,
      ...tender_result,
      lots,
      lotsAdj,
      procedure_code,
      urgency_code,
      part_presentation_code,
      contracting_system_code,
      submission_method_code,
      over_threshold_indicator,
      end_availability_period,
      end_availability_hour,
      end_date,
      end_hour,
      documents,
    };
  });

  return normalItems;
}

const arr = (v) => (Array.isArray(v) ? v : (v == null ? [] : [v]));
const text = (v) => (v && typeof v === 'object' && '_' in v) ? v['_'] : v;
const toArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

function collectParty(CFS) {
  const contracting_party = CFS["cac-place-ext:LocatedContractingParty"]
  const profile_url = contracting_party["cbc:BuyerProfileURIID"]


  const party = contracting_party["cac:Party"]
  const partyIdentification = toArray(party["cac:PartyIdentification"]);

  const website = party["cbc:WebsiteURI"]
  const dir3 = partyIdentification?.find(el => el["cbc:ID"]["schemeName"] === "DIR3")?.["cbc:ID"]?._;
  const nif = partyIdentification?.find(el => el["cbc:ID"]["schemeName"] === "NIF")?.["cbc:ID"]?._;
  const name = party["cac:PartyName"]["cbc:Name"]
  const address = party["cac:PostalAddress"][
    "cac:AddressLine"]["cbc:Line"]
  const zip = party["cac:PostalAddress"]["cbc:PostalZone"]
  const city = party["cac:PostalAddress"][
    "cbc:CityName"]
  const countryCode = party["cac:PostalAddress"]["cac:Country"][
    "cbc:IdentificationCode"]._;
  const country = party["cac:PostalAddress"]["cac:Country"]["cbc:Name"]
  const phone = party["cac:Contact"][
    "cbc:Telephone"]
  const email = party[
    "cac:Contact"]["cbc:ElectronicMail"]

  return {
    profile_url,
    website,
    dir3,
    nif,
    name,
    address,
    zip,
    city,
    countryCode,
    country,
    phone,
    email,
  };
}

function collectProcurement(procurement) {
  const type_code = procurement["cbc:TypeCode"]._;
  const subtype_code = procurement["cbc:SubTypeCode"]?._;

  const estimated_overall_cost = procurement[
    "cac:BudgetAmount"]["cbc:EstimatedOverallContractAmount"]?._;
  const cost_with_taxes = procurement["cac:BudgetAmount"]["cbc:TotalAmount"]._;
  const cost_without_taxes = procurement["cac:BudgetAmount"]["cbc:TaxExclusiveAmount"]._;

  const commodities = procurement["cac:RequiredCommodityClassification"];
  const cpvs = toArray(commodities).map(el => el["cbc:ItemClassificationCode"]._);

  const realized_location = procurement["cac:RealizedLocation"]
  const place = realized_location && realized_location["cbc:CountrySubentity"];
  const realized_city = realized_location && realized_location["cac:Address"]?.["cbc:CityName"];
  const realized_zip = ((realized_location && realized_location["cac:Address"]?.["cbc:PostalZone"]) ?? "").toString();
  const realized_country = realized_location && realized_location["cac:Address"]?.["cac:Country"]["cbc:IdentificationCode"]?._;

  let estimated_duration;
  const planned_period = procurement["cac:PlannedPeriod"];
  if (planned_period) {
    const a = planned_period["cbc:DurationMeasure"];
    estimated_duration = a?._ + " " + a?.unitCode;
  }
  return {
    type_code,
    subtype_code,
    estimated_overall_cost,
    cost_with_taxes,
    cost_without_taxes,
    cpvs,
    place,
    realized_city,
    realized_zip,
    realized_country,
    estimated_duration,
  }
}

function processTenderResult(tender_result) {
  const tender_result_code = tender_result?.["cbc:ResultCode"]?._;
  const award_date = tender_result?.[
    "cbc:AwardDate"]
  const received_tender_quantity = tender_result?.["cbc:ReceivedTenderQuantity"];
  const lower_tender_amount = tender_result?.[
    "cbc:LowerTenderAmount"]?._;
  const higher_tender_amount = tender_result?.[
    "cbc:HigherTenderAmount"]?._;

  const winning_party = tender_result?.["cac:WinningParty"];
  const winning_nif = winning_party?.["cac:PartyIdentification"]?.["cbc:ID"]?._;
  const winning_name = winning_party?.["cac:PartyName"]["cbc:Name"];

  const winning_location = winning_party?.["cac:PhysicalLocation"]?.["cac:Address"];
  const winning_city = winning_location?.["cbc:CityName"]
  const winning_zip = (winning_location?.["cbc:PostalZone"] ?? "").toString();
  const winning_country = winning_location?.["cbc:Country"]?.["cbc:IdentificationCode"]?._;

  const award = tender_result?.["cac:AwardedTenderedProject"]?.["cac:LegalMonetaryTotal"]
  const award_tax_exclusive = award?.["cbc:TaxExclusiveAmount"]?._;
  const award_payable_amount = award?.["cbc:PayableAmount"]?._;

  const lot_id = tender_result?.["cac:AwardedTenderedProject"]?.["cbc:ProcurementProjectLotID"] ?? 0;

  return {
    tender_result_code,
    lot_id,
    award_date,
    received_tender_quantity,
    lower_tender_amount,
    higher_tender_amount,
    winning_nif,
    winning_name,
    winning_city,
    winning_zip,
    winning_country,
    award_tax_exclusive,
    award_payable_amount,
  };
}

const pickDoc = (ref, docType) => {
  if (!ref) return null;
  const id = ref["cbc:ID"] ?? ref.ID;
  const url = ref?.["cac:Attachment"]?.["cac:ExternalReference"]?.["cbc:URI"]
    ?? ref?.Attachment?.ExternalReference?.URI;
  if (!id || !url) return null;

  const typeCode = ref["cbc:DocumentTypeCode"] ?? ref.DocumentTypeCode ?? null;
  const typeVal =
    (typeof typeCode === "string") ? typeCode :
      (typeCode && typeCode._) ? typeCode._ :
        null;

  return { id, url, type: docType };
};

const collectDocs = (CFS) => {
  const KEYS = [
    "cac:AdditionalDocumentReference",
  ];

  // 1) Legales, técnicos y adicionales

  const legal_document = pickDoc(CFS["cac:LegalDocumentReference"], "legal");
  const technical_document = pickDoc(CFS["cac:TechnicalDocumentReference"], "technical");
  const fromBasicRefs = KEYS
    .flatMap(k => toArray(CFS?.[k]).map(el => pickDoc(el, "additional")))
    .filter(Boolean);

  // 2) GeneralDocument → dentro viene GeneralDocumentDocumentReference
  const fromGeneral = toArray(CFS?.["cac-place-ext:GeneralDocument"])
    .map(g => pickDoc(g?.["cac-place-ext:GeneralDocumentDocumentReference"], "general"))
    .filter(Boolean);

  // 3) Unir todo y deduplicar por id||url
  let all = [];
  if (legal_document)
    all.push(legal_document);

  if (technical_document)
    all.push(technical_document);

  all = all.concat(fromBasicRefs)
  all = all.concat(fromGeneral);

  const seen = new Set();
  const documents = [];
  for (const d of all) {
    const key = `${d.id}||${d.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      documents.push(d);
    }
  }

  return documents;
};

function collectNotices(CFS) {
  let notices = CFS["cac-place-ext:ValidNoticeInfo"];
  if (!notices)
    return [];

  notices = Array.isArray(notices) ? notices : [notices];

  return notices.map(el => {
    const publicationStatus = el["cac-place-ext:AdditionalPublicationStatus"];
    const publicationRequest = publicationStatus?.["cac-place-ext:AdditionalPublicationRequest"];

    let rawDocumentReference = publicationStatus?.["cac-place-ext:AdditionalPublicationDocumentReference"];
    let documentReference = undefined;
    if (rawDocumentReference) {
      rawDocumentReference = Array.isArray(rawDocumentReference)
        ? rawDocumentReference
        : [rawDocumentReference];
      documentReference = rawDocumentReference.map(ref => {
        const attachment = ref["cac:Attachment"]?.["cac:ExternalReference"];
        return {
          issue_date: ref["cbc:IssueDate"],
          document_type: ref["cbc:DocumentTypeCode"]?._,
          document_name: ref["cbc:DocumentTypeCode"]?.name,
          file_url: attachment?.["cbc:URI"],
          file_name: attachment?.["cbc:FileName"],
        };
      });
    }

    return {
      code: el["cbc-place-ext:NoticeTypeCode"]._,
      publication_media: publicationStatus["cbc-place-ext:PublicationMediaName"],
      document_reference: documentReference,
      publication_request: publicationRequest && {
        agency_id: publicationRequest["cbc:AgencyID"],
        sent_date: publicationRequest["cbc-place-ext:SendDate"],
        sent_time: publicationRequest["cbc-place-ext:SendTime"],
      },
    };
  });
}

function parseDeletedEntries(root) {
  const deletedEntries = toArray(root.feed['at:deleted-entry']);

  return deletedEntries.map(el => {
    return {
      entryId: el.ref,
      deletedAt: new Date(el.when),
      reason: el['at:comment']?.type,
    };
  });
}
