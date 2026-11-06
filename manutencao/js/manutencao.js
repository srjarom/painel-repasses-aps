/* =========================================================================
   FERRAMENTA DE MANUTENÇÃO DOS DADOS (manutencao/atualizar-dados.html)
   -------------------------------------------------------------------------
   Fluxo (v3.0.0 — todos os estados):
     1. ao abrir, carrega os dados publicados hoje de todos os estados que têm
        dados (site/dados/indice.js + site/dados/uf/<UF>.js) e os mapas de todos
        os estados (para reconhecer nomes e códigos IBGE) — esse é o "trabalho";
     2. os relatórios do SIAPS podem ser de um estado ou de vários: cada município
        vai para o seu estado pelo começo do código IBGE (43… = RS, 35… = SP…);
        quadrimestres novos entram/substituem, os antigos ficam;
     3. a lista de clientes (de um ou de vários estados) substitui a anterior;
     4. modalidades podem ser ajustadas município a município;
     5. o botão "Baixar" gera um arquivo por estado alterado + o índice
        (indice.js), que o responsável copia para site/dados/ e envia ao GitHub.
   Nada sai do computador: os arquivos são lidos e gerados no próprio navegador.
   ========================================================================= */
const PARAMS_PADRAO={eapMod:'30',esbMod:'II_comum',emultiMod:'complementar'};
const BASE_SITE='../site/';

// trabalho.ufs[UF] = lista de municípios (formato do painel); cópia editável dos publicados
let trabalho={ufs:{},clientes:null};
let publicado={indice:{},clientes:null};
let alterado={ufs:new Set(),clientes:false};
// nomes oficiais do IBGE (dos mapas), para todos os estados
const nomeIBGE=new Map();

const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural=(n,s,p)=>`${n.toLocaleString('pt-BR')} ${n===1?s:(p||s+'s')}`;
// o SIAPS manda os nomes em MAIÚSCULAS; quando o município está no mapa, usamos a grafia oficial do IBGE ("Água Santa")
const capitalizar=n=>String(n||'').toLowerCase().replace(/(^|\s|-)(\S)/g,(m,a,b)=>a+b.toUpperCase())
  .replace(/ (Da|De|Do|Das|Dos|E) /g,m=>m.toLowerCase());
const nomeOficial=(ib,nome)=>nomeIBGE.get(String(ib))||(nome===String(nome).toUpperCase()?capitalizar(nome):nome);
const ufsTrabalho=()=>Object.keys(trabalho.ufs).filter(uf=>trabalho.ufs[uf].length).sort();
const todosMunicipios=()=>ufsTrabalho().flatMap(uf=>trabalho.ufs[uf]);

function logMsg(alvo,tipo,html){
  const d=document.createElement('div');d.className=tipo;d.innerHTML=html;$(alvo).appendChild(d);
}
function limparLog(alvo){$(alvo).innerHTML='';}

function estratoPadrao(ib){return ESTRATO_IED[ib]!=null?String(ESTRATO_IED[ib]):'';}
function faixaQuads(lista){
  const ks=new Set();
  lista.forEach(m=>(m.parsed&&m.parsed.rows||[]).forEach(r=>ks.add(quadKey(r.quad))));
  const arr=[...ks].filter(Boolean).sort((a,b)=>a-b);
  return arr.length?{ks:arr,txt:arr.length===1?qShortKey(arr[0]):`${qShortKey(arr[0])} a ${qShortKey(arr[arr.length-1])}`}:{ks:[],txt:'—'};
}

/* ---------- carga inicial: mapas de todos os estados + dados publicados ---------- */
async function carregarTudo(){
  publicado.indice=JSON.parse(JSON.stringify(PainelDados.indice()));
  await Promise.all(ESTADOS.map(e=>PainelDados.carregarEstado(e.uf,BASE_SITE)));
  ESTADOS.forEach(e=>PainelDados.geo(e.uf).forEach(g=>nomeIBGE.set(String(g.id),g.name)));
  ESTADOS.forEach(e=>{
    if(PainelDados.uf(e.uf))trabalho.ufs[e.uf]=JSON.parse(JSON.stringify(PainelDados.municipios(e.uf)));
  });
  publicado.clientes=PainelDados.clientes();
  trabalho.clientes=publicado.clientes?JSON.parse(JSON.stringify(publicado.clientes)):null;
}

