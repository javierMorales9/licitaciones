export type XmlText = string | number | boolean | { _: string | number | boolean };

export type MaybeArray<T> = T | T[] | undefined | null;

export interface AtomLink {
  rel: string;
  href: string;
}

export interface AtomEntryRaw {
  id: XmlText;
  updated: XmlText;
  title: XmlText;
  summary: XmlText | { _: string };
  link: AtomLink | AtomLink[];
  ['cac-place-ext:ContractFolderStatus']?: ContractFolderStatusRaw;

  // Permitir ruido adicional del feed
  [k: string]: unknown;
}

interface DeletedEntryRaw {
  ref?: string;
  when?: string;        // ISO
  by?: string;          // opcional en algunos feeds
  ['at:comment']?: { type?: string } | string;
  [k: string]: unknown;
}

export interface AtomFeedRaw {
  link: AtomLink[];
  updated: string;
  entry: AtomEntryRaw;
  ['at:deleted-entry']?: MaybeArray<DeletedEntryRaw>;
  [k: string]: unknown;
}

export interface AtomRootRaw {
  feed: AtomFeedRaw;
  entry?: MaybeArray<AtomEntryRaw>;
  [k: string]: unknown;
}

// ----- CFS (ContractFolderStatus) -----
export interface ContractFolderStatusRaw {
  ['cbc-place-ext:ContractFolderStatusCode']?: { _?: string };
  ['cac:ProcurementProject']?: ProcurementProjectRaw;
  ['cac:ProcurementProjectLot']?: MaybeArray<ProcurementProjectLotRaw>;
  ['cac:TenderResult']?: MaybeArray<TenderResultRaw>;
  ['cac:TenderingProcess']?: TenderingProcessRaw;
  ['cac:DocumentAvailabilityPeriod']?: {
    ['cbc:EndDate']?: string;
    ['cbc:EndTime']?: string;
    [k: string]: unknown;
  };

  // Documentos
  ['cac:LegalDocumentReference']?: AnyDocRefRaw;
  ['cac:TechnicalDocumentReference']?: AnyDocRefRaw;
  ['cac:AdditionalDocumentReference']?: MaybeArray<AnyDocRefRaw>;
  ['cac-place-ext:GeneralDocument']?: MaybeArray<{
    ['cac-place-ext:GeneralDocumentDocumentReference']?: AnyDocRefRaw;
    [k: string]: unknown;
  }>;

  // Anuncios/publicaciones
  ['cac-place-ext:ValidNoticeInfo']?: MaybeArray<ValidNoticeInfoRaw>;

  // Parte/órgano
  ['cac-place-ext:LocatedContractingParty']?: LocatedContractingPartyRaw;

  [k: string]: unknown;
}

