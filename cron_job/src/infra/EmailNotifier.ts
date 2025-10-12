import type { Notification, Notifications } from "../domain/Notifications.js";
import type { Notifier } from "../domain/Notifier.js";
import { logger } from "../index.js";

const EVENT_LABELS: Record<string, string> = {
  licitation_created: "Nueva licitación",
  licitation_finished_submission_period: "Fin de plazo de presentación",
  licitation_lot_awarded: "Adjudicación de lote",
  licitation_awarded: "Adjudicación del expediente",
  licitation_resolved: "Licitación resuelta",
};
const eventLabel = (t: string) =>
  EVENT_LABELS[t] ?? EVENT_LABELS[t?.toLowerCase?.()] ?? t;

const STATUS_LABELS: Record<string, string> = {
  ANP: "Anuncio previo",
  ENP: "En plazo",
  EVA: "Evaluación",
  ADJ: "Adjudicada",
  RES: "Resuelta",
  ANU: "Anulada",
};
const statusLabel = (code?: string) => (code ? (STATUS_LABELS[code] ?? code) : "");

// ===== Etiquetas Airtable para LICITACIÓN =====
const FIELD_LABELS: Record<string, string> = {
  // Identificación y metadatos
  entry_id: "ID",
  partyId: "Organismo",
  statusCode: "Código de Estado",
  publishedDate: "Fecha de Publicación",
  updated: "Última actualización",
  title: "Título",
  summary: "Resumen",
  platform_url: "URL de Plataforma",
  // Procurement
  type_code: "Código de Tipo",
  subtype_code: "Código de Subtipo",
  estimated_overall_cost: "Coste Total Estimado",
  cost_with_taxes: "Coste con Impuestos",
  cost_without_taxes: "Coste sin Impuestos",
  cpvs: "CPVs",
  place: "Lugar",
  realized_city: "Ciudad de Realización",
  realized_zip: "Código Postal de Realización",
  realized_country: "País de Realización",
  estimated_duration: "Duración Estimada",
  // Result
  tender_result_code: "Código de Resultado de Licitación",
  award_date: "Fecha de Adjudicación",
  received_tender_quantity: "Cantidad de Ofertas Recibidas",
  lower_tender_amount: "Oferta Más Baja",
  higher_tender_amount: "Oferta Más Alta",
  winning_nif: "NIF Ganador",
  winning_name: "Nombre Ganador",
  winning_city: "Ciudad Ganador",
  winning_zip: "Código Postal Ganador",
  winning_country: "País Ganador",
  award_tax_exclusive: "Adjudicación sin Impuestos",
  award_payable_amount: "Importe a Pagar Adjudicación",
  // Otros
  lotsAdj: "Lotes Adjudicados",
  // TenderingProcess
  procedure_code: "Código de Procedimiento",
  urgency_code: "Código de Urgencia",
  part_presentation_code: "Código de Presentación",
  contracting_system_code: "Código de Sistema de Contratación",
  submission_method_code: "Código de Método de Presentación",
  over_threshold_indicator: "Indicador Sobre Umbral",
  // Fechas límite
  end_availability_period: "Fin Periodo Disponibilidad",
  end_availability_hour: "Hora Fin Disponibilidad",
  end_date: "Fecha de Fin",
  end_hour: "Hora de Fin",
};

// ===== Etiquetas Airtable para LOTE =====
const LOT_FIELD_LABELS: Record<string, string> = {
  lot_id: "ID Lote",
  ext_id: "External Id",
  name: "Nombre",
  cost_with_taxes: "Coste con Impuestos",
  cost_without_taxes: "Coste sin Impuestos",
  cpvs: "CPVs",
  place: "Lugar de Ejecución",
  city: "Ciudad de Realización",
  zip: "Código Postal de Realización",
  country: "País de Realización",
  tender_result_code: "Código de Resultado de Licitación",
  award_date: "Fecha de Adjudicación",
  received_tender_quantity: "Cantidad de Ofertas Recibidas",
  lower_tender_amount: "Oferta Más Baja",
  higher_tender_amount: "Oferta Más Alta",
  winning_nif: "NIF Ganador",
  winning_name: "Nombre Ganador",
  winning_city: "Ciudad Ganador",
  winning_zip: "Código Postal Ganador",
  winning_country: "País Ganador",
  award_tax_exclusive: "Asignación Ganador Sin Impuestos",
  award_payable_amount: "Asignación Ganador Con Impuestos",
};

const esc = (s?: string) =>
  s
    ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    : "";

const fmtMoney = (v: unknown): string | undefined => {
  if (v === null || v === undefined) return;
  const n = typeof v === "number" ? v : Number(String(v).replace(/\./g, "").replace(/,/g, "."));
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (s?: string): string | undefined => {
  if (!s) return;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return s;
  return new Date(t).toLocaleDateString("es-ES");
};

const prettyChanges = (
  changes: Record<string, unknown>,
  labelMap: Record<string, string>
): { key: string; value: string }[] => {
  const toStr = (v: any) => {
    if (Array.isArray(v)) return v.join(", ");
    if (v instanceof Date) return v.toISOString();
    return v === undefined || v === null ? "" : String(v);
  };
  return Object.entries(changes)
    .filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => ({ key: labelMap[k] ?? k, value: toStr(v) }));
};

const lotSummaryLines = (lot: any): string[] => {
  const lines: string[] = [];
  if (lot.name) lines.push(`${LOT_FIELD_LABELS.name}: ${lot.name}`);
  if (lot.lot_id) lines.push(`${LOT_FIELD_LABELS.lot_id}: ${lot.lot_id}`);
  if (lot.ext_id) lines.push(`${LOT_FIELD_LABELS.ext_id}: ${lot.ext_id}`);
  if (lot.winning_name || lot.winning_nif) {
    const who = [lot.winning_name, lot.winning_nif ? `(${lot.winning_nif})` : ""].filter(Boolean).join(" ");
    lines.push(`${LOT_FIELD_LABELS.winning_name}: ${who}`);
  }
  if (lot.award_date) lines.push(`${LOT_FIELD_LABELS.award_date}: ${fmtDate(lot.award_date)}`);
  if (lot.award_payable_amount ?? lot.cost_with_taxes ?? lot.cost_without_taxes) {
    const total =
      fmtMoney(lot.award_payable_amount) ??
      fmtMoney(lot.cost_with_taxes) ??
      fmtMoney(lot.cost_without_taxes);
    if (total) lines.push(`Importe: ${total} €`);
  }
  if (lot.cpvs && (Array.isArray(lot.cpvs) ? lot.cpvs.length : String(lot.cpvs).trim())) {
    lines.push(`${LOT_FIELD_LABELS.cpvs}: ${Array.isArray(lot.cpvs) ? lot.cpvs.join(", ") : String(lot.cpvs)}`);
  }
  if (lot.city || lot.country) {
    const lugar = [lot.city, lot.country].filter(Boolean).join(", ");
    lines.push(`Lugar: ${lugar}`);
  }
  return lines;
};

