# Design

Taste rules for this site. The shared `site-taste` skill holds the general rules. This file holds the choices for CHEM-IS-TRY.

## Aim

A buyer finds a chemical, reads its facts and requests a quote. The page does not decorate. It is calm, flat and fast.

## Tokens

| Token | Source | Rule |
|---|---|---|
| Colors | `src/styles/palette.css` | Use a semantic token. Never write a hex value in a component. |
| Radius, shadow, font, width | `:root` in `src/styles/global.css` | Font is the system sans stack. No web font loads. |
| Accent (gold) | `--color-brand-accent` | The primary action only. Text on it is dark. |

## Rules

| Rule | Why |
|---|---|
| Dark text on gold buttons. | White on gold is 2.19:1. Dark on gold passes AA. |
| No glow, shimmer, gradient hero or pointer light. | Buyers read facts. Effects look generic and add load. |
| Hover lifts a card 2 px. Press shrinks a button a little. | The page responds without moving. Hover rules sit inside `(hover: hover) and (pointer: fine)`. |
| Facts sit in a list (`.facts`), not in stat tiles. | A list scans faster and wraps well on a phone. |
| No emoji as icons. | They look different on each device. |
| Text is left-aligned, never justified. | Justified text leaves uneven gaps on a phone. |
| Buttons in a row have equal width (`.actions`). They stack full width at 540 px and below. | A ragged row looks broken. |
| Each tap target is 44 px high or more. Form inputs use 16 px text. | A smaller input zooms the page on iOS. |
| A product card on a phone puts the image left and the text right. | The page is shorter and each name stays readable. |
| Use native `<details>` for the FAQ. | It needs no script and works with a keyboard. |
| A slideshow has a pause button. It stays still for a visitor who asks for reduced motion. | WCAG 2.2.2. |
| An image has `width`, `height` and `alt`. A decorative image has `alt=""`. Images below the fold load lazily. | Stops layout shift and helps screen readers. |
| A missing address shows a real 404 page with `noindex`. | Visitors get links. Search engines skip it. |

## Phone walk

1. Run `npm run dev`. Open the tailnet link it prints.
2. Set the width to 360, 390, 430, 820 and 1440 px.
3. Scroll each page to the end, so lazy images load.
4. Take 900 px tile screenshots. A full-page image is too small to judge.
5. Walk these pages: home, about, products (with a search), a product, services, a service, FAQ, contact, RFQ and a missing address.
6. Open the mobile menu. Check the search field, the scroll and the Escape key.

## Checks

| Command | What it proves |
|---|---|
| `npm run lint` | Code shape: 15 lines, complexity 5, depth 1, 4 parameters, no nested function, a file docstring. `code-shape.json` holds the limits and the legacy list. |
| `npm test` | Unit tests, including AA contrast for each text and background pair in the palette. |
| `npm run build` | The site builds. |
| `npm run check:dist` | After the build: discovery files exist, each page has one canonical address, one title, one description and one `h1`, the sitemap matches the pages, and no generated file holds an email address. |
| `npm run check:layout` | After the build, in Chromium: no sideways scroll, headings of two lines or fewer, equal side margins, 44 px tap targets on a phone. `scripts/layout-rules.json` holds the rules. |
| `npm run og` | Renders `public/assets/og-image.jpg` again after a change to the logo or the photo. |

## Sources of facts

| Fact | Source |
|---|---|
| Name, address, phone, founding year, team, tagline, booking link, analytics id | `data/metadata.json` |
| Page titles, descriptions, menu and footer labels, categories | `data/pages.json` |
| Text for `llms.txt` and `agents.txt` | `data/discovery.json` |
| Products | `data/products.json` |

The sitemap file name is `SITEMAP_PATH` in `src/lib/discovery.js`. `npm run check:dist` verifies it.
