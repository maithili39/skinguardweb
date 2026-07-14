import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = "SkinGuard <noreply@skinguard.app>";
const FROM_STAY_UPDATED = "SkinGuard Stay Updated <noreply@skinguard.app>";

async function send(to: string, subject: string, html: string, from: string = FROM) {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text}`);
  }
}

export async function sendPasswordReset(to: string, resetUrl: string) {
  await send(
    to,
    "Reset your SkinGuard password",
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:24px;font-weight:700;color:#2a2724;margin-bottom:8px">Reset your password</h1>
      <p style="color:#4a453f;line-height:1.6;margin-bottom:24px">
        We received a request to reset the password for your SkinGuard account.
        Click the button below — this link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#4a5d44;color:#fff;font-weight:600;padding:14px 28px;border-radius:50px;text-decoration:none;font-size:15px">
        Reset Password
      </a>
      <p style="color:#8a8276;font-size:13px;margin-top:24px">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    `,
  );
}

export async function sendNewsletterWelcome(to: string) {
  await send(
    to,
    "Welcome to SkinGuard updates!",
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:24px;font-weight:700;color:#2a2724;margin-bottom:8px">You're in!</h1>
      <p style="color:#4a453f;line-height:1.6;margin-bottom:24px">
        Thanks for subscribing to SkinGuard. You'll get our weekly skincare science
        digest — ingredient breakdowns, safety updates, and product deep-dives.
      </p>
      <a href="https://skinguard.app/analyze" style="display:inline-block;background:#4a5d44;color:#fff;font-weight:600;padding:14px 28px;border-radius:50px;text-decoration:none;font-size:15px">
        Analyze an ingredient list →
      </a>
      <p style="color:#8a8276;font-size:13px;margin-top:24px">
        You can unsubscribe at any time by replying to this email.
      </p>
    </div>
    `,
    FROM_STAY_UPDATED,
  );
}
