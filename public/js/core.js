// Bhanu's The Hair Studio — core.js — error box, tabs, reveal-on-scroll, booking form
// Split from js/main.js (original single-file build). Keep load order:
// vendor-three.js -> core.js -> tour.js -> scene.js -> showcase.js -> tunnel.js
"use strict";
  /* Mathematical range wrap / modulo helper */
  function wrap(val, min, max){
    var range = max - min;
    if(range <= 0) return min;
    return ((((val - min) % range) + range) % range) + min;
  }
  window.wrap = wrap;
  var tourProgress = 0;
  window.tourProgress = 0;

  var errbox = document.getElementById('errbox');
  function showErr(msg){
    errbox.style.display = 'block';
    errbox.textContent = 'Something went wrong rendering the 3D salon: ' + msg;
  }
  window.addEventListener('error', function(e){ if(e && e.message) showErr(e.message); });
  window.addEventListener('unhandledrejection', function(e){
    showErr((e.reason && e.reason.message) || 'unknown error');
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  window.reduced = reduced;

  /* ---------------- Luxury Preloader Controller ---------------- */
  var preloader = document.getElementById('preloader');
  var preloaderBar = document.getElementById('preloaderBar');
  var preloaderPct = document.getElementById('preloaderPct');
  var preloaderStatus = document.getElementById('preloaderStatus');
  var preloaderTrack = document.getElementById('preloaderTrack');
  var preloaderDone = false;
  var currentProgress = 0;

  function updatePreloader(pct, status){
    if(preloaderDone) return;
    if(pct > currentProgress) currentProgress = pct;
    if(currentProgress > 100) currentProgress = 100;
    if(preloaderBar) preloaderBar.style.width = currentProgress + '%';
    if(preloaderPct) preloaderPct.textContent = Math.round(currentProgress) + '%';
    if(preloaderTrack) preloaderTrack.setAttribute('aria-valuenow', Math.round(currentProgress));
    if(status && preloaderStatus) preloaderStatus.textContent = status;
  }

  function completePreloader(){
    if(preloaderDone) return;
    preloaderDone = true;
    updatePreloader(100, "Welcome to Bhanu's The Hair Studio");
    setTimeout(function(){
      if(preloader) preloader.classList.add('loaded');
    }, 420);
  }

  // Connect to THREE.DefaultLoadingManager if available
  if(window.THREE && THREE.DefaultLoadingManager){
    THREE.DefaultLoadingManager.onProgress = function(url, loaded, total){
      var p = Math.min(95, Math.round((loaded / total) * 100));
      updatePreloader(p, 'Loading assets…');
    };
    THREE.DefaultLoadingManager.onLoad = function(){
      updatePreloader(98, 'Finalizing lounge…');
    };
  }

  // Safe window.load fallback timeout so screen never gets permanently stuck
  window.addEventListener('load', function(){
    setTimeout(function(){
      if(!preloaderDone) completePreloader();
    }, 600);
  });

  // Emergency safety fallback timeout
  setTimeout(function(){
    if(!preloaderDone) completePreloader();
  }, 3200);

  /* ---------------- Tabs ---------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#services .tab'));
  var servicePanels = Array.prototype.slice.call(document.querySelectorAll('#services .panel'));
  function activateTab(key){
    tabs.forEach(function(t){
      var active = t.getAttribute('data-panel') === key;
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.tabIndex = active ? 0 : -1;
    });
    servicePanels.forEach(function(p){
      var active = p.id === 'panel-' + key;
      p.classList.toggle('active', active);
      p.hidden = !active;
    });
  }
  tabs.forEach(function(t, index){
    var key = t.getAttribute('data-panel');
    t.id = 'service-tab-' + key;
    t.setAttribute('aria-controls', 'panel-' + key);
    var panel = document.getElementById('panel-' + key);
    if(panel) panel.setAttribute('aria-labelledby', t.id);
    t.addEventListener('click', function(){ activateTab(key); });
    t.addEventListener('keydown', function(e){
      var next = index;
      if(e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if(e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if(e.key === 'Home') next = 0;
      else if(e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      var target = tabs[next];
      activateTab(target.getAttribute('data-panel'));
      target.focus();
      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'instant' : 'smooth' });
    });
  });
  activateTab('hair');
  document.querySelectorAll('[data-goto]').forEach(function(el){
    el.addEventListener('click', function(){ activateTab(el.getAttribute('data-goto')); });
  });

  /* ---------------- Reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !reduced){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------------- Booking form -> WhatsApp ---------------- */
  var WA_NUMBER = '919876543210'; /* Bhanu's The Hair Studio booking number */
  var form = document.getElementById('bookForm');
  var msg = document.getElementById('formMsg');
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var name = document.getElementById('f-name').value.trim();
    var phone = document.getElementById('f-phone').value.trim();
    var service = document.getElementById('f-service').value;
    var date = document.getElementById('f-date').value;
    var time = document.getElementById('f-time').value;
    var note = document.getElementById('f-note').value.trim();
    if(!name || !phone || !service || !date || !time){
      msg.textContent = 'Please fill your name, mobile, service, date and time so we can hold your chair.';
      return;
    }
    var niceDate = date;
    try {
      niceDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    } catch(e){}
    var lines = [
      "Hi Bhanu's The Hair Studio! I would like to book an appointment.",
      'Name: ' + name,
      'Mobile: ' + phone,
      'Service: ' + service,
      'Preferred: ' + niceDate + ' at ' + time
    ];
    if(note) lines.push('Note: ' + note);
    msg.textContent = 'Opening WhatsApp — just press send and your booking request is with us.';
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });

