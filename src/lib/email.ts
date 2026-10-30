// Envio de e-mails transacionais via API HTTP da Resend (https://resend.com).
// Sem RESEND_API_KEY/EMAIL_FROM configurados, o envio é ignorado silenciosamente.

const RED = "#b71c1c";

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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!apiKey || !from || recipients.length === 0) return;

  // Um envio por destinatário para não expor os e-mails entre franqueados
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
