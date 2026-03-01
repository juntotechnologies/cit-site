# CHEM-IS-TRY Inc. — Static Site

Fast static rebuild of [chem-is-try.com](https://chem-is-try.com) using Astro.

## Stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build) (static output) |
| Hosting | Netlify (free tier) |
| Forms | [Formspree](https://formspree.io) (RFQ + Contact) |
| CSS | Custom (no frameworks) |

## Getting started

```bash
npm install
npm run dev       # dev server at localhost:4321
npm run build     # build to dist/
npm run preview   # preview built site
```

## Deploying to Netlify

1. Push this repo to GitHub
2. Connect repo in [Netlify](https://app.netlify.com) → "Import from Git"
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Point `chem-is-try.com` DNS to Netlify

## Formspree setup

Replace `YOUR_FORM_ID` in:
- `src/pages/rfq.astro`
- `src/pages/contact.astro`

Create a free form at [formspree.io](https://formspree.io) and paste the form ID.

## Structure

```
src/
  layouts/     Layout.astro (header, footer, nav)
  pages/       index, products, about, contact, faq, rfq, services
  lib/         formula.ts (subscript rendering), md.ts (markdown helper)
  styles/      global.css
data/
  products.json   974 scraped products
public/
  images/      974 chemical structure PNGs
  assets/      logo, banners, slideshow images
```
