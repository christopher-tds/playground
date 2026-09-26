# Playground

Design explorations, published with GitHub Pages.

## Convention

- **One folder per exploration:** kebab-case, at the repo root (e.g. `auto-rotating-tabs/`).
- **Each folder is self-contained:** it has its own `index.html`, its assets live inside the folder, and every path is relative (`assets/image.jpg`, never `/assets/...`).
- **The root `index.html` lists them all:** whenever you add a folder, add a link to it in the root `index.html` list, labeled with the exploration's name.
- Keep the root index plain and simple. No build step, no frameworks.

## Shopify-ready rules

Every component should drop into any Liquid theme in the portfolio (BSC, GO, PM, TS) as a section without a rebuild. Those themes share no build tools, JS framework, tokens or breakpoints, so components rely on none of them. `auto-rotating-tabs/` is the reference example.

**Folder layout**

```
<exploration>/
  index.html        preview page only (header, viewport toggle, sample content)
  component/        what a theme copies: <name>.css + <name>.js
  shopify/          section-<name>.liquid with schema, settings, blocks, presets
  assets/           sample media for the preview
  README.md         dev handoff: files, per-theme install, variables, behavior
```

**Code panel:** every preview page gets the shared "Code" button next to Desktop/Mobile. It opens a drawer showing the README, the Liquid section, and the component CSS/JS. Include `../_shared/dev-panel.css` and `../_shared/dev-panel.js`, add a `<button class="dev-btn" data-dev-panel>` with the code icon, and list the files in a `<script type="application/json" id="dev-files">` block (see `auto-rotating-tabs/index.html`). `_shared/` holds playground chrome only, never component code, and isn't listed on the root index.

**Checklist**

- **Content lives in the markup:** JS only adds behavior on top. Repeating items are section blocks, and the page must still read sensibly without JS.
- **One set of markup for every screen size:** never duplicate desktop and mobile trees or images.
- **Fluid sizing:** no fixed page widths. Match the design at its reference width with `%`, `cqi`, `clamp()`.
- **Layout switches with container queries** on the component's own width, not viewport media queries.
- **Scoped styles:** everything is scoped to the component. Nothing goes on `:root`, `body` or bare element selectors.
- **Brand variables:** expose a short `--<prefix>-*` list with defaults as `var()` fallbacks (not declared on the element), so themes can set them anywhere. Fonts default to `inherit`.
- **Plain web component:** `class X extends HTMLElement`, wrapped in `if (!customElements.get(...))`. No jQuery, sliders or other libraries, and no build step. Clean up in `disconnectedCallback` (the theme editor re-renders sections).
- **Settings come from the section:** headings, timings and toggles are schema settings passed as `data-*` attributes. Nothing is hardcoded twice.
- **Images come from Shopify:** markup accepts `image_url | image_tag` output (widths, sizes, lazy, eager when above the fold). Don't depend on lazysizes or `data-srcset`.
- **Accessibility:** correct ARIA for the pattern, keyboard support, a visible pause for anything that moves, no autoplay or blur under `prefers-reduced-motion`.
- **Theme editor:** handle `shopify:block:select` when the component hides content.
- **Check:** run `shopify theme check` on the section before calling it done.

## Publishing

- GitHub Pages serves from `main`, at the repo root. Pushing to `main` publishes.
- Live URL: `https://christopher-tds.github.io/playground/<folder>/`
- `.nojekyll` makes Pages serve the files exactly as they are. Keep it.
- **The repo is public:** anyone can see every file. Check before adding client work that shouldn't be visible.
