/* PDF principal: "Relatório do quadrimestre" (botão "Relatório do quadrimestre (PDF)"). */

/* =========================================================================
   RELATÓRIO DO QUADRIMESTRE (PDF principal, v1.25.0)
   -------------------------------------------------------------------------
   Substitui o antigo PDF de 4 páginas (gráficos de barras + cartões de
   diagnóstico). Formato pensado para entregar à coordenação da APS:
   página 1 — quanto o repasse mudou, por componente, a classificação das
   equipes e o que puxou a mudança; página 2 (só quando o relatório
   "Qualidade – Conceito obtido por indicador" estiver carregado no Raio-X)
   — o conceito de cada indicador, um quadrado por equipe, comparando o
   quadrimestre anterior com o atual, as prioridades sugeridas e o ganho
   possível no próximo quadrimestre. Tudo calculado por regras fixas a partir
   dos dois relatórios públicos do SIAPS — nada sai do navegador.
   ========================================================================= */
const PDF_CLS_LETRA={'Ótimo':'Ó','Bom':'B','Suficiente':'S','Regular':'R'};
// Nome do indicador na tabela da página 2 (sem o sufixo "na APS", que só ocupa espaço)
const IND_NOME_TABELA={
  '1ª Consulta Odontológica programada na APS':'1ª Consulta Odontológica programada',
  'Média de atendimentos da eMulti por pessoa':'Média de atendimentos por pessoa',
  'Ações interprofissionais realizadas pela eMulti na APS':'Ações interprofissionais'
};
// Nome curto, usado nas frases ("O que puxou a melhora", prioridades)
const IND_NOME_CURTO={
  'Cuidado da Pessoa com Hipertensão':'Hipertensão',
  'Cuidado da Pessoa com Diabetes Mellitus':'Diabetes',
  'Cuidado da Pessoa Idosa':'Pessoa Idosa',
  'Cuidado da Gestante e da Puérpera':'Gestante e Puérpera',
  'Cuidado no Desenvolvimento Infantil':'Desenvolvimento Infantil',
  'Cuidado Integral à Saúde da Mulher':'Saúde da Mulher',
  'Mais Acesso à Atenção Primária à Saúde':'Mais Acesso à APS',
  '1ª Consulta Odontológica programada na APS':'1ª consulta odontológica',
  'Tratamento Odontológico concluído na APS':'Tratamento odontológico concluído',
  'Taxa de exodontias na APS':'Exodontias',
  'Escovação Supervisionada na APS':'Escovação supervisionada',
  'Procedimentos Odontológicos preventivos na APS':'Procedimentos preventivos',
  'Tratamento Restaurador Atraumático na APS':'TRA',
  'Média de atendimentos da eMulti por pessoa':'eMulti – atendimentos por pessoa',
  'Ações interprofissionais realizadas pela eMulti na APS':'Ações interprofissionais'
};
function indNomeTabela(n){return IND_NOME_TABELA[n]||String(n).replace(/\s+na APS$/i,'');}
function indNomeCurto(n){return IND_NOME_CURTO[n]||indNomeTabela(n).replace(/\s*\(e[A-Za-z]+\)\s*$/,'');}
// Normaliza o tipo de equipe do relatório por indicador (o SIAPS já usa "eSF", "eSB"…,
// mas não custa aceitar variações de caixa/acentuação).
function normTipoInd(t){
  const s=String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z]/g,'');
  if(s.includes('multi'))return 'eMulti';
  if(s.includes('sb')||s.includes('bucal'))return 'eSB';
  if(s==='eap'||s.includes('atencaoprimaria'))return 'eAP';
  if(s.includes('sf')||s.includes('familia'))return 'eSF';
  return String(t||'').trim();
}

