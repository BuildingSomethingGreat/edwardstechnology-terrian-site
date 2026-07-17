// Terrian site — subscribe / contact endpoint.
// Receives a JSON POST from the site's subscribe + booking forms and writes a row
// to the Client-Terrian Airtable base. The Airtable token is read from the
// AIRTABLE_TOKEN environment variable (set in Netlify) and never ships to the browser.
//
// Env vars (set in Netlify → Site settings → Environment variables):
//   AIRTABLE_TOKEN     (required) — Airtable Personal Access Token with data.records:write on the base
//   AIRTABLE_BASE_ID   (optional) — defaults to the Client-Terrian base below
//   AIRTABLE_TABLE     (optional) — defaults to "Subscribers"

const AIRTABLE_API = 'https://api.airtable.com/v0';
const DEFAULT_BASE = 'app9qCbHhx4CHFPFJ'; // Client-Terrian (base IDs are not secret)
const DEFAULT_TABLE = 'Subscribers';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REASONS = ['Newsletter / updates', 'Booking inquiry', 'Press / media', 'General question'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const reply = (statusCode, obj) => ({ statusCode, headers: CORS, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { ok: false, error: 'Method not allowed' });

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return reply(400, { ok: false, error: 'Malformed request' }); }

  const email = String(data.email || '').trim();
  if (!EMAIL_RE.test(email)) return reply(400, { ok: false, error: 'Please enter a valid email address.' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return reply(500, { ok: false, error: 'Subscriptions are not configured yet.' });
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE;
  const table = process.env.AIRTABLE_TABLE || DEFAULT_TABLE;

  const first = String(data.firstName || '').trim().slice(0, 100);
  const last = String(data.lastName || '').trim().slice(0, 100);
  const name = [first, last].filter(Boolean).join(' ') || email;
  const reason = REASONS.includes(data.reason) ? data.reason : 'Newsletter / updates';

  const fields = {
    Name: name,
    Email: email,
    Source: String(data.source || 'Website').slice(0, 100),
    Reason: reason,
    Status: 'Todo',
  };
  if (first) fields['First Name'] = first;
  if (last) fields['Last Name'] = last;
  if (data.message) fields['Message'] = String(data.message).slice(0, 5000);

  try {
    const res = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Airtable error', res.status, detail);
      return reply(502, { ok: false, error: 'Could not save right now. Please try again.' });
    }
    return reply(200, { ok: true });
  } catch (err) {
    console.error('Upstream error', err);
    return reply(502, { ok: false, error: 'Could not save right now. Please try again.' });
  }
};
