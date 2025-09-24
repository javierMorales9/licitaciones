import type { Notifications } from "../domain/Notifications.js";
import type { Notifier } from "../domain/Notifier.js";

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

export class EmailNotifier implements Notifier {
  private notif: Notifications;

  constructor(notif: Notifications) {
    this.notif = notif;
  }

  async send() {
    if (!process.env.MAKE_WEBHOOK || !process.env.MAKE_API_KEY) {
      return;
    }

    const list = this.notif.toArray() as Array<{
      licitationId: string;
      licitationExternalId: string;
      licitationPlatformUrl?: string;
      licitationStatusCode?: string;
      licitationTitle?: string;
      events: Array<{ type: string; lotId?: string; lotLotId?: string; lotName?: string }>;
    }>;

    if (!list.length || list.every(n => !n.events?.length)) return;

    const LABELS: Record<string, string> = {
      NEW_TENDER: "Nueva licitación",
      STATUS_CHANGED: "Cambio de estado",
      DEADLINE_UPDATED: "Actualización de plazo",
      AMOUNT_CHANGED: "Actualización de importes",
      DELETED_ENTRY: "Eliminada",
    };
    const label = (t: string) => LABELS[t] ?? t;
    const esc = (s?: string) =>
      s ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";

    const totalExp = list.length;
    const totalEv = list.reduce((a, n) => a + (n.events?.length || 0), 0);
    const dateStr = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
    const subject = `Licitaciones — ${totalExp} expediente${totalExp === 1 ? "" : "s"}, ${totalEv} evento${totalEv === 1 ? "" : "s"} — ${dateStr}`;

    // Texto plano
    let text = `Resumen diario de licitaciones — ${totalExp} expediente(s), ${totalEv} evento(s)\n\n`;
    for (const n of list) {
      text += `• ${n.licitationTitle ?? "(Sin título)"}\n`;
      if (n.licitationPlatformUrl) text += `  URL: ${n.licitationPlatformUrl}\n`;
      if (n.licitationStatusCode) text += `  Estado: ${statusLabel(n.licitationStatusCode)}\n`;
      if (n.licitationExternalId) text += `  Ref: ${n.licitationExternalId}\n`;
      for (const ev of n.events || []) {
        const bits = [ev.lotName ? `lote: ${ev.lotName}` : "", ev.lotLotId ? `ID lote: ${ev.lotLotId}` : ""]
          .filter(Boolean)
          .join(" — ");
        text += `  - ${eventLabel(ev.type)}${bits ? ` (${bits})` : ""}\n`;
      }
      text += `\n`;
    }
    text = text.trimEnd();

    // HTML
    let rows = "";
    for (const n of list) {
      const evs = (n.events || [])
        .map(ev => {
          const bits = [
            ev.lotName ? `lote: ${esc(ev.lotName)}` : "",
            ev.lotLotId ? `ID lote: ${esc(ev.lotLotId)}` : "",
          ].filter(Boolean).join(" — ");
          return `<li style="margin:4px 0">${esc(eventLabel(ev.type))}${bits ? ` (${bits})` : ""}</li>`;
        })
        .join("");

      const statusText = n.licitationStatusCode ? `Estado: ${esc(statusLabel(n.licitationStatusCode))} · ` : "";

      rows += `
      <tr>
        <td style="padding:16px;border-top:1px solid #e2e8f0;">
          <div style="font-size:16px;font-weight:600;line-height:1.4;">${esc(n.licitationTitle) || "(Sin título)"}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">
            ${statusText}${n.licitationExternalId ? `Ref: ${esc(n.licitationExternalId)}` : ""}
          </div>
          <ul style="padding-left:18px;margin:10px 0 12px;">${evs}</ul>
          ${n.licitationPlatformUrl ? `<a href="${esc(n.licitationPlatformUrl)}" style="display:inline-block;padding:10px 14px;text-decoration:none;border-radius:8px;border:1px solid #e2e8f0;">Ver en plataforma</a>` : ""}
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
                <div style="font-size:18px;font-weight:700;">${esc(`Resumen diario de licitaciones — ${totalExp} expedientes, ${totalEv} eventos`)}</div>
                <div style="font-size:12px;opacity:.85;">${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
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
      console.error(`Webhook error (${res.status}): ${msg}`);
    }
  }
}
