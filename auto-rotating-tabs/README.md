# Auto-rotating tabs

A behavior spec with a working reference implementation. It isn't drop-in theme code: the dev who builds it owns the implementation and adapts it to their repo's own patterns.

## What it does

- **Wide layout** (component ≥ 700px): a tab list on the left and one large image on the right. The open row shows its description and a timer line. The image changes with a blur-to-focus transition.
- **Rotation:** advances every *n* seconds (6 by default) and loops. Clicking a row jumps to it, and the timer restarts from there.
- **Narrow layout** (< 700px): every tab is shown as a stacked card (image, title, description). There's no rotation, and each image comes into focus as it scrolls into view.
- **Stops rotating when:**
  - the viewer presses the pause control
  - keyboard focus is on a tab
  - it's scrolled out of view or the browser tab is hidden
  - a block is selected in the theme editor
  - the viewer has reduced motion turned on (autoplay starts off)
- **Keyboard:** each tab title is a button with `aria-expanded`, in the wide layout only. Tab moves through them; Up, Down, Home and End jump directly. Collapsed rows are `inert`.
- **Without JS:** the wide layout shows the first tab and the narrow layout shows every card.

## Settings

| Setting | Type | Default |
|---|---|---|
| Heading | text | Key features |
| Seconds per tab | range, 3–12 | 6 |
| Rotate automatically | checkbox | on |
| **Tab** block: image, title, description | image, text, richtext | max 8 blocks |

## Brand variables

Every variable has a fallback, so it can be set anywhere (`:root`, a wrapper or the element).

| Variable | Default | |
|---|---|---|
| `--art-font`, `--art-heading-font` | inherit | Text and heading fonts |
| `--art-text` | `#2c2a26` | Text and timer line |
| `--art-bg` | `#fff` | Background |
| `--art-border` | `#dcdcdc` | Row dividers |
| `--art-media-bg` | `#efeeeb` | Shown while images load |
| `--art-radius` | `8px` | Image corners |
| `--art-control-bg`, `--art-control-color` | bg, text | Pause control |
| `--art-focus-ms`, `--art-ease` | `900ms`, ease-out | Image transition |

## Reference files

| File | What it shows |
|---|---|
| `component/auto-rotating-tabs.js` | The behavior as a dependency-free custom element that enhances server-rendered markup |
| `component/auto-rotating-tabs.css` | Scoped styles; the layout switches with a container query |
| `shopify/section-auto-rotating-tabs.liquid` | The markup contract, schema, settings and blocks |

## Open decisions for the dev

- **File location and pipeline:** follow the target repo's AGENTS.md (for example, `src/` in BSC and TS, where JS is compiled TypeScript).
- **JS pattern:** keep the custom element, or port it to the repo's existing module style.
- **Images:**
  - `widths` and `sizes` in the reference are placeholders. Derive them from the theme's page width, breakpoints and image aspect ratio (note the layout switches on the component's width, not the viewport's).
  - Choose eager or lazy loading by where the section sits on the page.
- **Translations:** pass the theme's own strings to `data-label-pause` and `data-label-play`. PM and GO already have `accessibility.pause_slideshow` and `accessibility.play_slideshow`.
- **Color schemes:** add a `color_scheme` setting where the theme uses them, and map it to the `--art-*` variables.

## What has been checked

- The component was tested in the playground preview in Chrome: wide and narrow layouts, keyboard, pause/play, and removing and re-adding the element.
- The section passed `shopify theme check` **on a stub theme only**. It has not been validated in any brand theme.
