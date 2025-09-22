import type { AirtableBase } from "airtable/lib/airtable_base.ts";
import { Licitation } from "../domain/Licitation.ts";
import type { LicitationRepository } from "../domain/LicitationRepository.ts";

export class AirtableLicitationRepository implements LicitationRepository {
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

