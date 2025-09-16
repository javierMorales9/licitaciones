import { XMLParser } from "fast-xml-parser";
import Airtable from "airtable";
import type { AirtableBase } from "airtable/lib/airtable_base.js";
import {
  parseEntries,
  parseDeletedEntries,
} from "./feedParser.js";

import type {
  AtomRootRaw,
  ParsedEntry,
  ParsedDeletedEntry,
  ParsedLot,
  ParsedDocRef,
  ParsedParty
} from "./feedParser.js";

const BASE_FEED_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';
const CPVS = ["9132", "9134"];
const AIRTABLE_API_KEY = "patPa3vrKFZzCjmEZ.09f5ce7555aad195f2e2973d59d917ea21da75ca4024b0be5ce0527416b3c7c2";
const AIRTABLE_BASE_ID = "appHCHKp389SLrdkg";

export interface LicitationLike {
  id?: string;
  entry_id: string;
  statusCode?: string;
  publishedDate?: string;
  updated?: Date | string;
  title?: string;
  summary?: string;
  platform_url?: string;

  // Procurement
  type_code?: string;
  subtype_code?: string;
  estimated_overall_cost?: string | number;
  cost_with_taxes?: string | number;
  cost_without_taxes?: string | number;
  cpvs?: string[] | string; // desde DB a veces vendrá "a,b,c"
  place?: string;
  realized_city?: string;
  realized_zip?: string;
  realized_country?: string;
  estimated_duration?: string;

  // Result
  tender_result_code?: string;
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

  lotsAdj?: number;

  // TenderingProcess
  procedure_code?: string;
  urgency_code?: string;
  part_presentation_code?: string;
  contracting_system_code?: string;
  submission_method_code?: string;
  over_threshold_indicator?: boolean | string;

  // Limit dates
  end_availability_period?: string;
  end_availability_hour?: string;
  end_date?: string;
  end_hour?: string;
}

export class Licitation {
  id?: string;
  entry_id: string;
  partyId: string;
  statusCode?: string;
  publishedDate?: string;
  updated: Date;
  title?: string;
  summary?: string;
  platform_url?: string;

  // Procurement
  type_code?: string;
  subtype_code?: string;
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
  tender_result_code?: string;
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

  lotsAdj: number;

  // TenderingProcess
  procedure_code?: string;
  urgency_code?: string;
  part_presentation_code?: string;
  contracting_system_code?: string;
  submission_method_code?: string;
  over_threshold_indicator?: boolean | string;

  // Limit dates
  end_availability_period?: string;
  end_availability_hour?: string;
  end_date?: string;
  end_hour?: string;

  constructor(args: LicitationLike & { entry_id: string; partyId: string; updated: Date; }) {
    this.id = args.id;
    this.entry_id = args.entry_id;
    this.partyId = args.partyId;
    this.statusCode = args.statusCode;
    this.publishedDate = args.publishedDate;
    this.updated = args.updated;
    this.title = args.title;
    this.summary = args.summary;
    this.platform_url = args.platform_url;

    // Procurement
    this.type_code = args.type_code;
    this.subtype_code = args.subtype_code;
    this.estimated_overall_cost = args.estimated_overall_cost;
    this.cost_with_taxes = args.cost_with_taxes;
    this.cost_without_taxes = args.cost_without_taxes;
    this.cpvs = Array.isArray(args.cpvs)
      ? args.cpvs
      : typeof args.cpvs === "string"
        ? args.cpvs.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
    this.place = args.place;
    this.realized_city = args.realized_city;
    this.realized_zip = args.realized_zip;
    this.realized_country = args.realized_country;
    this.estimated_duration = args.estimated_duration;

    // Result
    this.tender_result_code = args.tender_result_code;
    this.award_date = args.award_date;
    this.received_tender_quantity = args.received_tender_quantity;
    this.lower_tender_amount = args.lower_tender_amount;
    this.higher_tender_amount = args.higher_tender_amount;
    this.winning_nif = args.winning_nif;
    this.winning_name = args.winning_name;
    this.winning_city = args.winning_city;
    this.winning_zip = args.winning_zip;
    this.winning_country = args.winning_country;
    this.award_tax_exclusive = args.award_tax_exclusive;
    this.award_payable_amount = args.award_payable_amount;

    // lots
    this.lotsAdj = typeof args.lotsAdj === "number" ? args.lotsAdj : 0;

    // TenderingProcess
    this.procedure_code = args.procedure_code;
    this.urgency_code = args.urgency_code;
    this.part_presentation_code = args.part_presentation_code;
    this.contracting_system_code = args.contracting_system_code;
    this.submission_method_code = args.submission_method_code;
    this.over_threshold_indicator = args.over_threshold_indicator;

    // Limit dates
    this.end_availability_period = args.end_availability_period;
    this.end_availability_hour = args.end_availability_hour;
    this.end_date = args.end_date;
    this.end_hour = args.end_hour;
  }

