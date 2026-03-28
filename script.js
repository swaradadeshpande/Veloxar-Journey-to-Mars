/* ===================================================
   VELOXAR – JOURNEY TO MARS  |  main.js
   Three.js starfield, GSAP ScrollTrigger, warp engine,
   mars sphere, interactions, custom cursor, loading
   =================================================== */

'use strict';

/* ─── Wait for DOM ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. LOADING SCREEN ─────────────────────────── */
  const loader     = document.getElementById('loader');
  const loaderBar  = document.querySelector('.loader-bar');
  const loaderPct  = document.querySelector('.loader-pct');
  const loaderStat = document.querySelector('.loader-status');

  const loadSteps = [
    'Initialising propulsion systems…',
    'Calibrating star charts…',
    'Loading mission data…',
    'Pressurising cabin…',
    'Launch sequence ready.',
  ];
  let pct = 0;
  const loadInterval = setInterval(() => {
    pct += Math.random() * 18 + 6;
    if (pct >= 100) { pct = 100; clearInterval(loadInterval); }
    loaderBar.style.width = pct + '%';
    loaderPct.textContent = Math.floor(pct) + '%';
    const si = Math.min(Math.floor(pct / 21), loadSteps.length - 1);
    loaderStat.textContent = loadSteps[si];
    if (pct >= 100) {
      setTimeout(() => {
        gsap.to(loader, {
          opacity: 0, duration: 1, ease: 'power2.inOut',
          onComplete: () => { loader.style.display = 'none'; initSite(); }
        });
      }, 500);
    }
  }, 120);

  /* Populate loader stars */
  const burstEl = document.querySelector('.star-burst');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('span');
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;
      width:${Math.random()*2+1}px;height:${Math.random()*2+1}px;
      animation-delay:${Math.random()*3}s;animation-duration:${2+Math.random()*3}s`;
    burstEl.appendChild(s);
  }

  /* ── 2. CUSTOM CURSOR ──────────────────────────── */
  const cursor     = document.querySelector('.cursor');
  const cursorRing = document.querySelector('.cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function animCursor() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    cursor.style.left     = mx + 'px';
    cursor.style.top      = my + 'px';
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    requestAnimationFrame(animCursor);
  })();

  document.querySelectorAll('a, button, .hotspot, .tl-dot, .stat-card, .ribbon-item, .rover-card, .fact-card').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('hovering'); cursorRing.classList.add('hovering'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('hovering'); cursorRing.classList.remove('hovering'); });
  });

  /* ── 3. THREE.JS STARFIELD ────────────────────── */
  const threeCanvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 5;

  /* Stars */
  const starGeo = new THREE.BufferGeometry();
  const starCount = 8000;
  const positions = new Float32Array(starCount * 3);
  const sizes     = new Float32Array(starCount);
  const colors    = new Float32Array(starCount * 3);
  const palette   = [[1,1,1],[0.6,0.8,1],[1,0.85,0.5],[0.8,0.6,1]];
  for (let i = 0; i < starCount; i++) {
    positions[i*3]   = (Math.random()-0.5)*2000;
    positions[i*3+1] = (Math.random()-0.5)*2000;
    positions[i*3+2] = (Math.random()-0.5)*2000;
    sizes[i] = Math.random()*2.5+0.5;
    const c = palette[Math.floor(Math.random()*palette.length)];
    colors[i*3] = c[0]; colors[i*3+1] = c[1]; colors[i*3+2] = c[2];
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

  const starMat = new THREE.PointsMaterial({
    vertexColors: true,
    sizeAttenuation: true,
    size: 1.5,
    transparent: true,
    opacity: 0.85,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* Shooting star */
  let shootingStarActive = false;
  function spawnShootingStar() {
    const geo = new THREE.BufferGeometry();
    const x = (Math.random()-0.5)*600; const y = 200 + Math.random()*150;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x,y,-300, x-80,y-40,-300]), 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    gsap.to(line.position, { x: 200, y: -200, duration: 0.8, ease: 'power1.in' });
    gsap.to(mat, { opacity: 0, duration: 0.6, delay: 0.2, onComplete: () => scene.remove(line) });
  }

  /* Resize */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let warpActive = false, warpSpeed = 0;
  let scrollY = 0;

  function animate3D(t) {
    requestAnimationFrame(animate3D);
    /* Gentle star rotation */
    stars.rotation.x = t * 0.00002;
    stars.rotation.y = t * 0.00003 + scrollY * 0.0001;
    /* Warp speed */
    if (warpActive) {
      warpSpeed = Math.min(warpSpeed + 0.05, 1);
      camera.position.z -= 3 * warpSpeed;
      if (camera.position.z < -300) camera.position.z = 5;
    } else {
      warpSpeed = Math.max(warpSpeed - 0.03, 0);
      if (warpSpeed > 0) camera.position.z -= warpSpeed;
    }
    renderer.render(scene, camera);
  }
  animate3D(0);

  /* ── 4. WARP CANVAS (section 3 inner) ─────────── */
  const warpCanvas  = document.getElementById('warp-canvas');
  const wCtx        = warpCanvas.getContext('2d');
  const warpDisplay = document.querySelector('.warp-speed-display');
  let warpStars     = [];
  let warpFactor    = 0.3;
  let warpRunning   = true;

  function resizeWarp() {
    warpCanvas.width  = warpCanvas.offsetWidth;
    warpCanvas.height = warpCanvas.offsetHeight;
    warpStars = [];
    for (let i = 0; i < 250; i++) spawnWarpStar(true);
  }
  function spawnWarpStar(init) {
    const angle = Math.random() * Math.PI * 2;
    const r = init ? Math.random() * Math.max(warpCanvas.width, warpCanvas.height) / 2 : 2;
    warpStars.push({
      x: warpCanvas.width/2 + Math.cos(angle)*r,
      y: warpCanvas.height/2 + Math.sin(angle)*r,
      px: warpCanvas.width/2 + Math.cos(angle)*r,
      py: warpCanvas.height/2 + Math.sin(angle)*r,
      angle, speed: 1 + Math.random()*2, size: Math.random()*2+0.5,
    });
  }
  function animWarp() {
    if (!warpRunning) return;
    requestAnimationFrame(animWarp);
    wCtx.fillStyle = `rgba(0,0,10,${warpActive ? 0.15 : 0.35})`;
    wCtx.fillRect(0,0,warpCanvas.width,warpCanvas.height);
    for (let i = warpStars.length-1; i >= 0; i--) {
      const s = warpStars[i];
      s.px = s.x; s.py = s.y;
      const eff = warpActive ? warpFactor * 6 : warpFactor;
      s.x += Math.cos(s.angle) * s.speed * eff;
      s.y += Math.sin(s.angle) * s.speed * eff;
      const w = warpCanvas.width/2, h = warpCanvas.height/2;
      const d = Math.hypot(s.x-w, s.y-h);
      const op = Math.min(d/(Math.max(w,h)*1.2), 1);
      wCtx.strokeStyle = warpActive ?
        `rgba(0,245,255,${op*0.9})` : `rgba(200,220,255,${op*0.7})`;
      wCtx.lineWidth = warpActive ? s.size * 2 : s.size * 0.8;
      wCtx.beginPath(); wCtx.moveTo(s.px,s.py); wCtx.lineTo(s.x,s.y); wCtx.stroke();
      if (s.x < 0 || s.x > warpCanvas.width || s.y < 0 || s.y > warpCanvas.height) {
        warpStars.splice(i,1);
        spawnWarpStar(false);
      }
    }
  }
  new ResizeObserver(resizeWarp).observe(warpCanvas);
  resizeWarp(); animWarp();

  /* ── 5. MARS CANVAS (section 4) ─────────────── */
  const marsCanvas = document.getElementById('mars-canvas');
  const mRenderer  = new THREE.WebGLRenderer({ canvas: marsCanvas, alpha: true, antialias: true });
  mRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function sizeMars() {
    const s = marsCanvas.clientWidth;
    mRenderer.setSize(s, s);
  }
  sizeMars();
  new ResizeObserver(sizeMars).observe(marsCanvas);

  const mScene = new THREE.Scene();
  const mCam   = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  mCam.position.z = 2.8;

  /* Mars sphere with procedural texture */
  const marsGeo  = new THREE.SphereGeometry(1, 64, 64);
  const marsSize  = 512;
  const marsData  = new Uint8Array(marsSize * marsSize * 4);
  for (let py = 0; py < marsSize; py++) {
    for (let px = 0; px < marsSize; px++) {
      const i = (py * marsSize + px) * 4;
      const nx = px/marsSize, ny = py/marsSize;
      /* Base reddish-brown */
      const noise = simplex2D(nx*3, ny*3) * 0.5 + 0.5;
      const noise2 = simplex2D(nx*8+1.3, ny*8+0.7) * 0.5 + 0.5;
      /* Polar ice */
      const lat = Math.abs(ny - 0.5) * 2;
      const ice = Math.max(0, (lat - 0.82) * 7);
      const r = Math.floor(lerp(140, 210, noise) * (1-ice*0.2) + ice*220);
      const g = Math.floor(lerp(50,  100, noise2) * (1-ice) + ice*230);
      const b = Math.floor(lerp(10,  40,  noise2) * (1-ice) + ice*240);
      marsData[i]   = Math.min(r, 255);
      marsData[i+1] = Math.min(g, 255);
      marsData[i+2] = Math.min(b, 255);
      marsData[i+3] = 255;
    }
  }
  const marsTex = new THREE.DataTexture(marsData, marsSize, marsSize, THREE.RGBAFormat);
  marsTex.needsUpdate = true;

  const marsMat = new THREE.MeshPhongMaterial({
    map: marsTex,
    shininess: 15,
    specular: new THREE.Color(0.15, 0.07, 0.02),
  });
  const marsMesh = new THREE.Mesh(marsGeo, marsMat);
  mScene.add(marsMesh);

  /* Atmosphere glow */
  const atmGeo = new THREE.SphereGeometry(1.06, 32, 32);
  const atmMat = new THREE.MeshPhongMaterial({
    color: 0xc1440e, transparent: true, opacity: 0.18, side: THREE.FrontSide
  });
  mScene.add(new THREE.Mesh(atmGeo, atmMat));

  /* Lights */
  const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.5);
  sunLight.position.set(3, 1, 2);
  mScene.add(sunLight);
  mScene.add(new THREE.AmbientLight(0x100820, 0.6));

  let marsAutoRotate = true;
  (function animMars() {
    requestAnimationFrame(animMars);
    if (marsAutoRotate) marsMesh.rotation.y += 0.003;
    mRenderer.render(mScene, mCam);
  })();

  /* Mars interactivity */
  marsCanvas.addEventListener('mousemove', e => {
    const rect = marsCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    marsMesh.rotation.y = x * 2;
    marsMesh.rotation.x = y * 0.8;
  });
  marsCanvas.addEventListener('mouseenter', () => marsAutoRotate = false);
  marsCanvas.addEventListener('mouseleave', () => marsAutoRotate = true);

  /* ── Helper functions ──────────────────────────── */
  function lerp(a,b,t) { return a + (b-a)*t; }
  function simplex2D(x,y) {
    /* Fast pseudo-random 2D noise */
    const X = Math.floor(x)|0, Y = Math.floor(y)|0;
    const xf = x-Math.floor(x), yf = y-Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const n00 = grad(hash(X,Y),   xf,   yf);
    const n10 = grad(hash(X+1,Y), xf-1, yf);
    const n01 = grad(hash(X,Y+1), xf,   yf-1);
    const n11 = grad(hash(X+1,Y+1),xf-1,yf-1);
    return lerp(lerp(n00,n10,u), lerp(n01,n11,u), v);
  }
  function fade(t) { return t*t*t*(t*(t*6-15)+10); }
  function hash(x,y) { return ((x*1619+y*31337)^(x>>2)^(y>>3)) & 255; }
  function grad(h,x,y) { const v=h&3; return ((v&1)?-1:1)*x+((v&2)?-1:1)*y; }

  /* ═══════════════════════════════════════════════
     SITE INIT (after loader)
  ═══════════════════════════════════════════════ */
  function initSite() {

    /* ── GSAP + ScrollTrigger ──────────────────── */
    gsap.registerPlugin(ScrollTrigger);

    /* Hero entrance */
    const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTL
      .to('.hero-eyebrow',   { opacity: 1, y: 0, duration: 0.8 }, 0.2)
      .to('.hero-title',     { opacity: 1, duration: 0.6 }, 0.5)
      .to('.hero-subtitle',  { opacity: 1, y: 0, duration: 0.8 }, 0.9)
      .to('.hero-countdown', { opacity: 1, y: 0, duration: 0.8 }, 1.1)
      .to('.hero-cta',       { opacity: 1, y: 0, duration: 0.8 }, 1.3)
      .to('.scroll-hint',    { opacity: 1, duration: 0.8 }, 1.8);

    /* Glitch trigger after hero loads */
    setTimeout(() => {
      const t = document.querySelector('.hero-title');
      t.classList.add('glitch');
      setTimeout(() => t.classList.remove('glitch'), 350);
    }, 900);

    /* ── SCROLL INTERACTION 1: Parallax hero ──── */
    gsap.to('#hero .hero-title', {
      yPercent: 40, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });
    gsap.to('#hero .hero-subtitle', {
      yPercent: 60, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '60% top', scrub: 1 }
    });
    gsap.to('#hero .hero-countdown', {
      yPercent: 80, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '50% top', scrub: 1 }
    });

    /* ── SCROLL INTERACTION 2: Deep Space pin ─── */
    ScrollTrigger.create({
      trigger: '#deep-space',
      start: 'top top',
      end: '+=120%',
      pin: true,
      pinSpacing: true,
      onUpdate: self => {
        const p = self.progress;
        warpFactor = 0.3 + p * 2.5;
        if (warpDisplay) {
          warpDisplay.textContent = `${(0.3 + p * 9.7).toFixed(1)}c`;
        }
        scrollY = window.scrollY;
      }
    });

    /* ── Generic reveal animations ─────────────── */
    document.querySelectorAll('.reveal').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
      });
    });
    document.querySelectorAll('.reveal-left').forEach(el => {
      gsap.to(el, {
        opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
      });
    });
    document.querySelectorAll('.reveal-right').forEach(el => {
      gsap.to(el, {
        opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
      });
    });

    /* Launch rocket animation */
    ScrollTrigger.create({
      trigger: '#launch',
      start: 'top 60%',
      once: true,
      onEnter: () => {
        gsap.from('.rocket-svg-wrap', {
          y: 100, duration: 1.8, ease: 'power3.out',
          onComplete: () => gsap.to('.rocket-svg-wrap', { y: -8, yoyo: true, repeat: -1, duration: 2, ease: 'sine.inOut' })
        });
      }
    });

    /* Mars section parallax */
    gsap.to('.mars-system', {
      scale: 1.1, ease: 'none',
      scrollTrigger: { trigger: '#mars-approach', start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });

    /* Landing descent animation */
    ScrollTrigger.create({
      trigger: '#landing',
      start: 'top 65%',
      once: true,
      onEnter: () => {
        gsap.from('.lander', { y: -200, opacity: 0, duration: 3, ease: 'power1.out' });
        gsap.from('.dust-cloud', { opacity: 0, scale: 0, duration: 2, delay: 2.5, ease: 'power2.out' });
        animateTelemetry();
      }
    });

    /* Mission log in exploration */
    ScrollTrigger.create({
      trigger: '#exploration',
      start: 'top 70%',
      once: true,
      onEnter: () => animateMissionLog()
    });

    /* Stagger stat cards */
    gsap.from('.stat-card', {
      opacity: 0, y: 30, stagger: 0.12, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: '.mission-stats', start: 'top 80%', toggleActions: 'play none none none' }
    });
    gsap.from('.ribbon-item', {
      opacity: 0, x: -30, stagger: 0.1, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: '.approach-ribbon', start: 'top 80%', toggleActions: 'play none none none' }
    });
    gsap.from('.fact-card', {
      opacity: 0, y: 40, stagger: 0.13, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: '.space-facts', start: 'top 80%', toggleActions: 'play none none none' }
    });
  }

  /* ── Countdown clock ───────────────────────────── */
  function updateCountdown() {
    const launch = new Date('2027-03-15T08:30:00Z');
    const now    = new Date();
    const diff   = launch - now;
    const d = Math.max(0, Math.floor(diff / 86400000));
    const h = Math.max(0, Math.floor((diff % 86400000) / 3600000));
    const m = Math.max(0, Math.floor((diff % 3600000)  / 60000));
    const s = Math.max(0, Math.floor((diff % 60000)    / 1000));
    const fmt = n => String(n).padStart(2, '0');
    const days = document.getElementById('cd-days'),
          hrs  = document.getElementById('cd-hrs'),
          min  = document.getElementById('cd-min'),
          sec  = document.getElementById('cd-sec');
    if (days) days.textContent = d;
    if (hrs)  hrs.textContent  = fmt(h);
    if (min)  min.textContent  = fmt(m);
    if (sec)  sec.textContent  = fmt(s);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ── Warp button ──────────────────────────────── */
  const warpBtn = document.getElementById('warp-btn');
  if (warpBtn) {
    warpBtn.addEventListener('click', () => {
      warpActive = !warpActive;
      warpBtn.classList.toggle('active', warpActive);
      warpBtn.textContent = warpActive ? '⚡ Disengage Warp' : '⚡ Engage Warp Drive';
      if (warpActive) {
        gsap.to('.warp-speed-display', { color: '#00f5ff', textShadow: '0 0 30px #00f5ff', duration: 0.4 });
        setTimeout(() => spawnShootingStar(), 600);
      } else {
        gsap.to('.warp-speed-display', { color: '#ffffff', textShadow: '0 0 20px rgba(255,255,255,0.3)', duration: 0.4 });
      }
    });
  }

  /* ── Telemetry animation ──────────────────────── */
  function animateTelemetry() {
    document.querySelectorAll('.tele-val[data-target]').forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const isInt  = el.dataset.int === 'true';
      let current  = 0;
      const dur = 2500;
      const start = performance.now();
      function tick(now) {
        const t = Math.min((now-start)/dur, 1);
        const val = target * easeOutCubic(t);
        el.textContent = (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    document.querySelectorAll('.tele-fill[data-width]').forEach(el => {
      gsap.to(el, { width: el.dataset.width + '%', duration: 2.5, ease: 'power2.out', delay: 0.3 });
      el.style.width = '0%';
    });
  }
  function easeOutCubic(t) { return 1 - Math.pow(1-t, 3); }

  /* ── Mission Log animation ────────────────────── */
  function animateMissionLog() {
    const lines = document.querySelectorAll('.log-line');
    lines.forEach((line,i) => {
      setTimeout(() => line.classList.add('visible'), i * 450);
    });
  }



  /* ── Hotspot interactions ──────────────────────── */
  document.querySelectorAll('.hotspot').forEach(hs => {
    hs.addEventListener('click', () => hs.classList.toggle('active'));
    document.addEventListener('click', e => {
      if (!hs.contains(e.target)) hs.classList.remove('active');
    });
  });

  /* ── Nav hamburger ─────────────────────────────── */
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  /* ── Nav smooth links ──────────────────────────── */
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { target.scrollIntoView({ behavior: 'smooth' }); navLinks.classList.remove('open'); }
    });
  });

  /* Scroll-aware nav style */
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    nav.style.background = window.scrollY > 60
      ? 'rgba(0,0,10,0.85)' : 'rgba(0,0,10,0.4)';
    scrollY = window.scrollY;
  });

  /* Shooting star on interval */
  setInterval(() => { if (!warpActive) spawnShootingStar(); }, 7000);

}); /* end DOMContentLoaded */
