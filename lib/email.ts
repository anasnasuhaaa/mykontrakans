import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export async function sendEmail(input: { to: string; subject: string; name: string; message: string; link?: string; button?: string }) {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("EmailNotConfigured");
  const e = escapeHtml;
  const result = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: `Halo ${input.name},\n\n${input.message}\n\n${input.link || ""}\n\nMyKontrakans`,
    html: `<!doctype html><html lang="id"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#f3f6fc;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" style="width:100%;max-width:560px;background:#fff;border-radius:20px"><tr><td style="padding:36px"><p style="color:#2563eb;font-weight:bold;font-size:20px">MyKontrakans</p><h1 style="font-size:25px;line-height:1.3">${e(input.subject)}</h1><p>Halo ${e(input.name)},</p><p style="line-height:1.8;white-space:pre-line">${e(input.message)}</p>${input.link ? `<p style="margin:28px 0"><a href="${e(input.link)}" style="display:inline-block;padding:16px 24px;border-radius:12px;background:#2563eb;color:#fff;text-decoration:none">${e(input.button || "Buka MyKontrakans")}</a></p>` : ""}<hr style="border:0;border-top:1px solid #e4e9f1"><p style="font-size:12px;color:#627086">Satu rumah. Lebih tertata.<br>Email otomatis dari MyKontrakans.</p></td></tr></table></td></tr></table></body></html>`,
  });
  if (result.error) throw new Error("EmailDeliveryFailed");
}

export async function notifySafely(input: Parameters<typeof sendEmail>[0]) {
  try { await sendEmail(input); }
  catch { console.error("Email notification failed after successful database mutation."); }
}