  // ===== Helpers locales (sin funciones externas) =====
  private static asDate(v: Date | string | undefined): Date {
    if (v instanceof Date) return v;
    return new Date(v ?? "");
  }
  private static asArray(v?: string[] | string): string[] | undefined {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      const arr = v.split(",").map((s) => s.trim()).filter(Boolean);
      return arr.length ? arr : undefined;
    }
    return undefined;
  }

  static fromParsedEntry(p: ParsedEntry, partyId: string): Licitation {
    return new Licitation({
      entry_id: p.entry_id,
      partyId,
      statusCode: p.statusCode,
      publishedDate: p.publishedDate,
      updated: Licitation.asDate(p.updated),
      title: p.title,
      summary: p.summary,
      platform_url: p.platform_url,

      // Procurement
      type_code: p.type_code,
      subtype_code: p.subtype_code,
      estimated_overall_cost: p.estimated_overall_cost,
      cost_with_taxes: p.cost_with_taxes,
      cost_without_taxes: p.cost_without_taxes,
      cpvs: p.cpvs,
      place: p.place,
      realized_city: p.realized_city,
      realized_zip: p.realized_zip,
      realized_country: p.realized_country,
      estimated_duration: p.estimated_duration,

      // Result
      tender_result_code: p.tender_result_code,
      award_date: p.award_date,
      received_tender_quantity: p.received_tender_quantity,
      lower_tender_amount: p.lower_tender_amount,
      higher_tender_amount: p.higher_tender_amount,
      winning_nif: p.winning_nif,
      winning_name: p.winning_name,
      winning_city: p.winning_city,
      winning_zip: p.winning_zip,
      winning_country: p.winning_country,
      award_tax_exclusive: p.award_tax_exclusive,
      award_payable_amount: p.award_payable_amount,

      lotsAdj: p.lotsAdj ?? 0,

      // TenderingProcess
      procedure_code: p.procedure_code,
      urgency_code: p.urgency_code,
      part_presentation_code: p.part_presentation_code,
      contracting_system_code: p.contracting_system_code,
      submission_method_code: p.submission_method_code,
      over_threshold_indicator: p.over_threshold_indicator,

      // Limit dates
      end_availability_period: p.end_availability_period,
      end_availability_hour: p.end_availability_hour,
      end_date: p.end_date,
      end_hour: p.end_hour,
    });
  }

  // ===== Factory 2: desde la base de datos (tras mapping en el repo) =====
  // Recibe ya las claves con los nombres de la clase; normaliza updated/arrays, etc.
  static fromDb(row: Partial<LicitationLike> & { partyId: string }): Licitation {
    if (!row.entry_id) {
      throw new Error("fromDb: 'entry_id' es obligatorio");
    }

    return new Licitation({
      id: row.id,
      entry_id: row.entry_id,
      partyId: row.partyId,
      statusCode: row.statusCode,
      publishedDate: row.publishedDate,
      updated: Licitation.asDate(row.updated),

      title: row.title,
      summary: row.summary,
      platform_url: row.platform_url,

      // Procurement
      type_code: row.type_code,
      subtype_code: row.subtype_code,
      estimated_overall_cost: row.estimated_overall_cost,
      cost_with_taxes: row.cost_with_taxes,
      cost_without_taxes: row.cost_without_taxes,
      cpvs: Licitation.asArray(row.cpvs),
      place: row.place,
      realized_city: row.realized_city,
      realized_zip: row.realized_zip,
      realized_country: row.realized_country,
      estimated_duration: row.estimated_duration,

      // Result
      tender_result_code: row.tender_result_code,
      award_date: row.award_date,
      received_tender_quantity: row.received_tender_quantity,
      lower_tender_amount: row.lower_tender_amount,
      higher_tender_amount: row.higher_tender_amount,
      winning_nif: row.winning_nif,
      winning_name: row.winning_name,
      winning_city: row.winning_city,
      winning_zip: row.winning_zip,
      winning_country: row.winning_country,
      award_tax_exclusive: row.award_tax_exclusive,
      award_payable_amount: row.award_payable_amount,

      lotsAdj: typeof row.lotsAdj === "number" ? row.lotsAdj : 0,

      // TenderingProcess
      procedure_code: row.procedure_code,
      urgency_code: row.urgency_code,
      part_presentation_code: row.part_presentation_code,
      contracting_system_code: row.contracting_system_code,
      submission_method_code: row.submission_method_code,
      over_threshold_indicator: row.over_threshold_indicator,

      // Limit dates
      end_availability_period: row.end_availability_period,
      end_availability_hour: row.end_availability_hour,
      end_date: row.end_date,
      end_hour: row.end_hour,
    });
  }

  update(newData: Partial<Licitation>): void {
    for (const [key, value] of Object.entries(newData)) {
      if (value !== undefined && value !== null) {
        (this as any)[key] = value;
      }
    }
  }
}