export interface ProcurementProjectRaw {
  ['cbc:TypeCode']?: { _?: string };
  ['cbc:SubTypeCode']?: { _?: string };
  ['cac:BudgetAmount']?: {
    ['cbc:EstimatedOverallContractAmount']?: { _?: string | number };
    ['cbc:TotalAmount']?: { _?: string | number };
    ['cbc:TaxExclusiveAmount']?: { _?: string | number };
    [k: string]: unknown;
  };
  ['cac:RequiredCommodityClassification']?: MaybeArray<{
    ['cbc:ItemClassificationCode']?: { _?: string };
    [k: string]: unknown;
  }>;
  ['cac:RealizedLocation']?: {
    ['cbc:CountrySubentity']?: string;
    ['cac:Address']?: {
      ['cbc:CityName']?: string;
      ['cbc:PostalZone']?: string | number;
      ['cac:Country']?: { ['cbc:IdentificationCode']?: { _?: string } };
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  ['cac:PlannedPeriod']?: {
    ['cbc:DurationMeasure']?: { _?: string | number; unitCode?: string };
    [k: string]: unknown;
  };
  ['cbc:Name']?: string;
  [k: string]: unknown;
}

export interface ProcurementProjectLotRaw {
  ['cbc:ID']?: { _?: string }; // ID_LOTE
  ['cac:ProcurementProject']?: ProcurementProjectRaw;
  [k: string]: unknown;
}

export interface TenderResultRaw {
  ['cbc:ResultCode']?: { _?: string };
  ['cbc:AwardDate']?: string;
  ['cbc:ReceivedTenderQuantity']?: string | number;
  ['cbc:LowerTenderAmount']?: { _?: string | number };
  ['cbc:HigherTenderAmount']?: { _?: string | number };
  ['cac:WinningParty']?: {
    ['cac:PartyIdentification']?: { ['cbc:ID']?: { _?: string | number } };
    ['cac:PartyName']?: { ['cbc:Name']?: string };
    ['cac:PhysicalLocation']?: {
      ['cac:Address']?: {
        ['cbc:CityName']?: string;
        ['cbc:PostalZone']?: string | number;
        ['cac:Country']?: { ['cbc:IdentificationCode']?: { _?: string } };
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  ['cac:AwardedTenderedProject']?: {
    ['cbc:ProcurementProjectLotID']?: string | number;
    ['cac:LegalMonetaryTotal']?: {
      ['cbc:TaxExclusiveAmount']?: { _?: string | number };
      ['cbc:PayableAmount']?: { _?: string | number };
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface TenderingProcessRaw {
  ['cbc:ProcedureCode']?: { _?: string };
  ['cbc:UrgencyCode']?: { _?: string };
  ['cbc:PartPresentationCode']?: { _?: string };
  ['cbc:ContractingSystemCode']?: { _?: string };
  ['cbc:SubmissionMethodCode']?: { _?: string };
  ['cbc:OverThresholdIndicator']?: boolean | string;
  ['cac:TenderSubmissionDeadlinePeriod']?: {
    ['cbc:EndDate']?: string;
    ['cbc:EndTime']?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

// Document refs
export interface AnyDocRefRaw {
  ['cbc:ID']?: string;
  ['cbc:DocumentTypeCode']?: { _?: string; name?: string } | string;
  ['cac:Attachment']?: {
    ['cac:ExternalReference']?: {
      ['cbc:URI']?: string;
      ['cbc:FileName']?: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

// Notices
export interface ValidNoticeInfoRaw {
  ['cbc-place-ext:NoticeTypeCode']?: { _?: string };
  ['cac-place-ext:AdditionalPublicationStatus']?: {
    ['cac-place-ext:AdditionalPublicationRequest']?: {
      ['cbc:AgencyID']?: string;
      ['cbc-place-ext:SendDate']?: string;
      ['cbc-place-ext:SendTime']?: string;
      [k: string]: unknown;
    };
    ['cac-place-ext:AdditionalPublicationDocumentReference']?: MaybeArray<AnyDocRefRaw & {
      ['cbc:IssueDate']?: string;
    }>;
    ['cbc-place-ext:PublicationMediaName']?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

// Party / órgano
export interface LocatedContractingPartyRaw {
  ['cbc:BuyerProfileURIID']?: string;
  ['cac:Party']: {
    ['cac:PartyIdentification']?: MaybeArray<{
      ['cbc:ID']?: { _?: string; schemeName?: string } | string;
      [k: string]: unknown;
    }>;
    ['cbc:WebsiteURI']?: string;
    ['cac:PartyName']?: { ['cbc:Name']?: string };
    ['cac:PostalAddress']?: {
      ['cac:AddressLine']?: { ['cbc:Line']?: string };
      ['cbc:PostalZone']?: string | number;
      ['cbc:CityName']?: string;
      ['cac:Country']?: { ['cbc:IdentificationCode']?: { _?: string };['cbc:Name']?: string };
      [k: string]: unknown;
    };
    ['cac:Contact']?: {
      ['cbc:Telephone']?: string | number;
      ['cbc:ElectronicMail']?: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}


// ====== 2) Tipos "PARSED" (salida final) ======

export interface ParsedParty {
  nif: string;
  updated: Date;
  profile_url?: string | undefined;
  website?: string | undefined;
  dir3?: string | undefined;
  name?: string | undefined;
  address?: string | undefined;
  zip?: string | undefined;
  city?: string | undefined;
  countryCode?: string | undefined;
  country?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
}

export interface ParsedTenderResult {
  tender_result_code?: number | undefined;
  lot_id?: string | number | undefined;
  award_date?: string | undefined;
  received_tender_quantity?: string | number | undefined;
  lower_tender_amount?: string | number | undefined;
  higher_tender_amount?: string | number | undefined;
  winning_nif?: string | undefined;
  winning_name?: string | undefined;
  winning_city?: string | undefined;
  winning_zip?: string | undefined;
  winning_country?: string | undefined;
  award_tax_exclusive?: string | number | undefined;
  award_payable_amount?: string | number | undefined;
}

export interface ParsedLot extends ParsedTenderResult {
  lot_id: string | number;
  ext_id: string;
  name?: string;
  cost_with_taxes?: string | number;
  cost_without_taxes?: string | number;
  cpvs?: string[];
  place?: string;
  city?: string;
  zip?: string;
  country?: string;
}

export interface ParsedDocRef {
  name: string;
  url: string;
  type: 'legal' | 'technical' | 'additional' | 'general';
}

export interface ParsedNoticeRef {
  issue_date?: string;
  document_type?: string;
  document_name?: string;
  file_url?: string;
  file_name?: string;
}

export interface ParsedNotice {
  code?: string; // p.ej. 'DOC_CN' | 'DOC_PIN' | ...
  publication_media?: string;
  document_reference?: ParsedNoticeRef[];
  publication_request?: {
    agency_id?: string;
    sent_date?: string;
    sent_time?: string;
  };
}

export interface ParsedEntry {
  entry_id: string;
  statusCode?: string;
  publishedDate?: string;
  updated: Date;
  title?: string;
  summary?: string;
  platform_url?: string;

  party: ParsedParty;

  // Procurement
  type_code?: number;
  subtype_code?: number;
  estimated_overall_cost?: string | number;
  cost_with_taxes?: string | number;
  cost_without_taxes?: string | number;
  cpvs?: string[];
  place?: string;
  realized_city?: string;
  realized_zip?: string;
  realized_country?: string;
  estimated_duration?: string;

  // Result
  tender_result_code?: number;
  award_date?: string;
  received_tender_quantity?: string | number;
  lower_tender_amount?: string | number;
  higher_tender_amount?: string | number;
  winning_nif?: string;
  winning_name?: string;
  winning_city?: string;
  winning_zip?: string;
  winning_country?: string;
  award_tax_exclusive?: string | number;
  award_payable_amount?: string | number;

  lots: ParsedLot[];
  lotsAdj: number;

  // TenderingProcess
  procedure_code?: number;
  urgency_code?: number;
  part_presentation_code?: number;
  contracting_system_code?: number;
  submission_method_code?: number;
  over_threshold_indicator?: boolean | string;

  // Limit dates
  end_availability_period?: string;
  end_availability_hour?: string;
  end_date?: string;
  end_hour?: string;

  // Document
  documents: ParsedDocRef[];
  notices?: ParsedNotice[];
}

export interface ParsedDeletedEntry {
  entryId: string;
  deletedAt: Date;
  reason?: string;
}

// ====== 3) Helpers tipados ======

const arr = <T>(v: MaybeArray<T>): T[] =>
  Array.isArray(v) ? v : v == null ? [] : [v];

const toArray = <T>(x: MaybeArray<T>): T[] =>
  Array.isArray(x) ? x : x ? [x] : [];

const text = (v: XmlText | undefined | null): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'object' && '_' in v) {
    const t = (v as any)['_'];
    return t == null ? undefined : String(t);
  }
  return String(v as any);
};

function toInt(v?: string | number | undefined): number | undefined {
  if (!v) return v as undefined;

  if (typeof v === "number")
    return v as number;

  return parseInt(v as string);
}

function toFloat(v?: string | number | undefined): number | undefined {
  if (!v) return v as undefined;

  if (typeof v === "number")
    return v as number;

  return parseFloat(v as string);
}

// ====== 4) Colecciones parciales del RAW ======

function collectParty(CFS: ContractFolderStatusRaw, updatedEntryDate: Date): ParsedParty | undefined {
  const contracting_party = CFS['cac-place-ext:LocatedContractingParty'];
  if (!contracting_party) return undefined;

  const profile_url = contracting_party['cbc:BuyerProfileURIID'];
  const party = contracting_party['cac:Party'];

  const partyIdentification = toArray(party['cac:PartyIdentification']);

  const website = party['cbc:WebsiteURI'];
  const dir3 = partyIdentification
    ?.find(el => (typeof el?.['cbc:ID'] === 'object' ? (el['cbc:ID'] as any).schemeName : (el?.['cbc:ID'] as any)?.schemeName) === 'DIR3')
    ?.['cbc:ID'] as any;
  const nif = partyIdentification
    ?.find(el => (typeof el?.['cbc:ID'] === 'object' ? (el['cbc:ID'] as any).schemeName : (el?.['cbc:ID'] as any)?.schemeName) === 'NIF')
    ?.['cbc:ID'] as any;

  const name = party['cac:PartyName']?.['cbc:Name'];
  const address = party['cac:PostalAddress']?.['cac:AddressLine']?.['cbc:Line'];
  const zip = String(party['cac:PostalAddress']?.['cbc:PostalZone'] ?? '');
  const city = party['cac:PostalAddress']?.['cbc:CityName'];
  const countryCode = party['cac:PostalAddress']?.['cac:Country']?.['cbc:IdentificationCode']?._;
  const country = party['cac:PostalAddress']?.['cac:Country']?.['cbc:Name'];
  const phone = String(party['cac:Contact']?.['cbc:Telephone'] ?? '');
  const email = party['cac:Contact']?.['cbc:ElectronicMail'];

  return {
    profile_url,
    updated: updatedEntryDate,
    website,
    dir3: typeof dir3 === 'object' ? (dir3?._ as string) : (dir3 as string),
    nif: typeof nif === 'object' ? (nif?._ as string) : (nif as string),
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

function collectProcurement(proc: ProcurementProjectRaw | undefined) {
  if (!proc) return {};
  const type_code = toInt(proc['cbc:TypeCode']?._);
  const subtype_code = toInt(proc['cbc:SubTypeCode']?._);

  const estimated_overall_cost = toFloat(proc['cac:BudgetAmount']?.['cbc:EstimatedOverallContractAmount']?._);
  const cost_with_taxes = toFloat(proc['cac:BudgetAmount']?.['cbc:TotalAmount']?._);
  const cost_without_taxes = toFloat(proc['cac:BudgetAmount']?.['cbc:TaxExclusiveAmount']?._);

  const cpvs = toArray(proc['cac:RequiredCommodityClassification'])
    .map(el => el?.['cbc:ItemClassificationCode']?._)
    .filter(Boolean) as string[];

  const rl = proc['cac:RealizedLocation'];
  const place = rl?.['cbc:CountrySubentity'];
  const realized_city = rl?.['cac:Address']?.['cbc:CityName'];
  const realized_zip = String(rl?.['cac:Address']?.['cbc:PostalZone'] ?? '');
  const realized_country = rl?.['cac:Address']?.['cac:Country']?.['cbc:IdentificationCode']?._;

  let estimated_duration: string | undefined;
  const dur = proc['cac:PlannedPeriod']?.['cbc:DurationMeasure'];
  if (dur) estimated_duration = `${dur._ ?? ''} ${dur.unitCode ?? ''}`.trim();

  const name = proc['cbc:Name']; // útil para lotes

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
    name,
  };
}

function processTenderResult(tr: TenderResultRaw | undefined): ParsedTenderResult {
  if (!tr) return {};
  const tender_result_code = toInt(tr['cbc:ResultCode']?._);
  const award_date = tr['cbc:AwardDate'];
  const received_tender_quantity = toInt(tr['cbc:ReceivedTenderQuantity']);
  const lower_tender_amount = toFloat(tr['cbc:LowerTenderAmount']?._);
  const higher_tender_amount = toFloat(tr['cbc:HigherTenderAmount']?._);

  const wp = tr['cac:WinningParty'];
  const winning_nif = wp?.['cac:PartyIdentification']?.['cbc:ID']?._ !== undefined ? String(wp?.['cac:PartyIdentification']?.['cbc:ID']?._) : undefined;
  const winning_name = wp?.['cac:PartyName']?.['cbc:Name'];

  const addr = wp?.['cac:PhysicalLocation']?.['cac:Address'];
  const winning_city = addr?.['cbc:CityName'];
  const winning_zip = addr?.['cbc:PostalZone'] ? String(addr?.['cbc:PostalZone']) : undefined;
  const winning_country = addr?.['cac:Country']?.['cbc:IdentificationCode']?._;

  const legal = tr['cac:AwardedTenderedProject']?.['cac:LegalMonetaryTotal'];
  const award_tax_exclusive = toFloat(legal?.['cbc:TaxExclusiveAmount']?._);
  const award_payable_amount = toFloat(legal?.['cbc:PayableAmount']?._);

  const lot_id = toInt(tr['cac:AwardedTenderedProject']?.['cbc:ProcurementProjectLotID']) ?? 0;

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

function pickDoc(ref: AnyDocRefRaw | undefined, docType: ParsedDocRef['type']): ParsedDocRef | null {
  if (!ref) return null;
  const id = (ref['cbc:ID'] as any) ?? (ref as any).ID;
  const url =
    ref?.['cac:Attachment']?.['cac:ExternalReference']?.['cbc:URI'] ??
    (ref as any)?.Attachment?.ExternalReference?.URI;
  if (!id || !url) return null;

  return { name: String(id), url: String(url), type: docType };
}

function collectDocs(CFS: ContractFolderStatusRaw): ParsedDocRef[] {
  const KEYS = ['cac:AdditionalDocumentReference'] as const;

  const legal_document = pickDoc(CFS['cac:LegalDocumentReference'], 'legal');
  const technical_document = pickDoc(CFS['cac:TechnicalDocumentReference'], 'technical');

  const fromBasicRefs = KEYS
    .flatMap(k => toArray(CFS?.[k]).map(el => pickDoc(el, 'additional')))
    .filter(Boolean) as ParsedDocRef[];

  const fromGeneral = toArray(CFS?.['cac-place-ext:GeneralDocument'])
    .map(g => pickDoc(g?.['cac-place-ext:GeneralDocumentDocumentReference'], 'general'))
    .filter(Boolean) as ParsedDocRef[];

  let all: ParsedDocRef[] = [];
  if (legal_document) all.push(legal_document);
  if (technical_document) all.push(technical_document);
  all = all.concat(fromBasicRefs, fromGeneral);

  const seen = new Set<string>();
  const documents: ParsedDocRef[] = [];
  for (const d of all) {
    const key = `${d.name}||${d.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      documents.push(d);
    }
  }
  return documents;
}

function collectNotices(CFS: ContractFolderStatusRaw): ParsedNotice[] {
  const raw = CFS['cac-place-ext:ValidNoticeInfo'];
  if (!raw) return [];
  const notices = arr(raw);

  return notices.map(el => {
    const pubStatus = el['cac-place-ext:AdditionalPublicationStatus'];
    const pubReq = pubStatus?.['cac-place-ext:AdditionalPublicationRequest'];

    let rawDocRef = pubStatus?.['cac-place-ext:AdditionalPublicationDocumentReference'];
    let document_reference: ParsedNoticeRef[] | undefined;
    if (rawDocRef) {
      document_reference = arr(rawDocRef).map(ref => {
        const attachment = ref['cac:Attachment']?.['cac:ExternalReference'];
        const code = ref['cbc:DocumentTypeCode'];
        const codeStr = typeof code === 'string' ? code : code?._;
        return {
          issue_date: (ref as any)['cbc:IssueDate'],
          document_type: codeStr,
          document_name: (typeof code === 'object' && code?.name) ? code.name : undefined,
          file_url: attachment?.['cbc:URI'],
          file_name: attachment?.['cbc:FileName'],
        } as ParsedNoticeRef;
      });
    }

    return {
      code: el['cbc-place-ext:NoticeTypeCode']?._,
      publication_media: pubStatus?.['cbc-place-ext:PublicationMediaName'],
      document_reference,
      publication_request: pubReq && {
        agency_id: pubReq['cbc:AgencyID'],
        sent_date: pubReq['cbc-place-ext:SendDate'],
        sent_time: pubReq['cbc-place-ext:SendTime'],
      },
    } as ParsedNotice;
  });
}

export function parseEntries(root: AtomRootRaw): ParsedEntry[] {
  const feed = root.feed ?? (root as any);

  const entries = arr(feed.entry as MaybeArray<AtomEntryRaw>);
  const normalItems: ParsedEntry[] = entries.map((e) => {
    const id = text(e.id)!;
    const updated = new Date(String(text(e.updated)));
    const title = text(e.title);
    const summary = typeof e.summary === 'object' && e.summary && '_' in e.summary
      ? String((e.summary as any)._ ?? '')
      : (e.summary as any);
    const linkObj = Array.isArray(e.link) ? e.link[0] : e.link;
    const platform_url = linkObj ? text(linkObj.href as any) : undefined;

    const CFS = (e['cac-place-ext:ContractFolderStatus'] ?? {}) as ContractFolderStatusRaw;
    const statusCode = CFS['cbc-place-ext:ContractFolderStatusCode']?._;

    const party = collectParty(CFS, updated);

    const { name, ...procurementBlock } = collectProcurement(CFS['cac:ProcurementProject']);

    let projectLot = CFS['cac:ProcurementProjectLot'];
    let lots: ParsedLot[] | undefined = undefined;
    let tender_result: ParsedTenderResult = {};
    let lotsAdj = 0;

    if (projectLot) {
      const lotsRaw = arr(projectLot);

      let tender_result_raw = CFS['cac:TenderResult'];
      const tender_results = tender_result_raw ? arr(tender_result_raw).map(el => processTenderResult(el)) : [];

      lots = lotsRaw.map(lo => {
        const lot_id = toInt(lo['cbc:ID']?._) ?? 0;
        const procurement = lo['cac:ProcurementProject'];
        const budget = procurement?.['cac:BudgetAmount'];
        const realizedLocation = procurement?.['cac:RealizedLocation'];

        let commodities = procurement?.['cac:RequiredCommodityClassification'];
        const commoditiesArr = commodities ? arr(commodities) : [];

        let lotTenderResult = tender_results.find(el => String(el.lot_id) === String(lot_id));
        if (lotTenderResult) {
          // If tender code is 3 it means that the lot has been marked as desisted (not awarded).
          if (lotTenderResult.tender_result_code !== 3) lotsAdj += 1;
        } else {
          lotTenderResult = {};
        }

        const base = collectProcurement(procurement);

        return {
          lot_id,
          ext_id: `${lot_id}_${id}`,
          name: base.name,
          cost_with_taxes: toFloat(budget?.['cbc:TotalAmount']?._),
          cost_without_taxes: toFloat(budget?.['cbc:TaxExclusiveAmount']?._),
          cpvs: commoditiesArr.map(el => el?.['cbc:ItemClassificationCode']?._).filter(Boolean) as string[],
          place: realizedLocation?.['cbc:CountrySubentity'],
          city: realizedLocation?.['cac:Address']?.['cbc:CityName'],
          zip: realizedLocation?.['cac:Address']?.['cbc:PostalZone']?.toString(),
          country: realizedLocation?.['cac:Address']?.['cac:Country']?.['cbc:IdentificationCode']?._,
          ...lotTenderResult,
        } as ParsedLot;
      });
    } else {
      let tender_result_raw = CFS['cac:TenderResult'];
      if (tender_result_raw) {
        const first = Array.isArray(tender_result_raw) ? tender_result_raw[0] : tender_result_raw;
        tender_result = processTenderResult(first);

        if (tender_result.tender_result_code === 4) {
          tender_result = { tender_result_code: tender_result.tender_result_code };
        } else {
          lotsAdj = 1;
        }
      }

      lots = [
        {
          lot_id: 0,
          ext_id: `0_${id}`,
          ...collectProcurement(CFS['cac:ProcurementProject']),
          ...tender_result,
        } as ParsedLot,
      ];
    }

    const { lot_id, ...root_tender_result } = tender_result;

    const tendering_process = CFS['cac:TenderingProcess'] ?? {};
    const procedure_code = toInt(tendering_process['cbc:ProcedureCode']?._);
    const urgency_code = toInt(tendering_process['cbc:UrgencyCode']?._);
    const part_presentation_code = toInt(tendering_process['cbc:PartPresentationCode']?._);
    const contracting_system_code = toInt(tendering_process['cbc:ContractingSystemCode']?._);
    const submission_method_code = toInt(tendering_process['cbc:SubmissionMethodCode']?._);
    const over_threshold_indicator = !!tendering_process['cbc:OverThresholdIndicator'];

    const availability_period = CFS['cac:DocumentAvailabilityPeriod'];
    const end_availability_period = availability_period && availability_period['cbc:EndDate'];
    const end_availability_hour = availability_period && availability_period['cbc:EndTime'];

    const deadline_period = tendering_process['cac:TenderSubmissionDeadlinePeriod'];
    const end_date = deadline_period && deadline_period['cbc:EndDate'];
    const end_hour = deadline_period && deadline_period['cbc:EndTime'];

    const documents = collectDocs(CFS);
    const notices = collectNotices(CFS);

    let publishedDate: string[] | string | undefined = undefined;
    const by = (code: string) =>
      notices.find(n => n.code === code)?.document_reference?.map(el => el.issue_date).filter(Boolean) as string[] | undefined;

    publishedDate = by('DOC_CN') ?? by('DOC_PIN') ?? by('DOC_CAN_ADJ');

    if (publishedDate?.length) {
      publishedDate = [...publishedDate].sort((a, b) => +new Date(a) - +new Date(b))[0];
    } else {
      publishedDate = undefined;
    }

    return {
      entry_id: id,
      statusCode,
      publishedDate,
      updated,
      title,
      summary,
      platform_url,

      party,

      ...procurementBlock,
      ...root_tender_result,

      lots: lots ?? [],
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
      notices,
    } as ParsedEntry;
  });


  return normalItems;
}

export function parseDeletedEntries(root: AtomRootRaw): ParsedDeletedEntry[] {
  const feed = (root.feed ?? (root as any)) as AtomFeedRaw;
  const deleted = toArray(feed['at:deleted-entry']);

  return deleted
    .map((el): ParsedDeletedEntry | null => {
      const entryId = el?.ref ? String(el.ref) : '';
      if (!entryId) return null;

      const when = el?.when ? String(el.when) : '';
      const deletedAt = when ? new Date(when) : new Date(NaN);

      const comment = el?.['at:comment'];
      const reason =
        typeof comment === 'object' && comment
          ? (comment as any).type
          : undefined;

      return { entryId, deletedAt, reason };
    })
    .filter((x): x is ParsedDeletedEntry => Boolean(x));
}
