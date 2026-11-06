/* Funções comuns de PDF: cores, nome de arquivo, tabela e link manual de download. */

/* =========================================================================
   EXPORTAÇÃO EM PDF
   Funções comuns aos três PDFs (relatório do quadrimestre, resumo para o
   secretário e Raio-X). Os PDFs são montados 100% no navegador com a
   biblioteca jsPDF (vendor/jspdf.umd.min.js) — nada é enviado a servidores.
   ========================================================================= */
// Divulgação de uso de IA exigida pela Política de Governança de IA (item 7.1) em material
// entregue a clientes. Aparece no rodapé dos três PDFs e na metodologia da tela.
const AVISO_IA='Ferramenta desenvolvida com apoio de IA; valores calculados por regras fixas a partir de dados públicos do SIAPS.';
function hex2rgb(hex){
  hex=String(hex).replace('#','');
  return [parseInt(hex.substr(0,2),16),parseInt(hex.substr(2,2),16),parseInt(hex.substr(4,2),16)];
}
function slugify(s){
  return String(s||'municipio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'municipio';
}
// Aviso de PDF gerado (v2.3.0): pequeno aviso no canto inferior direito da tela, que some
// sozinho. doc.save() (chamado logo antes, em cada gerador de PDF) baixa o arquivo
// automaticamente para a grande maioria — mas em alguns computadores (antivírus/política
// corporativa) o download automático é descartado em silêncio, sem nenhum erro que o
// JavaScript consiga detectar. Por isso o aviso traz também o link "Baixar de novo", de clique
// manual, que baixa o mesmo arquivo já pronto (sem gerar o PDF de novo).
// O aviso fica 10 s na tela (pausa enquanto o mouse está em cima ou o link tem foco) e pode
// ser fechado no ×. Um aviso por tipo de PDF: gerar de novo substitui o anterior.
const PDF_AVISO_ROTULO={'pdf-fallback-full':'Relatório do quadrimestre','pdf-fallback-resumo':'Resumo para o secretário','pdf-fallback-raiox':'Raio-X por indicador'};
const PDF_AVISO_MS=10000;
function pdfAvisosArea(){
  let a=document.getElementById('pdf-avisos');
  if(!a){a=document.createElement('div');a.id='pdf-avisos';a.className='toasts';a.setAttribute('aria-live','polite');document.body.appendChild(a);}
  return a;
}
function offerPdfFallback(doc,filename,linkId){
  let url;
  try{url=URL.createObjectURL(doc.output('blob'));}catch(e){url=null;}
  hidePdfFallback(linkId);
  const t=document.createElement('div');
  t.className='toast';t.id='aviso-'+linkId;t.setAttribute('role','status');
  const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  t.innerHTML=`<span class="toast-ic" aria-hidden="true">✓</span><div class="toast-tx"><b>${esc(PDF_AVISO_ROTULO[linkId]||'PDF')} gerado</b>`+
    `<span class="toast-fn">${esc(filename)}</span>`+
    (url?`<a class="toast-lk" href="${url}" download="${esc(filename)}">O download não começou? Baixar de novo</a>`:'')+
    `</div><button type="button" class="toast-x" aria-label="Fechar aviso">×</button><i class="toast-bar" aria-hidden="true"></i>`;
  t.dataset.blobUrl=url||'';
  pdfAvisosArea().appendChild(t);
  // tempo para sumir, com pausa no hover/foco
  let resta=PDF_AVISO_MS,inicio=Date.now(),tm=null;
  const bar=t.querySelector('.toast-bar');
  const rodar=()=>{inicio=Date.now();tm=setTimeout(()=>fecharAvisoPdf(t),resta);bar.style.animationPlayState='running';};
  const pausar=()=>{clearTimeout(tm);resta-=Date.now()-inicio;bar.style.animationPlayState='paused';};
  bar.style.animationDuration=PDF_AVISO_MS+'ms';
  t.addEventListener('mouseenter',pausar);t.addEventListener('mouseleave',rodar);
  t.addEventListener('focusin',pausar);t.addEventListener('focusout',rodar);
  t.querySelector('.toast-x').addEventListener('click',()=>fecharAvisoPdf(t));
  requestAnimationFrame(()=>t.classList.add('show'));
  rodar();
}
function fecharAvisoPdf(t){
  if(!t||!t.isConnected)return;
  t.classList.remove('show');t.classList.add('hide');
  const url=t.dataset.blobUrl;
  setTimeout(()=>{t.remove();if(url)URL.revokeObjectURL(url);},300);
}
// hidePdfFallback(): ao trocar de município, fecha o aviso daquele tipo de PDF (o link
// apontaria para o PDF do município anterior).
function hidePdfFallback(linkId){
  const t=document.getElementById('aviso-'+linkId);
  if(t){t.remove();if(t.dataset.blobUrl)URL.revokeObjectURL(t.dataset.blobUrl);}
}
function pdfTable(doc,x,y,cols,rows,opts={}){
  const rowH=opts.rowH||18,headerH=opts.headerH||20,fontSize=opts.fontSize||9;
  const totalW=cols.reduce((s,c)=>s+c.w,0);
  doc.setFontSize(fontSize);
  doc.setFillColor(...hex2rgb('#09274C'));
  doc.rect(x,y,totalW,headerH,'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  let cx=x;
  cols.forEach(c=>{doc.text(c.label,c.align==='right'?cx+c.w-6:cx+6,y+headerH/2+3,{align:c.align==='right'?'right':'left'});cx+=c.w;});
  y+=headerH;
  doc.setFont('helvetica','normal');
  rows.forEach((r,i)=>{
    if(r.isTotal){doc.setFillColor(...hex2rgb('#09274C'));doc.rect(x,y,totalW,rowH,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');}
    else{
      if(i%2===1){doc.setFillColor(244,247,248);doc.rect(x,y,totalW,rowH,'F');}
      doc.setTextColor(15,32,48);doc.setFont('helvetica','normal');
    }
    let cx2=x;
    cols.forEach(c=>{
      const v=r[c.key]??'';
      doc.text(String(v),c.align==='right'?cx2+c.w-6:cx2+6,y+rowH/2+3,{align:c.align==='right'?'right':'left'});
      cx2+=c.w;
    });
    doc.setDrawColor(...hex2rgb('#e4eaee'));
    doc.line(x,y+rowH,x+totalW,y+rowH);
    y+=rowH;
  });
  doc.setTextColor(15,32,48);
  return y;
}
