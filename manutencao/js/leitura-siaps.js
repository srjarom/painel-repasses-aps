/* =========================================================================
   LEITURA DOS RELATÓRIOS DO SIAPS E DA LISTA DE CLIENTES (só manutenção)
   -------------------------------------------------------------------------
   parseLoteWorkbook(): lê os relatórios públicos do SIAPS gerados com a UF
   selecionada e o município em branco ("Todos") — "Vínculo e Acompanhamento
   Territorial e Qualidade" e "Qualidade – Conceito obtido por indicador" — e
   separa as linhas por código IBGE. Também aceita o relatório de um município só.
   parseClientesWorkbook(): lê a planilha do comercial (coluna "Cliente") e
   identifica o município pelo nome.
   mesclarPorQuad(): junta dados novos aos já publicados — os quadrimestres do
   arquivo novo substituem os antigos; os que não vieram continuam como estavam.
   ========================================================================= */
const loteNum=v=>{const n=parseInt(String(v==null?'':v).replace(/[^\d]/g,''),10);return isNaN(n)?0:n;};

function parseLoteWorkbook(wb,fileName){
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
  let uf='',hdrMun='';
  rows.forEach(r=>{const c0=String(r[0]||'');
    if(c0.startsWith('UF:'))uf=c0.replace('UF:','').trim();
    if(c0.startsWith('Município:'))hdrMun=c0.replace('Município:','').trim();});
  let h=-1;for(let i=0;i<rows.length;i++){if(rows[i]&&String(rows[i][0]||'').trim()==='Quadrimestre/Ano'){h=i;break;}}
  if(h===-1)throw new Error(`"${fileName}": não encontrei o cabeçalho "Quadrimestre/Ano" — não parece um relatório do SIAPS.`);
  const hd=rows[h].map(x=>String(x||'').toLowerCase());
  const find=(...has)=>hd.findIndex(s=>has.every(x=>s.includes(x)));
  const iQ=find('quadrimestre'),iIb=find('ibge'),iMu=hd.findIndex((s,i)=>i!==iQ&&s.startsWith('munic'));
  const isInd=find('indicador')>=0,isMain=!isInd&&find('classifica')>=0;
  if(!isInd&&!isMain)throw new Error(`"${fileName}": não reconheci o relatório. Envie "Vínculo e Acompanhamento Territorial e Qualidade" e/ou "Qualidade – Conceito obtido por indicador".`);
  // arquivo de um município só (sem coluna de IBGE): usa o "Município: 430950 / NOME" do topo
  let fixIb='',fixNome='';
  if(iIb<0){
    const m=hdrMun.split('/');fixIb=(m[0]||'').trim();fixNome=(m.slice(1).join('/')||'').trim();
    if(!/^\d{6,7}$/.test(fixIb))throw new Error(`"${fileName}": não encontrei o código IBGE dos municípios nesse arquivo.`);
  }
  const por=new Map();
  const push=(ib,nome,row)=>{if(!por.has(ib))por.set(ib,{ibge:ib,nome,rows:[]});por.get(ib).rows.push(row);};
  const quads=new Set();
  const ibOf=r=>iIb>=0?String(r[iIb]||'').trim():fixIb;
  const nomeOf=r=>iMu>=0?String(r[iMu]||'').trim():fixNome;
  if(isMain){
    // colunas pelo nome exato do tipo ("eSF" ≠ "eSFR", "eAP" ≠ "eAPP")
    const col=(comp,tipo)=>hd.findIndex(s=>s.includes(comp)&&new RegExp('\\b'+tipo+'\\b').test(s));
    const iC=find('classifica'),iVE=col('vínculo','esf'),iVA=col('vínculo','eap'),iQE=col('qualidade','esf'),iQA=col('qualidade','eap');
    const iFR=col('qualidade','esfr'),iPP=col('qualidade','eapp'),iCR=col('qualidade','ecr');
    let iB=-1,iM=-1;hd.forEach((l,i)=>{if(l.includes('qualidade')&&l.includes('sb'))iB=i;if(l.includes('qualidade')&&l.includes('multi'))iM=i;});
    const val=(r,i)=>i>=0?loteNum(r[i]):0;
    for(let i=h+1;i<rows.length;i++){
      const r=rows[i];if(!r)continue;
      const q=String(r[iQ]||'').trim(),ib=ibOf(r),classe=String(r[iC]||'').trim();
      if(!/^\d{6,7}$/.test(ib)||!quadKey(q)||!CLASS_ORDEM.includes(classe))continue;
      quads.add(q);
      push(ib,nomeOf(r),{quad:q,classe,vEsf:val(r,iVE),vEap:val(r,iVA),qEsf:val(r,iQE),qEap:val(r,iQA),qEsb:val(r,iB),qEmulti:val(r,iM),
        qEsfr:val(r,iFR),qEapp:val(r,iPP),qEcr:val(r,iCR)});
    }
  }else{
    const iT=find('tipo','equipe'),iI=find('indicador'),iR=find('regular'),iS=find('suficiente'),iB=find('bom');
    let iO=find('ótimo');if(iO===-1)iO=find('otimo');
    if([iT,iI,iR,iS,iB,iO].some(x=>x<0))throw new Error(`"${fileName}": faltam colunas esperadas do relatório por indicador.`);
    for(let i=h+1;i<rows.length;i++){
      const r=rows[i];if(!r)continue;
      const q=String(r[iQ]||'').trim(),ib=ibOf(r),ind=String(r[iI]||'').trim();
      if(!/^\d{6,7}$/.test(ib)||!quadKey(q)||!ind)continue;
      quads.add(q);
      push(ib,nomeOf(r),{quad:q,tipo:String(r[iT]||'').trim(),indicador:ind,
        regular:loteNum(r[iR]),suficiente:loteNum(r[iS]),bom:loteNum(r[iB]),otimo:loteNum(r[iO])});
    }
  }
  if(!por.size)throw new Error(`"${fileName}": nenhuma linha de dados encontrada.`);
  return{tipo:isMain?'main':'ind',uf,fileName,por,quads:[...quads].sort((a,b)=>quadKey(a)-quadKey(b))};
}


