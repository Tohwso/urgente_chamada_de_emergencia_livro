(() => {
  const section = document.querySelector('[data-pulse-immersive]');
  if (!section) return;

  const stage = section.querySelector('.pulse-immersive__stage');
  if (!stage) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopQuery = window.matchMedia('(min-width: 761px)');
  let enabled = false;
  let ticking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = value => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };
  const windowed = (progress, start, end) => smoothstep((progress - start) / (end - start));
  const pulse = (progress, fadeInStart, peakStart, peakEnd, fadeOutEnd) => {
    if (progress <= fadeInStart || progress >= fadeOutEnd) return 0;
    if (progress < peakStart) return windowed(progress, fadeInStart, peakStart);
    if (progress <= peakEnd) return 1;
    return 1 - windowed(progress, peakEnd, fadeOutEnd);
  };

  const render = () => {
    ticking = false;
    if (!enabled) return;

    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const progress = clamp(-rect.top / travel);
    const reveal = windowed(progress, 0.15, 0.72);
    const dissolve = windowed(progress, 0.54, 0.78);
    const revealPercent = reveal * 100;
    const edgeStart = reveal === 0 ? 0 : Math.max(0, revealPercent - 8);
    const edgeEnd = reveal === 0 ? 0 : Math.min(100, revealPercent + 3);

    stage.style.setProperty('--pulse-reveal', `${revealPercent.toFixed(2)}%`);
    stage.style.setProperty('--pulse-edge-start', `${edgeStart.toFixed(2)}%`);
    stage.style.setProperty('--pulse-edge-end', `${edgeEnd.toFixed(2)}%`);
    stage.style.setProperty('--pulse-front-x', `${(7 + reveal * 82).toFixed(2)}%`);
    stage.style.setProperty('--pulse-front-opacity', (pulse(progress, 0.10, 0.18, 0.48, 0.75) * (1 - dissolve * 0.7) * 0.55).toFixed(3));
    stage.style.setProperty('--pulse-front-blur', `${(6 + dissolve * 20).toFixed(2)}px`);
    stage.style.setProperty('--pulse-front-spread', (1 + dissolve * 1.35).toFixed(3));
    stage.style.setProperty('--pulse-arrival-opacity', pulse(progress, 0.08, 0.17, 0.46, 0.62).toFixed(3));
    stage.style.setProperty('--pulse-failure-opacity', windowed(progress, 0.66, 0.78).toFixed(3));
    stage.style.setProperty('--pulse-scale', (1 + reveal * 0.008).toFixed(4));
  };

  const requestRender = () => {
    if (!enabled || ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  const enable = () => {
    if (enabled || motionQuery.matches || !desktopQuery.matches) return;
    enabled = true;
    section.classList.add('is-enhanced');
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender, { passive: true });
    render();
  };

  const disable = () => {
    enabled = false;
    section.classList.remove('is-enhanced');
    window.removeEventListener('scroll', requestRender);
    window.removeEventListener('resize', requestRender);
    stage.removeAttribute('style');
  };

  const syncMode = () => {
    if (!motionQuery.matches && desktopQuery.matches) enable();
    else disable();
  };

  if (motionQuery.addEventListener) motionQuery.addEventListener('change', syncMode);
  else motionQuery.addListener(syncMode);
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', syncMode);
  else desktopQuery.addListener(syncMode);

  syncMode();
})();
