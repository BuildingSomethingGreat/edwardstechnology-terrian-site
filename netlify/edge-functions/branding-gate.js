// Terrian — passcode gate for the /branding/ press kit.
// Real (server-side) protection: checks a signed HttpOnly cookie; otherwise shows a themed
// passcode page and verifies the submitted passcode against an HMAC hash stored in the
// Client-Terrian Airtable "Site Settings" table. No plaintext is stored anywhere.
//
// Env: BRANDING_SECRET (required, signs the cookie + keys the HMAC),
//      AIRTABLE_TOKEN + AIRTABLE_BASE_ID (read the stored hash),
//      AIRTABLE_SETTINGS_TABLE (optional, defaults to "Site Settings").

const enc = new TextEncoder();
const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return toHex(sig);
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function getCookie(request, name) {
  const c = request.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

async function storedHash() {
  const token = Netlify.env.get("AIRTABLE_TOKEN");
  const base = Netlify.env.get("AIRTABLE_BASE_ID") || "app9qCbHhx4CHFPFJ";
  const table = Netlify.env.get("AIRTABLE_SETTINGS_TABLE") || "Site Settings";
  if (!token) return null;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?pageSize=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const row = (data.records || [])
      .map((r) => r.fields || {})
      .find((f) => String(f.Setting || "").toLowerCase() === "branding access hash");
    return row ? String(row.Value || "").trim() : null;
  } catch (_) {
    return null;
  }
}

function loginPage(error) {
  const err = error ? '<p class="err">That passcode didn’t match. Try again.</p>' : "";
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Brand Assets — Private | Terrian</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;background:#141312;color:#f3f1e9;font:400 16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:30px;-webkit-font-smoothing:antialiased}
  .box{width:100%;max-width:420px;text-align:center}
  .box .mark{width:180px;height:auto;margin:0 auto 34px;display:block;filter:drop-shadow(0 6px 24px rgba(0,0,0,.4))}
  .eyebrow{font:700 12px/1 system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#e29ee3;margin-bottom:14px}
  h1{font:italic 600 34px/1.1 Georgia,"Times New Roman",serif;margin-bottom:12px}
  p.sub{color:#b7b2a6;margin-bottom:26px}
  form{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
  input{flex:1;min-width:200px;background:rgba(243,241,233,.06);border:1px solid rgba(243,241,233,.16);border-radius:999px;padding:15px 22px;color:#f3f1e9;font-size:15px;outline:none}
  input:focus{border-color:#e29ee3}
  button{border:0;cursor:pointer;background:#f3f1e9;color:#141312;border-radius:999px;padding:15px 26px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;transition:transform .15s}
  button:hover{transform:translateY(-1px)}
  .err{color:#ec9a9a;font:600 14px/1.4 system-ui,sans-serif;margin-top:16px}
  .back{display:inline-block;margin-top:26px;color:#b7b2a6;font-size:14px;text-decoration:none}
  .back:hover{color:#f3f1e9}
</style></head>
<body><div class="box">
  <img class="mark" src="/assets/images/terrian-script-logo.png" alt="Terrian">
  <p class="eyebrow">Private</p>
  <h1>Brand&nbsp;Assets</h1>
  <p class="sub">This press kit is private. Enter the passcode to continue.</p>
  <form method="POST" action="/branding/">
    <input type="password" name="passcode" placeholder="Passcode" autofocus autocomplete="current-password" required>
    <button type="submit">Enter</button>
  </form>
  ${err}
  <a class="back" href="/home/">← Back to terrian.com</a>
</div></body></html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

export default async (request, context) => {
  const secret = Netlify.env.get("BRANDING_SECRET");
  if (!secret) return context.next(); // not configured -> fail open rather than brick the page

  const validCookie = await hmacHex(secret, "branding-authed-v1");

  // already authenticated?
  const cookie = getCookie(request, "tb_brand");
  if (cookie && safeEqual(cookie, validCookie)) return context.next();

  // verify a submitted passcode
  if (request.method === "POST") {
    let pw = "";
    try {
      const form = await request.formData();
      pw = String(form.get("passcode") || "");
    } catch (_) {}
    const stored = await storedHash();
    const attempt = await hmacHex(secret, pw);
    if (stored && safeEqual(attempt, stored)) {
      const headers = new Headers({ Location: "/branding/" });
      headers.append(
        "Set-Cookie",
        `tb_brand=${validCookie}; Path=/branding; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
      );
      return new Response("", { status: 303, headers });
    }
    return loginPage(true);
  }

  return loginPage(false);
};

export const config = { path: ["/branding", "/branding/"] };
