/*
  Auto-rotating tabs: reference implementation.
  A dependency-free custom element that enhances server-rendered markup.
  Content lives in the markup; this script only adds behavior. Without JS,
  the wide layout shows the first tab and the narrow layout shows every card.

  Attributes:
    data-interval="6"         seconds per tab
    data-autoplay="false"     start paused (autoplay is also off under reduced motion)
    data-label-pause / -play  control labels, so themes can pass translated strings
*/
if (!customElements.get('auto-rotating-tabs')) {
  const LG_MIN = 700; // matches the @container breakpoint in the CSS
  const ICON_PAUSE = '<path d="M4.5 3h5v18h-5zM14.5 3h5v18h-5z"/>';
  const ICON_PLAY = '<path d="M22 12a1.37 1.37 0 0 1-.65 1.17L9.07 20.8a1.37 1.37 0 0 1-2.07-1.17V4.37A1.37 1.37 0 0 1 9.07 3.2l12.28 7.63A1.37 1.37 0 0 1 22 12z"/>';
  let uid = 0;

  class AutoRotatingTabs extends HTMLElement {
    connectedCallback() {
      if (!this.items) this.init();
      if (!this.items.length) return;
      this.listen(true);
      this.resizeObserver.observe(this);
      this.visibilityObserver.observe(this);
    }

    disconnectedCallback() {
      if (!this.items?.length) return;
      this.listen(false);
      this.resizeObserver.disconnect();
      this.visibilityObserver.disconnect();
      this.seenObserver.disconnect();
      clearTimeout(this.leavingTimer);
      this.lg = null;
      this.stop();
    }

    /* One-time setup; reconnecting (e.g. section reorder in the theme editor) reuses it */
    init() {
      this.items = [...this.querySelectorAll('.art__item')];
      if (!this.items.length) return;

      const id = this.id || `art-${++uid}`;
      this.intervalMs = (parseFloat(this.dataset.interval) || 6) * 1000;
      this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.userPaused = this.dataset.autoplay === 'false' || this.reduceMotion;
      this.focused = this.editorPaused = false;
      this.visible = true;
      this.lg = null;
      this.elapsed = 0;
      this.active = Math.max(0, this.items.findIndex(item => item.classList.contains('is-active')));
      this.list = this.querySelector('.art__list');
      this.control = this.querySelector('.art__control');
      this.bars = this.items.map(item => item.querySelector('.art__timer i'));
      this.buttons = this.items.map((item, i) => {
        const body = item.querySelector('.art__body');
        const button = item.querySelector('.art__title button');
        if (body && !body.id) body.id = `${id}-body-${i}`;
        if (body && button) button.setAttribute('aria-controls', body.id);
        return button;
      });

      this.resizeObserver = new ResizeObserver(([entry]) => this.setLayout(entry.contentRect.width >= LG_MIN));
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.update();
      }, { threshold: .25 });
      this.seenObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-seen');
          this.seenObserver.unobserve(entry.target);
        });
      }, { threshold: .35 });

      if (this.control) {
        this.control.hidden = false;
        this.updateControl();
      }
      this.classList.add('is-enhanced');
    }

    listen(on) {
      const method = on ? 'addEventListener' : 'removeEventListener';
      this.list[method]('click', this.onClick);
      this.list[method]('keydown', this.onKeydown);
      this[method]('focusin', this.onFocus);
      this[method]('focusout', this.onFocus);
      this.control?.[method]('click', this.onControl);
      document[method]('visibilitychange', this.onVisibility);
      document[method]('shopify:block:select', this.onBlockSelect);
      document[method]('shopify:block:deselect', this.onBlockSelect);
    }

    get running() {
      return this.lg && this.visible && !document.hidden &&
        !this.userPaused && !this.focused && !this.editorPaused;
    }

    /* The timer loop only exists while the component is actually rotating */
    update() {
      if (this.running && !this.frame) {
        this.last = 0;
        this.frame = requestAnimationFrame(this.tick);
      } else if (!this.running) {
        this.stop();
      }
    }

    stop() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }

    tick = now => {
      this.elapsed += this.last ? now - this.last : 0;
      this.last = now;
      if (this.elapsed >= this.intervalMs) this.go((this.active + 1) % this.items.length);
      const bar = this.bars[this.active];
      if (bar) bar.style.transform = `scaleX(${Math.min(this.elapsed / this.intervalMs, 1)})`;
      this.frame = requestAnimationFrame(this.tick);
    };

    /* lg = tabs with one open row; sm = every card open and stacked */
    setLayout(lg) {
      if (lg === this.lg) return;
      this.lg = lg;
      this.items.forEach(item => {
        if (lg) {
          this.seenObserver.unobserve(item);
        } else {
          item.classList.remove('is-seen');
          this.seenObserver.observe(item);
        }
      });
      this.elapsed = 0;
      this.render();
      this.update();
    }

    go(i) {
      if (i === this.active) { this.elapsed = 0; return; }
      const prev = this.items[this.active];
      this.active = i;
      this.elapsed = 0;
      this.items.forEach(item => item.classList.remove('is-leaving'));
      if (!this.reduceMotion) {
        prev.classList.add('is-leaving');
        clearTimeout(this.leavingTimer);
        this.leavingTimer = setTimeout(() => prev.classList.remove('is-leaving'), this.focusMs());
      }
      this.render();
    }

    render() {
      this.items.forEach((item, n) => {
        const on = n === this.active;
        const button = this.buttons[n];
        item.classList.toggle('is-active', on);
        if (button) {
          // Stacked cards are all open, so the titles stop acting as controls
          button.tabIndex = this.lg ? 0 : -1;
          if (this.lg) button.setAttribute('aria-expanded', on);
          else button.removeAttribute('aria-expanded');
        }
        const hide = this.lg && !on;
        item.querySelector('.art__body')?.toggleAttribute('inert', hide);
        item.querySelector('.art__media')?.toggleAttribute('inert', hide);
      });
      this.bars.forEach(bar => { if (bar) bar.style.transform = 'scaleX(0)'; });
    }

    focusMs() {
      const value = getComputedStyle(this).getPropertyValue('--art-focus-ms').trim();
      if (!value) return 900;
      return value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000;
    }

    onClick = e => {
      const i = this.items.indexOf(e.target.closest('.art__item'));
      if (this.lg && i > -1) this.go(i);
    };

    onKeydown = e => {
      if (!this.lg || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const n = this.items.length;
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1
        : (this.active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
      this.go(next);
      this.buttons[next]?.focus();
    };

    /* Keyboard focus on a tab holds it; focus on the pause control does not, so Play works */
    onFocus = e => {
      const target = e.type === 'focusin' ? e.target : e.relatedTarget;
      this.focused = Boolean(target && this.list.contains(target) && target.matches(':focus-visible'));
      this.update();
    };

    onVisibility = () => this.update();

    onControl = () => {
      this.userPaused = !this.userPaused;
      this.updateControl();
      this.update();
    };

    updateControl() {
      const label = this.userPaused ? this.dataset.labelPlay || 'Play' : this.dataset.labelPause || 'Pause';
      this.control.setAttribute('aria-label', label);
      const svg = this.control.querySelector('svg');
      if (svg) svg.innerHTML = this.userPaused ? ICON_PLAY : ICON_PAUSE;
    }

    /* Theme editor: selecting a block opens its tab and holds it there */
    onBlockSelect = e => {
      const i = this.items.findIndex(item => item === e.target || item.contains(e.target));
      if (i === -1) return;
      this.editorPaused = e.type === 'shopify:block:select';
      if (this.editorPaused) this.go(i);
      this.update();
    };
  }

  customElements.define('auto-rotating-tabs', AutoRotatingTabs);
}
