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
npm run dev            # starts the dev server and prints the one tailnet link
npm run build          # builds to dist/
npm run preview        # previews the built site
```

## Checks

| Command | Purpose |
|---|---|
| `npm run lint` | Code shape limits (`code-shape.json`). |
| `npm test` | Unit tests. |
| `npm run check:dist` | Built pages and discovery files. Run after `npm run build`. |
| `npm run check:layout` | Phone and desktop layout in Chromium. Run after `npm run build`. |
| `npm run og` | Renders the social image again. |

`docs/design.md` explains the design rules and the phone walk.

## Deploying to Netlify

1. Push this repo to GitHub
2. Connect repo in [Netlify](https://app.netlify.com) → "Import from Git"
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Point `chem-is-try.com` DNS to Netlify

## Forms

Formspree receives the contact and RFQ forms. The form addresses are in `src/pages/contact.astro` and `src/pages/rfq.astro`.

## Structure

```
data/
  metadata.json    company facts, team, analytics id and notice text (source of truth)
  pages.json       page titles, descriptions, menu and footer labels, categories
  discovery.json   text for llms.txt and agents.txt
  products.json    the catalogue
src/
  layouts/         Layout.astro (head, SEO, skip link)
  components/      header, footer, search form, product card
  pages/           pages, plus robots.txt, llms.txt, llms-full.txt, agents.txt and .well-known/agents.json
  lib/             pure logic and browser modules
  config/          site.ts (reads data/metadata.json)
  styles/          palette.css (colors), global.css
public/
  images/          chemical structure images
  assets/          logo, banners, social image
scripts/           build and check scripts
tests/             unit tests
docs/              design.md and PR docs
```

## Discovery files

`robots.txt`, `llms.txt`, `llms-full.txt`, `agents.txt`, `/.well-known/agents.json` and the sitemap come from the data files at build time. Do not edit them by hand. No generated file holds an email address.
