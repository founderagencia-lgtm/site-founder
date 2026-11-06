export function initHeroStack(caps) {
  const { gsap } = window;
  const stack = document.querySelector('.float-stack');
  if (!gsap || !stack || caps.reducedMotion || matchMedia('(hover: none)').matches) return;
  const layers = [...stack.querySelectorAll('.float-card')].map((card) => ({
    depth: Number(card.dataset.depth),
    x: gsap.quickTo(card, 'x', { duration: .9, ease: 'power3.out' }),
    y: gsap.quickTo(card, 'y', { duration: .9, ease: 'power3.out' }),
  }));
  addEventListener('pointermove', (event) => {
    const offsetX = event.clientX / innerWidth - .5;
    const offsetY = event.clientY / innerHeight - .5;
    layers.forEach(({ depth, x, y }) => {
      x(offsetX * depth);
      y(offsetY * depth);
    });
  }, { passive: true });
}

export function initCompare(caps) {
  const root = document.querySelector('.compare');
  const buttons = [...root.querySelectorAll('[data-view]')];
  let touched = false;
  const show = (view) => {
    root.dataset.showing = view;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  };
  buttons.forEach((button) => button.addEventListener('click', () => {
    touched = true;
    show(button.dataset.view);
  }));
  const { ScrollTrigger } = window;
  if (!ScrollTrigger || caps.reducedMotion) return;
  show('sem');
  ScrollTrigger.create({
    trigger: root,
    start: 'top 55%',
    once: true,
    onEnter: () => setTimeout(() => { if (!touched) show('com'); }, 1600),
  });
}

export function initProgress(caps) {
  const { ScrollTrigger } = window;
  if (!ScrollTrigger || caps.reducedMotion) return;
  const bar = document.querySelector('.scroll-progress i');
  const steps = document.querySelector('.steps');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
  });
  ScrollTrigger.create({
    trigger: steps,
    start: 'top 65%',
    end: 'bottom 65%',
    onUpdate: (self) => { steps.style.setProperty('--progress', self.progress); },
  });
}
