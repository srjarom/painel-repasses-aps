/* =========================================================================
   PACOTE PARA O HUB — gera o .zip do painel e a nota da versão para a TI
   -------------------------------------------------------------------------
   Como usar (na pasta testes/):   npm run pacote
   Opções:  npm run pacote -- --desde 4.16.2   (lista as mudanças desde essa versão)
            npm run pacote -- --sem-teste      (pula o teste automático)

   O que faz, em ordem:
   1. Carimba o site/index.html (versão nos arquivos de código, carimbo nos dados).
   2. Roda o teste automático; se falhar, para (não gera pacote quebrado).
   3. Gera pacote/painel-repasses-aps-v<versão>.zip com o conteúdo de site/ (index.html na raiz).
      Se só os dados mudaram, o nome leva a data dos dados: ...-v<versão>-dados-<data>.zip
   4. Escreve pacote/NOTAS-<nome do zip>.txt — o texto para mandar junto: o que mudou desde o último
      pacote gerado, se é só dado ou também código, e o quadrimestre mais recente dos dados.
   5. Guarda em manutencao/ultimo-pacote.json o que foi gerado, para a próxima nota saber de onde partir.
      Esse arquivo vai para o GitHub (faça Commit e Push depois de gerar o pacote): assim, outro computador
      continua de onde este parou. A pasta pacote/ (os .zip e as notas) não vai para o GitHub.
   ========================================================================= */
const fs=require('fs'),path=require('path'),vm=require('vm'),{execFileSync}=require('child_process');
const {carimbar,SITE,RAIZ}=require('./carimbar.js');
const PACOTE=path.join(RAIZ,'pacote');
// anotação do último pacote gerado: fica dentro do projeto (vai para o GitHub), para valer em qualquer computador
const REGISTRO=path.join(RAIZ,'manutencao','ultimo-pacote.json');
const args=process.argv.slice(2);
const opcao=n=>{const i=args.indexOf(n);return i>=0?(args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:true):null;};

const cmpVer=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)-(y[i]||0);}return 0;};
const dataBR=iso=>{const [y,m,d]=String(iso||'').split('-');return d?`${d}/${m}/${y}`:String(iso||'—');};

// lê o histórico de mudanças de site/js/versao.js (sem abrir navegador)
function lerChangelog(){
  const ctx={document:{getElementById:()=>null,addEventListener:()=>{},querySelector:()=>null},window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(SITE,'js','versao.js'),'utf8')+';__out={v:APP_VERSION,c:APP_CHANGELOG};',ctx);
  return ctx.__out;
}
// resumo dos dados publicados (site/dados/indice.js)
function lerIndice(){
  let ind={};
  const ctx={PainelDados:{registrarIndice:o=>{ind=o||{};}},window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(SITE,'dados','indice.js'),'utf8'),ctx);
  const ufs=Object.keys(ind).filter(k=>ind[k]&&ind[k].total!=null);
  const ult=ufs.map(k=>ind[k].ultimoQuad).filter(Boolean).sort().pop();
  const atual=ufs.map(k=>ind[k].atualizadoEm).filter(Boolean).sort().pop();
  return{ufs:ufs.length,ultimoQuad:ult,atualizadoEm:atual};
}