/* ---------- quadro "Dados publicados hoje" ---------- */
function renderPublicado(){
  const ks=Object.keys(publicado.indice).sort();
  const c=publicado.clientes;
  if(!ks.length){
    $('mt-publicado').innerHTML=`<div><b>Nenhum</b><span>Ainda não há dados publicados (site/dados/uf/). Comece pelo passo 1.</span></div>`;
    return;
  }
  const tot=ks.reduce((s,uf)=>s+(publicado.indice[uf].municipios||0),0);
  $('mt-publicado').innerHTML=
    `<div><b>${ks.length}</b><span>${ks.length===1?'estado':'estados'}: ${ks.join(', ')}</span></div>`+
    `<div><b>${tot.toLocaleString('pt-BR')}</b><span>municípios no total</span></div>`+
    `<div><b>${c?c.lista.length:0}</b><span>clientes na lista${c&&c.importadoEm?' (de '+esc(c.importadoEm.slice(0,10))+')':''}</span></div>`;
  $('mt-publicado-tab').innerHTML=tabelaEstados(ks.map(uf=>({uf,n:publicado.indice[uf].municipios,ult:publicado.indice[uf].ultimoQuad,dt:publicado.indice[uf].atualizadoEm})));
}
function tabelaEstados(linhas){
  if(!linhas.length)return'';
  return`<table class="mt-tab"><thead><tr><th>Estado</th><th>Municípios</th><th>Quadrimestre mais recente</th><th>${linhas[0].dt!=null?'Gerado em':'Situação'}</th></tr></thead><tbody>`+
    linhas.map(l=>`<tr><td><b>${esc(l.uf)}</b> · ${esc(estadoInfo(l.uf).nome)}</td><td>${(l.n||0).toLocaleString('pt-BR')}</td><td>${esc(l.ult?qShort(l.ult):'—')}</td><td>${l.dt!=null?esc(l.dt):l.sit}</td></tr>`).join('')+
    '</tbody></table>';
}

/* ---------- passo 1: relatórios do SIAPS ---------- */
function lerXlsx(file){
  return new Promise((ok,er)=>{
    const rd=new FileReader();
    rd.onload=e=>{try{ok(XLSX.read(new Uint8Array(e.target.result),{type:'array'}));}catch(x){er(new Error(`"${file.name}": não consegui abrir como planilha (${x.message}).`));}};
    rd.onerror=()=>er(new Error(`"${file.name}": erro ao ler o arquivo.`));
    rd.readAsArrayBuffer(file);
  });
}

