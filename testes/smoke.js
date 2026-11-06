/* Teste rápido do painel (rodar antes de publicar):
     cd testes && npm install && npm test
   Abre site/index.html num Chrome sem janela, bloqueando qualquer acesso à internet
   (o painel não deve depender de nada externo), e confere:
   - nenhum erro no console;
   - dados carregados (municípios, mapa, ranking);
   - abrir um município e gerar os 3 PDFs (relatório, resumo, Raio-X).
   Sai com código 1 se algo falhar (serve para CI). */
const path=require('path');
const {chromium}=require('playwright');
const URL='file://'+path.resolve(__dirname,'..','site','index.html')+'?uf=RS';
const falhas=[];
const ok=(cond,msg)=>{console.log((cond?'  ✓ ':'  ✗ ')+msg);if(!cond)falhas.push(msg);};

(async()=>{
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  await ctx.route('**/*',r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  const page=await ctx.newPage();
  const erros=[];
  page.on('pageerror',e=>erros.push(e.message));
  page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});

  console.log('Painel do estado');
  await page.goto(URL);await page.waitForFunction(()=>typeof carteira!=='undefined'&&carteira.municipios.length>0,null,{timeout:15000});await page.waitForTimeout(500);
  const info=await page.evaluate(()=>({
    n:carteira.municipios.length,
    mapa:document.querySelectorAll('#rsmap-svg-wrap path').length,
    ranking:document.querySelectorAll('#carteira-table tbody tr').length,
    versao:typeof APP_VERSION!=='undefined'?APP_VERSION:null,
  }));
  ok(info.n>0,`${info.n} municípios carregados`);
  ok(info.mapa>0,`mapa com ${info.mapa} municípios`);
  ok(info.ranking>0,'ranking preenchido');
  console.log('  versão',info.versao);

  console.log('Tela do município');
  const id=await page.evaluate(()=>{
    const m=carteira.municipios.find(x=>x.indicadores)||carteira.municipios[0];
    openFromCarteira(m.id);return m.id;
  });
  await page.waitForTimeout(800);
  const nome=await page.textContent('#muni-name');
  ok(nome&&nome!=='—',`abriu ${nome} (${id})`);
  for(const [fn,rot] of [['generatePDF()','relatório do quadrimestre'],['generatePDFResumo()','resumo p/ secretário'],['generatePDFRaioX()','Raio-X']]){
    try{
      const [d]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.evaluate(fn)]);
      ok(true,`PDF ${rot}: ${d.suggestedFilename()}`);
    }catch(e){ok(false,`PDF ${rot} não foi gerado (${e.message.split('\n')[0]})`);}
  }
  ok(erros.length===0,erros.length?`erros no console: ${erros.join(' | ')}`:'nenhum erro no console');
  await browser.close();
  console.log(falhas.length?`\nFALHOU (${falhas.length})`:'\nTudo certo.');
  process.exit(falhas.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
