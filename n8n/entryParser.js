async function start() {
  const $http = this.helpers.httpRequest;
  const res = await $http({
    method: 'GET',
    url: 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
    responseType: 'text'
  });

  const root = parseXml(res, {
    arrayTags: [
      'entry',
      'link',
      'at:deleted-entry',
      'cac-place-ext:AdditionalPublicationDocumentReference',
    ],
    trim: true,
  });

  return parseEntries(root);
}

return start();

function parseEntries(root) {
  const feed = root.feed ?? root;

  const arr = (v) => (Array.isArray(v) ? v : (v == null ? [] : [v]));
  const text = (v) => (v && typeof v === 'object' && '_' in v) ? v['_'] : v;
  const toArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

  const pickDoc = (ref) => {
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

    return { id, url, type_code: typeVal };
  };

  // === 1) ENTRIES normales ===
  let entries = arr(feed.entry);
  const normalItems = entries.map((e) => {
    const id = text(e.id);
    const updated = new Date(e.updated);
    const title = text(e.title);
    const summary = text(e.summary._);
    const platform_url = text(e.link.href);

    const CFS = e["cac-place-ext:ContractFolderStatus"] ?? {};

    const contracting_party = CFS["cac-place-ext:LocatedContractingParty"]
    const profile_url = contracting_party["cbc:BuyerProfileURIID"]


    const party = contracting_party["cac:Party"]
    const party_website = party["cbc:WebsiteURI"]
    const party_dir3 = party["cac:PartyIdentification"].find(el => el["cbc:ID"]["schemeName"] == "DIR3")?._;
    const party_nif = party["cac:PartyIdentification"].find(el => el["cbc:ID"]["schemeName"] == "NIF")?._;
    const party_name = party["cac:PartyName"]["cbc:Name"]
    const party_address = party["cac:PostalAddress"][
      "cac:AddressLine"]["cbc:Line"]
    const party_zip = party["cac:PostalAddress"]["cbc:PostalZone"]
    const party_city = party["cac:PostalAddress"][
      "cbc:CityName"]
    const party_country_code = party["cac:PostalAddress"]["cac:Country"][
      "cbc:IdentificationCode"]._;
    const party_country = party["cac:PostalAddress"]["cac:Country"]["cbc:Name"]
    const party_phone = party["cac:Contact"][
      "cbc:Telephone"]
    const party_email = party[
      "cac:Contact"]["cbc:ElectronicMail"]

    const procurement = CFS["cac:ProcurementProject"]
    const type_code = procurement["cbc:TypeCode"]._;
    const subtype_code = procurement["cbc:SubTypeCode"]?._;

    const estimated_overall_cost = procurement[
      "cac:BudgetAmount"]["cbc:EstimatedOverallContractAmount"]._;
    const cost_with_taxes = procurement["cac:BudgetAmount"]["cbc:TotalAmount"]._;
    const cost_without_taxes = procurement["cac:BudgetAmount"]["cbc:TaxExclusiveAmount"]._;

    const commodities = procurement["cac:RequiredCommodityClassification"];
    const cpvs = toArray(commodities).map(el => el["cbc:ItemClassificationCode"]._);

    const realized_location = procurement["cac:RealizedLocation"]
    const relized_province = realized_location["cbc:CountrySubentity"]?._;
    const realized_city = realized_location["cac:Address"]["cbc:CityName"]
    const realized_zip = realized_location["cac:Address"]["cac:PostalZone"]
    const realized_country = realized_location["cac:Address"]["cac:Country"]["cbc:IdentificationCode"]?._;

    let estimated_duration;
    const planned_period = procurement["cac:PlannedPeriod"];
    if (planned_period) {
      const a = planned_period["cbc:DurationMeasure"];
      estimated_duration = a?._ + " " + a?.unitCode;
    }

    const tender_result = CFS[
      "cac:TenderResult"];
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
    const winning_zip = winning_location?.["cbc:PostalZone"]
    const winning_country = winning_location?.["cbc:Country"]?.["cbc:IdentificationCode"]?._;

    const award = tender_result?.["cac:AwardedTenderedProject"]?.["cac:LegalMonetaryTotal"]
    const award_tax_exclusive = award?.["cbc:TaxExclusiveAmount"]?._;
    const award_payable_amount = award?.["cbc:PayableAmount"]?._;

    const tendering_process = CFS["cac:TenderingProcess"]
    const procedure_code = tendering_process["cbc:ProcedureCode"]._;
    const urgency_code = tendering_process["cbc:UrgencyCode"]._;
    const contracting_system_code = tendering_process[
      "cbc:ContractingSystemCode"]._;
    const submission_method_code = tendering_process["cbc:SubmissionMethodCode"]._;
    const over_threshold_indicator = tendering_process[
      "cbc:OverThresholdIndicator"];

    const availability_period = tendering_process["cac:DocumentAvailabilityPeriod"]
    const end_availability_period = availability_period && availability_period["cbc:EndDate"]
    const end_availability_hour = availability_period && availability_period["cbc:EndTime"]

    const deadline_period = tendering_process["cac:TenderSubmissionDeadlinePeriod"]
    const end_date = deadline_period && deadline_period["cbc:EndDate"]
    const end_hour = deadline_period && deadline_period[
      "cbc:EndTime"];

    const collectDocs = (CFS) => {
      const KEYS = [
        "cac:LegalDocumentReference",
        "cac:TechnicalDocumentReference",
        "cac:AdditionalDocumentReference",
      ];

      // 1) Legales, técnicos y adicionales
      const fromBasicRefs = KEYS
        .flatMap(k => toArray(CFS?.[k]).map(pickDoc))
        .filter(Boolean);

      // 2) GeneralDocument → dentro viene GeneralDocumentDocumentReference
      const fromGeneral = toArray(CFS?.["cac-place-ext:GeneralDocument"])
        .map(g => pickDoc(g?.["cac-place-ext:GeneralDocumentDocumentReference"]))
        .filter(Boolean);

      // 3) Unir todo y deduplicar por id||url
      const all = [...fromBasicRefs, ...fromGeneral];
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
    const documents = collectDocs(CFS);

    function collectNotices(CFS) {
      // --- helpers locales ---
      const getText = (node) => {
        if (node == null) return null;
        if (typeof node === "string") return node.trim();
        if (typeof node === "object") {
          if ("_" in node && node._ != null) return String(node._).trim();
          if ("#text" in node && node["#text"] != null) return String(node["#text"]).trim();
        }
        return null;
      };

      const decodeCode = (node) => {
        if (node == null) return { value: null, listURI: null };
        if (typeof node === "string") return { value: node.trim(), listURI: null };
        if (typeof node === "object") {
          const value =
            ("_" in node && node._ != null) ? String(node._).trim() :
              ("#text" in node && node["#text"] != null) ? String(node["#text"]).trim() :
                null;
          const listURI = node.listURI || node["@listURI"] || node.schemeName || null;
          return { value, listURI };
        }
        return { value: null, listURI: null };
      };

      const normDate = (node) => {
        const raw = getText(node);
        if (!raw) return null;
        const m = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : raw.trim();
      };

      // --- extracción ---
      const noticeBlocks = []
        .concat(toArray(CFS?.["cac-place-ext:ValidNoticeInfo"]))
        .concat(toArray(CFS?.ValidNoticeInfo))
        .concat(toArray(CFS?.["cac:ValidNoticeInfo"]))
        .filter(Boolean);

      const expanded = [];

      for (const n of noticeBlocks) {
        const code = decodeCode(
          n?.["cbc-place-ext:NoticeTypeCode"] ??
          n?.["cbc:NoticeTypeCode"] ??
          n?.NoticeTypeCode
        ).value;

        const apsList = []
          .concat(toArray(n?.["cac-place-ext:AdditionalPublicationStatus"]))
          .concat(toArray(n?.["cac:AdditionalPublicationStatus"]))
          .concat(toArray(n?.AdditionalPublicationStatus))
          .filter(Boolean);

        if (apsList.length === 0) {
          const fallbackDate = normDate(n?.["cbc-place-ext:NoticeIssueDate"] ?? n?.NoticeIssueDate);
          expanded.push({
            code: code || null,
            media: null,
            date: fallbackDate || null,
            doc_uri: null,
            file_name: null,
            doc_type_code: null,
          });
          continue;
        }

        for (const aps of apsList) {
          const media = getText(
            aps?.["cbc-place-ext:PublicationMediaName"] ??
            aps?.["cbc:PublicationMediaName"] ??
            aps?.PublicationMediaName
          );

          const refs = []
            .concat(toArray(aps?.["cac-place-ext:AdditionalPublicationDocumentReference"]))
            .concat(toArray(aps?.["cac:AdditionalPublicationDocumentReference"]))
            .concat(toArray(aps?.AdditionalPublicationDocumentReference))
            .filter(Boolean);

          if (refs.length === 0) {
            const date =
              normDate(aps?.["cbc:IssueDate"] ?? aps?.IssueDate) ||
              normDate(n?.["cbc-place-ext:NoticeIssueDate"] ?? n?.NoticeIssueDate) ||
              null;

            expanded.push({
              code: code || null,
              media: media || null,
              date,
              doc_uri: null,
              file_name: null,
              doc_type_code: null,
            });
            continue;
          }

          for (const ref of refs) {
            const date =
              normDate(ref?.["cbc:IssueDate"] ?? ref?.IssueDate) ||
              normDate(aps?.["cbc:IssueDate"] ?? aps?.IssueDate) ||
              normDate(n?.["cbc-place-ext:NoticeIssueDate"] ?? n?.NoticeIssueDate) ||
              null;

            const fileName = getText(
              ref?.["cbc:FileName"] ?? ref?.FileName ??
              ref?.["cac:Attachment"]?.["cac:ExternalReference"]?.["cbc:FileName"] ??
              ref?.Attachment?.ExternalReference?.FileName
            );

            const docTypeCode = decodeCode(
              ref?.["cbc:DocumentTypeCode"] ?? ref?.DocumentTypeCode
            ).value;

            const uri = getText(
              ref?.["cbc:URI"] ?? ref?.URI ??
              ref?.["cac:Attachment"]?.["cac:ExternalReference"]?.["cbc:URI"] ??
              ref?.Attachment?.ExternalReference?.URI
            );

            expanded.push({
              code: code || null,
              media: media || null,
              date,
              doc_uri: uri || null,
              file_name: fileName || null,
              doc_type_code: docTypeCode || null,
            });
          }
        }
      }

      // --- deduplicación integrada ---
      // Regla: colapsar por (code, media, date) eligiendo el "mejor" item (más campos rellenos).
      // Si necesitas conservar múltiples URIs en la misma fecha, cambia la clave a incluir doc_uri.
      const pickScore = (n) =>
        (n.doc_uri ? 1 : 0) + (n.file_name ? 1 : 0) + (n.doc_type_code ? 1 : 0);

      const byKey = new Map(); // key = code|media|date
      for (const n of expanded) {
        const key = `${n.code || ""}|${n.media || ""}|${n.date || ""}`;
        const prev = byKey.get(key);
        if (!prev || pickScore(n) > pickScore(prev)) {
          byKey.set(key, n);
        }
      }

      return Array.from(byKey.values());
    }
    const notices = collectNotices(CFS);

    return {
      json: {
        entry_id: id,
        updated,
        title,
        summary,
        platform_url,
        type_code,
        subtype_code,
        estimated_overall_cost,
        cost_with_taxes,
        cost_without_taxes,
        cpvs,
        realized_city,
        realized_zip,
        realized_country,
        estimated_duration,
        procedure_code,
        urgency_code,
        contracting_system_code,
        submission_method_code,
        over_threshold_indicator,
        end_availability_period,
        end_availability_hour,
        end_date,
        end_hour,
        tender_result_code,
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
        documents,
        notices,
        party: {
          profile_url,
          website: party_website,
          dir3: party_dir3,
          nif: party_nif,
          name: party_name,
          phone: party_phone,
          email: party_email,
          address: party_address,
          zip: party_zip,
          city: party_city,
          country_code: party_country_code,
          country: party_country
        },
        //raw: e, // for debugging
      },
    };
  });

  return normalItems;
}

// xml-simple-parser.js
// Parser XML sin dependencias para Node.js.
// - Atributos sin prefijo (p.ej., href, rel)
// - Texto en la clave "_" (configurable con textKey)
// - CDATA se concatena al texto
// - arrayTags: fuerza arrays por nombre de etiqueta
function parseXml(xml, {
  arrayTags = [],
  trim = true,
  textKey = '_',      // clave para texto
  attrPrefix = ''     // prefijo para atributos (vacío => atributos "normales")
} = {}) {
  if (typeof xml !== 'string') throw new TypeError('xml must be a string');

  // Quitar comentarios y prólogo XML
  xml = xml.replace(/<!--[\s\S]*?-->/g, '');
  xml = xml.replace(/<\?xml[\s\S]*?\?>/g, '');

  const tokens = tokenize(xml);
  const stack = [];
  const root = {};
  let current = { name: null, obj: root };

  for (const tok of tokens) {
    switch (tok.type) {
      case 'opentag': {
        const { name, attrs, selfClosing } = tok;
        const nodeObj = {};
        // Atributos (sin '@')
        for (const [k, v] of Object.entries(attrs)) nodeObj[attrPrefix + k] = v;

        // Insertar en padre
        addChild(current.obj, name, nodeObj, arrayTags);

        if (!selfClosing) {
          stack.push(current);
          current = { name, obj: nodeObj };
        }
        break;
      }

      case 'closetag': {
        if (!current.name || current.name !== tok.name) {
          while (stack.length && current.name !== tok.name) {
            current = stack.pop();
          }
        }
        if (current.name === tok.name && stack.length) {
          current = stack.pop();
        }
        break;
      }

      case 'text': {
        const txt = trim ? tok.value.trim() : tok.value;
        if (txt) {
          if (current.obj[textKey]) current.obj[textKey] += (trim ? ' ' : '') + txt;
          else current.obj[textKey] = txt;
        }
        break;
      }

      case 'cdata': {
        const txt = tok.value; // CDATA sin trim por defecto
        if (txt) {
          if (current.obj[textKey]) current.obj[textKey] += txt;
          else current.obj[textKey] = txt;
        }
        break;
      }
    }
  }

  return root;
}

// --- Helpers ---

function addChild(parentObj, tagName, childObj, arrayTags) {
  const forceArray = arrayTags.includes(tagName);
  const existing = parentObj[tagName];

  if (existing === undefined) {
    parentObj[tagName] = forceArray ? [childObj] : childObj;
  } else if (Array.isArray(existing)) {
    existing.push(childObj);
  } else {
    parentObj[tagName] = [existing, childObj];
  }
}

function tokenize(xml) {
  const re = /<!\[CDATA\[[\s\S]*?\]\]>|<\/[^>]+>|<[^>]+>|[^<]+/g;
  const out = [];
  let m;

  while ((m = re.exec(xml))) {
    const s = m[0];
    if (s.startsWith('<![CDATA[')) {
      out.push({ type: 'cdata', value: s.slice(9, -3) });
    } else if (s.startsWith('</')) {
      const name = s.slice(2, -1).trim();
      out.push({ type: 'closetag', name });
    } else if (s.startsWith('<')) {
      const inner = s.slice(1, -1).trim();
      const selfClosing = inner.endsWith('/');
      const body = selfClosing ? inner.slice(0, -1).trim() : inner;

      const spaceIdx = body.search(/\s/);
      const name = spaceIdx === -1 ? body : body.slice(0, spaceIdx);
      const rest = spaceIdx === -1 ? '' : body.slice(spaceIdx + 1);

      const attrs = parseAttributes(rest);
      out.push({ type: 'opentag', name, attrs, selfClosing });
    } else {
      out.push({ type: 'text', value: s });
    }
  }

  return out;
}

function parseAttributes(s) {
  const attrs = {};
  if (!s) return attrs;

  // key="val" | key='val'
  const re = /([^\s=\/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(s))) {
    const key = m[1];
    const val = m[2] !== undefined ? m[2] : m[3];
    attrs[key] = decodeEntities(val);
  }
  return attrs;
}

function decodeEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
