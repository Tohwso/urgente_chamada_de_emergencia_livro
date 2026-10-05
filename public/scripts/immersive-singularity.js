(() => {
  const root = document.querySelector('[data-singularity-immersive]');
  if (!root) return;

  const stage = root.querySelector('.singularity-immersive__stage');
  const breakingPoint = root.querySelector('.singularity-immersive__break');
  const media = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  const windowed = (value, start, end) => smooth(clamp((value - start) / Math.max(.001, end - start)));
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
    const sectionTop = scrollY + rect.top;
    const breakRect = breakingPoint.getBoundingClientRect();
    const breakCenter = scrollY + breakRect.top + breakRect.height * .5;
    const breakAt = clamp((breakCenter - sectionTop - innerHeight * .5) / travel);
    const rupture = pulse(progress, breakAt - .022, breakAt - .008, breakAt + .012, breakAt + .035);
    const aftermath = windowed(progress, breakAt + .018, Math.min(.998, breakAt + .105));
    const scale = 1.06 + smooth(progress) * .68 + aftermath * .18;

    stage.style.setProperty('--singularity-progress', progress.toFixed(3));
    stage.style.setProperty('--singularity-break-at', breakAt.toFixed(3));
    stage.style.setProperty('--singularity-scale', scale.toFixed(4));
    stage.style.setProperty('--singularity-rupture', rupture.toFixed(3));
    stage.style.setProperty('--singularity-flash', Math.min(1, rupture * 1.18).toFixed(3));
    stage.style.setProperty('--singularity-split', `${(rupture * 30).toFixed(2)}px`);
    stage.style.setProperty('--singularity-split-upper-y', `${(rupture * -9).toFixed(2)}px`);
    stage.style.setProperty('--singularity-split-lower-x', `${(rupture * -30).toFixed(2)}px`);
    stage.style.setProperty('--singularity-split-lower-y', `${(rupture * 9).toFixed(2)}px`);
    stage.style.setProperty('--singularity-base-opacity', (1 - rupture * .82).toFixed(3));
    stage.style.setProperty('--singularity-shake-x', `${(rupture * 7).toFixed(2)}px`);
    stage.style.setProperty('--singularity-shake-y', `${(rupture * -3).toFixed(2)}px`);
    stage.style.setProperty('--singularity-brightness', (1 + rupture * .42 - aftermath * .46).toFixed(3));
    stage.style.setProperty('--singularity-contrast', (1 + rupture * .36).toFixed(3));
    stage.style.setProperty('--singularity-aftermath', (aftermath * .9).toFixed(3));
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
