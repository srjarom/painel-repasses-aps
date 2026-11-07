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

/* =========================================================================
   FAIXA POSSÍVEL CONFORME A MODALIDADE DAS EQUIPES (v4.14.0)
   O relatório público do SIAPS traz quantas equipes de cada tipo ficaram em cada
   classificação, mas NÃO a modalidade de cada uma (eAP 20h/30h, eSB I/II, eMulti
   Estratégica/Complementar/Ampliada, eCR I a III, eAPP). O painel assume uma modalidade
   padrão (PARAMS_PADRAO_MUNI). Esta função calcula o menor e o maior repasse possíveis do
   quadrimestre mais recente, trocando só as modalidades — o resto (quantidade e classificação
   das equipes, estrato) fica igual. Como o cálculo é uma soma por equipe, qualquer mistura de
   modalidades no município cai dentro dessa faixa.
   eSB quilombola/assentamento fica de fora do máximo (só existe em territórios específicos);
   se o município estiver configurado assim, a faixa se estende até o valor configurado.
   ========================================================================= */
const MODALIDADE_MIN={eapMod:'20',esbMod:'I_comum',emultiMod:'estrategica',ecrMod:'I',eappMod:'ess20'};
const MODALIDADE_MAX={eapMod:'30',esbMod:'II_comum',emultiMod:'ampliada',ecrMod:'III',eappMod:'amp30'};
const TIPOS_COM_MODALIDADE=['eap','esb','emulti','ecr','eapp'];
function faixaModalidade(rows,p){
  if(!rows||!rows.length)return null;
  const lastQ=rows.reduce((mx,r)=>quadKey(r.quad)>quadKey(mx)?r.quad:mx,rows[0].quad);
  const rs=rows.filter(r=>r.quad===lastQ);
  const um=m=>{const r=compute(rs,Object.assign({},p,m));return r[r.length-1];};
  const lo=um(MODALIDADE_MIN),hi=um(MODALIDADE_MAX),atual=um({});
  const tipos=TIPOS_COM_MODALIDADE.filter(k=>(atual.byType[k]||{}).n>0).map(k=>({k,n:atual.byType[k].n}));
  return{
    min:Math.min(lo.total,atual.total),max:Math.max(hi.total,atual.total),atual:atual.total,
    potMin:Math.min(lo.potencial,atual.potencial),potMax:Math.max(hi.potencial,atual.potencial),
    tipos,quad:lastQ
  };
}
// texto curto dos tipos que dependem da modalidade: "eSB (59), eMulti (12) e eCR (2)"
function textoTiposModalidade(f){
  if(!f||!f.tipos.length)return'';
  const nomes={eap:'eAP',esb:'eSB',emulti:'eMulti',ecr:'eCR',eapp:'eAPP'};
  const it=f.tipos.map(t=>`${nomes[t.k]} (${t.n})`);
  return it.length>1?it.slice(0,-1).join(', ')+' e '+it[it.length-1]:it[0];
}
// a faixa só vale a pena mostrar quando muda alguma coisa (mais de R$ 1 de diferença)
function faixaRelevante(f){return!!f&&f.max-f.min>=1;}
