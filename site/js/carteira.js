/* =========================================================================
   PAINEL DO ESTADO ("carteira")
   -------------------------------------------------------------------------
   Lista de todos os municípios publicados para a UF (dados/uf/<UF>.js), com totais,
   mapa, tendência, alerta de equipes a menos e ranking. O objeto `carteira` é montado
   em inicio.js a partir dos dados publicados — é só leitura: nada é gravado no navegador
   (exceto preferências de exibição, como o filtro de clientes e o tema).
   ========================================================================= */

let carteira={municipios:[],clientes:null,filtroClientes:false};

function carteiraRow(entry){
  const res=compute(entry.parsed.rows,entry.params);
  const last=res[res.length-1];
  const gap=last.potencial-last.total;
  const pct=last.potencial>0?Math.round(last.total/last.potencial*100):100;
  const perda=analisarPerdaEquipes(res,entry.parsed.rows,carteiraRefKey);
  let trend=tendenciaDe(res);
  // município que nem aparece no relatório mais recente: a "tendência" antiga enganaria
  if(perda&&perda.ausente)trend={dir:null,ausente:true,delta:0,pct:null,prevQuad:null,quad:last.quad,ref:perda.ausente.ref};
  return{entry,last,gap,pct,trend,perda};
}

function renderCarteiraBadge(){
  const n=carteira.municipios.length;
  const badge=document.getElementById('nav-tab-carteira-count');
  if(badge)badge.textContent=n?` (${n})`:'';
}

function renderCarteiraView(){
  const list=carteira.municipios;
  document.getElementById('carteira-empty').style.display=list.length?'none':'block';
  document.getElementById('carteira-content').style.display=list.length?'block':'none';
  renderCarteiraBadge();
  if(!list.length)return;

  const cli=clientesSet(),filtrar=!!carteira.filtroClientes&&cli.size>0;
  carteiraRefKey=list.reduce((mx,m)=>Math.max(mx,...((m.parsed&&m.parsed.rows)||[]).map(r=>quadKey(r.quad)),0),0);
  renderCliBar(list,cli,filtrar);
  const rows=(filtrar?list.filter(m=>cli.has(String(m.id))):list).map(carteiraRow).sort((a,b)=>b.gap-a.gap);
  renderTrendStrip(rows);
  renderAlertaCarteira(rows);
  renderCarteiraMap(rows);
  // ranking: segue o filtro de tendência; com "melhoraram"/"pioraram" ordena pela variação
  let rankRows=rows.filter(trendMatch);
  if(trendFilter==='up')rankRows=[...rankRows].sort((a,b)=>b.trend.delta-a.trend.delta);
  if(trendFilter==='dn')rankRows=[...rankRows].sort((a,b)=>a.trend.delta-b.trend.delta);
  if(trendFilter==='perda')rankRows=[...rankRows].sort((a,b)=>(b.perda.ausente?1:0)-(a.perda.ausente?1:0)||b.perda.impacto-a.perda.impacto);
  const rt=document.getElementById('ranking-title'),rsub=document.getElementById('ranking-sub');
  if(rt)rt.textContent=trendFilter==='perda'?'Ranking — municípios com equipes a menos':trendFilter==='up'?'Ranking — municípios em que o repasse subiu':trendFilter==='dn'?'Ranking — municípios em que o repasse caiu':trendFilter==='eq'?'Ranking — municípios com repasse igual ao anterior':'Ranking por margem em aberto';
  if(rsub)rsub.textContent=trendFilter==='perda'?`${rankRows.length} municípios, do maior impacto estimado para o menor.`:trendFilter==='up'?`${rankRows.length} municípios, da maior alta para a menor.`:trendFilter==='dn'?`${rankRows.length} municípios, da maior queda para a menor — onde vale olhar primeiro.`:trendFilter==='eq'?`${rankRows.length} municípios, ordenados pela margem em aberto.`:`${rankRows.length} municípios, do maior para o menor valor mensal que ainda pode ser conquistado (diferença entre o repasse atual e o potencial), no quadrimestre mais recente.`;

  const totAtual=rows.reduce((s,r)=>s+r.last.total,0);
  const totPot=rows.reduce((s,r)=>s+r.last.potencial,0);
  const totGap=rows.reduce((s,r)=>s+r.gap,0);
  const pctMed=totPot>0?Math.round(totAtual/totPot*100):0;

  document.getElementById('carteira-summary-grid').innerHTML=`
    <div class="tcard"><div class="tcard-top"><div><div class="tt">${filtrar?'Clientes '+CLIENTES_ROTULO:'Municípios no painel'}</div></div></div>
      <div class="tcard-body"><div class="now mono">${rows.length}</div></div></div>
    <div class="tcard"><div class="tcard-top"><div><div class="tt">Repasse atual — agregado</div></div></div>
      <div class="tcard-body"><div class="nowlbl">Soma do quadrimestre mais recente de cada município</div><div class="now mono">${fmtBRL(totAtual)}</div></div></div>
    <div class="tcard"><div class="tcard-top"><div><div class="tt">Potencial — agregado</div></div></div>
      <div class="tcard-body"><div class="nowlbl">Se todas as equipes estivessem em "Ótimo"</div><div class="now mono">${fmtBRL(totPot)}</div></div></div>
    <div class="tcard"><div class="tcard-top"><div><div class="tt">Margem em aberto — agregada</div></div></div>
      <div class="tcard-body"><div class="now mono">${fmtBRL(totGap)}</div>
        <div class="tcard-prog"><i style="width:${Math.min(pctMed,100)}%"></i></div>
        <div class="nowlbl" style="margin-top:6px;">${pctMed}% do potencial já alcançado, em média</div></div></div>`;

  rankingAtual={rows:rankRows,filtrar,cli,totAtual,totPot,totGap,pctMed,filtroKey:trendFilter+'|'+filtrar};
  renderRanking();
}

