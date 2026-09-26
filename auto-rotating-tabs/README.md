# Auto-rotating tabs

A tab list next to a large image that advances on a timer. On narrow containers it becomes stacked cards. Built as a dependency-free custom element, `<auto-rotating-tabs>`, that enhances server-rendered markup.

## Files

| File | Goes to | Notes |
|---|---|---|
| `component/auto-rotating-tabs.css` | theme `assets/` | Scoped to the element; never touches `:root` or `body` |
| `component/auto-rotating-tabs.js` | theme `assets/` | Custom element, guarded by `customElements.get` |
| `shopify/section-auto-rotating-tabs.liquid` | theme `sections/auto-rotating-tabs.liquid` | Loads both assets through `asset_url`. Passes `shopify theme check` |
| `index.html` | — | Playground preview only |

## Adding it to a theme

| Brand | Where the files go |
|---|---|
| **BSC** | `theme/sections/` and `theme/assets/` as plain files. Gulp only compiles `src/` and doesn't clean `theme/assets` |
| **GO** | `theme/sections/` and `theme/assets/`. No build step |
| **PM** | `src/sections/` and `src/assets/`. Gulp copies them into both `themes/aus` and `themes/usa`, and the template JSON goes in each regional theme |
| **TS** | `theme/sections/` and `theme/assets/` as plain files. Gulp's CSS cleanup only touches files generated from SCSS entrypoints |

## Brand variables

Set these anywhere (`:root`, a wrapper, or the element itself) and map them to the theme's own tokens. Every one has a default.

| Variable | Default | |
|---|---|---|
| `--art-font` | inherit | Body and tab text |
| `--art-heading-font` | inherit | Uppercase heading |
| `--art-text` | `#2c2a26` | Text and timer line |
| `--art-bg` | `#fff` | Component background |
| `--art-border` | `#dcdcdc` | Row dividers |
| `--art-media-bg` | `#efeeeb` | Shown while images load |
| `--art-radius` | `8px` | Image corners |
| `--art-control-bg` / `--art-control-color` | bg / text | Pause button |
| `--art-focus-ms`, `--art-ease` | `900ms`, ease-out | Image focus transition |

## Behavior

- **Section settings:** heading, seconds per tab (3–12) and autoplay. Each "Tab" block has an image, a title and a description. Image focal points come from Shopify admin.
- **Layout switch:** it changes at a **700px component width** (container query), so it works in full-width or narrow columns in any theme. If you change the breakpoint, update `LG_MIN` in the JS too.
- **Accessibility:**
  - Titles become disclosure buttons (`aria-expanded`) on wide layouts, and collapsed rows are `inert`.
  - Arrow keys, Home and End move between tabs.
  - Keyboard focus holds the current tab, and the pause button stops rotation.
  - Autoplay is off under `prefers-reduced-motion`.
- **Theme editor:** selecting a block opens its tab and holds it there.
- **Without JS:** wide layouts show the first tab; narrow layouts show every card.
