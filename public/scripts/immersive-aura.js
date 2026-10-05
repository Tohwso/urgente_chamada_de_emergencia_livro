(() => {
  const section = document.querySelector('[data-aura-immersive]');
  if (!section) return;

  const fallback = section.querySelector('.aura-immersive__fallback');
  const experience = section.querySelector('.aura-immersive__experience');
  const stage = section.querySelector('.aura-immersive__stage');
  if (!fallback || !experience || !stage) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopQuery = window.matchMedia('(min-width: 761px)');

  let enabled = false;
  let ticking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = (value) => {
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

    // Preserve a long, quiet OFF state; then let the perceptual layer bloom.
    const reveal = smoothstep((progress - 0.32) / 0.42);
    const radius = reveal * 86;
    const commandOpacity = pulse(progress, 0.10, 0.20, 0.34, 0.46);
    // "O mundo explodiu." is narrative text, so it fades in and remains
    // visible for the rest of the immersive beat instead of fading away.
    const explosionOpacity = windowed(progress, 0.62, 0.72);

    stage.style.setProperty('--aura-radius', radius.toFixed(2) + '%');
    stage.style.setProperty('--aura-on-opacity', reveal.toFixed(3));
    stage.style.setProperty('--aura-bloom-opacity', (reveal * 0.9).toFixed(3));
    stage.style.setProperty('--aura-scale', (1 + reveal * 0.018).toFixed(4));
    stage.style.setProperty('--aura-command-opacity', commandOpacity.toFixed(3));
    stage.style.setProperty('--aura-command-y', windowed(progress, 0.10, 0.24).toFixed(3));
    stage.style.setProperty('--aura-explosion-opacity', explosionOpacity.toFixed(3));
    stage.style.setProperty('--aura-explosion-y', windowed(progress, 0.62, 0.78).toFixed(3));
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
    fallback.hidden = true;
    experience.hidden = false;
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender, { passive: true });
    render();
  };

  const disable = () => {
    if (!enabled) {
      fallback.hidden = false;
      experience.hidden = true;
      section.classList.remove('is-enhanced');
      return;
    }
    enabled = false;
    section.classList.remove('is-enhanced');
    fallback.hidden = false;
    experience.hidden = true;
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
