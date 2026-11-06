/* Alerta de equipes a menos no relatório do SIAPS (o que derruba o Componente Fixo/IED). */

/* =========================================================================
   ALERTA DE EQUIPES A MENOS (v1.29.0)
   -------------------------------------------------------------------------
   No painel, o Componente Fixo/IED é (nº de equipes no relatório do SIAPS) ×
   (valor por equipe do estrato/modalidade) — então, quando o Fixo cai, é
   sempre porque há menos equipes no relatório. Causas possíveis: equipe
   descredenciada/desativada no CNES, suspensa por falta de envio de produção,
   não avaliada no quadrimestre, ou dado preliminar. Este módulo compara a
   contagem de equipes por tipo entre quadrimestres e:
   - desconta conversões eAP ↔ eSF (ex.: eAP que virou eSF não é equipe perdida);
   - separa a perda RECENTE (vs. quadrimestre anterior) da perda que JÁ VINHA de
     antes e não voltou (vs. o maior número dos quadrimestres anteriores);
   - marca o município que nem aparece no relatório mais recente da carteira;
   - estima o impacto em R$/mês: equipes a menos × valor médio por equipe
     daquele tipo no quadrimestre em que elas ainda estavam lá.
   ========================================================================= */
const PERDA_TIPOS=TIPOS_EQUIPE.map(t=>({k:t.k,lbl:t.l}));
let carteiraRefKey=0; // quadrimestre mais recente entre todos os municípios da carteira
function equipesPorQuad(rows){
  // soma cada coluna do relatório no quadrimestre e só depois pega o maior entre Vínculo e
  // Qualidade (o mesmo nº de equipes aparece distribuído por classificações diferentes em cada um)
  const by=new Map();
  (rows||[]).forEach(r=>{
    const k=quadKey(r.quad);if(!k)return;
    if(!by.has(k))by.set(k,{quad:r.quad,key:k,s:{vEsf:0,qEsf:0,vEap:0,qEap:0,qEsb:0,qEmulti:0,qEsfr:0,qEapp:0,qEcr:0}});
    const e=by.get(k);Object.keys(e.s).forEach(c=>e.s[c]+=(+r[c]||0));
  });
  return[...by.values()].sort((a,b)=>a.key-b.key).map(e=>({quad:e.quad,key:e.key,
    c:{esf:Math.max(e.s.vEsf,e.s.qEsf),eap:Math.max(e.s.vEap,e.s.qEap),esb:e.s.qEsb,emulti:e.s.qEmulti,
      esfr:e.s.qEsfr,eapp:e.s.qEapp,ecr:e.s.qEcr}}));
}
// diferença por tipo (atual − base), descontando conversões entre eAP e eSF
function difEquipes(base,atual){
  const d={};PERDA_TIPOS.forEach(t=>d[t.k]=atual[t.k]-base[t.k]);
  let conv=null;
  if(d.eap<0&&d.esf>0){const m=Math.min(-d.eap,d.esf);d.eap+=m;d.esf-=m;conv={de:'eAP',para:'eSF',n:m};}
  else if(d.esf<0&&d.eap>0){const m=Math.min(-d.esf,d.eap);d.esf+=m;d.eap-=m;conv={de:'eSF',para:'eAP',n:m};}
  return{d,conv};
}
function analisarPerdaEquipes(res,rows,refKey){
  const serie=equipesPorQuad(rows);
  if(!serie.length)return null;
  const last=serie[serie.length-1];
  const resBy=new Map(res.map(r=>[quadKey(r.quad),r]));
  // valor médio por equipe de um tipo num quadrimestre (fixo + vínculo + qualidade)
  const vEq=(key,k)=>{const r=resBy.get(key);const t=r&&r.byType[k];return t&&t.n>0?t.total/t.n:0;};
  const out={ausente:null,recente:[],antiga:[],conv:[],ganhos:[],impacto:0,quedaFixo:0,serie,quad:last.quad,prevQuad:null,baseQuad:null};
  const total=c=>PERDA_TIPOS.reduce((s,t)=>s+c[t.k],0);
  if(refKey&&last.key<refKey){
    const r=resBy.get(last.key);
    out.ausente={ultimo:last.quad,ref:qCodeKey(refKey),equipes:total(last.c),repasse:r?r.total:0};
    out.impacto=out.ausente.repasse;
  }
  if(serie.length<2)return out;
  const prev=serie[serie.length-2];
  out.prevQuad=prev.quad;
  const rec=difEquipes(prev.c,last.c);
  if(rec.conv)out.conv.push({...rec.conv,quad:last.quad});
  PERDA_TIPOS.forEach(t=>{
    if(rec.d[t.k]<0){
      const n=-rec.d[t.k];
      const imp=n*vEq(prev.key,t.k);
      out.recente.push({tipo:t.lbl,k:t.k,n,de:prev.c[t.k],para:last.c[t.k],desde:last.quad,impacto:imp});
      if(!out.ausente)out.impacto+=imp;
    }
  });
  // perda que já vinha de antes e não voltou: compara com o maior nº dos quadrimestres anteriores ao anterior
  const antes=serie.slice(0,-2);
  if(antes.length){
    const pico=Object.fromEntries(PERDA_TIPOS.map(t=>[t.k,0])),picoQ={};
    antes.forEach(s=>PERDA_TIPOS.forEach(t=>{if(s.c[t.k]>=pico[t.k]){pico[t.k]=s.c[t.k];picoQ[t.k]=s;}}));
    const old=difEquipes(pico,prev.c); // o que já tinha caído até o quadrimestre anterior…
    PERDA_TIPOS.forEach(t=>{
      const jaCaiu=Math.max(0,-old.d[t.k]);
      const voltou=Math.max(0,rec.d[t.k]);
      const n=Math.max(0,jaCaiu-voltou); // …e ainda não voltou agora
      if(n>0){
        const ps=picoQ[t.k],idx=serie.indexOf(ps);
        const desde=serie[idx+1]?serie[idx+1].quad:prev.quad;
        const imp=n*vEq(ps.key,t.k);
        out.antiga.push({tipo:t.lbl,k:t.k,n,de:ps.c[t.k],deQuad:ps.quad,para:last.c[t.k],desde,impacto:imp});
        if(!out.ausente)out.impacto+=imp;
      }
    });
  }
  const rl=res[res.length-1],rp=resBy.get(prev.key);
  if(rl&&rp)out.quedaFixo=Math.max(0,Math.round(rp.fixo)-Math.round(rl.fixo));
  // equipes que ENTRARAM no mesmo período (outro tipo de equipe pode compensar a perda no Fixo/IED).
  // Base: o quadrimestre mais antigo envolvido na perda (pico da perda antiga) ou o anterior.
  if(out.recente.length||out.antiga.length){
    let base=prev;
    out.antiga.forEach(x=>{const s=serie.find(z=>z.quad===x.deQuad);if(s&&s.key<base.key)base=s;});
    const dif=difEquipes(base.c,last.c);
    out.baseQuad=base.quad;
    out.ganhos=PERDA_TIPOS.filter(t=>dif.d[t.k]>0).map(t=>({tipo:t.lbl,k:t.k,n:dif.d[t.k],de:base.c[t.k],para:last.c[t.k],valor:dif.d[t.k]*vEq(last.key,t.k)}));
    const rb=resBy.get(base.key);
    if(rb&&rl){out.fixoBase=Math.round(rb.fixo);out.fixoAtual=Math.round(rl.fixo);out.totalBase=Math.round(rb.total);out.totalAtual=Math.round(rl.total);}
  }
  return out;
}
function temAlertaEquipes(p){return!!(p&&(p.ausente||p.recente.length||p.antiga.length));}
function perdaChips(p){
  if(!p)return'';
  if(p.ausente)return`<span class="eq-chip aus">Fora do relatório de ${p.ausente.ref}</span>`;
  return p.recente.map(x=>`<span class="eq-chip">−${x.n} ${x.tipo}</span>`).join('')+
         p.antiga.map(x=>`<span class="eq-chip old">−${x.n} ${x.tipo} desde ${qCode(x.desde)}</span>`).join('')+
         (p.ganhos||[]).map(x=>`<span class="eq-chip gain" title="Equipes que entraram no mesmo período">+${x.n} ${x.tipo}</span>`).join('');
}
// "mas entraram outras equipes": compensação no mesmo período e saldo do Fixo/IED (tela, tabela e PDF)
function perdaCompensacao(p,pdf){
  if(!p||p.ausente||!p.ganhos||!p.ganhos.length)return'';
  const g=p.ganhos.map(x=>`${x.n} ${x.tipo} (eram ${x.de}, agora ${x.para})`).join(', ');
  const val=p.ganhos.reduce((a,x)=>a+x.valor,0);
  const sf=p.fixoAtual-p.fixoBase,st=p.totalAtual-p.totalBase;
  const sinal=v=>(v>0?'+':v<0?(pdf?'-':'−'):'')+fmtBRL(Math.abs(v));
  let t=`No mesmo período (desde ${qCode(p.baseQuad)}) entraram ${g}, cerca de +${fmtBRL(val)}/mês. `;
  t+=`Saldo no Componente Fixo/IED: ${sf===0?'sem alteração':sinal(sf)+'/mês'} (${fmtBRL(p.fixoBase)} ${pdf?'para':'→'} ${fmtBRL(p.fixoAtual)})`;
  if(st>=0)t+=pdf?`; o repasse total ${st>0?'subiu '+fmtBRL(st)+'/mês':'ficou igual'} no período, porque a entrada dessas equipes compensou a saída`
    :`; o repasse total ${st>0?'subiu '+fmtBRL(st)+'/mês':'ficou igual'}, ou seja, a perda foi compensada por equipes de outro tipo — mas a equipe que saiu continua valendo a conversa com o município`;
  return t+'.';
}
// frase curta (tooltip, painel, PDF): "2 eSB a menos que no 2026Q1; 1 eMulti a menos desde 2026Q1"
function perdaTexto(p){
  if(!p)return'';
  if(p.ausente)return`Não aparece no relatório de ${p.ausente.ref} (último dado: ${qCode(p.ausente.ultimo)}, ${p.ausente.equipes} equipe${p.ausente.equipes!==1?'s':''})`;
  const a=p.recente.map(x=>`${x.n} ${x.tipo} a menos que no ${qCode(p.prevQuad)} (eram ${x.de}, agora ${x.para})`);
  const b=p.antiga.map(x=>`${x.n} ${x.tipo} a menos desde ${qCode(x.desde)} (eram ${x.de} em ${qCode(x.deQuad)})`);
  return[...a,...b].join('; ');
}
const PERDA_CAUSAS='Possíveis causas: equipe descredenciada ou desativada no CNES, suspensa por falta de envio de produção, não avaliada no quadrimestre, ou dado ainda preliminar no SIAPS. Vale conferir no e-Gestor AB (pagamento por equipe) e no CNES antes de falar com o município.';

