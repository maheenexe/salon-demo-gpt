// Bhanu's The Hair Studio — scene.js — Three.js salon: room, stations, dust, camera path
// Split from js/main.js (original single-file build). Keep load order:
// vendor-three.js -> core.js -> tour.js -> scene.js -> showcase.js -> tunnel.js
"use strict";
  /* ---------------- Three.js salon (deferred so the page paints first) ---------------- */
  function initGL(){
  if(window.updatePreloader) updatePreloader(20, 'Preparing 3D Salon Lounge…');
  var canvas = document.getElementById('gl');
  if(!window.THREE){
    document.getElementById('gl-fallback').style.display = 'block';
    if(window.completePreloader) completePreloader();
    return;
  }
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch(e){
    document.getElementById('gl-fallback').style.display = 'block';
    if(window.completePreloader) completePreloader();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  if('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 14, 52);

  var camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 60);
  window.tourCamera = camera;

  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;

  /* Mathematical range wrap / modulo helper */
  function wrap(val, min, max){
    var range = max - min;
    if(range <= 0) return min;
    return ((((val - min) % range) + range) % range) + min;
  }
  var tourProgress = (typeof window !== 'undefined' && typeof window.tourProgress === 'number') ? window.tourProgress : 0;

  /* ----- palette ----- */
  var GOLD = 0xc9a35f, GOLD_B = 0xe8c987, CREAM = 0xe9dfc8, CHAR = 0x171310, WALL = 0x241c14;

  function marbleTexture(){
    var c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
    var g = c.getContext('2d');
    g.fillStyle = '#16120d'; g.fillRect(0, 0, 1024, 1024);
    for(var i = 0; i < 46; i++){
      g.strokeStyle = 'rgba(201,163,95,' + (0.03 + Math.random() * 0.08) + ')';
      g.lineWidth = 1 + Math.random() * 2.2;
      g.beginPath();
      var x = Math.random() * 1024, y = Math.random() * 1024;
      g.moveTo(x, y);
      for(var s = 0; s < 5; s++){ x += (Math.random() - 0.5) * 260; y += (Math.random() - 0.5) * 260; g.lineTo(x, y); }
      g.stroke();
    }
    for(var j = 0; j < 2600; j++){
      g.fillStyle = 'rgba(242,234,217,' + Math.random() * 0.05 + ')';
      g.fillRect(Math.random() * 1024, Math.random() * 1024, 1.6, 1.6);
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
    if('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function spriteTexture(){
    var c = document.createElement('canvas'); c.width = 64; c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,236,190,1)');
    grad.addColorStop(0.35, 'rgba(232,201,135,.75)');
    grad.addColorStop(1, 'rgba(232,201,135,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  /* Luxury PBR Materials */
  // Gold Metal Trims (Mirror frames, chair bases, pendant domes)
  var matGold = new THREE.MeshPhysicalMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    envMapIntensity: 2.2
  });
  var matGoldBright = new THREE.MeshPhysicalMaterial({
    color: 0xe5c258,
    metalness: 0.95,
    roughness: 0.14,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2.4
  });
  // Mirror Glass: Physical face with deep tint, crisp reflections and clearcoat
  var matMirror = new THREE.MeshPhysicalMaterial({
    color: 0x11161b,
    roughness: 0.05,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.6
  });
  // Vanity mirror backlighting halo
  var matBacklight = new THREE.MeshBasicMaterial({
    color: 0xffdfa4,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  // Chair Leather: rich tufted matte leather
  var matLeather = new THREE.MeshStandardMaterial({
    color: 0xf5f5f2,
    roughness: 0.45,
    metalness: 0.05,
    envMapIntensity: 0.4
  });
  // Counters/Desks: Matte black quartz/granite finish
  var matCounter = new THREE.MeshStandardMaterial({
    color: 0x18181c,
    roughness: 0.35,
    metalness: 0.2,
    envMapIntensity: 0.85
  });
  // Cabinets: Deep architectural wood
  var matDarkWood = new THREE.MeshStandardMaterial({
    color: 0x151210,
    roughness: 0.65,
    metalness: 0.08
  });
  // Rear Wall: Luxury architectural textured dark backdrop
  var matWall = new THREE.MeshStandardMaterial({
    color: 0x141418,
    roughness: 0.85,
    metalness: 0.1,
    envMapIntensity: 0.35
  });
  // Vanity bulbs: authentic emissive bloom/glow
  var matGlow = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: 0xffe8ba,
    emissiveIntensity: 2.0,
    roughness: 0.2
  });

  var RB = THREE.RoundedBoxGeometry;
  function box(w, h, d, mat, r){
    var geo = (RB && r) ? new RB(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  /* =========================================================================
     1. SALON ROOM GROUP (Strictly hidden at 0% to 65% scroll)
     ========================================================================= */
  var salonRoomGroup = new THREE.Group();
  scene.add(salonRoomGroup);

  /* Floor: deep dark charcoal/black polished surface with receiveShadow */
  var floorMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c0e,
    roughness: 0.15,
    metalness: 0.25,
    envMapIntensity: 1.6
  });
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  salonRoomGroup.add(floor);

  /* Rear Wall: luxury architectural textured dark backdrop */
  var backWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 9.5), matWall);
  backWall.position.set(0, 4.5, -5.2);
  backWall.receiveShadow = true;
  salonRoomGroup.add(backWall);

  /* Vertical fluted wall panel slats for architectural depth */
  var matFlutedSlat = new THREE.MeshStandardMaterial({
    color: 0x18181e,
    roughness: 0.75,
    metalness: 0.15
  });
  var slatGeo = new THREE.BoxGeometry(0.045, 8.8, 0.04);
  var goldDividerGeo = new THREE.BoxGeometry(0.02, 8.8, 0.055);
  for(var sx = -9.6; sx <= 9.6; sx += 0.24){
    var slat = new THREE.Mesh(slatGeo, matFlutedSlat);
    slat.position.set(sx, 4.5, -5.17);
    slat.castShadow = true;
    slat.receiveShadow = true;
    salonRoomGroup.add(slat);
  }
  /* Architectural vertical gold trim dividers framing the stations */
  [-6.2, -2.05, 2.05, 6.2].forEach(function(gx){
    var gDivider = new THREE.Mesh(goldDividerGeo, matGold);
    gDivider.position.set(gx, 4.5, -5.15);
    gDivider.castShadow = true;
    salonRoomGroup.add(gDivider);
  });
  if(window.updatePreloader) updatePreloader(45, 'Crafting Architectural Marble…');

  [-8.4, 8.4].forEach(function(x){
    var side = new THREE.Mesh(new THREE.PlaneGeometry(18, 9.5), matWall);
    side.position.set(x, 4.5, 1.5);
    side.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    side.receiveShadow = true;
    salonRoomGroup.add(side);
  });

  /* Horizontal gold accent trims */
  var trim = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.04, 0.05), matGoldBright);
  trim.position.set(0, 4.62, -5.14);
  trim.castShadow = true;
  salonRoomGroup.add(trim);
  var trim2 = trim.clone();
  trim2.position.y = 0.65;
  salonRoomGroup.add(trim2);

  /* ----- styling station ----- */
  function makeChair(){
    var g = new THREE.Group();
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.06, 28), matGold);
    base.position.y = 0.03; base.castShadow = true; base.receiveShadow = true; g.add(base);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 16), matGoldBright);
    stem.position.y = 0.27; stem.castShadow = true; g.add(stem);
    var seat = box(0.66, 0.13, 0.6, matLeather, 0.05); seat.position.y = 0.55; seat.castShadow = true; seat.receiveShadow = true; g.add(seat);
    var back = box(0.66, 0.62, 0.12, matLeather, 0.05);
    back.position.set(0, 0.95, -0.26); back.rotation.x = -0.1; back.castShadow = true; back.receiveShadow = true; g.add(back);
    [-0.36, 0.36].forEach(function(x){
      var arm = box(0.07, 0.07, 0.44, matGold, 0.03);
      arm.position.set(x, 0.82, 0.02); arm.castShadow = true; g.add(arm);
      var post = box(0.05, 0.22, 0.05, matGold, 0.02);
      post.position.set(x, 0.7, 0.2); post.castShadow = true; g.add(post);
    });
    return g;
  }

  var stationSpots = [];
  function makeStation(x){
    var g = new THREE.Group();
    g.position.set(x, 0, -4.55);

    var counter = box(2.3, 0.08, 0.62, matCounter, 0.02);
    counter.position.set(0, 0.98, 0.28);
    counter.castShadow = true; counter.receiveShadow = true;
    g.add(counter);

    var cabinet = box(2.3, 0.92, 0.55, matDarkWood, 0.02);
    cabinet.position.set(0, 0.47, 0.3);
    cabinet.castShadow = true; cabinet.receiveShadow = true;
    g.add(cabinet);

    var kick = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.05, 0.57), matGold);
    kick.position.set(0, 0.05, 0.3);
    kick.castShadow = true; kick.receiveShadow = true;
    g.add(kick);

    /* arched mirror: gold frame + reflective pane */
    var shape = new THREE.Shape();
    shape.moveTo(-0.72, 0);
    shape.lineTo(-0.72, 0.85);
    shape.absarc(0, 0.85, 0.72, Math.PI, 0, true);
    shape.lineTo(0.72, 0);
    shape.lineTo(-0.72, 0);
    var archHole = new THREE.Path();
    archHole.moveTo(-0.6, 0.03);
    archHole.lineTo(-0.6, 0.85);
    archHole.absarc(0, 0.85, 0.6, Math.PI, 0, true);
    archHole.lineTo(0.6, 0.03);
    archHole.lineTo(-0.6, 0.03);
    shape.holes.push(archHole);
    var frameGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 36 });
    var frameMesh = new THREE.Mesh(frameGeo, matGold);
    frameMesh.position.set(0, 1.28, 0.56);
    frameMesh.castShadow = true; frameMesh.receiveShadow = true;
    g.add(frameMesh);

    /* Vanity mirror backlighting halo */
    var haloGeo = new THREE.ShapeGeometry(shape, 36);
    var haloMesh = new THREE.Mesh(haloGeo, matBacklight);
    haloMesh.scale.set(1.06, 1.05, 1);
    haloMesh.position.set(0, 1.28, 0.53);
    g.add(haloMesh);

    var inner = new THREE.Shape();
    inner.moveTo(-0.6, 0.02);
    inner.lineTo(-0.6, 0.85);
    inner.absarc(0, 0.85, 0.6, Math.PI, 0, true);
    inner.lineTo(0.6, 0.02);
    inner.lineTo(-0.6, 0.02);
    var paneGeo = new THREE.ShapeGeometry(inner, 36);
    var pane = new THREE.Mesh(paneGeo, matMirror);
    pane.position.set(0, 1.28, 0.6);
    pane.receiveShadow = true;
    g.add(pane);

    /* vanity bulbs with authentic emissive bloom/glow */
    var bulbGeo = new THREE.SphereGeometry(0.045, 14, 14);
    [[-0.82, 1.5], [-0.82, 2.05], [-0.82, 2.6], [0.82, 1.5], [0.82, 2.05], [0.82, 2.6]].forEach(function(p){
      var b = new THREE.Mesh(bulbGeo, matGlow);
      b.position.set(p[0], p[1], 0.62);
      g.add(b);
    });

    /* bottles on the counter */
    var bottleCols = [0x3a2c1a, 0x101010, 0x6d5322, 0x241a10];
    for(var i = 0; i < 4; i++){
      var h = 0.16 + Math.random() * 0.1;
      var bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.04, h, 12),
        new THREE.MeshStandardMaterial({ color: bottleCols[i], roughness: 0.25, metalness: 0.4 })
      );
      bottle.position.set(-0.8 + i * 0.22 + Math.random() * 0.05, 1.02 + h / 2, 0.3 + Math.random() * 0.14);
      bottle.castShadow = true;
      g.add(bottle);
    }

    var chair = makeChair();
    chair.position.set(0, 0, 1.35);
    chair.rotation.y = Math.PI + (x === 0 ? 0.16 : x < 0 ? 0.3 : -0.3);
    g.add(chair);

    /* pendant lamp */
    var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 8), matCounter);
    cord.position.set(0, 4.75, 0.9);
    g.add(cord);
    var shade = new THREE.Mesh(new THREE.SphereGeometry(0.21, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), matGold);
    shade.position.set(0, 4.3, 0.9);
    shade.castShadow = true;
    g.add(shade);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 14), matGlow);
    bulb.position.set(0, 4.22, 0.9);
    g.add(bulb);

    /* dedicated downward spotlight inside pendant lamp focused on chair */
    var spot = new THREE.SpotLight(0xffe2a3, 0, 9.5, Math.PI / 4.8, 0.6, 1.6);
    spot.position.set(0, 4.22, 0.9);
    spot.target = chair;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0004;
    g.add(spot);
    stationSpots.push(spot);

    salonRoomGroup.add(g);
    return g;
  }

  var stations = [makeStation(-4.1), makeStation(0), makeStation(4.1)];
  if(window.updatePreloader) updatePreloader(75, 'Arranging Styling Stations…');

  /* warm directional key light casting soft shadows across the stations */
  var key = new THREE.DirectionalLight(0xfff2db, 0);
  key.position.set(4.5, 8.5, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 2.0;
  key.shadow.camera.left = -11;
  key.shadow.camera.right = 11;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 28;
  salonRoomGroup.add(key);

  var ambientLight = new THREE.AmbientLight(0x4a3b2b, 0);
  salonRoomGroup.add(ambientLight);

  var pl1 = new THREE.PointLight(0xffd594, 0, 8, 2.0);
  pl1.position.set(-4.1, 3.2, -3.2);
  salonRoomGroup.add(pl1);

  var pl2 = new THREE.PointLight(0xffd594, 0, 8, 2.0);
  pl2.position.set(4.1, 3.2, -3.2);
  salonRoomGroup.add(pl2);

  var centerGlow = new THREE.PointLight(0xffe6b8, 0, 10, 2.0);
  centerGlow.position.set(0, 3.2, 0.5);
  salonRoomGroup.add(centerGlow);

  /* rotating gold rings (art piece inside salon) - hidden to keep styling mirrors clear */
  var rings = new THREE.Group();
  rings.visible = false;

  /* Salon ambient gold dust — reduced by 70% for pristine crisp clarity */
  var COUNT = 75;
  var pos = new Float32Array(COUNT * 3);
  var seed = new Float32Array(COUNT);
  for(var i = 0; i < COUNT; i++){
    pos[i * 3] = (Math.random() - 0.5) * 15;
    pos[i * 3 + 1] = Math.random() * 5.2 + 0.3;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 9 + 0.5;
    seed[i] = Math.random() * Math.PI * 2;
  }
  var dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.055, map: spriteTexture(), transparent: true, opacity: 0.42,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0xe8c987
  }));
  salonRoomGroup.add(dust);

  /* HIDE salon room completely at 0% scroll */
  salonRoomGroup.visible = false;

  /* =========================================================================
     2. HERO VOID & CENTRAL 3D GOLD RING (Snug Framing & Gold Dust Burst)
     ========================================================================= */
  var portalHeroGroup = new THREE.Group();
  portalHeroGroup.position.set(0, 2.15, 45.0);

  var matGoldRing = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 2.4
  });
  /* Scaled-down Torus geometry gracefully framing "BHANU'S THE HAIR STUDIO • INDORE" typography */
  var ringOuter = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.048, 32, 120), matGoldRing);
  portalHeroGroup.add(ringOuter);
  window.heroRingMesh = ringOuter;
  window.portalHeroGroup = portalHeroGroup;
  window.heroRingGroup = portalHeroGroup;

  var ringInner = new THREE.Mesh(
    new THREE.TorusGeometry(1.27, 0.016, 20, 100),
    new THREE.MeshStandardMaterial({
      color: 0xffeec7,
      emissive: 0x9a7d3a,
      emissiveIntensity: 1.2,
      metalness: 0.95,
      roughness: 0.15
    })
  );
  portalHeroGroup.add(ringInner);

  /* Oversized architectural gold sculpture: abstract portal framing that expands
     as the visitor approaches. Kept low-poly enough for real-time WebGL. */
  var cinematicArches = new THREE.Group();
  var archMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcaa15c, metalness: 1, roughness: 0.19,
    clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 2.2
  });
  for(var ai = 0; ai < 5; ai++){
    var radius = 2.0 + ai * 0.40;
    var arch = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.07 + ai * 0.006, 10, 90, Math.PI * 1.64),
      archMaterial
    );
    arch.rotation.z = Math.PI * 0.68 + ai * 0.25;
    arch.rotation.y = (ai % 2 ? 1 : -1) * 0.32;
    arch.position.z = -ai * 0.35;
    cinematicArches.add(arch);
  }
  portalHeroGroup.add(cinematicArches);

  var ringHeroLight = new THREE.PointLight(0xffdfa0, 3.0, 6, 1.8);
  ringHeroLight.position.set(0, 0, 1.0);
  portalHeroGroup.add(ringHeroLight);

  /* Sparkling gold dust particles framing typography & dispersing on scroll */
  var HERO_DUST_COUNT = 200;
  var heroDustInit = [];
  var heroDustPos = new Float32Array(HERO_DUST_COUNT * 3);
  var heroDustSeed = new Float32Array(HERO_DUST_COUNT);
  for(var hdi = 0; hdi < HERO_DUST_COUNT; hdi++){
    var angle = Math.random() * Math.PI * 2;
    var dist = 0.22 + Math.random() * 1.05;
    var hx = Math.cos(angle) * dist * 1.15;
    var hy = Math.sin(angle) * dist * 0.76;
    var hz = (Math.random() - 0.5) * 0.6;
    heroDustInit.push({ x: hx, y: hy, z: hz, angle: angle, dist: dist });
    heroDustPos[hdi * 3] = hx;
    heroDustPos[hdi * 3 + 1] = hy;
    heroDustPos[hdi * 3 + 2] = hz;
    heroDustSeed[hdi] = Math.random() * Math.PI * 2;
  }
  var heroDustGeo = new THREE.BufferGeometry();
  heroDustGeo.setAttribute('position', new THREE.BufferAttribute(heroDustPos, 3));
  var heroDustMat = new THREE.PointsMaterial({
    size: 0.075, map: spriteTexture(), transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe29a
  });
  var heroDust = new THREE.Points(heroDustGeo, heroDustMat);
  heroDust.visible = false;
  portalHeroGroup.add(heroDust);
  scene.add(portalHeroGroup);

  /* =========================================================================
     3. IMMERSIVE 3D GEOMETRIC LIGHT TUNNEL (15% to 65% Scroll)
     ========================================================================= */
  function tunnelTexture(){
    var c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
    var g = c.getContext('2d');
    g.fillStyle = '#060504'; g.fillRect(0, 0, 1024, 1024);
    for(var x = 0; x < 1024; x += 32){
      var isMajor = (x % 128 === 0);
      g.strokeStyle = isMajor ? 'rgba(201,163,95,0.48)' : 'rgba(201,163,95,0.12)';
      g.lineWidth = isMajor ? 2.5 : 1.0;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke();
    }
    for(var y = 0; y < 1024; y += 64){
      g.strokeStyle = 'rgba(232,201,135,0.22)';
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 6);
    if('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  var tunnelWarpGroup = new THREE.Group();

  /* Dedicated 3D cylinder outer tube enclosing the camera view */
  var tunnelLength = 35.5;
  var tunnelRadius = 3.25;
  var tubeGeo = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, tunnelLength, 48, 24, true);
  tubeGeo.rotateX(Math.PI / 2); // align along Z

  var tubeMat = new THREE.MeshStandardMaterial({
    map: tunnelTexture(),
    side: THREE.BackSide,
    roughness: 0.52,
    metalness: 0.65,
    transparent: true,
    opacity: 1
  });
  var tunnelTube = new THREE.Mesh(tubeGeo, tubeMat);
  tunnelTube.position.set(0, 2.15, 27.25);
  tunnelWarpGroup.add(tunnelTube);

  /* 18 Structural 3D Glowing Gold Arches along the tunnel length */
  var tunnelRings = [];
  for(var rz = 44.0; rz >= 10.0; rz -= 2.0){
    var rGeo = new THREE.TorusGeometry(3.18, 0.045, 16, 64);
    var rMat = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      emissive: 0xb5893a,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 1
    });
    var rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(0, 2.15, rz);
    tunnelWarpGroup.add(rMesh);
    tunnelRings.push(rMat);
  }

  /* 220 3D Volumetric Golden Light Streaks */
  var STREAK_COUNT = 220;
  var streakPos = new Float32Array(STREAK_COUNT * 2 * 3);
  var streakColors = new Float32Array(STREAK_COUNT * 2 * 3);
  var streakData = [];
  for(var sIdx = 0; sIdx < STREAK_COUNT; sIdx++){
    var angle = Math.random() * Math.PI * 2;
    var radius = 1.4 + Math.random() * 1.5;
    var sx = Math.cos(angle) * radius;
    var sy = 2.15 + Math.sin(angle) * radius;
    var sz = 10.0 + Math.random() * 34.0;
    var slen = 1.2 + Math.random() * 2.4;
    var speed = 0.08 + Math.random() * 0.12;
    streakData.push({ x: sx, y: sy, z: sz, len: slen, speed: speed });

    var baseIdx = sIdx * 6;
    streakPos[baseIdx] = sx;
    streakPos[baseIdx + 1] = sy;
    streakPos[baseIdx + 2] = sz;
    streakPos[baseIdx + 3] = sx;
    streakPos[baseIdx + 4] = sy;
    streakPos[baseIdx + 5] = sz - slen;

    streakColors[baseIdx] = 1.0;
    streakColors[baseIdx + 1] = 0.94;
    streakColors[baseIdx + 2] = 0.70;
    streakColors[baseIdx + 3] = 0.77;
    streakColors[baseIdx + 4] = 0.58;
    streakColors[baseIdx + 5] = 0.28;
  }
  var streakGeo = new THREE.BufferGeometry();
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  streakGeo.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));
  var streakMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  var streakLines = new THREE.LineSegments(streakGeo, streakMat);
  tunnelWarpGroup.add(streakLines);

  /* HIDE deep tunnel geometry initially at 0% scroll — ONLY single 3D Golden Ring is visible */
  tunnelWarpGroup.visible = false;
  tubeMat.opacity = 0;
  streakMat.opacity = 0;
  for(var tri = 0; tri < tunnelRings.length; tri++){
    tunnelRings[tri].opacity = 0;
  }
  scene.add(tunnelWarpGroup);

  if(window.updatePreloader) updatePreloader(92, 'Igniting Golden Ambiance…');

  /* =========================================================================
     4. STAGED 9-STEP CAMERA PATH (Straight Center Walk-through)
     ========================================================================= */
  var path = [
    /* 1 (0.00): Pitch-black luxury void, snug single Gold Ring at Z=45, typography inside */
    { pos: [0, 2.15, 51.0], look: [0, 2.15, 45.0] },
    /* 2 (0.125): Rock-solid stationary camera while text dissolves & gold dust scatters */
    { pos: [0, 2.15, 51.0], look: [0, 2.15, 45.0] },
    /* 3 (0.25): Passing through hollow center of Gold Ring into geometric cylinder tunnel */
    { pos: [0, 2.15, 43.5], look: [0, 2.15, 25.0] },
    /* 4 (0.42): Mid-flight tunnel warp speed; passing glowing 3D arches & streaks */
    { pos: [0, 2.15, 28.0], look: [0, 2.15, 10.0] },
    /* 5 (0.55): Tunnel exit terminus (Z=15.0); seamlessly cross-fading into salon ambiance */
    { pos: [0, 2.15, 15.0], look: [0, 2.15, -20.0] },
    /* 6 (0.65): Full centered wide establishing shot of complete salon floor */
    { pos: [0, 2.15, 9.0],  look: [0, 2.15, -20.0] },
    /* 7 (0.78): Resting wide establishing view held cleanly as salon section appears */
    { pos: [0, 2.15, 6.2],  look: [0, 2.15, -20.0] },
    /* 8 (0.88): Straight center forward zoom advancing smoothly between stations */
    { pos: [0, 2.15, 3.8],  look: [0, 2.15, -20.0] },
    /* 9 (1.00): Settling cleanly into Department Showcase handover */
    { pos: [0, 2.15, 1.8],  look: [0, 2.15, -20.0] }
  ];
  function catmull(points, t){
    var n = points.length - 1;
    var f = Math.min(0.9999, Math.max(0, t)) * n;
    var i = Math.floor(f), u = f - i;
    var p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[Math.min(n, i + 1)], p3 = points[Math.min(n, i + 2)];
    function cr(a, b, c, d){
      return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    }
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
  }
  var posPts = path.map(function(p){ return p.pos; });
  var lookPts = path.map(function(p){ return p.look; });

  /* Mouse/cursor parallax disabled: camera & ring stay 100% rock-solid and static on hover */
  var smoothP = 0;
  var camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  var t0 = performance.now();
  var frameCount = 0;
  function frame(){
    requestAnimationFrame(frame);
    if(document.hidden) return;
    if(tour.getBoundingClientRect().bottom < -50) return; /* covered by content sheets */
    try {
      frameCount++;
      var t = (performance.now() - t0) / 1000;
      var sway = reduced ? 0 : 1;
      /* Heavyweight luxury lerp interpolation (0.065 within requested 0.05 - 0.08) */
      var targetProgress = (typeof window !== 'undefined' && typeof window.tourProgress === 'number') ? window.tourProgress : 0;
      smoothP += (targetProgress - smoothP) * 0.065;

      var cp = catmull(posPts, smoothP);
      var lp = catmull(lookPts, smoothP);
      
      /* Camera position and lookAt driven purely by scroll progress (no cursor offset) */
      camPos.set(cp[0], cp[1], cp[2]);
      camLook.set(lp[0], lp[1], lp[2]);

      /* Lock Camera Path to Straight Center Walk-through during salon zoom (progress 0.65 to 0.85+)
         X strictly locked to 0 (center), lookAt strictly focused straight ahead at [0, camera.position.y, -20]
         so it never drifts or tilts toward the right-hand station */
      var effP = (typeof window !== 'undefined' && typeof window.tourProgress === 'number') ? window.tourProgress : smoothP;
      if(effP >= 0.65 || smoothP >= 0.65){
        camPos.x = 0;
        camera.position.x = 0;
        camLook.set(0, camera.position.y, -20.0);
        /* Force-Hide the Floating Hero Ring Mesh in Salon Floor (window.tourProgress >= 0.65) */
        portalHeroGroup.visible = false;
        ringOuter.visible = false;
        ringInner.visible = false;
        rings.visible = false;
        if(window.heroRingMesh) window.heroRingMesh.visible = false;
      }

      camera.position.copy(camPos);
      camera.lookAt(camLook);

      /* Sculptural portal performs a deterministic, scroll-tied unfurling.
         No unbounded motion: reversing scroll restores the original frame. */
      var archReveal = Math.max(0, Math.min(1, (smoothP - 0.045) / 0.22));
      cinematicArches.rotation.z = archReveal * 0.13;
      cinematicArches.rotation.y = archReveal * 0.38;
      cinematicArches.scale.setScalar(0.76 + archReveal * 0.34);
      for(var archIndex = 0; archIndex < cinematicArches.children.length; archIndex++){
        var archMesh = cinematicArches.children[archIndex];
        archMesh.rotation.y = ((archIndex % 2) ? 1 : -1) * (0.32 + archReveal * 0.25);
      }

      /* STAGE 1: Clean Initial Resting State & Text Gold Dust Dissolve (0.00 to 0.15 Scroll) */
      if(smoothP <= 0.15){
        ringOuter.visible = true;
        ringInner.visible = true;
        /* Single Gold Ring stays rock-solid and centered in the pitch-black void */
        portalHeroGroup.position.set(0, 2.15, 45.0);
        portalHeroGroup.rotation.set(0, 0, 0);
        portalHeroGroup.visible = true;

        /* Fog setting for pitch-black void */
        scene.fog.near = 14; scene.fog.far = 52;

        /* Ethereal gold stardust: strictly hidden at 0% scroll, activates on active scroll */
        if(smoothP <= 0.01){
          heroDust.visible = false;
          heroDustMat.opacity = 0;
        } else {
          heroDust.visible = true;
          var burstP = Math.min(1, Math.max(0, (smoothP - 0.01) / 0.14));
          var hArr = heroDustGeo.attributes.position.array;
          for(var hi = 0; hi < HERO_DUST_COUNT; hi++){
            var dInit = heroDustInit[hi];
            var scatterDist = dInit.dist + burstP * (1.6 + Math.sin(heroDustSeed[hi]) * 0.9);
            hArr[hi * 3] = Math.cos(dInit.angle) * scatterDist;
            hArr[hi * 3 + 1] = Math.sin(dInit.angle) * scatterDist * 0.72 + burstP * 0.28;
            hArr[hi * 3 + 2] = dInit.z + Math.sin(t * 1.5 + heroDustSeed[hi]) * 0.12;
          }
          heroDustGeo.attributes.position.needsUpdate = true;
          var inAlpha = Math.min(1, burstP / 0.20);
          var outAlpha = Math.max(0, 1 - Math.max(0, (burstP - 0.50) / 0.50));
          heroDustMat.opacity = inAlpha * outAlpha * 0.92;
          heroDustMat.size = 0.075 + burstP * 0.05;
        }

        /* Deep tunnel geometry and salon room are strictly HIDDEN during 0.00 to 0.15 */
        tunnelWarpGroup.visible = false;
        tubeMat.opacity = 0;
        streakMat.opacity = 0;
        for(var ri = 0; ri < tunnelRings.length; ri++){
          tunnelRings[ri].opacity = 0;
        }
        salonRoomGroup.visible = false;
        key.intensity = 0;
        stationSpots.forEach(function(s){ s.intensity = 0; });
        centerGlow.intensity = 0;
        ambientLight.intensity = 0;
        pl1.intensity = 0;
        pl2.intensity = 0;
      } else if(smoothP < 0.50){
        /* STAGE 2: Pure 3D Tunnel Flight (0.15 to 0.50 Scroll) */
        portalHeroGroup.visible = smoothP < 0.28;
        ringOuter.visible = smoothP < 0.28;
        ringInner.visible = smoothP < 0.28;
        salonRoomGroup.visible = false;
        scene.fog.near = 14; scene.fog.far = 52;

        tunnelWarpGroup.visible = true;
        tunnelWarpGroup.scale.set(1, 1, 1);
        var tunnelIn = Math.min(1, Math.max(0, (smoothP - 0.15) / 0.08));
        tubeMat.opacity = tunnelIn;
        streakMat.opacity = tunnelIn * 0.95;
        for(var tri = 0; tri < tunnelRings.length; tri++){
          tunnelRings[tri].opacity = tunnelIn;
        }

        /* Stream light streaks along tunnel with warp acceleration using wrap helper */
        var warpFactor = Math.sin(Math.PI * Math.max(0, Math.min(1, (smoothP - 0.15) / 0.35)));
        var speedBoost = 1.0 + warpFactor * 5.5;
        var sPosArr = streakGeo.attributes.position.array;
        for(var si = 0; si < STREAK_COUNT; si++){
          var s = streakData[si];
          s.z = wrap(s.z + s.speed * speedBoost, 10.0, 45.0);
          var sOffset = si * 6;
          sPosArr[sOffset + 2] = s.z;
          sPosArr[sOffset + 5] = s.z - s.len;
        }
        streakGeo.attributes.position.needsUpdate = true;

        key.intensity = 0;
        stationSpots.forEach(function(s){ s.intensity = 0; });
        centerGlow.intensity = 0;
        ambientLight.intensity = 0;
        pl1.intensity = 0;
        pl2.intensity = 0;
      } else if(smoothP < 0.65){
        /* STAGE 2.5: Seamless Cross-Fade (0.50 to 0.65 Scroll) — ZERO BLACK DEAD-ZONE!
           As the camera passes through the final tunnel rings (Z=18 to 9),
           the salon room lights and mirrors are already illuminating directly ahead */
        portalHeroGroup.visible = false;
        ringOuter.visible = false;
        ringInner.visible = false;
        rings.visible = false;
        if(window.heroRingMesh) window.heroRingMesh.visible = false;

        salonRoomGroup.visible = true;
        var crossFade = Math.min(1, Math.max(0, (smoothP - 0.50) / 0.15));
        var tunnelOut = Math.max(0, 1 - crossFade);

        /* Tunnel arches softly dissolve as camera exits */
        tunnelWarpGroup.visible = tunnelOut > 0.01;
        tunnelWarpGroup.scale.set(1 + crossFade * 0.35, 1 + crossFade * 0.35, 1);
        tubeMat.opacity = tunnelOut * 0.85;
        streakMat.opacity = tunnelOut * 0.75;
        for(var eri = 0; eri < tunnelRings.length; eri++){
          tunnelRings[eri].opacity = tunnelOut;
        }

        /* Continue streaming streaks during exit */
        var sPosArrEx = streakGeo.attributes.position.array;
        for(var sie = 0; sie < STREAK_COUNT; sie++){
          var se = streakData[sie];
          se.z = wrap(se.z + se.speed * 1.8, 10.0, 45.0);
          var soe = sie * 6;
          sPosArrEx[soe + 2] = se.z;
          sPosArrEx[soe + 5] = se.z - se.len;
        }
        streakGeo.attributes.position.needsUpdate = true;

        /* Power up salon lights, pendant spotlights, and reflections dynamically */
        key.intensity = 1.8 * crossFade;
        stationSpots.forEach(function(s){ s.intensity = 2.5 * crossFade; });
        centerGlow.intensity = 8.0 * crossFade;
        ambientLight.intensity = 0.45 * crossFade;
        pl1.intensity = 10.0 * crossFade;
        pl2.intensity = 10.0 * crossFade;

        /* Smooth fog expansion from tunnel fog to full salon depth */
        scene.fog.near = 14 + crossFade * 8; // 14 -> 22
        scene.fog.far = 52 + crossFade * 23; // 52 -> 75

        /* Ambient gold dust in salon */
        var arrDust = dustGeo.attributes.position.array;
        for(var di = 0; di < COUNT; di++){
          arrDust[di * 3 + 1] = wrap(arrDust[di * 3 + 1] + Math.sin(t * 0.5 + seed[di]) * 0.0009 + 0.0012, 0.25, 5.6);
          arrDust[di * 3] += Math.cos(t * 0.3 + seed[di]) * 0.0008;
        }
        dustGeo.attributes.position.needsUpdate = true;
      } else {
        /* STAGE 3: Wide-Angle Salon Floor Reveal -> Straight Center Walkthrough (0.65 to 1.00) */
        portalHeroGroup.visible = false;
        ringOuter.visible = false;
        ringInner.visible = false;
        rings.visible = false;
        if(window.heroRingMesh) window.heroRingMesh.visible = false;

        tunnelWarpGroup.visible = false;
        tubeMat.opacity = 0;
        streakMat.opacity = 0;
        for(var fri = 0; fri < tunnelRings.length; fri++){
          tunnelRings[fri].opacity = 0;
        }

        salonRoomGroup.visible = true;
        scene.fog.near = 22; scene.fog.far = 75;

        /* Full salon lighting */
        key.intensity = 1.8;
        stationSpots.forEach(function(s){ s.intensity = 2.5; });
        centerGlow.intensity = 8.0;
        ambientLight.intensity = 0.45;
        pl1.intensity = 10.0;
        pl2.intensity = 10.0;

        /* Ambient gold dust in salon wrapped smoothly */
        var arr = dustGeo.attributes.position.array;
        for(var i = 0; i < COUNT; i++){
          arr[i * 3 + 1] = wrap(arr[i * 3 + 1] + Math.sin(t * 0.5 + seed[i]) * 0.0009 + 0.0012, 0.25, 5.6);
          arr[i * 3] += Math.cos(t * 0.3 + seed[i]) * 0.0008;
        }
        dustGeo.attributes.position.needsUpdate = true;
      }

      if(frameCount < 3) renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      if(frameCount === 1 && window.completePreloader){
        updatePreloader(100, "Welcome to Bhanu's The Hair Studio");
        completePreloader();
      }
    } catch(err){
      showErr(err.message || String(err));
      if(window.completePreloader) completePreloader();
    }
  }
  frame();

  window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    if(window.innerWidth < 640){ camera.fov = 58; } else { camera.fov = 46; }
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  if(window.innerWidth < 640){ camera.fov = 58; camera.updateProjectionMatrix(); }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(initGL, 40); });
  } else {
    setTimeout(initGL, 40);
  }
