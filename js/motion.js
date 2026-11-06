const motion = () => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return null;
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
};

function splitWords(element) {
  const wrapWords = (text) => text.split(/(\s+)/).map((part) => {
    if (!part.trim()) return document.createTextNode(' ');
    const outer = document.createElement('span');
    const inner = document.createElement('span');
    outer.className = 'w';
    inner.className = 'wi';
    inner.textContent = part;
    outer.append(inner);
    return outer;
  });
  [...element.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) node.replaceWith(...wrapWords(node.textContent));
    else node.replaceChildren(...wrapWords(node.textContent));
  });
  return element.querySelectorAll('.wi');
}

export function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('menu');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
}

export function initAnchors(caps) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    const target = link && document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: caps.reducedMotion ? 'auto' : 'smooth' });
    history.pushState(null, '', link.getAttribute('href'));
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

export function initIntro(caps, reveal) {
  const intro = document.getElementById('intro');
  const seen = document.documentElement.classList.contains('seen-intro');
  const lib = motion();
  if (seen || caps.reducedMotion || !lib) {
    intro.remove();
    reveal();
    return Promise.resolve();
  }
  try { sessionStorage.setItem('founder-intro', '1'); } catch { /* sessão indisponível */ }

  return new Promise((resolve) => {
    const finish = () => {
      removeEventListener('keydown', skip);
      intro.removeEventListener('pointerdown', skip);
      intro.remove();
      resolve();
    };
    const timeline = lib.gsap.timeline({ onComplete: finish });
    function skip() { timeline.progress(1); }
    addEventListener('keydown', skip);
    intro.addEventListener('pointerdown', skip);

    const words = intro.querySelectorAll('span');
    words.forEach((word, index) => {
      timeline.fromTo(word, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: .32, ease: 'power3.out' });
      if (index < words.length - 1) timeline.to(word, { opacity: 0, y: -36, duration: .22, ease: 'power2.in' }, '+=.18');
    });
    timeline.call(reveal, null, '+=.22');
    timeline.to(intro, { yPercent: -100, duration: .5, ease: 'power3.inOut' }, '<');
  });
}

export function revealHero(caps) {
  const lib = motion();
  const title = document.querySelector('h1');
  if (!lib || caps.reducedMotion) return;
  lib.gsap.to(title.querySelectorAll('.wi'), { yPercent: 0, duration: 1, delay: .12, stagger: .06, ease: 'power4.out' });
  lib.gsap.to('.hero-side > *, .hero-eyebrow', { y: 0, opacity: 1, duration: .8, delay: .4, stagger: .1, ease: 'power3.out' });
  lib.gsap.to('.hero-underline', { scaleX: 1, duration: .9, delay: .7, ease: 'power3.inOut' });
  lib.gsap.to('.float-inner', { opacity: 1, scale: 1, duration: 1, delay: .5, stagger: .18, ease: 'power3.out' });
}

export function initPanels(caps) {
  const lib = motion();
  if (!lib || caps.reducedMotion) return;
  const { gsap, ScrollTrigger } = lib;

  document.querySelectorAll('[data-words]').forEach((heading) => {
    const words = splitWords(heading);
    if (heading.tagName === 'H1') {
      gsap.set(words, { yPercent: 110 });
      gsap.set('.hero-side > *, .hero-eyebrow', { y: 20, opacity: 0 });
      gsap.set('.hero-underline', { scaleX: 0 });
      gsap.set('.float-inner', { opacity: 0, scale: .86 });
      return;
    }
    gsap.from(words, {
      yPercent: 110, duration: .9, stagger: .035, ease: 'power4.out',
      scrollTrigger: { trigger: heading, start: 'top 82%', once: true },
    });
  });

  gsap.to('.hero-grid', {
    y: -72, opacity: .15, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: true },
  });
  gsap.from('.sheet:not(.sheet-form)', {
    scale: .965, transformOrigin: '50% 0', ease: 'none',
    scrollTrigger: { trigger: '.sheet', start: 'top bottom', end: 'top 45%', scrub: true },
  });
  gsap.utils.toArray('.steps li, .quote-form, .footer-cta, .compare-row, .diag-panel, .faq-list, .case-card').forEach((element) => {
    gsap.from(element, {
      y: 48, opacity: 0, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: element, start: 'top 86%', once: true },
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

export function initServiceNav() {
  const lib = motion();
  const links = [...document.querySelectorAll('.service-nav a')];
  const setActive = (service) => links.forEach((link) => {
    const active = link.dataset.service === service;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  setActive('sites');
  if (!lib) return;

  lib.gsap.matchMedia().add('(min-width: 861px)', () => {
    document.querySelectorAll('.service-card').forEach((card) => {
      lib.ScrollTrigger.create({
        trigger: card, start: 'top 55%', end: 'bottom 55%',
        onToggle: ({ isActive }) => { if (isActive) setActive(card.dataset.service); },
      });
    });
  });
}
