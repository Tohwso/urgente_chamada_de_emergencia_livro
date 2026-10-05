(() => {
  const root = document.querySelector('[data-descent-immersive]');
  if (!root) return;

  const stage = root.querySelector('.descent-immersive__stage');
  const media = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  const windowed = (value, start, end) => smooth(clamp((value - start) / (end - start)));
  const pulse = (value, fadeInStart, peakStart, peakEnd, fadeOutEnd) => {
    if (value <= fadeInStart || value >= fadeOutEnd) return 0;
    if (value < peakStart) return windowed(value, fadeInStart, peakStart);
    if (value <= peakEnd) return 1;
    return 1 - windowed(value, peakEnd, fadeOutEnd);
  };

  let enabled = false;
  let ticking = false;

  const render = () => {
    ticking = false;
    if (!enabled) return;

    const rect = root.getBoundingClientRect();
    const travel = Math.max(1, rect.height - innerHeight);
    const progress = clamp(-rect.top / travel);
    const values = [
      pulse(progress, 0.02, 0.07, 0.15, 0.24),
      pulse(progress, 0.18, 0.23, 0.31, 0.4),
      pulse(progress, 0.34, 0.4, 0.49, 0.59),
      pulse(progress, 0.53, 0.59, 0.68, 0.78),
      windowed(progress, 0.74, 0.84)
    ];

    stage.style.setProperty('--descent-progress', progress.toFixed(3));
    stage.style.setProperty('--descent-image-y', `${(-16.65 * progress).toFixed(2)}%`);
    stage.style.setProperty('--descent-near-y', `${(-20.5 * progress).toFixed(2)}%`);
    stage.style.setProperty('--descent-image-scale', (1.015 + progress * 0.012).toFixed(4));
    stage.style.setProperty('--descent-depth', progress.toFixed(3));
    stage.style.setProperty('--descent-brightness', (1 - progress * 0.08).toFixed(3));
    stage.style.setProperty('--descent-saturation', (1 - progress * 0.08).toFixed(3));
    values.forEach((value, index) => {
      stage.style.setProperty(`--descent-step-${index + 1}`, value.toFixed(3));
      stage.style.setProperty(`--descent-step-${index + 1}-y`, `${((1 - value) * 18).toFixed(2)}px`);
    });
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
