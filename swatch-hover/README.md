# Swatch hover: Jack

The Taylor Stitch PDP color swatches restyled after the jacquemus.com PDP: square swatches, a line under the selected one, and a name and image that follow the hovered swatch. It's a proposal for the dev to confirm, not drop-in theme code.

## What it does

| | Current (live) | Proposed |
|---|---|---|
| Swatches | 40px circles with a ring on hover and selected | 32px squares, 8px apart; a 1px line 5px under the selected one, nothing on hover |
| Label | Group label ("Essentials") + color name | Color name only |
| Hover a swatch | The label text swaps instantly | The new name slides up 16px into place and fades in, while the old one slides up and out. The product image switches to that color with a 300ms blur-to-focus crossfade. |
| Move between swatches | Resets to the selected name on each `mouseleave`, then swaps again | Goes straight from name to name; it resets only when the pointer leaves the swatch row |
| Keyboard | No change on focus | Focusing a swatch shows its name; tabbing out of the row resets |
| Timing | — | 300ms, `cubic-bezier(.25, .1, .25, 1)` (from Jacquemus's live CSS) |

- **Reduced motion:** a plain crossfade, no travel.
- **Without JS:** the label shows the selected color, as it does now.
- **Screen readers:** the outgoing layer is `aria-hidden`, so only the visible name is read.

## How it works

The element splits `[data-selected-color-title]` into two stacked layers in one grid cell. Each change sets the new name on the hidden layer and swaps the classes (`is-in` / `is-out`), which restarts the keyframes. The resting name is read from `data-initial` each time, so it follows whatever updates the selection.

Each change also fires a bubbling `swatch-preview` event with `{ color, swatch }`, including the reset to the selected color. The preview listens for it and swaps the photo; the element doesn't touch the gallery itself.

The image swap reuses the auto-rotating tabs crossfade at 300ms: the incoming image fades in from an 18px blur to sharp, while the outgoing one fades and blurs out on top over 225ms. The CSS is the optional `.snf-media` block in `swatch-name-fade.css`.

## Reference files

| File | What it shows |
|---|---|
| `shopify/color-swatches.liquid` | The existing swatches snippet with a `<swatch-name-fade>` wrapper and without the group label |
| `component/swatch-name-fade.js` | The behavior as a dependency-free custom element |
| `component/swatch-name-fade.css` | The layers and keyframes |

## Variables

| Variable | Default | |
|---|---|---|
| `--snf-distance` | `16px` | How far each name travels |
| `--snf-duration`, `--snf-ease` | `300ms`, `cubic-bezier(.25, .1, .25, 1)` | Name motion |
| `--snf-media-ms`, `--snf-media-ease` | `300ms`, `cubic-bezier(.22, .61, .36, 1)` | Image crossfade |
| `--snf-media-blur` | `18px` | How soft the image starts and ends |

## Open decisions for the dev

- **Image cost:** `filter: blur()` on a large image is expensive on phone GPUs. PR 398 (PM campaign hero) drops its blur to 10px on phones; the same may suit here, though hover is mostly desktop.
- **Image swap:** on TS each color is its own product, so hover needs that color's first image. The snippet's `swatchesJson` already loops the colorway; adding the first image URL there (or as a `data-image` on each swatch) would cover it. Decide which gallery slide it replaces and whether to preload.
- **Group labels:** removing "Essentials" also removes "Limited" from the second group, so the two rows lose their headings. Confirm that's intended, or keep a quieter group heading above each row.
- **Swatch photos:** TS swatches are photos cropped to circles. At 32px squares, check the existing swatch images still read well, and decide how light colors get an edge (the preview uses a faint inset line).
- **Element or controller:** `TSColorSwatchesController` already sets the label with `.text()` on `mouseenter`/`mouseleave`, which would overwrite the layers. Either remove those handlers and use the element, or port `show()` into the controller.
- **Travel distance:** 16px is Jacquemus's value for a taller label. With TS's 14px label it reads as a clear lift; 8px would be quieter.
- **Second swatch group:** the Limited group renders its own container, and the element handles each one separately. Confirm both groups should get it.
- **File location:** `theme/src/js` is compiled TypeScript; follow the repo's AGENTS.md.

## Preview notes

- The swatches are 32px solid fills, sampled from the lit areas of each product photo: Washed Indigo Oxford `#9db0c1`, White Everyday Oxford `#efedeb`, Smoked Olive Oxford `#857e6d`. TS uses swatch photos.
- Clicking a swatch selects it in place. On TS each swatch links to that color's product page.
- National 2 is licensed: Inter stands in.

## What has been checked

- Tested in Chrome in the playground: hover (name and image), moving between swatches, leaving the row, keyboard focus, and click-to-select.
- The markup and controller were read from `ts-shopify-theme` (`16b3d25d5`). Nothing has been run in the TS theme.
