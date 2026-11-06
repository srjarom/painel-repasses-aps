/* =========================================================================
   CÁLCULO DO REPASSE
   -------------------------------------------------------------------------
   compute(): a partir das linhas do relatório do SIAPS (equipes por classificação, por
   quadrimestre) e dos parâmetros do município (estrato IED e modalidades), calcula o
   repasse mensal por componente (Fixo/IED, Vínculo/CVAT, Qualidade), o potencial (tudo
   "Ótimo") e a margem — no total e por tipo de equipe.
   computeProximosPassos(): o "próximo passo" realista (subir um nível de classificação).
   ========================================================================= */

// Os tipos de equipe e as tabelas de valores estão em base.js (TIPOS_EQUIPE e tabelasTipos).
//   eSF e eAP: Fixo/IED (pelo estrato) + Vínculo (CVAT) + Qualidade;
//   eSFR, eSB, eMulti e eCR: valor fixo mensal da modalidade + Qualidade;
//   eAPP: só Qualidade (o custeio mensal federal não está confirmado — ver base.js).
// O nº de equipes de eSF/eAP vem da coluna de Vínculo; o dos demais, da coluna de Qualidade.
function compute(rows,p){
  const tb=tabelasTipos(p),by={};
  rows.forEach(r=>{(by[r.quad]=by[r.quad]||[]).push(r);});
  return Object.keys(by).sort((a,b)=>quadKey(a)-quadKey(b)).map(q=>{
    const rs=by[q],T={},cd={},nq={},nv={};
    TIPOS_EQUIPE.forEach(t=>{T[t.k]={n:0,fixo:0,vin:0,qual:0,vinOt:0,qualOt:0};cd[t.k]={};nq[t.k]=0;nv[t.k]=0;});
    rs.forEach(r=>{
      const c=r.classe;
      TIPOS_EQUIPE.forEach(t=>{
        const x=T[t.k],n=+r[t.n]||0,eq=+r[t.q]||0,ev=t.v?(+r[t.v]||0):0;
        x.n+=n; x.fixo+=n*(tb.F[t.k]||0);
        x.qual+=eq*((tb.Q[t.k]||{})[c]||0);
        if(t.v)x.vin+=ev*((tb.V[t.k]||{})[c]||0);
        cd[t.k][c]=(cd[t.k][c]||0)+n;
        nq[t.k]+=eq;nv[t.k]+=ev;
      });
    });
    // potenciais por tipo (tudo Ótimo). O potencial de Qualidade usa a contagem de equipes
    // avaliadas em Qualidade, não a de Vínculo — às vezes o SIAPS traz números diferentes nas
    // duas colunas (ex.: equipe nova avaliada só num dos componentes), e usar a de Vínculo
    // fazia a margem sair negativa.
    let vin=0,qual=0,vinOt=0,qualOt=0,fixoTipos=0;
    TIPOS_EQUIPE.forEach(t=>{
      const x=T[t.k];
      x.vinOt=t.v?nv[t.k]*tb.V[t.k]['Ótimo']:0;
      x.qualOt=nq[t.k]*((tb.Q[t.k]||{})['Ótimo']||0);
      x.total=x.fixo+x.vin+x.qual; x.potencial=x.fixo+x.vinOt+x.qualOt; x.gap=x.potencial-x.total;
      vin+=x.vin;qual+=x.qual;vinOt+=x.vinOt;qualOt+=x.qualOt;fixoTipos+=x.fixo;
    });
    // sem estrato o Fixo fica fora do total (o painel pede o estrato para mostrar o valor completo)
    const fixo=p.estrato?fixoTipos:0;
    const totalQ=fixo+vin+qual,potencialQ=fixo+vinOt+qualOt;
    return{quad:q,tEsf:T.esf.n,tEap:T.eap.n,tEsb:T.esb.n,tEm:T.emulti.n,fixo,vin,qual,vinOt,qualOt,
      total:totalQ,potencial:potencialQ,gap:Math.max(0,potencialQ-totalQ),cd,byType:T};
  });
}

/* =========================================================================
   "PRÓXIMO PASSO" — simulador de ganho incremental e realista.
   -------------------------------------------------------------------------
   Em vez do potencial máximo (todas as equipes em "Ótimo", cenário distante
   e pouco crível para uma conversa com o secretário), identifica a maior
   oportunidade de SUBIR UM NÍVEL de classificação num grupo de equipes que
   já existe hoje, no quadrimestre mais recente. Ex.: "3 equipes ESF que
   hoje estão em 'Suficiente' subirem para 'Bom'". Usado no resumo executivo
   (generatePDFResumo). Opera nas mesmas contagens/tabelas de compute(), só
   que comparando o nível atual com o nível imediatamente seguinte.
   ========================================================================= */
const CLASS_ORDEM=['Regular','Suficiente','Bom','Ótimo'];
function proximaClasse(c){const i=CLASS_ORDEM.indexOf(c);return(i>=0&&i<CLASS_ORDEM.length-1)?CLASS_ORDEM[i+1]:null;}
function computeProximosPassos(rows,lastQuad,params){
  const tb=tabelasTipos(params);
  const rs=rows.filter(r=>r.quad===lastQuad);
  const passos=[];
  const add=(tipo,componente,n,classe,tabela,comp)=>{
    if(!n||!tabela)return;
    const nx=proximaClasse(classe);
    if(!nx)return;
    const gain=n*((tabela[nx]||0)-(tabela[classe]||0));
    if(gain<=0)return;
    passos.push({tipo,componente,comp,classeAtual:classe,classeProxima:nx,n,gain});
  };
  rs.forEach(r=>{
    TIPOS_EQUIPE.forEach(t=>{
      if(t.v)add(t.k,'vínculo com a comunidade',+r[t.v]||0,r.classe,tb.V[t.k],'vin');
      add(t.k,'qualidade do atendimento',+r[t.q]||0,r.classe,tb.Q[t.k],'qual');
    });
  });
  return passos.sort((a,b)=>b.gain-a.gain);
}
