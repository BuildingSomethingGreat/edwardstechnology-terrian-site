// Terrian site — blog posts endpoint (read-only).
// GET  /.netlify/functions/posts            -> { ok, posts:[ {title,slug,excerpt,cover,author,date} ] }
// GET  /.netlify/functions/posts?slug=xxx   -> { ok, post: {..., body} }
// Reads published posts from the Client-Terrian-Blog Airtable base. Token stays server-side.
//
// Env vars (Netlify → Site settings → Environment variables):
//   AIRTABLE_TOKEN        (required) — Airtable PAT with data.records:read on the blog base
//   AIRTABLE_BLOG_BASE_ID (optional) — defaults to the Client-Terrian-Blog base below
//   AIRTABLE_BLOG_TABLE   (optional) — defaults to "Posts"

const AIRTABLE_API = 'https://api.airtable.com/v0';
const DEFAULT_BASE = 'app9qCbHhx4CHFPFJ'; // Client-Terrian (Posts table lives here alongside Subscribers)
const DEFAULT_TABLE = 'Posts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  // posts change rarely; let the CDN/browser cache briefly
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
};
const reply = (statusCode, obj) => ({ statusCode, headers: CORS, body: JSON.stringify(obj) });

function coverUrl(att) {
  if (!att || !att[0]) return '';
  const a = att[0];
  if (a.thumbnails && a.thumbnails.large && a.thumbnails.large.url) return a.thumbnails.large.url;
  return a.url || '';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { ok: false, error: 'Method not allowed' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return reply(500, { ok: false, error: 'Blog is not configured yet.' });
  const baseId = process.env.AIRTABLE_BLOG_BASE_ID || DEFAULT_BASE;
  const table = process.env.AIRTABLE_BLOG_TABLE || DEFAULT_TABLE;
  const slug = (event.queryStringParameters || {}).slug;

  try {
    const res = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error('Airtable error', res.status, await res.text().catch(() => ''));
      return reply(502, { ok: false, error: 'Could not load posts.' });
    }
    const data = await res.json();
    let posts = (data.records || [])
      .map((r) => {
        const f = r.fields || {};
        return {
          title: f.Title || '',
          slug: f.Slug || '',
          excerpt: f.Excerpt || '',
          author: f.Author || '',
          date: f.Date || '',
          cover: coverUrl(f.Cover),
          published: !!f.Published,
          body: f.Body || '',
        };
      })
      .filter((p) => p.published && p.slug)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (slug) {
      const post = posts.find((p) => p.slug === slug);
      if (!post) return reply(404, { ok: false, error: 'Post not found.' });
      delete post.published;
      return reply(200, { ok: true, post });
    }
    // list view: omit body
    posts = posts.map(({ body, published, ...rest }) => rest);
    return reply(200, { ok: true, posts });
  } catch (err) {
    console.error('Upstream error', err);
    return reply(502, { ok: false, error: 'Could not load posts.' });
  }
};
