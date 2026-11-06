/* =========================================================================
   FERRAMENTA DE MANUTENÇÃO DOS DADOS (manutencao/atualizar-dados.html)
   -------------------------------------------------------------------------
   Fluxo:
     1. começa com uma cópia dos dados publicados hoje (site/dados/uf/RS.js e
        site/dados/clientes.js) — o "trabalho";
     2. os relatórios do SIAPS são mesclados nesse trabalho (quadrimestres novos
        entram/substituem, os antigos ficam);
     3. a lista de clientes substitui a anterior;
     4. modalidades podem ser ajustadas município a município;
     5. os botões "Baixar" geram os novos arquivos, que o responsável copia para
        site/dados/ e envia ao GitHub.
   Nada sai do computador: os arquivos são lidos e gerados no próprio navegador.
   ========================================================================= */
const PARAMS_PADRAO={eapMod:'30',esbMod:'II_comum',emultiMod:'complementar'};

// dados de trabalho (cópia editável dos publicados)
let trabalho={
  municipios:JSON.parse(JSON.stringify(PainelDados.municipios(UF_ATUAL))),
  clientes:PainelDados.clientes()?JSON.parse(JSON.stringify(PainelDados.clientes())):null,
};
const publicado={
  uf:PainelDados.uf(UF_ATUAL),
  clientes:PainelDados.clientes(),
};
let alterado={uf:false,clientes:false};

const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural=(n,s,p)=>`${n.toLocaleString('pt-BR')} ${n===1?s:(p||s+'s')}`;
const ibgesDaUF=new Set(PainelDados.geo(UF_ATUAL).map(g=>String(g.id)));
// o SIAPS manda os nomes em MAIÚSCULAS; quando o município está no mapa, usamos a grafia oficial do IBGE ("Água Santa")
const nomeIBGE=new Map(PainelDados.geo(UF_ATUAL).map(g=>[String(g.id),g.name]));
const capitalizar=n=>String(n||'').toLowerCase().replace(/(^|\s|-)(\S)/g,(m,a,b)=>a+b.toUpperCase())
  .replace(/ (Da|De|Do|Das|Dos|E) /g,m=>m.toLowerCase());
const nomeOficial=(ib,nome)=>nomeIBGE.get(String(ib))||(nome===String(nome).toUpperCase()?capitalizar(nome):nome);

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

/* ---------- quadro "Dados publicados hoje" ---------- */
function renderPublicado(){
  const p=publicado.uf;
  if(!p){
    $('mt-publicado').innerHTML=`<div><b>Nenhum</b><span>Ainda não há dados de ${UF_ATUAL} publicados (site/dados/uf/${UF_ATUAL}.js). Comece pelo passo 1.</span></div>`;
    return;
  }
  const f=faixaQuads(PainelDados.municipios(UF_ATUAL));
  const c=publicado.clientes;
  $('mt-publicado').innerHTML=
    `<div><b>${p.municipios.length.toLocaleString('pt-BR')}</b><span>municípios de ${UF_ATUAL}</span></div>`+
    `<div><b>${f.txt}</b><span>quadrimestres</span></div>`+
    `<div><b>${esc(p.atualizadoEm||'—')}</b><span>gerado em</span></div>`+
    `<div><b>${c?c.lista.length:0}</b><span>clientes na lista${c&&c.importadoEm?' (de '+esc(c.importadoEm.slice(0,10))+')':''}</span></div>`;
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
    let lote;
    try{lote=parseLoteWorkbook(await lerXlsx(f),f.name);}
    catch(x){logMsg('log-siaps','er','✕ '+esc(x.message));continue;}
    // confere se o arquivo é mesmo do estado em manutenção (pelos códigos IBGE)
    const ibs=[...lote.por.keys()];
    const daUF=ibs.filter(ib=>ibgesDaUF.has(ib)).length;
    if(ibgesDaUF.size&&daUF<ibs.length*0.5){
      logMsg('log-siaps','er',`✕ "${esc(f.name)}": os municípios desse arquivo não são de ${UF_ATUAL}${lote.uf?' (UF no arquivo: '+esc(lote.uf)+')':''}. Nada foi importado.`);
      continue;
    }
    let novos=0,atual=0;
    const porId=new Map(trabalho.municipios.map((m,i)=>[String(m.id),i]));
    lote.por.forEach((d,ib)=>{
      let i=porId.get(ib);
      if(i==null){
        if(lote.tipo!=='main')return; // município só entra pelo relatório principal (que traz os valores)
        const nome=nomeOficial(ib,d.nome);
        trabalho.municipios.push({id:ib,ibge:ib,nomeMuni:nome,uf:UF_ATUAL,
          params:{estrato:estratoPadrao(ib),...PARAMS_PADRAO},parsed:{nomeMuni:nome,uf:UF_ATUAL,ibge:ib,rows:[]},indicadores:null});
        i=trabalho.municipios.length-1;porId.set(ib,i);novos++;
      }else atual++;
      const m=trabalho.municipios[i];
      m.nomeMuni=nomeOficial(ib,m.nomeMuni||d.nome);
      if(lote.tipo==='main'){
        m.parsed={nomeMuni:m.nomeMuni,uf:UF_ATUAL,ibge:ib,rows:mesclarPorQuad(m.parsed&&m.parsed.rows,d.rows)};
      }else{
        m.indicadores={nomeMuni:m.nomeMuni,uf:UF_ATUAL,ibge:ib,rows:mesclarPorQuad(m.indicadores&&m.indicadores.rows,d.rows)};
      }
    });
    alterado.uf=true;
    const nomeRel=lote.tipo==='main'?'Vínculo e Acompanhamento Territorial e Qualidade':'Qualidade – Conceito obtido por indicador';
    const qs=lote.quads.map(qShort).join(', ');
    logMsg('log-siaps','ok',`✓ <b>${esc(nomeRel)}</b> ("${esc(f.name)}"): ${plural(lote.por.size,'município')}, quadrimestres ${esc(qs)}. `+
      `${plural(atual,'atualizado')}${novos?', '+plural(novos,'novo'):''}.`);
    const fora=ibs.filter(ib=>!ibgesDaUF.has(ib));
    if(fora.length&&lote.tipo==='main')logMsg('log-siaps','wa',`⚠ Fora do mapa de ${UF_ATUAL} (o contorno não existe na base do mapa): ${fora.map(ib=>esc(nomeOficial(ib,lote.por.get(ib).nome))+' ('+ib+')').join(', ')}. ${fora.length===1?'Entra':'Entram'} nos dados, no ranking e nos relatórios, mas não ${fora.length===1?'aparece':'aparecem'} no mapa.`);
  }
  atualizarTudo();
}

