(() => {
  const section = document.querySelector('[data-agreement-immersive]');
  if (!section) return;

  const stage = section.querySelector('.agreement-immersive__stage');
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
    const opening = windowed(progress, .16, .74);
    const paths = windowed(progress, .26, .78);
    const settle = windowed(progress, .76, .92);
    const copies = [
      pulse(progress, .02, .06, .13, .19),
      pulse(progress, .15, .20, .27, .34),
      pulse(progress, .30, .35, .42, .49),
      pulse(progress, .45, .50, .57, .64),
      windowed(progress, .60, .66)
    ];

    stage.style.setProperty('--agreement-open', opening.toFixed(4));
    stage.style.setProperty('--agreement-grid-opacity', (.72 * (1 - opening) + .05 * settle).toFixed(3));
    stage.style.setProperty('--agreement-gate-opacity', (.82 * (1 - opening)).toFixed(3));
    stage.style.setProperty('--agreement-path-offset', (1 - paths).toFixed(4));
    stage.style.setProperty('--agreement-path-opacity', (paths * (.74 - settle * .18)).toFixed(3));
    stage.style.setProperty('--agreement-glow-opacity', (opening * (.46 - settle * .08)).toFixed(3));
    stage.style.setProperty('--agreement-scale', (1.035 - opening * .035).toFixed(4));
    stage.style.setProperty('--agreement-brightness', (.7 + opening * .3).toFixed(3));
    stage.style.setProperty('--agreement-saturation', (.58 + opening * .42).toFixed(3));
    copies.forEach((opacity, index) => {
      stage.style.setProperty(`--agreement-copy-${index + 1}`, opacity.toFixed(3));
      stage.style.setProperty(`--agreement-copy-${index + 1}-y`, `${((1 - opacity) * 10).toFixed(2)}px`);
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