export interface LotLike {
  id?: string;
  lot_id: string | number;
  ext_id: string;
  name?: string;
  cost_with_taxes?: string | number;
  cost_without_taxes?: string | number;
  cpvs?: string[] | string;
  place?: string;
  city?: string;
  zip?: string;
  country?: string;
  tender_result_code?: string;
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
}

export class Lot {
  id?: string | undefined;
  lot_id: string | number;
  ext_id: string;
  name?: string;
  licitationId: string;
  cost_with_taxes?: string | number;
  cost_without_taxes?: string | number;
  cpvs?: string[];
  place?: string;
  city?: string;
  zip?: string;
  country?: string;
  tender_result_code?: string | undefined;
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

  constructor(args: LotLike & { licitationId: string }) {
    this.id = args.id;
    this.lot_id = args.lot_id;
    this.ext_id = args.ext_id;
    this.name = args.name;
    this.licitationId = args.licitationId;
    this.cost_with_taxes = args.cost_with_taxes;
    this.cost_without_taxes = args.cost_without_taxes;
    this.cpvs = Array.isArray(args.cpvs)
      ? args.cpvs
      : typeof args.cpvs === "string"
        ? args.cpvs.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
    this.place = args.place;
    this.city = args.city;
    this.zip = args.zip;
    this.country = args.country;
    this.tender_result_code = args.tender_result_code;
    this.award_date = args.award_date;
    this.received_tender_quantity = args.received_tender_quantity;
    this.lower_tender_amount = args.lower_tender_amount;
    this.higher_tender_amount = args.higher_tender_amount;
    this.winning_nif = args.winning_nif;
    this.winning_name = args.winning_name;
    this.winning_city = args.winning_city;
    this.winning_zip = args.winning_zip;
    this.winning_country = args.winning_country;
    this.award_tax_exclusive = args.award_tax_exclusive;
    this.award_payable_amount = args.award_payable_amount;
  }

  static fromParsed(l: ParsedLot, licitationId: string): Lot {
    return new Lot({ ...l, licitationId: licitationId, });
  }

  static fromDb(row: LotLike & { licitationId: string }): Lot {
    return new Lot(row);
  }

  update(newData: Partial<ParsedLot>): void {
    for (const [key, value] of Object.entries(newData)) {
      if (value !== undefined && value !== null) {
        (this as any)[key] = value;
      }
    }
  }
}

export class Doc {
  id?: string | undefined;
  licitationId: string;
  name: string;
  url: string;
  type?: string;

  constructor(args: { id?: string; licitationId: string; name: string; url: string; type?: string }) {
    this.id = args.id;
    this.licitationId = args.licitationId;
    this.name = args.name;
    this.url = args.url;
    this.type = args.type;
  }

  static fromParsed(d: { name: string; url: string; type?: string }, licitationId: string): Doc {
    return new Doc({
      name: d.name,
      licitationId,
      url: d.url,
      type: d.type,
    });
  }

  static fromDb(row: { id?: string; licitationId: string, name?: string; url?: string; type?: string }): Doc {
    return new Doc({
      id: row.id,
      licitationId: row.licitationId,
      name: row.name ?? "",
      url: row.url ?? "",
      type: row.type,
    });
  }