async function importarSiaps(files){
  limparLog('log-siaps');
  for(const f of files){
    logMsg('log-siaps','wa',`Lendo "${esc(f.name)}"… (arquivos com vários estados podem levar alguns segundos)`);
    const aviso=$('log-siaps').lastChild;
    await new Promise(r=>setTimeout(r,30));
    let lote;
    try{lote=parseLoteWorkbook(await lerXlsx(f),f.name);}
    catch(x){aviso.remove();logMsg('log-siaps','er','✕ '+esc(x.message));continue;}
    aviso.remove();
    const porUF={},semUF=[];
    lote.por.forEach((d,ib)=>{const uf=ufDoIbge(ib);if(!uf){semUF.push(ib);return;}(porUF[uf]=porUF[uf]||[]).push([ib,d]);});
    const resumo=[];
    Object.keys(porUF).sort().forEach(uf=>{
      const lista=trabalho.ufs[uf]=trabalho.ufs[uf]||[];
      const porId=new Map(lista.map((m,i)=>[String(m.id),i]));
      let novos=0,atual=0;
      porUF[uf].forEach(([ib,d])=>{
        let i=porId.get(ib);
        if(i==null){
          if(lote.tipo!=='main')return; // município só entra pelo relatório principal (que traz os valores)
          const nome=nomeOficial(ib,d.nome);
          lista.push({id:ib,ibge:ib,nomeMuni:nome,uf,
            params:{estrato:estratoPadrao(ib),...PARAMS_PADRAO},parsed:{nomeMuni:nome,uf,ibge:ib,rows:[]},indicadores:null});
          i=lista.length-1;porId.set(ib,i);novos++;
        }else atual++;
        const m=lista[i];
        m.nomeMuni=nomeOficial(ib,m.nomeMuni||d.nome);
        if(lote.tipo==='main')m.parsed={nomeMuni:m.nomeMuni,uf,ibge:ib,rows:mesclarPorQuad(m.parsed&&m.parsed.rows,d.rows)};
        else m.indicadores={nomeMuni:m.nomeMuni,uf,ibge:ib,rows:mesclarPorQuad(m.indicadores&&m.indicadores.rows,d.rows)};
      });
      if(novos||atual){alterado.ufs.add(uf);resumo.push(`${uf} (${atual+novos}${novos?', '+novos+' novos':''})`);}
      const geoIds=new Set(PainelDados.geo(uf).map(g=>String(g.id)));
      const fora=lote.tipo==='main'?porUF[uf].filter(([ib])=>!geoIds.has(ib)):[];
      if(fora.length)logMsg('log-siaps','wa',`⚠ ${uf}: fora do mapa (o contorno não existe na base do mapa): ${fora.map(([ib,d])=>esc(nomeOficial(ib,d.nome))+' ('+ib+')').join(', ')}. ${fora.length===1?'Entra':'Entram'} nos dados, no ranking e nos relatórios, mas não ${fora.length===1?'aparece':'aparecem'} no mapa.`);
    });
    const nomeRel=lote.tipo==='main'?'Vínculo e Acompanhamento Territorial e Qualidade':'Qualidade – Conceito obtido por indicador';
    const qs=lote.quads.map(qShort).join(', ');
    logMsg('log-siaps','ok',`✓ <b>${esc(nomeRel)}</b> ("${esc(f.name)}"): ${plural(lote.por.size,'município')}, quadrimestres ${esc(qs)}. `+
      `${plural(resumo.length,'estado')}: ${esc(resumo.join(' · '))}.`);
    if(semUF.length)logMsg('log-siaps','wa',`⚠ ${plural(semUF.length,'código IBGE')} sem estado reconhecido (ignorados): ${semUF.slice(0,10).map(esc).join(', ')}.`);
  }
  atualizarTudo();
}

/* ---------- passo 2: lista de clientes ---------- */
async function importarClientes(file){
  limparLog('log-clientes');
  try{
    const c=parseClientesWorkbook(await lerXlsx(file),file.name);
    trabalho.clientes=c;alterado.clientes=true;
    const porUF={};c.lista.forEach(x=>{const uf=ufDoIbge(x.ibge);porUF[uf]=(porUF[uf]||0)+1;});
    logMsg('log-clientes','ok',`✓ ${plural(c.lista.length,'cliente identificado','clientes identificados')} a partir de "${esc(file.name)}": ${Object.keys(porUF).sort().map(uf=>uf+' '+porUF[uf]).join(' · ')}.`);
    if(c.naoIdentificados.length)
      logMsg('log-clientes','wa',`⚠ ${plural(c.naoIdentificados.length,'nome não reconhecido','nomes não reconhecidos')} como município (ficaram de fora): ${c.naoIdentificados.map(esc).join(', ')}. Se algum for município, confira a grafia na planilha${c.semColunaUF?' — e, como a planilha não tem coluna de UF, nomes que existem em mais de um estado (ex.: "Bom Jesus") não têm como ser identificados: inclua uma coluna "UF"':''}.`);
  }catch(x){logMsg('log-clientes','er','✕ '+esc(x.message));}
  atualizarTudo();
}

