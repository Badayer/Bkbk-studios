const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),output=path.resolve(root,'../qa');fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const server=http.createServer((req,res)=>{const target=decodeURIComponent(req.url.split('?')[0]);const file=path.join(root,target==='/'?'index.html':target);fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end()}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b)})});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.BKBK_CHROME||'/tmp/bkbk-browser/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();const errors=[],failed=[],passed=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
 await page.goto(url);await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});assert(await page.locator('#intro').isVisible());await page.click('#enter');assert(!await page.locator('#intro').isVisible());passed.push('Intro entry');
 for(const width of (process.env.BKBK_QA_CORE?[]:[320,390,768,1024,1440,1920])){console.log('Testing width',width);
  await page.setViewportSize({width,height:900});
  for(const language of ['en','ar']){
   if(await page.locator('html').getAttribute('lang')!==language)await page.click('#language');
   await page.evaluate(()=>Promise.all([...document.querySelectorAll('.scene img')].map(im=>im.decode().catch(()=>{}))));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${language} overflow`);
   assert.equal(await page.locator('html').getAttribute('dir'),language==='ar'?'rtl':'ltr');
   for(const target of ['home','about','shop','services','portfolio','films','contact']){
    if(width<=800)await page.click('#menu');await page.click(`#navigation a[href="#${target}"]`);assert.equal(new URL(page.url()).hash,'#'+target);
   }
   await page.evaluate(()=>window.scrollTo(0,0));
   if(width===390||width===1440){await page.screenshot({path:path.join(output,`${width}-${language}-day.png`)});await page.click('#mode');await page.waitForTimeout(1300);await page.screenshot({path:path.join(output,`${width}-${language}-night.png`)});await page.click('#mode');}
  }
 }passed.push('12 viewport/language combinations without overflow; every navigation route');
 await page.setViewportSize({width:1440,height:1000});if(await page.locator('html').getAttribute('lang')!=='en')await page.click('#language');
 await page.click('#search-open');await page.fill('#query','cover letter');assert(await page.locator('#results a').count()>0);await page.locator('#results a[data-search-service]').first().click();assert(await page.locator('#service-dialog').isVisible());assert((await page.locator('#service-prices').innerText()).includes('39.90'));await page.keyboard.press('Escape');
 await page.click('#search-open');await page.fill('#query','zzzz-no-match');assert.equal(await page.locator('#results a').count(),0);await page.fill('#query','شعار');assert(await page.locator('#results a').count()>0);await page.keyboard.press('Escape');passed.push('English/Arabic search, empty search results, service details');
 await page.locator('[data-filter="guides"]').click();assert.equal(await page.locator('#product-cards .card').count(),3);await page.locator('[data-filter="prompts"]').click();assert.equal(await page.locator('#product-cards .card').count(),3);await page.locator('[data-enquire="custom"]').click();assert.equal(await page.locator('#interest').inputValue(),'custom');
 await page.fill('#message','A bilingual studio identity');await page.locator('#enquiry button').click();await page.waitForFunction(()=>document.querySelector('#form-status').textContent.length>0);assert((await page.locator('#form-status').innerText()).includes('No message has been sent'));assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('A bilingual studio identity'));passed.push('Product categories and real clipboard enquiry');
 await page.click('#bee-open');assert.equal(await page.locator('#bee-links a').count(),4);await page.locator('#bee-links a[href="#services"]').click();assert(!await page.locator('#bee-dialog').isVisible());passed.push('Bee guide navigation');
 await page.locator('.art').first().click();assert(await page.locator('#image-dialog').isVisible());assert(await page.locator('#expanded-image').evaluate(im=>im.complete&&im.naturalWidth>0));await page.keyboard.press('Escape');passed.push('Artwork enlargement');
 await page.evaluate(()=>scrollTo(0,0));await page.click('#mode');await page.click('#language');await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'ar');assert.equal(await page.locator('body').getAttribute('data-mode'),'night');assert(!await page.locator('#intro').isVisible());passed.push('Persistent language/mode; intro stays dismissed');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.body.classList.contains('motion-paused'));assert(await page.locator('body').evaluate(e=>e.classList.contains('motion-paused')));assert(await page.locator('#motion').isDisabled());await page.emulateMedia({reducedMotion:'no-preference'});await page.click('#motion');assert(await page.locator('body').evaluate(e=>e.classList.contains('motion-paused')));passed.push('Reduced motion and manual motion pause');
 assert.equal(await page.locator('audio,#sound').count(),0);assert.equal(await page.evaluate(()=>typeof window.bkbkAudio),'undefined');passed.push('No audio or sound control');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);passed.push('No JavaScript errors or missing resources');
 const fresh=await context.newPage();await fresh.goto(url);await fresh.evaluate(()=>sessionStorage.removeItem('bkbk-entered'));await fresh.reload();await fresh.click('#skip-intro');assert(!await fresh.locator('#intro').isVisible());passed.push('Skip intro');
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed,errors,failed,browser:await browser.version(),note:'Chromium responsive simulation; not physical iOS Safari testing.'},null,2));console.log(JSON.stringify({passed,errors,failed},null,2));await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
