# ATC hover: Simon

The add-to-cart button from the jacquemus.com PDP (the de-Nîmes Simon denim shirt), recreated with its exact styling and hover. It's a reference for the dev, not drop-in theme code.

## What it does

- **Before a size is chosen:** hovering slides "Add to cart" and the price up 16px and out while "Select a size" rises 16px into place. Leaving reverses it.
- **Motion:** 300ms, `cubic-bezier(.25, .1, .25, 1)`. These are the same keyframes as the swatch name in `swatch-hover/`.
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
| `component/atc-hover.css` | The button, both faces and the keyframes. The swap itself is pure CSS. |
| `component/atc-hover.js` | Adds `.is-ready` on first interaction |

## Variables

| Variable | Default | |
|---|---|---|
| `--atc-font` | inherit | |
| `--atc-color`, `--atc-bg` | `#2e2e2e`, `#fff` | Text, border and background |
| `--atc-height` | `50px` | |
| `--atc-distance` | `16px` | How far each face travels |
| `--atc-duration`, `--atc-ease` | `300ms`, `cubic-bezier(.25, .1, .25, 1)` | Motion |

## Open decisions for the dev

- **Other states:** Jacquemus also has a size-selected state (dark `#2e2e2e` fill, white text, no hover swap) and an added state ("Checkout" link in `#a4a4a4`). They aren't in this preview.
- **Which brand:** no theme was picked for this one. Map the variables to the brand's button tokens.
- **Accessible name:** the preview labels the button "Add to cart, $650" and hides the hover face. In a theme, pass the translated strings and price.

## What has been checked

- Tested in Chrome in the playground: hover in and out, quick repeated hovers, and keyboard focus.
