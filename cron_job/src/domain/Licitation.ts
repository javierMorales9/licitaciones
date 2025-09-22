import type { ParsedEntry } from "../feedParser.js";

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

