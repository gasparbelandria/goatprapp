import { Resend } from "resend";

// Lazy init — avoids build-time throw when env var is absent
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

const FROM = `GoatPR <hello@goatpr.app>`;
const REPLY_TO = process.env.REPLY_TO_EMAIL ?? "support@goatpr.app";
const LOGO = "https://goatpr.app/goatpr-logo.png";
const APP_URL = "https://goatpr.app";

type Lang = "en" | "es";

const COPY: Record<Lang, {
  subject: string;
  greeting: string;
  tagline: string;
  betaBadge: string;
  intro: string;
  s1Title: string; s1Body: string;
  s2Title: string; s2Body: string;
  s3Title: string; s3Body: string;
  s4Title: string; s4Body: string;
  s5Title: string; s5Body: string;
  cta: string;
  replyTitle: string; replyBody: string;
  footerNote: string;
}> = {
  en: {
    subject: "Welcome to GoatPR — Log your first PR 🏆",
    greeting: "Welcome,",
    tagline: "Track it. Beat it. Share it.",
    betaBadge: "BETA — FOUNDING ATHLETE",
    intro: "You just joined the platform built for high school athletes who want to track their records, compete with their school, and share their best lifts and times. This is just the beginning.",
    s1Title: "🏋️ Log your first PR.",
    s1Body: "Pick an exercise — bench press, 40-yard dash, vertical jump, or any of 20+ supported exercises. Enter your number. Your school ranking updates immediately.",
    s2Title: "🏫 Compete at your school.",
    s2Body: "GoatPR is in early beta. Every athlete at your school who logs a PR for the same exercise shows up on the leaderboard. See where you stand — and set a goal to move up.",
    s3Title: "🏆 You're a founding member.",
    s3Body: "Because you're one of the first athletes on GoatPR, your feedback shapes what we build next. <strong style=\"color:#16a34a\">Reply to this email with any feature requests or exercises you want to see added</strong> — we read every one.",
    s4Title: "📲 Share your PR card.",
    s4Body: "Every PR generates a card built for stories, group chats, and timelines. One tap to copy the link. Challenge your friends to beat your number.",
    s5Title: "🔮 What's coming.",
    s5Body: "School challenges · Verified school pages · Head-to-head PR battles · Coach dashboards · Real-time state leaderboards · And things we haven't announced yet.",
    cta: "Log My First PR →",
    replyTitle: "Tell us what you want.",
    replyBody: "Reply to this email with the exercises, features, or schools you want to see on GoatPR. Founding athletes shape the roadmap.",
    footerNote: "You received this because you signed up for GoatPR. No spam — ever. This is the only automated email we'll send you.",
  },
  es: {
    subject: "Bienvenido a GoatPR — Registra tu primer PR 🏆",
    greeting: "Bienvenido,",
    tagline: "Regístralo. Supéralo. Compártelo.",
    betaBadge: "BETA — ATLETA FUNDADOR",
    intro: "Acabas de unirte a la plataforma creada para atletas de preparatoria que quieren registrar sus récords, competir con su escuela y compartir sus mejores marcas. Esto es apenas el comienzo.",
    s1Title: "🏋️ Registra tu primer PR.",
    s1Body: "Elige un ejercicio — press de banca, sprint de 40 yardas, salto vertical o cualquiera de los más de 20 ejercicios disponibles. Ingresa tu marca. Tu ranking escolar se actualiza de inmediato.",
    s2Title: "🏫 Compite en tu escuela.",
    s2Body: "GoatPR está en beta temprana. Cada atleta de tu escuela que registre un PR en el mismo ejercicio aparece en el ranking. Mira dónde estás y fíjate una meta para subir.",
    s3Title: "🏆 Eres miembro fundador.",
    s3Body: "Por ser uno de los primeros atletas en GoatPR, tu opinión da forma a lo que construimos. <strong style=\"color:#16a34a\">Responde a este correo con sugerencias de funciones o ejercicios que quieras ver</strong> — las leemos todas.",
    s4Title: "📲 Comparte tu tarjeta de PR.",
    s4Body: "Cada PR genera una tarjeta hecha para historias, chats grupales y timelines. Un toque para copiar el enlace. Desafía a tus amigos a superar tu marca.",
    s5Title: "🔮 Qué viene.",
    s5Body: "Desafíos escolares · Páginas de escuelas verificadas · Batallas de PR uno a uno · Paneles para entrenadores · Rankings estatales en tiempo real · Y cosas que aún no hemos anunciado.",
    cta: "Registrar Mi Primer PR →",
    replyTitle: "Dinos qué quieres.",
    replyBody: "Responde a este correo con los ejercicios, funciones o escuelas que quieres ver en GoatPR. Los atletas fundadores dan forma al roadmap.",
    footerNote: "Recibiste esto porque te registraste en GoatPR. Sin spam — nunca. Este es el único correo automatizado que te enviaremos.",
  },
};

