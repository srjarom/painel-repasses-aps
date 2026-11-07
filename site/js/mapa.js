/* Mapa interativo do estado (SVG desenhado a partir dos contornos em dados/geo/). */

/* =========================================================================
   MAPA INTERATIVO DO ESTADO ESCOLHIDO
   Projeção equirretangular simples (uma única correção de cosseno pela latitude
   média do estado basta para o tamanho de um estado — sem precisar de Mercator/D3).
   As geometrias vêm de dados/geo/<UF>.js (PainelDados.geo) e são projetadas uma
   única vez por estado e guardadas em MAPA_CACHE[UF]. Rampa de cor
   sequencial (uma matiz, mais escuro = mais valor), conforme o skill de
   dataviz: 6 degraus, família navy, validada contra o fundo branco do card.
   ========================================================================= */
const RSMAP_RAMP=[[188,218,240],[150,194,227],[110,168,211],[74,134,186],[44,104,158],[9,39,76]];
function rsMapColorAt(t){
  t=Math.max(0,Math.min(1,isFinite(t)?t:0));
  const n=RSMAP_RAMP.length-1;
  const pos=t*n;
  const i=Math.min(n-1,Math.floor(pos));
  const f=pos-i;
  const a=RSMAP_RAMP[i],b=RSMAP_RAMP[i+1];
  const r=Math.round(a[0]+(b[0]-a[0])*f);
  const g=Math.round(a[1]+(b[1]-a[1])*f);
  const bl=Math.round(a[2]+(b[2]-a[2])*f);
  return `rgb(${r},${g},${bl})`;
}
const MAPA_CACHE={};
// Ilhas longe da costa que espremeriam o mapa do estado: são desenhadas num quadro
// ampliado, logo à direita do continente (como nos mapas oficiais).
const MAPA_INSETS={'260545':{nome:'Fernando de Noronha',escala:3}};
function bboxDe(lista,tf){
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  lista.forEach(m=>m.polys.forEach(poly=>poly.forEach(ring=>ring.forEach(p=>{
    const [lon,lat]=tf?tf(m,p):p;
    if(lon<x0)x0=lon;if(lon>x1)x1=lon;if(lat<y0)y0=lat;if(lat>y1)y1=lat;
  }))));
  return{x0,x1,y0,y1};
}
function buildRsMapGeometry(){
  if(MAPA_CACHE[UF_ATUAL])return MAPA_CACHE[UF_ATUAL];
  const geo=PainelDados.geo(UF_ATUAL);
  const cont=geo.filter(m=>!MAPA_INSETS[m.id]),ilhas=geo.filter(m=>MAPA_INSETS[m.id]);
  // reposiciona cada ilha: canto de cima à direita do continente, ampliada
  const C=bboxDe(cont.length?cont:geo),gap=(C.x1-C.x0)*0.03;
  const tfIlha={};let ax=C.x1+gap;
  ilhas.forEach(m=>{
    // um pouco acima do topo do continente, para o nome caber em cima do quadro
    const I=bboxDe([m]),s=MAPA_INSETS[m.id].escala||1,x0=ax,y1=C.y1+(C.x1-C.x0)*0.045;
    tfIlha[m.id]=p=>[x0+(p[0]-I.x0)*s,y1+(p[1]-I.y1)*s];
    ax+=(I.x1-I.x0)*s+gap;
  });
  const tf=(m,p)=>tfIlha[m.id]?tfIlha[m.id](p):p;
  const B=bboxDe(geo,tf);
  const minLon=B.x0,maxLat=B.y1;
  // a correção de cosseno usa só o continente (as ilhas deslocadas não têm latitude real)
  const cosLat=Math.cos((C.y0+C.y1)/2*Math.PI/180);
  const W=640;
  const scale=W/((B.x1-B.x0)*cosLat);
  const H=(B.y1-B.y0)*scale;
  const px=p=>[(p[0]-minLon)*cosLat*scale,(maxLat-p[1])*scale];
  const paths=geo.map(m=>{
    const d=m.polys.map(poly=>poly.map(ring=>{
      const pts=ring.map(pt=>{const [x,y]=px(tf(m,pt));return x.toFixed(2)+','+y.toFixed(2);});
      return 'M'+pts.join('L')+'Z';
    }).join(' ')).join(' ');
    return{id:m.id,name:m.name,d};
  });
  // quadro tracejado em volta de cada ilha, com o nome
  const insets=ilhas.map(m=>{
    const I=bboxDe([m],tf),[x0,y0]=px([I.x0,I.y1]),[x1,y1]=px([I.x1,I.y0]),pad=6;
    return{x:x0-pad,y:y0-pad,w:x1-x0+2*pad,h:y1-y0+2*pad,nome:MAPA_INSETS[m.id].nome};
  });
  // espaço extra no alto do desenho para o nome das ilhas
  MAPA_CACHE[UF_ATUAL]={paths,W,H,insets,padTop:insets.length?20:8};
  return MAPA_CACHE[UF_ATUAL];
}
const MAP_METRICS=[
  {key:'trend',label:'Tendência vs. quadrimestre anterior'},
  {key:'gap',label:'Margem em aberto',fmt:v=>fmtBRL(v)},
  {key:'pct',label:'% do potencial atingido',fmt:v=>Math.round(v)+'%'},
  {key:'total',label:'Repasse atual',fmt:v=>fmtBRL(v)}
];
function mapMetricValue(r,key){
  if(key==='pct')return r.pct;
  if(key==='total')return r.last.total;
  return r.gap;
}
let mapMetric='trend';
let carteiraMapRows=[];
function hideMapTooltip(e){
  const tip=document.getElementById('rsmap-tooltip');
  if(tip)tip.style.display='none';
  if(e&&e.target&&e.target.classList)e.target.classList.remove('hovered');
}
function showMapTooltip(e,id,byIbge,metric){
  const r=byIbge[id];
  if(!r)return;
  const tip=document.getElementById('rsmap-tooltip');
  const outer=document.getElementById('rsmap-svg-outer');
  if(!tip||!outer)return;
  const rect=outer.getBoundingClientRect();
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const t=r.trend,d=!t||t.dir==null?'na':(t.dir>0?'up':t.dir<0?'dn':'eq');
  let h=`<div class="rsmap-tt-name">${esc(r.entry.nomeMuni)} — ${esc(r.entry.uf||'')}</div>`+
        (t&&t.ausente?'':`<div class="rsmap-tt-trend ${d}"><span aria-hidden="true">${d==='na'?'–':TREND_ICON[t.dir]}</span> ${esc(trendTexto(t))}</div>`);
  if(temAlertaEquipes(r.perda))h+=`<div class="rsmap-tt-warn"><span aria-hidden="true">⚠</span> ${esc(perdaTexto(r.perda))}</div>`;
  if(metric.key!=='trend')h+=`<div class="rsmap-tt-val">${esc(metric.label)}: ${esc(metric.fmt(mapMetricValue(r,metric.key)))}</div>`;
  else h+=`<div class="rsmap-tt-val">Repasse ${esc(qCode(r.last.quad))}: ${fmtBRL(r.last.total)}/mês</div>`;
  h+=`<div class="rsmap-tt-hint">Clique para ver os detalhes</div>`;
  tip.innerHTML=h;
  // posiciona dentro da área do mapa (vira para a esquerda perto da borda direita)
  const byPointer=e.type!=='focus'&&e.clientX!=null;
  const tr=e.target.getBoundingClientRect();
  let x=byPointer?e.clientX-rect.left+14:(tr.left-rect.left+tr.width/2);
  let y=byPointer?e.clientY-rect.top-10:(tr.top-rect.top);
  tip.style.display='block';
  const tw=tip.offsetWidth;
  if(x+tw>rect.width-6)x=Math.max(0,x-tw-28);
  tip.style.left=x+'px';
  tip.style.top=Math.max(y,0)+'px';
  outer.querySelectorAll('path.hovered').forEach(p=>p.classList.remove('hovered'));
  if(e.target&&e.target.classList)e.target.classList.add('hovered');
}
function renderMapLegend(metric,min,max,rows){
  const el=document.getElementById('rsmap-legend');
  const title=document.getElementById('rsmap-legend-title');
  if(!el)return;
  if(metric.key==='trend'&&trendFilter==='perda'){
    if(title)title.textContent='Impacto estimado das equipes a menos';
    const C=perdaColors(),cnt={};
    rows.filter(r=>temAlertaEquipes(r.perda)).forEach(r=>{const k=perdaBin(r.perda);cnt[k]=(cnt[k]||0)+1;});
    el.innerHTML='<ul class="rsmap-legend-list">'+PERDA_BINS.map(b=>
      `<li><span class="rsmap-swatch" style="background:${C[b.k]}"></span><span class="lg-ic warn" aria-hidden="true">⚠</span><span class="lg-l">${b.label}</span><span class="lg-n">${cnt[b.k]||0}</span></li>`).join('')+
      '</ul><div class="lg-note">Os demais municípios ficam esmaecidos. "Mostrar todos", acima do mapa, volta à tendência.</div>';
    return;
  }
  if(metric.key==='trend'){
    if(title)title.textContent='Tendência';
    const C=trendColors(),cnt={};
    rows.forEach(r=>{const k=trendBin(r.trend);cnt[k]=(cnt[k]||0)+1;});
    // rótulos curtos para a legenda caber numa linha embaixo do mapa (o texto completo fica no title)
    const CURTO={up3:'mais de +5%',up2:'+2% a +5%',up1:'até +2%',eq:'igual',dn1:'até −2%',dn2:'−2% a −5%',dn3:'mais de −5%',na:'sem anterior',aus:'fora do relatório'};
    el.innerHTML='<ul class="rsmap-legend-list lg-curta">'+TREND_BINS.filter(b=>(b.k!=='na'&&b.k!=='aus')||cnt[b.k]).map(b=>
      `<li title="${b.label}: ${cnt[b.k]||0} municípios"><span class="rsmap-swatch" style="background:${C[b.k]}"></span><span class="lg-l">${CURTO[b.k]||b.label}</span><span class="lg-n">${cnt[b.k]||0}</span></li>`).join('')+'</ul>';
    return;
  }
  if(title)title.textContent='Legenda';
  el.innerHTML=`<div class="rsmap-legend-grad"></div><div class="rsmap-legend-labels"><span>${metric.fmt(min)}</span><span>${metric.fmt(max)}</span></div>`;
}
function renderCarteiraMap(rows){
  const outer=document.getElementById('rsmap-svg-outer');
  const wrap=document.getElementById('rsmap-svg-wrap');
  if(!outer||!wrap)return;
  carteiraMapRows=rows;
  const geo=buildRsMapGeometry();
  const byIbge={};
  rows.forEach(r=>{const ibge=String(r.entry.ibge||'').trim();if(ibge)byIbge[ibge]=r;});
  const metric=MAP_METRICS.find(m=>m.key===mapMetric)||MAP_METRICS[0];
  const isTrend=metric.key==='trend';
  const vals=isTrend?[]:rows.map(r=>mapMetricValue(r,metric.key));
  const min=vals.length?Math.min(...vals):0;
  const max=vals.length?Math.max(...vals):1;
  const span=(max-min)||1;
  const TC=trendColors(),PC=perdaColors();
  const perdaMode=isTrend&&trendFilter==='perda';
  let svg=`<svg viewBox="-8 ${-geo.padTop} ${(geo.W+16).toFixed(1)} ${(geo.H+8+geo.padTop).toFixed(1)}" role="img" aria-label="Mapa ${nomeComPrep(UF_ATUAL)}, municípios coloridos por ${metric.label.toLowerCase()}. A tabela de ranking abaixo traz os mesmos dados.">`;
  geo.paths.forEach(p=>{
    const r=byIbge[p.id];
    let fill=cssVar('--map-nodata-fill')||'#e7ecef',cls='rsmap-muni';
    if(r){
      fill=perdaMode&&temAlertaEquipes(r.perda)?PC[perdaBin(r.perda)]:isTrend?TC[trendBin(r.trend)]:rsMapColorAt((mapMetricValue(r,metric.key)-min)/span);
      cls+=' has-data';
      if(!trendMatch(r))cls+=' dim';
    }
    const lbl=r?`${r.entry.nomeMuni}: ${trendTexto(r.trend)}`:'';
    svg+=`<path class="${cls}" fill-rule="evenodd" d="${p.d}" fill="${fill}" data-id="${p.id}" tabindex="${r?'0':'-1'}" role="${r?'button':'presentation'}"${r?` aria-label="${lbl.replace(/"/g,'&quot;')}"`:''}></path>`;
  });
  (geo.insets||[]).forEach(b=>{svg+=`<rect class="rsmap-inset" x="${b.x.toFixed(1)}" y="${b.y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" rx="4"></rect><text class="rsmap-inset-l" x="${(b.x+b.w).toFixed(1)}" y="${(b.y-4).toFixed(1)}">${b.nome}</text>`;});
  svg+='</svg>';
  wrap.innerHTML=svg;
  renderMapLegend(metric,min,max,rows);
  wrap.querySelectorAll('path.has-data').forEach(el=>{
    el.addEventListener('pointermove',e=>showMapTooltip(e,el.dataset.id,byIbge,metric));
    el.addEventListener('pointerleave',hideMapTooltip);
    el.addEventListener('focus',e=>showMapTooltip(e,el.dataset.id,byIbge,metric));
    el.addEventListener('blur',hideMapTooltip);
    // clique/Enter SELECIONA (painel ao lado); o relatório abre pelo botão do painel ou duplo clique
    el.addEventListener('click',()=>selectMapMuni(el.dataset.id));
    el.addEventListener('dblclick',()=>{const r=byIbge[el.dataset.id];if(r)openFromCarteira(r.entry.id);});
    el.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();selectMapMuni(el.dataset.id,{focus:true});}
      if(e.key==='Escape'){selectMapMuni(null);}
    });
  });
  if(mapSelId&&!byIbge[mapSelId])mapSelId=null;
  selectMapMuni(mapSelId);
  renderMapSearch(rows);
}
document.addEventListener('DOMContentLoaded',()=>{
  const metricsBar=document.getElementById('rsmap-metrics');
  if(metricsBar){
    metricsBar.querySelectorAll('.map-metric-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        mapMetric=btn.dataset.metric;
        metricsBar.querySelectorAll('.map-metric-btn').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',b===btn);});
        renderCarteiraMap(carteiraMapRows);
      });
    });
  }
});
