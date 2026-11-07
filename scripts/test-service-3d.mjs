/* Verify 3D service models and return-to-overview without manual scrolling. */
import { chromium } from "playwright";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/service-3d", {recursive:true});
const browser = await chromium.launch({
  headless:true,
  args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
});
const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:"reduce"});
const errors=[];
page.on("pageerror", e=>errors.push(e.message));
try{
  await page.goto("http://127.0.0.1:5173/", {waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForTimeout(600);
  await page.locator("#showStage").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
  const count=await page.locator("#showStage").getAttribute("data-real-models-loaded");
  // Use a timeout, because PBR files load lazily only when near the viewport.
  const modelReady = await page.waitForFunction(
    ()=>Number(document.getElementById("showStage").dataset.realModelsLoaded || 0)>=1,
    null,{timeout:15000}).then(()=>true,()=>false);
  await page.locator("#showStage").screenshot({path:"artifacts/service-3d/overview.png"});
  console.log("Real 3D models loaded:",count,"eventually ready:",modelReady);
  if(!modelReady)throw new Error("Could not load any CC0 salon GLB models in the actual WebGL viewer");

  const canvas=page.locator("#gl2");
  const rect=await canvas.boundingBox();
  if(!rect)throw new Error("3D showcase canvas is not visible");
  let clicked=false;
  for(const [x,y] of [[.5,.40],[.25,.40],[.75,.40],[.5,.63],[.25,.63],[.75,.63]]){
    await canvas.click({position:{x:Math.floor(rect.width*x),y:Math.floor(rect.height*y)},timeout:5000});
    clicked=await page.locator("#showStage").evaluate(el=>el.classList.contains("locked"));
    if(clicked)break;
  }
  if(!clicked)throw new Error("No 3D station could be selected by clicking the canvas");
  await page.locator("#showDetail.open").waitFor({state:"visible",timeout:8000});
  const xButton=page.locator("#showClose");
  if(!await xButton.isVisible())throw new Error("Close X not visible in zoomed 3D details");
  await page.locator("#showStage").screenshot({path:"artifacts/service-3d/detail.png"});
  await xButton.click();
  await page.waitForFunction(()=>!document.getElementById("showStage").classList.contains("locked"),null,{timeout:6500});
  if(await page.locator("#showDetail").evaluate(el=>el.classList.contains("open")))
    throw new Error("Close X left the detail panel open");
  await page.locator("#showStage").screenshot({path:"artifacts/service-3d/restored-overview.png"});
  const results={loaded:Number(await page.locator("#showStage").getAttribute("data-real-models-loaded")),canvasSelectable:clicked,closeButton:true,returnedToOverview:true,errors};
  await fs.writeFile("artifacts/service-3d/results.json",JSON.stringify(results,null,2));
  if(errors.length) throw new Error("Browser errors: "+errors.slice(0,3).join("; "));
  console.log(JSON.stringify(results,null,2));
} finally { await browser.close(); }
