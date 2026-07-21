# Agent Notes — blog post can't be added by editing the repo

## What was requested
Create and publish a new **summer-themed** blog post, on-topic and in the
site's voice.

## Why no code edits were made
The blog is **not file-based** — there are no post files in this repo to add.
The blog is driven entirely by an external **Airtable** base:

- `blog/index.html` and `post/index.html` are just renderers. They call
  `/.netlify/functions/posts` at page load.
- `netlify/functions/posts.js` reads published posts from the
  **`Client-Terrian-Blog`** Airtable base (base `appo3YN727pYq63tv`, table
  `Posts`) using the server-side `AIRTABLE_TOKEN`. A post appears on the site
  only when its `Published` checkbox is on.

So "publishing a post" means **adding one record in Airtable**, not committing a
file. Making it work via the repo would require converting the whole blog to a
file-based system — a structural refactor that breaks the current Airtable
pipeline and goes beyond a scoped content change. Per the project rules I stopped
rather than guess at that.

## How to publish (Airtable → done)
Add a new row to the `Posts` table in the `Client-Terrian-Blog` base with the
fields below, then tick **Published**. The site picks it up within ~60s (CDN
cache). `Body` uses the light Markdown the renderer supports: `##`/`###`
headings, `>` blockquotes, `-` bullets, `**bold**`, `*italic*`, `[text](url)`
links, and blank lines between paragraphs.

## Ready-to-paste draft (summer theme, in Terrian's voice)

- **Title:** Summer, Slow Down, and Trusting God's Timing
- **Slug:** `summer-slow-down-trusting-gods-timing`
- **Author:** Terrian
- **Date:** `2026-07-21`
- **Cover:** (optional — attach a warm summer/road image if you have one)
- **Published:** ✅
- **Excerpt:** A few honest notes on rest, the road this summer, and why waiting
  on God is never wasted.

**Body:**

```
Summer has a way of slowing everything down — longer days, open windows, that
golden light in the evening that makes you want to sit still for a minute. And
if I'm honest, sitting still has never come easy to me.

## Learning to rest

So much of *Give It Time* — and now *Mad Big World* — came out of learning that
waiting on God is never wasted. He's always working, even in the silence. This
season I'm trying to actually live that instead of just singing it. To let a
slow morning be a gift and not a delay.

> He's always working, even in the silence.

## On the road

There's something about summer shows I love. Warm crowds, voices carrying out
into the night, strangers becoming a room full of people worshipping together.
If you're coming out to a show this summer, come say hi — I mean it.

- Drink the water, wear the sunscreen, dance anyway.
- Bring a friend who needs to hear a little hope.
- Stay for the last song. That's usually where God shows up.

## Give it time

Whatever you're waiting on this summer — an answer, a healing, a door to open —
give it time. Trust that the same God who paints the sky every evening hasn't
forgotten about you. Rest is not falling behind. It's part of the plan.

See you out there.
```

## What I need to proceed with an actual publish
Confirm one of:
1. **Publish it for you** — say so, and grant Airtable access (a PAT with
   `data.records:write` on base `appo3YN727pYq63tv`), and I'll add the record.
2. **Adjust the draft** — tell me the angle, title, or length you'd prefer and
   I'll revise the copy above.
3. **Move the blog to file-based** — if you actually want posts to live in the
   repo, confirm that and I'll design it as its own change (it's a bigger,
   structural task, not a content edit).
