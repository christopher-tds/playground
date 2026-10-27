/* Product stories: Instagram Stories-style product browsing.
   Markup contract:
     <product-stories data-seconds="5" data-label-pause="Pause" data-label-play="Play"
                      data-label-progress="Photo {current} of {total}">
       <div class="ps__track">
         <article class="ps__story" aria-label="…">            one per product
           <div class="ps__frames">                                 photos and muted clips, in order
             <img class="ps__frame" data-focus="50% 30%" …>
             <video class="ps__frame" src="…" muted playsinline preload="metadata"></video>
           </div>
           <div class="ps__header"><p class="ps__label">…</p><button class="ps__close">…</button></div>
         <a class="ps__card" href="…">…</a>
         </article>
       </div>
     </product-stories>
   The progress bars and pause button are added here; everything else is in the markup.
   A video frame holds for the clip's own length instead of data-seconds. */
(() => {
  if (customElements.get("product-stories")) return;

  const HOLD_MS = 200;       // press longer than this pauses instead of tapping
  const DRAG_START = 10;     // px of vertical travel before a press becomes a swipe
  const SNAP_RATIO = .2;     // swipe past 20% of the height to change products
  const FLICK = .5;          // or flick faster than 0.5px/ms
  const EDGE_RESIST = .35;   // rubber band at the first and last product
  const WHEEL_LOCK_MS = 700; // one product per wheel gesture

  const ICON_PAUSE = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z"/></svg>';

  class ProductStories extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector(".ps__track");
      this.stories = [...this.querySelectorAll(".ps__story")];
      if (!this.track || !this.stories.length) return;

      this.index = 0;
      this.frameIndex = this.stories.map(() => 0); // each product resumes where it was left
      this.autoplay = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.held = false;
      this.style.setProperty("--ps-duration", (parseFloat(this.dataset.seconds) || 5) + "s");
      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;

      this.stories.forEach(story => {
        if (story.querySelector(".ps__progress")) return; // reconnect: already built
        const frames = story.querySelectorAll(".ps__frame");
        const bar = document.createElement("div");
        bar.className = "ps__progress";
        bar.setAttribute("role", "img");
        bar.innerHTML = [...frames].map(() => '<span class="ps__segment"><i></i></span>').join("");
        story.prepend(bar);
        frames.forEach(img => img.dataset.focus && img.style.setProperty("--ps-focus", img.dataset.focus));
      });

      if (!this.pauseBtn) {
        this.pauseBtn = document.createElement("button");
        this.pauseBtn.type = "button";
        this.pauseBtn.className = "ps__pause";
        this.status = document.createElement("span");
        this.status.className = "ps__sr";
        this.status.setAttribute("aria-live", "polite");
        this.append(this.pauseBtn, this.status);
      }

      this.on = [
        [this, "pointerdown", this.onDown],
        [this, "pointermove", this.onMove],
        [this, "pointerup", this.onUp],
        [this, "pointercancel", this.onCancel],
        [this, "wheel", this.onWheel, { passive: false }],
        [this, "keydown", this.onKey],
        [this, "animationend", this.onFillEnd],
        // Media events don't bubble, so listen in the capture phase
        [this, "loadedmetadata", this.onVideoMeta, true],
        [this, "waiting", this.onVideoWaiting, true],
        [this, "playing", this.onVideoPlaying, true],
        [this, "click", this.onClick],
        [this, "shopify:block:select", this.onBlockSelect],
        [this, "shopify:block:deselect", this.onBlockDeselect],
        [document, "visibilitychange", this.onVisibility]
      ].map(([target, type, fn, opts]) => {
        const bound = fn.bind(this);
        target.addEventListener(type, bound, opts);
        return [target, type, bound, opts];
      });

      this.classList.add("is-ready");
      this.render(true);
    }

    disconnectedCallback() {
      (this.on || []).forEach(([target, type, fn, opts]) => target.removeEventListener(type, fn, opts));
      this.on = null;
      clearTimeout(this.holdTimer);
      this.querySelectorAll("video.ps__frame").forEach(v => v.pause());
      this.classList.remove("is-ready", "is-dragging", "is-holding", "is-paused", "is-static", "is-buffering");
    }

    /* ---------- State ---------- */

    get frames() { return [...this.stories[this.index].querySelectorAll(".ps__frame")]; }

    nextFrame() {
      const f = this.frameIndex[this.index];
      if (f < this.frames.length - 1) { this.frameIndex[this.index] = f + 1; this.render(true); }
      else if (this.index < this.stories.length - 1) this.goToStory(this.index + 1);
      else { this.autoplay = false; this.render(false); } // end of the last product: stop there
    }

    prevFrame() {
      const f = this.frameIndex[this.index];
      if (f > 0) { this.frameIndex[this.index] = f - 1; this.render(true); }
      else if (this.index > 0) this.goToStory(this.index - 1);
      else this.render(true); // first photo of the first product: restart it
    }

    goToStory(i) {
      this.index = Math.max(0, Math.min(this.stories.length - 1, i));
      this.render(true);
    }

    setAutoplay(on) {
      this.autoplay = on;
      this.render(false);
      this.status.textContent = on ? "" : (this.dataset.labelPaused || "Paused");
    }

    /* restart: begin the current photo's timer from zero */
    render(restart) {
      this.track.style.transform = `translateY(${-this.index * 100}%)`;
      this.classList.toggle("is-static", !this.autoplay);
      this.classList.toggle("is-paused", this.held || document.hidden);

      this.stories.forEach((story, s) => {
        const active = s === this.index;
        const current = this.frameIndex[s];
        story.toggleAttribute("inert", !active);
        story.setAttribute("aria-hidden", String(!active));
        story.querySelectorAll(".ps__frame").forEach((img, f) => {
          img.classList.toggle("is-active", f === current);
          img.setAttribute("aria-hidden", String(f !== current));
        });
        const segments = story.querySelectorAll(".ps__segment");
        const frames = story.querySelectorAll(".ps__frame");
        segments.forEach((seg, f) => {
          seg.classList.toggle("is-done", f < current);
          // A clip's segment runs for the clip's length
          const v = frames[f];
          if (v.tagName === "VIDEO" && v.duration) seg.style.setProperty("--ps-duration", v.duration + "s");
          // Only the visible product's current segment runs
          const on = active && f === current;
          if (on && restart) { seg.classList.remove("is-active"); void seg.offsetWidth; }
          seg.classList.toggle("is-active", on);
        });
        const label = (this.dataset.labelProgress || "Photo {current} of {total}")
          .replace("{current}", current + 1).replace("{total}", segments.length);
        story.querySelector(".ps__progress").setAttribute("aria-label", label);
      });

      const label = this.autoplay ? this.dataset.labelPause || "Pause" : this.dataset.labelPlay || "Play";
      this.pauseBtn.setAttribute("aria-label", label);
      this.pauseBtn.innerHTML = this.autoplay ? ICON_PAUSE : ICON_PLAY;
      this.syncVideos(restart);
      this.preload();
    }

    /* Only the visible clip plays, and only while its segment is running */
    syncVideos(restart) {
      const running = this.autoplay && !this.held && !document.hidden;
      if (this.frames[this.frameIndex[this.index]].tagName !== "VIDEO") this.classList.remove("is-buffering");
      this.stories.forEach((story, s) => {
        story.querySelectorAll("video.ps__frame").forEach(v => {
          const current = s === this.index && v.classList.contains("is-active");
          if (!current) {
            if (!v.paused) v.pause();
            if (restart) v.currentTime = 0; // start from the top next time it's shown
            return;
          }
          if (restart) v.currentTime = 0;
          if (running) v.play().catch(() => {}); // autoplay can be refused; the segment still runs
          else v.pause();
        });
      });
    }

    /* Load the next photo and the next product's current photo ahead of time */
    preload() {
      const frames = this.frames;
      const next = [frames[this.frameIndex[this.index]], frames[this.frameIndex[this.index] + 1]];
      [this.index - 1, this.index + 1].forEach(s => {
        const story = this.stories[s];
        if (story) next.push(story.querySelectorAll(".ps__frame")[this.frameIndex[s]]);
      });
      next.forEach(el => {
        if (!el) return;
        if (el.tagName === "VIDEO") { if (el.preload !== "auto") el.preload = "auto"; }
        else if (el.loading === "lazy") el.loading = "eager";
      });
    }

    /* ---------- Input ---------- */

    isControl(target) { return target.closest(".ps__card, .ps__pause, a, button"); }

    onDown(e) {
      if (e.button !== 0 || this.isControl(e.target)) return;
      e.preventDefault(); // stops a native drag from cancelling the pointer on desktop
      this.focus({ preventScroll: true });
      // Screen px per layout px, for when a container scales the stories (transform)
      this.scale = this.getBoundingClientRect().height / this.offsetHeight || 1;
      this.press = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId, drag: false };
      try { this.setPointerCapture(e.pointerId); } catch (err) {} // the pointer may already be gone
      clearTimeout(this.holdTimer);
      this.holdTimer = setTimeout(() => {
        this.held = true;
        this.classList.add("is-holding");
        this.render(false);
      }, HOLD_MS);
    }

    onMove(e) {
      const p = this.press;
      if (!p || e.pointerId !== p.id) return;
      const dx = (e.clientX - p.x) / this.scale, dy = (e.clientY - p.y) / this.scale;
      if (!p.drag && Math.abs(dy) > DRAG_START && Math.abs(dy) > Math.abs(dx)) {
        p.drag = true;
        clearTimeout(this.holdTimer);
        this.held = true; // the timer waits while the finger is down
        this.classList.remove("is-holding");
        this.classList.add("is-dragging");
        this.render(false);
      }
      if (!p.drag) return;
      const atEdge = (dy > 0 && this.index === 0) || (dy < 0 && this.index === this.stories.length - 1);
      const offset = atEdge ? dy * EDGE_RESIST : dy;
      this.track.style.transform = `translateY(calc(${-this.index * 100}% + ${offset}px))`;
    }

    onUp(e) {
      const p = this.press;
      if (!p || e.pointerId !== p.id) return;
      this.press = null;
      clearTimeout(this.holdTimer);
      const wasHeld = this.held;
      this.held = false;
      this.classList.remove("is-holding", "is-dragging");

      if (p.drag) {
        const dy = (e.clientY - p.y) / this.scale;
        const v = dy / Math.max(1, e.timeStamp - p.t);
        const far = Math.abs(dy) > this.clientHeight * SNAP_RATIO || Math.abs(v) > FLICK;
        if (far && dy < 0 && this.index < this.stories.length - 1) this.goToStory(this.index + 1);
        else if (far && dy > 0 && this.index > 0) this.goToStory(this.index - 1);
        else this.render(false); // snap back and carry on
        return;
      }
      if (wasHeld) { this.render(false); return; } // releasing a hold resumes, it doesn't tap

      const x = (e.clientX - this.getBoundingClientRect().left) / this.scale;
      if (x < this.clientWidth / 3) this.prevFrame(); else this.nextFrame();
    }

    onCancel() {
      this.press = null;
      clearTimeout(this.holdTimer);
      this.held = false;
      this.classList.remove("is-holding", "is-dragging");
      this.render(false);
    }

    onClick(e) {
      if (e.target.closest(".ps__pause")) this.setAutoplay(!this.autoplay);
      // Closing is the theme's call (back, a drawer, a route), so just announce it
      if (e.target.closest(".ps__close")) this.dispatchEvent(new CustomEvent("product-stories:close", { bubbles: true }));
    }

    onWheel(e) {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (this.wheelLocked || Math.abs(e.deltaY) < 20) return;
      this.wheelLocked = true;
      setTimeout(() => { this.wheelLocked = false; }, WHEEL_LOCK_MS);
      this.goToStory(this.index + (e.deltaY > 0 ? 1 : -1));
    }

    onKey(e) {
      if (e.target.closest("a, button") && (e.key === " " || e.key === "Enter")) return;
      const keys = {
        ArrowRight: () => this.nextFrame(),
        ArrowLeft: () => this.prevFrame(),
        ArrowDown: () => this.goToStory(this.index + 1),
        ArrowUp: () => this.goToStory(this.index - 1),
        " ": () => this.setAutoplay(!this.autoplay)
      };
      if (!keys[e.key]) return;
      e.preventDefault();
      keys[e.key]();
    }

    onFillEnd(e) {
      if (e.animationName === "ps-fill" && this.autoplay) this.nextFrame();
    }

    onVisibility() { this.render(false); }

    // Once a clip's length is known, its segment restarts at that length
    onVideoMeta(e) {
      if (!e.target.matches("video.ps__frame")) return;
      this.render(this.frames[this.frameIndex[this.index]] === e.target);
    }

    // The progress bar waits while the visible clip buffers
    onVideoWaiting(e) {
      if (e.target.matches("video.ps__frame.is-active")) this.classList.add("is-buffering");
    }

    onVideoPlaying(e) {
      if (e.target.matches("video.ps__frame")) this.classList.remove("is-buffering");
    }

    onBlockSelect(e) {
      const i = this.stories.indexOf(e.target.closest(".ps__story"));
      if (i < 0) return;
      this.autoplayBeforeEditor ??= this.autoplay;
      this.autoplay = false;
      this.goToStory(i);
    }

    onBlockDeselect() {
      if (this.autoplayBeforeEditor === undefined) return;
      this.setAutoplay(this.autoplayBeforeEditor);
      this.autoplayBeforeEditor = undefined;
    }
  }

  customElements.define("product-stories", ProductStories);
})();
