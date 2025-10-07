import type { Event } from "../domain/Event.js";
import type { Licitation } from "../domain/Licitation.js";
import type { Lot } from "../domain/Lot.js";
import type { Doc } from "../domain/Doc.js";
import type { ParsedEntry } from "../feedParser.js";

export class Notification {
  private licitation?: Licitation;
  private newLicData: ParsedEntry;
  private awardedLots: Lot[];
  private newDocs?: Doc[];
  private events: {
    type: string;
    lotId?: string;
    lotLotId?: string;
    lotName?: string;
  }[] = [];

  private finishedSubmissionPeriod?: boolean;
  private resolved?: boolean;
  private awarded?: boolean;

  constructor(newData: ParsedEntry) {
    this.newLicData = newData;
    this.awardedLots = [];
  }

  addPrevLic(lic: Licitation) {
    this.licitation = lic;
  }

  addEvent(e: Event, lot?: Lot) {
    this.events.push({
      type: e.type,
      lotId: lot?.id,
      lotLotId: lot?.lot_id?.toString(),
      lotName: lot?.name,
    });
  }

  addNewDocs(docs: Doc[]) {
    this.newDocs = docs;
  }

  addAwardedLot(awardedLot: Lot) {
    this.awardedLots.push(awardedLot);
  }

  finishSubmissionPeriod() {
    this.finishedSubmissionPeriod = true;
  }
  resolve() {
    this.resolved = true;
  }
  award() {
    this.awarded = true;
  }

  /**
   * Devuelve true si no existe versión previa de la licitación.
   */
  isNew(): boolean {
    return !this.licitation;
  }

  /**
   * Devuelve los cambios de campos entre la versión previa y la nueva.
   * Si no hay versión previa, devuelve todos los campos definidos en la nueva.
   */
  getLicitationChanges(): Partial<Licitation> {
    const FIELDS: Array<keyof Licitation> = [
      // Identificación y metadatos
      "id", "entry_id", "partyId", "statusCode", "publishedDate", "updated",
      "title", "summary", "platform_url",
      // Procurement
      "type_code", "subtype_code", "estimated_overall_cost", "cost_with_taxes", "cost_without_taxes",
      "cpvs", "place", "realized_city", "realized_zip", "realized_country", "estimated_duration",
      // Result
      "tender_result_code", "award_date", "received_tender_quantity", "lower_tender_amount",
      "higher_tender_amount", "winning_nif", "winning_name", "winning_city", "winning_zip",
      "winning_country", "award_tax_exclusive", "award_payable_amount",
      // Otros
      "lotsAdj",
      // TenderingProcess
      "procedure_code", "urgency_code", "part_presentation_code", "contracting_system_code",
      "submission_method_code", "over_threshold_indicator",
      // Fechas límite
      "end_availability_period", "end_availability_hour", "end_date", "end_hour",
    ];

    const result: Partial<Licitation> = {};

    // Si no hay licitación previa → devolver todo lo definido en newLicData (normalizado)
    if (!this.licitation) {
      for (const f of FIELDS) {
        const v = (this.newLicData as any)[f];
        if (v !== undefined && v !== null) {
          (result as any)[f] = this.normalizeField(f, v);
        }
      }
      return result;
    }

    // Con licitación previa → comparar sólo lo que llega definido en newLicData
    for (const f of FIELDS) {
      const prev = (this.licitation as any)[f];
      const incomingRaw = (this.newLicData as any)[f];
      if (incomingRaw === undefined || incomingRaw === null) continue;

      const incoming = this.normalizeField(f, incomingRaw);
      if (!this.equalsField(f, prev, incoming)) {
        (result as any)[f] = incoming;
      }
    }

    return result;
  }

