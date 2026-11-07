/* Adaptive quality settings shared by the existing classic Three.js scenes.
   Read this before creating any WebGL renderer. No personal data leaves the browser. */
(function () {
  "use strict";
  var mql = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobile = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var memory = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : 8;
  var cores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
  var reduced = !!(mql && mql.matches);
  var low = reduced || saveData || memory <= 2 || cores <= 2;
  var medium = !low && (mobile || coarse || memory <= 4 || cores <= 4);
  var tier = low ? "low" : medium ? "medium" : "high";
  var limit = low ? 1 : medium ? 1.35 : 1.8;
  var pixelRatio = Math.max(0.75, Math.min(window.devicePixelRatio || 1, limit));
  window.cinematicQuality = Object.freeze({
    tier: tier,
    pixelRatio: pixelRatio,
    showcasePixelRatio: Math.min(pixelRatio, 1.35),
    shadowResolution: low ? 512 : medium ? 1024 : 2048,
    spotShadowResolution: low ? 256 : medium ? 512 : 1024,
    particleFactor: low ? 0.3 : medium ? 0.6 : 1,
    frameInterval: low ? 1000 / 30 : 0,
    reducedMotion: reduced,
    saveData: saveData
  });
})();
