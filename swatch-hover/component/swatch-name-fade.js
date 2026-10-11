/*
  Swatch name fade (Jacquemus reference)

  Enhances the PDP color swatches: hovering or focusing a swatch shows its
  color name in the label, and leaving the swatches returns to the selected
  color. Each change slides the new name up into place while the old one
  slides up and out (jacquemus.com PDP: 16px, 300ms).

  Markup contract (matches product-sections-cta-menu-color-swatches.liquid):
    <swatch-name-fade>
      <div class="pdp-colorswatch">
        <h5 class="selected-color-title">
          <span>Essentials</span>
          <span data-selected-color-title data-initial="Washed Indigo Oxford">Washed Indigo Oxford</span>
        </h5>
        <ul class="product-color-options">
          <li><a class="color-option" data-color="White Everyday Oxford" href="…">…</a></li>
        </ul>
      </div>
    </swatch-name-fade>

  The resting name is read from data-initial each time, so whatever updates the
  selection only needs to update that attribute.
*/
(() => {
  if (customElements.get("swatch-name-fade")) return;

  class SwatchNameFade extends HTMLElement {
    connectedCallback() {
      this.label = this.querySelector("[data-selected-color-title]");
      this.list = this.querySelector(".product-color-options");
      if (!this.label || !this.list) return;

      // Build the two stacked layers once, so reconnecting doesn't nest them
      if (!this.layers) {
        const text = this.label.textContent.trim();
        this.label.textContent = "";
        this.label.classList.add("snf");
        this.layers = [0, 1].map(() => {
          // <i>, not <span>: TS styles `.selected-color-title span:first-child` as the group label
          const layer = document.createElement("i");
          layer.className = "snf__layer";
          this.label.append(layer);
          return layer;
        });
        this.layers[0].textContent = text;
        this.layers[0].classList.add("is-rest");
        this.layers[1].setAttribute("aria-hidden", "true");
        this.front = 0;
        this.current = text;
      }

      this.onOver = e => {
        const swatch = e.target.closest("[data-color]");
        if (swatch && this.list.contains(swatch)) this.show(swatch.dataset.color);
      };
      // Leaving the whole list resets; moving between swatches goes name to name
      this.onLeave = () => this.show(this.label.dataset.initial);
      this.onFocusOut = e => {
        if (!this.list.contains(e.relatedTarget)) this.onLeave();
      };

      this.list.addEventListener("pointerover", this.onOver);
      this.list.addEventListener("focusin", this.onOver);
      this.list.addEventListener("pointerleave", this.onLeave);
      this.list.addEventListener("focusout", this.onFocusOut);
    }

    disconnectedCallback() {
      if (!this.list) return;
      this.list.removeEventListener("pointerover", this.onOver);
      this.list.removeEventListener("focusin", this.onOver);
      this.list.removeEventListener("pointerleave", this.onLeave);
      this.list.removeEventListener("focusout", this.onFocusOut);
    }

    show(name) {
      if (!name || name === this.current) return;
      this.current = name;
      const out = this.layers[this.front];
      const next = this.layers[1 - this.front];
      next.textContent = name;
      // Swapping the class swaps the animation name, which restarts it
      out.classList.remove("is-in", "is-rest");
      out.classList.add("is-out");
      out.setAttribute("aria-hidden", "true");
      next.classList.remove("is-out");
      next.classList.add("is-in");
      next.removeAttribute("aria-hidden");
      this.front = 1 - this.front;
    }
  }

  customElements.define("swatch-name-fade", SwatchNameFade);
})();