  /**
   * Objeto “DTO” para el email.
   */
  toEmailItem() {
    const changes = this.getLicitationChanges();
    // Determinar título/URL/estado desde newData (preferente) o desde previa
    const title = (this.newLicData as any).title ?? this.licitation?.title ?? "";
    const platform_url =
      (this.newLicData as any).platform_url ?? this.licitation?.platform_url ?? "";
    const statusCode =
      (this.newLicData as any).statusCode ?? this.licitation?.statusCode ?? undefined;

    const licitationExternalId =
      (this.newLicData as any).entry_id ?? this.licitation?.entry_id ?? "";

    const licitationId =
      this.licitation?.id ?? (this.newLicData as any).id ?? licitationExternalId;

    return {
      licitationId: String(licitationId ?? licitationExternalId),
      licitationExternalId: String(licitationExternalId ?? ""),
      licitationPlatformUrl: platform_url || undefined,
      licitationStatusCode: statusCode,
      licitationTitle: String(title || ""),
      events: this.events.slice(),
      // añadido: cambios de campos
      changes,
      isNew: this.isNew(),
    };
  }

  // ===== Helpers =====

  private equalsField(field: keyof Licitation, a: any, b: any): boolean {
    const na = this.normalizeField(field, a);
    const nb = this.normalizeField(field, b);

    if (field === "cpvs") {
      const sa = Array.isArray(na) ? Array.from(new Set(na.map(String))).sort() : [];
      const sb = Array.isArray(nb) ? Array.from(new Set(nb.map(String))).sort() : [];
      if (sa.length !== sb.length) return false;
      for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
      return true;
    }

    if (field === "updated" || this.looksLikeDateField(field)) {
      const ta = this.toTime(na);
      const tb = this.toTime(nb);
      return ta === tb;
    }

    if (field === "over_threshold_indicator") {
      return this.toBool(na) === this.toBool(nb);
    }

    if (this.isNumericField(field)) {
      const an = this.toNumber(na);
      const bn = this.toNumber(nb);
      const aNum = Number.isFinite(an) ? an : undefined;
      const bNum = Number.isFinite(bn) ? bn : undefined;
      return aNum === bNum;
    }

    return this.safeStr(na) === this.safeStr(nb);
  }

  private normalizeField(field: keyof Licitation, val: any): any {
    if (val === undefined || val === null) return val;

    if (field === "cpvs") {
      return Array.isArray(val)
        ? Array.from(new Set(val.map((x) => String(x).trim()))).filter(Boolean)
        : [];
    }

    if (field === "updated" || this.looksLikeDateField(field)) {
      const t = this.toTime(val);
      return t !== undefined ? new Date(t) : val;
    }

    if (field === "over_threshold_indicator") {
      return this.toBool(val);
    }

    if (this.isNumericField(field)) {
      const n = this.toNumber(val);
      return Number.isFinite(n) ? n : val;
    }

    if (typeof val === "string") return val.trim();
    return val;
  }

  private isNumericField(field: keyof Licitation): boolean {
    return new Set<keyof Licitation>([
      "type_code", "subtype_code", "estimated_overall_cost", "cost_with_taxes", "cost_without_taxes",
      "tender_result_code", "received_tender_quantity", "lower_tender_amount", "higher_tender_amount",
      "award_tax_exclusive", "award_payable_amount", "lotsAdj",
      "procedure_code", "urgency_code", "part_presentation_code", "contracting_system_code", "submission_method_code",
    ]).has(field);
  }

  private looksLikeDateField(field: keyof Licitation): boolean {
    return new Set<keyof Licitation>([
      "publishedDate", "award_date", "end_availability_period", "end_date",
    ]).has(field);
  }

  private toNumber(v: any): number {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const s = v.trim().replace(/\s+/g, "").replace(/\./g, "").replace(/,/g, ".");
      return Number(s);
    }
    return Number(v);
  }

  private toBool(v: any): boolean | undefined {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true" || s === "1" || s === "sí" || s === "si") return true;
      if (s === "false" || s === "0" || s === "no") return false;
    }
    if (typeof v === "number") return v !== 0;
    return undefined;
  }

  private toTime(v: any): number | undefined {
    if (v instanceof Date) return v.getTime();
    if (typeof v === "string") {
      const t = Date.parse(v);
      return Number.isNaN(t) ? undefined : t;
    }
    return undefined;
  }

  private safeStr(v: any): string {
    if (v === undefined) return "␀undefined";
    if (v === null) return "␀null";
    if (typeof v === "object") {
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
  }
}

export class Notifications {
  private notifications: Notification[];

  constructor() {
    this.notifications = [];
  }

  add(notification: Notification) {
    this.notifications.push(notification);
  }

  toArray(): Notification[] {
    return this.notifications.slice();
  }
}