/* ---------- passo 3: modalidades ---------- */
const rotuloMuni=m=>`${m.nomeMuni} (${m.uf})`;
function preencherListaMunicipios(){
  $('pm-lista').innerHTML=todosMunicipios().sort((a,b)=>a.nomeMuni.localeCompare(b.nomeMuni,'pt-BR'))
    .map(m=>`<option value="${esc(rotuloMuni(m))}"></option>`).join('');
}
function municipioPeloNome(txt){
  const mt=String(txt||'').match(/^(.*)\(([A-Za-z]{2})\)\s*$/);
  const n=normNomeCliente(mt?mt[1]:txt),uf=mt?mt[2].toUpperCase():'';
  const achados=todosMunicipios().filter(m=>normNomeCliente(m.nomeMuni)===n&&(!uf||m.uf===uf));
  return achados.length===1?achados[0]:null;
}
function carregarParams(){
  const m=municipioPeloNome($('pm-busca').value);
  $('pm-aplicar').classList.toggle('disabled',!m);
  if(!m)return;
  $('pm-estrato').value=m.params.estrato||'';
  $('pm-eap').value=m.params.eapMod||'30';
  $('pm-esb').value=m.params.esbMod||'II_comum';
  $('pm-emulti').value=m.params.emultiMod||'complementar';
  $('pm-ecr').value=m.params.ecrMod||PARAMS_PADRAO_MUNI.ecrMod;
  $('pm-eapp').value=m.params.eappMod||PARAMS_PADRAO_MUNI.eappMod;
}
function aplicarParams(){
  const m=municipioPeloNome($('pm-busca').value);
  if(!m)return;
  m.params={estrato:$('pm-estrato').value,eapMod:$('pm-eap').value,esbMod:$('pm-esb').value,emultiMod:$('pm-emulti').value,
    ecrMod:$('pm-ecr').value,eappMod:$('pm-eapp').value};
  alterado.ufs.add(m.uf);
  limparLog('log-params');
  logMsg('log-params','ok',`✓ Modalidades de <b>${esc(rotuloMuni(m))}</b> atualizadas.`);
  atualizarTudo();
}

// backup antigo da carteira (versão 1.x do painel, que guardava tudo no navegador)
function importarBackup(file){
  limparLog('log-params');
  const rd=new FileReader();
  rd.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data||!Array.isArray(data.municipios))throw new Error('o arquivo não é um backup da carteira.');
      let par=0,hist=0,novos=0,semUF=0;
      data.municipios.forEach(b=>{
        if(!b||!b.id)return;
        const ib=String(b.id),uf=ufDoIbge(ib);
        if(!uf){semUF++;return;}
        const lista=trabalho.ufs[uf]=trabalho.ufs[uf]||[];
        let m=lista.find(x=>String(x.id)===ib);
        if(!m){
          if(!b.parsed||!b.parsed.rows)return;
          m={id:ib,ibge:ib,nomeMuni:nomeOficial(ib,b.nomeMuni||ib),uf,params:{estrato:estratoPadrao(ib),...PARAMS_PADRAO},
             parsed:{nomeMuni:b.nomeMuni,uf,ibge:ib,rows:[]},indicadores:null};
          lista.push(m);novos++;
        }
        if(b.params){
          const p={estrato:String(b.params.estrato||m.params.estrato||''),eapMod:b.params.eapMod||m.params.eapMod,
                   esbMod:b.params.esbMod||m.params.esbMod,emultiMod:b.params.emultiMod||m.params.emultiMod};
          if(JSON.stringify(p)!==JSON.stringify(m.params)){m.params=p;par++;}
        }
        // quadrimestres antigos do backup que não estão nos dados de trabalho (os dados novos têm prioridade)
        const antes=(m.parsed.rows||[]).length+((m.indicadores&&m.indicadores.rows)||[]).length;
        if(b.parsed&&b.parsed.rows)m.parsed.rows=mesclarPorQuad(b.parsed.rows,m.parsed.rows||[]);
        if(b.indicadores&&b.indicadores.rows)
          m.indicadores={nomeMuni:m.nomeMuni,uf,ibge:ib,rows:mesclarPorQuad(b.indicadores.rows,(m.indicadores&&m.indicadores.rows)||[])};
        const depois=m.parsed.rows.length+((m.indicadores&&m.indicadores.rows)||[]).length;
        if(depois>antes)hist++;
        alterado.ufs.add(uf);
      });
      logMsg('log-params','ok',`✓ Backup lido: modalidades ajustadas em ${plural(par,'município')}, histórico ampliado em ${plural(hist,'município')}${novos?', '+plural(novos,'município novo','municípios novos'):''}.`);
      if(semUF)logMsg('log-params','wa',`⚠ ${plural(semUF,'município')} com código IBGE não reconhecido ${semUF===1?'foi ignorado':'foram ignorados'}.`);
      if(!trabalho.clientes&&data.clientes&&Array.isArray(data.clientes.lista)){
        trabalho.clientes=data.clientes;alterado.clientes=true;
        logMsg('log-params','ok',`✓ A lista de clientes do backup (${data.clientes.lista.length}) também foi trazida.`);
      }
    }catch(x){logMsg('log-params','er','✕ Não foi possível ler o backup: '+esc(x.message));}
    atualizarTudo();
  };
  rd.readAsText(file);
}

