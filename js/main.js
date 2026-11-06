import { WHATSAPP_NUMBER } from './config.js';
import { initForm } from './form.js';
import { initAnchors, initIntro, initPanels, initServiceNav, initMenu, revealHero } from './motion.js';
import { initCards } from './cards.js';

function hasWebgl() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

export function getCapabilities() {
  return {
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl: hasWebgl(),
    lowPower: innerWidth < 861 || (navigator.hardwareConcurrency || 8) <= 4,
  };
}

function attempt(name, fn) {
  try {
    return fn();
  } catch (error) {
    console.warn(`Founder: ${name} indisponível`, error);
    return undefined;
  }
}

async function loadScenes(caps) {
  if (!caps.webgl) return;
  const paint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
  await paint();
  const scenes = [
    ['./scene-trace.js', 'initTraceScene', '#trace-canvas'],
    ['./scene-sphere.js', 'initSphereScene', '#sphere-canvas'],
  ];
  for (const [path, init, selector] of scenes) {
    try {
      const module = await import(path);
      module[init](document.querySelector(selector), caps);
    } catch (error) {
      console.warn(`Founder: cena ${selector} indisponível`, error);
    }
  }
}

async function start() {
  const caps = getCapabilities();
  document.getElementById('year').textContent = new Date().getFullYear();
  attempt('formulário', () => initForm(document.getElementById('quote-form'), WHATSAPP_NUMBER));
  attempt('menu', initMenu);
  attempt('âncoras', () => initAnchors(caps));
  attempt('painéis', () => initPanels(caps));
  attempt('serviços', () => initServiceNav(caps));
  attempt('cards', () => initCards(caps));
  loadScenes(caps);
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    attempt('título', () => revealHero(caps));
  };
  await attempt('abertura', () => initIntro(caps, reveal));
  reveal();
}

start();