  update(newData: Partial<ParsedDocRef>): void {
    for (const [key, value] of Object.entries(newData)) {
      if (value !== undefined && value !== null) {
        (this as any)[key] = value;
      }
    }
  }
}

export class Party {
  id?: string | undefined;
  nif: string;
  updated: Date;
  profile_url?: string;
  website?: string;
  dir3?: string;
  name?: string;
  address?: string;
  zip?: string;
  city?: string;
  countryCode?: string;
  country?: string;
  phone?: string;
  email?: string;

  constructor(args: {
    id?: string;
    nif: string;
    updated: Date;
    profile_url?: string;
    website?: string;
    dir3?: string;
    name?: string;
    address?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  }) {
    this.id = args.id;
    this.nif = args.nif;
    this.profile_url = args.profile_url;
    this.updated = args.updated;
    this.website = args.website;
    this.dir3 = args.dir3;
    this.name = args.name;
    this.address = args.address;
    this.zip = args.zip;
    this.city = args.city;
    this.countryCode = args.countryCode;
    this.country = args.country;
    this.phone = args.phone;
    this.email = args.email;
  }

  static fromParsed(p: {
    nif: string;
    profile_url?: string;
    updated: string;
    website?: string;
    dir3?: string;
    name?: string;
    address?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  }): Party {
    return new Party({
      nif: p.nif,
      updated: new Date(p.updated),
      profile_url: p.profile_url,
      website: p.website,
      dir3: p.dir3,
      name: p.name,
      address: p.address,
      zip: p.zip,
      city: p.city,
      countryCode: p.countryCode,
      country: p.country,
      phone: p.phone,
      email: p.email,
    });
  }

  static fromDb(row: {
    id?: string;
    nif?: string;
    updated: string;
    profile_url?: string;
    website?: string;
    dir3?: string;
    name?: string;
    address?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  }): Party {
    if (!row.nif) {
      throw new Error("fromDb: 'nif' es obligatorio");
    }
    return new Party({
      id: row.id,
      nif: row.nif,
      updated: new Date(row.updated),
      profile_url: row.profile_url,
      website: row.website,
      dir3: row.dir3,
      name: row.name,
      address: row.address,
      zip: row.zip,
      city: row.city,
      countryCode: row.countryCode,
      country: row.country,
      phone: row.phone,
      email: row.email,
    });
  }

  update(newData: Partial<ParsedParty>): void {
    for (const [key, value] of Object.entries(newData)) {
      if (value !== undefined && value !== null) {
        (this as any)[key] = value;
      }
    }
  }
}

class Event {
  public createdAt: Date;
  public type: string;
  public licitationId: string;
  public lotId?: string | undefined;

  constructor(p: {
    createdAt: Date,
    type: string,
    licitationId: string,
    lotId?: string,
  }) {
    this.createdAt = p.createdAt;
    this.type = p.type;
    this.licitationId = p.licitationId;
    this.lotId = p.lotId;
  }
};

class CursorRepository {
  private base: AirtableBase;
  constructor(base: AirtableBase) {
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

    const lastUpdate = records[0].fields['Fecha Última Revisión'];
    if (!lastUpdate)
      return null;

    return new Date(lastUpdate.toString());
  }

  async updateCursor(newLastExtracted: Date | null, entriesProcessed: number) {
    if (newLastExtracted) {
      await this.base("Cursor").create([
        {
          fields: {
            'Fecha Última Revisión': newLastExtracted.toString(),
            'Entradas procesadas': entriesProcessed,
          },
        },
      ]);
    }
  }
}

class LicitationRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base;
  }

  async get(id: string): Promise<Licitation | null> {
    const records = await this.base("Licitaciones").select({
      filterByFormula: `{Id} = "${id}"`,
      maxRecords: 1,
    }).all();

    const fields = records[0]?.fields;
    if (!fields)
      return null

    return Licitation.fromDb({
      id: records[0]?.id,
      partyId: fields["Organismo"] as string,
      entry_id: fields["ID"] as string,
      statusCode: fields["Código de Estado"] as string | undefined,

      publishedDate: fields["Fecha de Publicación"] as string | undefined,

      updated: fields["Última actualización"]
        ? new Date(fields["Última actualización"] as string)
        : new Date(NaN),

      title: fields["Título"] as string | undefined,
      summary: fields["Resumen"] as string | undefined,
      platform_url: fields["URL de Plataforma"] as string | undefined,

      type_code: fields["Código de Tipo"] as string | undefined,
      subtype_code: fields["Código de Subtipo"] as string | undefined,
      estimated_overall_cost: fields["Coste Total Estimado"] as string | number | undefined,
      cost_with_taxes: fields["Coste con Impuestos"] as string | number | undefined,
      cost_without_taxes: fields["Coste sin Impuestos"] as string | number | undefined,
      cpvs: typeof fields["CPVs"] === "string"
        ? (fields["CPVs"] as string).split(",").map(s => s.trim()).filter(Boolean)
        : [],

      place: fields["Lugar"] as string | undefined,
      realized_city: fields["Ciudad de Realización"] as string | undefined,
      realized_zip: fields["Código Postal de Realización"] != null
        ? String(fields["Código Postal de Realización"])
        : undefined,
      realized_country: fields["País de Realización"] as string | undefined,
      estimated_duration: fields["Duración Estimada"] as string | undefined,

      tender_result_code: fields["Código de Resultado de Licitación"] as string | undefined,
      award_date: fields["Fecha de Adjudicación"] as string | undefined,
      received_tender_quantity: fields["Cantidad de Ofertas Recibidas"] as string | number | undefined,
      lower_tender_amount: fields["Oferta Más Baja"] as string | number | undefined,
      higher_tender_amount: fields["Oferta Más Alta"] as string | number | undefined,
      winning_nif: fields["NIF Ganador"] as string | undefined,
      winning_name: fields["Nombre Ganador"] as string | undefined,
      winning_city: fields["Ciudad Ganador"] as string | undefined,
      winning_zip: fields["Código Postal Ganador"] != null
        ? String(fields["Código Postal Ganador"])
        : undefined,
      winning_country: fields["País Ganador"] as string | undefined,
      award_tax_exclusive: fields["Adjudicación sin Impuestos"] as string | number | undefined,
      award_payable_amount: fields["Importe a Pagar Adjudicación"] as string | number | undefined,

      lotsAdj: fields["Lotes Adjudicados"] != null ? Number(fields["Lotes Adjudicados"]) : 0,

      procedure_code: fields["Código de Procedimiento"] as string | undefined,
      urgency_code: fields["Código de Urgencia"] as string | undefined,
      part_presentation_code: fields["Código de Presentación"] as string | undefined,
      contracting_system_code: fields["Código de Sistema de Contratación"] as string | undefined,
      submission_method_code: fields["Código de Método de Presentación"] as string | undefined,
      over_threshold_indicator:
        typeof fields["Indicador Sobre Umbral"] === "boolean"
          ? (fields["Indicador Sobre Umbral"] as boolean)
          : (fields["Indicador Sobre Umbral"] as string | undefined),

      end_availability_period: fields["Fin Periodo Disponibilidad"] as string | undefined,
      end_availability_hour: fields["Hora Fin Disponibilidad"] as string | undefined,
      end_date: fields["Fecha de Fin"] as string | undefined,
      end_hour: fields["Hora de Fin"] as string | undefined,
    });
  }

  async create(lic: Licitation) {
    const result = await this.base("Licitaciones").create([
      {
        fields: {
          ['ID']: lic.entry_id,
          ['Organismo']: [lic.partyId],
          ...this.createUpdatableObject(lic),
        },
      },
    ]);

    return result[0]?.id as string;
  }

  async save(lic: Licitation) {
    if (!lic.id) return;

    await this.base("Licitaciones").update([
      {
        id: lic.id,
        fields: this.createUpdatableObject(lic),
      }
    ]);
  }

  private createUpdatableObject(lic: Licitation) {
    return {
      ['Código de Estado']: lic.statusCode,
      ['Última actualización']: lic.updated.toString(),
      ['Título']: lic.title,
      ['Resumen']: lic.summary,
      ['URL de Plataforma']: lic.platform_url,
      ['Código de Tipo']: lic.type_code,
      ['Código de Subtipo']: lic.subtype_code,
      ['Coste Total Estimado']: lic.estimated_overall_cost,
      ['Coste con Impuestos']: lic.cost_with_taxes,
      ['Coste sin Impuestos']: lic.cost_without_taxes,
      ['CPVs']: lic.cpvs?.join(","),
      ['Lugar']: lic.place,
      ['Ciudad de Realización']: lic.realized_city,
      ['Código Postal de Realización']: lic.realized_zip,
      ['País de Realización']: lic.realized_country,
      ['Duración Estimada']: lic.estimated_duration,
      ['Código de Resultado de Licitación']: lic.tender_result_code,
      ['Fecha de Adjudicación']: lic.award_date,
      ['Cantidad de Ofertas Recibidas']: lic.received_tender_quantity,
      ['Oferta Más Baja']: lic.lower_tender_amount,
      ['Oferta Más Alta']: lic.higher_tender_amount,
      ['NIF Ganador']: lic.winning_nif,
      ['Nombre Ganador']: lic.winning_name,
      ['Ciudad Ganador']: lic.winning_city,
      ['Código Postal Ganador']: lic.winning_zip,
      ['País Ganador']: lic.winning_country,
      ['Adjudicación sin Impuestos']: lic.award_tax_exclusive,
      ['Importe a Pagar Adjudicación']: lic.award_payable_amount,
      ['Lotes Adjudicados']: lic.lotsAdj,
      ['Código de Procedimiento']: lic.procedure_code,
      ['Código de Urgencia']: lic.urgency_code,
      ['Código de Presentación']: lic.part_presentation_code,
      ['Código de Sistema de Contratación']: lic.contracting_system_code,
      ['Código de Método de Presentación']: lic.submission_method_code,
      ['Indicador Sobre Umbral']: lic.over_threshold_indicator,
      ['Fin Periodo Disponibilidad']: lic.end_availability_period,
      ['Hora Fin Disponibilidad']: lic.end_availability_hour,
      ['Fecha de Fin']: lic.end_date,
      ['Hora de Fin']: lic.end_hour,
    };
  }
}

class LotsRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base
  }

  async getByLicitation(licitationId: string): Promise<Lot[]> {
    const records = await this.base("Lotes")
      .select({
        filterByFormula: `{Licitación}="${licitationId}"`,
        pageSize: 100,
      })
      .all();

    // Mapear campos Airtable -> Lot
    return records.map((r) => {
      const f = r.fields;

      return Lot.fromDb({
        id: r.id,
        lot_id: f["ID Lote"] != null ? String(f["ID Lote"]) : "0",
        ext_id: (f["External Id"] as string) ?? "",
        licitationId: f["Licitación"] as string,
        name: f["Nombre"] as string | undefined,
        cost_with_taxes: f["Coste con Impuestos"] as string | number | undefined,
        cost_without_taxes: f["Coste sin Impuestos"] as string | number | undefined,
        cpvs:
          typeof f["CPVs"] === "string"
            ? (f["CPVs"] as string).split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        place: f["Lugar de Ejecución"] as string | undefined,
        city: f["Ciudad de Realización"] as string | undefined,
        zip: f["Código Postal de Realización"] != null ? String(f["Código Postal de Realización"]) : undefined,
        country: f["País de Realización"] as string | undefined,
        tender_result_code: f["Código de Resultado de Licitación"] as string | undefined,
        award_date: f["Fecha de Adjudicación"] as string | undefined,
        received_tender_quantity: f["Cantidad de Ofertas Recibidas"] as string | number | undefined,
        lower_tender_amount: f["Oferta Más Baja"] as string | number | undefined,
        higher_tender_amount: f["Oferta Más Alta"] as string | number | undefined,
        winning_nif: f["NIF Ganador"] as string | undefined,
        winning_name: f["Nombre Ganador"] as string | undefined,
        winning_city: f["Ciudad Ganador"] as string | undefined,
        winning_zip: f["Código Postal Ganador"] != null ? String(f["Código Postal Ganador"]) : undefined,
        winning_country: undefined,
        award_tax_exclusive: f["Asignación Ganador Sin Impuestos"] as string | number | undefined,
        award_payable_amount: f["Asignación Ganador Con Impuestos"] as string | number | undefined,
      });
    });
  }

  async create(lots: Lot[]) {
    for (const lo of lots) {
      await this.base("Lotes").create([
        {
          fields: {
            "Nombre": lo.name,
            "ID Lote": (lo.lot_id ?? "").toString(),
            "External Id": lo.ext_id,
            "Licitación": [lo.licitationId],
            ...this.createEditableObject(lo),
          },
        },
      ]);
    }
  }

  async saveLots(lots: Lot[]) {
    for (const lo of lots) {
      if (!lo.id) continue;

      await this.base("Lotes").update([
        {
          id: lo.id,
          fields: this.createEditableObject(lo),
        }
      ]);
    }
  }

  private createEditableObject(lot: Lot) {
    return {
      "Coste con Impuestos": lot.cost_with_taxes,
      "Coste sin Impuestos": lot.cost_without_taxes,
      "CPVs": lot.cpvs?.join(","),
      "Lugar de Ejecución": lot.place,
      "Ciudad de Realización": lot.city,
      "Código Postal de Realización": lot.zip,
      "País de Realización": lot.country,
      "Duración Estimada": "",
      "Código de Resultado de Licitación": lot.tender_result_code,
      "Fecha de Adjudicación": lot.award_date,
      "Cantidad de Ofertas Recibidas": lot.received_tender_quantity,
      "Oferta Más Baja": lot.lower_tender_amount,
      "Oferta Más Alta": lot.higher_tender_amount,
      "NIF Ganador": lot.winning_nif,
      "Nombre Ganador": lot.winning_name,
      "Ciudad Ganador": lot.winning_city,
      "Código Postal Ganador": lot.winning_zip,
      "Asignación Ganador Sin Impuestos": lot.award_tax_exclusive,
      "Asignación Ganador Con Impuestos": lot.award_payable_amount,
    };
  }
}

class PartyRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base
  }

  async get(nif: string): Promise<Party | null> {
    const records = await this.base("Organismos")
      .select({
        // Coincidencia exacta por NIF (mismo nombre de campo que en save)
        filterByFormula: `{NIF} = "${nif}"`,
        maxRecords: 1,
      })
      .all();

    const rec = records[0];
    const f = rec?.fields;
    if (!f) return null;

    return Party.fromDb({
      id: rec.id,
      nif: (f["NIF"] as string) ?? "",
      updated: (f["Última modificación"] ?? "") as string,
      profile_url: f["Perfil Contratante URL"] as string | undefined,
      website: f["Website"] as string | undefined,
      dir3: f["DIR3"] as string | undefined,
      name: f["Nombre Organismo"] as string | undefined,
      address: f["Dirección"] as string | undefined,
      zip: f["Código Postal"] != null ? String(f["Código Postal"]) : undefined,
      city: f["Ciudad"] as string | undefined,
      country: f["País"] as string | undefined,
      countryCode: f["País Código"] as string | undefined,
      phone: f["Teléfono"] != null ? String(f["Teléfono"]) : undefined,
      email: f["Email"] as string | undefined,
    });
  }

  async create(org: Party) {
    const result = await this.base("Organismos").create([
      {
        fields: {
          'Nombre Organismo': org.name,
          'NIF': org.nif,
          'DIR3': org.dir3,
          'Perfil Contratante URL': org.profile_url,
          ...this.createEditableObject(org),
        },
      },
    ]);

    return result[0]?.id ?? "";
  }

  async save(party: Party) {
    if (!party.id) return;

    await this.base("Organismos").update([
      {
        id: party.id,
        fields: this.createEditableObject(party),
      },
    ]);
  }

  createEditableObject(org: Party) {
    return {
      'Website': org.website,
      'Dirección': org.address,
      'Código Postal': org.zip,
      'Ciudad': org.city,
      'País': org.country,
      'País Código': org.countryCode,
      'Teléfono': org.phone,
      'Email': org.email,
    };
  }
}

class DocRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base
  }

  async get(licId: string): Promise<Doc[]> {
    const records = await this.base("Documentos Licitación")
      .select({
        filterByFormula: `{Licitación} = "${licId}"`,
      })
      .all();

    return records.map((rec) => {
      const f = rec.fields;
      return Doc.fromDb({
        id: rec.id,
        licitationId: f["Licitación"] as string,
        name: (f["ID Documento"] as string) ?? "",
        url: (f["URL Documento"] as string) ?? "",
        type: f["Tipo de Documento"] as string | undefined,
      });
    });
  }

  async create(docs: Doc[]) {
    for (const d of docs) {
      await this.base("Documentos Licitación").create([
        {
          fields: {
            "ID Documento": d.name,
            "Licitación": [d.licitationId],
            "URL Documento": d.url,
            "Tipo de Documento": d.type,
          },
        },
      ]);
    }
  }

  async saveDocs(docs: Doc[]) {
    for (const d of docs) {
      if (!d.id) continue;

      await this.base("Documentos Licitación").update([
        {
          id: d.id,
          fields: {
            "URL Documento": d.url,
          },
        },
      ]);
    }
  }
}

