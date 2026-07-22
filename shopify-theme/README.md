# Terrian Shop — Shopify handoff

Two versions of the same design:

- **`/shop/index.html`** (in the site root) — the *ideal-design mock*. Previewable
  locally in the Terrian theme. Product data (titles, prices, images, links) is
  pulled from the live store `iamterrian.myshopify.com/products.json`; product
  cards link out to the real Shopify product pages for checkout.

- **`shopify-theme/sections/main-shop.liquid`** — the *portable* version: a real
  Shopify section that reproduces the design using Liquid, powered by live product
  data. No mock data, no scraping.

## Using the Liquid section on Shopify

1. Copy `sections/main-shop.liquid` into your theme's `sections/` folder
   (Online Store → Themes → Edit code).
2. Create a collection template that uses it, e.g. `templates/collection.terrian.json`:
   ```json
   { "sections": { "main": { "type": "main-shop" } }, "order": ["main"] }
   ```
   …then assign that template to your "All products" (or a "Merch") collection.
   Or just add the **Terrian Shop** section to any page via the theme editor.
3. In the theme editor, optionally set the **Featured product**, heading, subtitle,
   and marquee text.

## Product drop / countdown (in the local mock)

`/shop/index.html` also includes a **product drop** section: a big countdown to a
launch time, a "Notify me" email capture, and a **sticky mini-countdown** that
slides up once you scroll past the section. Set the drop in the JS config at the
bottom of the page:

```js
var DROP = {
  shortName: "Honestly Hoodie",
  url: "https://iamterrian.myshopify.com/products/honestly-hoodie-sage",
  endsAt: "2026-08-14T20:00:00-05:00"   // drop date/time
};
```

Notify signups POST to the site's `subscribe` function and land in the
**Client-Terrian → Subscribers** table with **Reason = "Merch drop"** and a
`Source` of `Merch drop — <product>`.

**Porting to Shopify:** expose `endsAt` + the drop product as section settings
(schema), reuse the same countdown/mini-player markup + JS, and swap the notify
form for either a Shopify **contact form** (`{% form 'contact' %}`) or a
back-in-stock / Klaviyo capture. Ask and I'll add the full Liquid drop section.

## Notes / next steps on Shopify

- Category filter tabs are built from each product's **Type**
  (Apparel / Accessories / Music) — set those in the product admin.
- Real Shopify **money filters** (`{{ product.price | money }}`) respect the
  store currency automatically.
- To add true add-to-cart (instead of linking to the product page), swap the
  `<a class="pc">` cards for a product form + AJAX cart, or use the theme's
  built-in `product-card` snippet inside the loop.
