// ==============================
// PORTFOLIO - 3D BACKGROUND SCENE (Three.js)
// A floating "data network": glowing nodes, connecting edges,
// and slow-rotating wireframe solids. Reacts to mouse + scroll.
// ==============================

(function () {
  'use strict';

  const canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile, powerPreference: 'high-performance' });
  } catch (err) {
    canvas.remove();
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.028);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 34);

  // ---- Colours (match CSS design tokens) ----
  const COLOR_PRIMARY = new THREE.Color(0xe11d2a);
  const COLOR_SECONDARY = new THREE.Color(0x8b0f14);
  const COLOR_CYAN = new THREE.Color(0xffffff);
  const COLOR_PINK = new THREE.Color(0xff5a5f);
  const COLOR_GREEN = new THREE.Color(0xb3111a);

  // ---- Soft round sprite for particles ----
  function makeGlowTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }
  const glowTexture = makeGlowTexture();

  // ---- Root group (rotates as a whole) ----
  const world = new THREE.Group();
  scene.add(world);

  // ---- Data nodes ----
  const NODE_COUNT = isMobile ? 220 : 520;
  const SPREAD = { x: 70, y: 46, z: 40 };
  const nodePositions = new Float32Array(NODE_COUNT * 3);
  const nodeColors = new Float32Array(NODE_COUNT * 3);
  const palette = [COLOR_PRIMARY, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_SECONDARY, COLOR_PINK, COLOR_GREEN, COLOR_CYAN];

  for (let i = 0; i < NODE_COUNT; i++) {
    nodePositions[i * 3] = (Math.random() - 0.5) * SPREAD.x;
    nodePositions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD.y;
    nodePositions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD.z;
    const col = palette[Math.floor(Math.random() * palette.length)];
    nodeColors[i * 3] = col.r;
    nodeColors[i * 3 + 1] = col.g;
    nodeColors[i * 3 + 2] = col.b;
  }

  const nodeGeometry = new THREE.BufferGeometry();
  nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
  nodeGeometry.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));

  const nodeMaterial = new THREE.PointsMaterial({
    size: isMobile ? 0.55 : 0.45,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
  world.add(nodes);

  // ---- Edges between nearby nodes (computed once) ----
  const LINK_DISTANCE = isMobile ? 6.5 : 6.0;
  const MAX_LINKS_PER_NODE = 3;
  const edgeVerts = [];
  const edgeCols = [];
  const linkCounts = new Uint8Array(NODE_COUNT);

  for (let i = 0; i < NODE_COUNT; i++) {
    if (linkCounts[i] >= MAX_LINKS_PER_NODE) continue;
    const ax = nodePositions[i * 3], ay = nodePositions[i * 3 + 1], az = nodePositions[i * 3 + 2];
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (linkCounts[j] >= MAX_LINKS_PER_NODE) continue;
      const bx = nodePositions[j * 3], by = nodePositions[j * 3 + 1], bz = nodePositions[j * 3 + 2];
      const dx = ax - bx, dy = ay - by, dz = az - bz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < LINK_DISTANCE * LINK_DISTANCE) {
        edgeVerts.push(ax, ay, az, bx, by, bz);
        const strength = 1 - Math.sqrt(d2) / LINK_DISTANCE;
        edgeCols.push(
          nodeColors[i * 3] * strength, nodeColors[i * 3 + 1] * strength, nodeColors[i * 3 + 2] * strength,
          nodeColors[j * 3] * strength, nodeColors[j * 3 + 1] * strength, nodeColors[j * 3 + 2] * strength
        );
        linkCounts[i]++;
        linkCounts[j]++;
        if (linkCounts[i] >= MAX_LINKS_PER_NODE) break;
      }
    }
  }

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
  edgeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(edgeCols, 3));
  const edgeMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  world.add(edges);

  // ---- Floating wireframe solids ----
  const solids = [];
  function addSolid(geometry, color, position, speed, opacity) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(position.x, position.y, position.z);
    mesh.userData.speed = speed;
    mesh.userData.baseY = position.y;
    mesh.userData.phase = Math.random() * Math.PI * 2;
    world.add(mesh);
    solids.push(mesh);
    return mesh;
  }

  addSolid(new THREE.IcosahedronGeometry(4.2, 1), COLOR_PRIMARY, { x: 20, y: 7, z: -14 }, { x: 0.12, y: 0.18 }, 0.2);
  addSolid(new THREE.TorusGeometry(3.6, 1.1, 10, 40), COLOR_CYAN, { x: -24, y: -9, z: -18 }, { x: 0.2, y: 0.1 }, 0.16);
  addSolid(new THREE.OctahedronGeometry(3.2, 0), COLOR_PINK, { x: -16, y: 13, z: -20 }, { x: 0.15, y: 0.22 }, 0.18);
  addSolid(new THREE.TorusKnotGeometry(2.4, 0.7, 80, 10, 2, 3), COLOR_SECONDARY, { x: 24, y: -13, z: -22 }, { x: 0.1, y: 0.16 }, 0.16);
  if (!isMobile) {
    addSolid(new THREE.DodecahedronGeometry(2.6, 0), COLOR_GREEN, { x: 4, y: -20, z: -26 }, { x: 0.18, y: 0.12 }, 0.16);
  }

  // ---- Interaction state ----
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let scrollY = window.scrollY || 0;

  if (finePointer) {
    window.addEventListener('mousemove', (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY || 0;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (reduceMotion) renderer.render(scene, camera);
  });

  // ---- Render loop ----
  const clock = new THREE.Clock();
  let running = true;

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reduceMotion) animate();
  });

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();

    // Smooth mouse follow
    mouse.x += (target.x - mouse.x) * 0.04;
    mouse.y += (target.y - mouse.y) * 0.04;

    // Whole network drifts and tilts toward the cursor
    world.rotation.y = t * 0.03 + mouse.x * 0.18;
    world.rotation.x = Math.sin(t * 0.08) * 0.06 + mouse.y * 0.12 + scrollY * 0.00025;

    // Camera slides down with the page for a parallax feel
    camera.position.y = -scrollY * 0.006;
    camera.position.x = mouse.x * 1.6;
    camera.lookAt(0, camera.position.y, 0);

    // Spin & bob the wireframe solids
    for (let i = 0; i < solids.length; i++) {
      const m = solids[i];
      m.rotation.x += m.userData.speed.x * 0.01;
      m.rotation.y += m.userData.speed.y * 0.01;
      m.position.y = m.userData.baseY + Math.sin(t * 0.5 + m.userData.phase) * 0.8;
    }

    // Gentle pulse on the network
    const pulse = 1 + Math.sin(t * 0.6) * 0.06;
    nodeMaterial.size = (isMobile ? 0.55 : 0.45) * pulse;
    edgeMaterial.opacity = 0.26 + Math.sin(t * 0.9) * 0.06;

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    animate();
  }

  canvas.classList.add('is-ready');
})();
