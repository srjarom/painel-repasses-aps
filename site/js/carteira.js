/* =========================================================================
   PAINEL DO ESTADO ("carteira")
   -------------------------------------------------------------------------
   Lista de todos os municípios publicados para a UF (dados/uf/<UF>.js), com totais,
   mapa, tendência, alerta de equipes a menos e ranking. O objeto `carteira` é montado
   em inicio.js a partir dos dados publicados — é só leitura: nada é gravado no navegador
   (exceto preferências de exibição, como o filtro de clientes e o tema).
   ========================================================================= */

let carteira={municipios:[],clientes:null,filtroClientes:false};

function carteiraRow(entry){return linhaMunicipio(entry,carteiraRefKey);}   // ver resumo.js

function renderCarteiraBadge(){
  const n=carteira.municipios.length;
  const badge=document.getElementById('nav-tab-carteira-count');
  if(badge)badge.textContent=n?` (${n})`:'';
}

function renderCarteiraView(){
  const list=carteira.municipios;
  document.getElementById('carteira-empty').style.display=list.length?'none':'block';
  document.getElementById('carteira-content').style.display=list.length?'':'none';   // '' = layout do CSS (grade de duas colunas)
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

  // quatro quadros numa linha só (v4.0.0) — o detalhe fica nas abas logo abaixo
  const totDelta=rows.reduce((s,r)=>s+(r.trend&&r.trend.dir!=null?r.trend.delta:0),0);
  const totDeltaPct=totAtual-totDelta>0?totDelta/(totAtual-totDelta)*100:null;
  document.getElementById('carteira-summary-grid').innerHTML=
    kpiHTML({label:'Repasse atual por mês',valor:fmtBRLcurto(totAtual),titulo:fmtBRL(totAtual),sub:fmtVar(Math.round(totDelta),totDeltaPct)+' vs. quadrimestre anterior'})+
    kpiHTML({label:'Potencial por mês',valor:fmtBRLcurto(totPot),titulo:fmtBRL(totPot),sub:'se todas as equipes estivessem em "Ótimo"'})+
    kpiHTML({label:'Margem em aberto por mês',valor:fmtBRLcurto(totGap),titulo:fmtBRL(totGap),barra:pctMed,sub:`${pctMed}% do potencial já alcançado`})+
    kpiHTML({label:filtrar?'Clientes '+CLIENTES_ROTULO:'Municípios',valor:fmtNum(rows.length),
      sub:filtrar?`de ${fmtNum(list.length)} municípios do estado`:(cli.size?`${fmtNum(cli.size)} clientes ${CLIENTES_ROTULO}`:'no relatório publicado')});

  // aba "Equipes a menos": número na aba; some quando não há nenhum
  const nPerda=rows.filter(r=>temAlertaEquipes(r.perda)).length;
  const tp=document.getElementById('tab-perda'),tpn=document.getElementById('tab-perda-n'),av=document.getElementById('alerta-vazio');
  if(tpn)tpn.textContent=nPerda?`(${nPerda})`:'';
  if(tp)tp.style.display=nPerda?'':'none';
  if(av)av.style.display=nPerda?'none':'block';
  if(!nPerda&&abaEstado==='perda')mostrarAba('mapa');

  rankingAtual={rows:rankRows,filtrar,cli,totAtual,totPot,totGap,pctMed,filtroKey:trendFilter+'|'+filtrar};
  renderRanking();
  if(typeof agendarAjusteAltura==='function')agendarAjusteAltura();
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
// abrir um município (do mapa, do ranking, dos alertas…) entra no endereço e no histórico
// do navegador (…?uf=RS&m=430040) — ver estados.js
function openFromCarteira(id){
  if(!carteira.municipios.some(m=>m.id===id))return;
  if(document.getElementById('view-carteira').style.display!=='none')scrollAntesDoMunicipio=window.scrollY;
  irPara({uf:UF_ATUAL,m:String(id)});
}
function abrirMunicipio(id){
  const entry=carteira.municipios.find(m=>m.id===id);
  if(!entry)return;
  parsed={nomeMuni:entry.parsed.nomeMuni,uf:entry.parsed.uf,ibge:entry.parsed.ibge,rows:entry.parsed.rows};
  showView('municipio');
  showSecTab('geral');
  render();
  document.getElementById('sel-estrato').value=entry.params.estrato||'';
  if(entry.params.eapMod)document.getElementById('sel-eap').value=entry.params.eapMod;
  if(entry.params.esbMod)document.getElementById('sel-esb').value=entry.params.esbMod;
  if(entry.params.emultiMod)document.getElementById('sel-emulti').value=entry.params.emultiMod;
  document.getElementById('sel-ecr').value=entry.params.ecrMod||PARAMS_PADRAO_MUNI.ecrMod;
  document.getElementById('sel-eapp').value=entry.params.eappMod||PARAMS_PADRAO_MUNI.eappMod;
  {const d=document.getElementById('inp-destinatario');if(d)d.value='';}
  recompute();
  // Se este município da carteira já tiver o relatório por indicador anexado
  // (v1.17.0), reabre o Raio-X junto; senão, garante que o painel volte ao
  // estado vazio (não deve "herdar" o indicador do município visto antes).
  if(entry.indicadores){indicador=entry.indicadores;raioxActiveTipo=null;renderRaioX();}
  else{resetRaioX();}
}


function showView(view){
  ['brasil','carteira','municipio','guia'].forEach(v=>{
    const el=document.getElementById('view-'+v);if(el)el.style.display=view===v?'block':'none';
  });
  const notas=document.getElementById('notas-gerais');if(notas)notas.style.display=(view==='brasil'||view==='carteira')?'block':'none';
  const tc=document.getElementById('nav-tab-carteira'),tg=document.getElementById('nav-tab-guia');
  if(tc)tc.classList.toggle('active',view!=='guia');
  if(tg)tg.classList.toggle('active',view==='guia');
  if(view==='brasil')renderBrasil();
  if(view==='carteira')renderCarteiraView();
  if(typeof agendarAjusteAltura==='function')agendarAjusteAltura();
  if(view!=='municipio')window.scrollTo({top:0,behavior:'auto'});
}
// "Painel" no topo sempre leva à tela do Brasil
document.getElementById('nav-tab-carteira').addEventListener('click',()=>irBrasil());
document.getElementById('nav-tab-guia').addEventListener('click',()=>showView('guia'));
// "Voltar" devolve o usuário ao ponto do painel do estado onde ele estava (mapa, ranking…)
{const back=document.getElementById('btn-voltar-painel');if(back)back.addEventListener('click',()=>{
  if(entrouNoMunicipioPeloPainel)history.back();else irEstado(UF_ATUAL);
});}
