import type { AirtableBase } from "airtable/lib/airtable_base.ts";
import { Lot } from "../domain/Lot.ts";
import type { LotRepository } from "../domain/LotRepository.ts";

export class AirtableLotsRepository implements LotRepository {
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
