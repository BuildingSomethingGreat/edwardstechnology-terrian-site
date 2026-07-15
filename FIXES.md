# Terrian site — post-export fixes

This static site was exported from Wix (Thunderbolt) by NoCodeExport. The raw export
shipped Wix's client-side hydration runtime, which needs Wix's servers to function and,
run as static files, only threw errors and half-applied Wix's scroll-motion engine.
The fixes below make the site clean, self-consistent, and error-free.

Applied 2026-07-14. A full pre-change backup is at `../terrian-local-backup-20260714`.

## What changed

1. **Removed the broken Wix runtime** on all 8 pages (~60–80 script tags each):
   React/ReactDOM/lodash bundles, all `rb_wixui.thunderbolt-*` component bundles, the
   main Thunderbolt bundle, the cross-origin Web Worker, the client router, Sentry,
   `frog.wix.com` telemetry beacons, the giant JSON data blobs, and the "Bootstrap
   Recovery" shim that only existed to nurse the dead runtime.
   - **Kept** the human-written NoCodeExport polyfills (nav-scroll, active-link, hover,
     offscreen-video, cookie banner, link-rewriter), SEO JSON-LD, and inert
     `wix/htmlEmbeds` placeholders.
   - Result: page errors went from **24/page to 0/page**.

2. **Re-drove Wix's entrance animations** (the `nce-enhance-css` + entrance-driver script
   near the end of each page). Wix ships per-element entrance animations
   (`motion-fadeIn` / `motion-floatIn` / `motion-slideIn`) as *paused* CSS animations and
   un-pauses them as elements enter the viewport; its runtime also revealed transition-based
   `opacity:0` elements. With the runtime gone, those elements — notably **opener sections
   and footers** (e.g. the footer "Join me on this exciting journey…" signup block) — were
   stuck invisible on their paused first frame. The driver replays Wix's own animations on
   view: openers fade in on load, footers fade in when scrolled to. It's accessible
   (`prefers-reduced-motion` → instant, no motion), guarded so content can never end up
   stuck invisible (a 3.5s safety net reveals anything the observer missed), and it
   deliberately leaves background `<video>`/`<canvas>` layers alone so they fall back to the
   section's still image.

3. **Fixed the neon-teal / grey "broken" blocks.** That was Wix's placeholder *page
   background* (`.wixui-page`) showing through wherever section background-videos didn't
   fill. Overridden to a warm near-black (`#141312`) so gaps read as intentional
   letterboxing behind the cinematic media.

4. **Repaired broken Pro Gallery images** (home's 3 "behind the scenes" cards, blog
   featured images). NoCodeExport's URL rewriter had corrupted the `<picture><source>`
   `srcset` values; because a `<source>` always wins over the sibling `<img>`, the browser
   loaded garbage URLs and never fell back. Fix: dropped the broken `<source>` tags so the
   already-present **local** `<img>` renders. These images are now fully self-contained.

5. **Restored the Music page.** The original export captured a `429 Too Many Requests`
   for `/terrian/music` (rate-limited during export). Re-fetched the live page, let it
   fully hydrate in a headless browser (so blur placeholders resolve to full-res and text
   reveals), captured that DOM, de-Wixed it, and injected the nav/link polyfills so its
   navigation points at the local exported pages. It now has a working Spotify player and
   signup section.

## Interactive behaviors restored (second pass)

The entrance driver above was upgraded and a menu system added — all in the single
`nce-enhance-css` block at the end of each page:

6. **Entrance animations now actually play.** The export had baked every animated element to
   its finished state (`data-motion-enter="done"`), so Wix's per-element entrances never ran.
   The driver now *re-arms* them in JS (removing the attribute re-applies Wix's paused
   animation) and plays each on view — openers **fade in on page load**, the rest on scroll.
   Fixes handled: `animationend` events bubbling from children were prematurely ending a
   parent's animation (now guarded with `e.target === el`); and infinite animations (the slow
   spin) are never "finalized", so they keep running.
   - **Index / opener:** the "terrian" wordmark, logo and footer now fade in on load.
   - **Music & Tour:** the same per-element entrances now play like the other pages.
   - **Music rotating circle** (`#comp-mgu485s5`): rises from behind the Spotify embed
     (`motion-glideIn`, ~2s in) and rotates slowly forever (`motion-spin`, one turn / 50s).

7. **Menu system** (Wix's was React-rendered and is gone):
   - **"Explore" button** (content pages): on **desktop** opens the opener/index page as a
     full-screen overlay (an iframe with a close ✕); nav links inside navigate the top window.
     On **mobile** (where content pages have no hamburger) it opens a clean nav menu directly.
   - **Hamburger** (index page, mobile): opens a clean full-screen nav menu built from the
     page's real links (the Wix overlay it used to toggle is empty in the export).
   - Both close on ✕ or Esc; body scroll locks while open.

## Polish pass (third)

8. **Removed the "Built on Wix Studio" ad bar and its empty offset.** Wix reserved 30px at
   the top of every page for its ad banner (`--wix-ads-height: 30px`, pushing `#site-root`
   down). The banner is hidden and the offset zeroed, so pages now start flush at the top.
9. **Removed the ✕ close icon** from the "Explore"/menu overlay — the full menu is right
   there, so you dismiss by choosing a destination, tapping the backdrop, or pressing Esc.
10. **Added a stylized page loader** (injected at the top of each page's `<body>`): the
    "terrian" outline wordmark on a dark field, with a warm cream shimmer sweeping across it,
    then a fade-and-lift out on `window.load` (minimum ~1s so it's seen; 4.5s hard fallback).
    Respects `prefers-reduced-motion`. Uses the wordmark asset
    (`…Copy-of-terrian-logo-alt_edited.png`) as a CSS mask, with the correct relative path
    baked per page depth.

## Known remaining items (minor, cosmetic)

- **Section background *videos*** (a few sections on the Videos and Music pages) were Wix
  React MediaPlayer components; with the runtime removed they show a solid section color
  instead of a looping background video. Static images and foreground YouTube/Spotify
  embeds are unaffected and work fine.
- **Remote assets:** like the original export, layout CSS/fonts still load from
  `parastorage.com` and some photos/videos from `wixstatic.com`. The site is not 100%
  offline-self-contained. Localizing those is a separate task if desired.
