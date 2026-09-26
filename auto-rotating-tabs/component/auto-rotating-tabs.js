/*
  Auto-rotating tabs
  A dependency-free custom element that enhances server-rendered markup
  (a Shopify section, or any HTML). Content lives in the markup; this script
  only adds behavior. Without JS, the component shows the first tab (lg)
  or a stacked list (sm).

  Attributes:
    data-interval="6"      seconds per tab
    data-autoplay="false"  start paused (autoplay is also off under reduced motion)
*/
if (!customElements.get('auto-rotating-tabs')) {
  const LG_MIN = 700; // keep in sync with the @container breakpoint in the CSS
  const ICON_PAUSE = '<path d="M4.5 3h5v18h-5zM14.5 3h5v18h-5z"/>';
  const ICON_PLAY = '<path d="M22 12a1.37 1.37 0 0 1-.65 1.17L9.07 20.8a1.37 1.37 0 0 1-2.07-1.17V4.37A1.37 1.37 0 0 1 9.07 3.2l12.28 7.63A1.37 1.37 0 0 1 22 12z"/>';
  let uid = 0;

  class AutoRotatingTabs extends HTMLElement {
    connectedCallback() {
      this.items = [...this.querySelectorAll('.art__item')];
      if (!this.items.length) return;

      this.uid = this.id || `art-${++uid}`;
      this.intervalMs = (parseFloat(this.dataset.interval) || 6) * 1000;
      this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.userPaused = this.dataset.autoplay === 'false' || this.reduceMotion;
      this.focused = this.editorPaused = false;
      this.visible = true;
      this.lg = null;
      this.elapsed = 0;
      this.last = 0;
      this.active = Math.max(0, this.items.findIndex(item => item.classList.contains('is-active')));
      this.bars = this.items.map(item => item.querySelector('.art__timer i'));
      this.list = this.querySelector('.art__list');
      this.control = this.querySelector('.art__control');
      this.classList.add('is-enhanced');

      this.items.forEach((item, i) => {
        const body = item.querySelector('.art__body');
        if (body && !body.id) body.id = `${this.uid}-body-${i}`;
        item.addEventListener('click', () => { if (this.lg) this.go(i); });
      });

      this.list.addEventListener('keydown', this.onKeydown);
      this.addEventListener('focusin', this.onFocus);
      this.addEventListener('focusout', this.onFocus);
      document.addEventListener('visibilitychange', this.onVisibility);
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('shopify:block:deselect', this.onBlockSelect);
      if (this.control) {
        this.control.hidden = false;
        this.control.addEventListener('click', this.onControl);
        this.updateControl();
      }

      this.resizeObserver = new ResizeObserver(([entry]) => this.setLayout(entry.contentRect.width >= LG_MIN));
      this.resizeObserver.observe(this);
      this.visibilityObserver = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; }, { threshold: .25 });
      this.visibilityObserver.observe(this);
      this.seenObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-seen');
          this.seenObserver.unobserve(entry.target);
        });
      }, { threshold: .35 });

      this.setLayout(this.offsetWidth >= LG_MIN);

      this.frame = requestAnimationFrame(this.tick);
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.frame);
      this.resizeObserver?.disconnect();
      this.visibilityObserver?.disconnect();
      this.seenObserver?.disconnect();
      document.removeEventListener('visibilitychange', this.onVisibility);
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this.onBlockSelect);
    }

    get running() {
      return this.lg && this.visible && !document.hidden &&
        !this.userPaused && !this.focused && !this.editorPaused;
    }

    /* lg = tabs with one open row; sm = every card open and stacked */
    setLayout(lg) {
      if (lg === this.lg) return;
      this.lg = lg;
      this.items.forEach(item => {
        const title = item.querySelector('.art__title');
        const button = title.querySelector('button');
        if (lg && !button) {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-controls', item.querySelector('.art__body').id);
          b.append(...title.childNodes);
          title.append(b);
        } else if (!lg && button) {
          title.replaceChildren(...button.childNodes);
        }
        if (lg) {
          this.seenObserver.unobserve(item);
        } else {
          item.classList.remove('is-seen');
          this.seenObserver.observe(item);
        }
      });
      this.elapsed = 0;
      this.render();
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
        this.leavingTimer = setTimeout(() => prev.classList.remove('is-leaving'), 900);
      }
      this.render();
    }

    render() {
      this.items.forEach((item, n) => {
        const on = n === this.active;
        item.classList.toggle('is-active', on);
        const button = item.querySelector('.art__title button');
        if (button) {
          button.setAttribute('aria-expanded', on);
          button.tabIndex = on ? 0 : -1;
        }
        // Collapsed rows and hidden media leave the accessibility tree on lg only
        const hide = this.lg && !on;
        item.querySelector('.art__body')?.toggleAttribute('inert', hide);
        item.querySelector('.art__media')?.toggleAttribute('inert', hide);
      });
      this.bars.forEach(bar => { if (bar) bar.style.transform = 'scaleX(0)'; });
    }

    tick = now => {
      const dt = this.last ? now - this.last : 0;
      this.last = now;
      if (this.running) {
        this.elapsed += dt;
        if (this.elapsed >= this.intervalMs) this.go((this.active + 1) % this.items.length);
        const bar = this.bars[this.active];
        if (bar) bar.style.transform = `scaleX(${Math.min(this.elapsed / this.intervalMs, 1)})`;
      }
      this.frame = requestAnimationFrame(this.tick);
    };

    onKeydown = e => {
      if (!this.lg || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const n = this.items.length;
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1
        : (this.active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
      this.go(next);
      this.items[next].querySelector('.art__title button')?.focus();
    };

    /* Keyboard focus inside the component holds the current tab */
    onFocus = e => {
      this.focused = e.type === 'focusin' ? e.target.matches(':focus-visible') : this.contains(e.relatedTarget);
    };

    onVisibility = () => { this.last = 0; };

    onControl = () => {
      this.userPaused = !this.userPaused;
      this.updateControl();
    };

    updateControl() {
      this.control.setAttribute('aria-label', this.userPaused ? 'Play' : 'Pause');
      const svg = this.control.querySelector('svg');
      if (svg) svg.innerHTML = this.userPaused ? ICON_PLAY : ICON_PAUSE;
    }

    /* Theme editor: selecting a block opens its tab and holds it there */
    onBlockSelect = e => {
      const i = this.items.findIndex(item => item.contains(e.target) || item === e.target);
      if (i === -1) return;
      this.editorPaused = e.type === 'shopify:block:select';
      if (this.editorPaused) this.go(i);
    };
  }

  customElements.define('auto-rotating-tabs', AutoRotatingTabs);
}
