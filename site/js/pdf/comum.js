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

// Aviso de estimativa para os PDFs entregues ao município (v4.14.0): deixa claro, junto do valor,
// que é estimativa a partir do relatório público, quais modalidades foram consideradas (o relatório
// não traz a modalidade das equipes) e a faixa possível. Devolve {titulo, texto}.
function avisoEstimativaPdf(rows,p){
  const f=faixaModalidade(rows,p);
  const nomes={eap:p.eapMod==='20'?'eAP 20h':'eAP 30h',
    esb:{I_comum:'eSB I',II_comum:'eSB II',I_quil:'eSB I quilombola/assentamento',II_quil:'eSB II quilombola/assentamento'}[p.esbMod]||'eSB',
    emulti:{estrategica:'eMulti Estratégica',complementar:'eMulti Complementar',ampliada:'eMulti Ampliada'}[p.emultiMod]||'eMulti',
    ecr:'eCR '+(p.ecrMod||'I'),eapp:{ess20:'eAPP Essencial 20h',ess30:'eAPP Essencial 30h',amp20:'eAPP Ampliada 20h',amp30:'eAPP Ampliada 30h'}[p.eappMod]||'eAPP'};
  if(!faixaRelevante(f))return{titulo:'Valores estimados',
    texto:'Calculados pela quantidade e pela classificação das equipes no relatório público do SIAPS. O valor oficial é o informado pelo Fundo Nacional de Saúde.'};
  const cons=f.tipos.map(t=>nomes[t.k]).join(', ');
  return{titulo:'Valores estimados',
    texto:`Calculados pela quantidade e pela classificação das equipes no relatório público do SIAPS, que não informa a modalidade de cada equipe. Foram consideradas: ${cons}. Conforme as modalidades reais, o repasse mensal pode ficar entre ${fmtBRL(f.min)} e ${fmtBRL(f.max)}. O valor oficial é o informado pelo Fundo Nacional de Saúde.`};
}
// desenha o aviso num quadro claro com borda âmbar (título em negrito no começo do texto); devolve a altura usada
function desenharAvisoEstimativa(doc,x,y,w,aviso,o={}){
  const fs=o.fs||7.8,lh=fs*1.32,PX=10;
  const tit=aviso.titulo+': ';
  doc.setFont('helvetica','bold');doc.setFontSize(fs);const tw=doc.getTextWidth(tit);
  doc.setFont('helvetica','normal');
  // 1ª linha começa depois do título; as demais usam a largura toda
  const palavras=aviso.texto.split(' '),linhas=[];let cur='',max=w-PX*2-tw;
  palavras.forEach(p=>{const t=cur?cur+' '+p:p;if(doc.getTextWidth(t)>max&&cur){linhas.push(cur);cur=p;max=w-PX*2;}else cur=t;});
  if(cur)linhas.push(cur);
  const h=9+linhas.length*lh+5;
  doc.setFillColor(...hex2rgb('#fdf8ec'));doc.setDrawColor(...hex2rgb('#efd9a3'));doc.setLineWidth(0.7);
  doc.roundedRect(x,y,w,h,4,4,'FD');
  const by=y+9+fs*0.75;
  doc.setFont('helvetica','bold');doc.setFontSize(fs);doc.setTextColor(...hex2rgb('#8a5a00'));doc.text(tit,x+PX,by);
  doc.setFont('helvetica','normal');doc.setTextColor(...hex2rgb('#3c4d5a'));
  linhas.forEach((ln,k)=>doc.text(ln,k?x+PX:x+PX+tw,by+k*lh));
  return h;
}
