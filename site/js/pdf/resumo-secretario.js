/* PDF de 1 página para o secretário/gestor (botão "Resumo p/ secretário"). */

/* =========================================================================
   RESUMO EXECUTIVO (1 página) — para entregar ao secretário/gestor político.
   -------------------------------------------------------------------------
   Diferente do relatório completo (generatePDF): linguagem simples, sem
   jargão de metodologia, sempre 1 página. Em vez do "potencial máximo"
   (todas as equipes em "Ótimo" — distante e abstrato), destaca o "próximo
   passo" mais realista: a maior oportunidade de subir UM nível de
   classificação num grupo de equipes que já existe hoje (computeProximosPassos).
   ========================================================================= */
function generatePDFResumo(){
  if(!parsed||!lastRes||!lastParams||!lastParams.estrato)return;
  if(!window.jspdf){alert('A biblioteca de geração de PDF não carregou. Verifique sua conexão com a internet e tente novamente.');return;}
  const btn=document.getElementById('btn-resumo');
  const prevTxt=btn.textContent;
  btn.textContent='Gerando…';btn.classList.add('disabled');
  try{
    const {jsPDF}=window.jspdf;
    const doc=prepararFontesPdf(new jsPDF({unit:'pt',format:'a4'}));
    const PW=doc.internal.pageSize.getWidth(),PH=doc.internal.pageSize.getHeight();
    const MX=46,tW=PW-2*MX;
    const NAVY='#09274C',INK='#16283a',SUB='#3c4d5a',MUTED='#6b7c88',LINE='#dbe3e9',TILE='#f2f5f8',
          BLUE='#2E6FE0',GREEN='#1d8048',GREEN_BG='#e2f3e8',RED='#c0392b',RED_BG='#fbe8e5';
    const setF=(style,size,color)=>{doc.setFont('helvetica',style);doc.setFontSize(size);if(color)doc.setTextColor(...hex2rgb(color));};
    const last=lastRes[lastRes.length-1],prev=lastRes.length>1?lastRes[lastRes.length-2]:null;
    const R0=v=>Math.round(v||0);
    const semEquipes=s=>String(s).replace(/^Equipes? de /i,'');   // "Equipes de Saúde da Família" → "Saúde da Família"

    // ---- cabeçalho (mesmo padrão do Relatório do quadrimestre e do Raio-X) ----
    {
      const muni=(parsed.nomeMuni||'Município').toLocaleUpperCase('pt-BR');
      const logoH=30,logoW=logoH*(755/179),tx=MX+logoW+28,tw=PW-MX-tx;
      let ns=20;setF('bold',ns);while(doc.getTextWidth(muni)>tw&&ns>12){ns-=1;doc.setFontSize(ns);}
      const H=98;
      doc.setFillColor(...hex2rgb(NAVY));doc.rect(0,0,PW,H,'F');
      doc.addImage(LOGO_PDF_DARK,'PNG',MX,(H-logoH)/2,logoW,logoH);
      setF('bold',7.5,'#8fc3ea');doc.text('RESUMO EXECUTIVO · REPASSE DA ATENÇÃO PRIMÁRIA',tx,30,{charSpace:0.25});
      setF('bold',ns,'#ffffff');doc.text(muni,tx,38+ns*0.9);
      setF('normal',9,'#d4e2ee');
      doc.text([parsed.uf||'',`Avaliação ${qCode(last.quad)}`,'Saúde Brasil 360 (Portaria GM/MS nº 3.493/2024)'].filter(Boolean).join(' · '),tx,53+ns*0.9);
    }
    let y=98+34;
    const secTitle=t=>{setF('bold',12.5,INK);doc.text(t,MX,y);doc.setDrawColor(...hex2rgb(LINE));doc.setLineWidth(0.8);doc.line(MX,y+8,PW-MX,y+8);y+=28;};

    // ---- bloco 1: quanto o município recebe hoje ----
    secTitle('Quanto o município recebe hoje');
    setF('normal',10.5,SUB);
    doc.text('Repasse federal mensal da Atenção Primária, com base no relatório mais recente do SIAPS:',MX,y);
    y+=37;
    setF('bold',34,NAVY);
    doc.text(fmtBRL(last.total),MX,y);
    const bigW=doc.getTextWidth(fmtBRL(last.total));
    if(prev){
      const d=R0(last.total)-R0(prev.total),dir=d>0?1:d<0?-1:0;
      const chipTxt=dir===0?`igual ao ${qCode(prev.quad)}`:`${dir>0?'+':'-'} ${fmtBRL(Math.abs(d))} / mês em relação ao ${qCode(prev.quad)}`;
      setF('bold',9.5);
      const cw=doc.getTextWidth(chipTxt)+20,cx=MX+bigW+18,cy=y-18;
      doc.setFillColor(...hex2rgb(dir>0?GREEN_BG:dir<0?RED_BG:TILE));doc.roundedRect(cx,cy,cw,21,4,4,'F');
      setF('bold',9.5,dir>0?GREEN:dir<0?RED:MUTED);doc.text(chipTxt,cx+10,cy+14);
    }
    setF('normal',9.5,MUTED);
    doc.text(`Cerca de ${fmtBRL(last.total*4)} no quadrimestre (4 meses).`,MX,y+19);
    y+=40;

    // três componentes, em linguagem simples
    const comp=[
      {label:'Base fixa',sub:'Componente Fixo/IED',val:last.fixo},
      {label:'Vínculo com a comunidade',sub:'CVAT',val:last.vin},
      {label:'Qualidade do atendimento',sub:'Componente de Qualidade',val:last.qual}
    ];
    const gutter=10,colW=(tW-2*gutter)/3,cardH=62;
    comp.forEach((c,i)=>{
      const cx=MX+i*(colW+gutter);
      doc.setFillColor(...hex2rgb(TILE));doc.roundedRect(cx,y,colW,cardH,5,5,'F');
      setF('bold',9,SUB);doc.text(c.label,cx+12,y+18);
      setF('bold',16,BLUE);doc.text(fmtBRL(c.val),cx+12,y+40);
      setF('normal',7.8,MUTED);doc.text(c.sub,cx+12,y+53);
    });
    y+=cardH+10;
    // aviso de estimativa logo abaixo dos valores (a modalidade das equipes não é pública)
    y+=desenharAvisoEstimativa(doc,MX,y,tW,avisoEstimativaPdf(parsed.rows,lastParams),{fs:7.8})+26;

    // ---- bloco 2: um passo realista (não o potencial distante) ----
    secTitle('Um passo realista para aumentar esse valor');
    y+=4;

    const passos=computeProximosPassos(parsed.rows,last.quad,lastParams);
    if(!passos.length){
      doc.setFillColor(...hex2rgb('#e6f5e0'));doc.roundedRect(MX,y,tW,70,9,9,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(11.5);doc.setTextColor(...hex2rgb('#015840'));
      doc.text('Parabéns — todas as equipes já estão na classificação máxima ("Ótimo")',MX+18,y+28);
      doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(...hex2rgb('#3c5163'));
      doc.text('neste quadrimestre. Com o quantitativo atual de equipes, o município já recebe o valor mais alto possível.',MX+18,y+46);
      y+=70+30;
    }else{
      const top=passos[0];
      const n=Math.round(top.n),full=semEquipes(TYPE_META[top.tipo].full);
      const linha1=n>1
        ?`Hoje, ${n} equipes de ${full} estão classificadas como "${top.classeAtual}" no critério de ${top.componente}.`
        :`Hoje, ${n} equipe de ${full} está classificada como "${top.classeAtual}" no critério de ${top.componente}.`;
      const linha2=n>1
        ?`Se elas subirem para "${top.classeProxima}" no próximo quadrimestre, o repasse mensal aumenta:`
        :`Se ela subir para "${top.classeProxima}" no próximo quadrimestre, o repasse mensal aumenta:`;

      doc.setFillColor(...hex2rgb('#09274C'));doc.roundedRect(MX,y,tW,116,10,10,'F');
      doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.setTextColor(...hex2rgb('#B6F6FF'));
      const l1=doc.splitTextToSize(linha1,tW-40);
      l1.forEach((ln,i)=>doc.text(ln,MX+20,y+26+i*13));
      let by=y+26+l1.length*13+4;
      const l2=doc.splitTextToSize(linha2,tW-40);
      l2.forEach((ln,i)=>doc.text(ln,MX+20,by+i*13));
      by+=l2.length*13+22;

      doc.setFont('helvetica','bold');doc.setFontSize(23);doc.setTextColor(...hex2rgb('#B6E85A'));
      doc.text('+ '+fmtBRL(top.gain)+' / mês',MX+20,by);
      doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...hex2rgb('#9fb6c8'));
      doc.text(`Cerca de ${fmtBRL(top.gain*4)} já no próximo quadrimestre`,MX+20,by+16);
      y+=116+22;

      if(passos[1]){
        // segunda oportunidade num quadro claro, com o valor à direita
        const p2=passos[1],n2=Math.round(p2.n);
        const frase2=`${n2} equipe${n2>1?'s':''} de ${semEquipes(TYPE_META[p2.tipo].full)} em "${p2.classeAtual}" (${p2.componente}) subindo para "${p2.classeProxima}".`;
        const valTxt='+ '+fmtBRL(p2.gain)+' / mês';
        setF('bold',14);const vw=doc.getTextWidth(valTxt);
        setF('normal',9.5);const f2=doc.splitTextToSize(frase2,tW-vw-60);
        const bh=Math.max(52,26+f2.length*12+12);
        doc.setFillColor(...hex2rgb(TILE));doc.roundedRect(MX,y,tW,bh,8,8,'F');
        setF('bold',7.5,MUTED);doc.text('OUTRA OPORTUNIDADE',MX+18,y+18,{charSpace:0.3});
        setF('normal',9.5,INK);f2.forEach((ln,i)=>doc.text(ln,MX+18,y+32+i*12));
        setF('bold',14,GREEN);doc.text(valTxt,PW-MX-18,y+bh/2+5,{align:'right'});
        y+=bh+10;
      }
    }

    // ---- bloco 3: como o repasse evoluiu (barras simples, um valor por quadrimestre) ----
    const serie=lastRes.slice(-6);
    // o gráfico se ajusta ao espaço que sobra (some se sobrar pouco)
    const espaco=PH-66-y-16-28-30;
    if(serie.length>=2&&espaco>=50){
      y+=16;
      secTitle('Como o repasse mensal evoluiu');
      const chH=Math.min(96,espaco-6),baseY=y+chH+6,max=Math.max(...serie.map(r=>r.total))||1;
      const n=serie.length,slot=tW/n,bw=Math.min(64,slot*0.56);
      serie.forEach((r,i)=>{
        const h=Math.max(4,(r.total/max)*chH*0.82),bx=MX+i*slot+(slot-bw)/2,isLast=i===n-1;
        doc.setFillColor(...hex2rgb(isLast?NAVY:'#c7d6e6'));doc.roundedRect(bx,baseY-h,bw,h,3,3,'F');
        setF('bold',8.6,isLast?NAVY:SUB);doc.text(fmtBRLcurto(r.total),bx+bw/2,baseY-h-6,{align:'center'});
        setF(isLast?'bold':'normal',8.4,isLast?NAVY:MUTED);doc.text(qCode(r.quad),bx+bw/2,baseY+14,{align:'center'});
      });
      doc.setDrawColor(...hex2rgb(LINE));doc.setLineWidth(0.8);doc.line(MX,baseY,PW-MX,baseY);
      y=baseY+30;
    }

    // ---- rodapé, sem metodologia completa — só a referência essencial ----
    doc.setDrawColor(...hex2rgb('#e4eaee'));doc.line(MX,PH-60,PW-MX,PH-60);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...hex2rgb('#9aa9b3'));
    const rodape=doc.splitTextToSize('Baseado no relatório público do SIAPS. Os valores podem divergir dos registrados no Fundo Municipal de Saúde. Ferramenta de apoio — não substitui a conciliação com o Fundo Municipal, o e-Gestor nem os demonstrativos oficiais do FNS. '+AVISO_IA,tW-140);
    rodape.forEach((ln,i)=>doc.text(ln,MX,PH-47+i*9.5));
    doc.setFont('helvetica','bold');doc.setTextColor(...hex2rgb('#63757f'));
    doc.text('Governança Brasil',PW-MX,PH-44,{align:'right'});

    const pdfFilenameResumo='Resumo_Secretario_'+slugify(parsed.nomeMuni)+'_'+slugify(last.quad)+'.pdf';
    doc.save(pdfFilenameResumo);
    offerPdfFallback(doc,pdfFilenameResumo,'pdf-fallback-resumo');
  }catch(err){
    console.error(err);
    alert('Não foi possível gerar o resumo: '+err.message);
  }finally{
    btn.textContent=prevTxt;btn.classList.remove('disabled');
  }
}
