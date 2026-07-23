// Terrian site — active merch drop endpoint.
// GET /.netlify/functions/drop -> { ok, drop: { name, tagline, endsAt, product:{title,url,image,price} } | null }
//
// Reads the soonest *Active* row from the Client-Terrian "Merch Drops" table (pointers only:
// name, handle/URL, drop time) and enriches it with live product data (image, price, title)
// pulled from Shopify by handle. Token stays server-side.
//
// Env vars (Netlify → Site settings → Environment variables):
//   AIRTABLE_TOKEN        (required) — Airtable PAT with data.records:read on the base
//   AIRTABLE_BASE_ID      (optional) — defaults to the Client-Terrian base below
//   AIRTABLE_DROPS_TABLE  (optional) — defaults to "Merch Drops"
//   SHOP_DOMAIN           (optional) — defaults to iamterrian.myshopify.com

const AIRTABLE_API = 'https://api.airtable.com/v0';
const DEFAULT_BASE = 'app9qCbHhx4CHFPFJ'; // Client-Terrian
const DROPS_TABLE = process.env.AIRTABLE_DROPS_TABLE || 'Merch Drops';
const SHOP = 'https://' + (process.env.SHOP_DOMAIN || 'iamterrian.myshopify.com');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=20, stale-while-revalidate=40',
};
const reply = (statusCode, obj) => ({ statusCode, headers: CORS, body: JSON.stringify(obj) });

function handleFrom(fields) {
  if (fields['Product Handle']) return String(fields['Product Handle']).trim();
  const url = fields['Product URL'] || '';
  const m = String(url).match(/\/products\/([^/?#]+)/);
  return m ? m[1] : '';
}

async function shopifyProduct(handle) {
  if (!handle) return null;
  try {
    const res = await fetch(`${SHOP}/products/${encodeURIComponent(handle)}.json`);
    if (!res.ok) return null;
    const p = (await res.json()).product;
    if (!p) return null;
    const v = (p.variants || [])[0] || {};
    const img = (p.images || [])[0] || {};
    return {
      title: p.title,
      url: `${SHOP}/products/${p.handle}`,
      image: img.src || '',
      price: v.price || '',
      compare: v.compare_at_price || '',
      available: (p.variants || []).some((x) => x.available),
    };
  } catch (e) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { ok: false, error: 'Method not allowed' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return reply(500, { ok: false, error: 'Drops are not configured yet.' });
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE;

  try {
    const res = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(DROPS_TABLE)}?pageSize=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error('Airtable error', res.status, await res.text().catch(() => ''));
      return reply(502, { ok: false, error: 'Could not load the drop.' });
    }
    const data = await res.json();
    const active = (data.records || [])
      .map((r) => r.fields || {})
      .filter((f) => f.Active && f['Drop Date'])
      .sort((a, b) => String(a['Drop Date']).localeCompare(String(b['Drop Date'])));

    if (!active.length) return reply(200, { ok: true, drop: null });

    const f = active[0];
    const handle = handleFrom(f);
    const product = await shopifyProduct(handle);
    return reply(200, {
      ok: true,
      drop: {
        name: f.Name || (product && product.title) || 'The Drop',
        tagline: f.Tagline || '',
        endsAt: f['Drop Date'] || '',
        handle: handle,
        product: product || { title: f.Name || '', url: f['Product URL'] || '', image: '', price: '' },
      },
    });
  } catch (err) {
    console.error('Upstream error', err);
    return reply(502, { ok: false, error: 'Could not load the drop.' });
  }
};