(function main(){
  if(!fs.existsSync(PACOTE))fs.mkdirSync(PACOTE);
  console.log('1/4 Carimbando o index.html…');
  const {ver,dados}=carimbar();

  if(!opcao('--sem-teste')){
    console.log('2/4 Rodando o teste automático (cerca de 1 minuto)…');
    try{execFileSync(process.execPath,['smoke.js'],{cwd:path.join(RAIZ,'testes'),stdio:'inherit'});}
    catch(e){console.error('\nO teste falhou — o pacote NÃO foi gerado. Corrija e rode de novo.');process.exit(1);}
  }else console.log('2/4 Teste pulado (--sem-teste).');

  const reg=fs.existsSync(REGISTRO)?JSON.parse(fs.readFileSync(REGISTRO,'utf8')):{versao:'2.4.0',dados:null};
  // gerar de novo o MESMO pacote (mesma versão e mesmos dados) refaz a mesma nota, em vez de dizer "nada mudou"
  const repeticao=reg.versao===ver&&reg.dados===dados&&reg.baseVersao!==undefined;
  const baseVersao=typeof opcao('--desde')==='string'?opcao('--desde'):(repeticao?reg.baseVersao:reg.versao);
  const baseDados=repeticao?reg.baseDados:reg.dados;
  const desde=baseVersao;
  const mudouCodigo=cmpVer(ver,desde)>0;
  const mudouDados=baseDados!==dados;
  const idx=lerIndice();
  const nome=`painel-repasses-aps-v${ver}`+(!mudouCodigo&&mudouDados&&idx.atualizadoEm?`-dados-${idx.atualizadoEm}`:'');
  const zip=path.join(PACOTE,nome+'.zip');

  console.log('3/4 Gerando o .zip…');
  if(fs.existsSync(zip))fs.unlinkSync(zip);
  // tar do Windows grava zip no formato padrão (caminhos com "/"), com o index.html na raiz
  execFileSync('tar',['-a','-c','-f',zip,...fs.readdirSync(SITE)],{cwd:SITE,stdio:'inherit'});
  const mb=(fs.statSync(zip).size/1048576).toFixed(1).replace('.',',');

  console.log('4/4 Escrevendo a nota da versão…');
  const {c}=lerChangelog();
  const itens=c.filter(e=>cmpVer(e.v,desde)>0&&cmpVer(e.v,ver)<=0);
  const tipo=mudouCodigo&&mudouDados?'código e dados':mudouCodigo?'só código (os dados são os mesmos do pacote anterior)':mudouDados?'só dados (o código é o mesmo do pacote anterior)':'nada mudou desde o último pacote gerado';
  const linhas=[
    `PAINEL DE REPASSES APS — PACOTE ${nome}`,
    `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    `Arquivo: ${nome}.zip (${mb} MB)`,
    `Substitui: versão ${desde}`,
    `O que mudou: ${tipo}`,
    `Dados: ${idx.ufs} estados · quadrimestre mais recente ${idx.ultimoQuad||'—'} · atualizados em ${dataBR(idx.atualizadoEm)}`,
    '',
    'Como publicar: substituir todo o conteúdo do painel pelo conteúdo do zip (o index.html fica na raiz).',
    'Os arquivos já vêm carimbados (?v= e ?d= no index.html), para o navegador baixar a versão nova.',
    ''
  ];
  if(itens.length){
    linhas.push(`Mudanças desde a versão ${desde}:`,'');
    itens.forEach(e=>linhas.push(`• ${e.v} — ${e.desc}`,''));
  }else if(mudouDados){
    linhas.push('Mudanças: atualização dos dados do SIAPS (sem mudança no código).','');
  }
  const notas=path.join(PACOTE,`NOTAS-${nome}.txt`);
  fs.writeFileSync(notas,'﻿'+linhas.join('\r\n'),'utf8');   // com BOM: Bloco de Notas e Outlook leem os acentos certo
  fs.writeFileSync(REGISTRO,JSON.stringify({versao:ver,dados,arquivo:nome+'.zip',geradoEm:new Date().toISOString().slice(0,10),baseVersao:desde,baseDados:baseDados===undefined?null:baseDados},null,2));

  console.log(`\nPronto!\n  Pacote: pacote/${nome}.zip (${mb} MB)\n  Nota:   pacote/NOTAS-${nome}.txt\n  O que mudou: ${tipo}\n\n  Pasta dos arquivos: ${PACOTE}\n  Depois, no GitHub Desktop: Commit e Push (guarda a anotação deste pacote para os outros computadores).\n`);
})();
