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
    const iC=find('classifica'),iVE=find('vínculo','esf'),iVA=find('vínculo','eap'),iQE=find('qualidade','esf'),iQA=find('qualidade','eap');
    let iB=-1,iM=-1;hd.forEach((l,i)=>{if(l.includes('qualidade')&&l.includes('sb'))iB=i;if(l.includes('qualidade')&&l.includes('multi'))iM=i;});
    const val=(r,i)=>i>=0?loteNum(r[i]):0;
    for(let i=h+1;i<rows.length;i++){
      const r=rows[i];if(!r)continue;
      const q=String(r[iQ]||'').trim(),ib=ibOf(r),classe=String(r[iC]||'').trim();
      if(!/^\d{6,7}$/.test(ib)||!quadKey(q)||!CLASS_ORDEM.includes(classe))continue;
      quads.add(q);
      push(ib,nomeOf(r),{quad:q,classe,vEsf:val(r,iVE),vEap:val(r,iVA),qEsf:val(r,iQE),qEap:val(r,iQA),qEsb:val(r,iB),qEmulti:val(r,iM)});
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
  // índice nome→IBGE: contornos do mapa da UF + municípios já presentes nos dados de trabalho
  const idx=new Map();
  PainelDados.geo(UF_ATUAL).forEach(g=>idx.set(UF_ATUAL+'|'+normNomeCliente(g.name),String(g.id)));
  trabalho.municipios.forEach(m=>idx.set(String(m.uf||UF_ATUAL).toUpperCase()+'|'+normNomeCliente(m.nomeMuni),String(m.id)));
  const lista=new Map(),naoId=[];
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i]||[];
    const nome=String(r[iC]||'').trim();
    const uf=iUF>=0?String(r[iUF]||'').trim().toUpperCase():UF_ATUAL;
    if(!nome||!/^[A-Z]{2}$/.test(uf))continue; // pula "Total" e o rodapé de filtros
    const ib=idx.get(uf+'|'+normNomeCliente(nome));
    if(ib){if(!lista.has(ib))lista.set(ib,{ibge:ib,cliente:nome});}
    else if(!naoId.includes(nome))naoId.push(nome);
  }
  if(!lista.size)throw new Error(`"${fileName}": nenhum cliente foi identificado como município.`);
  return{rotulo:'GOVBR Saúde / Celk',fonte:fileName,importadoEm:new Date().toISOString(),lista:[...lista.values()],naoIdentificados:naoId};
}
