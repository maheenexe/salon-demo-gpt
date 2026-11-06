// Phase 2: GSAP coordinates the existing Three.js camera tour and cinematic DOM layers.
// The existing native scroll controller remains a fallback if this module cannot load.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const tour = document.querySelector("#tour");
const brand = document.querySelector("#portalBrand");
const portal = document.querySelector("#portal");
const hint = document.querySelector("#portalHint");
const reveal = document.querySelector("#cinematicRevealImage");
const lightSweep = document.querySelector("#cinematicLightSweep");
const chapterNumber = document.querySelector("#cinematicChapterNumber");
const chapterTitle = document.querySelector("#cinematicChapterTitle");
const meter = document.querySelector("#cinematicScrollMeter");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const chapters = [
  [0, "01", "THE AWAKENING"],
  [0.12, "02", "GOLD IN MOTION"],
  [0.27, "03", "THE THRESHOLD"],
  [0.48, "04", "THE TRANSFORMATION"],
  [0.66, "05", "THE SALON REVEAL"],
  [0.88, "06", "EXPLORE BHANU'S"]
];

if (tour && brand && portal && reveal && !reducedMotion.matches) {
  // The old script still supports non-JS-module / failed-bundle fallback.
  // While this director is active it owns scroll progress and DOM transitions.
  window.__cinematicScrollActive = true;

  let activeChapter = -1;
  function update(progress) {
    const p = gsap.utils.clamp(0, 1, progress);
    if (typeof window.applyTourProgress === "function") {
      window.applyTourProgress(p);
    } else {
      window.tourProgress = p;
    }
    if (meter) meter.style.transform = "scaleX(" + p.toFixed(4) + ")";
    let next = 0;
    for (let i = 1; i < chapters.length; i++) {
      if (p >= chapters[i][0]) next = i;
    }
    if (activeChapter !== next) {
      activeChapter = next;
      if (chapterNumber) chapterNumber.textContent = chapters[next][1] + " / 06";
      if (chapterTitle) chapterTitle.textContent = chapters[next][2];
    }
  }

  const playhead = { progress: 0 };
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    onUpdate: () => update(playhead.progress),
    scrollTrigger: {
      trigger: tour,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.55,
      invalidateOnRefresh: true,
      onRefresh: self => update(self.progress)
    }
  });

  // One-second dummy tween establishes a 0..1 story clock for every chapter.
  tl.to(playhead, { progress: 1, duration: 1 }, 0);
  tl.to(brand, {
    autoAlpha: 0, scale: 1.24, filter: "blur(14px)", duration: 0.13
  }, 0.015);
  if (hint) tl.to(hint, { autoAlpha: 0, duration: 0.08 }, 0.01);
  tl.to(portal, { autoAlpha: 0, duration: 0.10 }, 0.14);

  // A photographic plate conceals the heaviest change in geometry and lighting.
  // It dissolves into the existing interactive Three.js salon, not a static page.
  tl.fromTo(reveal,
    { autoAlpha: 0, scale: 1.18, filter: "blur(18px) saturate(0.75)" },
    { autoAlpha: 0.95, scale: 1.035, filter: "blur(1px) saturate(1.12)", duration: 0.17 },
    0.46
  );
  if (lightSweep) {
    tl.fromTo(lightSweep,
      { autoAlpha: 0, xPercent: -50 },
      { autoAlpha: 0.75, xPercent: 80, duration: 0.21 },
      0.48
    );
    tl.to(lightSweep, { autoAlpha: 0, duration: 0.08 }, 0.68);
  }
  tl.to(reveal, {
    autoAlpha: 0, scale: 1, filter: "blur(0px) saturate(1)", duration: 0.16
  }, 0.65);

  // Set initial state and recalculate after fonts and image dimensions settle.
  update(0);
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
} else if (tour) {
  // Reduced motion: the original page layout and booking remain accessible.
  window.__cinematicScrollActive = false;
}
