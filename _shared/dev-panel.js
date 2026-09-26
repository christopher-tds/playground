/*
  Playground preview chrome: developer files drawer.
  Usage in an exploration's index.html:
    <button type="button" class="dev-btn" data-dev-panel>…Code</button>
    <script type="application/json" id="dev-files">
      [{ "label": "Overview", "path": "README.md" },
       { "label": "Section", "path": "shopify/section-x.liquid", "dest": "sections/x.liquid" }]
    </script>
  Files are fetched on first open. Highlighting (Prism) and Markdown (marked) load from jsDelivr.
*/
(() => {
  const trigger = document.querySelector("[data-dev-panel]");
  const config = document.getElementById("dev-files");
  if (!trigger || !config) return;

  const files = JSON.parse(config.textContent);
  const CDN = "https://cdn.jsdelivr.net/npm/";
  const LANG = { liquid: "liquid", css: "css", js: "javascript", html: "markup", json: "json" };
  const ext = path => path.split(".").pop().toLowerCase();
  const cache = new Map();
  let panel, tabs = [], active = 0, libs;

  const loadScript = src => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  function loadLibs() {
    if (libs) return libs;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CDN + "prismjs@1.29.0/themes/prism.min.css";
    document.head.appendChild(link);
    window.Prism = window.Prism || {};
    window.Prism.manual = true;
    libs = loadScript(CDN + "prismjs@1.29.0/prism.min.js")
      .then(() => loadScript(CDN + "prismjs@1.29.0/components/prism-markup-templating.min.js"))
      .then(() => Promise.all([
        loadScript(CDN + "prismjs@1.29.0/components/prism-liquid.min.js"),
        loadScript(CDN + "prismjs@1.29.0/components/prism-json.min.js"),
        loadScript(CDN + "marked@12.0.2/marked.min.js"),
      ]))
      .catch(() => {}); // Plain text still works if the CDN is unreachable
    return libs;
  }

  function build() {
    panel = document.createElement("div");
    panel.className = "dev-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <button type="button" class="dev-panel__backdrop" tabindex="-1" aria-label="Close"></button>
      <div class="dev-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="dev-panel-title">
        <div class="dev-panel__head">
          <h2 class="dev-panel__title" id="dev-panel-title">Developer files</h2>
          <button type="button" class="dev-panel__close" aria-label="Close">
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>
          </button>
        </div>
        <div class="dev-panel__tabs" role="tablist" aria-label="Files"></div>
        <div class="dev-panel__bar">
          <span class="dev-panel__path"></span>
          <span class="dev-panel__actions">
            <button type="button" class="dev-panel__action" data-copy>Copy</button>
            <a class="dev-panel__action" data-raw target="_blank" rel="noopener">Open raw</a>
          </span>
        </div>
        <div class="dev-panel__body" role="tabpanel" id="dev-panel-body" tabindex="0"></div>
      </div>`;
    document.body.appendChild(panel);

    const tablist = panel.querySelector(".dev-panel__tabs");
    tabs = files.map((f, i) => {
      const t = document.createElement("button");
      t.type = "button";
      t.className = "dev-panel__tab";
      t.setAttribute("role", "tab");
      t.setAttribute("aria-controls", "dev-panel-body");
      t.textContent = f.label;
      t.addEventListener("click", () => show(i));
      tablist.appendChild(t);
      return t;
    });
    tablist.addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const next = (active + (e.key === "ArrowRight" ? 1 : -1) + files.length) % files.length;
      show(next); tabs[next].focus();
    });

    panel.querySelector(".dev-panel__backdrop").addEventListener("click", close);
    panel.querySelector(".dev-panel__close").addEventListener("click", close);
    panel.addEventListener("keydown", e => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") trapFocus(e);
    });
    panel.querySelector("[data-copy]").addEventListener("click", async e => {
      const btn = e.currentTarget;
      const text = cache.get(files[active].path);
      if (text == null) return;
      try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; }
      catch { btn.textContent = "Copy failed"; }
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    });
  }

  function trapFocus(e) {
    const focusable = [...panel.querySelectorAll(".dev-panel__sheet button, .dev-panel__sheet a[href], .dev-panel__body")]
      .filter(el => el.offsetParent !== null);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  async function show(i) {
    active = i;
    const f = files[i];
    tabs.forEach((t, n) => {
      t.setAttribute("aria-selected", n === i);
      t.tabIndex = n === i ? 0 : -1;
    });
    panel.querySelector(".dev-panel__path").textContent = f.dest ? `${f.path}  →  theme ${f.dest}` : f.path;
    panel.querySelector("[data-raw]").href = f.path;
    const body = panel.querySelector(".dev-panel__body");
    body.innerHTML = `<p class="dev-panel__msg">Loading…</p>`;

    let text = cache.get(f.path);
    if (text == null) {
      try {
        const res = await fetch(f.path);
        if (!res.ok) throw new Error(res.status);
        text = await res.text();
        cache.set(f.path, text);
      } catch {
        if (active === i) body.innerHTML = `<p class="dev-panel__msg">Couldn't load ${f.path}.</p>`;
        return;
      }
    }
    await loadLibs();
    if (active !== i) return;

    const type = ext(f.path);
    if (type === "md" && window.marked) {
      body.innerHTML = `<div class="dev-panel__doc">${window.marked.parse(text)}</div>`;
      return;
    }
    const lang = LANG[type] || "none";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    pre.className = code.className = "language-" + lang;
    code.textContent = text;
    pre.appendChild(code);
    body.replaceChildren(pre);
    body.scrollTop = 0;
    if (window.Prism?.highlightElement && window.Prism.languages?.[lang]) window.Prism.highlightElement(code);
  }

  function open() {
    if (!panel) build();
    panel.hidden = false;
    document.body.classList.add("dev-panel-open");
    trigger.setAttribute("aria-expanded", "true");
    show(active);
    tabs[active].focus();
  }

  function close() {
    panel.hidden = true;
    document.body.classList.remove("dev-panel-open");
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", open);
})();