// Monta, a partir do relatório por indicador, a comparação quadrimestre atual × anterior,
// indicador por indicador, na ordem em que o próprio SIAPS lista os indicadores.
function buildIndicadorComparativo(indRows,targetKey){
  if(!indRows||!indRows.length)return null;
  const keys=[...new Set(indRows.map(r=>quadKey(r.quad)).filter(k=>k>0))].sort((a,b)=>a-b);
  if(!keys.length)return null;
  const curKey=keys.includes(targetKey)?targetKey:keys[keys.length-1];
  const anteriores=keys.filter(k=>k<curKey);
  const prevKey=anteriores.length?anteriores[anteriores.length-1]:null;
  const ORDEM=['eSF','eAP','eSB','eMulti'];
  const porTipo=new Map();
  indRows.forEach(r=>{
    const k=quadKey(r.quad);if(!k)return;
    const tipo=normTipoInd(r.tipo);
    if(!porTipo.has(tipo))porTipo.set(tipo,new Map());
    const m=porTipo.get(tipo);
    if(!m.has(r.indicador))m.set(r.indicador,new Map());
    const h=m.get(r.indicador);
    const c=h.get(k)||{Regular:0,Suficiente:0,Bom:0,'Ótimo':0};
    c.Regular+=r.regular||0;c.Suficiente+=r.suficiente||0;c.Bom+=r.bom||0;c['Ótimo']+=r.otimo||0;
    h.set(k,c);
  });
  const tipos=[...porTipo.keys()].sort((a,b)=>{
    const ia=ORDEM.indexOf(a),ib=ORDEM.indexOf(b);return(ia<0?99:ia)-(ib<0?99:ib);
  });
  const out=[];
  tipos.forEach(tipo=>{
    const itens=[];
    porTipo.get(tipo).forEach((hist,indicador)=>{
      const cur=hist.get(curKey),tc=clsTotal(cur);
      if(!tc)return;
      const pc=prevKey!=null?hist.get(prevKey):null,tp=clsTotal(pc);
      let streak=0;
      for(let i=keys.indexOf(curKey);i>=0;i--){const c=hist.get(keys[i]);if(c&&c.Regular>0)streak++;else break;}
      itens.push({indicador,tipo,cur:{c:cur,total:tc,score:indScore(cur)},
        prev:tp?{c:pc,total:tp,score:indScore(pc)}:null,streak});
    });
    if(itens.length)out.push({tipo,itens});
  });
  return out.length?{curKey,prevKey,tipos:out}:null;
}
function indDirecao(it){
  if(!it.prev)return 0;
  const d=it.cur.score-it.prev.score;
  return Math.abs(d)<1e-9?0:(d>0?1:-1);
}
// Descreve em uma frase curta o que mudou num indicador entre dois quadrimestres
// (ex.: "de 1 para 2 equipes eSF em Ótimo", "1 eSF passou de Regular para Bom").
function descreverMudanca(p,c,uni){
  const sp=indScore(p),sc=indScore(c);
  if(sp==null||sc==null||Math.abs(sc-sp)<1e-9)return null;
  const up=sc>sp,dir=up?1:-1;
  const tp=clsTotal(p),tc=clsTotal(c);
  const U=n=>uni||(n>1?'equipes':'equipe');
  if(tp!==tc)return{dir,text:`nota do indicador ${up?'subiu':'caiu'} de ${Math.round(sp*100)}% para ${Math.round(sc*100)}%`};
  const diff={};CLASS_ORDEM.forEach(k=>diff[k]=(c[k]||0)-(p[k]||0));
  const only=CLASS_ORDEM.find(k=>c[k]===tc);
  if(tc===1){const pc=CLASS_ORDEM.find(k=>p[k]===1);return{dir,text:`de ${pc} para ${only}`};}
  if(only){
    const antes=CLASS_ORDEM.filter(k=>k!==only&&p[k]>0).map(k=>`${p[k]} em ${k}`);
    return{dir,text:`as ${tc} ${U(tc)} agora em ${only}`+(antes.length?` (antes ${joinPt(antes)})`:'')};
  }
  const eqU=n=>`${n===1?'equipe':'equipes'}${uni?' '+uni:''}`;
  if(up&&p['Ótimo']>0&&diff['Ótimo']>0)return{dir,text:`de ${p['Ótimo']} para ${c['Ótimo']} ${eqU(c['Ótimo'])} em Ótimo`};
  if(!up&&c['Ótimo']>0&&diff['Ótimo']<0)return{dir,text:`de ${p['Ótimo']} para ${c['Ótimo']} ${eqU(c['Ótimo'])} em Ótimo`};
  const pos=CLASS_ORDEM.filter(k=>diff[k]>0),neg=CLASS_ORDEM.filter(k=>diff[k]<0);
  if(!pos.length||!neg.length)return null;
  const m=pos.reduce((s,k)=>s+diff[k],0);
  const src=up?neg[0]:neg[neg.length-1],dst=up?pos[pos.length-1]:pos[0];
  const verbo=up?(m>1?'passaram':'passou'):(m>1?'caíram':'caiu');
  return{dir,text:`${m} ${U(m)} ${verbo} de ${src} para ${dst}`};
}
// Cada item devolvido carrega .it (o indicador de referência), usado pelo Raio-X para a ação sugerida.
// Prioridades sugeridas (regras fixas, sem IA): indicadores com equipe em Regular primeiro
// (mais equipes e há mais tempo), depois Suficiente, depois o grupo "todo em Bom" mais
// próximo de virar Ótimo e, por fim, o indicador que mais caiu. Máximo de 5.
function buildPrioridades(comp){
  const all=[];comp.tipos.forEach(t=>t.itens.forEach(it=>all.push(it)));
  const quedas=[],regs=[],sufs=[],bons=[];
  all.forEach(it=>{
    const c=it.cur.c,t=it.cur.total;
    if(indDirecao(it)<0){quedas.push(it);return;}
    if(c.Regular>0)regs.push(it);
    else if(c.Suficiente>0)sufs.push(it);
    else if(c.Bom===t)bons.push(it);
  });
  regs.sort((a,b)=>b.cur.c.Regular-a.cur.c.Regular||b.streak-a.streak||a.cur.score-b.cur.score);
  sufs.sort((a,b)=>b.cur.c.Suficiente-a.cur.c.Suficiente||a.cur.score-b.cur.score);
  quedas.sort((a,b)=>(a.cur.score-a.prev.score)-(b.cur.score-b.prev.score));
  const lbl=it=>`${indNomeCurto(it.indicador)} (${it.tipo}):`;
  const eq=n=>n>1?`${n} equipes`:'1 equipe';
  const fReg=it=>{
    const c=it.cur.c,k=c.Regular;
    const subiu=(it.prev&&it.prev.total===it.cur.total)?it.prev.c.Regular-k:0;
    let t=`${eq(k)} ${subiu>0?'ainda ':''}em Regular`;
    if(it.streak>=2)t+=` há ${numExt(it.streak)} quadrimestres`;
    if(subiu>0){
      const ganhos=CLASS_ORDEM.filter(cl=>cl!=='Regular'&&(c[cl]||0)>(it.prev.c[cl]||0));
      const dst=ganhos.length?ganhos[ganhos.length-1]:null;
      t+=`; ${subiu>1?'as que subiram':'a que subiu'}${dst?' para '+dst:''} pode${subiu>1?'m':''} servir de referência`;
    }
    return Object.assign([{t:lbl(it),b:true},{t:' '+t+'.'}],{it});
  };
  const fSuf=it=>Object.assign([{t:lbl(it),b:true},{t:` ${eq(it.cur.c.Suficiente)} em Suficiente.`}],{it});
  const fQueda=it=>{
    const m=descreverMudanca(it.prev.c,it.cur.c,null);
    return Object.assign([{t:lbl(it),b:true},{t:' '+(m?m.text:'piorou em relação ao quadrimestre anterior')+'; vale verificar.'}],{it});
  };
  let bonItem=null;
  if(bons.length){
    const estaveis=bons.filter(it=>indDirecao(it)===0),pool=estaveis.length?estaveis:bons;
    const grupos=new Map();
    pool.forEach(it=>{const key=it.tipo+'|'+it.cur.total;if(!grupos.has(key))grupos.set(key,[]);grupos.get(key).push(it);});
    let best=null;
    grupos.forEach(g=>{if(!best||g[0].cur.total>best[0].cur.total||(g[0].cur.total===best[0].cur.total&&g.length>best.length))best=g;});
    const n=best[0].cur.total,nomes=best.map(it=>indNomeCurto(it.indicador));
    const t=best.length===1
      ?(n>1?`as ${n} equipes em Bom — o mais próximo de virar Ótimo.`:'a equipe está em Bom — o mais próximo de virar Ótimo.')
      :`${n>1?n+' equipes':'a equipe'} em Bom ${best.length===2?'nos dois':'em todos'} — os mais próximos de virar Ótimo.`;
    bonItem=Object.assign([{t:`${joinPt(nomes)} (${best[0].tipo}):`,b:true},{t:' '+t}],{it:best[0],grupo:best});
  }
  const out=[];
  const regTop=regs.slice(0,3);regTop.forEach(it=>out.push(fReg(it)));
  const sufTop=sufs.slice(0,Math.max(0,3-out.length));sufTop.forEach(it=>out.push(fSuf(it)));
  if(bonItem)out.push(bonItem);
  if(quedas.length)out.push(fQueda(quedas[0]));
  const resto=[...regs.slice(regTop.length).map(fReg),...sufs.slice(sufTop.length).map(fSuf),...quedas.slice(1).map(fQueda)];
  while(out.length<5&&resto.length)out.push(resto.shift());
  return out.slice(0,5);
}
// Frase do quadro final ("Se as 2 eSF em Bom subirem para Ótimo em Qualidade, e a eSF em
// Bom no Vínculo (CVAT) também, o repasse mensal aumenta em até:") a partir dos mesmos
// "próximos passos" (subir um nível) usados no Resumo p/ secretário.
function fraseProximoPasso(passos){
  if(!passos.length)return null;
  const top=passos[0].gain;
  const sel=passos.filter((p,i)=>i<3&&p.gain>=0.25*top);
  const TL=Object.fromEntries(TIPOS_EQUIPE.map(t=>[t.k,t.l]));
  const compNome=p=>p.comp==='vin'?'no Vínculo (CVAT)':'em Qualidade';
  const segs=[{t:'Se '}];
  sel.forEach((p,i)=>{
    const n=Math.round(p.n),art=n>1?'as ':'a ',grupo=`${n>1?n+' ':''}${TL[p.tipo]||p.tipo} em ${p.classeAtual}`;
    const verbo=n>1?'subirem':'subir';
    if(i>0)segs.push({t:i===sel.length-1?', e ':', '});
    const mesmo=i>0&&p.classeAtual===sel[0].classeAtual&&p.classeProxima===sel[0].classeProxima;
    if(mesmo){segs.push({t:art},{t:`${grupo} ${compNome(p)}`,b:true},{t:' também'});}
    else{segs.push({t:art},{t:grupo,b:true},{t:` ${verbo} para ${p.classeProxima} ${compNome(p)}`});}
  });
  segs.push({t:', o repasse mensal aumenta em até:'});
  return{segs,total:sel.reduce((s,p)=>s+p.gain,0)};
}

