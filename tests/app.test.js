const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
let server,browser,base;
const key='pilhalab-registros-v1';
before(async()=>{
  server=http.createServer((req,res)=>{
    const file=path.join(__dirname,'../data',req.url==='/'?'index.html':req.url.split('?')[0]);
    if(!file.startsWith(path.resolve(__dirname,'../data')+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}
      res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'text/plain');res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
});
after(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));});
async function open(options={}){
  const page=await browser.newPage({viewport:{width:375,height:812},...options});
  await page.goto(base);return page;
}
async function register(page,value){await page.locator('#measurementVoltage').fill(value);await page.locator('#measurementForm button').click();}
test('entrada atinge 100%, desaparece e reaparece ao atualizar',async()=>{
  const page=await open();
  assert.equal(await page.locator('#intro').evaluate(e=>getComputedStyle(e).visibility),'visible');
  await page.waitForFunction(()=>document.querySelector('#introPercent').textContent==='100%');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#intro')).visibility==='hidden');
  await page.reload();
  assert.equal(await page.locator('#intro').evaluate(e=>getComputedStyle(e).visibility),'visible');
  await page.close();
});
test('redução de movimento e falha do efeito nunca bloqueiam',async()=>{
  const page=await open({reducedMotion:'reduce'});
  assert.equal(await page.locator('#intro').evaluate(e=>getComputedStyle(e).display),'none');
  await register(page,'0,5');assert.equal(await page.locator('#historyCount').textContent(),'1');
  await page.close();
  const fallback=await browser.newPage();await fallback.route('**/intro.js',route=>route.abort());await fallback.goto(base);
  await fallback.waitForTimeout(3500);
  assert.equal(await fallback.locator('#intro').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await register(fallback,'0,4');assert.equal(await fallback.locator('#historyCount').textContent(),'1');await fallback.close();
});
test('registra, compara, explora gráfico, calcula, exporta e mantém após recarregar',async()=>{
  const page=await open({reducedMotion:'reduce'});const errors=[];const sensorRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))sensorRequests.push(r.url());});
  await register(page,'-1');assert.equal(await page.locator('#historyCount').textContent(),'0');
  await register(page,'0,60');await register(page,'0.75');
  assert.equal(await page.locator('#compareDiff').textContent(),'0,150 V');
  await page.locator('#graphCursor').fill('0');assert.match(await page.locator('#graphDetail').textContent(),/0,600 V/);
  await page.locator('#cellVoltage').fill('0,60');await page.locator('#cellQuantity').fill('3');await page.locator('#cellForm button').click();
  assert.equal(await page.locator('#totalVoltage').textContent(),'1,80');
  await page.locator('#saveManual').click();
  assert.equal(await page.locator('#sampleCount').textContent(),'2 pontos');
  assert.equal(await page.locator('#historyCount').textContent(),'3');
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  const downloadEvent=page.waitForEvent('download');await page.locator('#exportCsv').click();
  const download=await downloadEvent;const csv=fs.readFileSync(await download.path(),'utf8');
  assert.match(csv,/MULTÍMETRO · DIGITADO/);assert.match(csv,/CÁLCULO TEÓRICO/);assert.match(csv,/0.6000/);
  await page.reload();assert.equal(await page.locator('#sampleCount').textContent(),'2 pontos');
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),saved);
  page.once('dialog',d=>d.dismiss());await page.locator('#clearHistory').click();assert.equal(await page.locator('#historyCount').textContent(),'3');
  page.once('dialog',d=>d.accept());await page.locator('#clearHistory').click();await page.reload();
  assert.equal(await page.locator('#historyCount').textContent(),'0');assert.equal(await page.locator('#sampleCount').textContent(),'0 pontos');
  assert.deepEqual(errors,[]);assert.deepEqual(sensorRequests,[]);await page.close();
});
test('preserva todos os registros antigos sem misturá-los com novas medições',async()=>{
  const page=await open({reducedMotion:'reduce'});
  const legacy=Array.from({length:180},(_,i)=>({type:['manual','real','demo'][i%3],value:i/100,detail:'registro original',at:'2026-10-19T10:00:00.000Z',extra:i}));
  await page.evaluate(({key,legacy})=>localStorage.setItem(key,JSON.stringify(legacy)),{key,legacy});await page.reload();
  assert.equal(await page.locator('#historyCount').textContent(),'180');assert.equal(await page.locator('#sampleCount').textContent(),'0 pontos');
  await register(page,'0');
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.deepEqual(saved.slice(1),legacy);assert.equal(saved[0].value,0);
  assert.equal(await page.locator('#historyList .history-row').count(),181);await page.close();
});
test('armazenamento indisponível e JSON inválido não causam perda silenciosa',async()=>{
  const page=await open({reducedMotion:'reduce'});
  await page.evaluate(k=>localStorage.setItem(k,'invalid original data'),key);await page.reload();
  await register(page,'0,6');assert.match(await page.locator('#storageStatus').textContent(),/Não foi possível salvar/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'invalid original data');await page.close();
  const blocked=await browser.newPage({reducedMotion:'reduce'});
  await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('QuotaExceededError');};});
  await blocked.goto(base);await register(blocked,'0,5');assert.match(await blocked.locator('#storageStatus').textContent(),/Não foi possível salvar/);
  assert.equal(await blocked.locator('#historyCount').textContent(),'1');await blocked.close();
});
test('layout cabe em celular e desktop, sem zoom por campos pequenos',async()=>{
  const page=await open({reducedMotion:'reduce'});
  for(const width of [320,375,390,768,1440]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow em ${width}px`);
  }
  assert.ok(await page.locator('#cellVoltage').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16));
  await page.close();
});
test('história acompanha seis capítulos nos dois sentidos, em desktop e celular',async()=>{
 const page=await open();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,375]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/historia.html');
  for(const i of [1,2,3,4,5,6,5,4,3,2,1]){
   await page.evaluate(i=>{const el=document.getElementById('capitulo-'+i);window.scrollTo({top:scrollY+el.getBoundingClientRect().top-(innerWidth<=700?300:350),behavior:'instant'});},i);
   await page.waitForFunction(i=>document.getElementById('storyPhone').dataset.chapter===String(i),i);
   assert.equal(await page.locator('#chapterCounter').textContent(),String(i).padStart(2,'0')+' / 06');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 assert.deepEqual(errors,[]);await page.close();
});
test('páginas, nomes, PDF e redução de movimento funcionam sem depender de sensores',async()=>{
 const page=await open({reducedMotion:'reduce'});
 for(const file of ['historia.html','relatorio.html','equipe.html']){
  await page.goto(base+'/'+file);
  for(const width of [320,375,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,file+' '+width);
  }
  assert.equal(await page.locator('.editorial-nav nav a').count(),4);
 }
 const names=['Davi Guimaraes','Ana Luiza Renar','Bernardo Vilela','Davi Favalessa','Maria Fernanda'];
 for(const name of names)assert.match(await page.locator('main').textContent(),new RegExp(name));
 await page.goto(base+'/relatorio.html');assert.equal(await page.locator('.report-section').count(),8);
 assert.match(await page.locator('#relatorio-6').textContent(),/Não registramos a tensão/);
 const pdf=await page.request.get(base+'/documentos/relatorio-pilha-caseira.pdf');assert.equal(pdf.status(),200);assert.equal((await pdf.body()).subarray(0,4).toString(),'%PDF');
 await page.goto(base+'/historia.html');assert.equal(await page.locator('.energy-core').evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.locator('.editorial-nav a[href="index.html"]').first().click();await register(page,'0,5');assert.equal(await page.locator('#historyCount').textContent(),'1');
 await page.locator('.editorial-nav a[href="relatorio.html"]').click();await page.locator('.editorial-nav a[href="index.html"]').first().click();assert.equal(await page.locator('#historyCount').textContent(),'1');await page.close();
 const plain=await browser.newPage({javaScriptEnabled:false});await plain.goto(base+'/historia.html');assert.equal(await plain.locator('.story-chapter').count(),6);assert.equal(await plain.locator('#capitulo-6').isVisible(),true);await plain.close();
});
