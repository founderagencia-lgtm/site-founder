import * as THREE from '../vendor/three.module.min.js';

const VERTEX = /* glsl */`
  uniform float uPhase, uWidth;
  varying vec2 vUv;
  vec3 curve(float u) {
    float a = u * 5.6 + uPhase * .07;
    return vec3(mix(-11., 11., u),
      1.7 * sin(a + .4) + .8 * sin(a * 2.3 + uPhase * .11),
      2.4 * cos(a * .8) - 1.2);
  }
  void main() {
    vUv = uv;
    float u = uv.x;
    vec3 p = curve(u);
    vec3 tangent = normalize(curve(u + .002) - p);
    vec3 side = normalize(cross(tangent, vec3(0., 1., 0.)));
    vec3 up = cross(side, tangent);
    float twist = u * 6.2 + uPhase * .16;
    float width = uWidth * (.45 + .55 * sin(u * 3.14159));
    p += (cos(twist) * up + sin(twist) * side) * (uv.y - .5) * width;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  }`;

const FRAGMENT = /* glsl */`
  uniform float uPhase, uGlow, uHead;
  uniform vec3 uTeal, uLime;
  varying vec2 vUv;
  void main() {
    float u = vUv.x, v = vUv.y;
    float wave = v * 92. + 2.4 * sin(u * 11. + uPhase * .18);
    float strands = mix(.28, pow(.5 + .5 * sin(wave), 3.), clamp(1.7 - fwidth(wave) * 1.2, 0., 1.));
    float edge = 1. - abs(2. * v - 1.);
    float core = exp(-pow((v - .5) * 26., 2.));
    float ends = smoothstep(.1, .42, u) * smoothstep(1., .92, u);
    float behind = fract(uHead - u);
    float tail = exp(-behind * 7.) * smoothstep(0., .05, behind);
    vec3 color = mix(uTeal, uLime, smoothstep(.25, .85, u + .22 * sin(v * 3. + uPhase * .05)));
    float sheen = pow(edge, 1.6) * (.5 + .5 * sin(v * 9. + u * 7. - uPhase * .12));
    float light = (.05 + .16 * sheen + .62 * strands * edge + .9 * core) * (.78 + 1.7 * tail);
    gl_FragColor = vec4(color * light * uGlow * ends, 1.);
  }`;

const DOTS_VERTEX = /* glsl */`
  uniform vec2 uPointer;
  uniform float uPixel;
  varying float vLight;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    vec2 ndc = clip.xy / clip.w;
    vLight = .13 + .85 * exp(-distance(ndc, uPointer) * 5.);
    gl_Position = clip;
    gl_PointSize = 1.7 * uPixel;
  }`;

const DOTS_FRAGMENT = /* glsl */`
  varying float vLight;
  void main() {
    if (length(gl_PointCoord - .5) > .5) discard;
    gl_FragColor = vec4(vec3(.96, .97, .95) * vLight, 1.);
  }`;

function dotField() {
  const positions = [];
  for (let x = -18; x <= 18; x += .9) for (let y = -10; y <= 10; y += .9) positions.push(x, y, -5);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function initTraceScene(canvas, caps) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !caps.lowPower, powerPreference: 'high-performance' });
  renderer.setClearColor(0x0B0F23);
  const pixelRatio = Math.min(devicePixelRatio, caps.lowPower ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 60);
  camera.position.z = 15;

  const ribbonUniforms = {
    uPhase: { value: 40 }, uWidth: { value: 5.4 }, uGlow: { value: 1 }, uHead: { value: 0 },
    uTeal: { value: new THREE.Color(0x2DB6B0) }, uLime: { value: new THREE.Color(0xD6E54D) },
  };
  const ribbonMaterial = new THREE.ShaderMaterial({
    vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms: ribbonUniforms,
    transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const segments = caps.lowPower ? 220 : 520;
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, segments, 1), ribbonMaterial);
  ribbon.frustumCulled = false;
  const group = new THREE.Group();
  group.add(ribbon);
  scene.add(group);

  const dotUniforms = { uPointer: { value: new THREE.Vector2(9, 9) }, uPixel: { value: pixelRatio } };
  const dots = new THREE.Points(dotField(), new THREE.ShaderMaterial({
    vertexShader: DOTS_VERTEX, fragmentShader: DOTS_FRAGMENT, uniforms: dotUniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dots);

  let lastWidth = 0;
  let lastHeight = 0;
  const touch = matchMedia('(hover: none)').matches;
  const resize = () => {
    const width = canvas.clientWidth || innerWidth;
    const height = canvas.clientHeight || innerHeight;
    // No celular a barra do navegador muda a altura durante a rolagem: redimensionar apagaria o desenho
    const sameWidth = width === lastWidth;
    if (sameWidth && (height === lastHeight || (touch && Math.abs(height - lastHeight) < 180))) return false;
    lastWidth = width;
    lastHeight = height;
    const aspect = width / height;
    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.position.z = aspect < 1 ? 22 : 15;
    camera.updateProjectionMatrix();
    group.rotation.z = aspect < 1 ? .95 : .3;
    group.position.set(aspect < 1 ? 1.4 : 3.4, aspect < 1 ? 3.2 : 1.5, 0);
    return true;
  };
  const observer = new ResizeObserver(() => {
    if (resize()) renderer.render(scene, camera);
  });
  observer.observe(canvas);
  resize();

  let holding = false;
  const press = (event) => {
    if (event.target.closest?.('#topo, #rodape') && !event.target.closest('a, button')) holding = true;
  };
  const release = () => { holding = false; };
  const point = (event) => {
    dotUniforms.uPointer.value.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
  };
  addEventListener('pointerdown', press);
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('pointermove', point, { passive: true });

  const visible = new Set(['topo']);
  const visibility = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    });
  });
  document.querySelectorAll('#topo, #rodape').forEach((element) => visibility.observe(element));

  let frame = 0;
  let last = performance.now();
  let lastDraw = 0;
  let speed = 1;
  let glow = 1;
  const minimumGap = caps.lowPower ? 1000 / 31 : 0;

  const tick = (now) => {
    frame = requestAnimationFrame(tick);
    if (document.hidden || visible.size === 0 || now - lastDraw < minimumGap) {
      if (document.hidden || visible.size === 0) last = now;
      return;
    }
    const delta = Math.min((now - last) / 1000, .05);
    last = now;
    lastDraw = now;
    const blend = 1 - Math.exp(-delta / .2);
    speed += ((holding ? 4 : 1) - speed) * blend;
    glow += ((holding ? 1.6 : 1) - glow) * blend;
    ribbonUniforms.uPhase.value += delta * speed;
    ribbonUniforms.uGlow.value = glow;
    ribbonUniforms.uHead.value = (ribbonUniforms.uHead.value + delta * speed * .05) % 1;
    renderer.render(scene, camera);
  };

  renderer.render(scene, camera);
  canvas.classList.add('is-ready');
  if (!caps.reducedMotion) frame = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      removeEventListener('pointerdown', press);
      removeEventListener('pointerup', release);
      removeEventListener('pointercancel', release);
      removeEventListener('pointermove', point);
      renderer.dispose();
    },
  };
}
