# Button hover: Fade up

The add-to-cart button from the jacquemus.com PDP (the de-Nîmes Simon denim shirt), recreated with its exact styling and hover. It's a reference for the dev, not drop-in theme code.

## What it does

- **Hover swap:** hovering slides the resting face (label and price) up 16px and out while a hover face rises 16px into place. Leaving reverses it.
- **States in the preview:**

  | State | Button | Resting | Hover |
  |---|---|---|---|
  | No size chosen (Jacquemus) | Outlined | Add to cart · price | Select a size |
  | Chosen size sold out | Outlined, price in `#a4a4a4` | Sold out · price | Notify me |
  | Pre-order | Filled | Pre-order · price | Ships Nov 14 |
  | Low stock | Filled | Add to cart · price | Only 2 left |

  Outlined means nothing can be added yet; filled (`.atc--filled`, Jacquemus's size-chosen style: `#2e2e2e` fill, white text) means it can.
- **Motion:** 300ms, `cubic-bezier(.25, .1, .25, 1)`. These are the same keyframes as the swatch name in `swatch-hover-fade-up/`.
- **Keyboard:** focusing the button shows "Select a size" too. Jacquemus does hover only.
- **Reduced motion:** a plain crossfade, no travel.

## Styling (from Jacquemus's live CSS)

| | Value |
|---|---|
| Button | 50px tall, full width of the buy column (332px at 1440), 1px `#2e2e2e` border, white, square corners |
| Text | 12px, weight 500, uppercase, 2.4px tracking (`.24rem` on their 10px root), `#2e2e2e` |
| Padding | 20px each side; "Add to cart" sits left, the price right (`.2em` tracking) |
| Icon | 24px box, 5px before the label. Jacquemus draws a ~10px bag; the preview uses the Phosphor bag (Regular) at 16px |

## Changes from Jacquemus

- **No load animation:** Jacquemus puts the animations on the resting states, so they also play on page load and "Select a size" visibly slides out as the page appears. Here those animations wait for `.is-ready`, which `atc-hover.js` adds on the first hover or focus.
- **Font:** Futura PT is licensed: Inter stands in.

## Reference files

| File | What it shows |
|---|---|
| `component/atc-hover.css` | The button, both faces, the filled and muted variants, and the keyframes. The swap itself is pure CSS. |
| `component/atc-hover.js` | Adds `.is-ready` on first interaction |

## Variables

| Variable | Default | |
|---|---|---|
| `--atc-font` | inherit | |
| `--atc-color`, `--atc-bg` | `#2e2e2e`, `#fff` | Text, border and background (swapped on `.atc--filled`) |
| `--atc-muted` | `#a4a4a4` | Muted price on sold out |
| `--atc-height` | `50px` | |
| `--atc-distance` | `16px` | How far each face travels |
| `--atc-duration`, `--atc-ease` | `300ms`, `cubic-bezier(.25, .1, .25, 1)` | Motion |

## Open decisions for the dev

- **Other states:** the plain ready state (filled, no hover swap), adding, added ("Checkout" link in `#a4a4a4` on Jacquemus), whole product sold out and coming soon aren't in this preview.
- **Touch:** hover-only details (the ship date, the stock count) need a second home on phones, such as a line under the button. "Select a size" and "Notify me" are fine, because tapping the button can do those directly.
- **Data and apps:** sold out and stock counts come from Shopify variant data. "Notify me" and pre-orders depend on the brand's back-in-stock and pre-order apps, so those states exist only where the apps do. The ship date and low-stock threshold need a source (metafield or app setting).
- **Sample content:** the size (M), ship date (Nov 14) and count (2) are placeholders.
- **Which brand:** no theme was picked for this one. Map the variables to the brand's button tokens.
- **Accessible name:** the preview labels the button "Add to cart, $650" and hides the hover face. In a theme, pass the translated strings and price.

## What has been checked

- Tested in Chrome in the playground: each state's hover in and out, keyboard focus, and the state switcher.
