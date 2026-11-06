/* Cinematic Hybrid v2 — one reversible scroll clock for film-grade UI and 3D tour.
   Uses the original classic Three.js salon as the interactive scene; no AI or server. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const tour = $("#tour");
const portal = $("#portal");
const brand = $("#portalBrand");
const hint = $("#portalHint");
const concept = $("#cinematicRevealImage");
const sweep = $("#cinematicLightSweep");
const progressBar = $("#cinematicScrollMeter");
const chapterNumber = $("#cinematicChapterNumber");
const chapterTitle = $("#cinematicChapterTitle");
const stories = $$(".cinematic-story");
const curtains = $(".cinematic-film-curtain");
const invitation = stories[3];
const sheen = $("#cinematicPortalSheen");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const quality = window.cinematicQuality || { tier: "medium" };

// Optional 4K still produced by scripts/render_4k_concept.py.
// Existing imagery remains the offline/preview fallback until production assets exist.
if (concept && !quality.saveData) {
  const still = new URL("assets/salon-concept-4k.webp", document.baseURI);
  fetch(still, { method: "HEAD" }).then(response => {
    const type = response.headers.get("content-type") || "";
    if (response.ok && type.startsWith("image/")) {
      concept.style.backgroundImage = "url(" + JSON.stringify(still.href) + ")";
    }
  }).catch(() => {});
}


const chapters = [
  [0, "01", "THE AWAKENING"],
  [0.12, "02", "SCULPTED LIGHT"],
  [0.29, "03", "BEYOND THE THRESHOLD"],
  [0.49, "04", "A WORLD TRANSFORMED"],
  [0.68, "05", "THE STUDIO REVEALED"],
  [0.89, "06", "EXPLORE THE EXPERIENCE"]
];

function addEditorialMotion() {
  if (reduced) return;
  // Separate non-pinned content animation from the pinned hero's scroll clock.
  $$(".sheet .kicker").forEach(el => {
    gsap.fromTo(el, { autoAlpha: 0.45, y: 20 }, {
      autoAlpha: 1, y: 0, duration: 0.75, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 91%", once: true }
    });
  });
  $$(".sheet .sec-title").forEach(el => {
    gsap.fromTo(el, { y: 42, filter: "blur(7px)" }, {
      y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 89%", once: true }
    });
  });
  $$(".gallery img, .intro-photo img, .bridal-img img").forEach(el => {
    gsap.fromTo(el, { scale: 1.09 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.9 }
    });
  });
  $$(".card").forEach((card, i) => {
    gsap.fromTo(card, { y: 40 }, {
      y: 0, ease: "power2.out", duration: 0.8, delay: (i % 4) * 0.08,
      scrollTrigger: { trigger: card, start: "top 91%", once: true }
    });
  });
}

if (!tour || !portal || !brand || !concept || reduced) {
  window.__cinematicScrollActive = false;
  addEditorialMotion();
} else {
  window.__cinematicScrollActive = true;
  tour.classList.add("is-cinematic");
  let chapterIndex = -1;
  let lastProgress = -1;
  if (invitation) invitation.inert = true;

  function displayProgress(value) {
    const p = gsap.utils.clamp(0, 1, value);
    // Interactive CTA is keyboard-accessible only in its visible scroll chapter.
    if (invitation) {
      const canInteract = p >= 0.88 && p < 0.99;
      invitation.inert = !canInteract;
      invitation.setAttribute("aria-hidden", String(!canInteract));
    }
    if (Math.abs(p - lastProgress) >= 0.00005) {
      lastProgress = p;
      if (typeof window.applyTourProgress === "function") {
        window.applyTourProgress(p);
      } else {
        window.tourProgress = p;
      }
      if (progressBar) progressBar.style.transform = "scaleX(" + p.toFixed(5) + ")";
    }
    let i = chapters.length - 1;
    while (i > 0 && p < chapters[i][0]) i--;
    if (i !== chapterIndex) {
      chapterIndex = i;
      if (chapterNumber) chapterNumber.textContent = chapters[i][1] + " / 06";
      if (chapterTitle) chapterTitle.textContent = chapters[i][2];
    }
  }

  const playhead = { p: 0 };
  const movie = gsap.timeline({
    defaults: { ease: "none" },
    onUpdate: () => displayProgress(playhead.p),
    scrollTrigger: {
      trigger: tour,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.28,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      onRefresh: trigger => {
        // Sync the pre-existing camera without sudden progress jumps on resize.
        if (trigger && typeof trigger.progress === "number") displayProgress(trigger.progress);
      }
    }
  });
  movie.to(playhead, { p: 1, duration: 1 }, 0);
  movie.to(brand, {
    autoAlpha: 0, scale: 1.18, filter: "blur(13px)", duration: 0.11
  }, 0.022);
  if (hint) movie.to(hint, { autoAlpha: 0, duration: 0.055 }, 0.018);
  movie.to(portal, { autoAlpha: 0, duration: 0.10 }, 0.125);

  function storyWindow(node, enter, hold, exit) {
    if (!node) return;
    gsap.set(node, { autoAlpha: 0, y: 70, scale: 1.045 });
    movie.to(node, { autoAlpha: 1, y: 0, scale: 1, duration: 0.055, ease: "power2.out" }, enter);
    movie.to(node, { autoAlpha: 1, duration: hold - enter - 0.055 }, enter + 0.055);
    movie.to(node, { autoAlpha: 0, y: -46, scale: 0.97, duration: exit - hold }, hold);
  }
  storyWindow(stories[0], 0.17, 0.255, 0.305);
  storyWindow(stories[1], 0.333, 0.428, 0.485);
  storyWindow(stories[2], 0.695, 0.785, 0.845);
  storyWindow(stories[3], 0.88, 0.958, 0.999);

  // Image bridge hides the geometry and lighting change as the virtual camera
  // leaves the gold corridor and enters the real-time conceptual salon.
  movie.fromTo(concept,
    { autoAlpha: 0, scale: 1.18, filter: "blur(14px) contrast(1.1)" },
    { autoAlpha: 0.93, scale: 1.03, filter: "blur(0px) contrast(1.12)", duration: 0.17 },
    0.47
  );
  movie.to(concept,
    { autoAlpha: 0, scale: 1, filter: "blur(0px)", duration: 0.15 },
    0.655
  );
  if (sweep) {
    movie.fromTo(sweep, { autoAlpha: 0, xPercent: -70 }, {
      autoAlpha: 0.85, xPercent: 35, duration: 0.16
    }, 0.495);
    movie.to(sweep, { autoAlpha: 0, xPercent: 95, duration: 0.13 }, 0.655);
  }
  if (sheen) {
    movie.fromTo(sheen,
      { autoAlpha: 0.15, rotate: -28, scale: 0.7 },
      { autoAlpha: 0.7, rotate: 28, scale: 1.35, duration: 0.38 },
      0.05
    );
    movie.to(sheen, { autoAlpha: 0, duration: 0.12 }, 0.43);
  }
  curtains.forEach((el, index) => {
    movie.fromTo(el, { scaleY: 1 }, { scaleY: 0.58, duration: 0.11 }, 0.16);
    movie.to(el, { scaleY: 1, duration: 0.12 }, 0.77);
  });

  displayProgress(0);
  addEditorialMotion();
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
  }
}