function mesclarPorQuad(antigas,novas){
  const ks=new Set(novas.map(r=>quadKey(r.quad)));
  return[...(antigas||[]).filter(r=>!ks.has(quadKey(r.quad))),...novas];
}

function parseClientesWorkbook(wb,fileName){
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
  let h=-1,iC=-1,iUF=-1;
  for(let i=0;i<Math.min(rows.length,40);i++){
    const hd=(rows[i]||[]).map(normNomeCliente);
    const c=hd.findIndex(x=>x==='CLIENTE'||x==='MUNICIPIO'||x==='NOME DO MUNICIPIO');
    if(c>=0){h=i;iC=c;iUF=hd.findIndex(x=>x==='UF'||x==='ESTADO');break;}
  }
  if(h<0)throw new Error(`"${fileName}": não encontrei uma coluna "Cliente" ou "Município" nessa planilha.`);
  // índice nome→IBGE de todos os estados: contornos dos mapas + municípios já presentes nos dados de trabalho
  const idx=new Map(),porNome=new Map();
  const add=(uf,nome,ib)=>{const n=normNomeCliente(nome);idx.set(uf+'|'+n,ib);
    if(!porNome.has(n))porNome.set(n,new Set());porNome.get(n).add(ib);};
  ESTADOS.forEach(e=>PainelDados.geo(e.uf).forEach(g=>add(e.uf,g.name,String(g.id))));
  Object.keys(trabalho.ufs).forEach(uf=>trabalho.ufs[uf].forEach(m=>add(uf,m.nomeMuni,String(m.id))));
  // sem coluna de UF: um nome que existe em vários estados ("Bom Jesus") só é aceito se
  // estiver em um único estado que já tem dados no painel
  const comDados=new Set(Object.keys(trabalho.ufs).filter(uf=>trabalho.ufs[uf].length));
  const acharPorNome=nome=>{
    const s=[...(porNome.get(normNomeCliente(nome))||[])];
    if(s.length===1)return s[0];
    const d=s.filter(ib=>comDados.has(ufDoIbge(ib)));
    return d.length===1?d[0]:'';
  };
  const lista=new Map(),naoId=[];
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i]||[];
    const nome=String(r[iC]||'').trim();
    const uf=iUF>=0?String(r[iUF]||'').trim().toUpperCase():'';
    if(!nome||(iUF>=0&&!/^[A-Z]{2}$/.test(uf)))continue; // pula "Total" e o rodapé de filtros
    const ib=iUF>=0?idx.get(uf+'|'+normNomeCliente(nome)):acharPorNome(nome);
    if(ib){if(!lista.has(ib))lista.set(ib,{ibge:ib,cliente:nome});}
    else if(!naoId.includes(nome))naoId.push(nome);
  }
  if(!lista.size)throw new Error(`"${fileName}": nenhum cliente foi identificado como município.`);
  return{rotulo:'GOVBR Saúde / Celk',fonte:fileName,importadoEm:new Date().toISOString(),lista:[...lista.values()],naoIdentificados:naoId,semColunaUF:iUF<0};
}