let perdaVerTodos=false;
function renderAlertaCarteira(rows){
  const el=document.getElementById('alerta-equipes-card');if(!el)return;
  const com=rows.filter(r=>temAlertaEquipes(r.perda));
  if(!com.length){el.style.display='none';return;}
  el.style.display='block';
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const aus=com.filter(r=>r.perda.ausente);
  const rec=com.filter(r=>!r.perda.ausente&&r.perda.recente.length);
  const old=com.filter(r=>!r.perda.ausente&&!r.perda.recente.length&&r.perda.antiga.length);
  const porTipo={};rec.forEach(r=>r.perda.recente.forEach(x=>porTipo[x.tipo]=(porTipo[x.tipo]||0)+x.n));
  const impRec=rec.reduce((s,r)=>s+r.perda.recente.reduce((a,x)=>a+x.impacto,0),0);
  const pares=new Map();rec.forEach(r=>{const k=`${qCode(r.perda.prevQuad)} → ${qCode(r.perda.quad)}`;pares.set(k,(pares.get(k)||0)+1);});
  const per=[...pares.entries()].sort((a,b)=>b[1]-a[1])[0];
  const lista=[...com].sort((a,b)=>(b.perda.ausente?1:0)-(a.perda.ausente?1:0)||b.perda.impacto-a.perda.impacto);
  const mostrar=perdaVerTodos?lista:lista.slice(0,20);
  const cli=clientesSet();
  // v4.4.1: cabeçalho de uma linha (com o atalho para o mapa) e resumo em três pílulas
  let h=`<div class="card-h ch-row ae-head"><div><h3><span class="ae-ic" aria-hidden="true">⚠</span> Possível perda de equipes</h3>
    <p>Menos equipes no relatório do SIAPS do que antes — é o que derruba o Componente Fixo/IED.</p></div>
    <button type="button" class="ae-ver-mapa" onclick="setTrendFilter('perda')">${trendFilter==='perda'?'✓ Filtrando o mapa e o ranking':'Ver só esses no mapa'}</button></div>
    <div class="card-b">
    <div class="ae-sum">`;
  if(aus.length)h+=`<div class="ae-stat aus" title="${esc(aus.map(r=>r.entry.nomeMuni).join(', '))}"><b>${aus.length}</b> fora do relatório de ${esc(aus[0].perda.ausente.ref)}<span>${fmtBRL(aus.reduce((s,r)=>s+r.perda.ausente.repasse,0))}/mês em risco</span></div>`;
  if(rec.length)h+=`<div class="ae-stat" title="${esc(Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`−${n} ${t}`).join(' · '))}"><b>${rec.length}</b> com equipes a menos${per?' em '+esc(per[0].split(' → ')[1]||per[0]):''}<span>impacto estimado −${fmtBRL(impRec)}/mês</span></div>`;
  if(old.length)h+=`<div class="ae-stat old"><b>${old.length}</b> com perda anterior que não voltou<span>saíram antes e seguem fora</span></div>`;
  h+=`</div>
    <div style="overflow-x:auto;"><table class="grid ae-table"><thead><tr><th>Município</th><th>O que mudou</th><th>Equipes por quadrimestre</th><th class="n">Impacto/mês</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>`;
  mostrar.forEach(r=>{
    const p=r.perda;
    const tipos=p.ausente?PERDA_TIPOS.filter(t=>p.serie.some(s=>s.c[t.k]>0)):PERDA_TIPOS.filter(t=>[...p.recente,...p.antiga,...(p.ganhos||[])].some(x=>x.k===t.k));
    const hist=tipos.map(t=>`<span class="ae-hist">${t.lbl}: ${p.serie.map(s=>s.c[t.k]).join(' → ')}${p.ausente?' → —':''}</span>`).join('');
    const tag=cli.has(String(r.entry.id))?' <span class="cli-tag">cliente</span>':'';
    // os quadrimestres da série ficam na dica (title) da célula, em vez de uma linha a mais por município
    const quads=p.serie.map(s=>qCode(s.quad)).join(' → ')+(p.ausente?' → '+p.ausente.ref:'');
    h+=`<tr${p.ausente?' class="aus"':''}><td class="ae-nome"><b>${esc(r.entry.nomeMuni)}</b>${tag}</td><td>${perdaChips(p)}</td><td class="ae-hcell" title="${esc(quads)}">${hist}</td>
      <td class="n">${p.impacto>0?`<b>−${fmtBRL(p.impacto)}</b>${p.ausente?'<div class="ae-q">repasse inteiro</div>':''}${!p.ausente&&p.ganhos&&p.ganhos.length?`<div class="ae-q ae-ganho">entraram ${p.ganhos.map(x=>'+'+x.n+' '+x.tipo).join(', ')}</div>`:''}`:'—'}</td>
      <td class="ae-acts"><button type="button" class="rk-mapa" title="Mostrar no mapa" aria-label="Mostrar ${esc(r.entry.nomeMuni)} no mapa" onclick="selectMapMuni('${esc(r.entry.ibge||r.entry.id)}',{scroll:true})"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="11" r="3"/><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/></svg></button><button type="button" class="ae-rel" onclick="openFromCarteira('${esc(r.entry.id)}')">Relatório</button></td></tr>`;
  });
  h+=`</tbody></table></div>`;
  if(lista.length>20)h+=`<div class="ae-more"><span class="rowlink" onclick="perdaVerTodos=!perdaVerTodos;renderCarteiraView();">${perdaVerTodos?'Mostrar só os 20 maiores':`Ver todos os ${lista.length}`}</span></div>`;
  h+=`<div class="ae-note"><b>Como ler.</b> O impacto é uma estimativa: equipes a menos × valor médio por equipe daquele tipo no quadrimestre em que elas ainda estavam no relatório (Fixo + Vínculo + Qualidade). Conversões entre eAP e eSF não contam como perda. Quando no mesmo período entraram equipes de outro tipo, elas aparecem em verde (+) e podem compensar a perda no repasse total. ${PERDA_CAUSAS}</div></div>`;
  el.innerHTML=h;
}
// tela do município: aviso logo acima do resumo da Visão geral
function renderAlertaMunicipio(res){
  const el=document.getElementById('alerta-equipes-muni');if(!el)return;
  let ref=0;
  if(parsed&&carteira.municipios.some(m=>String(m.id)===String(parsed.ibge)))ref=carteiraRefKey||carteira.municipios.reduce((mx,m)=>{const ks=(m.parsed&&m.parsed.rows||[]).map(r=>quadKey(r.quad));return Math.max(mx,...ks,0);},0);
  const p=parsed?analisarPerdaEquipes(res,parsed.rows,ref):null;
  if(!temAlertaEquipes(p)){el.style.display='none';el.innerHTML='';return;}
  const fixo=p.quedaFixo>0&&!p.ausente?` O Componente Fixo/IED caiu ${fmtBRL(p.quedaFixo)}/mês.`:'';
  el.style.display='flex';
  el.innerHTML=`<span class="am-ic" aria-hidden="true">⚠</span><div><b>${p.ausente?'Município fora do relatório mais recente':'Equipes a menos no relatório do SIAPS'}:</b> ${perdaTexto(p)}.${fixo}${p.impacto>0?` Impacto estimado: −${fmtBRL(p.impacto)}/mês.`:''}${perdaCompensacao(p)?`<div class="am-g"><b>Mas entraram outras equipes.</b> ${perdaCompensacao(p)} Detalhe por quadrimestre na aba Detalhamento.</div>`:''}<div class="am-c">${PERDA_CAUSAS}</div></div>`;
}
