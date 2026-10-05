(() => {
  const root = document.querySelector('[data-primordial-immersive]');
  if (!root) return;

  const stage = root.querySelector('.primordial-immersive__stage');
  const media = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  const windowed = (value, start, end) => smooth(clamp((value - start) / (end - start)));
  const pulse = (value, fadeIn, peak, fadeOut) => {
    if (value <= fadeIn || value >= fadeOut) return 0;
    if (value < peak) return windowed(value, fadeIn, peak);
    return 1 - windowed(value, peak, fadeOut);
  };

  let enabled = false;
  let ticking = false;

  const render = () => {
    ticking = false;
    if (!enabled) return;

    const rect = root.getBoundingClientRect();
    const travel = Math.max(1, rect.height - innerHeight);
    const progress = clamp(-rect.top / travel);
    const toSecond = windowed(progress, .2, .33);
    const toThird = windowed(progress, .5, .64);

    stage.style.setProperty('--primordial-layer-1', (1 - toSecond).toFixed(3));
    stage.style.setProperty('--primordial-layer-2', (toSecond * (1 - toThird)).toFixed(3));
    stage.style.setProperty('--primordial-layer-3', toThird.toFixed(3));
    stage.style.setProperty('--primordial-image-y', `${(-.8 + progress * 1.6).toFixed(2)}%`);
    stage.style.setProperty('--primordial-image-scale', (1.035 + progress * .012).toFixed(4));
    stage.style.setProperty('--primordial-brightness', (.98 - progress * .08).toFixed(3));
    stage.style.setProperty('--primordial-saturation', (.97 - progress * .05).toFixed(3));
    stage.style.setProperty('--primordial-depth', progress.toFixed(3));
    stage.style.setProperty('--primordial-resonance', Math.max(
      pulse(progress, .39, .455, .51),
      pulse(progress, .72, .77, .83)
    ).toFixed(3));
  };

  const requestRender = () => {
    if (!enabled || ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  const sync = () => {
    enabled = media.matches;
    root.classList.toggle('is-enhanced', enabled);
    stage.removeAttribute('style');
    if (enabled) render();
  };

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', requestRender, { passive: true });
  media.addEventListener('change', sync);
  sync();
})();
