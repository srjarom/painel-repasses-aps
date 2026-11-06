/* =========================================================================
   TELA INICIAL: BRASIL (v4.0.0)
   -------------------------------------------------------------------------
   Números do país, mapa por estado e a lista dos estados — tudo a partir do
   resumo que a manutenção grava em dados/indice.js (não baixa os 27 estados).
   Clicar num estado (no mapa ou na lista) abre o painel do estado.
   Aqui também fica a busca do topo (município ou estado), usada nas duas telas.
   ========================================================================= */
const escHTML=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// R$ 2,06 bi · R$ 25,2 mi · R$ 948 mil · R$ 812 — para os quadros e o mapa
function fmtBRLcurto(v){
  const a=Math.abs(v),s=v<0?'−':'';
  const n=(x,d)=>x.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  if(a>=1e9)return`${s}R$ ${n(a/1e9,2)} bi`;
  if(a>=1e6)return`${s}R$ ${n(a/1e6,a>=1e8?0:1)} mi`;
  if(a>=1e4)return`${s}R$ ${n(a/1e3,0)} mil`;
  return s+fmtBRL(a);
}
function fmtNum(v){return Number(v||0).toLocaleString('pt-BR');}
function fmtVar(delta,pct){
  if(!delta)return'<span class="var eq">= igual ao anterior</span>';
  const up=delta>0;
  return`<span class="var ${up?'up':'dn'}">${up?'▲':'▼'} ${fmtBRLcurto(Math.abs(delta))}${pct!=null?` (${fmtPctBR(pct)})`:''}</span>`;
}
// um quadro de número (usado na tela do Brasil e na do estado)
function kpiHTML({label,valor,titulo,sub,cls,barra,onclick}){
  const tag=onclick?'button type="button"':'div';
  return`<${tag} class="kpi${cls?' '+cls:''}"${onclick?` onclick="${onclick}"`:''}>
    <div class="kpi-l">${label}</div>
    <div class="kpi-v"${titulo?` title="${escHTML(titulo)}"`:''}>${valor}</div>
    ${barra!=null?`<div class="kpi-bar"><i style="width:${Math.max(0,Math.min(100,barra))}%"></i></div>`:''}
    ${sub?`<div class="kpi-s">${sub}</div>`:''}
  </${onclick?'button':'div'}>`;
}

/* ---------- dados do Brasil (do índice) ---------- */
function estadosComResumo(){
  const ind=PainelDados.indice();
  return ESTADOS.filter(e=>ind[e.uf]&&ind[e.uf].total!=null).map(e=>Object.assign({uf:e.uf,nome:e.nome},ind[e.uf]));
}
function totaisBrasil(lista){
  const s=f=>lista.reduce((a,x)=>a+(x[f]||0),0);
  const total=s('total'),potencial=s('potencial'),delta=s('delta');
  return{total,potencial,gap:Math.max(0,potencial-total),pct:potencial>0?total/potencial*100:100,delta,
    deltaPct:total-delta>0?delta/(total-delta)*100:null,municipios:s('municipios'),sobe:s('sobe'),igual:s('igual'),
    desce:s('desce'),perda:s('perda'),perdaImpacto:s('perdaImpacto')};
}

let brMetric='gap',brOrdem='gap';
function renderBrasil(){
  const lista=estadosComResumo();
  const ind=PainelDados.indice();
  const info=document.getElementById('br-info');
  const kpis=document.getElementById('br-kpis');
  if(!lista.length){
    if(info)info.textContent='Nenhum estado com dados publicados ainda.';
    if(kpis)kpis.innerHTML='';
    return;
  }
  const T=totaisBrasil(lista);
  const ult=lista.map(x=>x.ultimoQuad).sort().pop(),pri=lista.map(x=>x.primeiroQuad).filter(Boolean).sort()[0];
  const dt=lista.map(x=>x.atualizadoEm).sort().pop();
  const up=quadParts(ult);
  if(info)info.textContent=`Avaliação mais recente: ${up?up.q+'º quadrimestre de '+up.y:ult} · ${fmtNum(T.municipios)} municípios em ${lista.length} estados · dados de ${pri||'—'} a ${ult} · atualizado em ${new Date(dt+'T12:00:00').toLocaleDateString('pt-BR')}`;
  const pctTxt=Math.round(T.pct).toLocaleString('pt-BR');
  if(kpis)kpis.innerHTML=
    kpiHTML({label:'Repasse atual por mês',valor:fmtBRLcurto(T.total),titulo:fmtBRL(T.total),sub:fmtVar(T.delta,T.deltaPct)+' vs. quadrimestre anterior'})+
    kpiHTML({label:'Margem em aberto por mês',valor:fmtBRLcurto(T.gap),titulo:fmtBRL(T.gap),barra:T.pct,sub:`${pctTxt}% do potencial (${fmtBRLcurto(T.potencial)}) já alcançado`})+
    kpiHTML({label:'Tendência dos municípios',valor:`<span class="var up">▲ ${fmtNum(T.sobe)}</span> <span class="var eq">= ${fmtNum(T.igual)}</span> <span class="var dn">▼ ${fmtNum(T.desce)}</span>`,sub:'subiram · iguais · caíram, vs. quadrimestre anterior'})+
    kpiHTML({label:'Municípios com equipes a menos',valor:fmtNum(T.perda),cls:T.perda?'warn':'',sub:T.perda?`impacto estimado de −${fmtBRLcurto(T.perdaImpacto)}/mês`:'nenhum no momento'});
  renderBrasilLista(lista);
  renderBrasilMapa(lista);
}

