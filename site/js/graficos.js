// gráficos com a fonte de texto oficial (IBM Plex Sans, carregada em css/painel.css)
if(window.Chart)Chart.defaults.font.family="'IBM Plex Sans','Segoe UI',system-ui,Arial,sans-serif";
/* Gráficos e tabelas da tela do município (Chart.js). */

function chartRepasse(res){
  if(charts.r)charts.r.destroy();
  const tc=chartThemeColors();
  charts.r=new Chart(document.getElementById('chart-repasse'),{type:'bar',
    data:{labels:res.map(r=>r.quad),datasets:[
      {label:'Fixo/IED',data:res.map(r=>r.fixo),backgroundColor:'#09274C',stack:'s',borderRadius:3},
      {label:'Vínculo (CVAT)',data:res.map(r=>r.vin),backgroundColor:'#6FBFD1',stack:'s',borderRadius:3},
      {label:'Qualidade',data:res.map(r=>r.qual),backgroundColor:'#9ACE45',stack:'s',borderRadius:3},
      {label:'Potencial (tudo Ótimo)',data:res.map(r=>r.potencial),type:'line',borderColor:'#015840',borderDash:[5,4],borderWidth:2,pointRadius:3,pointBackgroundColor:'#015840',fill:false}
    ]},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{
        x:{stacked:true,grid:{display:false},ticks:{color:tc.text,maxRotation:0,minRotation:0,callback:(v,i)=>abbrevQuad(res[i].quad)}},
        y:{stacked:true,ticks:{color:tc.text,maxTicksLimit:6,callback:v=>fmtBRL(v)},grid:{color:tc.grid}}
      },
      plugins:{legend:{position:'bottom',labels:{color:tc.text}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmtBRL(c.parsed.y)}}}}});
}
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
  const tipos=[{k:'esf',l:'eSF'},{k:'eap',l:'eAP'},{k:'esb',l:'eSB'},{k:'emulti',l:'eMulti'}];
  const cont=r=>({esf:r.byType.esf.n,eap:r.byType.eap.n,esb:r.byType.esb.n,emulti:r.byType.emulti.n});
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
  const agg=res.map(r=>{const t={};['esf','eap','esb','emulti'].forEach(k=>Object.entries(r.cd[k]).forEach(([c,n])=>t[c]=(t[c]||0)+n));return t;});
  charts.c=new Chart(document.getElementById('chart-class'),{type:'bar',
    data:{labels:res.map(r=>r.quad),datasets:CO.map(c=>({label:c,data:agg.map(a=>a[c]||0),backgroundColor:CC[c],stack:'s',borderRadius:3}))},
    options:{responsive:true,scales:{
        x:{stacked:true,grid:{display:false},ticks:{color:tc.text,maxRotation:0,minRotation:0,callback:(v,i)=>abbrevQuad(res[i].quad)}},
        y:{stacked:true,ticks:{color:tc.text,maxTicksLimit:6,precision:0},grid:{color:tc.grid},title:{display:true,text:'equipes',color:tc.text}}
      },
      plugins:{legend:{display:false},tooltip:{mode:'index'}}}});
}