function buildHtml(name: string, lang: Lang): string {
  const c = COPY[lang];
  const firstName = name.split(" ")[0] || name;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${c.subject}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#09090b;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b">
<tr><td align="center" style="padding:32px 16px 48px">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px">

  <!-- HEADER -->
  <tr>
    <td style="background:linear-gradient(160deg,#0d2a14 0%,#081f0c 50%,#040f06 100%);border-radius:20px 20px 0 0;padding:48px 48px 40px;text-align:center;border:1px solid rgba(22,163,74,0.35);border-bottom:none">
      <img src="${LOGO}" alt="GoatPR" width="130" height="auto" style="display:block;margin:0 auto 32px;max-width:130px" />
      <div style="width:88px;height:88px;margin:0 auto 24px;background:radial-gradient(circle at center,rgba(74,222,128,0.9) 0%,rgba(22,163,74,0.5) 40%,rgba(22,163,74,0.1) 70%,transparent 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 48px rgba(22,163,74,0.6),0 0 96px rgba(22,163,74,0.2)">
        <div style="width:88px;height:88px;line-height:88px;text-align:center;font-size:38px">👁️</div>
      </div>
      <div style="display:inline-block;background:rgba(22,163,74,0.2);border:1px solid rgba(22,163,74,0.4);border-radius:99px;padding:5px 16px;margin-bottom:20px">
        <span style="font-size:10px;font-weight:700;color:#16a34a;letter-spacing:2.5px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.betaBadge}</span>
      </div>
      <h1 style="margin:0 0 6px;font-size:30px;font-weight:800;color:#fafafa;letter-spacing:-0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.greeting} ${firstName} 👋</h1>
      <p style="margin:0;font-size:14px;color:#16a34a;font-weight:600;letter-spacing:0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.tagline}</p>
    </td>
  </tr>

  <!-- INTRO -->
  <tr>
    <td style="background:#111114;padding:36px 48px 28px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <p style="margin:0;font-size:15px;line-height:1.7;color:#d4d4d8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.intro}</p>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td style="background:#111114;padding:0 48px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(22,163,74,0.4),transparent)"></div>
    </td>
  </tr>

  <!-- SECTION 1 -->
  <tr>
    <td style="background:#111114;padding:28px 48px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left:3px solid #16a34a;padding-left:16px">
            <h2 style="margin:0 0 8px;font-size:15px;font-weight:800;color:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s1Title}</h2>
            <p style="margin:0;font-size:13.5px;line-height:1.65;color:#a1a1aa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s1Body}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SECTION 2 -->
  <tr>
    <td style="background:#111114;padding:4px 48px 28px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left:3px solid #f97316;padding-left:16px">
            <h2 style="margin:0 0 8px;font-size:15px;font-weight:800;color:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s2Title}</h2>
            <p style="margin:0;font-size:13.5px;line-height:1.65;color:#a1a1aa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s2Body}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SECTION 3 — Ambassador (special card) -->
  <tr>
    <td style="background:#111114;padding:4px 48px 28px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <div style="background:linear-gradient(135deg,rgba(250,189,0,0.06),rgba(245,158,11,0.04));border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:20px 22px">
        <h2 style="margin:0 0 8px;font-size:15px;font-weight:800;color:#fbbf24;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s3Title}</h2>
        <p style="margin:0;font-size:13.5px;line-height:1.65;color:#a1a1aa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s3Body}</p>
      </div>
    </td>
  </tr>

  <!-- SECTION 4 — Pro (special card) -->
  <tr>
    <td style="background:#111114;padding:4px 48px 28px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <div style="background:linear-gradient(135deg,rgba(22,163,74,0.12),rgba(22,163,74,0.06));border:1px solid rgba(22,163,74,0.35);border-radius:12px;padding:20px 22px">
        <div style="display:inline-block;background:rgba(22,163,74,0.25);border:1px solid rgba(22,163,74,0.5);border-radius:6px;padding:3px 10px;margin-bottom:10px">
          <span style="font-size:10px;font-weight:700;color:#16a34a;letter-spacing:1.5px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">PRO</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:15px;font-weight:800;color:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s4Title}</h2>
        <p style="margin:0;font-size:13.5px;line-height:1.65;color:#a1a1aa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s4Body}</p>
      </div>
    </td>
  </tr>

  <!-- SECTION 5 — Coming soon -->
  <tr>
    <td style="background:#111114;padding:4px 48px 28px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <div style="background:rgba(14,165,233,0.05);border:1px solid rgba(14,165,233,0.2);border-radius:12px;padding:20px 22px">
        <h2 style="margin:0 0 8px;font-size:15px;font-weight:800;color:#38bdf8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s5Title}</h2>
        <p style="margin:0;font-size:13.5px;line-height:1.65;color:#a1a1aa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.s5Body}</p>
      </div>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="background:#111114;padding:8px 48px 40px;text-align:center;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <a href="${APP_URL}/create" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#4ade80);color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;box-shadow:0 4px 24px rgba(22,163,74,0.4)">${c.cta}</a>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td style="background:#111114;padding:0 48px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(22,163,74,0.4),transparent)"></div>
    </td>
  </tr>

  <!-- REPLY SECTION -->
  <tr>
    <td style="background:#111114;padding:28px 48px 36px;border-left:1px solid rgba(22,163,74,0.2);border-right:1px solid rgba(22,163,74,0.2)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left:3px solid #4ade80;padding-left:16px">
            <h3 style="margin:0 0 6px;font-size:14px;font-weight:800;color:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.replyTitle}</h3>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.replyBody}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#0d0d10;border-radius:0 0 20px 20px;padding:24px 48px;text-align:center;border:1px solid rgba(22,163,74,0.2);border-top:1px solid rgba(255,255,255,0.05)">
      <img src="${LOGO}" alt="GoatPR" width="80" height="auto" style="display:block;margin:0 auto 12px;max-width:80px;opacity:0.5" />
      <p style="margin:0 0 6px;font-size:11px;color:#52525b;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${c.footerNote}</p>
      <p style="margin:0;font-size:11px;color:#3f3f46;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">© ${new Date().getFullYear()} GoatPR · <a href="${APP_URL}" style="color:#52525b;text-decoration:none">goatpr.app</a></p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendWelcomeEmail(opts: {
  to: string;
  displayName: string;
  lang: Lang;
}): Promise<void> {
  const { to, displayName, lang } = opts;
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject: COPY[lang].subject,
      html: buildHtml(displayName, lang),
    });
  } catch (err) {
    // Non-blocking — log but never throw
    console.error("[email] sendWelcomeEmail failed:", err);
  }
}
