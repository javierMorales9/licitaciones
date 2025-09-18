import type { ParsedLot } from "./feedParser.js";

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

