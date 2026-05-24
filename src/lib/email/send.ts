import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const from = process.env.RESEND_SENDER_EMAIL;
  if (!from) {
    return { ok: false, error: "RESEND_SENDER_EMAIL is not set" };
  }

  try {
    const result = await getClient().emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    if (result.error) {
      return { ok: false, error: result.error.message || "send failed" };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send failed";
    return { ok: false, error: msg };
  }
}
