/* Teste rápido do painel (rodar antes de publicar):
     cd testes && npm install && npm test
   Abre site/index.html num Chrome sem janela, bloqueando qualquer acesso à internet
   (o painel não deve depender de nada externo), e confere:
   - nenhum erro no console;
   - tela do Brasil (27 estados no mapa e na lista), busca do topo e voltar do navegador;
   - painel de um estado (municípios, mapa, ranking);
   - abrir um município e gerar os 3 PDFs (relatório, resumo, Raio-X).
   Sai com código 1 se algo falhar (serve para CI). */
const path=require('path');
const {chromium}=require('playwright');
const URL='file://'+path.resolve(__dirname,'..','site','index.html')+'?uf=RS';
const falhas=[];
const ok=(cond,msg)=>{console.log((cond?'  ✓ ':'  ✗ ')+msg);if(!cond)falhas.push(msg);};

(async()=>{
  // os arquivos do painel são chamados com carimbo no endereço (?v=<versão> no código, ?d=<carimbo> nos
  // dados) para o navegador não misturar arquivos novos e guardados. Confere que o index.html está em dia.
  {
    const fs=require('fs');
    const C=require('../manutencao/ferramentas/carimbar.js');
    const html=fs.readFileSync(C.INDEX,'utf8');
    const ver=C.versaoDoPainel(),dados=C.carimboDosDados();
    console.log('Carimbos no index.html');
    const refs=[...html.matchAll(/(?:src|href)="(?:js|css)\/[^"]+"/g)].length;
    ok(refs>0&&C.carimbarTexto(html,ver,dados)===html,
      C.carimbarTexto(html,ver,dados)===html?`${refs} arquivos com ?v=${ver} e dados com ?d=${dados}`
        :'carimbo desatualizado — rode "npm run carimbar" (na pasta testes) e teste de novo');
  }
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  await ctx.route('**/*',r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  const page=await ctx.newPage();
  const erros=[];
  page.on('pageerror',e=>erros.push(e.message));
  page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});

  console.log('Tela do Brasil');
  await page.goto(URL.replace('?uf=RS',''));
  await page.waitForFunction(()=>document.querySelectorAll('#br-map path.has-data').length>0,null,{timeout:15000});
  const br=await page.evaluate(()=>({
    estados:document.querySelectorAll('#br-list .br-row').length,
    mapa:document.querySelectorAll('#br-map path.has-data').length,
    kpis:document.querySelectorAll('#br-kpis .kpi').length,
    resumo:!!document.querySelector('#br-headline .big'),
  }));
  ok(br.estados===27,`lista com ${br.estados} estados`);
  ok(br.mapa===27,`mapa do Brasil com ${br.mapa} estados`);
  ok(br.resumo&&br.kpis===2,'resumo do Brasil (cartão azul e dois quadros)');
  // busca do topo: "Alegrete" + Enter abre o município (e o estado dele)
  await page.click('#busca-br');
  await page.waitForFunction(()=>document.querySelectorAll('#busca-lista option').length>5000,null,{timeout:15000});
  await page.fill('#busca-br','Alegrete');await page.press('#busca-br','Enter');
  await page.waitForFunction(()=>document.getElementById('view-municipio').style.display!=='none',null,{timeout:15000});
  ok((await page.textContent('#muni-name'))==='Alegrete','busca abriu Alegrete');
  await page.goBack();await page.waitForTimeout(500);
  ok(await page.evaluate(()=>document.getElementById('view-brasil').style.display!=='none'),'voltar do navegador retornou ao Brasil');

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