/* ---------- lista dos estados ---------- */
function renderBrasilLista(lista){
  const el=document.getElementById('br-list');if(!el)return;
  const ord={gap:(a,b)=>b.gap-a.gap,total:(a,b)=>b.total-a.total,pct:(a,b)=>a.pct-b.pct,delta:(a,b)=>(b.deltaPct||0)-(a.deltaPct||0),
    perda:(a,b)=>b.perda-a.perda||b.perdaImpacto-a.perdaImpacto,nome:(a,b)=>a.nome.localeCompare(b.nome,'pt-BR')}[brOrdem];
  const val={gap:x=>fmtBRLcurto(x.gap),total:x=>fmtBRLcurto(x.total),pct:x=>Math.round(x.pct)+'%',delta:x=>x.deltaPct!=null?fmtPctBR(x.deltaPct):'—',
    perda:x=>x.perda+' munic.',nome:x=>fmtBRLcurto(x.gap)}[brOrdem];
  const lbl={gap:'margem/mês',total:'repasse/mês',pct:'do potencial',delta:'vs. anterior',perda:'com equipes a menos',nome:'margem/mês'}[brOrdem];
  el.innerHTML=[...lista].sort(ord).map((x,i)=>{
    const d=x.delta>0?'up':x.delta<0?'dn':'eq';
    return`<button type="button" class="br-row" role="listitem" data-uf="${x.uf}" onclick="irEstado('${x.uf}')" title="Abrir ${escHTML(x.nome)}">
      <span class="br-pos">${brOrdem==='nome'?'':i+1}</span>
      <span class="br-nome"><b>${escHTML(x.nome)}</b><small>${fmtNum(x.municipios)} municípios${x.perda?` · <span class="br-warn">⚠ ${x.perda} com equipes a menos</span>`:''}</small></span>
      <span class="br-pct" title="${Math.round(x.pct)}% do potencial alcançado"><i style="width:${Math.min(100,x.pct)}%"></i></span>
      <span class="br-val"><b>${val(x)}</b><small>${lbl}</small></span>
      <span class="br-t ${d}" aria-label="variação">${d==='up'?'▲':d==='dn'?'▼':'='}</span>
    </button>`;
  }).join('');
  el.querySelectorAll('.br-row').forEach(b=>{
    b.addEventListener('mouseenter',()=>destacarEstadoMapa(b.dataset.uf,true));
    b.addEventListener('mouseleave',()=>destacarEstadoMapa(b.dataset.uf,false));
  });
}

