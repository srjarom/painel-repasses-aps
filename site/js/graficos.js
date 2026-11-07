// gráficos com a fonte de texto oficial (IBM Plex Sans, carregada em css/painel.css)
if(window.Chart)Chart.defaults.font.family="'IBM Plex Sans','Segoe UI',system-ui,Arial,sans-serif";
/* Gráficos e tabelas da tela do município (Chart.js). */

/* =========================================================================
   EVOLUÇÃO DO REPASSE (v4.6.0)
   Duas visões, na chave do cartão:
   - "Evolução" (padrão): a curva do repasse mensal, com a escala ajustada aos valores
     (uma linha não precisa partir do zero — assim a variação fica visível), a linha do
     potencial e, entre as duas, a faixa da margem em aberto. O valor do primeiro e do
     último quadrimestre aparece escrito no gráfico; o resumo do crescimento vai no alto.
   - "Composição": as barras empilhadas Fixo/IED + Vínculo + Qualidade (partem do zero).
   ========================================================================= */
let evoModo='curva';
function evoCores(){
  const dark=currentTheme()==='dark';
  return dark
    ?{linha:'#bcd6f0',pot:'#8fd19e',faixa:'rgba(154,206,69,.16)',anel:'#111f2e',fixo:'#4f7fb8',vin:'#6FBFD1',qual:'#9ACE45'}
    :{linha:'#09274C',pot:'#2f7d3a',faixa:'rgba(154,206,69,.22)',anel:'#ffffff',fixo:'#09274C',vin:'#6FBFD1',qual:'#9ACE45'};
}
function renderEvoResumo(res){
  const el=document.getElementById('evo-resumo'),nota=document.getElementById('evo-nota');
  const f=res[0],l=res[res.length-1];
  if(el){
    const gap=Math.max(0,l.potencial-l.total);
    let h=`<b>${fmtBRLcurto(l.total)}/mês</b> em ${abbrevQuad(l.quad)}`;
    if(res.length>1){
      // primeiro a variação mais recente (é a que pesa agora), depois a do período todo
      const a=res[res.length-2],d1=l.total-a.total,p1=a.total>0?d1/a.total*100:null;
      h+=` · ${fmtVar(Math.round(d1),p1)} vs ${abbrevQuad(a.quad)}`;
      if(res.length>2){const d=l.total-f.total,p=f.total>0?d/f.total*100:null;h+=` · ${fmtVar(Math.round(d),p)} desde ${abbrevQuad(f.quad)}`;}
    }
    h+=` · <span class="evo-gap">margem em aberto ${fmtBRLcurto(gap)}/mês</span>`;
    el.innerHTML=h;
  }
  if(nota)nota.textContent=evoModo==='curva'
    ?'A faixa verde é a margem em aberto: o que ainda dá para ganhar por mês se todas as equipes chegarem a "Ótimo". A escala começa perto dos valores do município, para a variação aparecer.'
    :'Fixo/IED depende só do número de equipes e do estrato; o que muda com o desempenho das equipes é o Vínculo (CVAT) e a Qualidade.';
}
// escreve o valor do 1º e do último ponto da curva (rótulos seletivos, não em todo ponto)
const evoRotulos={id:'evoRotulos',afterDatasetsDraw(chart){
  if(evoModo!=='curva')return;
  const meta=chart.getDatasetMeta(0),ds=chart.data.datasets[0];if(!meta||!meta.data.length)return;
  const ctx=chart.ctx,tc=chartThemeColors(),n=meta.data.length;
  ctx.save();ctx.font="700 12px 'IBM Plex Sans',system-ui,sans-serif";ctx.fillStyle=tc.text;ctx.textBaseline='bottom';
  [...new Set([0,n-1])].forEach(i=>{
    const pt=meta.data[i];ctx.textAlign=i===0&&n>1?'left':i===n-1&&n>1?'right':'center';
    ctx.fillText(fmtBRLcurto(ds.data[i]),pt.x+(ctx.textAlign==='left'?-6:ctx.textAlign==='right'?6:0),pt.y-10);
  });
  ctx.restore();
}};
function chartRepasse(res){
  if(charts.r)charts.r.destroy();
  const tc=chartThemeColors(),C=evoCores();
  renderEvoResumo(res);
  const labels=res.map(r=>r.quad),xTicks={color:tc.text,maxRotation:0,minRotation:0,callback:(v,i)=>abbrevQuad(res[i].quad)};
  const tipTitulo=items=>quadLabel(res[items[0].dataIndex].quad);
  if(evoModo==='curva'){
    const tot=res.map(r=>r.total),pot=res.map(r=>r.potencial);
    const mn=Math.min(...tot),mx=Math.max(...pot),pad=Math.max((mx-mn)*0.35,mx*0.03);
    charts.r=new Chart(document.getElementById('chart-repasse'),{type:'line',
      data:{labels,datasets:[
        {label:'Repasse mensal',data:tot,borderColor:C.linha,backgroundColor:C.linha,borderWidth:3,tension:.3,
         pointRadius:5,pointHoverRadius:7,pointBackgroundColor:C.linha,pointBorderColor:C.anel,pointBorderWidth:2,fill:false,order:1},
        {label:'Potencial (tudo Ótimo)',data:pot,borderColor:C.pot,borderDash:[6,5],borderWidth:2,tension:.3,pointRadius:0,pointHoverRadius:4,
         fill:{target:0,above:C.faixa,below:'transparent'},order:2}
      ]},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        layout:{padding:{top:22,left:6,right:10}},
        scales:{
          x:{grid:{display:false},ticks:xTicks,offset:true},
          y:{suggestedMin:Math.max(0,mn-pad),suggestedMax:mx+pad*0.3,ticks:{color:tc.text,maxTicksLimit:5,callback:v=>fmtBRLcurto(v)},grid:{color:tc.grid},border:{display:false}}
        },
        plugins:{
          legend:{position:'bottom',labels:{color:tc.text,usePointStyle:true,boxWidth:10,boxHeight:10}},
          tooltip:{callbacks:{title:tipTitulo,
            label:c=>`${c.dataset.label}: ${fmtBRL(c.parsed.y)}/mês`,
            afterBody:items=>{const i=items[0].dataIndex,r=res[i],p=i?res[i-1]:null;
              const out=[`Margem em aberto: ${fmtBRL(Math.max(0,r.potencial-r.total))}/mês`];
              if(p){const d=r.total-p.total;out.push(`${d>=0?'▲':'▼'} ${fmtBRL(Math.abs(d))}/mês vs ${abbrevQuad(p.quad)}`);}
              return out;}}}}},
      plugins:[evoRotulos]});
    return;
  }
  charts.r=new Chart(document.getElementById('chart-repasse'),{type:'bar',
    data:{labels,datasets:[
      {label:'Fixo/IED',data:res.map(r=>r.fixo),backgroundColor:C.fixo,stack:'s',borderRadius:3,borderSkipped:false,borderColor:C.anel,borderWidth:{top:2}},
      {label:'Vínculo (CVAT)',data:res.map(r=>r.vin),backgroundColor:C.vin,stack:'s',borderRadius:3,borderSkipped:false,borderColor:C.anel,borderWidth:{top:2}},
      {label:'Qualidade',data:res.map(r=>r.qual),backgroundColor:C.qual,stack:'s',borderRadius:3,borderSkipped:false},
      {label:'Potencial (tudo Ótimo)',data:res.map(r=>r.potencial),type:'line',borderColor:C.pot,borderDash:[6,5],borderWidth:2,pointRadius:3,pointBackgroundColor:C.pot,fill:false}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      scales:{
        x:{stacked:true,grid:{display:false},ticks:xTicks},
        y:{stacked:true,ticks:{color:tc.text,maxTicksLimit:5,callback:v=>fmtBRLcurto(v)},grid:{color:tc.grid},border:{display:false}}
      },
      plugins:{legend:{position:'bottom',labels:{color:tc.text,boxWidth:12,boxHeight:12}},
        tooltip:{callbacks:{title:tipTitulo,label:c=>c.dataset.label+': '+fmtBRL(c.parsed.y)+'/mês'}}}}});
}
(function initEvoModo(){
  const bar=document.getElementById('evo-modo');if(!bar)return;
  bar.querySelectorAll('.map-metric-btn').forEach(b=>{
    const go=()=>{evoModo=b.dataset.modo;bar.querySelectorAll('.map-metric-btn').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});
      if(typeof lastRes!=='undefined'&&lastRes)chartRepasse(lastRes);};
    b.addEventListener('click',go);
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
  });
})();
function fmtPerda(v){
  return v>0?`<span style="color:var(--regular);font-weight:600;">− ${fmtBRL(v)}</span>`:'—';
}
function tblRepasse(res){
  const t=document.getElementById('tbl-repasse');
  let h='<thead><tr><th>Quadrim.</th><th>Fixo/IED</th><th>CVAT</th><th>Qualidade</th><th>Total</th><th>Perda/mês¹</th></tr></thead><tbody>';
  res.forEach((r,i)=>{const c=i===res.length-1?' class="hl"':'';h+=`<tr${c}><td>${r.quad}</td><td>${fmtBRL(r.fixo)}</td><td>${fmtBRL(r.vin)}</td><td>${fmtBRL(r.qual)}</td><td>${fmtBRL(r.total)}</td><td>${fmtPerda(r.gap)}</td></tr>`;});
  const l=res[res.length-1];
  h+=`<tr class="total"><td>Potencial máximo</td><td>${fmtBRL(l.fixo)}</td><td>${fmtBRL(l.vinOt)}</td><td>${fmtBRL(l.qualOt)}</td><td>${fmtBRL(l.potencial)}</td><td>—</td></tr></tbody>`;
  t.innerHTML=h;
  const card=t.closest('.card');
  let note=card&&card.querySelector('.tbl-repasse-note');
  if(card&&!note){
    note=document.createElement('p');
    note.className='tbl-repasse-note';
    note.style.cssText='margin:10px 22px 16px;font-size:11.5px;color:var(--muted);';
    card.appendChild(note);
  }
  if(note)note.textContent='¹ Diferença entre o repasse potencial (tudo "Ótimo") e o repasse efetivamente recebido naquele quadrimestre — a parte que já ficou para trás e não é mais recuperável, só evitável dali em diante.';
}
// Equipes no relatório e Componente Fixo/IED por tipo — explica de onde vem cada variação do Fixo
function tblEquipesFixo(res){
  const t=document.getElementById('tbl-equipes-fixo');if(!t)return;
  const tipos=TIPOS_EQUIPE;
  const cont=r=>Object.fromEntries(TIPOS_EQUIPE.map(t=>[t.k,r.byType[t.k].n]));
  const usados=tipos.filter(tp=>res.some(r=>r.byType[tp.k].n>0));
  let h='<thead><tr><th>Quadrim.</th>'+usados.map(tp=>`<th>${tp.l}</th>`).join('')+'<th>Fixo/IED</th></tr></thead><tbody>';
  res.forEach((r,i)=>{
    const c=cont(r),pc=i?cont(res[i-1]):null,pr=i?res[i-1]:null;
    const cel=tp=>{
      const n=c[tp.k],d=pc?n-pc[tp.k]:0,fx=r.byType[tp.k].fixo,dfx=pr?Math.round(fx)-Math.round(pr.byType[tp.k].fixo):0;
      const dTxt=d?`<span class="eqf-d ${d>0?'up':'dn'}">${d>0?'+':'−'}${Math.abs(d)}</span>`:'';
      const fTxt=dfx?`<div class="eqf-v">${dfx>0?'+':'−'}${fmtBRL(Math.abs(dfx))}</div>`:'';
      return`<td>${n}${dTxt}${fTxt}</td>`;
    };
    const dF=pr?Math.round(r.fixo)-Math.round(pr.fixo):0;
    h+=`<tr${i===res.length-1?' class="hl"':''}><td>${r.quad}</td>${usados.map(cel).join('')}<td>${fmtBRL(r.fixo)}${dF?`<div class="eqf-v ${dF>0?'up':'dn'}">${dF>0?'+':'−'}${fmtBRL(Math.abs(dF))}</div>`:''}</td></tr>`;
  });
  t.innerHTML=h+'</tbody>';
}
function chartClass(res){
  if(charts.c)charts.c.destroy();
  const tc=chartThemeColors();
  const agg=res.map(r=>{const t={};TIPOS_EQUIPE.map(t=>t.k).forEach(k=>Object.entries(r.cd[k]).forEach(([c,n])=>t[c]=(t[c]||0)+n));return t;});
  charts.c=new Chart(document.getElementById('chart-class'),{type:'bar',
    data:{labels:res.map(r=>r.quad),datasets:CO.map(c=>({label:c,data:agg.map(a=>a[c]||0),backgroundColor:CC[c],stack:'s',borderRadius:3}))},
    options:{responsive:true,scales:{
        x:{stacked:true,grid:{display:false},ticks:{color:tc.text,maxRotation:0,minRotation:0,callback:(v,i)=>abbrevQuad(res[i].quad)}},
        y:{stacked:true,ticks:{color:tc.text,maxTicksLimit:6,precision:0},grid:{color:tc.grid},title:{display:true,text:'equipes',color:tc.text}}
      },
      plugins:{legend:{display:false},tooltip:{mode:'index'}}}});
}