function generatePDF(){
  if(!parsed||!lastRes){return;}
  if(!window.jspdf){alert('A biblioteca de geração de PDF não carregou. Verifique sua conexão com a internet e tente novamente.');return;}
  const btn=document.getElementById('btn-pdf');
  const prevTxt=btn.textContent;
  btn.textContent='Gerando…';btn.classList.add('disabled');
  try{
    const {jsPDF}=window.jspdf;
    const doc=prepararFontesPdf(new jsPDF({unit:'pt',format:'a4'}));
    const PW=doc.internal.pageSize.getWidth(),PH=doc.internal.pageSize.getHeight();
    const MX=46,tW=PW-2*MX,FOOT_TOP=PH-74;
    const NAVY='#09274C',INK='#16283a',SUB='#3c4d5a',MUTED='#6b7c88',LINE='#dbe3e9',LINE2='#edf1f4',
          BLUE='#2E6FE0',TILE='#f2f5f8',GREEN='#1d8048',GREEN_BG='#e2f3e8',RED='#c0392b',RED_BG='#fbe8e5';
    const last=lastRes[lastRes.length-1],prev=lastRes.length>1?lastRes[lastRes.length-2]:null;
    const hasEstrato=!!(lastParams&&lastParams.estrato);
    const muni=parsed.nomeMuni||'Município';
    const destEl=document.getElementById('inp-destinatario');
    const destinatario=destEl?destEl.value.trim():'';
    const comp=indicador?buildIndicadorComparativo(indicador.rows,quadKey(last.quad)):null;
    let y=0;

    const setF=(style,size,color)=>{doc.setFont('helvetica',style);doc.setFontSize(size);if(color)doc.setTextColor(...hex2rgb(color));};

    // ---- cabeçalho (todas as páginas) ----
    function header(sub){
      const logoH=30,logoW=logoH*(755/179);
      const tx=MX+logoW+28,tw=PW-MX-tx;
      setF('normal',9);
      const subLines=doc.splitTextToSize(sub,tw);
      const nome=muni.toLocaleUpperCase('pt-BR');
      let ns=20;setF('bold',ns);
      while(doc.getTextWidth(nome)>tw&&ns>12){ns-=1;doc.setFontSize(ns);}
      const H=Math.max(98,28+10+ns+10+subLines.length*11.5+16);
      doc.setFillColor(...hex2rgb(NAVY));doc.rect(0,0,PW,H,'F');
      doc.addImage(LOGO_PDF_DARK,'PNG',MX,(H-logoH)/2,logoW,logoH);
      let ty=30;
      setF('bold',7.5,'#8fc3ea');
      doc.text('RESULTADO DO QUADRIMESTRE · ATENÇÃO PRIMÁRIA À SAÚDE',tx,ty,{charSpace:0.25});
      ty+=8+ns*0.9;
      setF('bold',ns,'#ffffff');doc.text(nome,tx,ty);
      ty+=15;
      setF('normal',9,'#d4e2ee');
      subLines.forEach((ln,i)=>doc.text(ln,tx,ty+i*11.5));
      y=H+30;
    }
    let pageSub='';
    function newPage(sub){doc.addPage();if(sub)pageSub=sub;header(pageSub);}
    function ensure(h){if(y+h>FOOT_TOP)newPage();}
    function secTitle(t){
      ensure(60);
      setF('bold',12.5,INK);doc.text(t,MX,y);
      doc.setDrawColor(...hex2rgb(LINE));doc.setLineWidth(0.8);doc.line(MX,y+8,PW-MX,y+8);
      y+=26;
    }
    // texto com trechos em negrito, quebrado em linhas. Partes sem espaço entre si (ex.: um
    // trecho em negrito seguido de vírgula) formam uma só "palavra" e nunca são separadas.
    function richLayout(segs,maxW,size){
      const words=[];let cur=null;
      segs.forEach(sg=>String(sg.t).split(/(\s+)/).forEach(t=>{
        if(t==='')return;
        if(/^\s+$/.test(t)){cur=null;words.push({sp:true,parts:[{t:' ',b:!!sg.b}]});return;}
        if(!cur){cur={sp:false,parts:[]};words.push(cur);}
        cur.parts.push({t,b:!!sg.b,c:sg.c});
      }));
      words.forEach(w=>{w.w=0;w.parts.forEach(pt=>{setF(pt.b?'bold':'normal',size);pt.w=doc.getTextWidth(pt.t);w.w+=pt.w;});});
      const lines=[[]];let lw=0;
      words.forEach(w=>{
        let L=lines[lines.length-1];
        if(w.sp){if(L.length){L.push(w);lw+=w.w;}return;}
        if(lw+w.w>maxW&&L.length){
          while(L.length&&L[L.length-1].sp)lw-=L.pop().w;
          lines.push([]);L=lines[lines.length-1];lw=0;
        }
        L.push(w);lw+=w.w;
      });
      lines.forEach(L=>{while(L.length&&L[L.length-1].sp)L.pop();});
      return lines.filter(L=>L.length);
    }
    function richDraw(lines,x,y0,size,lh,cNorm,cBold){
      lines.forEach((L,i)=>{let cx=x;L.forEach(w=>w.parts.forEach(pt=>{
        if(!w.sp){setF(pt.b?'bold':'normal',size,pt.c||(pt.b?cBold:cNorm));doc.text(pt.t,cx,y0+i*lh);}
        cx+=pt.w;
      }));});
    }
    function seta(x,yc,dir,color){
      doc.setFillColor(...hex2rgb(color));
      if(dir>0)doc.triangle(x,yc+3,x+7,yc+3,x+3.5,yc-3.5,'F');
      else doc.triangle(x,yc-3,x+7,yc-3,x+3.5,yc+3.5,'F');
    }
    // tabela "limpa" (sem fundo no cabeçalho), no estilo do relatório
    function cleanTable(cols,rows,o={}){
      const fs=o.fs||9.5,rowH=o.rowH||22;
      setF('bold',6.8);
      const headLines=cols.map(c=>c.lines?c.lines.map(x=>String(x).toUpperCase()):doc.splitTextToSize(String(c.label).toUpperCase(),c.w-10));
      const nl=Math.max(...headLines.map(l=>l.length)),headH=10+nl*8.5;
      ensure(headH+rowH*Math.min(rows.length,3));
      let cx=MX;
      cols.forEach((c,i)=>{
        const L=headLines[i];
        setF('bold',6.8,MUTED);
        L.forEach((ln,j)=>{
          const ty=y+headH-6-(L.length-1-j)*8.5;
          const tx=c.align==='right'?cx+c.w-6:c.align==='center'?cx+c.w/2:cx+6;
          doc.text(ln,tx,ty,{align:c.align||'left'});
        });
        cx+=c.w;
      });
      y+=headH;
      doc.setDrawColor(...hex2rgb('#cfd8df'));doc.setLineWidth(0.9);doc.line(MX,y,MX+tW,y);
      rows.forEach(r=>{
        ensure(rowH);
        let cx2=MX;
        cols.forEach(c=>{
          const v=r[c.key];const cell=(v&&typeof v==='object')?v:{t:v==null?'':String(v)};
          setF(cell.b?'bold':'normal',fs,cell.c||INK);
          const tx=c.align==='right'?cx2+c.w-6:c.align==='center'?cx2+c.w/2:cx2+6;
          doc.text(cell.t,tx,y+rowH/2+3.3,{align:c.align||'left'});
          cx2+=c.w;
        });
        y+=rowH;
        doc.setDrawColor(...hex2rgb(LINE2));doc.setLineWidth(0.6);doc.line(MX,y,MX+tW,y);
      });
    }
    // conceito de um indicador: um quadrado por equipe (ou contagem, se forem muitas)
    const SQ=11,SQG=3;
    function drawConceito(c,colX,colW,yc){
      const t=clsTotal(c);
      if(!t){setF('normal',9,MUTED);doc.text('—',colX+colW/2,yc+3,{align:'center'});return;}
      if(t<=6){
        let x=colX+(colW-(t*SQ+(t-1)*SQG))/2;
        CLASS_ORDEM.forEach(k=>{for(let i=0;i<(c[k]||0);i++){
          doc.setFillColor(...hex2rgb(CC[k]));doc.roundedRect(x,yc-SQ/2,SQ,SQ,2,2,'F');
          setF('bold',6.4,'#ffffff');doc.text(PDF_CLS_LETRA[k],x+SQ/2,yc+2.3,{align:'center'});
          x+=SQ+SQG;
        }});
      }else{
        setF('bold',6.6);
        const chips=CLASS_ORDEM.filter(k=>c[k]>0).map(k=>{const s=`${PDF_CLS_LETRA[k]} ${c[k]}`;return{k,s,w:doc.getTextWidth(s)+8};});
        let x=colX+(colW-(chips.reduce((s,ch)=>s+ch.w,0)+(chips.length-1)*SQG))/2;
        chips.forEach(ch=>{
          doc.setFillColor(...hex2rgb(CC[ch.k]));doc.roundedRect(x,yc-SQ/2,ch.w,SQ,2,2,'F');
          setF('bold',6.6,'#ffffff');doc.text(ch.s,x+ch.w/2,yc+2.3,{align:'center'});
          x+=ch.w+SQG;
        });
      }
    }

    // ================= PÁGINA 1 =================
    const subP1=[parsed.uf||'',`Avaliação ${qCode(last.quad)}`,'Saúde Brasil 360 (Portaria GM/MS nº 3.493/2024)']
      .filter(Boolean).join(' · ')+(destinatario?` · Para: ${destinatario}`:'');
    pageSub=subP1;
    header(subP1);

    // diferenças sempre calculadas sobre os valores já arredondados que aparecem impressos,
    // para que quem conferir à mão (ex.: 31.717 - 27.401) chegue exatamente ao mesmo número
    const R0=v=>Math.round(v||0);
    const delta=prev?R0(last.total)-R0(prev.total):0;
    const dir=!prev?0:(delta>0?1:(delta<0?-1:0));
    secTitle(!prev?'Repasse mensal neste quadrimestre'
      :dir>0?'O repasse subiu neste quadrimestre':dir<0?'O repasse caiu neste quadrimestre':'O repasse se manteve neste quadrimestre');
    setF('normal',10.5,SUB);
    doc.text('Repasse federal mensal da APS, conforme o relatório mais recente do SIAPS:',MX,y);
    y+=37;
    setF('bold',32,NAVY);
    const bigTxt=fmtBRL(last.total)+(hasEstrato?'':' *');
    doc.text(bigTxt,MX,y);
    const bigW=doc.getTextWidth(bigTxt);
    if(prev){
      const chipTxt=dir===0?`sem alteração em relação ao ${qCode(prev.quad)}`
        :`${dir>0?'+':'-'} ${fmtBRL(Math.abs(delta))} / mês em relação ao ${qCode(prev.quad)}`;
      setF('bold',9.5);
      const cw=doc.getTextWidth(chipTxt)+20,ch=21,cx=MX+bigW+18,cy=y-18;
      doc.setFillColor(...hex2rgb(dir>0?GREEN_BG:dir<0?RED_BG:TILE));
      doc.roundedRect(cx,cy,cw,ch,4,4,'F');
      setF('bold',9.5,dir>0?GREEN:dir<0?RED:MUTED);
      doc.text(chipTxt,cx+10,cy+14);
    }
    y+=20;
    let antes;
    if(prev){
      const iguais=[];
      for(let i=lastRes.length-2;i>=0;i--){if(R0(lastRes[i].total)===R0(prev.total))iguais.unshift(qCode(lastRes[i].quad));else break;}
      antes=`Antes: ${fmtBRL(prev.total)}/mês (${joinPt(iguais)}).`;
      if(dir>0)antes+=` O ganho representa cerca de ${fmtBRL(delta*4)} a mais no quadrimestre.`;
      else if(dir<0)antes+=` A queda representa cerca de ${fmtBRL(-delta*4)} a menos no quadrimestre.`;
    }else{
      antes=`Primeira avaliação disponível no relatório (${qCode(last.quad)}) — cerca de ${fmtBRL(last.total*4)} no quadrimestre.`;
    }
    if(!hasEstrato)antes+=' * Sem o Componente Fixo/IED: o estrato do município não foi selecionado no painel.';
    setF('normal',9,MUTED);
    const antesL=doc.splitTextToSize(antes,tW);
    antesL.forEach((ln,i)=>doc.text(ln,MX,y+i*11));
    y+=antesL.length*11+6;
    // aviso de estimativa junto do valor (a modalidade das equipes não é pública)
    y+=desenharAvisoEstimativa(doc,MX,y,tW,avisoEstimativaPdf(parsed.rows,lastParams||{}),{fs:7.8})+12;

    // ---- 4 indicadores-resumo ----
    const gap=Math.max(0,R0(last.potencial)-R0(last.total));
    const pct=last.potencial>0?Math.round(last.total/last.potencial*100):100;
    const tileSub=(cur,old)=>{
      if(!prev)return{t:'',c:MUTED};
      const d=R0(cur)-R0(old);
      if(d===0)return{t:'sem alteração',c:MUTED};
      return{t:`${d>0?'+':'-'} ${fmtBRL(Math.abs(d))} (era ${fmtBRL(old)})`,c:d>0?GREEN:RED,b:true};
    };
    const tiles=[
      {lbl:'Qualidade',val:fmtBRL(last.qual),sub:tileSub(last.qual,prev?prev.qual:0)},
      {lbl:'Vínculo (CVAT)',val:fmtBRL(last.vin),sub:tileSub(last.vin,prev?prev.vin:0)},
      {lbl:'Fixo / IED',val:hasEstrato?fmtBRL(last.fixo):'—',sub:hasEstrato?tileSub(last.fixo,prev?prev.fixo:0):{t:'estrato IED não selecionado',c:MUTED}},
      {lbl:'Do potencial máximo',val:`${pct}%`,sub:{t:gap>0?`faltam ${fmtBRL(gap)}/mês`:'todas as equipes em Ótimo',c:MUTED}}
    ];
    const TG=10,TWd=(tW-TG*3)/4;
    tiles.forEach(t=>{
      let fs=7.8;setF(t.sub.b?'bold':'normal',fs);
      while(t.sub.t&&doc.getTextWidth(t.sub.t)>TWd-16&&fs>6.6){fs-=0.2;doc.setFontSize(fs);}
      t.subFs=fs;t.subL=t.sub.t?doc.splitTextToSize(t.sub.t,TWd-16):[];
    });
    const TH=54+Math.max(1,...tiles.map(t=>t.subL.length))*9.5;
    ensure(TH+10);
    tiles.forEach((t,i)=>{
      const tx=MX+i*(TWd+TG);
      doc.setFillColor(...hex2rgb(TILE));doc.roundedRect(tx,y,TWd,TH,5,5,'F');
      setF('normal',8,SUB);doc.text(t.lbl,tx+10,y+17);
      setF('bold',15,BLUE);doc.text(t.val,tx+10,y+37);
      setF(t.sub.b?'bold':'normal',t.subFs,t.sub.c);
      t.subL.forEach((ln,j)=>doc.text(ln,tx+10,y+51+j*9.5));
    });
    y+=TH+14;

    // ---- quanto ficou abaixo do potencial, em cada avaliação ----
    {
      // uma linha só: rótulo + um selo por quadrimestre (quadrimestre em cinza, valor em vermelho);
      // a fonte diminui um pouco se não couber, e só quebra a linha em último caso
      // rótulo numa linha e, embaixo, um selo por quadrimestre, todos da mesma largura numa linha só
      const itens=lastRes.slice(-6).map(r=>{const g=Math.max(0,R0(r.potencial)-R0(r.total));return{q:qShort(r.quad),v:g>0?fmtBRL(g):'R$ 0',g};});
      setF('bold',8.3,SUB);doc.text('Quanto ficou abaixo do potencial máximo, por mês, em cada quadrimestre:',MX,y+8);
      y+=15;
      const SG=6,sw=(tW-SG*(itens.length-1))/itens.length;
      let fs=8.2;
      const cabe=f=>itens.every(it=>{setF('normal',f);const a=doc.getTextWidth(it.q+'  ');setF('bold',f);return a+doc.getTextWidth(it.v)+12<=sw;});
      while(!cabe(fs)&&fs>6.4)fs-=0.2;
      itens.forEach((it,i)=>{
        const cx=MX+i*(sw+SG);
        doc.setFillColor(...hex2rgb(it.g>0?RED_BG:GREEN_BG));doc.roundedRect(cx,y,sw,17,3,3,'F');
        setF('normal',fs);const aq=doc.getTextWidth(it.q+'  ');setF('bold',fs);const tw2=aq+doc.getTextWidth(it.v);
        const tx0=cx+(sw-tw2)/2;
        setF('normal',fs,MUTED);doc.text(it.q,tx0,y+11.6);
        setF('bold',fs,it.g>0?RED:GREEN);doc.text(it.v,tx0+aq,y+11.6);
      });
      y+=17+28;
    }

    // ---- classificação das equipes ----
    const clsCounts=(quad,field)=>{
      const c={Regular:0,Suficiente:0,Bom:0,'Ótimo':0};
      parsed.rows.forEach(r=>{if(r.quad===quad&&c[r.classe]!==undefined)c[r.classe]+=(+r[field]||0);});
      return c;
    };
    const LINHAS=[
      {k:'esf',f:'qEsf',lbl:'eSF — Saúde da Família',comp:'qual'},
      {k:'eap',f:'qEap',lbl:'eAP — Atenção Primária',comp:'qual'},
      {k:'esb',f:'qEsb',lbl:'eSB — Saúde Bucal',comp:'qual'},
      {k:'emulti',f:'qEmulti',lbl:'eMulti — Multiprofissional',comp:'qual'},
      {k:'esfr',f:'qEsfr',lbl:'eSFR — Saúde da Família Ribeirinha',comp:'qual'},
      {k:'eapp',f:'qEapp',lbl:'eAPP — Atenção Primária Prisional',comp:'qual'},
      {k:'ecr',f:'qEcr',lbl:'eCR — Consultório na Rua',comp:'qual'},
      {k:'esf',f:'vEsf',lbl:'CVAT (Vínculo) — eSF',comp:'vin'},
      {k:'eap',f:'vEap',lbl:'CVAT (Vínculo) — eAP',comp:'vin'}
    ].map(L=>({...L,cur:clsCounts(last.quad,L.f),prev:prev?clsCounts(prev.quad,L.f):null}))
     .filter(L=>clsTotal(L.cur)>0);
    if(LINHAS.length){
      secTitle('Classificação das equipes em Qualidade e Vínculo');
      const temSuf=LINHAS.some(L=>L.cur.Suficiente>0),temReg=LINHAS.some(L=>L.cur.Regular>0);
      const qc=qShort(last.quad),qp=prev?qShort(prev.quad):null;
      const countCols=[];
      if(prev)countCols.push({key:'otP',cls:'Ótimo',q:qp});
      countCols.push({key:'otC',cls:'Ótimo',q:qc},{key:'bomC',cls:'Bom',q:qc});
      if(temSuf)countCols.push({key:'sufC',cls:'Suficiente',q:qc});
      if(temReg)countCols.push({key:'regC',cls:'Regular',q:qc});
      // larguras: cabeçalho em 1 linha ("ÓTIMO · Q1/26") quando cabe; com muitas colunas,
      // quebra em 2 linhas (classificação / quadrimestre) — nunca no meio da palavra.
      setF('bold',6.8);
      const W=t=>doc.getTextWidth(String(t).toUpperCase());
      const TIPO_MIN=128,wEq=Math.max(W('Equipes')+14,tW*0.08);
      countCols.forEach(c=>{c.one=Math.max(44,W(`${c.cls} · ${c.q}`)+14);c.two=Math.max(38,Math.max(W(c.cls),W(c.q))+14);});
      const margOne=Math.max(W('Margem até tudo Ótimo')+14,tW*0.2),margTwo=Math.max(W('Margem até'),W('tudo Ótimo'))+14;
      let two=false,margTwoUse=false;
      const sum=k=>countCols.reduce((acc,c)=>acc+c[k],0);
      if(tW-wEq-margOne-sum('one')<TIPO_MIN)two=true;
      const cntSum=sum(two?'two':'one');
      if(tW-wEq-margOne-cntSum<TIPO_MIN)margTwoUse=true;
      const wMarg=margTwoUse?margTwo:margOne;
      const sobra=tW-wEq-wMarg-cntSum;
      const wTipo=Math.max(TIPO_MIN,Math.min(tW*0.29,sobra));
      const extra=Math.max(0,sobra-wTipo)/countCols.length;
      const cols=[{key:'tipo',label:'Tipo de equipe',w:wTipo},{key:'n',label:'Equipes',w:wEq,align:'center'},
        ...countCols.map(c=>({key:c.key,lines:two?[c.cls,c.q]:[`${c.cls} · ${c.q}`],w:c[two?'two':'one']+extra,align:'center'})),
        {key:'marg',lines:margTwoUse?['Margem até','tudo Ótimo']:['Margem até tudo Ótimo'],w:wMarg,align:'right'}];
      const rows=LINHAS.map(L=>{
        const bt=last.byType[L.k]||{};
        const marg=Math.max(0,L.comp==='vin'?(bt.vinOt||0)-(bt.vin||0):(bt.qualOt||0)-(bt.qual||0));
        const otC=L.cur['Ótimo'],otP=L.prev?L.prev['Ótimo']:null;
        return{tipo:L.lbl,n:String(clsTotal(L.cur)),
          otP:otP==null?'':String(otP),
          otC:{t:String(otC),b:otP!=null&&otC!==otP,c:otP!=null&&otC<otP?RED:INK},
          bomC:String(L.cur.Bom),sufC:String(L.cur.Suficiente),regC:String(L.cur.Regular),
          marg:marg>0.5?`${fmtBRL(marg)}/mês`:'R$ 0'};
      });
      cleanTable(cols,rows);
      const notas=[];
      if(!temSuf&&!temReg)notas.push('Nenhuma equipe ficou em Suficiente ou Regular na nota final.');
      if(prev){
        const qualPrev=LINHAS.filter(L=>L.comp==='qual'&&L.prev).map(L=>L.prev);
        const tot=qualPrev.reduce((s,c)=>s+clsTotal(c),0);
        const unica=tot?CLASS_ORDEM.find(k=>qualPrev.reduce((s,c)=>s+c[k],0)===tot):null;
        if(unica)notas.push(`No ${qp}, todas as equipes de Qualidade estavam em ${unica}.`);
      }
      if(notas.length){
        y+=14;setF('normal',8.6,MUTED);
        const nl=doc.splitTextToSize(notas.join(' '),tW);
        nl.forEach((ln,i)=>doc.text(ln,MX,y+i*11));
        y+=(nl.length-1)*11;
      }
      {
        // equipes a menos no relatório: aviso em destaque logo abaixo da tabela
        const pa=analisarPerdaEquipes(lastRes,parsed.rows,0);
        if(pa&&(pa.recente.length||pa.antiga.length)){
          y+=notas.length?12:8;
          const comp=perdaCompensacao(pa,true);
          // quadro âmbar (em vez de um parágrafo inteiro em vermelho): título curto + o que mudou + o que fazer
          const t1=perdaTexto(pa)+'.';
          const t2=`Vale verificar se houve descredenciamento, desativação no CNES ou falta de envio de produção — o Componente Fixo/IED depende disso.${comp?' '+comp:''}`;
          const PX=16,BW=tW-PX-12;
          setF('bold',8.8);const l1=doc.splitTextToSize(t1,BW);
          setF('normal',8.5);const l2=doc.splitTextToSize(t2,BW);
          const bh=12+12+l1.length*11+4+l2.length*10.6+8;
          ensure(bh+6);
          doc.setFillColor(...hex2rgb('#fdf5e4'));doc.roundedRect(MX,y,tW,bh,5,5,'F');
          doc.setFillColor(...hex2rgb('#e0a82e'));doc.roundedRect(MX,y,3.5,bh,1.5,1.5,'F');
          setF('bold',8,'#8a5a00');doc.text('EQUIPES A MENOS NO RELATÓRIO',MX+PX,y+16,{charSpace:0.3});
          let ay=y+30;
          setF('bold',8.8,INK);l1.forEach((ln,i)=>doc.text(ln,MX+PX,ay+i*11));ay+=l1.length*11+4;
          setF('normal',8.5,SUB);l2.forEach((ln,i)=>doc.text(ln,MX+PX,ay+i*10.6));
          y+=bh-12;
        }
      }
      y+=30;
    }

    // ---- o que puxou a mudança (precisa do relatório por indicador com 2 quadrimestres) ----
    if(comp&&comp.prevKey!=null){
      const ups=[],downs=[];
      comp.tipos.forEach(t=>t.itens.forEach(it=>{
        if(!it.prev)return;
        const m=descreverMudanca(it.prev.c,it.cur.c,it.tipo);
        if(!m)return;
        (m.dir>0?ups:downs).push({nome:indNomeCurto(it.indicador),text:m.text,dir:m.dir});
      }));
      let itens=dir>0?ups:dir<0?downs:[...ups,...downs];
      if(!itens.length)itens=[...ups,...downs];
      secTitle(dir>0?'O que puxou a melhora':dir<0?'O que puxou a queda':'O que mudou nos indicadores');
      if(!itens.length){
        setF('normal',9.5,MUTED);
        doc.text(`Nenhum indicador mudou de conceito entre ${qCodeKey(comp.prevKey)} e ${qCodeKey(comp.curKey)}.`,MX,y);
        y+=24;
      }else{
        itens=itens.slice(0,10);
        const colW=(tW-24)/2,FS=10,LH=13;
        for(let i=0;i<itens.length;i+=2){
          const par=[itens[i],itens[i+1]].filter(Boolean).map(it=>({it,lines:richLayout([{t:it.nome+':',b:true},{t:' '+it.text}],colW-15,FS)}));
          const h=Math.max(...par.map(p=>p.lines.length))*LH;
          if(y+h+22>FOOT_TOP){
            const resto=itens.length-i;
            setF('normal',8.8,MUTED);
            doc.text(`+ ${resto} ${resto>1?'outros indicadores também mudaram':'outro indicador também mudou'} — veja o detalhe na tabela de indicadores, mais adiante.`,MX,y);
            y+=16;break;
          }
          par.forEach((p,j)=>{
            const x=MX+j*(colW+24);
            seta(x,y-3.5,p.it.dir,p.it.dir>0?'#2e9b57':'#c8433a');
            richDraw(p.lines,x+15,y,FS,LH,'#2b3b48',INK);
          });
          y+=h+9;
        }
        y+=10;
      }
    }

    // ---- quadro final: ganho no próximo quadrimestre ----
    function quadroSpec(){
      const passos=computeProximosPassos(parsed.rows,last.quad,lastParams||{});
      const fr=fraseProximoPasso(passos);
      const segs=fr?fr.segs:[{t:'Todas as equipes já estão em Ótimo em Vínculo e Qualidade. O foco agora é '},{t:'manter essa classificação',b:true},{t:' nos próximos quadrimestres.'}];
      const big=fr?`+ ${fmtBRL(fr.total)}/mês`:'Tudo em Ótimo';
      const lines=richLayout(segs,tW*0.58-26,10.5);
      return{lines,big,bh:Math.max(66,lines.length*14+30)};
    }
    function quadroProximoPasso(){
      const q=quadroSpec(),FS=10.5,LH=14,bh=q.bh;
      ensure(bh+6);
      doc.setFillColor(...hex2rgb(NAVY));doc.roundedRect(MX,y,tW,bh,7,7,'F');
      richDraw(q.lines,MX+24,y+(bh-q.lines.length*LH)/2+10,FS,LH,'#d7e4ef','#ffffff');
      let bs=23;setF('bold',bs);
      const maxBig=tW*0.42-30;
      while(doc.getTextWidth(q.big)>maxBig&&bs>14){bs-=1;doc.setFontSize(bs);}
      setF('bold',bs,'#B6E85A');doc.text(q.big,PW-MX-24,y+bh/2+bs*0.35,{align:'right'});
      y+=bh+12;
    }

    // prioridades sugeridas + quadro final (v4.14.0: logo depois de "O que puxou", antes da
    // tabela indicador por indicador — o resumo vem primeiro e o detalhe fica no fim)
    function blocoPrioridades(){
      const prios=buildPrioridades(comp);
      {
        // prioridades + quadro final ficam juntos: se não couberem no espaço que sobrou,
        // começam numa página nova em vez de se partirem entre duas páginas.
        const pl=prios.map(sg=>richLayout(sg,tW-30,10));
        const need=(prios.length?26+pl.reduce((acc,l)=>acc+l.length*13.2+15.5,0):0)+quadroSpec().bh+12;
        if(y+need>FOOT_TOP&&need<FOOT_TOP-134)newPage();
      }
      if(prios.length){
        secTitle('Prioridades sugeridas para o próximo quadrimestre');
        const FS=10,LH=13.2,TX=MX+30,TWd=tW-30;
        prios.forEach((segs,i)=>{
          const lines=richLayout(segs,TWd,FS);
          const h=lines.length*LH+12;
          ensure(h+4);
          const top=y-9;
          doc.setFillColor(...hex2rgb(NAVY));doc.circle(MX+9,top+9+(lines.length>1?LH/2:0)-3.4,8.5,'F');
          setF('bold',8.5,'#ffffff');doc.text(String(i+1),MX+9,top+9+(lines.length>1?LH/2:0),{align:'center'});
          richDraw(lines,TX,y,FS,LH,'#2b3b48',INK);
          y+=lines.length*LH+3;
          doc.setDrawColor(...hex2rgb(LINE2));doc.setLineWidth(0.6);doc.line(MX,y,MX+tW,y);
          y+=12.5;
        });
        y+=2;
      }
      quadroProximoPasso();
    }

    if(!comp){
      quadroProximoPasso();
    }else{
      blocoPrioridades();
      // ================= PÁGINA 2 — indicador por indicador =================
      const temPrev=comp.prevKey!=null;
      newPage(`Indicadores de Qualidade · ${temPrev?`comparativo ${qCodeKey(comp.prevKey)} × ${qCodeKey(comp.curKey)}`:qCodeKey(comp.curKey)}`);
      secTitle(temPrev?'Conceito por indicador — cada quadrado é uma equipe':`Conceito por indicador em ${qCodeKey(comp.curKey)} — cada quadrado é uma equipe`);
      const wEq=46,wQ=96,wTend=temPrev?80:0;
      const wInd=tW-wEq-wQ*(temPrev?2:1)-wTend;
      const cols=[{l:'Equipe',w:wEq},{l:'Indicador',w:wInd}];
      if(temPrev)cols.push({l:qShortKey(comp.prevKey),w:wQ,c:true});
      cols.push({l:qShortKey(comp.curKey),w:wQ,c:true});
      if(temPrev)cols.push({l:'Tendência',w:wTend});
      const drawIndHead=()=>{
        let cx=MX;
        setF('bold',6.8,MUTED);
        cols.forEach(c=>{doc.text(c.l.toUpperCase(),c.c?cx+c.w/2:cx+6,y+10,{align:c.c?'center':'left'});cx+=c.w;});
        y+=18;
        doc.setDrawColor(...hex2rgb('#cfd8df'));doc.setLineWidth(0.9);doc.line(MX,y,MX+tW,y);
      };
      drawIndHead();
      comp.tipos.forEach(grupo=>{
        grupo.itens.forEach((it,idx)=>{
          setF('normal',9.2);
          const nomeL=doc.splitTextToSize(indNomeTabela(it.indicador),wInd-10);
          const rh=Math.max(18.5,nomeL.length*10.5+8);
          if(y+rh>FOOT_TOP){newPage();drawIndHead();}
          const yc=y+rh/2;
          let cx=MX;
          if(idx===0){setF('bold',9.5,INK);doc.text(grupo.tipo,cx+6,yc+3.3);}
          cx+=wEq;
          setF('normal',9.2,'#2b3b48');
          nomeL.forEach((ln,i)=>doc.text(ln,cx+6,yc+3.3-(nomeL.length-1)*5.25+i*10.5));
          cx+=wInd;
          if(temPrev){drawConceito(it.prev?it.prev.c:null,cx,wQ,yc);cx+=wQ;}
          drawConceito(it.cur.c,cx,wQ,yc);cx+=wQ;
          if(temPrev){
            const d=indDirecao(it);
            if(!it.prev){setF('normal',8.6,MUTED);doc.text('novo',cx+6,yc+3.2);}
            else if(d===0){setF('normal',8.6,'#8a98a3');doc.text('= igual',cx+6,yc+3.2);}
            else{
              seta(cx+6,yc,d,d>0?'#2e9b57':'#c8433a');
              setF('bold',8.6,d>0?'#1d8048':'#c0392b');doc.text(d>0?'melhorou':'piorou',cx+17,yc+3.2);
            }
          }
          y+=rh;
          const ultimoDoGrupo=idx===grupo.itens.length-1;
          doc.setDrawColor(...hex2rgb(ultimoDoGrupo?LINE:LINE2));doc.setLineWidth(ultimoDoGrupo?0.8:0.6);
          doc.line(MX,y,MX+tW,y);
        });
      });
      // legenda
      y+=16;ensure(16);
      setF('normal',8.3,MUTED);doc.text('Legenda:',MX,y+3);
      let lx=MX+doc.getTextWidth('Legenda:')+10;
      ['Ótimo','Bom','Suficiente','Regular'].forEach(k=>{
        doc.setFillColor(...hex2rgb(CC[k]));doc.roundedRect(lx,y-SQ/2,SQ,SQ,2,2,'F');
        setF('bold',6.4,'#ffffff');doc.text(PDF_CLS_LETRA[k],lx+SQ/2,y+2.3,{align:'center'});
        setF('normal',8.3,'#4a5a66');doc.text(k,lx+SQ+5,y+3);
        lx+=SQ+5+doc.getTextWidth(k)+16;
      });
      y+=27;

    }

    // ---- rodapé fixo em todas as páginas ----
    const fontes=comp
      ?'Fonte: SIAPS — relatórios públicos “Vínculo e Acompanhamento Territorial e Qualidade” e “Qualidade – Conceito obtido por indicador”'
      :'Fonte: SIAPS — relatório público “Vínculo e Acompanhamento Territorial e Qualidade”';
    const rodTxt=`${fontes}; PDF gerado em ${new Date().toLocaleDateString('pt-BR')}. Metodologia de cálculo da Governança Brasil (Portaria GM/MS nº 3.493/2024), aplicada de forma consistente em todos os documentos deste painel; não substitui a conciliação com o Fundo Municipal, o e-Gestor nem os demonstrativos oficiais do FNS. ${AVISO_IA}`;
    const totalPages=doc.internal.getNumberOfPages();
    for(let p=1;p<=totalPages;p++){
      doc.setPage(p);
      doc.setDrawColor(...hex2rgb(LINE));doc.setLineWidth(0.7);doc.line(MX,PH-64,PW-MX,PH-64);
      setF('bold',7.4,INK);
      doc.text('Os valores podem divergir dos registrados no Fundo Municipal de Saúde do município.',MX,PH-52);
      setF('normal',6.8,'#7d8b95');
      doc.splitTextToSize(rodTxt,tW-150).forEach((ln,i)=>doc.text(ln,MX,PH-42+i*8.2));
      setF('normal',7.6,'#7d8b95');
      doc.text(`Governança Brasil · ${p}/${totalPages}`,PW-MX,PH-52,{align:'right'});
      if(p===totalPages){
        setF('normal',6.8,'#9aa9b3');
        doc.text('Desenvolvido por Jarom Sambrana da Rosa',PW-MX,PH-42,{align:'right'});
      }
    }

    const pdfFilenameFull='Resultado_APS_'+slugify(muni)+'_'+qCode(last.quad)+'.pdf';
    doc.save(pdfFilenameFull);
    offerPdfFallback(doc,pdfFilenameFull,'pdf-fallback-full');
  }catch(err){
    console.error(err);
    alert('Não foi possível gerar o PDF: '+err.message);
  }finally{
    btn.textContent=prevTxt;btn.classList.remove('disabled');
  }
}
