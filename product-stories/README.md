# Product stories

A behavior spec with a working reference implementation. It isn't drop-in theme code: the dev who builds it owns the implementation and adapts it to their repo's own patterns.

## What it does

Instagram Stories-style product browsing for mobile. Each product is a "story": a short roll of mostly on-model photos with a product card pinned at the bottom.

| Input | Result |
|---|---|
| Tap the right ~2/3 | Next photo. Past the last photo it moves to the next product. |
| Tap the left 1/3 | Previous photo. Before the first photo it moves to the previous product. |
| Press and hold (200ms+) | Pauses. The progress bar, header and card fade out so the photo shows clearly. Releasing resumes and doesn't count as a tap. |
| Swipe up / down | Next / previous product. The stack follows the finger and changes product past 20% of the height or on a flick. Otherwise it snaps back. It rubber-bands at the first and last product. |
| Mouse wheel | One product per wheel gesture |
| ← / → | Previous / next photo |
| ↑ / ↓ | Previous / next product |
| Space, or the pause button (shows on keyboard focus) | Turns autoplay off and on |

- **Progress:** one segment per photo or clip. A photo's segment fills over 5s. A clip's segment fills over the clip's own length and stays in step with it: it waits while the clip buffers and restarts at the clip's length once that's known. Then the story advances on its own. At the end of the last product it stops.
- **Video:** a roll can mix photos and muted clips (`<video class="ps__frame" muted playsinline>`). Only the visible clip plays. It starts from the top each time it's shown and pauses whenever the story does. Clips one step ahead preload.
- **Memory:** each product resumes on the photo you left it on.
- **Header:** a collection label ("Fall/Winter 26") and a date at 56% opacity on the left, and a close button (Phosphor X) on the right. Close fires a `product-stories:close` event; what it does is up to the theme. The preview does nothing with it.
- **Product card:** a solid white card with 4px corners: thumbnail, title, colorway and price. The price lines up with the title. It's a link to the PDP. Pressing it never moves the story.
- **Stops when (photos and clips):** held, dragged, the browser tab is hidden, or a block is selected in the theme editor.
- **Reduced motion:** autoplay starts off and the product slide is instant. Taps and swipes still work.
- **Without JS:** products scroll vertically and each product's photos scroll sideways, both with scroll snap.

## Markup contract

```html
<product-stories data-seconds="5">
  <div class="ps__track">
    <article class="ps__story" aria-label="The Jack in Valley Plaid Waffle">
      <div class="ps__frames">
        <img class="ps__frame" src="…" alt="…" data-focus="50% 30%">
        …
      </div>
      <div class="ps__header">
        <p class="ps__label"><span class="ps__label-title">Fall/Winter 26</span> <span class="ps__label-date">Oct 27</span></p>
        <button type="button" class="ps__close" aria-label="Close"><svg>…</svg></button>
      </div>
      <a class="ps__card" href="/products/…">
        <img class="ps__thumb" src="…" alt="">
        <span class="ps__details">
          <span class="ps__info"><span class="ps__title">The Jack</span><span class="ps__color">Valley Plaid Waffle</span></span>
          <span class="ps__price">$138</span>
        </span>
      </a>
    </article>
  </div>
</product-stories>
```

The JS adds the progress bars, the pause button and a live region. Everything else is in the markup.

## Settings (`data-*` on the element)

| Attribute | Default | |
|---|---|---|
| `data-seconds` | 5 | Seconds per photo |
| `data-label-pause` / `data-label-play` | Pause / Play | Pause button label |
| `data-label-paused` | Paused | Announced when autoplay turns off |
| `data-label-progress` | Photo {current} of {total} | Progress bar label |
| `data-focus` (per `img`) | 50% 50% | `object-position` for the cover crop |

## Brand variables

| Variable | Default | |
|---|---|---|
| `--ps-font` | inherit | Text font |
| `--ps-bg` | `#0f2130` | Behind the photos while they load |
| `--ps-text` / `--ps-muted` | `#0f2130` / 66% of it | Card title and price / colorway |
| `--ps-header-text` | `#fff` | Header label and close icon |
| `--ps-card-bg` | `#fff` | Card fill |
| `--ps-radius` | 4px | Card radius (the thumb is half) |
| `--ps-segment` / `--ps-segment-fill` | white at 38% / white | Progress track / fill |
| `--ps-speed` | 420ms | Product change duration |
| `--ps-inset-top` | `env(safe-area-inset-top)` | Space kept clear above the progress bar, for when the stories run under a status bar. The preview doesn't need it, because its status bar sits above the stories, as on Instagram. |

## Sample content

