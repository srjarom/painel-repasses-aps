/* Tendência do repasse vs. quadrimestre anterior: mapa, filtro, painel do município selecionado e busca. */

/* =========================================================================
   TENDÊNCIA vs. QUADRIMESTRE ANTERIOR (v1.28.0)
   -------------------------------------------------------------------------
   A informação principal de cada município: o repasse mensal subiu, ficou
   igual ou caiu em relação ao quadrimestre anterior? Vira a visão padrão do
   mapa (escala divergente: azul = subiu, cinza = igual, vermelho = caiu —
   azul×vermelho continua legível para daltônicos, ao contrário de
   verde×vermelho), um filtro clicável acima do mapa, uma linha no tooltip,
   um painel de detalhe ao selecionar o município, uma coluna no ranking e
   um selo no topo da tela do município. Faixas de intensidade por variação
   percentual (até 2%, 2–5%, acima de 5%) — escolhidas pela distribuição real
   do RS no 2026Q2 (metade das variações abaixo de ~3%). Paleta validada com
   o validador do skill de dataviz (contraste, separação para daltonismo e
   para visão normal), com passos próprios para o modo escuro.
   ========================================================================= */
function tendenciaDe(res){
  const l=res[res.length-1],p=res.length>1?res[res.length-2]:null;
  if(!p)return{dir:null,delta:0,pct:null,prevQuad:null,quad:l.quad};
  const delta=Math.round(l.total)-Math.round(p.total);
  return{dir:delta>0?1:(delta<0?-1:0),delta,pct:p.total>0?delta/p.total*100:null,prevQuad:p.quad,quad:l.quad};
}
const TREND_BINS=[
  {k:'up3',dir:1,label:'Subiu mais de 5%'},
  {k:'up2',dir:1,label:'Subiu de 2% a 5%'},
  {k:'up1',dir:1,label:'Subiu até 2%'},
  {k:'eq',dir:0,label:'Igual ao anterior'},
  {k:'dn1',dir:-1,label:'Caiu até 2%'},
  {k:'dn2',dir:-1,label:'Caiu de 2% a 5%'},
  {k:'dn3',dir:-1,label:'Caiu mais de 5%'},
  {k:'na',dir:null,label:'Sem quadrimestre anterior'},
  {k:'aus',dir:null,label:'Fora do relatório mais recente'}
];
function trendBin(t){
  if(t&&t.ausente)return'aus';
  if(!t||t.dir==null)return'na';
  if(t.dir===0)return'eq';
  const a=Math.abs(t.pct||0),s=a>5?3:(a>2?2:1);
  return(t.dir>0?'up':'dn')+s;
}
function trendColors(){
  return currentTheme()==='dark'
    ?{up1:'#2d62a8',up2:'#4f8fe0',up3:'#9cc5f7',eq:'#3a4450',dn1:'#9a3b34',dn2:'#d9605a',dn3:'#f5a69c',na:cssVar('--map-nodata-fill')||'#1c2c3d',aus:'#d9a336'}
    :{up1:'#86b4f2',up2:'#4f8fdc',up3:'#1f5aa8',eq:'#cdd2d7',dn1:'#f2958a',dn2:'#e06a5f',dn3:'#a8322b',na:cssVar('--map-nodata-fill')||'#e7ecef',aus:'#E0A82E'};
}
const TREND_ICON={1:'▲',0:'=',[-1]:'▼'};
// filtro "equipes a menos": o mapa passa a mostrar o TAMANHO do rombo (uma matiz âmbar, 3 faixas)
const PERDA_BINS=[{k:'p3',min:30000,label:'Acima de R$ 30 mil/mês'},{k:'p2',min:10000,label:'De R$ 10 mil a 30 mil/mês'},{k:'p1',min:0,label:'Até R$ 10 mil/mês'}];
function perdaBin(p){const v=p&&p.impacto||0;return v>=30000?'p3':v>=10000?'p2':'p1';}
function perdaColors(){return currentTheme()==='dark'?{p1:'#7a5410',p2:'#c58f1f',p3:'#f2c46b'}:{p1:'#e3a43c',p2:'#bd7a10',p3:'#7f4a07'};}
function fmtPctBR(v){return(v>0?'+':v<0?'−':'')+Math.abs(v).toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:1})+'%';}
// texto curto da tendência ("Subiu R$ 4.316/mês (+3,3%) vs 2026Q1")
function trendTexto(t,compact){
  if(t&&t.ausente)return`Não aparece no relatório de ${t.ref}`;
  if(!t||t.dir==null)return'Sem quadrimestre anterior para comparar';
  const vs=` vs ${qCode(t.prevQuad)}`;
  if(t.dir===0)return compact?'Igual':'Igual ao '+qCode(t.prevQuad);
  const pc=t.pct!=null?` (${fmtPctBR(t.pct)})`:'';
  return(compact?(t.dir>0?'+':'−')+' ':(t.dir>0?'Subiu ':'Caiu '))+fmtBRL(Math.abs(t.delta))+'/mês'+pc+(compact?'':vs);
}
function trendChipHTML(t,cls){
  const d=t&&t.ausente?'aus':(!t||t.dir==null?'na':(t.dir>0?'up':t.dir<0?'dn':'eq'));
  const ic=d==='aus'?'⚠':d==='na'?'–':TREND_ICON[t.dir];
  return `<span class="trend-chip ${d}${cls?' '+cls:''}"><span class="ti" aria-hidden="true">${ic}</span>${trendTexto(t,cls==='compact')}</span>`;
}
let trendFilter='all';   // 'all' | 'up' | 'eq' | 'dn' — filtra mapa e ranking
let mapSelId=null;       // município selecionado no mapa (painel de detalhe)
function trendMatch(r){
  if(trendFilter==='all')return true;
  if(trendFilter==='perda')return temAlertaEquipes(r.perda);
  const d=r.trend?r.trend.dir:null;
  return trendFilter==='up'?d===1:trendFilter==='dn'?d===-1:d===0;
}
function setTrendFilter(f){trendFilter=(trendFilter===f||f==='all')?'all':f;
  // o filtro vale para o mapa e o ranking: se a pessoa está na aba "Equipes a menos", leva ao mapa
  if(typeof abaEstado!=='undefined'&&abaEstado==='perda')mostrarAba('mapa',{rolar:true});
  renderCarteiraView();}
