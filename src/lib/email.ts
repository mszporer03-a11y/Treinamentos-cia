// Envio de e-mails transacionais. Dois provedores, escolhidos pelas variáveis de ambiente:
//   1. SMTP (nodemailer): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, (SMTP_SECURE)
//   2. API HTTP da Resend (https://resend.com): RESEND_API_KEY, EMAIL_FROM
// SMTP tem prioridade quando SMTP_HOST está definido. Sem nenhum dos dois, o envio é
// ignorado (apenas registrado no log).
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const RED = "#b71c1c";

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!smtpTransporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return smtpTransporter;
}

export function appUrl(path = "/"): string {
  const base = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** E-mail padronizado com a identidade visual da Companhia do Churrasco */
export function brandedEmail(opts: {
  heading: string;
  paragraphs: string[];
  quote?: string;
  buttonLabel: string;
  buttonUrl: string;
}): string {
  const logo = appUrl("/logo.png");
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#eceff1;font-family:Segoe UI,Arial,sans-serif;color:#333">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border:2px solid ${RED};border-radius:8px">
    <tr><td style="padding:28px 24px;text-align:center">
      <img src="${logo}" alt="Companhia do Churrasco" width="200" style="max-width:200px;height:auto;margin-bottom:16px" />
      <h2 style="color:${RED};font-size:20px;margin:0 0 16px">${escapeHtml(opts.heading)}</h2>
      ${opts.paragraphs.map((p) => `<p style="font-size:15px;line-height:1.5;margin:0 0 10px">${p}</p>`).join("")}
      ${
        opts.quote
          ? `<div style="background:#f9f9f9;border-left:4px solid ${RED};padding:14px;margin:16px 0;font-style:italic;text-align:left;color:#555;white-space:pre-wrap">${escapeHtml(opts.quote)}</div>`
          : ""
      }
      <a href="${opts.buttonUrl}" style="display:inline-block;margin-top:14px;background:${RED};color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:16px;font-weight:600">${escapeHtml(opts.buttonLabel)}</a>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  // Um envio por destinatário para não expor os e-mails entre franqueados
  const smtp = getSmtpTransporter();
  if (smtp) {
    const from = process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "intranet@localhost";
    const results = await Promise.allSettled(recipients.map((email) => smtp.sendMail({ from, to: email, subject, html })));
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`[email] falha ao enviar para ${recipients[i]}:`, r.reason);
    });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(`[email] nenhum provedor configurado — "${subject}" não enviado (${recipients.length} destinatário(s))`);
    return;
  }

  await Promise.allSettled(
    recipients.map((email) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: email, subject, html }),
      }).then((res) => {
        if (!res.ok) console.error(`[email] falha ao enviar para ${email}: ${res.status}`);
      })
    )
  );
}

export { escapeHtml };