/* ---------- passo 4: conferência ---------- */
function renderResumo(){
  const ufs=ufsTrabalho();
  const ms=todosMunicipios();
  const comInd=ms.filter(m=>m.indicadores&&m.indicadores.rows.length).length;
  const nCli=trabalho.clientes?trabalho.clientes.lista.length:0;

  $('mt-resumo').innerHTML=
    `<div><b>${ufs.length}</b><span>${ufs.length===1?'estado':'estados'} com dados</span></div>`+
    `<div><b>${ms.length.toLocaleString('pt-BR')}</b><span>municípios no total</span></div>`+
    `<div><b>${comInd.toLocaleString('pt-BR')}</b><span>com relatório por indicador (Raio-X)</span></div>`+
    `<div><b>${nCli}</b><span>clientes na lista</span></div>`;
  $('mt-resumo-tab').innerHTML=tabelaEstados(ufs.map(uf=>{
    const f=faixaQuads(trabalho.ufs[uf]);
    return{uf,n:trabalho.ufs[uf].length,ult:f.ks.length?qCodeKey(f.ks[f.ks.length-1]):'',
      sit:alterado.ufs.has(uf)?'<span class="mt-tag-alt">alterado — baixar</span>':'sem mudanças'};
  }));

  limparLog('mt-avisos');
  if(!ms.length){logMsg('mt-avisos','wa','⚠ Ainda não há municípios. Importe os relatórios do SIAPS no passo 1.');}
  else{
    let tudoCerto=true;
    ufs.filter(uf=>alterado.ufs.has(uf)).forEach(uf=>{
      const lista=trabalho.ufs[uf];
      const f=faixaQuads(lista),ultimo=f.ks[f.ks.length-1];
      const semUltimo=ultimo?lista.filter(m=>!(m.parsed.rows||[]).some(r=>quadKey(r.quad)===ultimo)):[];
      const semEstrato=lista.filter(m=>!m.params.estrato);
      const presentes=new Set(lista.map(m=>String(m.id)));
      const foraDosDados=PainelDados.geo(uf).filter(g=>!presentes.has(String(g.id)));
      if(semUltimo.length){tudoCerto=false;logMsg('mt-avisos','wa',`⚠ ${uf}: ${plural(semUltimo.length,'município')} sem dados no quadrimestre mais recente (${qShortKey(ultimo)}): ${semUltimo.slice(0,12).map(m=>esc(m.nomeMuni)).join(', ')}${semUltimo.length>12?'…':''}. No painel, eles aparecem com o último dado que tiverem.`);}
      if(semEstrato.length){tudoCerto=false;logMsg('mt-avisos','wa',`⚠ ${uf}: ${plural(semEstrato.length,'município')} sem estrato IED (o componente fixo fica zerado): ${semEstrato.slice(0,12).map(m=>esc(m.nomeMuni)).join(', ')}. Ajuste no passo 3.`);}
      if(foraDosDados.length)logMsg('mt-avisos','wa',`⚠ ${uf}: ${plural(foraDosDados.length,'município')} do mapa sem dados: ${foraDosDados.slice(0,12).map(g=>esc(g.name)).join(', ')}${foraDosDados.length>12?'…':''}.`);
    });
    if(!trabalho.clientes)logMsg('mt-avisos','wa','⚠ Sem lista de clientes: o filtro "só clientes" não vai aparecer no painel.');
    if(alterado.ufs.size&&tudoCerto)logMsg('mt-avisos','ok','✓ Nos estados alterados, todos os municípios têm o quadrimestre mais recente e estrato IED definido.');
  }
  const pend=[...alterado.ufs].sort().map(uf=>`<b>${uf}.js</b>`);
  if(alterado.ufs.size)pend.push('<b>indice.js</b>');
  if(alterado.clientes)pend.push('<b>clientes.js</b>');
  if(pend.length)logMsg('mt-avisos','wa',`Alterações ainda não baixadas: ${pend.join(', ')}. Clique em "Baixar" abaixo.`);

  $('btn-baixar-uf').classList.toggle('disabled',!alterado.ufs.size);
  $('btn-baixar-uf').textContent=alterado.ufs.size
    ?`⤓ Baixar dados dos estados alterados (${[...alterado.ufs].sort().map(uf=>uf+'.js').join(', ')} + indice.js)`
    :'⤓ Baixar dados dos estados (nada alterado ainda)';
  $('btn-baixar-clientes').classList.toggle('disabled',!trabalho.clientes);
}

