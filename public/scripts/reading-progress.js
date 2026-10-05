(() => {
  "use strict";

  const entries = window.URGENTE_READING_ORDER;
  if (!Array.isArray(entries) || entries.length !== 51) return;
  const byFile = new Map(entries.map((entry) => [entry.file, entry]));
  const storageKey = "urgente.reading-progress.v1";
  const currentFile = decodeURIComponent(location.pathname.split("/").pop() || "");
  const current = byFile.get(currentFile);
  const roman = ["", "I", "II", "III"];
  const firstEntry = entries[0];
  let restartPending = false;

  function storedProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      if (!value || !byFile.has(value.file)) return null;
      return { file: value.file, ratio: Math.max(0, Math.min(1, Number(value.ratio) || 0)) };
    } catch { return null; }
  }

  function save(file, ratio) {
    try { localStorage.setItem(storageKey, JSON.stringify({ file, ratio, updatedAt: Date.now() })); }
    catch { /* Reading remains available when storage is blocked. */ }
  }

  if (!current) {
    const progress = storedProgress();
    if (!progress) return;
    const entry = byFile.get(progress.file);
    const destination = `./${entry.file}?retomar=1`;
    const label = `Continuar leitura — Ato ${roman[entry.act]} · ${entry.label}`;
    document.querySelectorAll("[data-reading-cta]").forEach((link) => {
      link.href = destination;
      link.textContent = link.classList.contains("official-nav-cta") ? "Continuar" : `${label} →`;
      link.setAttribute("aria-label", label);
    });
    return;
  }

  const previous = storedProgress();
  const resume = new URLSearchParams(location.search).get("retomar") === "1" && previous?.file === currentFile;
  const ratio = () => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    return maximum ? Math.max(0, Math.min(1, scrollY / maximum)) : 0;
  };
  let timer = 0;
  const persist = () => save(currentFile, ratio());
  const restartProgress = () => {
    restartPending = true;
    save(firstEntry.file, 0);
  };
  save(currentFile, previous?.file === currentFile ? previous.ratio : 0);

  if (resume && previous.ratio > 0) {
    const restore = () => {
      const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      scrollTo({ top: Math.round(maximum * previous.ratio), behavior: "instant" });
      persist();
    };
    addEventListener("load", restore, { once: true });
    if (document.readyState === "complete") restore();
  }

  addEventListener("scroll", () => {
    clearTimeout(timer);
    timer = setTimeout(persist, 250);
  }, { passive: true });
  addEventListener("pagehide", () => {
    if (!restartPending) persist();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("[data-reading-restart]")) return;
    restartProgress();
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const target = event.target;
    if (target instanceof Element && (target.closest("a, button, input, textarea, select, summary, [contenteditable], [role=dialog]") || target.isContentEditable)) return;
    if (document.querySelector("dialog[open], [aria-modal=true]")) return;
    const selector = event.key === "ArrowLeft" ? ".book-sequence--top .sequence-previous" : ".book-sequence--top .sequence-next";
    const link = document.querySelector(selector);
    if (!link) return;
    event.preventDefault();
    if (link.matches("[data-reading-restart]")) restartProgress();
    else persist();
    location.assign(link.href);
  });
})();