/* ---------- mapa do Brasil ---------- */
const BR_GEO_CACHE={};
function projetarGeo(lista,W){
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  lista.forEach(m=>m.polys.forEach(p=>p.forEach(r=>r.forEach(([lon,lat])=>{
    if(lon<x0)x0=lon;if(lon>x1)x1=lon;if(lat<y0)y0=lat;if(lat>y1)y1=lat;}))));
  const cos=Math.cos((y0+y1)/2*Math.PI/180),k=W/((x1-x0)*cos),H=(y1-y0)*k;
  const px=([lon,lat])=>[(lon-x0)*cos*k,(y1-lat)*k];
  const paths=lista.map(m=>{
    let maior=null,area=0;
    const d=m.polys.map(p=>p.map(r=>{
      const pts=r.map(px);
      // centro do maior anel (para a sigla do estado)
      let bx0=Infinity,bx1=-Infinity,by0=Infinity,by1=-Infinity;pts.forEach(([x,y])=>{if(x<bx0)bx0=x;if(x>bx1)bx1=x;if(y<by0)by0=y;if(y>by1)by1=y;});
      const a=(bx1-bx0)*(by1-by0);if(a>area){area=a;maior=[(bx0+bx1)/2,(by0+by1)/2];}
      return'M'+pts.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1)).join('L')+'Z';
    }).join(' ')).join(' ');
    return{id:m.id,d,c:maior};
  });
  return{paths,W,H};
}
async function renderBrasilMapa(lista){
  const wrap=document.getElementById('br-map');if(!wrap)return;
  if(!PainelDados.geo('BR').length)await PainelDados.carregarScript('dados/geo/BR.js');
  const geo=BR_GEO_CACHE.g||(BR_GEO_CACHE.g=projetarGeo(PainelDados.geo('BR'),600));
  const por=Object.fromEntries(lista.map(x=>[x.uf,x]));
  const val=x=>brMetric==='gap'?x.gap:brMetric==='total'?x.total:brMetric==='pct'?x.pct:(x.deltaPct||0);
  const vs=lista.map(val),min=Math.min(...vs),max=Math.max(...vs),span=(max-min)||1;
  const TC=trendColors();
  const cor=x=>{
    if(!x)return cssVar('--map-nodata-fill')||'#e7ecef';
    if(brMetric==='trend')return TC[trendBin({dir:Math.sign(x.delta),pct:x.deltaPct})];
    return rsMapColorAt((val(x)-min)/span);
  };
  // sigla em branco ou escuro, conforme a cor de fundo
  const claro=x=>{if(!x)return true;if(brMetric==='trend')return!['up3','dn3'].includes(trendBin({dir:Math.sign(x.delta),pct:x.deltaPct}));return(val(x)-min)/span<0.55;};
  let svg=`<svg viewBox="0 0 ${geo.W} ${geo.H.toFixed(0)}" role="img" aria-label="Mapa do Brasil com os estados coloridos por ${escHTML(BR_METRICAS[brMetric])}. A lista ao lado traz os mesmos dados.">`;
  geo.paths.forEach(p=>{const x=por[p.id];
    svg+=`<path class="br-uf${x?' has-data':''}" d="${p.d}" fill="${cor(x)}" fill-rule="evenodd" data-uf="${p.id}" tabindex="${x?0:-1}" role="${x?'button':'presentation'}"${x?` aria-label="${escHTML(x.nome)}: ${escHTML(brValorTexto(x))}"`:''}></path>`;});
  geo.paths.forEach(p=>{if(!p.c)return;const pequeno=['DF','SE','AL','PB','RN','ES','RJ'].includes(p.id);
    svg+=`<text class="br-sigla${claro(por[p.id])?'':' on-dark'}${pequeno?' sm':''}" x="${p.c[0].toFixed(1)}" y="${(p.c[1]+4).toFixed(1)}">${p.id}</text>`;});
  svg+='</svg>';
  wrap.innerHTML=svg;
  renderBrasilLegenda(min,max);
  wrap.querySelectorAll('path.has-data').forEach(el=>{
    const x=por[el.dataset.uf];
    el.addEventListener('pointermove',e=>brTooltip(e,x));
    el.addEventListener('pointerleave',()=>brTooltip(null));
    el.addEventListener('focus',e=>brTooltip(e,x));
    el.addEventListener('blur',()=>brTooltip(null));
    el.addEventListener('click',()=>irEstado(x.uf));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();irEstado(x.uf);}});
  });
}
const BR_METRICAS={gap:'margem em aberto',pct:'% do potencial alcançado',total:'repasse atual',trend:'variação vs. quadrimestre anterior'};
function brValorTexto(x){
  return brMetric==='gap'?`margem de ${fmtBRLcurto(x.gap)}/mês`:brMetric==='total'?`repasse de ${fmtBRLcurto(x.total)}/mês`:
    brMetric==='pct'?`${Math.round(x.pct)}% do potencial`:(x.deltaPct!=null?`${fmtPctBR(x.deltaPct)} vs. anterior`:'sem anterior');
}
function renderBrasilLegenda(min,max){
  const el=document.getElementById('br-legend');if(!el)return;
  if(brMetric==='trend'){
    const C=trendColors();
    el.innerHTML='<ul class="rsmap-legend-list br-leg-list">'+TREND_BINS.filter(b=>b.dir!=null).map(b=>
      `<li><span class="rsmap-swatch" style="background:${C[b.k]}"></span><span class="lg-l">${b.label}</span></li>`).join('')+'</ul>';
    return;
  }
  const f=brMetric==='pct'?v=>Math.round(v)+'%':fmtBRLcurto;
  el.innerHTML=`<div class="br-leg-grad"><span>${f(min)}</span><div class="rsmap-legend-grad"></div><span>${f(max)}</span></div>`;
}
function brTooltip(e,x){
  const tip=document.getElementById('br-tooltip'),outer=document.getElementById('br-map-outer');if(!tip||!outer)return;
  outer.querySelectorAll('path.hovered').forEach(p=>p.classList.remove('hovered'));
  if(!e||!x){tip.style.display='none';return;}
  if(e.target&&e.target.classList)e.target.classList.add('hovered');
  tip.innerHTML=`<div class="rsmap-tt-name">${escHTML(x.nome)}</div>
    <div class="rsmap-tt-val">Repasse: ${fmtBRL(x.total)}/mês</div>
    <div class="rsmap-tt-val">Margem em aberto: ${fmtBRL(x.gap)}/mês · ${Math.round(x.pct)}% do potencial</div>
    <div class="rsmap-tt-val">${fmtVar(x.delta,x.deltaPct)} vs. anterior</div>
    ${x.perda?`<div class="rsmap-tt-warn">⚠ ${x.perda} município${x.perda>1?'s':''} com equipes a menos</div>`:''}
    <div class="rsmap-tt-hint">Clique para abrir o estado</div>`;
  const rect=outer.getBoundingClientRect(),byPointer=e.type!=='focus'&&e.clientX!=null,tr=e.target.getBoundingClientRect();
  let px=byPointer?e.clientX-rect.left+14:tr.left-rect.left+tr.width/2,py=byPointer?e.clientY-rect.top-10:tr.top-rect.top;
  tip.style.display='block';
  if(px+tip.offsetWidth>rect.width-6)px=Math.max(0,px-tip.offsetWidth-28);
  tip.style.left=px+'px';tip.style.top=Math.max(py,0)+'px';
}
function destacarEstadoMapa(uf,on){
  const p=document.querySelector(`#br-map path[data-uf="${uf}"]`);if(p)p.classList.toggle('hovered',on);
}
(function initBrasilControles(){
  const bar=document.getElementById('br-metrics');
  if(bar)bar.querySelectorAll('.map-metric-btn').forEach(b=>{
    const go=()=>{brMetric=b.dataset.metric;bar.querySelectorAll('.map-metric-btn').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});renderBrasilMapa(estadosComResumo());};
    b.addEventListener('click',go);
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
  });
  const ord=document.getElementById('br-ordem');
  if(ord)ord.addEventListener('change',()=>{brOrdem=ord.value;renderBrasilLista(estadosComResumo());});
})();

