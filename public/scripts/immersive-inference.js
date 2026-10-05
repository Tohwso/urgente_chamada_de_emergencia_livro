(() => {
  const section = document.querySelector('[data-inference-immersive]');
  if (!section) return;

  const stage = section.querySelector('.inference-immersive__stage');
  if (!stage) return;

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const desktopQuery = matchMedia('(min-width: 761px)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };
  const windowed = (value, start, end) => smooth((value - start) / Math.max(.001, end - start));
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

    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, rect.height - innerHeight);
    const progress = clamp(-rect.top / travel);
    const reveal = windowed(progress, .02, .34);
    const screenReveal = clamp(
      windowed(progress, .38, .52) * .1
      + windowed(progress, .50, .65) * .9
    );
    const settle = windowed(progress, .62, .92);
    const copies = [
      pulse(progress, .02, .07, .16, .23),
      pulse(progress, .18, .24, .33, .40),
      pulse(progress, .35, .41, .50, .57),
      pulse(progress, .52, .58, .67, .74),
      windowed(progress, .70, .79)
    ];

    stage.style.setProperty('--inference-image-opacity', (.42 + reveal * .58).toFixed(3));
    stage.style.setProperty('--inference-scale', (1.065 - settle * .065).toFixed(4));
    stage.style.setProperty('--inference-brightness', (.62 + reveal * .38).toFixed(3));
    stage.style.setProperty('--inference-screen-dark', (1 - screenReveal).toFixed(3));
    copies.forEach((opacity, index) => {
      stage.style.setProperty(`--inference-copy-${index + 1}`, opacity.toFixed(3));
      stage.style.setProperty(`--inference-copy-${index + 1}-y`, `${((1 - opacity) * 10).toFixed(2)}px`);
    });
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
    addEventListener('scroll', requestRender, { passive: true });
    addEventListener('resize', requestRender, { passive: true });
    render();
  };

  const disable = () => {
    enabled = false;
    section.classList.remove('is-enhanced');
    removeEventListener('scroll', requestRender);
    removeEventListener('resize', requestRender);
    stage.removeAttribute('style');
  };

  const sync = () => {
    if (!motionQuery.matches && desktopQuery.matches) enable();
    else disable();
  };

  motionQuery.addEventListener('change', sync);
  desktopQuery.addEventListener('change', sync);
  sync();
})();
