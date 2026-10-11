# Pedal Mafia nav: Jacquemus hover

A recreation of the Pedal Mafia desktop header (usa.pedalmafia.cc at 1440px) with the nav link hover from jacquemus.com/en_us applied. It's a proposal for the dev to confirm, not drop-in theme code.

## What changes

| | Current (live) | Proposed |
|---|---|---|
| Line | 2px, under the whole 62px menu item (incl. 10px padding) | 1px, under the label text only |
| Position | 3px below the header's bottom edge | 4px under the caps |
| Motion | Fades in, 300ms | Draws in from the left, leaves to the right, 300ms, `cubic-bezier(.25, .1, .25, 1)` |
| Applies to | Menu items | Menu items, plus the About and Help corner links |
| Held on | Open mega menu | Open mega menu, keyboard focus, current page |

The Jacquemus values were read from its live CSS: a 1px line in the text color, anchored right at zero width, which re-anchors left and grows to full width on hover.

## Reference files

| File | What it shows |
|---|---|
| `shopify/td-section-header-hover.css` | The hover written against PM's existing `td-header` selectors. Intended to replace the current `.header__menu-item:after` rules in `src/assets/td-section-header.css` (lines 176–190 at `41a4791b`). Both menu item types already wrap the label in a `<span>`, so no markup change. |
| `component/nav-link-hover.css` | The same effect as a generic `.nav-hover` class, for reuse on another brand |

## Variables

| Variable | Default | |
|---|---|---|
| `--td-nav-hover-line` | `1px` | Line thickness |
| `--td-nav-hover-offset` | `-4px` | Distance below the label |
| `--td-nav-hover-ms`, `--td-nav-hover-ease` | `300ms`, `cubic-bezier(.25, .1, .25, 1)` | Motion |
| Color | `--td-nav-link-hover` | Already set per nav scheme (white on the black nav) |

The generic file uses `--nlh-*` equivalents, with the color defaulting to `currentColor`.

## Implementation notes

- **Transform, not width:** Jacquemus animates `width` and swaps `left`/`right`. This uses `scaleX` and swaps `transform-origin`, so the motion is the same without layout work.
- **Hover only on real pointers:** the hover state sits in `@media (hover: hover)`, so a tap on a touch laptop doesn't leave the line stuck on.
- **Reduced motion:** the line still appears, just without the transition.
- **Mouse out mid-draw:** like Jacquemus, the line jumps to the right anchor if you leave before it finishes. It's barely visible at 300ms.

## Open decisions for the dev

- **Active state:** the current theme holds the old bar while a mega menu is open (`details[open]`). The proposal keeps that. Confirm it reads well once the mega menu panel is showing.
- **Black nav:** the line takes `--td-nav-link-hover`, so it should be white there. Not checked in the preview.
- **AUS store:** `themes/aus` has the same header CSS. Confirm it gets the same change.

## What has been checked

- The preview was tested in Chrome in the playground: hover, mouse out, keyboard focus, and the current-vs-proposed toggle.
- Header positions match the live PM header at 1440px within ~4px. ABC Whyte is licensed, so the preview uses Inter, and label widths differ slightly.
- The PM selectors were read from `pm-shopify-theme` (`41a4791b`). The CSS has **not** been run in the PM theme.
- Out of scope: the announcement bar, mega menu panels and the mobile header.
