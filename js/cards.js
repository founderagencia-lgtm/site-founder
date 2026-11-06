function buildSites(gsap, card) {
  const q = gsap.utils.selector(card);
  return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .fromTo(q('.browser'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .7 })
    .fromTo(q('.pg-nav > *'), { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: .35, stagger: .06 }, '-=.25')
    .fromTo(q('.pg-hero'), { scaleY: .2, opacity: 0, transformOrigin: '50% 0' }, { scaleY: 1, opacity: 1, duration: .55 }, '-=.1')
    .fromTo(q('.pg-hero s'), { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: .5, stagger: .1 }, '-=.2')
    .fromTo(q('.pg-hero em'), { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(2)' }, '-=.15')
    .fromTo(q('.pg-tiles b'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .1 }, '-=.1');
}

function buildGoogle(gsap, card) {
  const q = gsap.utils.selector(card);
  const output = q('.search-text')[0];
  const query = output.dataset.text;
  const [you, ...others] = q('.result');
  const step = others[0].offsetTop - you.offsetTop;
  const typed = { length: 0 };
  output.textContent = '';
  return gsap.timeline({
    paused: true,
    onStart: () => output.classList.add('is-typing'),
  })
    .fromTo(q('.search'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' })
    .fromTo(typed, { length: 0 }, {
      length: query.length, duration: 1, ease: 'none',
      onUpdate: () => { output.textContent = query.slice(0, Math.round(typed.length)); },
      onComplete: () => output.classList.remove('is-typing'),
    })
    .fromTo(q('.results'), { opacity: 0 }, { opacity: 1, duration: .3 })
    .fromTo(you, { y: step * 2 }, { y: 0, duration: .9, ease: 'power3.inOut' }, '+=.25')
    .fromTo(others, { y: -step }, { y: 0, duration: .9, ease: 'power3.inOut' }, '<');
}

function buildTraffic(gsap, card) {
  const q = gsap.utils.selector(card);
  const timeline = gsap.timeline({ paused: true });
  q('.flow-node').forEach((node, index) => timeline.fromTo(
    node,
    { backgroundColor: '#232A4D', color: '#F4F7F2' },
    { backgroundColor: '#F4F7F2', color: '#0B0F23', duration: .25 },
    .3 + index * .9,
  ));
  return timeline
    .fromTo(q('.flow-fill'), { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'none' }, .3)
    .fromTo(q('.flow-dot'), { left: '0%' }, { left: '100%', duration: 1.8, ease: 'none' }, .3);
}

function buildSocial(gsap, card) {
  const q = gsap.utils.selector(card);
  return gsap.timeline({ paused: true })
    .fromTo(q('.cal-head span'), { opacity: 0 }, { opacity: 1, duration: .3, stagger: .04 })
    .fromTo(q('.post'), { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(2)', stagger: .1 }, .15);
}

const builders = { sites: buildSites, google: buildGoogle, trafego: buildTraffic, redes: buildSocial };

export function initCards(caps) {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || caps.reducedMotion) return;
  document.querySelectorAll('.service-card').forEach((card) => {
    const timeline = builders[card.dataset.service](gsap, card);
    ScrollTrigger.create({
      trigger: card.querySelector('.stage'),
      start: 'top 80%',
      end: 'bottom 12%',
      onEnter: () => timeline.restart(),
      onEnterBack: () => timeline.restart(),
    });
  });
}
