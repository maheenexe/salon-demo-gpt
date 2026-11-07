/* Responsive-services smoke test; runs inside GitHub Actions with Playwright.
   Checks layout and keyboard/click behavior across desktop, tablet and phones. */
import { chromium } from "playwright";
import fs from "node:fs/promises";
const base = "http://127.0.0.1:5173/";
const directory = "artifacts/responsive-services";
await fs.mkdir(directory, { recursive:true });
const browser = await chromium.launch({headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const screens = [
  ["desktop",1440,900],
  ["laptop",1024,768],
  ["tablet",768,1024],
  ["mobile",390,844],
  ["small-mobile",320,700]
];
const summaries=[];
try{
  for(const [name,width,height] of screens){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:"reduce"});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base,{waitUntil:"domcontentloaded",timeout:60000});
    await page.waitForTimeout(850);
    await page.evaluate(()=>document.getElementById("showcase").scrollIntoView({behavior:"instant"}));
    await page.waitForTimeout(550);

    const choices=page.locator("#showServiceChoices .show-service-choice");
    if(await choices.count()!==6) throw new Error(name+": expected 6 service choices");
    const data=await page.evaluate(()=>{
      const a=sel=>Array.from(document.querySelectorAll(sel)).map(el=>{
        const r=el.getBoundingClientRect();
        return {x:r.x,right:r.right,width:r.width,visible:r.width>0&&r.height>0};
      });
      return {viewport:window.innerWidth,documentWidth:document.documentElement.scrollWidth,
        explorer:a(".show-explorer"),choices:a(".show-service-choice"),
        browser:a(".show-service-browser")};
    });
    for(const region of [...data.explorer,...data.browser,...data.choices]){
      if(!region.visible||region.x < -3||region.right>data.viewport+3)
        throw new Error(name+": showcase overflow "+JSON.stringify(region));
    }
    await page.locator(".show-explorer").screenshot({path:directory+"/showcase-"+name+".png"});
    await choices.first().click();
    if(!(await page.locator("#showDetail").isVisible()) || !(await page.locator("#showDetail").evaluate(el=>el.classList.contains("open"))))
      throw new Error(name+": department details did not open");
    if(!(await page.locator("#showDetailName").textContent()).includes("Precision"))
      throw new Error(name+": wrong department selected");
    await page.locator("#showDetail").screenshot({path:directory+"/details-"+name+".png"});
    const scrollBeforeClose = await page.evaluate(() => window.scrollY);
    const closeX = page.locator("#showClose");
    if(!(await closeX.isVisible())) throw new Error(name + ": close X is not visible");
    await closeX.click();
    if(await page.locator("#showDetail").evaluate(el => el.classList.contains("open")))
      throw new Error(name + ": X failed to close details");
    const scrollAfterClose = await page.evaluate(() => window.scrollY);
    if(Math.abs(scrollAfterClose - scrollBeforeClose) > 10)
      throw new Error(name + ": closing changed the scroll position");
    await choices.nth(1).click();
    await page.locator("#showBack").click();
    if(await page.locator("#showDetail").evaluate(el=>el.classList.contains("open")))
      throw new Error(name+": All departments did not close details");
    await page.evaluate(()=>document.getElementById("services").scrollIntoView({behavior:"instant"}));
    await page.waitForTimeout(450);
    const tabs=page.locator("#services .tab");
    if(await tabs.count()!==6)throw new Error(name+": missing service tabs");
    await page.locator("#services .tab[data-panel='spa']").click();
    if(await page.locator("#panel-spa").isHidden())throw new Error(name+": spa panel hidden after selection");
    await page.locator("#services .tab[data-panel='spa']").press("Home");
    if((await page.locator("#services .tab[data-panel='hair']").getAttribute("aria-selected"))!=="true")
      throw new Error(name+": keyboard tab navigation failed");
    const svcCount=await page.locator("#services .panel.active .svc").count();
    if(svcCount<4)throw new Error(name+": no active service descriptions");
    const svcLayout=await page.evaluate(()=>({
      viewport:window.innerWidth,
      services:Array.from(document.querySelectorAll("#services .panel.active .svc")).map(el=>{
        const r=el.getBoundingClientRect();return {x:r.x,right:r.right};
      })
    }));
    for(const el of svcLayout.services)if(el.x < -3||el.right >svcLayout.viewport+3)
      throw new Error(name+": full service menu overflows viewport "+JSON.stringify(el));
    await page.locator("#services .wrap").screenshot({path:directory+"/menu-"+name+".png"});
    if(!await page.locator("#bookForm").count())throw new Error(name+": booking form removed");
    if(errors.length){
      const critical=errors.filter(s=>!/WebGL context|GPU process|Three.WebGLRenderer/i.test(s));
      if(critical.length)throw new Error(name+": uncaught JavaScript: "+critical.slice(0,2).join("; "));
    }
    summaries.push({name,width,height,choices:6,serviceRows:svcCount,passed:true});
    await context.close();
  }
  await fs.writeFile(directory+"/results.json",JSON.stringify(summaries,null,2));
  console.log(JSON.stringify(summaries,null,2));
} finally {
  await browser.close();
}