/* ---------- busca do topo: município (do Brasil inteiro) ou estado ---------- */
let buscaPronta=null;
function prepararBusca(){
  if(buscaPronta)return buscaPronta;
  buscaPronta=(async()=>{
    if(!PainelDados.busca().length)await PainelDados.carregarScript('dados/busca.js');
    const dl=document.getElementById('busca-lista');
    if(dl)dl.innerHTML=ESTADOS.map(e=>`<option value="${escHTML(e.nome)} — estado">`).join('')+
      PainelDados.busca().map(([ib,n])=>`<option value="${escHTML(n)} (${ufDoIbge(ib)})">`).join('');
  })();
  return buscaPronta;
}
function resolverBusca(txt,exato){
  const t=String(txt||'').trim();if(!t)return null;
  const est=t.match(/^(.*?)\s+—\s+estado$/i);
  const achaEstado=nome=>ESTADOS.find(e=>normNomeCliente(e.nome)===normNomeCliente(nome)||e.uf===String(nome).trim().toUpperCase());
  if(est){const e=achaEstado(est[1]);return e?{uf:e.uf}:null;}
  const mt=t.match(/^(.*?)\s*\(([A-Za-z]{2})\)\s*$/);
  const nome=normNomeCliente(mt?mt[1]:t),uf=mt?mt[2].toUpperCase():'';
  const lista=PainelDados.busca();
  let ach=lista.filter(([ib,n])=>normNomeCliente(n)===nome&&(!uf||ufDoIbge(ib)===uf));
  if(!ach.length&&!uf){const e=achaEstado(t);if(e)return{uf:e.uf};}
  if(!ach.length&&!exato)ach=lista.filter(([ib,n])=>normNomeCliente(n).startsWith(nome)&&(!uf||ufDoIbge(ib)===uf));
  // nome repetido em vários estados sem a UF: prefere o estado aberto agora
  if(ach.length>1){const aqui=ach.filter(([ib])=>ufDoIbge(ib)===UF_ATUAL);if(aqui.length===1)ach=aqui;}
  return ach.length===1?{uf:ufDoIbge(ach[0][0]),m:ach[0][0]}:null;
}
(function initBusca(){
  ['busca-br','busca-uf'].forEach(id=>{
    const inp=document.getElementById(id);if(!inp)return;
    inp.addEventListener('focus',prepararBusca);
    // escolher na lista (change) só navega com o nome exato; Enter aceita o começo do nome
    const go=async(exato)=>{
      await prepararBusca();
      const r=resolverBusca(inp.value,exato);
      if(!r&&exato)return;
      inp.classList.toggle('notfound',!r&&!!inp.value.trim());
      if(!r)return;
      inp.value='';inp.blur();
      if(r.m)irMunicipio(r.m);else irEstado(r.uf);
    };
    inp.addEventListener('change',()=>go(true));
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go(false);}});
    inp.addEventListener('input',()=>inp.classList.remove('notfound'));
  });
})();
