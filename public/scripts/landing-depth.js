(() => {
  const hero = document.querySelector(".official-hero");
  if (!hero) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 901px) and (pointer: fine)");
  let enabled = false, visible = true, frame = 0;
  const clear = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    hero.style.removeProperty("--city-depth");
    hero.style.removeProperty("--book-depth");
  };
  const draw = () => {
    frame = 0;
    if (!enabled || !visible || document.hidden) return;
    const rect = hero.getBoundingClientRect();
    const heroEnd = window.scrollY + rect.bottom;
    const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, heroEnd)));
    // Translation only: no scaling, rotation, warping, or inner cover layers.
    hero.style.setProperty("--city-depth", (-140 * progress).toFixed(2) + "px");
    hero.style.setProperty("--book-depth", (80 * progress).toFixed(2) + "px");
  };
  const schedule = () => {
    if (enabled && visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
  };
  const sync = () => {
    const eligible = desktop.matches && !reduced.matches;
    enabled = eligible;
    hero.classList.toggle("depth-enabled", enabled);
    window.removeEventListener("scroll", schedule);
    if (enabled) window.addEventListener("scroll", schedule, { passive: true });
    clear();
    schedule();
  };
  reduced.addEventListener("change", sync);
  desktop.addEventListener("change", sync);
  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      hero.classList.toggle("depth-visible", visible);
      if (!visible) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    }).observe(hero);
  }
  sync();
})();