/* ranking: mostra 25 por vez (com busca), para a página não virar uma lista de 500 linhas */
const RANK_PASSO=25;
let rankingAtual=null,rankLimite=RANK_PASSO,rankFiltroKey='',rankBusca='';
function renderRanking(){
  const R=rankingAtual;if(!R)return;
  if(R.filtroKey!==rankFiltroKey){rankFiltroKey=R.filtroKey;rankLimite=RANK_PASSO;}
  const termo=normNomeCliente(rankBusca);
  const todas=R.rows.map((r,i)=>({r,pos:i+1}));
  const lista=termo?todas.filter(x=>normNomeCliente(x.r.entry.nomeMuni).includes(termo)):todas;
  const vis=lista.slice(0,rankLimite);
  let h='<thead><tr><th class="rk-pos">#</th><th>Município</th><th>Tendência</th><th>Repasse atual</th><th>Potencial</th><th>Margem/mês</th><th>% atingido</th><th>Indicador mais crítico</th></tr></thead><tbody>';
  vis.forEach(({r,pos})=>{
    const worst=worstIndicadorFor(r.entry,r.last.quad);
    const worstTxt=worst?`${TYPE_META_IND[worst.tipo]||worst.tipo} · ${worst.item.indicador}`:'';
    const worstHTML=worst?`<div class="ind-crit" title="${worstTxt.replace(/"/g,'&quot;')} (${Math.round(worst.item.score*100)}%)"><span class="ind-crit-t">${worstTxt}</span></div><div class="ind-crit-p">${Math.round(worst.item.score*100)}% do máximo</div>`:'<span style="color:var(--muted)">—</span>';
    const tagCli=!R.filtrar&&R.cli.has(String(r.entry.id))?' <span class="cli-tag">cliente</span>':'';
    const antigo=quadKey(r.last.quad)!==carteiraRefKey?`<div class="rk-sub">último dado: ${qShort(r.last.quad)}</div>`:'';
    h+=`<tr><td class="rk-pos">${pos}</td><td class="rk-nome"><button type="button" class="rk-abrir" onclick="openFromCarteira('${r.entry.id}')" title="Abrir o relatório de ${r.entry.nomeMuni}">${r.entry.nomeMuni}</button>${tagCli}${antigo}`+
      `<div class="rk-links"><span class="rowlink" onclick="openFromCarteira('${r.entry.id}')">Ver relatório</span><span class="rowlink" onclick="selectMapMuni('${r.entry.ibge||r.entry.id}',{scroll:true})">No mapa</span></div></td>`+
      `<td>${trendChipHTML(r.trend,'compact')}</td><td>${fmtBRL(r.last.total)}</td><td>${fmtBRL(r.last.potencial)}</td><td>${fmtBRL(r.gap)}</td><td>${r.pct}%</td><td class="rk-ind">${worstHTML}</td></tr>`;
  });
  if(!vis.length)h+=`<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:22px;">Nenhum município encontrado${termo?' para “'+rankBusca.replace(/</g,'&lt;')+'”':''}.</td></tr>`;
  if(!termo)h+=`<tr class="total"><td></td><td>Total (${R.rows.length} municípios)</td><td></td><td>${fmtBRL(R.totAtual)}</td><td>${fmtBRL(R.totPot)}</td><td>${fmtBRL(R.totGap)}</td><td>${R.pctMed}%</td><td></td></tr>`;
  h+='</tbody>';
  document.getElementById('carteira-table').innerHTML=h;
  const mais=document.getElementById('ranking-mais');
  if(mais){
    const resta=lista.length-vis.length;
    mais.innerHTML=resta>0?`<span class="rk-cont">Mostrando ${vis.length} de ${lista.length}</span>`+
      `<div class="change" onclick="rankLimite+=RANK_PASSO;renderRanking()">Mostrar mais ${Math.min(RANK_PASSO,resta)}</div>`+
      `<div class="change" onclick="rankLimite=Infinity;renderRanking()">Mostrar todos (${lista.length})</div>`
      :(lista.length>RANK_PASSO?`<span class="rk-cont">Mostrando todos os ${lista.length}</span><div class="change" onclick="rankLimite=RANK_PASSO;renderRanking();document.getElementById('carteira-table').scrollIntoView({block:'start'})">Mostrar só os primeiros ${RANK_PASSO}</div>`:'');
  }
}
{const b=document.getElementById('ranking-busca');if(b)b.addEventListener('input',e=>{rankBusca=e.target.value;rankLimite=RANK_PASSO;renderRanking();});}


