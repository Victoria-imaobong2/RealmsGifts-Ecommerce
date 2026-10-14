import { Resend } from "resend";

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export const EMAIL_FROM = process.env.EMAIL_FROM || "Realmsgifts <onboarding@resend.dev>";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export function emailLayout(title: string, bodyHtml: string) {
  return `
  <div style="background:#FAF7F0;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#252923">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E6E1D7;border-radius:16px;overflow:hidden">
      <div style="background:#173F35;color:#FAF7F0;padding:20px 28px;font-family:Georgia,serif;font-size:18px;letter-spacing:0.12em">REALMSGIFTS</div>
      <div style="padding:28px">
        <h1 style="font-family:Georgia,serif;font-weight:500;font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #E6E1D7;color:#77776F;font-size:12px">Thoughtful gifts. Wherever they are.</div>
    </div>
  </div>`;
}

export { escapeHtml };
