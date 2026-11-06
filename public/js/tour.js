// Bhanu's The Hair Studio — tour.js — cinematic portal intro, 3D tunnel flight, salon tour
// Split from js/main.js (original single-file build). Keep load order:
// vendor-three.js -> core.js -> tour.js -> scene.js -> showcase.js -> tunnel.js
"use strict";
  /* ---------------- Scroll tour UI ----------------
     Cinematic 9-step hybrid transition:
       0% - 15%: Centered luxury typography ("BHANU'S THE HAIR STUDIO") dissolves and scales
                 down smoothly over the 3D Golden Ring; gold specks disperse.
       15% - 55%: Camera accelerates forward through the hollow center of the 3D
                  Golden Ring into the procedural golden light streak tunnel.
       55% - 80%: Camera exits tunnel warp cleanly into the main 3D salon floor
                  (illuminated mirrors, signature styling chairs & lounges).
       80% - 100%: Camera settles smoothly into the Department Showcase section. */
  var tour = document.getElementById('tour');
  var heroCopy = document.getElementById('heroCopy');
  var shutter = document.getElementById('shutter');
  var mirrorChips = document.getElementById('mirrorChips');
  var chipLinks = Array.prototype.slice.call(document.querySelectorAll('.mchip'));
  var glCanvas = document.getElementById('gl');
  var hint = document.getElementById('scrollHint');
  var captions = Array.prototype.slice.call(document.querySelectorAll('.tour-caption'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.tour-progress b'));
  var tourProgress = 0;   /* camera progress — the 3D loop reads this */
  var chipsOn = false;
  var reduced = (typeof window !== 'undefined' && window.reduced) || (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || false;
  var portal = document.getElementById('portal');
  var portalBrand = document.getElementById('portalBrand');
  var portalHint = document.getElementById('portalHint');

  function clamp01(v){ return Math.max(0, Math.min(1, v)); }
  function seg(p, a, b){ return clamp01((p - a) / (b - a)); }
  function fade(p, a, b, c, d){ /* in a-b, out c-d */
    return Math.min(seg(p, a, b), 1 - seg(p, c, d));
  }
  function smooth(k){ return k * k * (3 - 2 * k); }
  function wrap(val, min, max){
    var range = max - min;
    if(range <= 0) return min;
    return ((((val - min) % range) + range) % range) + min;
  }

  if(reduced){
    /* For reduced motion: the hero copy sits in the open
       and the tour behaves like a plain scroll-through. */
    var sticky = tour.querySelector('.tour-sticky');
    if(sticky && heroCopy) sticky.appendChild(heroCopy);
    if(portal) portal.remove();
    if(shutter) shutter.remove();
    if(mirrorChips) mirrorChips.remove();
    portal = null; shutter = null; mirrorChips = null;
  }

  function updateTour(forcedProgress){
    var rect = tour.getBoundingClientRect();
    var total = tour.offsetHeight - window.innerHeight;
    var p = typeof forcedProgress === 'number' ? clamp01(forcedProgress) : (total > 0 ? clamp01(Math.max(0, -rect.top) / total) : 0);
    tourProgress = p;
    window.tourProgress = p;

    if(reduced){
      if(heroCopy){
        heroCopy.style.opacity = String(1 - seg(p, 0.02, 0.16));
        heroCopy.style.pointerEvents = p > 0.1 ? 'none' : 'auto';
      }
    } else {
      /* Step A - Text Disperses into Gold Dust & Dissolves (Scroll 0.0 to 0.15) */
      if(portal && portalBrand && !window.__cinematicScrollActive){
        if(p <= 0.15){
          var textP = clamp01(p / 0.15);
          var opacity = (1 - textP).toFixed(4);
          var blurVal = (textP * 14).toFixed(2);
          var scale = (1 + textP * 0.06).toFixed(4);
          var letterSpacing = (0.24 + textP * 0.22).toFixed(3) + 'em';
          var glowAlpha = (0.85 * (1 - textP)).toFixed(3);

          portal.style.opacity = opacity;
          portal.style.visibility = 'visible';
          portal.style.pointerEvents = 'none';

          portalBrand.style.opacity = opacity;
          portalBrand.style.transform = 'scale(' + scale + ')';
          portalBrand.style.filter = 'blur(' + blurVal + 'px) drop-shadow(0 0 ' + (textP * 24).toFixed(1) + 'px rgba(232,201,135,' + glowAlpha + '))';

          var titleEl = (portalBrand && typeof portalBrand.querySelector === 'function') ? portalBrand.querySelector('.portal-title') : null;
          if(titleEl){
            titleEl.style.letterSpacing = letterSpacing;
          }
          if(portalHint){
            portalHint.style.opacity = (1 - textP).toFixed(4);
            portalHint.style.visibility = textP >= 0.99 ? 'hidden' : 'visible';
          }
        } else {
          portal.style.opacity = '0';
          portal.style.visibility = 'hidden';
          portal.style.pointerEvents = 'none';
          portalBrand.style.opacity = '0';
          portalBrand.style.filter = 'none';
          if(portalHint){
            portalHint.style.opacity = '0';
            portalHint.style.visibility = 'hidden';
          }
        }
      }

      /* Keep gold metallic luster vibrant */
      if(glCanvas){
        glCanvas.style.filter = 'none';
      }

      /* Mirror cards appear gracefully as camera pushes in toward salon stations (78% - 95%) */
      if(mirrorChips){
        var chipO = fade(p, 0.78, 0.83, 0.90, 0.95);
        mirrorChips.style.opacity = String(chipO);
        mirrorChips.style.visibility = chipO > 0.01 ? 'visible' : 'hidden';
        var on = chipO > 0.45;
        if(on !== chipsOn){
          chipsOn = on;
          mirrorChips.style.pointerEvents = on ? 'auto' : 'none';
          mirrorChips.setAttribute('aria-hidden', on ? 'false' : 'true');
          chipLinks.forEach(function(a){ a.tabIndex = on ? 0 : -1; });
        }
      }
    }

    /* 1. Force-Hide the Floating Hero Ring Mesh in Salon Floor (p >= 0.65) */
    if(p >= 0.65){
      if(window.heroRingMesh) window.heroRingMesh.visible = false;
      if(window.portalHeroGroup) window.portalHeroGroup.visible = false;
      if(window.heroRingGroup) window.heroRingGroup.visible = false;
    }

    /* 2. Lock Camera Path to Straight Center Walk-through (progress 0.65 to 0.85) */
    if(p >= 0.65 && p <= 0.85){
      if(window.tourCamera){
        window.tourCamera.position.x = 0;
        window.tourCamera.lookAt(0, window.tourCamera.position.y, -20);
      }
    }

    var cp = tourProgress;
    if(hint){
      hint.style.display = 'none';
    }

    /* Cinematic tour captions synchronized with staged salon floor reveal:
       1: Wide establishing shot (0.60 - 0.77)
       2: Push-in / zoom toward styling station (0.79 - 0.93)
       3: Department showcase handover (0.94 - 1.00) */
    var capWindows = [
      [0.60, 0.65, 0.73, 0.77],  /* 1: Step into the styling lounge */
      [0.79, 0.83, 0.89, 0.93],  /* 2: Colour, cut & pure craft */
      [0.94, 0.97, 0.99, 1.01]   /* 3: Your glow-up begins here */
    ];
    captions.forEach(function(cap, i){
      var w = capWindows[i];
      if(w){
        var o = fade(cp, w[0], w[1], w[2], w[3]);
        cap.style.opacity = String(o);
        cap.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      }
    });

    /* Progress dots: 0 = Hero, 1 = 3D Tunnel Warp, 2 = Salon Walkthrough, 3 = Showcase */
    var stage = cp < 0.15 ? 0 : cp < 0.60 ? 1 : cp < 0.80 ? 2 : 3;
    dots.forEach(function(d, i){ d.classList.toggle('on', i === stage); });
    window.tourProgress = tourProgress;
  }
  window.tourProgress = 0;
  window.applyTourProgress = function(progress){ updateTour(progress); };
  function nativeScrollUpdate(){ if(!window.__cinematicScrollActive) updateTour(); }
  window.addEventListener('scroll', nativeScrollUpdate, { passive: true });
  window.addEventListener('resize', nativeScrollUpdate);
  updateTour();