export class EmailNotifier implements Notifier {
  async send(notif: Notifications) {
    if (!process.env.MAKE_WEBHOOK || !process.env.MAKE_API_KEY) return;

    const items = notif.toArray().map((n: Notification) => n.toEmailItem());

    if (!items.length) return;

    const totalExp = items.length;
    const totalEv = items.reduce((a, n) => a + (n.events?.length || 0), 0);
    const totalLots = items.reduce((a, n) => a + (n.awardedLots?.length || 0), 0);
    const totalDocs = items.reduce((a, n) => a + (n.newDocs?.length || 0), 0);

    const dateStr = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
    const subject =
      `Licitaciones — ${totalExp} expediente${totalExp === 1 ? "" : "s"}, ` +
      `${totalEv} evento${totalEv === 1 ? "" : "s"}, ` +
      `${totalLots} lote${totalLots === 1 ? "" : "s"} adjudicado${totalLots === 1 ? "" : "s"}, ` +
      `${totalDocs} documento${totalDocs === 1 ? "" : "s"} — ${dateStr}`;

    // ===== Texto plano =====
    let text = `Resumen diario de licitaciones — ${totalExp} expediente(s), ${totalEv} evento(s), ${totalLots} lote(s) adjudicado(s), ${totalDocs} documento(s)\n\n`;
    for (const n of items) {
      text += `• ${n.licitationTitle ?? "(Sin título)"}\n`;
      if (n.licitationPlatformUrl) text += `  URL: ${n.licitationPlatformUrl}\n`;
      if (n.licitationStatusCode) text += `  Estado: ${statusLabel(n.licitationStatusCode)}\n`;
      if (n.licitationExternalId) text += `  Ref: ${n.licitationExternalId}\n`;

      // Eventos
      for (const ev of n.events || []) {
        const bits = [ev.lotName ? `lote: ${ev.lotName}` : "", ev.lotLotId ? `ID lote: ${ev.lotLotId}` : ""]
          .filter(Boolean)
          .join(" — ");
        text += `  - ${eventLabel(ev.type)}${bits ? ` (${bits})` : ""}\n`;
      }

      // Cambios (con etiquetas Airtable)
      const changesArr = prettyChanges(n.changes ?? {}, FIELD_LABELS);
      if (changesArr.length) {
        text += `  Cambios:\n`;
        for (const c of changesArr) text += `    · ${c.key}: ${c.value}\n`;
      } else if (n.isNew) {
        const newFields = prettyChanges(n.changes ?? {}, FIELD_LABELS);
        if (newFields.length) {
          text += `  Campos iniciales:\n`;
          for (const c of newFields) text += `    · ${c.key}: ${c.value}\n`;
        }
      }

      // Lotes adjudicados
      if (n.awardedLots?.length) {
        text += `  Lotes adjudicados (${n.awardedLots.length}):\n`;
        for (const lot of n.awardedLots) {
          const lines = lotSummaryLines(lot);
          text += `    - ${lines.shift() ?? "(Lote)"}\n`;
          for (const ln of lines) text += `      ${ln}\n`;
        }
      }

      // Nuevos documentos
      if (n.newDocs?.length) {
        text += `  Nuevos documentos (${n.newDocs.length}):\n`;
        for (const d of n.newDocs) {
          const label = d.type ? `${d.name} (${d.type})` : d.name;
          text += `    - ${label}: ${d.url}\n`;
        }
      }

      text += `\n`;
    }
    text = text.trimEnd();

    // ===== HTML =====
    const lotHtml = (lot: any) => {
      const lines = lotSummaryLines(lot);
      if (!lines.length) return "";
      return `
        <li style="margin:6px 0;">
          <div>${esc(lines[0])}</div>
          ${lines.slice(1).length
          ? `<ul style="margin:4px 0 0 16px;padding:0;">
                   ${lines.slice(1).map(l => `<li style="margin:2px 0;">${esc(l)}</li>`).join("")}
                 </ul>`
          : ""
        }
        </li>`;
    };

    let rows = "";
    for (const n of items) {
      const evsHtml = (n.events || [])
        .map((ev) => {
          const bits = [
            ev.lotName ? `lote: ${esc(ev.lotName)}` : "",
            ev.lotLotId ? `ID lote: ${esc(ev.lotLotId)}` : "",
          ].filter(Boolean).join(" — ");
          return `<li style="margin:4px 0">${esc(eventLabel(ev.type))}${bits ? ` (${bits})` : ""}</li>`;
        })
        .join("");

      const chg = prettyChanges(n.changes ?? {}, FIELD_LABELS);
      const chgHtml = chg.length
        ? `<div style="font-size:13px;margin:8px 0 10px;">
             <div style="font-weight:600;margin-bottom:4px;">Cambios:</div>
             <ul style="padding-left:18px;margin:0;">
               ${chg.map((c) => `<li style="margin:3px 0;"><span style="color:#475569">${esc(c.key)}:</span> ${esc(c.value)}</li>`).join("")}
             </ul>
           </div>`
        : "";

      const lotsHtml = n.awardedLots?.length
        ? `<div style="font-size:13px;margin:8px 0 10px;">
             <div style="font-weight:600;margin-bottom:4px;">Lotes adjudicados (${n.awardedLots.length}):</div>
             <ul style="padding-left:18px;margin:0;">
               ${n.awardedLots.map(lotHtml).join("")}
             </ul>
           </div>`
        : "";

      const docsHtml = n.newDocs?.length
        ? `<div style="font-size:13px;margin:8px 0 10px;">
             <div style="font-weight:600;margin-bottom:4px;">Nuevos documentos (${n.newDocs.length}):</div>
             <ul style="padding-left:18px;margin:0;">
               ${n.newDocs
          .map(
            (d) =>
              `<li style="margin:3px 0;">
                        <a href="${esc(d.url)}" style="text-decoration:none;">${esc(d.name)}</a>${d.type ? ` <span style="color:#64748b">(${esc(d.type)})</span>` : ""
              }
                      </li>`
          )
          .join("")}
             </ul>
           </div>`
        : "";

      const statusText = n.licitationStatusCode ? `Estado: ${esc(statusLabel(n.licitationStatusCode))} · ` : "";

      rows += `
      <tr>
        <td style="padding:16px;border-top:1px solid #e2e8f0;">
          <div style="font-size:16px;font-weight:600;line-height:1.4;">${esc(n.licitationTitle) || "(Sin título)"}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">
            ${statusText}${n.licitationExternalId ? `Ref: ${esc(n.licitationExternalId)}` : ""}
          </div>
          ${(n.events?.length ?? 0) ? `<ul style="padding-left:18px;margin:10px 0 12px;">${evsHtml}</ul>` : ""}
          ${chgHtml}
          ${lotsHtml}
          ${docsHtml}
          ${n.licitationPlatformUrl
          ? `<a href="${esc(n.licitationPlatformUrl)}" style="display:inline-block;padding:10px 14px;text-decoration:none;border-radius:8px;border:1px solid #e2e8f0;">Ver en plataforma</a>`
          : ""
        }
        </td>
      </tr>`;
    }

    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <body style="margin:0;padding:0;background:#f8fafc;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 0;">
        <tr><td align="center">
          <table width="680" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;background:#0f172a;color:#e2e8f0;">
                <div style="font-size:18px;font-weight:700;">${esc(
      `Resumen diario de licitaciones — ${totalExp} expedientes, ${totalEv} eventos, ${totalLots} lotes adjudicados, ${totalDocs} documentos`
    )}</div>
                <div style="font-size:12px;opacity:.85;">${new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</div>
              </td>
            </tr>
            ${rows || `<tr><td style="padding:24px;">No se han detectado cambios.</td></tr>`}
            <tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">Envío automático.</td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

    const res = await fetch(process.env.MAKE_WEBHOOK!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-make-apikey": process.env.MAKE_API_KEY!,
      },
      body: JSON.stringify({ subject, text, html }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      console.error(`Webhook error (${res.status}): ${msg}`);
    }
  }
}
