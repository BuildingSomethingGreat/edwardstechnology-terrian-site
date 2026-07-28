# Agent Notes — password-protecting the branding page needs decisions I shouldn't guess at

## What was requested
1. Password-protect the branding page (`/branding/`).
2. Exclude it from SEO / web crawlers (noindex meta and/or robots.txt disallow).
3. Store a **hashed** version of the access password in the client's data record
   (not plain text) for use in authentication.

## Part 2 is already done — no change needed
The crawler exclusion the request asks for is already in place:

- `robots.txt` already has `Disallow: /branding/`.
- `branding/index.html` already has `<meta name="robots" content="noindex">` (line 8).

So the branding page is already kept out of search indexes and the sitemap
(`sitemap.xml` does not list `/branding/`). Nothing to change here.

## Why I stopped on parts 1 and 3 instead of guessing
This is a **static site on Netlify** (publish = repo root) with a few serverless
functions backed by an external **Airtable** base (`Client-Terrian`, base
`app9qCbHhx4CHFPFJ`). There is no auth layer and no client "data record" living
in this repo. Two blockers:

**A. There's no password to hash.** The request says to store a hash of "the
access password," but no password value was provided (no attachments, nothing in
the request). I won't invent one.

**B. The "client's data record" is Airtable, not this repo.** The only client
data store is the runtime Airtable base, read/written by the Netlify functions
using the server-side `AIRTABLE_TOKEN` (see `netlify/functions/*.js`). I can't
write a record from a repo edit, and there is no password/hash field on any
current table (`Subscribers`, `Posts`, `Merch Drops`). Committing a hash into the
git repo would put a credential in the wrong place — the repo is public-ish
client content, not the "client's data record" the request refers to.

**C. Real password protection is a structural change, not a content edit.** On a
static site the options are all bigger than a scoped edit, and one of them is a
false-security trap:

- **Client-side JS gate (do NOT do this):** checking a password (even a hash) in
  page JavaScript is trivially bypassable via view-source. Worse, the actual
  brand assets under `/assets/images/*` are served as plain static files, so they
  stay directly downloadable no matter what the HTML page does. This would look
  protected while protecting nothing.
- **Serverless auth (real, but new infrastructure):** a Netlify function that
  verifies the submitted password against the stored hash and issues a signed
  session cookie, plus a login page and gating for both `/branding/` *and* the
  underlying asset files. This is a genuine feature to design, not a one-line
  edit, and it changes the site's security surface.
- **Netlify built-in password protection:** Netlify offers site/branch password
  protection and role-based "Visitor access" as a dashboard setting (paid tiers).
  That's an operator dashboard change, not a repo change, and doesn't involve a
  hash stored by us.

Per the project rules (make no edits when a request needs
destructive/structural changes or is unclear — don't guess), I stopped here.

## What I need to proceed
Please confirm:

1. **The password itself** — the actual access password to protect the page with
   (send it out-of-band; I'll hash it, never store plaintext).
2. **Which mechanism** you want:
   - (a) Netlify's built-in password protection (simplest; operator sets it in
     the Netlify dashboard — no code, no stored hash by us), **or**
   - (b) a custom serverless login: a Netlify function + login page + signed
     session cookie that also gates the asset downloads. If so, confirm I should
     build it as its own change.
3. **Where the hash should live** if we go with (b): I'd add a field (e.g.
   `Branding Access Hash`) on a table in the `Client-Terrian` Airtable base and
   grant the function `data.records:read` on it. Confirm the base/table and that
   Airtable is the intended "client data record."

Once you pick a mechanism and give me the password, I can implement it as a
properly scoped change.
