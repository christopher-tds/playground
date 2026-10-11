# Swatch hover: Jack

The Taylor Stitch PDP color swatches with the name transition from the jacquemus.com PDP. It's a proposal for the dev to confirm, not drop-in theme code.

## What it does

| | Current (live) | Proposed |
|---|---|---|
| Hover a swatch | The label text swaps instantly | The new name slides up 16px into place and fades in, while the old one slides up and out |
| Move between swatches | Resets to the selected name on each `mouseleave`, then swaps again | Goes straight from name to name; it resets only when the pointer leaves the swatch row |
| Keyboard | No change on focus | Focusing a swatch shows its name; tabbing out of the row resets |
| Timing | — | 300ms, `cubic-bezier(.25, .1, .25, 1)` (from Jacquemus's live CSS) |

- **Reduced motion:** a plain crossfade, no travel.
- **Without JS:** the label shows the selected color, as it does now.
- **Screen readers:** the outgoing layer is `aria-hidden`, so only the visible name is read.

## How it works

The element splits `[data-selected-color-title]` into two stacked layers in one grid cell. Each change sets the new name on the hidden layer and swaps the classes (`is-in` / `is-out`), which restarts the keyframes. The resting name is read from `data-initial` each time, so it follows whatever updates the selection.

## Reference files

| File | What it shows |
|---|---|
| `shopify/color-swatches.liquid` | The existing swatches snippet with one change: a `<swatch-name-fade>` wrapper |
| `component/swatch-name-fade.js` | The behavior as a dependency-free custom element |
| `component/swatch-name-fade.css` | The layers and keyframes |

## Variables

| Variable | Default | |
|---|---|---|
| `--snf-distance` | `16px` | How far each name travels |
| `--snf-duration`, `--snf-ease` | `300ms`, `cubic-bezier(.25, .1, .25, 1)` | Motion |

## Open decisions for the dev

- **Element or controller:** `TSColorSwatchesController` already sets the label with `.text()` on `mouseenter`/`mouseleave`, which would overwrite the layers. Either remove those handlers and use the element, or port `show()` into the controller.
- **Travel distance:** 16px is Jacquemus's value for a taller label. With TS's 14px label it reads as a clear lift; 8px would be quieter.
- **Second swatch group:** the Limited group renders its own container, and the element handles each one separately. Confirm both groups should get it.
- **File location:** `theme/src/js` is compiled TypeScript; follow the repo's AGENTS.md.

## Preview notes

- The swatches are 40px solid fills, sampled from the lit areas of each product photo: Washed Indigo Oxford `#9db0c1`, White Everyday Oxford `#efedeb`, Smoked Olive Oxford `#857e6d`. TS uses swatch photos.
- Clicking a swatch selects it in place. On TS each swatch links to that color's product page.
- Orbikular and National 2 are licensed: Source Serif 4 and Inter stand in.

## What has been checked

- Tested in Chrome in the playground: hover, moving between swatches, leaving the row, keyboard focus, and click-to-select.
- The markup and controller were read from `ts-shopify-theme` (`16b3d25d5`). Nothing has been run in the TS theme.
