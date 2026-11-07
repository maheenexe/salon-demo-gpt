// Bhanu's The Hair Studio — showcase.js — 3D Showcase wall (self-contained)
// Split from js/main.js (original single-file build). Keep load order:
// vendor-three.js -> core.js -> tour.js -> scene.js -> showcase.js -> tunnel.js
(function(){
  "use strict";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DEPTS = [
    { key:'hair', name:'Precision Hair Sculpting', tag:'Bespoke scissor cuts, signature styling & contouring', from:'₹499', book:'Precision Hair Sculpting & Styling',
      services:[['Signature Hair Sculpting & Styling','₹499'],['Creative Scissor Work & Fades','₹399'],['Blowout & Red Carpet Styling','₹599'],['Hair Spa & Scalp Detox','₹999'],['Scalp & Hair-Fall Therapy','₹1,499']] },
    { key:'treatment', name:'Advanced Hair Treatments', tag:'Keratin, rebonding, hair botox & dimensional color', from:'₹2,499', book:'Advanced Hair Treatments (Keratin, Rebonding, Color)',
      services:[['Keratin Infusion Therapy','₹3,999'],['Hair Botox Deep Repair','₹4,999'],['Smoothening & Rebonding','₹3,499'],['Global Hair Colour & Gloss','₹2,999'],['Balayage & Dimensional Foils','₹4,499'],['Highlights & Lowlights','₹2,499']] },
    { key:'men', name:"Royal Beard Grooming", tag:'Hot towel shaves, sharp fades & beard sculpt', from:'₹149', book:"Royal Beard Grooming & Shaving",
      services:[["Royal Shave & Hot Towel Ritual",'₹149'],['Beard Sculpting, Trim & Line-up','₹199'],["Gentlemen's Precision Haircut",'₹299'],['Beard Spa & Conditioning','₹399'],['Hair Colour & Grey Coverage','₹699'],['Executive Grooming Package','₹1,499']] },
    { key:'makeup', name:'Bridal & Event Artistry', tag:'HD & airbrush bridal excellence, couture looks', from:'₹1,999', book:'Bridal & Event Artistry',
      services:[['Signature Bridal Makeup — HD','₹14,999'],['Bridal Makeup — Airbrush','₹19,999'],['Engagement & Sangeet Glam','₹7,999'],['Reception Red Carpet Look','₹8,999'],['Party & Occasion Makeup','₹1,999'],['Pre-Bridal Radiance Programmes','₹9,999'],['Hairstyling & Saree Draping','₹799']] },
    { key:'skin', name:'Skin Rejuvenation & Care', tag:'HydraFacials, gold rejuvenation & glow rituals', from:'₹499', book:'Skin Rejuvenation & Care',
      services:[['HydraFacial Glow Treatment','₹1,999'],['Signature 24K Gold Facial','₹1,499'],['Brightening & Radiance Facial','₹1,299'],['Anti-Ageing Collagen Boost','₹2,499'],['Deep Pore Express Clean-Up','₹599'],['De-Tan Brightening Treatment','₹499']] },
    { key:'spa', name:'Spa & Scalp Therapy', tag:'Deep conditioning steam, massage & tension release', from:'₹499', book:'Spa & Scalp Therapy',
      services:[['Full Body Swedish / Balinese Massage','₹1,499'],['Head, Neck & Shoulder Champi','₹499'],['Foot Reflexology Therapy','₹699'],['Body Polishing & Glow Ritual','₹1,999'],['Full Body Waxing & Rica Care','₹1,499']] }
  ];

  var stage = document.getElementById('showStage');
  var canvas = document.getElementById('gl2');
  var chipsBox = document.getElementById('showChips');
  var hint = document.getElementById('showHint');
  var fallback = document.getElementById('showFallback');
  var fallbackGrid = document.getElementById('showFallbackGrid');
  var serviceChoices = document.getElementById('showServiceChoices');
  function isCompactShowcase(){
    return window.matchMedia('(max-width: 900px)').matches;
  }
  var panel = document.getElementById('showDetail');
  var elName = document.getElementById('showDetailName');
  var elTag = document.getElementById('showDetailTag');
  var elList = document.getElementById('showDetailList');

  var current = null;      /* dept object in detail view */
  var lastTrigger = null;
  var glReady = false;

  /* Place the compact detail dialog directly below <body>: ancestors such as
     the 3D stage must not trap it below fixed navigation or WhatsApp controls. */
  function syncDetailPlacement(){
    if(!panel || !stage) return;
    if(isCompactShowcase()){
      if(panel.parentNode !== document.body) document.body.appendChild(panel);
      panel.classList.add('show-detail-overlay');
    } else if(!current){
      if(panel.parentNode !== stage) stage.appendChild(panel);
      panel.classList.remove('show-detail-overlay');
    }
  }
  syncDetailPlacement();
  window.addEventListener('resize', syncDetailPlacement, { passive:true });

  if(panel){
    if('inert' in panel) panel.inert = true;
    panel.setAttribute('inert', '');
  }

  /* ---------- chips + fallback buttons (also the labels for the 3D wall) ---------- */
  var chipEls = {};
  DEPTS.forEach(function(d){
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'show-chip';
    chip.innerHTML = '<b></b><span></span>';
    chip.querySelector('b').textContent = d.name;
    chip.querySelector('span').textContent = 'From ' + d.from + ' · Tap to enter';
    chip.addEventListener('click', function(){ openDetail(d, chip); });
    chipsBox.appendChild(chip);
    chipEls[d.key] = chip;

    var fb = document.createElement('button');
    fb.type = 'button';
    fb.innerHTML = '';
    fb.appendChild(document.createTextNode(d.name));
    var s = document.createElement('span');
    s.textContent = 'From ' + d.from + ' · ' + d.services.length + ' services';
    fb.appendChild(s);
    fb.addEventListener('click', function(){ openDetail(d, fb); });
    fallbackGrid.appendChild(fb);

    /* Semantic service browser stays legible even when WebGL isn't available. */
    if(serviceChoices){
      var choice = document.createElement('button');
      choice.type = 'button';
      choice.className = 'show-service-choice';
      choice.setAttribute('aria-label', d.name + ', starting at ' + d.from + '. View services');
      var index = document.createElement('span');
      index.className = 'choice-index';
      index.textContent = String(DEPTS.indexOf(d) + 1).padStart(2, '0');
      var name = document.createElement('span');
      name.className = 'choice-name';
      name.textContent = d.name;
      var price = document.createElement('span');
      price.className = 'choice-price';
      price.textContent = 'From ' + d.from;
      choice.appendChild(index);
      choice.appendChild(name);
      choice.appendChild(price);
      choice.addEventListener('click', function(){ openDetail(d, choice); });
      serviceChoices.appendChild(choice);
    }
  });

  /* ---------- detail panel ---------- */
  function fillPanel(d){
    elName.textContent = d.name;
    elTag.textContent = d.tag;
    elList.innerHTML = '';
    d.services.forEach(function(sv){
      var li = document.createElement('li');
      var a = document.createElement('span'); a.textContent = sv[0];
      var dots = document.createElement('i');
      var b = document.createElement('b');
      var sm = document.createElement('small'); sm.textContent = 'From';
      b.appendChild(sm);
      b.appendChild(document.createTextNode(sv[1]));
      li.appendChild(a); li.appendChild(dots); li.appendChild(b);
      elList.appendChild(li);
    });
    elList.scrollTop = 0;
  }

  function openDetail(d, triggerEl){
    current = d;
    lastTrigger = triggerEl || (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
    fillPanel(d);
    stage.classList.add('detail');
    if('inert' in panel) panel.inert = false;
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    if(isCompactShowcase()){
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      document.body.style.overflow = 'hidden';
    }
    /* The service index opens a readable panel without forcing the 3D canvas
       into fullscreen. Direct 3D station clicks retain the camera-zoom option. */
    var fromScene = triggerEl === canvas || (triggerEl && triggerEl.classList && triggerEl.classList.contains('show-chip'));
    if(fromScene && glReady && window.__showOpen && !isCompactShowcase()){
      window.__showOpen(d);
    } else {
      panel.classList.add('open');
    }
    var backBtn = document.getElementById('showBack');
    if(backBtn) setTimeout(function(){ try { backBtn.focus(); } catch(e){} }, 100);
  }
  function closeDetail(){
    if(!current) return;
    current = null;
    panel.classList.remove('open');
    /* 1. Explicitly blur any currently active element inside panel */
    if(document.activeElement && panel.contains(document.activeElement)){
      try { document.activeElement.blur(); } catch(e){}
    }
    /* 2. Safely return focus to lastTrigger if focusable and outside panel */
    if(lastTrigger && typeof lastTrigger.focus === 'function' && document.body.contains(lastTrigger) && !panel.contains(lastTrigger)){
      try { lastTrigger.focus(); } catch(e){}
    }
    /* 3. If any descendant still somehow has focus, force blur */
    if(document.activeElement && panel.contains(document.activeElement)){
      try { document.activeElement.blur(); } catch(e){}
    }
    /* 4. Apply inert attribute first so descendants cannot receive focus */
    if('inert' in panel) panel.inert = true;
    panel.setAttribute('inert', '');
    /* 5. Apply aria-hidden now that no descendant retains focus */
    panel.setAttribute('aria-hidden', 'true');
    panel.removeAttribute('aria-modal');
    if(isCompactShowcase()) document.body.style.overflow = '';
    stage.classList.remove('detail');
    if(glReady && window.__showClose && !isCompactShowcase()){ window.__showClose(); }
    lastTrigger = null;
  }
  document.getElementById('showBack').addEventListener('click', function(e){
    if(e && e.currentTarget && typeof e.currentTarget.blur === 'function') e.currentTarget.blur();
    closeDetail();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && current) closeDetail();
  });
  document.getElementById('showBook').addEventListener('click', function(e){
    if(e && e.currentTarget && typeof e.currentTarget.blur === 'function') e.currentTarget.blur();
    if(!current) return;
    var val = current.book;
    closeDetail();
    var sel = document.getElementById('f-service');
    if(sel) sel.value = val;
    setTimeout(function(){
      var book = document.getElementById('book');
      if(book) book.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }, 80);
  });
  document.getElementById('showMenu').addEventListener('click', function(e){
    if(e && e.currentTarget && typeof e.currentTarget.blur === 'function') e.currentTarget.blur();
    if(!current) return;
    var key = current.key;
    closeDetail();
    var tab = document.querySelector('.tab[data-panel="' + key + '"]');
    if(tab){
      tab.click();
      try { tab.focus(); } catch(e){}
    }
    setTimeout(function(){
      var svc = document.getElementById('services');
      if(svc) svc.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }, 80);
  });

  function showFallback(){
    canvas.style.display = 'none';
    chipsBox.style.display = 'none';
    hint.style.display = 'none';
    fallback.hidden = false;
  }

  /* ---------- the 3D wall ---------- */
  function initShowcase(){
    /* On compact layouts the six large semantic service buttons replace the
       costly and cramped 3D wall. The details and booking actions still work. */
    if(isCompactShowcase() && serviceChoices){
      canvas.style.display = 'none';
      chipsBox.style.display = 'none';
      hint.style.display = 'none';
      fallback.hidden = true;
      return;
    }
    if(!window.THREE) { showFallback(); return; }
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch(e){ showFallback(); return; }
    renderer.setPixelRatio((window.cinematicQuality && window.cinematicQuality.showcasePixelRatio) || Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    if('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a08);
    scene.fog = new THREE.Fog(0x0c0a08, 18, 34);
    var camera = new THREE.PerspectiveCamera(43, 1.6, 0.1, 60);

    try {
      var pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    } catch(e){}

    /* palette */
    var matGold = new THREE.MeshStandardMaterial({ color: 0xc9a35f, metalness: 1, roughness: 0.3 });
    var matGoldB = new THREE.MeshStandardMaterial({ color: 0xe8c987, metalness: 1, roughness: 0.16 });
    var matGoldDark = new THREE.MeshStandardMaterial({ color: 0x8a6d35, metalness: 1, roughness: 0.42 });
    var matCream = new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.72, metalness: 0 });
    var matChar = new THREE.MeshStandardMaterial({ color: 0x171310, roughness: 0.45, metalness: 0.3 });
    var matWood = new THREE.MeshStandardMaterial({ color: 0x2b2016, roughness: 0.85, metalness: 0 });
    var matWall = new THREE.MeshStandardMaterial({ color: 0x20180f, roughness: 0.95, metalness: 0 });
    var matSteel = new THREE.MeshStandardMaterial({ color: 0xd9dcdf, metalness: 1, roughness: 0.14 });
    var matRuby = new THREE.MeshStandardMaterial({ color: 0x57101d, metalness: 0.25, roughness: 0.12, envMapIntensity: 1.4 });
    var matLip = new THREE.MeshStandardMaterial({ color: 0x8e1f30, metalness: 0.1, roughness: 0.32 });
    var matDrop = new THREE.MeshStandardMaterial({ color: 0xffe2ae, emissive: 0xffb85e, emissiveIntensity: 1.5, roughness: 0.3 });
    var matFlame = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xff9a3c, emissiveIntensity: 3.2, roughness: 0.4 });

    function glowTexture(){
      var c = document.createElement('canvas'); c.width = 256; c.height = 256;
      var g = c.getContext('2d');
      var grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255,214,150,0.95)');
      grad.addColorStop(0.4, 'rgba(232,180,100,0.38)');
      grad.addColorStop(1, 'rgba(232,180,100,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
      var t = new THREE.CanvasTexture(c);
      if('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    var glowTex = glowTexture();

    /* ----- object builders (one emblem per department) ----- */
    function buildScissors(){
      var g = new THREE.Group();
      [-1, 1].forEach(function(s){
        var blade = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.055, 0.92, 4), matGoldB);
        blade.scale.z = 0.32;
        blade.position.set(s * 0.075, 0.3, 0);
        blade.rotation.z = s * 0.17;
        blade.rotation.y = Math.PI / 4;
        g.add(blade);
        var link = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.025), matGold);
        link.position.set(s * 0.11, -0.14, 0); link.rotation.z = s * 0.34; g.add(link);
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.03, 10, 26), matGold);
        ring.position.set(s * 0.155, -0.33, 0); g.add(ring);
      });
      var pivot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), matChar);
      pivot.position.set(0, 0.02, 0.03); g.add(pivot);
      g.rotation.z = 0.45;
      return g;
    }
    function buildJar(){
      var g = new THREE.Group();
      var body = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.33, 0.34, 28), matCream);
      body.position.y = -0.12; g.add(body);
      var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.09, 28), matGoldB);
      lid.position.y = 0.1; g.add(lid);
      var drop = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 18), matDrop);
      drop.scale.set(1, 1.45, 1); drop.position.y = 0.48; g.add(drop);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 14), matDrop);
      tip.position.y = 0.68; g.add(tip);
      g.userData.flame = drop;
      return g;
    }
    function buildLipstick(){
      var g = new THREE.Group();
      var base = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.185, 0.52, 24), matChar);
      base.position.y = -0.22; g.add(base);
      var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.1, 24), matGoldB);
      collar.position.y = 0.09; g.add(collar);
      var bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.158, 0.34, 24), matLip);
      bullet.position.y = 0.31; g.add(bullet);
      var dome = new THREE.Mesh(new THREE.SphereGeometry(0.148, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matLip);
      dome.scale.y = 0.75; dome.position.y = 0.48; g.add(dome);
      g.rotation.z = -0.13;
      return g;
    }
    function buildPolish(){
      var g = new THREE.Group();
      var RB = THREE.RoundedBoxGeometry;
      var bodyGeo = RB ? new RB(0.54, 0.48, 0.54, 3, 0.09) : new THREE.BoxGeometry(0.54, 0.48, 0.54);
      var body = new THREE.Mesh(bodyGeo, matRuby);
      body.position.y = -0.2; g.add(body);
      var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 18), matGoldB);
      neck.position.y = 0.09; g.add(neck);
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.46, 18), matChar);
      cap.position.y = 0.36; g.add(cap);
      var band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 18), matGold);
      band.position.y = 0.15; g.add(band);
      return g;
    }
    function buildCandle(){
      var g = new THREE.Group();
      var tray = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.045, 28), matGold);
      tray.position.y = -0.38; g.add(tray);
      var wax = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.52, 26), matCream);
      wax.position.y = -0.1; g.add(wax);
      var wick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 8), matChar);
      wick.position.y = 0.19; g.add(wick);
      var flame = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), matFlame);
      flame.scale.set(1, 1.9, 1); flame.position.y = 0.34; g.add(flame);
      var stone = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), matWood);
      stone.scale.set(1, 0.55, 1); stone.position.set(0.36, -0.33, 0.12); g.add(stone);
      var stone2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), matGoldDark);
      stone2.scale.set(1, 0.55, 1); stone2.position.set(-0.35, -0.34, 0.16); g.add(stone2);
      g.userData.flame = flame;
      return g;
    }
    function buildRazor(){
      var g = new THREE.Group();
      var handle = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.68, 0.045), matGoldDark);
      handle.position.set(-0.16, -0.18, 0); handle.rotation.z = 0.42; g.add(handle);
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.15, 0.01), matSteel);
      blade.position.set(0.18, 0.22, 0); blade.rotation.z = -0.38; g.add(blade);
      var edge = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.012), matGoldB);
      edge.position.set(0.215, 0.155, 0); edge.rotation.z = -0.38; g.add(edge);
      var pivot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), matGoldB);
      pivot.position.set(-0.02, 0.08, 0.02); g.add(pivot);
      g.rotation.z = -0.3;
      return g;
    }
    var BUILDERS = { hair: buildScissors, treatment: buildJar, men: buildRazor, makeup: buildLipstick, skin: buildPolish, spa: buildCandle, nails: buildPolish, body: buildCandle };

    /* ----- the wall ----- */
    var wallGroup = new THREE.Group();
    wallGroup.position.set(0, 2.5, -4.2);
    scene.add(wallGroup);

    var backPlane = new THREE.Mesh(new THREE.PlaneGeometry(16.5, 7), matWall);
    backPlane.position.z = -0.22;
    wallGroup.add(backPlane);
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 24),
      new THREE.MeshStandardMaterial({ color: 0x14100b, roughness: 0.34, metalness: 0.42 })
    );
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 3);
    scene.add(floor);

    /* gold trim lines across the wall */
    [-2.62, 2.32].forEach(function(y){
      var trim = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.035, 0.03), matGoldB);
      trim.position.set(0, y, -0.14); wallGroup.add(trim);
    });

    function archFrame(){
      var shape = new THREE.Shape();
      shape.moveTo(-1.28, 0); shape.lineTo(-1.28, 0.82);
      shape.absarc(0, 0.82, 1.28, Math.PI, 0, true);
      shape.lineTo(1.28, 0); shape.lineTo(-1.28, 0);
      var hole = new THREE.Path();
      hole.moveTo(-1.1, 0.04); hole.lineTo(-1.1, 0.82);
      hole.absarc(0, 0.82, 1.1, Math.PI, 0, true);
      hole.lineTo(1.1, 0.04); hole.lineTo(-1.1, 0.04);
      shape.holes.push(hole);
      var geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 32 });
      return new THREE.Mesh(geo, matGold);
    }

    var COLS = [-4.3, 0, 4.3];
    var ROWS = [0.2, -2.15];   /* local shelf heights: top row, bottom row */
    var items = [];            /* {dept, group, proxy, ringMat, baseY, phase, chip} */
    var proxies = [];

    DEPTS.forEach(function(d, i){
      var col = COLS[i % 3], row = ROWS[Math.floor(i / 3)];
      var niche = new THREE.Group();
      niche.position.set(col, row, 0);
      wallGroup.add(niche);

      var frame = archFrame();
      frame.position.set(0, 0.06, -0.1);
      niche.add(frame);

      var glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.06, 28),
        new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.85 })
      );
      glow.position.set(0, 1.02, -0.16);
      niche.add(glow);

      var shelf = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.08, 0.78), matWood);
      shelf.position.set(0, 0, 0.16);
      niche.add(shelf);
      var shelfTrim = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.03, 0.79), matGold);
      shelfTrim.position.set(0, 0.05, 0.16);
      niche.add(shelfTrim);

      var pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.07, 28), matGoldDark);
      pedestal.position.set(0, 0.1, 0.16);
      niche.add(pedestal);

      var ringMat = new THREE.MeshStandardMaterial({ color: 0xc9a35f, metalness: 1, roughness: 0.25, emissive: 0x000000, emissiveIntensity: 1 });
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.02, 10, 44), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.15, 0.16);
      niche.add(ring);

      var obj = BUILDERS[d.key]();
      obj.position.set(0, 0.98, 0.16);
      niche.add(obj);

      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffca7a, transparent: true, opacity: 0.4, depthWrite: false }));
      halo.scale.set(2.5, 2.5, 1);
      halo.position.set(0, 0.98, -0.05);
      niche.add(halo);

      var proxy = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 2.1, 1.3),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
      );
      proxy.position.set(0, 0.98, 0.2);
      proxy.userData.dept = d;
      niche.add(proxy);
      proxies.push(proxy);

      items.push({ dept: d, group: obj, niche: niche, ringMat: ringMat, baseY: 0.98, phase: i * 1.13, chip: chipEls[d.key], flame: obj.userData.flame || null });
    });

    /* lights */
    scene.add(new THREE.AmbientLight(0x8a764f, 0.55));
    var key = new THREE.DirectionalLight(0xffe3b0, 1.15);
    key.position.set(5, 8, 7); scene.add(key);
    var warm = new THREE.PointLight(0xffc978, 16, 18, 1.8);
    warm.position.set(0, 3.2, 0.6); scene.add(warm);
    var fill = new THREE.PointLight(0xffd9a0, 7, 16, 1.8);
    fill.position.set(-5.5, 2.2, -0.5); scene.add(fill);

    /* gold dust */
    var COUNT = 120;
    var pos = new Float32Array(COUNT * 3);
    var seed = new Float32Array(COUNT);
    for(var i = 0; i < COUNT; i++){
      pos[i * 3] = (Math.random() - 0.5) * 13;
      pos[i * 3 + 1] = Math.random() * 4.8 + 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
      seed[i] = Math.random() * Math.PI * 2;
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      size: 0.075, map: glowTex, transparent: true, opacity: 0.65,
      depthWrite: false, blending: THREE.AdditiveBlending, color: 0xe8c987
    }));
    scene.add(dust);

    /* ----- camera choreography ----- */
    var overview = { pos: new THREE.Vector3(0, 2.55, 9.4), look: new THREE.Vector3(0, 2.42, -4.2) };
    var camBase = overview.pos.clone();
    var lookCur = overview.look.clone();
    var focusPos = new THREE.Vector3(), focusLook = new THREE.Vector3();
    var mode = 'wall';   /* wall | zoom | detail | zoomout */
    var anim = null;
    var wallScale = 1;
    var curItem = null;
    var hoverItem = null;
    var pointer = { x: 0, y: 0, inside: false };
    var ndc = new THREE.Vector2(-2, -2);
    var raycaster = new THREE.Raycaster();
    var tmpV = new THREE.Vector3();

    function easeInOut(k){ return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
    function flyTo(pos, look, dur, done){
      if(reduced || dur <= 0){
        camBase.copy(pos); lookCur.copy(look);
        if(done) done();
        return;
      }
      anim = { start: performance.now(), dur: dur * 1000, fp: camBase.clone(), tp: pos.clone(), fl: lookCur.clone(), tl: look.clone(), done: done };
    }
    function itemOf(d){ for(var i = 0; i < items.length; i++) if(items[i].dept === d) return items[i]; return null; }

    function computeFocus(item){
      item.group.getWorldPosition(tmpV);
      var dist = 3.35 * wallScale;
      focusLook.copy(tmpV); focusLook.y += 0.02;
      focusPos.copy(tmpV);
      focusPos.z += dist;
      if(window.innerWidth > 640){ focusPos.x += 0.95; focusPos.y += 0.05; }
      else { focusPos.y += 0.62; }
    }

    function layout(){
      var w = stage.clientWidth || window.innerWidth;
      var h = stage.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      var aspect = w / h;
      camera.aspect = aspect;
      wallScale = aspect >= 1.15 ? 1 : aspect >= 0.85 ? 0.8 : 0.58;
      wallGroup.scale.setScalar(wallScale);
      camera.fov = aspect < 0.85 ? 58 : 43;
      camera.updateProjectionMatrix();
      overview.pos.set(0, 2.55, aspect < 0.85 ? 10.8 : 9.4);
      overview.look.set(0, 2.42, -4.2);
      if(mode === 'wall' && !anim){ camBase.copy(overview.pos); lookCur.copy(overview.look); }
      if((mode === 'detail') && curItem){ computeFocus(curItem); if(!anim){ camBase.copy(focusPos); } }
      /* chips are positioned by layout math, not by the render loop:
         sync the camera and place them even before the first frame paints */
      if(!anim){ camera.position.copy(camBase); camera.lookAt(lookCur); }
      camera.updateMatrixWorld();
      if(items.length) updateChips();
    }

    window.__showOpen = function(d){
      curItem = itemOf(d);
      if(!curItem) { panel.classList.add('open'); return; }
      stage.classList.add('locked');
      document.body.style.overflow = 'hidden';
      mode = 'zoom';
      requestAnimationFrame(function(){
        layout();
        computeFocus(curItem);
        flyTo(focusPos, focusLook, 1.15, function(){ mode = 'detail'; });
        setTimeout(function(){ panel.classList.add('open'); }, reduced ? 0 : 420);
      });
    };
    window.__showClose = function(){
      if(mode === 'wall'){ stage.classList.remove('locked'); document.body.style.overflow = ''; return; }
      mode = 'zoomout';
      curItem = null;
      flyTo(overview.pos, overview.look, 1.0, function(){
        mode = 'wall';
        stage.classList.remove('locked');
        document.body.style.overflow = '';
        layout();
      });
    };

    /* ----- picking: tap (click without drag) + hover ----- */
    var downX = 0, downY = 0;
    canvas.addEventListener('pointerdown', function(e){ downX = e.clientX; downY = e.clientY; });
    canvas.addEventListener('pointerup', function(e){
      if(Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;
      if(mode !== 'wall') return;
      setNDC(e);
      var hit = pick();
      if(hit) openDetail(hit.userData.dept, canvas);
    });
    canvas.addEventListener('pointermove', function(e){
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
      pointer.inside = true;
      setNDC(e);
    }, { passive: true });
    canvas.addEventListener('pointerleave', function(){ pointer.inside = false; ndc.set(-2, -2); });
    function setNDC(e){
      var r = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    function pick(){
      raycaster.setFromCamera(ndc, camera);
      var hits = raycaster.intersectObjects(proxies, false);
      return hits.length ? hits[0].object : null;
    }
    function setHover(item){
      if(hoverItem === item) return;
      if(hoverItem){ hoverItem.ringMat.emissive.setHex(0x000000); hoverItem.chip.classList.remove('hot'); }
      hoverItem = item;
      if(hoverItem){ hoverItem.ringMat.emissive.setHex(0x7a5a18); hoverItem.chip.classList.add('hot'); }
      canvas.style.cursor = hoverItem ? 'pointer' : '';
    }

    /* ----- chips projection ----- */
    var projV = new THREE.Vector3();
    function updateChips(){
      camera.updateMatrixWorld();
      var w = stage.clientWidth, h = stage.clientHeight;
      items.forEach(function(it){
        it.group.getWorldPosition(projV);
        projV.y -= 1.42 * wallScale;
        projV.project(camera);
        var x = (projV.x * 0.5 + 0.5) * w;
        var y = (-projV.y * 0.5 + 0.5) * h;
        it.chip.style.left = x + 'px';
        it.chip.style.top = y + 'px';
        it.chip.style.visibility = projV.z < 1 ? 'visible' : 'hidden';
      });
    }

    /* ----- render loop (only while the stage is on screen or locked) ----- */
    var stageVisible = false;
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ stageVisible = en[0].isIntersecting; }, { threshold: 0.02 }).observe(stage);
    } else { stageVisible = true; }

    var t0 = performance.now();
    var paintedOnce = false;
    var lastPaint = 0;
    var paintFails = 0;
    var glDead = false;
    function frame(){
      requestAnimationFrame(frame);
      if(glDead) return;
      /* the first frame always paints, even before the stage scrolls into
         view, so the wall is never an empty stage; after that, only while visible */
      if(paintedOnce && !stageVisible && !stage.classList.contains('locked')) return;
      var now = performance.now();
      /* idle wall throttled to ~9fps: enough for the gentle bob & spin, and it
         keeps weak GPUs responsive; camera flights still run at full rate */
      if(paintedOnce && !anim && mode === 'wall' && now - lastPaint < 110) return;
      lastPaint = now;
      var t = (now - t0) / 1000;
      try {
        /* camera flight */
        if(anim){
          var k = Math.min(1, (now - anim.start) / anim.dur);
          var e = easeInOut(k);
          camBase.lerpVectors(anim.fp, anim.tp, e);
          lookCur.lerpVectors(anim.fl, anim.tl, e);
          if(k >= 1){ var dn = anim.done; anim = null; if(dn) dn(); }
        } else if(mode === 'wall'){
          camBase.lerp(overview.pos, 0.06);
          lookCur.lerp(overview.look, 0.06);
        } else if(mode === 'detail' && curItem){
          computeFocus(curItem);
          camBase.lerp(focusPos, 0.07);
          lookCur.lerp(focusLook, 0.09);
        }
        var par = mode === 'detail' ? 0.4 : 1;
        camera.position.set(
          camBase.x + (pointer.inside ? pointer.x * 0.16 * par : 0),
          camBase.y + (pointer.inside ? -pointer.y * 0.09 * par : 0) + (reduced ? 0 : Math.sin(t * 0.4) * 0.02),
          camBase.z
        );
        camera.lookAt(lookCur);

        /* item life */
        items.forEach(function(it){
          var isCur = curItem === it;
          if(!reduced){
            it.group.position.y = it.baseY + Math.sin(t * 0.9 + it.phase) * 0.045;
            it.group.rotation.y += (mode === 'detail' && isCur) ? 0.011 : 0.0024;
          }
          var target = isCur && mode !== 'wall' ? 1.3 : 1;
          var s = it.group.scale.x + (target - it.group.scale.x) * 0.08;
          it.group.scale.setScalar(s);
          if(it.flame && !reduced){
            var f = 1 + Math.sin(t * 11 + it.phase) * 0.13 + Math.sin(t * 23) * 0.05;
            it.flame.scale.set(f, it.flame === it.group.userData.flame && it.dept.key === 'body' ? 1.9 * (2 - f) * 0.5 + 0.95 : f, f);
          }
        });

        /* dust drift */
        if(!reduced){
          var arr = dustGeo.attributes.position.array;
          for(var i = 0; i < COUNT; i++){
            arr[i * 3 + 1] += Math.sin(t * 0.5 + seed[i]) * 0.0008 + 0.0011;
            if(arr[i * 3 + 1] > 5.4) arr[i * 3 + 1] = 0.25;
          }
          dustGeo.attributes.position.needsUpdate = true;
        }

        /* hover picking (mouse) */
        if(mode === 'wall' && pointer.inside && ndc.x > -1.5){
          var hit = pick();
          setHover(hit ? itemOf(hit.userData.dept) : null);
        } else if(hoverItem){ setHover(null); }

        renderer.render(scene, camera);
        paintedOnce = true;
        paintFails = 0;
        if(mode === 'wall') updateChips();
      } catch(err){
        /* a wall that cannot paint at all degrades to the tappable
           department-button grid instead of sitting as an empty stage */
        if(++paintFails >= 3){ glDead = true; showFallback(); }
      }
    }

    window.addEventListener('resize', layout);
    layout();
    glReady = true;
    frame();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(initShowcase, 60); });
  } else {
    setTimeout(initShowcase, 60);
  }
})();
