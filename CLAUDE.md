# Playground

Design explorations, published with GitHub Pages.

## Convention

- **One folder per exploration:** kebab-case, at the repo root (e.g. `auto-rotating-tabs/`).
- **Each folder is self-contained:** it has its own `index.html`, its assets live inside the folder, and every path is relative (`assets/image.jpg`, never `/assets/...`).
- **The root `index.html` lists them all:** whenever you add a folder, add a link to it in the root `index.html` list, labeled with the exploration's name.
- Keep the root index plain and simple. No build step, no frameworks.

## Reference-component conventions

Explorations are **behavior specs with a working reference implementation**, not drop-in theme code. The dev who builds it in a brand theme owns the implementation. That theme repo's own AGENTS.md and instructions override everything here. These conventions only keep the reference easy to read and adapt. `auto-rotating-tabs/` is the example.

**Folder layout**

```
<exploration>/
  index.html        preview page only (header with "← Playground" link to ../, viewport toggle, sample content)
  component/        reference implementation: <name>.css + <name>.js
  shopify/          reference section: markup contract, schema, settings, blocks
  assets/           sample media for the preview
  README.md         behavior spec, settings, variables, open decisions for the dev, what was checked
```

**Code panel:** every preview page gets the shared "Code" button next to Desktop/Mobile. It opens a drawer with the reference files: README, section, CSS and JS. Include `../_shared/dev-panel.css` and `../_shared/dev-panel.js`, add a `<button class="dev-btn" data-dev-panel>` with the code icon, and list the files in a `<script type="application/json" id="dev-files">` block (see `auto-rotating-tabs/index.html`). `_shared/` holds playground chrome only, never component code, and isn't listed on the root index.

**Checklist**

- **Content lives in the markup:** JS only adds behavior on top. Repeating items are section blocks, and the page still reads sensibly without JS.
- **One set of markup for every screen size:** no duplicated desktop and mobile trees or images.
- **Fluid sizing:** match the design at its reference width and scale from there. Comment any number derived from the reference frame.
- **Layout follows the component's own width** (container query), so it works full-width or in a column.
- **Scoped styles:** nothing on `:root`, `body` or bare element selectors.
- **Brand variables:** a short `--<prefix>-*` list with defaults as `var()` fallbacks. Fonts default to `inherit`.
- **No dependencies:** a plain custom element, guarded with `customElements.get`, safe to reconnect, and cleaned up in `disconnectedCallback`. No work (timers, animation loops) while nothing is happening.
- **Settings come from the section** as `data-*` attributes, including any visible or accessible text, so themes can pass translations.
- **Accessibility:** a real ARIA pattern, keyboard support, a working pause for anything that moves, and no autoplay under `prefers-reduced-motion`.
- **Theme editor:** handle `shopify:block:select` when the component hides content.
- **Don't decide for the dev:** image `widths`/`sizes`/loading, file locations, translation keys and color schemes go in the README's "Open decisions", not in claims.
- **Claim only what was checked:** say exactly what ran and where, for example "theme check on a stub theme only".

## Publishing

- GitHub Pages serves from `main`, at the repo root. Pushing to `main` publishes.
- Live URL: `https://christopher-tds.github.io/playground/<folder>/`
- `.nojekyll` makes Pages serve the files exactly as they are. Keep it.
- **The repo is public:** anyone can see every file. Check before adding client work that shouldn't be visible.
