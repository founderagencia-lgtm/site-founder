import * as THREE from '../vendor/three.module.min.js';

const POINT_VERTEX = /* glsl */`
  uniform float uPixel;
  varying float vDepth;
  varying float vMix;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.);
    vDepth = smoothstep(-13., -7.3, view.z);
    vMix = position.y * .17 + .5;
    gl_Position = projectionMatrix * view;
    gl_PointSize = (1.4 + 2.6 * vDepth) * uPixel;
  }`;

const POINT_FRAGMENT = /* glsl */`
  uniform vec3 uTeal, uIce;
  varying float vDepth;
  varying float vMix;
  void main() {
    if (length(gl_PointCoord - .5) > .5) discard;
    gl_FragColor = vec4(mix(uTeal, uIce, vMix * .55) * (.18 + 1.05 * vDepth), 1.);
  }`;

const RING_VERTEX = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }`;

const RING_FRAGMENT = /* glsl */`
  uniform vec3 uTeal, uLime;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float sweep = .5 + .5 * sin(vUv.x * 6.28318);
    gl_FragColor = vec4(mix(uTeal, uLime, sweep) * uStrength * (.25 + .75 * sweep), 1.);
  }`;

function fibonacciSphere(count, radius) {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = golden * index;
    positions.set([Math.cos(angle) * ring * radius, y * radius, Math.sin(angle) * ring * radius], index * 3);
  }
  return positions;
}

export function initSphereScene(canvas, caps) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !caps.lowPower, powerPreference: 'high-performance' });
  renderer.setClearColor(0x0B0F23);
  const pixelRatio = Math.min(devicePixelRatio, caps.lowPower ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
  camera.position.z = 11;

  const colors = {
    uTeal: { value: new THREE.Color(0x2DB6B0) },
    uIce: { value: new THREE.Color(0xF4F7F2) },
    uLime: { value: new THREE.Color(0xD6E54D) },
  };
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(fibonacciSphere(caps.lowPower ? 2600 : 5600, 3), 3));
  const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
    vertexShader: POINT_VERTEX, fragmentShader: POINT_FRAGMENT,
    uniforms: { ...colors, uPixel: { value: pixelRatio } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));

  const makeRing = (tube, strength) => new THREE.Mesh(
    new THREE.TorusGeometry(3.45, tube, 10, caps.lowPower ? 140 : 280),
    new THREE.ShaderMaterial({
      vertexShader: RING_VERTEX, fragmentShader: RING_FRAGMENT,
      uniforms: { ...colors, uStrength: { value: strength } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  );
  const orbit = new THREE.Group();
  orbit.add(makeRing(.012, 1.5), makeRing(.07, .16));
  orbit.rotation.set(1.2, .35, 0);

  const group = new THREE.Group();
  group.add(points, orbit);
  scene.add(group);

  const draw = () => renderer.render(scene, camera);
  let lastWidth = 0;
  let lastHeight = 0;
  const touch = matchMedia('(hover: none)').matches;
  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    if (width === lastWidth && (height === lastHeight || (touch && Math.abs(height - lastHeight) < 180))) return;
    lastWidth = width;
    lastHeight = height;
    const aspect = width / height;
    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.position.z = aspect < 1 ? 14 : 12;
    camera.updateProjectionMatrix();
    const halfWidth = Math.tan(THREE.MathUtils.degToRad(18)) * camera.position.z * aspect;
    const lineX = document.querySelector('.steps').getBoundingClientRect().left - 28;
    group.position.x = aspect > 1.15 ? (lineX / 2 / width - .5) * 2 * halfWidth : 0;
    draw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let progress = 0;
  function apply(idle) {
    group.rotation.y = progress * Math.PI * 2.4 + idle;
    group.rotation.x = .25 + progress * .5;
    orbit.rotation.z = progress * Math.PI * 1.5 + idle * 1.6;
  }

  const trigger = caps.reducedMotion ? null : window.ScrollTrigger?.create({
    trigger: '#como-trabalhamos',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => { progress = self.progress; },
  });

  let visible = false;
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  visibility.observe(canvas);

  let frame = 0;
  let last = performance.now();
  let lastDraw = 0;
  let idle = 0;
  const minimumGap = caps.lowPower ? 1000 / 31 : 0;
  const tick = (now) => {
    frame = requestAnimationFrame(tick);
    if (document.hidden || !visible || now - lastDraw < minimumGap) {
      if (document.hidden || !visible) last = now;
      return;
    }
    const delta = Math.min((now - last) / 1000, .05);
    last = now;
    lastDraw = now;
    idle += delta * .08;
    apply(idle);
    draw();
  };
  apply(0);
  draw();
  if (!caps.reducedMotion) frame = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      trigger?.kill();
      renderer.dispose();
    },
  };
}
