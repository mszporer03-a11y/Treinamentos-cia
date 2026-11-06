import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// ──────────────────────────────────────────────────────────────────────────
// Envio de e-mails da Intranet (Passo 4 e Passo 8 do escopo)
// Configuração via variáveis de ambiente:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, (SMTP_SECURE)
// Sem SMTP_HOST configurado os e-mails não são enviados (apenas logados).
// ──────────────────────────────────────────────────────────────────────────

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export function appUrl(path = "/") {
  const base = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(opts: { heading: string; bodyHtml: string; buttonLabel: string; buttonUrl: string }) {
  const logo = appUrl("/logo.png");
  return `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#eceff1;font-family:Segoe UI,Arial,sans-serif;color:#333">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid #b71c1c;border-radius:8px;padding:24px;text-align:center">
    <img src="${logo}" alt="Companhia do Churrasco" width="180" style="display:block;margin:0 auto 12px;max-width:180px">
    <h2 style="color:#b71c1c;font-size:18px;margin:12px 0 16px">${opts.heading}</h2>
    ${opts.bodyHtml}
    <a href="${opts.buttonUrl}" style="display:inline-block;margin-top:16px;background:#b71c1c;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:bold">${opts.buttonLabel}</a>
    <p style="font-size:12px;color:#999;margin-top:24px">Intranet Companhia do Churrasco — mensagem automática, não responda este e-mail.</p>
  </div>
</body></html>`;
}

export async function sendEmail(to: string | string[], subject: string, html: string) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  const t = getTransporter();
  if (!t) {
    console.warn(`[email] SMTP não configurado — e-mail "${subject}" não enviado para ${recipients.length} destinatário(s)`);
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "intranet@localhost";
  // Um envio por destinatário para não expor os e-mails dos franqueados entre si
  const results = await Promise.allSettled(
    recipients.map((addr) => t.sendMail({ from, to: addr, subject, html }))
  );
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[email] falha ao enviar para ${recipients[i]}:`, r.reason);
  });
}

// Passo 4 — Alerta de novo conteúdo publicado
export function newContentEmail(title: string) {
  return {
    subject: "ATENÇÃO, COMUNICADO IMPORTANTE DO COMPANHIA DO CHURRASCO",
    html: layout({
      heading: "ATENÇÃO, COMUNICADO IMPORTANTE DO COMPANHIA DO CHURRASCO. . .",
      bodyHtml: `<p>Olá! Há uma novidade na Intranet.</p>
        <p>Um novo conteúdo foi publicado${title ? `: <strong>${escapeHtml(title)}</strong>` : ""}. Acesse o sistema para verificar e ficar ciente das atualizações.</p>`,
      buttonLabel: "🔗 Acessar Intranet",
      buttonUrl: appUrl("/gallery"),
    }),
  };
}

// Passo 8 — Admin abriu o chat emergencial
export function emergencyChatEmail(adminName: string, message: string) {
  return {
    subject: "CONTATO INDIVIDUAL EMERGENCIAL — Companhia do Churrasco",
    html: layout({
      heading: "CONTATO INDIVIDUAL EMERGENCIAL",
      bodyHtml: `<p><strong>${escapeHtml(adminName)} (Admin Franquia)</strong> lhe enviou a seguinte mensagem pela intranet. Por favor, responda imediatamente:</p>
        <div style="background:#f9f9f9;border-left:4px solid #b71c1c;padding:15px;margin:15px 0;font-style:italic;text-align:left;color:#555;white-space:pre-wrap">${escapeHtml(message)}</div>`,
      buttonLabel: "💬 Acessar Chat para Responder",
      buttonUrl: appUrl("/chat"),
    }),
  };
}

// Aviso aos administradores de nova solicitação aberta pelo franqueado
export function newRequestEmail(franchiseeName: string, storeNames: string, message: string) {
  return {
    subject: `Nova solicitação na Intranet — ${franchiseeName}`,
    html: layout({
      heading: "NOVA SOLICITAÇÃO DE FRANQUEADO",
      bodyHtml: `<p><strong>${escapeHtml(franchiseeName)}</strong>${storeNames ? ` (${escapeHtml(storeNames)})` : ""} abriu uma solicitação:</p>
        <div style="background:#f9f9f9;border-left:4px solid #b71c1c;padding:15px;margin:15px 0;text-align:left;color:#555;white-space:pre-wrap">${escapeHtml(message)}</div>`,
      buttonLabel: "Abrir no painel",
      buttonUrl: appUrl("/admin/chat"),
    }),
  };
}