class EventRepository {
  private base: AirtableBase;

  constructor(base: AirtableBase) {
    this.base = base;
  }

  async add(events: Event[]) {
    for (const e of events) {
      await this.base("Eventos").create([
        {
          fields: {
            "Fecha de Creación": e.createdAt.toString(),
            "Tipo": e.type,
            "Licitación": e.licitationId,
            "Lote": e.lotId,
          },
        },
      ]);
    }
  }
}

async function executeJob(baseUrl: string) {
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
      throw new Error("No previous cursor");
    }

    const { newEntries, newLastExtracted } = await extractNewEntries(baseUrl, lastUpdate);

    for (const entry of newEntries) {
      const lic = await licitationsRepo.get(entry.entry_id);
      const org = await partyRepo.get(entry.party.nif);

      const events: Event[] = [];

      if (lic) {
        if (!lic.id) {
          console.log("THIS SHOULD NOT HAPPEN");
          continue;
        }

        if (lic.updated >= entry.updated) {
          continue;
        }

        const docs = await docRepo.get(lic.id);
        const lots = await lotsRepo.getByLicitation(lic.id);

        const newDocs: Doc[] = [];
        const newLots: Lot[] = [];

        if (lic.statusCode === "PUB" && entry.statusCode === "EV") {
          events.push(
            new Event({
              type: "licitation_finished_submission_period",
              createdAt: new Date(),
              licitationId: lic.id,
            })
          );
        }
        else if (lic.statusCode !== "RES" && entry.statusCode === "RES") {
          events.push(
            new Event({
              type: "licitation_resolved",
              createdAt: new Date(),
              licitationId: lic.id,
            })
          );
        }

        const prevAdjLots = lic.lotsAdj;
        lic.update(entry);

        for (const parsedLot of entry.lots) {
          const lot = lots.find(el => el.lot_id === parsedLot.lot_id);

          if (!lot) {
            newLots.push(Lot.fromParsed(parsedLot, lic.id));
          } else {
            if (lot.winning_nif === undefined && parsedLot.winning_nif !== undefined) {
              events.push(
                new Event({
                  createdAt: new Date(),
                  type: "licitation_lot_awarded",
                  licitationId: lic.id,
                  lotId: lot.lot_id.toString(),
                })
              );
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
          events.push(
            new Event({
              createdAt: new Date(),
              type: "licitation_awarded",
              licitationId: lic.id
            })
          );
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
      } else {
        let orgId = org?.id;
        if (!org) {
          orgId = await partyRepo.create(Party.fromParsed(entry.party));
        } else if (org.updated < new Date(entry.party.updated)) {
          org.update(entry.party);
        }
        if (!orgId) {
          console.log("THIS SHOULD NOT HAPPEN");
          continue;
        }

        const lic = Licitation.fromParsedEntry(entry, orgId);
        const licId = await licitationsRepo.create(lic);

        await lotsRepo.create(entry.lots.map(el => Lot.fromParsed(el, licId)));
        await docRepo.create(entry.documents.map(el => Doc.fromParsed(el, licId)));

        events.push(new Event({ createdAt: new Date(), type: "licitation_created", licitationId: licId }));
      }

      await eventRepo.add(events);
    }

    //await cursorRepo.updateCursor(newLastExtracted, newEntries.length);
  } catch (e) {
    console.error(e);
  }
}

async function extractNewEntries(baseUrl: string, lastUpdate: Date) {
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
  let count = 0;
  while (count++ < 3 && next) {
    console.log("Processing", next);
    const res = await fetch(next, {
      method: 'GET',
    });
    const data = await res.text();

    let root: AtomRootRaw = parser.parse(data);

    if (new Date(root.feed.updated) <= lastUpdate) {
      break;
    }

    const newDeletedEntries = parseDeletedEntries(root);
    deletedEntries = deletedEntries.concat(newDeletedEntries);

    const entries = parseEntries(root)
    newEntries = newEntries.concat(
      entries.filter(el => el.cpvs?.some(entryCPV =>
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

executeJob(BASE_FEED_URL);