function baixarTexto(nome,texto){
  const blob=new Blob([texto],{type:'text/javascript;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=nome;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function gerarIndice(){
  const ind={};
  ufsTrabalho().forEach(uf=>{
    const d=alterado.ufs.has(uf)?PainelDados.codificarUF(uf,trabalho.ufs[uf]):PainelDados.uf(uf);
    ind[uf]=publicado.indice[uf]&&!alterado.ufs.has(uf)?publicado.indice[uf]:PainelDados.resumoIndice(d);
  });
  return ind;
}
async function baixarEstados(){
  const ufs=[...alterado.ufs].sort();
  for(const uf of ufs){
    baixarTexto(uf+'.js',PainelDados.textoArquivoUF(PainelDados.codificarUF(uf,trabalho.ufs[uf])));
    await new Promise(r=>setTimeout(r,350)); // o navegador baixa um arquivo por vez
  }
  baixarTexto('indice.js',PainelDados.textoArquivoIndice(gerarIndice()));
  alterado.ufs.clear();
  renderResumo();
}
function gerarArquivoClientes(){
  const c=trabalho.clientes;
  return PainelDados.textoArquivoClientes({rotulo:c.rotulo||'GOVBR Saúde / Celk',fonte:'Planilha comercial de clientes',importadoEm:c.importadoEm||'',
    naoIdentificados:c.naoIdentificados||[],lista:c.lista.map(x=>({ibge:String(x.ibge),cliente:x.cliente}))});
}

function atualizarTudo(){preencherListaMunicipios();carregarParams();renderResumo();}

/* ---------- ligações ---------- */
$('in-siaps').addEventListener('change',e=>{if(e.target.files.length)importarSiaps([...e.target.files]);e.target.value='';});
$('in-clientes').addEventListener('change',e=>{if(e.target.files[0])importarClientes(e.target.files[0]);e.target.value='';});
$('in-backup').addEventListener('change',e=>{if(e.target.files[0])importarBackup(e.target.files[0]);e.target.value='';});
$('pm-busca').addEventListener('input',carregarParams);
$('pm-aplicar').addEventListener('click',aplicarParams);
$('btn-baixar-uf').addEventListener('click',()=>{if(alterado.ufs.size)baixarEstados();});
$('btn-baixar-clientes').addEventListener('click',()=>{if(trabalho.clientes){baixarTexto('clientes.js',gerarArquivoClientes());alterado.clientes=false;renderResumo();}});
window.addEventListener('beforeunload',e=>{if(alterado.ufs.size||alterado.clientes){e.preventDefault();e.returnValue='';}});

(async()=>{
  $('mt-publicado').innerHTML='<div><b>…</b><span>Carregando os dados publicados e os mapas dos estados…</span></div>';
  await carregarTudo();
  renderPublicado();
  atualizarTudo();
})();
