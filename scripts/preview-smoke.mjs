/* Browser smoke test used by GitHub Actions to generate review screenshots.
   Playwright is installed in the workflow only; no runtime browser dependency. */
import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = "http://127.0.0.1:5173";
await fs.mkdir("artifacts/cinematic", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
});
async function check(name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  await page.goto(base, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1800);
  const structural = await page.evaluate(() => ({
    storyCount: document.querySelectorAll(".cinematic-story").length,
    booking: !!document.querySelector("#bookForm"),
    chapter: !!document.querySelector("#cinematicChapterTitle"),
    quality: !!window.cinematicQuality
  }));
  if (!structural.booking || structural.storyCount !== 4 || !structural.chapter || !structural.quality) {
    throw new Error(name + ": required site elements are missing " + JSON.stringify(structural));
  }

  if (options.reducedMotion === "reduce") {
    await page.screenshot({ path: "artifacts/cinematic/reduced-motion.png" });
    const brandVisible = await page.locator(".portal-title").isVisible();
    if (!brandVisible) throw new Error("Reduced-motion visitor cannot see the brand title");
  } else {
    const height = await page.locator("#tour").evaluate(element => element.offsetHeight);
    for (const progress of [0, 0.20, 0.45, 0.70, 0.93]) {
      const y = progress * Math.max(0, height - options.viewport.height);
      await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(1400);
      // The film's text and navigation layers must stay pinned with the camera.
      if (progress > 0.1 && progress < 0.85) {
        const top = await page.locator(".tour-sticky").evaluate(el => el.getBoundingClientRect().top);
        if (Math.abs(top) > 5) throw new Error(name + ": cinematic stage scrolled out of view at " + progress + " (top=" + top + ")");
      }
      const file = "artifacts/cinematic/" + name + "-" + Math.round(progress * 100) + ".png";
      await page.screenshot({ path: file });
    }
  }
  if (errors.length) {
    const important = errors.filter(error => !/WebGL context|GPU process/i.test(error));
    if (important.length) throw new Error(name + ": " + important.slice(0, 3).join("; "));
  }
  console.log(name, structural);
  await context.close();
}
try {
  await check("desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await check("mobile", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await check("reduced", { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
} finally {
  await browser.close();
}
