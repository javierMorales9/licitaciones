import { Event, EventType } from "../domain/Event";
import { Licitation } from "../domain/Licitation";
import { Lot } from "../domain/Lot";
import { Party } from "../domain/Party";
import { expect } from "@jest/globals"

function normAmount(v: string | number | undefined | null): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function normBoolish(v: boolean | string | undefined | null): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v).trim().toLowerCase();
}

function normCpvs(arr?: string[] | null): string[] | undefined {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return undefined;
  return [...arr].sort();
}

function normStr(v: string | undefined | null): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function normEmail(v: string | undefined | null): string | undefined {
  const s = normStr(v);
  return s ? s.toLowerCase() : undefined;
}

function normCountryCode(v: string | undefined | null): string | undefined {
  const s = normStr(v);
  return s ? s.toUpperCase() : undefined;
}

function normDate(v: Date | string | undefined | null): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

function normLotId(v: string | number | undefined | null): string | undefined {
  if (v == null) return undefined;
  return String(v).trim();
}

function lotKey(l: Lot): string {
  const a = normStr(l.ext_id);
  if (a) return a;
  const b = `${normStr(l.licitationId) ?? ""}:${normLotId(l.lot_id) ?? ""}`;
  return b;
}

function normType(v: EventType | string | undefined | null): string | undefined {
  if (v == null) return undefined;
  return String(v).trim();
}

export function compareLicitation(actual: Licitation | null, expected: Licitation | null) {
  if (actual === null) {
    expect(expected).toBeNull();
    return;
  }
  expect(expected).not.toBeNull();
  if (expected === null) return;

  const norm = (l: Licitation) => ({
    id: l.id ?? undefined,
    entry_id: l.entry_id,
    partyId: l.partyId,
    statusCode: l.statusCode ?? undefined,
    publishedDate: l.publishedDate ?? undefined,
    updated: l.updated,

    title: l.title ?? undefined,
    summary: l.summary ?? undefined,
    platform_url: l.platform_url ?? undefined,

    type_code: l.type_code ?? undefined,
    subtype_code: l.subtype_code ?? undefined,
    estimated_overall_cost: l.estimated_overall_cost,
    cost_with_taxes: l.cost_with_taxes,
    cost_without_taxes: l.cost_without_taxes,
    cpvs: normCpvs(l.cpvs),
    place: l.place ?? undefined,
    realized_city: l.realized_city ?? undefined,
    realized_zip: l.realized_zip ?? undefined,
    realized_country: l.realized_country ?? undefined,
    estimated_duration: l.estimated_duration ?? undefined,

    tender_result_code: l.tender_result_code ?? undefined,
    award_date: l.award_date ?? undefined,
    received_tender_quantity: l.received_tender_quantity,
    lower_tender_amount: l.lower_tender_amount,
    higher_tender_amount: l.higher_tender_amount,
    winning_nif: l.winning_nif ?? undefined,
    winning_name: l.winning_name ?? undefined,
    winning_city: l.winning_city ?? undefined,
    winning_zip: l.winning_zip ?? undefined,
    winning_country: l.winning_country ?? undefined,
    award_tax_exclusive: l.award_tax_exclusive,
    award_payable_amount: l.award_payable_amount,

    lotsAdj: l.lotsAdj ?? 0,

    procedure_code: l.procedure_code ?? undefined,
    urgency_code: l.urgency_code ?? undefined,
    part_presentation_code: l.part_presentation_code ?? undefined,
    contracting_system_code: l.contracting_system_code ?? undefined,
    submission_method_code: l.submission_method_code ?? undefined,
    over_threshold_indicator: l.over_threshold_indicator,

    end_availability_period: l.end_availability_period ?? undefined,
    end_availability_hour: l.end_availability_hour ?? undefined,
    end_date: l.end_date ?? undefined,
    end_hour: l.end_hour ?? undefined,
  });

  expect(norm(actual)).toEqual(norm(expected));
}

function normLot(l: Lot) {
  return {
    id: l.id ?? undefined,
    lot_id: l.lot_id,
    ext_id: l.ext_id,
    name: l.name,
    licitationId: l.licitationId,

    cost_with_taxes: l.cost_with_taxes,
    cost_without_taxes: l.cost_without_taxes,
    cpvs: normCpvs(l.cpvs),

    place: l.place,
    city: l.city,
    zip: l.zip,
    country: l.country,

    tender_result_code: l.tender_result_code,
    award_date: l.award_date,
    received_tender_quantity: l.received_tender_quantity,
    lower_tender_amount: l.lower_tender_amount,
    higher_tender_amount: l.higher_tender_amount,

    winning_nif: l.winning_nif,
    winning_name: l.winning_name,
    winning_city: l.winning_city,
    winning_zip: l.winning_zip,
    winning_country: l.winning_country,

    award_tax_exclusive: l.award_tax_exclusive,
    award_payable_amount: l.award_payable_amount,
  };
}

export function compareLots(actual: Lot[], expected: Lot[]) {
  expect(Array.isArray(actual)).toBe(true);
  expect(Array.isArray(expected)).toBe(true);

  expect(actual.length).toBe(expected.length);

  // Stable order by key so taht the insertion order doesn't affect the comparison
  const sortByKey = (a: Lot, b: Lot) => lotKey(a).localeCompare(lotKey(b));
  const normActual = [...actual].sort(sortByKey).map(normLot);
  const normExpected = [...expected].sort(sortByKey).map(normLot);

  expect(normActual).toEqual(normExpected);
}

export function compareParty(actual: Party | null, expected: Party | null) {
  if (actual === null) {
    expect(expected).toBeNull();
    return;
  }
  expect(expected).not.toBeNull();
  if (expected === null) return;

  const norm = (p: Party) => ({
    id: p.id ?? undefined,
    nif: p.nif,
    updated: p.updated,

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

  expect(norm(actual)).toEqual(norm(expected));
}

function eventKey(e: Event): string {
  const lic = normStr(e.licitationId) ?? "";
  const lot = normStr(e.lotId) ?? "";
  const typ = normType(e.type) ?? "";
  const ts = normDate(e.createdAt)?.toISOString() ?? "";
  return `${lic}|${lot}|${typ}|${ts}`;
}

function normEvent(e: Event) {
  return {
    licitationId: e.licitationId!,
    lotId: e.lotId,
    type: e.type!,
    createdAt: e.createdAt!,
  };
}

export function compareEvents(actual: Event[], expected: Event[]) {
  expect(Array.isArray(actual)).toBe(true);
  expect(Array.isArray(expected)).toBe(true);

  expect(actual.length).toBe(expected.length);

  const sortByKey = (a: Event, b: Event) => eventKey(a).localeCompare(eventKey(b));
  const normActual = [...actual].sort(sortByKey).map(normEvent);
  const normExpected = [...expected].sort(sortByKey).map(normEvent);

  expect(normActual).toEqual(normExpected);
}
