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
    const MX=52,tW=PW-2*MX;
    const last=lastRes[lastRes.length-1];

    // ---- cabeçalho ----
    doc.setFillColor(...hex2rgb('#09274C'));doc.rect(0,0,PW,86,'F');
    const lh=26,lw=lh*(755/179);
    doc.addImage(LOGO_PDF_DARK,'PNG',MX,24,lw,lh);
    doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(...hex2rgb('#B6F6FF'));
    doc.text('RESUMO EXECUTIVO · REPASSE DA ATENÇÃO PRIMÁRIA',MX+lw+16,32);
    doc.setFont('helvetica','bold');doc.setFontSize(19);doc.setTextColor(255,255,255);
    doc.text(parsed.nomeMuni||'Município',MX+lw+16,55);
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(...hex2rgb('#cfe0ea'));
    doc.text(`${parsed.uf?parsed.uf+'  ·  ':''}Avaliação do ${last.quad} · Saúde Brasil 360 (Portaria GM/MS nº 3.493/2024)`,MX+lw+16,70);

    let y=86+42;

    // ---- bloco 1: quanto o município recebe hoje ----
    doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(...hex2rgb('#09274C'));
    doc.text('Quanto o município recebe hoje',MX,y);
    doc.setDrawColor(...hex2rgb('#e4eaee'));doc.line(MX,y+9,PW-MX,y+9);
    y+=30;

    doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.setTextColor(...hex2rgb('#3c5163'));
    doc.text('Repasse federal mensal da Atenção Primária, com base no relatório mais recente do SIAPS:',MX,y);
    y+=32;

    doc.setFont('helvetica','bold');doc.setFontSize(36);doc.setTextColor(...hex2rgb('#09274C'));
    doc.text(fmtBRL(last.total),MX,y);
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(...hex2rgb('#63757f'));
    doc.text(`Cerca de ${fmtBRL(last.total*4)} no quadrimestre (4 meses)`,MX,y+18);
    y+=46;

    // três componentes, em linguagem simples
    const comp=[
      {label:'Base fixa (Componente Fixo/IED)',val:last.fixo},
      {label:'Vínculo com a comunidade (CVAT)',val:last.vin},
      {label:'Qualidade do atendimento',val:last.qual}
    ];
    const gutter=20,colW=(tW-2*gutter)/3,cardH=64;
    comp.forEach((c,i)=>{
      const cx=MX+i*(colW+gutter);
      doc.setFillColor(247,250,251);doc.roundedRect(cx,y,colW,cardH,7,7,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...hex2rgb('#63757f'));
      const lbl=doc.splitTextToSize(c.label,colW-22);
      lbl.forEach((ln,li)=>doc.text(ln,cx+11,y+16+li*10));
      doc.setFont('helvetica','bold');doc.setFontSize(15);doc.setTextColor(...hex2rgb('#2E6FE0'));
      doc.text(fmtBRL(c.val),cx+11,y+cardH-14);
    });
    y+=cardH+34;

    // ---- bloco 2: um passo realista (não o potencial distante) ----
    doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(...hex2rgb('#09274C'));
    doc.text('Um passo realista para aumentar esse valor',MX,y);
    doc.line(MX,y+9,PW-MX,y+9);
    y+=32;

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
      const n=Math.round(top.n),full=TYPE_META[top.tipo].full;
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
        const p2=passos[1],n2=Math.round(p2.n);
        const frase2=`Outra oportunidade: ${n2} equipe${n2>1?'s':''} de ${TYPE_META[p2.tipo].label} em "${p2.classeAtual}" (${p2.componente}) subir para "${p2.classeProxima}" representaria + ${fmtBRL(p2.gain)}/mês.`;
        doc.setFont('helvetica','italic');doc.setFontSize(9.5);doc.setTextColor(...hex2rgb('#63757f'));
        const f2=doc.splitTextToSize(frase2,tW);
        f2.forEach((ln,i)=>doc.text(ln,MX,y+i*12));
        y+=f2.length*12+8;
      }
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