Three Taylor Stitch products from the [Winter 2026 lookbook](https://www.taylorstitch.com/blogs/dispatches/lookbook-2026-winter). Each roll was picked from a contact sheet of every PDP gallery image, every mobile editorial panel (the panels lower on the PDP) and the lookbook's mobile clips, in the picked order. The card thumbnail is the PDP's first image (the flat lay).

| Product | Price | Roll, in order |
|---|---|---|
| The Jack in Fern Twist Waffle | $138 | Gallery 2, editorial 1, gallery 3, editorial 2, gallery 8, window clip |
| The Deck Pant in Khaki Bedford Cord | $148 | Editorial 1, gallery 3, ledge clip, gallery 2, gallery 5, sweater clip |
| The Maritime Shirt Jacket in Heather Olive Wool | $198 | Gallery 4, editorial 1, gallery 2, gallery 3, gallery 8, editorial 3 |

**Image sizes:** gallery images are 4:5 (saved at 1080×1350). The mobile editorial panels are taller (1080×1656), so they crop less in the roughly 9:16 story. The PDP uses a separate wide file for desktop.

**The clips:**
- **Ledge clip** (`assets/lookbook-ledge.mp4`, 654×866, 11.6s, 4.5MB): the lookbook's mobile cut of a man sitting on a ledge in the Maritime Shirt Jacket and the Deck Pant. I checked both against their PDP photos (same model and location). Only the Deck Pant story uses it.
- **Sweater clip** (`assets/lookbook-sweater.mp4`, 654×866, 12.5s, 4.7MB): the back of a man in a patterned sweater. It's a mood clip; the Deck Pant isn't visible in it.
- **Window clip** (`assets/lookbook-window.mp4`, 654×866, 15s, 5.5MB): a window looking out over a lake, with no people. It's a mood clip that closes the Jack story.

**No clip shows a Jack:** none of the 12 lookbook clips clearly shows one, so the Jack's clip is a mood clip. No Taylor Stitch product has video in its Shopify media. The only video on the site is editorial: the homepage hero and the lookbook clips.

**Lookbook page structure:** the lookbook doesn't tie clips to products. All clips and product links sit interleaved in one flat section, so pairings have to be made by eye.

Every crop reads well centered, so every `data-focus` value is the default.

## Open decisions for the dev

- **Where stories live and which products:** a section with product blocks, a collection, or a metaobject.
- **Which media make the roll:** curated per product (e.g. a metafield list of media that can mix gallery images, editorial panels and clips), or filtered by a convention. PDP alt text isn't reliable for this: some products' alt text doesn't match the photo it's on (the Ryder Jacket's did not).
- **9:16 crops:** whether to shoot or crop story-specific media rather than cover-cropping 4:5 PDP shots and 3:4 clips.
- **Where video comes from:** today it lives only in editorial (Vimeo-hosted lookbook clips), with no link to products. Stories would need clips attached to products, e.g. Shopify product media or a metafield.
- **Sound and captions:** clips are muted, like the site's. If a clip ever carries sound, it needs an unmute control and captions.
- **Clip weight:** each clip is about 4.5MB at 720p. Decide on a poster image and how far ahead to preload on mobile data.
- **Image `widths`, `sizes` and loading.** The preview loads the first photo eagerly and preloads the next photo and the neighboring products' current photos.
- **Close:** where it goes (back, the collection, dismissing a drawer), and whether the header label is per product or per story set.
- **Card action:** open the PDP, open a quick-add sheet, or add to cart from the card.
- **Analytics:** which events matter (photo views, completion rate, card taps).
- **Translations:** the label attributes above.
- **National 2 is licensed:** the preview uses Inter.

## What was checked

These checks ran in the Claude desktop browser pane (Chromium), at 375×812 and 1280×900, against a local static server:

- Tapping right and left, including crossing between products. Auto-advance through a full product.
- Hold pauses the fill animation and resume on release, with no tap.
- A mouse drag and a scripted touch-type pointer swipe both change products. The snap-back on a short, slow drag wasn't checked on its own.
- Pressing the card doesn't move the story.
- Arrow keys and Space. The end of the last product and the start of the first.
- The crops of all 15 images and the clips, and that every image loads. The window clip closes the Jack roll (its segment runs 15s), and the sweater clip closes the Deck Pant roll (12.5s).
- Video: the clip plays only while it's the visible frame. Its segment runs 11.6s, matching the clip. Holding pauses it and releasing resumes it. Moving to the next photo pauses it and rewinds it to the start. The same clip in the second story picks up its length once loaded and plays. I didn't throttle the network to test buffering.
- No console errors from the current script.

I didn't test on a real phone (including iOS Safari's autoplay rules for muted inline video), with VoiceOver, or in the theme editor.