/* ---------- passo 2: lista de clientes ---------- */
async function importarClientes(file){
  limparLog('log-clientes');
  try{
    const c=parseClientesWorkbook(await lerXlsx(file),file.name);
    trabalho.clientes=c;alterado.clientes=true;
    logMsg('log-clientes','ok',`✓ ${plural(c.lista.length,'cliente identificado','clientes identificados')} em ${UF_ATUAL} a partir de "${esc(file.name)}".`);
    if(c.naoIdentificados.length)
      logMsg('log-clientes','wa',`⚠ ${plural(c.naoIdentificados.length,'nome não reconhecido','nomes não reconhecidos')} como município de ${UF_ATUAL} (ficaram de fora): ${c.naoIdentificados.map(esc).join(', ')}. Se algum for município, confira a grafia na planilha.`);
  }catch(x){logMsg('log-clientes','er','✕ '+esc(x.message));}
  atualizarTudo();
}

/* ---------- passo 3: modalidades ---------- */
function preencherListaMunicipios(){
  $('pm-lista').innerHTML=[...trabalho.municipios].sort((a,b)=>a.nomeMuni.localeCompare(b.nomeMuni,'pt-BR'))
    .map(m=>`<option value="${esc(m.nomeMuni)}"></option>`).join('');
}
function municipioPeloNome(nome){
  const n=normNomeCliente(nome);
  return trabalho.municipios.find(m=>normNomeCliente(m.nomeMuni)===n)||null;
}
function carregarParams(){
  const m=municipioPeloNome($('pm-busca').value);
  $('pm-aplicar').classList.toggle('disabled',!m);
  if(!m)return;
  $('pm-estrato').value=m.params.estrato||'';
  $('pm-eap').value=m.params.eapMod||'30';
  $('pm-esb').value=m.params.esbMod||'II_comum';
  $('pm-emulti').value=m.params.emultiMod||'complementar';
}
function aplicarParams(){
  const m=municipioPeloNome($('pm-busca').value);
  if(!m)return;
  m.params={estrato:$('pm-estrato').value,eapMod:$('pm-eap').value,esbMod:$('pm-esb').value,emultiMod:$('pm-emulti').value};
  alterado.uf=true;
  limparLog('log-params');
  logMsg('log-params','ok',`✓ Modalidades de <b>${esc(m.nomeMuni)}</b> atualizadas.`);
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
      let par=0,hist=0,novos=0,outrasUF=0;
      const porId=new Map(trabalho.municipios.map(m=>[String(m.id),m]));
      data.municipios.forEach(b=>{
        if(!b||!b.id)return;
        const ib=String(b.id);
        if(ibgesDaUF.size&&!ibgesDaUF.has(ib)&&String(b.uf||'').toUpperCase()!==UF_ATUAL){outrasUF++;return;}
        let m=porId.get(ib);
        if(!m){
          if(!b.parsed||!b.parsed.rows)return;
          m={id:ib,ibge:ib,nomeMuni:nomeOficial(ib,b.nomeMuni||ib),uf:UF_ATUAL,params:{estrato:estratoPadrao(ib),...PARAMS_PADRAO},
             parsed:{nomeMuni:b.nomeMuni,uf:UF_ATUAL,ibge:ib,rows:[]},indicadores:null};
          trabalho.municipios.push(m);porId.set(ib,m);novos++;
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
          m.indicadores={nomeMuni:m.nomeMuni,uf:UF_ATUAL,ibge:ib,rows:mesclarPorQuad(b.indicadores.rows,(m.indicadores&&m.indicadores.rows)||[])};
        const depois=m.parsed.rows.length+((m.indicadores&&m.indicadores.rows)||[]).length;
        if(depois>antes)hist++;
      });
      alterado.uf=true;
      logMsg('log-params','ok',`✓ Backup lido: modalidades ajustadas em ${plural(par,'município')}, histórico ampliado em ${plural(hist,'município')}${novos?', '+plural(novos,'município novo','municípios novos'):''}.`);
      if(outrasUF)logMsg('log-params','wa',`⚠ ${plural(outrasUF,'município')} de outros estados no backup ${outrasUF===1?'foi ignorado':'foram ignorados'}.`);
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
  const ms=trabalho.municipios;
  const f=faixaQuads(ms);
  const ultimo=f.ks[f.ks.length-1];
  const comInd=ms.filter(m=>m.indicadores&&m.indicadores.rows.length).length;
  const semUltimo=ultimo?ms.filter(m=>!(m.parsed.rows||[]).some(r=>quadKey(r.quad)===ultimo)):[];
  const semEstrato=ms.filter(m=>!m.params.estrato);
  const presentes=new Set(ms.map(m=>String(m.id)));
  const foraDosDados=PainelDados.geo(UF_ATUAL).filter(g=>!presentes.has(String(g.id)));
  const nCli=trabalho.clientes?trabalho.clientes.lista.length:0;

  $('mt-resumo').innerHTML=
    `<div><b>${ms.length.toLocaleString('pt-BR')}</b><span>municípios de ${UF_ATUAL}</span></div>`+
    `<div><b>${f.txt}</b><span>quadrimestres (${f.ks.length})</span></div>`+
    `<div><b>${comInd.toLocaleString('pt-BR')}</b><span>com relatório por indicador (Raio-X)</span></div>`+
    `<div><b>${nCli}</b><span>clientes na lista</span></div>`;

  limparLog('mt-avisos');
  if(!ms.length){logMsg('mt-avisos','wa','⚠ Ainda não há municípios. Importe os relatórios do SIAPS no passo 1.');}
  else{
    if(semUltimo.length)logMsg('mt-avisos','wa',`⚠ ${plural(semUltimo.length,'município')} sem dados no quadrimestre mais recente (${qShortKey(ultimo)}): ${semUltimo.slice(0,12).map(m=>esc(m.nomeMuni)).join(', ')}${semUltimo.length>12?'…':''}. No painel, eles aparecem com o último dado que tiverem.`);
    if(semEstrato.length)logMsg('mt-avisos','wa',`⚠ ${plural(semEstrato.length,'município')} sem estrato IED (o componente fixo fica zerado): ${semEstrato.slice(0,12).map(m=>esc(m.nomeMuni)).join(', ')}. Ajuste no passo 3.`);
    if(foraDosDados.length)logMsg('mt-avisos','wa',`⚠ ${plural(foraDosDados.length,'município')} do mapa sem dados: ${foraDosDados.slice(0,12).map(g=>esc(g.name)).join(', ')}${foraDosDados.length>12?'…':''}.`);
    if(!trabalho.clientes)logMsg('mt-avisos','wa','⚠ Sem lista de clientes: o filtro "só clientes" não vai aparecer no painel.');
    if(!semUltimo.length&&!semEstrato.length)logMsg('mt-avisos','ok','✓ Todos os municípios têm o quadrimestre mais recente e estrato IED definido.');
  }
  const pend=[];
  if(alterado.uf)pend.push(`<b>${UF_ATUAL}.js</b>`);
  if(alterado.clientes)pend.push('<b>clientes.js</b>');
  if(pend.length)logMsg('mt-avisos','wa',`Alterações ainda não baixadas: ${pend.join(' e ')}. Clique em "Baixar" abaixo.`);

  $('btn-baixar-uf').classList.toggle('disabled',!ms.length);
  $('btn-baixar-uf').textContent=`⤓ Baixar dados do estado (${UF_ATUAL}.js)`;
  $('btn-baixar-clientes').classList.toggle('disabled',!trabalho.clientes);
}

function baixarTexto(nome,texto){
  const blob=new Blob([texto],{type:'text/javascript;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=nome;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function gerarArquivoUF(){
  return PainelDados.textoArquivoUF(PainelDados.codificarUF(UF_ATUAL,trabalho.municipios));
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
$('btn-baixar-uf').addEventListener('click',()=>{baixarTexto(UF_ATUAL+'.js',gerarArquivoUF());alterado.uf=false;renderResumo();});
$('btn-baixar-clientes').addEventListener('click',()=>{if(trabalho.clientes){baixarTexto('clientes.js',gerarArquivoClientes());alterado.clientes=false;renderResumo();}});
window.addEventListener('beforeunload',e=>{if(alterado.uf||alterado.clientes){e.preventDefault();e.returnValue='';}});

renderPublicado();
atualizarTudo();