let scrollAntesDoMunicipio=0;
function openFromCarteira(id){
  const entry=carteira.municipios.find(m=>m.id===id);
  if(!entry)return;
  if(document.getElementById('view-carteira').style.display!=='none')scrollAntesDoMunicipio=window.scrollY;
  parsed={nomeMuni:entry.parsed.nomeMuni,uf:entry.parsed.uf,ibge:entry.parsed.ibge,rows:entry.parsed.rows};
  showView('municipio');
  showSecTab('geral');
  render();
  document.getElementById('sel-estrato').value=entry.params.estrato||'';
  if(entry.params.eapMod)document.getElementById('sel-eap').value=entry.params.eapMod;
  if(entry.params.esbMod)document.getElementById('sel-esb').value=entry.params.esbMod;
  if(entry.params.emultiMod)document.getElementById('sel-emulti').value=entry.params.emultiMod;
  {const d=document.getElementById('inp-destinatario');if(d)d.value='';}
  recompute();
  // Se este município da carteira já tiver o relatório por indicador anexado
  // (v1.17.0), reabre o Raio-X junto; senão, garante que o painel volte ao
  // estado vazio (não deve "herdar" o indicador do município visto antes).
  if(entry.indicadores){indicador=entry.indicadores;raioxActiveTipo=null;renderRaioX();}
  else{resetRaioX();}
}


function showView(view){
  ['carteira','municipio','guia'].forEach(v=>{
    const el=document.getElementById('view-'+v);if(el)el.style.display=view===v?'block':'none';
  });
  const tc=document.getElementById('nav-tab-carteira'),tg=document.getElementById('nav-tab-guia');
  if(tc)tc.classList.toggle('active',view==='carteira'||view==='municipio');
  if(tg)tg.classList.toggle('active',view==='guia');
  if(view==='carteira')renderCarteiraView();
  if(view!=='municipio')window.scrollTo({top:0,behavior:'auto'});
}
document.getElementById('nav-tab-carteira').addEventListener('click',()=>showView('carteira'));
document.getElementById('nav-tab-guia').addEventListener('click',()=>showView('guia'));
// "Voltar" devolve o usuário ao ponto do painel onde ele estava (mapa, ranking…)
{const back=document.getElementById('btn-voltar-painel');if(back)back.addEventListener('click',()=>{showView('carteira');window.scrollTo({top:scrollAntesDoMunicipio,behavior:'auto'});});}
