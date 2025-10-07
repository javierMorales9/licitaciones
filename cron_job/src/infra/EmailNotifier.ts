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

// Por si llega en otro casing
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

// convertir objeto de cambios en pares legibles
const prettyChanges = (changes: Record<string, unknown>): { key: string; value: string }[] => {
  const toStr = (v: any) => {
    if (Array.isArray(v)) return v.join(", ");
    if (v instanceof Date) return v.toISOString();
    return v === undefined || v === null ? "" : String(v);
  };
  return Object.entries(changes)
    .filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => ({ key: k, value: toStr(v) }));
};

const esc = (s?: string) =>
  s
    ? s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
    : "";

export class EmailNotifier implements Notifier {
  constructor() { }

  async send(notif: Notifications) {
    if (!process.env.MAKE_WEBHOOK || !process.env.MAKE_API_KEY) {
      logger.error("Make webhook not available");
      return;
    }

    // Adaptar cada Notification → item de email con cambios
    const items = notif.toArray().map((n: Notification) => n.toEmailItem());

    if (!items.length) {
      // si no hay eventos ni cambios, no se envía
      logger.debug({ items: items.length }, "No licitation");
      return;
    }

    const totalExp = items.length;
    const totalEv = items.reduce((a, n) => a + (n.events?.length || 0), 0);
    const dateStr = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const subject = `Licitaciones — ${totalExp} expediente${totalExp === 1 ? "" : "s"}, ${totalEv} evento${totalEv === 1 ? "" : "s"} — ${dateStr}`;

    // ===== Texto plano =====
    let text = `Resumen diario de licitaciones — ${totalExp} expediente(s), ${totalEv} evento(s)\n\n`;
    for (const n of items) {
      text += `• ${n.licitationTitle ?? "(Sin título)"}\n`;
      if (n.licitationPlatformUrl) text += `  URL: ${n.licitationPlatformUrl}\n`;
      if (n.licitationStatusCode) text += `  Estado: ${statusLabel(n.licitationStatusCode)}\n`;
      if (n.licitationExternalId) text += `  Ref: ${n.licitationExternalId}\n`;

      const evs = n.events || [];
      for (const ev of evs) {
        const bits = [ev.lotName ? `lote: ${ev.lotName}` : "", ev.lotLotId ? `ID lote: ${ev.lotLotId}` : ""]
          .filter(Boolean)
          .join(" — ");
        text += `  - ${eventLabel(ev.type)}${bits ? ` (${bits})` : ""}\n`;
      }

      const changesArr = prettyChanges(n.changes ?? {});
      if (changesArr.length) {
        text += `  Cambios:\n`;
        for (const c of changesArr) {
          text += `    · ${c.key}: ${c.value}\n`;
        }
      } else if (n.isNew) {
        // Si es nueva y no hubo diff (porque lo consideraste nueva), ya se incluyeron todos los campos en changes
        // pero por seguridad:
        const newFields = prettyChanges(n.changes ?? {});
        if (newFields.length) {
          text += `  Campos iniciales:\n`;
          for (const c of newFields) {
            text += `    · ${c.key}: ${c.value}\n`;
          }
        }
      }

      text += `\n`;
    }
    text = text.trimEnd();

    // ===== HTML =====
    let rows = "";
    for (const n of items) {
      const evsHtml = (n.events || [])
        .map((ev) => {
          const bits = [
            ev.lotName ? `lote: ${esc(ev.lotName)}` : "",
            ev.lotLotId ? `ID lote: ${esc(ev.lotLotId)}` : "",
          ]
            .filter(Boolean)
            .join(" — ");
          return `<li style="margin:4px 0">${esc(eventLabel(ev.type))}${bits ? ` (${bits})` : ""}</li>`;
        })
        .join("");

      const chg = prettyChanges(n.changes ?? {});
      const chgHtml = chg.length
        ? `<div style="font-size:13px;margin:6px 0 10px;">
             <div style="font-weight:600;margin-bottom:4px;">Cambios:</div>
             <ul style="padding-left:18px;margin:0;">
               ${chg
          .map(
            (c) => `<li style="margin:3px 0;"><span style="color:#475569">${esc(c.key)}:</span> ${esc(c.value)}</li>`
          )
          .join("")}
             </ul>
           </div>`
        : "";

      const statusText = n.licitationStatusCode
        ? `Estado: ${esc(statusLabel(n.licitationStatusCode))} · `
        : "";

      rows += `
      <tr>
        <td style="padding:16px;border-top:1px solid #e2e8f0;">
          <div style="font-size:16px;font-weight:600;line-height:1.4;">${esc(n.licitationTitle) || "(Sin título)"}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">
            ${statusText}${n.licitationExternalId ? `Ref: ${esc(n.licitationExternalId)}` : ""}
          </div>
          ${evsHtml ? `<ul style="padding-left:18px;margin:10px 0 12px;">${evsHtml}</ul>` : ""}
          ${chgHtml}
          ${n.licitationPlatformUrl
          ? `<a href="${esc(
            n.licitationPlatformUrl
          )}" style="display:inline-block;padding:10px 14px;text-decoration:none;border-radius:8px;border:1px solid #e2e8f0;">Ver en plataforma</a>`
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
      `Resumen diario de licitaciones — ${totalExp} expedientes, ${totalEv} eventos`
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

    const res = await fetch(process.env.MAKE_WEBHOOK, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-make-apikey": process.env.MAKE_API_KEY,
      },
      body: JSON.stringify({ subject, text, html }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      logger.error({ status: res.status, msg }, "Webhook error");
    }
  }
}
