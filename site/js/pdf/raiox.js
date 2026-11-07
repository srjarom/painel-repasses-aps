/* PDF do Raio-X por indicador — uso interno (botão "Baixar Raio-X (PDF)"). */

/* =========================================================================
   RAIO-X POR INDICADOR (PDF; refeito na v2.4.0 no padrão visual do Relatório do
   quadrimestre: um quadrado por equipe, situação em palavras, sem "nota em %")
   — relatório técnico de uso interno
   (consultoria/vendas) para prospecção de agenda. Diferente do "Resumo p/
   secretário" (linguagem leiga, 1 página, nunca sai da mão do consultor pra
   fora): aqui o público já entende o sistema — mostra os indicadores,
   contagens por classificação e a ação sugerida, do mais crítico ao mais
   consolidado, por tipo de equipe.
   ========================================================================= */
function generatePDFRaioX(){
  if(!parsed||!indicador)return;
  if(!window.jspdf){alert('A biblioteca de geração de PDF não carregou. Verifique sua conexão com a internet e tente novamente.');return;}
  const btn=document.querySelector('#raiox-actions .change.primary');
  const prevTxt=btn?btn.textContent:null;
  if(btn){btn.textContent='Gerando…';btn.classList.add('disabled');}
  try{
    const {jsPDF}=window.jspdf;
    const doc=prepararFontesPdf(new jsPDF({unit:'pt',format:'a4'}));
    const PW=doc.internal.pageSize.getWidth(),PH=doc.internal.pageSize.getHeight();
    const MX=46,tW=PW-2*MX,FOOT_TOP=PH-74;
    // mesma paleta do Relatório do quadrimestre
    const NAVY='#09274C',INK='#16283a',SUB='#3c4d5a',MUTED='#6b7c88',LINE='#dbe3e9',LINE2='#edf1f4',
          BLUE='#2E6FE0',TILE='#f2f5f8',GREEN='#1d8048',GREEN_BG='#e2f3e8',RED='#c0392b',RED_BG='#fbe8e5',AMBER='#a8650a';
    const muni=parsed.nomeMuni||'Município';
    const targetKey=(lastRes&&lastRes.length)?quadKey(lastRes[lastRes.length-1].quad):null;
    const comp=buildIndicadorComparativo(indicador.rows,targetKey);
    if(!comp)throw new Error('não há dados do relatório por indicador para este município.');
    const temPrev=comp.prevKey!=null;
    let y=0;
    const setF=(style,size,color)=>{doc.setFont('helvetica',style);doc.setFontSize(size);if(color)doc.setTextColor(...hex2rgb(color));};

    // ---- cabeçalho (todas as páginas), no padrão do Relatório do quadrimestre ----
    const sub=[parsed.uf||'',`IBGE ${parsed.ibge||'—'}`,temPrev?`Avaliação ${qCodeKey(comp.curKey)}, comparada com ${qCodeKey(comp.prevKey)}`:`Avaliação ${qCodeKey(comp.curKey)}`].filter(Boolean).join(' · ');
    function header(){
      const logoH=30,logoW=logoH*(755/179);
      const tx=MX+logoW+28,tw=PW-MX-tx;
      const nome=muni.toLocaleUpperCase('pt-BR');
      let ns=20;setF('bold',ns);
      while(doc.getTextWidth(nome)>tw&&ns>12){ns-=1;doc.setFontSize(ns);}
      const H=98;
      doc.setFillColor(...hex2rgb(NAVY));doc.rect(0,0,PW,H,'F');
      doc.addImage(LOGO_PDF_DARK,'PNG',MX,(H-logoH)/2,logoW,logoH);
      let ty=30;
      setF('bold',7.5,'#8fc3ea');
      doc.text('RAIO-X POR INDICADOR · USO INTERNO',tx,ty,{charSpace:0.25});
      ty+=8+ns*0.9;
      setF('bold',ns,'#ffffff');doc.text(nome,tx,ty);
      ty+=15;
      setF('normal',9,'#d4e2ee');doc.text(sub,tx,ty);
      y=H+30;
    }
    function newPage(){doc.addPage();header();}
    function ensure(h){if(y+h>FOOT_TOP)newPage();}
    function secTitle(t,desc){
      ensure(70);
      setF('bold',12.5,INK);doc.text(t,MX,y);
      doc.setDrawColor(...hex2rgb(LINE));doc.setLineWidth(0.8);doc.line(MX,y+8,PW-MX,y+8);
      y+=24;
      if(desc){
        setF('normal',9,MUTED);
        const L=doc.splitTextToSize(desc,tW);L.forEach((ln,i)=>doc.text(ln,MX,y+i*11));
        y+=L.length*11+10;
      }
    }
    function seta(x,yc,dir,color){
      doc.setFillColor(...hex2rgb(color));
      if(dir>0)doc.triangle(x,yc+3,x+7,yc+3,x+3.5,yc-3.5,'F');
      else doc.triangle(x,yc-3,x+7,yc-3,x+3.5,yc+3.5,'F');
    }
    function richLayout(segs,maxW,size){
      const words=[];let cur=null;
      segs.forEach(sg=>String(sg.t).split(/(\s+)/).forEach(t=>{
        if(t==='')return;
        if(/^\s+$/.test(t)){cur=null;words.push({sp:true,parts:[{t:' ',b:!!sg.b}]});return;}
        if(!cur){cur={sp:false,parts:[]};words.push(cur);}
        cur.parts.push({t,b:!!sg.b});
      }));
      words.forEach(w=>{w.w=0;w.parts.forEach(pt=>{setF(pt.b?'bold':'normal',size);pt.w=doc.getTextWidth(pt.t);w.w+=pt.w;});});
      const lines=[[]];let lw=0;
      words.forEach(w=>{
        let L=lines[lines.length-1];
        if(w.sp){if(L.length){L.push(w);lw+=w.w;}return;}
        if(lw+w.w>maxW&&L.length){while(L.length&&L[L.length-1].sp)lw-=L.pop().w;lines.push([]);L=lines[lines.length-1];lw=0;}
        L.push(w);lw+=w.w;
      });
      lines.forEach(L=>{while(L.length&&L[L.length-1].sp)L.pop();});
      return lines.filter(L=>L.length);
    }
    function richDraw(lines,x,y0,size,lh,cNorm,cBold){
      lines.forEach((L,i)=>{let cx=x;L.forEach(w=>w.parts.forEach(pt=>{
        if(!w.sp){setF(pt.b?'bold':'normal',size,pt.b?cBold:cNorm);doc.text(pt.t,cx,y0+i*lh);}
        cx+=pt.w;
      }));});
    }
    // um quadrado por equipe, na cor do conceito (ou contagem por conceito, se forem muitas)
    const SQ=11,SQG=3;
    function drawConceito(c,colX,colW,yc){
      const t=clsTotal(c);
      if(!t){setF('normal',9,MUTED);doc.text('—',colX+colW/2,yc+3,{align:'center'});return;}
      const ordem=['Ótimo','Bom','Suficiente','Regular'];
      if(t<=6){
        let x=colX+(colW-(t*SQ+(t-1)*SQG))/2;
        ordem.forEach(k=>{for(let i=0;i<(c[k]||0);i++){
          doc.setFillColor(...hex2rgb(CC[k]));doc.roundedRect(x,yc-SQ/2,SQ,SQ,2,2,'F');
          setF('bold',6.4,'#ffffff');doc.text(PDF_CLS_LETRA[k],x+SQ/2,yc+2.3,{align:'center'});
          x+=SQ+SQG;
        }});
      }else{
        // muitas equipes: barra proporcional (cada cor = parte das equipes naquele conceito)
        const bw=colW-12,bx=colX+6;let x=bx;
        ordem.forEach(k=>{
          const n=c[k]||0;if(!n)return;
          const w=bw*n/t;
          doc.setFillColor(...hex2rgb(CC[k]));doc.rect(x,yc-SQ/2,w,SQ,'F');
          setF('bold',6.4);const s=String(n);
          if(doc.getTextWidth(s)+4<=w){setF('bold',6.4,'#ffffff');doc.text(s,x+w/2,yc+2.3,{align:'center'});}
          x+=w;
        });
      }
    }
    function legenda(){
      ensure(20);
      setF('normal',8.3,MUTED);doc.text('Cada quadrado é uma equipe:',MX,y+3);
      let lx=MX+doc.getTextWidth('Cada quadrado é uma equipe:')+10;
      ['Ótimo','Bom','Suficiente','Regular'].forEach(k=>{
        doc.setFillColor(...hex2rgb(CC[k]));doc.roundedRect(lx,y-SQ/2,SQ,SQ,2,2,'F');
        setF('bold',6.4,'#ffffff');doc.text(PDF_CLS_LETRA[k],lx+SQ/2,y+2.3,{align:'center'});
        setF('normal',8.3,'#4a5a66');doc.text(k,lx+SQ+5,y+3);
        lx+=SQ+5+doc.getTextWidth(k)+16;
      });
      y+=14;
      if(todos.some(it=>it.cur.total>6)){
        setF('normal',8.3,MUTED);doc.text('Com mais de 6 equipes, a barra mostra a proporção de equipes em cada conceito (os números são quantas equipes).',MX,y+3);
        y+=10;
      }
      y+=8;
    }
    // situação em palavras (no lugar da antiga "nota em %")
    function situacao(c){
      const t=clsTotal(c);
      if(c['Ótimo']===t)return{t:t>1?'Todas em Ótimo':'Em Ótimo',c:GREEN,b:true};
      if(c.Regular>0)return{t:t===1?'Em Regular':`${c.Regular} de ${t} em Regular`,c:RED,b:true};
      if(c.Suficiente>0)return{t:t===1?'Em Suficiente':`${c.Suficiente} de ${t} em Suficiente`,c:AMBER,b:true};
      return{t:c['Ótimo']?`${c['Ótimo']} de ${t} em Ótimo`:(t>1?'Todas em Bom':'Em Bom'),c:SUB,b:false};
    }

    // ================= PÁGINA 1 =================
    header();
    const todos=[];comp.tipos.forEach(g=>g.itens.forEach(it=>todos.push(it)));
    const nReg=todos.filter(it=>it.cur.c.Regular>0).length;
    const nOt=todos.filter(it=>it.cur.c['Ótimo']===it.cur.total).length;
    const nUp=todos.filter(it=>indDirecao(it)>0).length,nDn=todos.filter(it=>indDirecao(it)<0).length;

    secTitle('Como estão os indicadores de Qualidade',
      `Situação das equipes em cada indicador no relatório do SIAPS de ${qCodeKey(comp.curKey)}. Ponto de partida para a próxima agenda técnica com o município.`);
    const tiles=[
      {lbl:'Indicadores avaliados',val:String(todos.length),sub:`em ${comp.tipos.length} tipo${comp.tipos.length>1?'s':''} de equipe`,c:BLUE,sc:MUTED},
      {lbl:'Com equipe em Regular',val:String(nReg),sub:nReg?'prioridade da agenda':'nenhum — ótimo sinal',c:nReg?RED:GREEN,sc:nReg?RED:GREEN},
      {lbl:'Com todas em Ótimo',val:String(nOt),sub:nOt?'manter o que já funciona':'nenhum ainda',c:nOt?GREEN:BLUE,sc:MUTED},
      temPrev?{lbl:`Em relação ao ${qCodeKey(comp.prevKey)}`,val:`${nUp} ↑  ${nDn} ↓`,sub:`${nUp} melhoraram · ${nDn} pioraram`,c:BLUE,sc:MUTED}
             :{lbl:'Comparação',val:'—',sub:'só há um quadrimestre no relatório',c:MUTED,sc:MUTED}
    ];
    const TG=10,TWd=(tW-TG*3)/4,TH=64;
    tiles.forEach((t,i)=>{
      const tx=MX+i*(TWd+TG);
      doc.setFillColor(...hex2rgb(TILE));doc.roundedRect(tx,y,TWd,TH,5,5,'F');
      {let fl=8;setF('normal',fl,SUB);while(doc.getTextWidth(t.lbl)>TWd-20&&fl>6.6){fl-=0.2;doc.setFontSize(fl);}doc.text(t.lbl,tx+10,y+17);}
      if(t.val.includes('↑')){
        // setas desenhadas (a fonte do PDF não garante ↑/↓)
        setF('bold',17,BLUE);doc.text(String(nUp),tx+10,y+40);let ax=tx+10+doc.getTextWidth(String(nUp))+5;
        seta(ax,y+34,1,'#2e9b57');ax+=16;
        setF('bold',17,BLUE);doc.text(String(nDn),ax,y+40);ax+=doc.getTextWidth(String(nDn))+5;
        seta(ax,y+34,-1,'#c8433a');
      }else{setF('bold',17,t.c);doc.text(t.val,tx+10,y+40);}
      {let fs=7.8;setF('normal',fs,t.sc);while(doc.getTextWidth(t.sub)>TWd-20&&fs>6.4){fs-=0.2;doc.setFontSize(fs);}doc.text(t.sub,tx+10,y+55);}
    });
    y+=TH+28;

    // ---- onde focar: mesmas regras das prioridades do Relatório do quadrimestre + ação sugerida ----
    const prios=buildPrioridades(comp);
    if(prios.length){
      secTitle('Onde focar na próxima agenda','Em ordem de prioridade: equipes em Regular (há mais tempo primeiro), depois em Suficiente, o grupo mais perto de virar Ótimo e o indicador que mais caiu.');
      const FS=10,LH=13.2,TX=MX+30,TWd2=tW-30;
      prios.forEach((segs,i)=>{
        const lines=richLayout(segs,TWd2,FS);
        const acao=segs.it&&!(segs.grupo&&segs.grupo.length>1)?ACAO_INDICADOR[segs.it.indicador]:null;
        setF('normal',8.8);
        const acaoL=acao?doc.splitTextToSize('Sugestão: '+acao,TWd2):[];
        const h=lines.length*LH+(acaoL.length?acaoL.length*11+3:0)+12;
        ensure(h+4);
        const top=y-9;
        doc.setFillColor(...hex2rgb(NAVY));doc.circle(MX+9,top+9-3.4,8.5,'F');
        setF('bold',8.5,'#ffffff');doc.text(String(i+1),MX+9,top+9,{align:'center'});
        richDraw(lines,TX,y,FS,LH,'#2b3b48',INK);
        y+=lines.length*LH;
        if(acaoL.length){setF('normal',8.8,MUTED);acaoL.forEach((ln,j)=>doc.text(ln,TX,y+1+j*11));y+=acaoL.length*11+3;}
        doc.setDrawColor(...hex2rgb(LINE2));doc.setLineWidth(0.6);doc.line(MX,y,MX+tW,y);
        y+=12.5;
      });
      y+=8;
    }

    // ---- indicador por indicador, do mais crítico ao mais consolidado, por tipo de equipe ----
    const TIPO_NOME={eSF:'eSF — Saúde da Família',eAP:'eAP — Atenção Primária',eSB:'eSB — Saúde Bucal',eMulti:'eMulti — Multiprofissional',eAPP:'eAPP — Atenção Primária Prisional',eCR:'eCR — Consultório na Rua',eSFR:'eSFR — Saúde da Família Ribeirinha'};
    const wQ=80,wSit=110,wTend=temPrev?62:0;
    const wInd=tW-wQ*(temPrev?2:1)-wSit-wTend;
    const cols=[{l:'Indicador',w:wInd}];
    if(temPrev)cols.push({l:qShortKey(comp.prevKey),w:wQ,c:true});
    cols.push({l:qShortKey(comp.curKey),w:wQ,c:true},{l:'Situação',w:wSit});
    if(temPrev)cols.push({l:'Tendência',w:wTend});
    const drawHead=()=>{
      let cx=MX;setF('bold',6.8,MUTED);
      cols.forEach(c=>{doc.text(c.l.toUpperCase(),c.c?cx+c.w/2:cx+6,y+10,{align:c.c?'center':'left'});cx+=c.w;});
      y+=18;doc.setDrawColor(...hex2rgb('#cfd8df'));doc.setLineWidth(0.9);doc.line(MX,y,MX+tW,y);
    };
    const ordemCrit=(a,b)=>a.cur.score-b.cur.score||b.cur.c.Regular-a.cur.c.Regular;
    let primeiro=true;
    comp.tipos.forEach(g=>{
      const itens=[...g.itens].sort(ordemCrit);
      const nEq=Math.max(...itens.map(it=>it.cur.total));
      // título do tipo + cabeçalho + pelo menos 2 linhas juntos
      if(y+60+18+40>FOOT_TOP)newPage();
      if(primeiro){secTitle('Indicador por indicador','Do indicador mais crítico ao mais consolidado, em cada tipo de equipe.');legenda();primeiro=false;}
      setF('bold',10.5,NAVY);doc.text(TIPO_NOME[g.tipo]||g.tipo,MX,y+4);
      setF('normal',8.8,MUTED);doc.text(`${nEq} equipe${nEq>1?'s':''} · ${itens.length} indicador${itens.length>1?'es':''}`,PW-MX,y+4,{align:'right'});
      y+=12;drawHead();
      itens.forEach(it=>{
        setF('normal',9.2);
        const nomeL=doc.splitTextToSize(indNomeTabela(it.indicador),wInd-10);
        setF('bold',8.6);const nSit=doc.splitTextToSize(situacao(it.cur.c).t,wSit-8).length;
        const rh=Math.max(20,nomeL.length*10.5+9,nSit*10+9);
        if(y+rh>FOOT_TOP){newPage();setF('bold',10.5,NAVY);doc.text(`${TIPO_NOME[g.tipo]||g.tipo} (continuação)`,MX,y+4);y+=12;drawHead();}
        const yc=y+rh/2;let cx=MX;
        setF('normal',9.2,'#2b3b48');
        nomeL.forEach((ln,i)=>doc.text(ln,cx+6,yc+3.3-(nomeL.length-1)*5.25+i*10.5));
        cx+=wInd;
        if(temPrev){drawConceito(it.prev?it.prev.c:null,cx,wQ,yc);cx+=wQ;}
        drawConceito(it.cur.c,cx,wQ,yc);cx+=wQ;
        const st=situacao(it.cur.c);
        setF(st.b?'bold':'normal',8.6,st.c);{const sl=doc.splitTextToSize(st.t,wSit-8);sl.forEach((ln,i)=>doc.text(ln,cx+6,yc+3.2-(sl.length-1)*5+i*10));}cx+=wSit;
        if(temPrev){
          const d=indDirecao(it);
          if(!it.prev){setF('normal',8.6,MUTED);doc.text('novo',cx+6,yc+3.2);}
          else if(d===0){setF('normal',8.6,'#8a98a3');doc.text('= igual',cx+6,yc+3.2);}
          else{seta(cx+6,yc,d,d>0?'#2e9b57':'#c8433a');setF('bold',8.6,d>0?GREEN:RED);doc.text(d>0?'melhorou':'piorou',cx+17,yc+3.2);}
        }
        y+=rh;
        doc.setDrawColor(...hex2rgb(LINE2));doc.setLineWidth(0.6);doc.line(MX,y,MX+tW,y);
      });
      y+=24;
    });

    // ---- como ler ----
    {
      const txt='Como ler. Cada quadrado é uma equipe, na cor do conceito que ela tirou naquele indicador no relatório "Qualidade – Conceito obtido por indicador" do SIAPS. A ordem (do mais crítico ao mais consolidado) considera o peso oficial de cada conceito (Regular 0,25 · Suficiente 0,50 · Bom 0,75 · Ótimo 1). A "Situação" resume onde estão as equipes que mais precisam de atenção.';
      setF('normal',8.6);const L=doc.splitTextToSize(txt,tW-24);
      const h=L.length*11+18;ensure(h+6);
      doc.setFillColor(...hex2rgb(TILE));doc.roundedRect(MX,y,tW,h,5,5,'F');
      L.forEach((ln,i)=>{setF(i===0?'normal':'normal',8.6,SUB);doc.text(ln,MX+12,y+15+i*11);});
      y+=h+10;
    }

    // ---- rodapé fixo em todas as páginas ----
    const rodTxt=`Fonte: SIAPS — relatório público “Qualidade – Conceito obtido por indicador” (Nota Técnica nº 6/2025-DEAPS/SAPS/MS); PDF gerado em ${new Date().toLocaleDateString('pt-BR')}. Não substitui os relatórios oficiais do SIAPS/FNS. Os valores podem divergir dos registrados no Fundo Municipal de Saúde. ${AVISO_IA}`;
    const totalPages=doc.internal.getNumberOfPages();
    for(let p=1;p<=totalPages;p++){
      doc.setPage(p);
      doc.setDrawColor(...hex2rgb(LINE));doc.setLineWidth(0.7);doc.line(MX,PH-64,PW-MX,PH-64);
      setF('bold',7.4,INK);
      doc.text('Documento de uso interno — não enviar ao município.',MX,PH-52);
      setF('normal',6.8,'#7d8b95');
      doc.splitTextToSize(rodTxt,tW-150).forEach((ln,i)=>doc.text(ln,MX,PH-42+i*8.2));
      setF('normal',7.6,'#7d8b95');
      doc.text(`Governança Brasil · ${p}/${totalPages}`,PW-MX,PH-52,{align:'right'});
      if(p===totalPages){setF('normal',6.8,'#9aa9b3');doc.text('Desenvolvido por Jarom Sambrana da Rosa',PW-MX,PH-42,{align:'right'});}
    }

    const pdfFilenameRaiox='RaioX_Indicador_'+slugify(muni)+'_'+qCodeKey(comp.curKey)+'.pdf';
    doc.save(pdfFilenameRaiox);
    offerPdfFallback(doc,pdfFilenameRaiox,'pdf-fallback-raiox');
  }catch(err){
    console.error(err);
    alert('Não foi possível gerar o Raio-X: '+err.message);
  }finally{
    if(btn){btn.textContent=prevTxt;btn.classList.remove('disabled');}
  }
}
