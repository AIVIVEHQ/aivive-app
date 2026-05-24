export type EmailLocale = "en" | "zh";

type Template = { subject: string; html: string; text: string };

const wrap = (locale: EmailLocale, title: string, body: string, code: string) => {
  const footerEn =
    "If you didn't request this, you can safely ignore this email. Codes expire in 10 minutes.";
  const footerZh =
    "如果不是你本人操作，请忽略此邮件。验证码 10 分钟内有效。";

  const footer = locale === "zh" ? footerZh : footerEn;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0F1815;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E8F2EE;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <div style="font-size:14px;letter-spacing:0.3em;color:#4FFFD8;text-transform:uppercase;margin-bottom:32px;">AIVIVE</div>
      <h1 style="font-size:24px;font-weight:600;margin:0 0 16px;color:#FFFFFF;">${title}</h1>
      <p style="font-size:15px;line-height:1.6;color:#A8B5B0;margin:0 0 32px;">${body}</p>
      <div style="background:rgba(79,255,216,0.08);border:1px solid rgba(79,255,216,0.25);border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
        <div style="font-size:32px;letter-spacing:0.4em;font-weight:700;color:#4FFFD8;font-family:'SF Mono',Menlo,Consolas,monospace;">${code}</div>
      </div>
      <p style="font-size:13px;color:#6E7C76;line-height:1.6;margin:0;">${footer}</p>
    </div>
  </body>
</html>`;
};

export function renderRegisterCode(
  code: string,
  locale: EmailLocale = "en"
): Template {
  if (locale === "zh") {
    return {
      subject: "AIVIVE 注册验证码",
      html: wrap(
        locale,
        "完成你的 AIVIVE 注册",
        "请使用下方验证码完成账号注册。验证码 10 分钟内有效。",
        code
      ),
      text: `AIVIVE 注册验证码：${code}\n该验证码 10 分钟内有效。如果不是你本人操作，请忽略此邮件。`,
    };
  }
  return {
    subject: "Your AIVIVE verification code",
    html: wrap(
      locale,
      "Confirm your email",
      "Use the code below to finish creating your AIVIVE account. It expires in 10 minutes.",
      code
    ),
    text: `Your AIVIVE verification code is: ${code}\nThe code expires in 10 minutes. If you didn't request this, ignore this email.`,
  };
}

export function renderResetCode(
  code: string,
  locale: EmailLocale = "en"
): Template {
  if (locale === "zh") {
    return {
      subject: "AIVIVE 密码重置验证码",
      html: wrap(
        locale,
        "重置你的 AIVIVE 密码",
        "请使用下方验证码继续重置密码流程。验证码 10 分钟内有效。",
        code
      ),
      text: `AIVIVE 密码重置验证码：${code}\n该验证码 10 分钟内有效。如果不是你本人操作，请忽略此邮件。`,
    };
  }
  return {
    subject: "Reset your AIVIVE password",
    html: wrap(
      locale,
      "Reset your password",
      "Use the code below to reset your AIVIVE password. It expires in 10 minutes.",
      code
    ),
    text: `Your AIVIVE password reset code is: ${code}\nThe code expires in 10 minutes. If you didn't request this, ignore this email.`,
  };
}