function renderTrendStrip(rows){
  const el=document.getElementById('trend-strip');if(!el)return;
  const up=rows.filter(r=>r.trend.dir===1),eq=rows.filter(r=>r.trend.dir===0),dn=rows.filter(r=>r.trend.dir===-1);
  const perd=rows.filter(r=>temAlertaEquipes(r.perda));
  const soma=a=>a.reduce((s,r)=>s+r.trend.delta,0);
  // período de comparação mais comum (ex.: "2026Q1 → 2026Q2"); quem compara outro período é citado à parte
  const cont=new Map();
  rows.filter(r=>r.trend.dir!=null).forEach(r=>{const k=`${qCode(r.trend.prevQuad)} → ${qCode(r.trend.quad)}`;cont.set(k,(cont.get(k)||0)+1);});
  const pares=[...cont.entries()].sort((a,b)=>b[1]-a[1]);
  const outros=pares.slice(1).reduce((s2,x)=>s2+x[1],0);
  const ref=pares.length?pares[0][0]+(outros?` · ${outros} município${outros>1?'s':''} com outro período (ver tooltip)`:''):'sem quadrimestre anterior para comparar';
  // v4.1.0: uma barra fina de filtros (antes eram quatro cartões grandes) — fica logo
  // abaixo das abas e vale para o Mapa e o Ranking
  const chip=(k,cls,ic,lbl,n,extra,titulo)=>`<button type="button" class="tf-chip ${cls}${trendFilter===k?' on':''}" aria-pressed="${trendFilter===k}" onclick="setTrendFilter('${k}')"${titulo?` title="${titulo}"`:''}>
      ${ic?`<span class="tf-ic" aria-hidden="true">${ic}</span>`:''}<b>${n}</b> ${lbl}${extra?` <small>${extra}</small>`:''}</button>`;
  const fmtC=typeof fmtBRLcurto==='function'?fmtBRLcurto:fmtBRL;
  el.innerHTML=`<div class="tf-bar" role="group" aria-label="Filtrar o mapa e o ranking pela tendência do repasse">
      <span class="tf-l">Tendência <span class="tf-ref">${ref}</span></span>
      ${chip('all','all','','todos',rows.length,'')}
      ${chip('up','up','▲',up.length===1?'subiu':'subiram',up.length,up.length?'+'+fmtC(soma(up)):'',up.length?'+ '+fmtBRL(soma(up))+'/mês':'')}
      ${chip('eq','eq','=',eq.length===1?'igual':'iguais',eq.length,'')}
      ${chip('dn','dn','▼',dn.length===1?'caiu':'caíram',dn.length,dn.length?'−'+fmtC(-soma(dn)):'',dn.length?'− '+fmtBRL(-soma(dn))+'/mês':'')}
      ${perd.length?chip('perda','warn','⚠','com equipes a menos',perd.length,'−'+fmtC(perd.reduce((s2,r)=>s2+r.perda.impacto,0)),'impacto estimado − '+fmtBRL(perd.reduce((s2,r)=>s2+r.perda.impacto,0))+'/mês'):''}
    </div>`;
}
function selectMapMuni(id,opts={}){
  mapSelId=id;
  renderMapDetail();
  const wrap=document.getElementById('rsmap-svg-wrap');
  if(wrap){
    wrap.querySelectorAll('path.selected').forEach(p=>p.classList.remove('selected'));
    const old=wrap.querySelector('path.rsmap-sel');if(old)old.remove();
    const el=id?wrap.querySelector(`path.has-data[data-id="${id}"]`):null;
    if(el){
      el.classList.add('selected');
      // contorno do selecionado desenhado por cima de tudo (senão os vizinhos cobrem a borda)
      const sel=el.cloneNode(false);sel.setAttribute('class','rsmap-sel');sel.removeAttribute('tabindex');sel.removeAttribute('role');
      el.parentNode.appendChild(sel);
      if(opts.focus)el.focus({preventScroll:true});
    }
  }
  if(opts.scroll){mostrarAba('mapa');const card=document.querySelector('.map-card');if(card)card.scrollIntoView({behavior:'smooth',block:'start'});}
}
function renderMapDetail(){
  const el=document.getElementById('rsmap-detail');if(!el)return;
  const r=mapSelId?carteiraMapRows.find(x=>String(x.entry.ibge||x.entry.id)===String(mapSelId)):null;
  const sec=el.closest('.side-sec');
  if(!r){
    // v4.4.3: sem município selecionado, só uma dica de uma linha (a busca fica no topo da página)
    el.innerHTML=`<div class="rd-hint">Clique num município no mapa para ver os números dele e abrir o relatório.</div>`;
    if(sec)sec.classList.remove('com-muni');
    return;
  }
  if(sec)sec.classList.add('com-muni');
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const cli=clientesSet().has(String(r.entry.id))?'<span class="cli-tag">cliente</span>':'';
  const worst=worstIndicadorFor(r.entry,r.last.quad);
  const id=esc(r.entry.id);
  // o painel do lado volta ao topo, para o cartão (e o botão do relatório) aparecer na hora
  {const side=el.closest('.estado-side');if(side)side.scrollTop=0;}
  el.innerHTML=`<div class="rd-card">
    <div class="rd-top"><div class="rd-name">${esc(r.entry.nomeMuni)}</div><button type="button" class="rd-x" aria-label="Fechar" title="Fechar" onclick="selectMapMuni(null)">×</button></div>
    <div class="rd-sub">${esc(r.entry.uf||'')} · IBGE ${esc(r.entry.ibge||r.entry.id)} ${cli}</div>
    <button type="button" class="rd-open-top" onclick="openFromCarteira('${id}')">Abrir relatório do município <span aria-hidden="true">→</span></button>
    <div class="rd-trend">${trendChipHTML(r.trend,'big')}</div>
    <dl class="rd-kv">
      <div><dt>Repasse ${esc(qCode(r.last.quad))}</dt><dd>${fmtBRL(r.last.total)}<small>/mês</small></dd></div>
      <div><dt>Do potencial</dt><dd>${r.pct}%</dd></div>
      <div><dt>Margem em aberto</dt><dd>${fmtBRL(Math.max(0,r.gap))}<small>/mês</small></dd></div>
    </dl>
    ${temAlertaEquipes(r.perda)?`<div class="rd-warn"><b>⚠ ${r.perda.ausente?'Fora do relatório mais recente':'Equipes a menos'}:</b> ${esc(perdaTexto(r.perda))}.${r.perda.impacto>0?` Impacto estimado: −${fmtBRL(r.perda.impacto)}/mês.`:''}</div>`:''}
    ${worst?`<div class="rd-worst"><b>Indicador mais crítico:</b> ${esc(TYPE_META_IND[worst.tipo]||worst.tipo)} · ${esc(worst.item.indicador)} (${Math.round(worst.item.score*100)}%)</div>`:''}
  </div>`;
}
function renderMapSearch(rows){
  const dl=document.getElementById('rsmap-busca-list');if(!dl)return;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  dl.innerHTML=rows.map(r=>r.entry.nomeMuni).sort((a,b)=>a.localeCompare(b,'pt-BR')).map(n=>`<option value="${esc(n)}">`).join('');
}
function buscarNoMapa(txt){
  const k=normNomeCliente(txt);if(!k)return false;
  const r=carteiraMapRows.find(x=>normNomeCliente(x.entry.nomeMuni)===k)
        ||carteiraMapRows.find(x=>normNomeCliente(x.entry.nomeMuni).startsWith(k));
  if(!r)return false;
  if(trendFilter!=='all'&&!trendMatch(r)){trendFilter='all';renderCarteiraView();}
  selectMapMuni(String(r.entry.ibge||r.entry.id),{focus:false});
  return true;
}
(function initMapSearch(){
  const inp=document.getElementById('rsmap-busca');if(!inp)return;
  const go=()=>{const ok=buscarNoMapa(inp.value);inp.classList.toggle('notfound',!ok&&!!inp.value.trim());};
  inp.addEventListener('change',go);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});
  inp.addEventListener('input',()=>inp.classList.remove('notfound'));
})();
