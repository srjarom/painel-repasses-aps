/* =========================================================================
   CÁLCULO DO REPASSE
   -------------------------------------------------------------------------
   compute(): a partir das linhas do relatório do SIAPS (equipes por classificação, por
   quadrimestre) e dos parâmetros do município (estrato IED e modalidades), calcula o
   repasse mensal por componente (Fixo/IED, Vínculo/CVAT, Qualidade), o potencial (tudo
   "Ótimo") e a margem — no total e por tipo de equipe.
   computeProximosPassos(): o "próximo passo" realista (subir um nível de classificação).
   ========================================================================= */

function compute(rows,p){
  const{estrato,eapMod,esbMod,emultiMod}=p,ek=eapMod==='30'?'eAP30':'eAP20',by={};
  rows.forEach(r=>{(by[r.quad]=by[r.quad]||[]).push(r);});
  return Object.keys(by).sort((a,b)=>quadKey(a)-quadKey(b)).map(q=>{
    const rs=by[q];let tEsf=0,tEap=0,tEsb=0,tEm=0,tqEsf=0,tqEap=0,vin=0,qual=0;const cd={esf:{},eap:{},esb:{},emulti:{}};
    // acumuladores por tipo de equipe
    const T={esf:{n:0,fixo:0,vin:0,qual:0,vinOt:0,qualOt:0},
             eap:{n:0,fixo:0,vin:0,qual:0,vinOt:0,qualOt:0},
             esb:{n:0,fixo:0,vin:0,qual:0,vinOt:0,qualOt:0},
             emulti:{n:0,fixo:0,vin:0,qual:0,vinOt:0,qualOt:0}};
    const fEsf=estrato?FIXO_ESTRATO.eSF[estrato]:0, fEap=estrato?FIXO_ESTRATO[ek][estrato]:0;
    rs.forEach(r=>{const c=r.classe;tEsf+=r.vEsf;tEap+=r.vEap;tEsb+=r.qEsb;tEm+=r.qEmulti;tqEsf+=r.qEsf;tqEap+=r.qEap;
      vin+=r.vEsf*(VINCULO.eSF[c]||0)+r.vEap*(VINCULO[ek][c]||0);
      qual+=r.qEsf*(QUALIDADE.eSF[c]||0)+r.qEap*(QUALIDADE[ek][c]||0)+r.qEsb*(QUALIDADE[esbMod][c]||0)+r.qEmulti*(QUALIDADE[emultiMod][c]||0);
      cd.esf[c]=(cd.esf[c]||0)+r.vEsf;cd.eap[c]=(cd.eap[c]||0)+r.vEap;cd.esb[c]=(cd.esb[c]||0)+r.qEsb;cd.emulti[c]=(cd.emulti[c]||0)+r.qEmulti;
      // por tipo
      T.esf.n+=r.vEsf; T.esf.vin+=r.vEsf*(VINCULO.eSF[c]||0); T.esf.qual+=r.qEsf*(QUALIDADE.eSF[c]||0); T.esf.fixo+=r.vEsf*fEsf;
      T.eap.n+=r.vEap; T.eap.vin+=r.vEap*(VINCULO[ek][c]||0); T.eap.qual+=r.qEap*(QUALIDADE[ek][c]||0); T.eap.fixo+=r.vEap*fEap;
      T.esb.n+=r.qEsb; T.esb.qual+=r.qEsb*(QUALIDADE[esbMod][c]||0); T.esb.fixo+=r.qEsb*FIXO_FLAT[esbMod];
      T.emulti.n+=r.qEmulti; T.emulti.qual+=r.qEmulti*(QUALIDADE[emultiMod][c]||0); T.emulti.fixo+=r.qEmulti*FIXO_FLAT[emultiMod];
    });
    // potenciais por tipo (tudo Ótimo). O potencial de Qualidade usa a contagem de equipes
    // avaliadas em Qualidade (qEsf/qEap), não a de Vínculo — às vezes o SIAPS traz números
    // diferentes nas duas colunas (ex.: equipe nova avaliada só num dos componentes), e usar a
    // de Vínculo fazia a margem sair negativa.
    T.esf.vinOt=tEsf*VINCULO.eSF['Ótimo']; T.esf.qualOt=tqEsf*QUALIDADE.eSF['Ótimo'];
    T.eap.vinOt=tEap*VINCULO[ek]['Ótimo']; T.eap.qualOt=tqEap*QUALIDADE[ek]['Ótimo'];
    T.esb.qualOt=tEsb*QUALIDADE[esbMod]['Ótimo'];
    T.emulti.qualOt=tEm*QUALIDADE[emultiMod]['Ótimo'];
    Object.values(T).forEach(t=>{t.total=t.fixo+t.vin+t.qual; t.potencial=t.fixo+t.vinOt+t.qualOt; t.gap=t.potencial-t.total;});
    const fixo=estrato?tEsf*fEsf+tEap*fEap+tEsb*FIXO_FLAT[esbMod]+tEm*FIXO_FLAT[emultiMod]:0;
    const vinOt=tEsf*VINCULO.eSF['Ótimo']+tEap*VINCULO[ek]['Ótimo'];
    const qualOt=tqEsf*QUALIDADE.eSF['Ótimo']+tqEap*QUALIDADE[ek]['Ótimo']+tEsb*QUALIDADE[esbMod]['Ótimo']+tEm*QUALIDADE[emultiMod]['Ótimo'];
    const totalQ=fixo+vin+qual,potencialQ=fixo+vinOt+qualOt;
    return{quad:q,tEsf,tEap,tEsb,tEm,fixo,vin,qual,vinOt,qualOt,total:totalQ,potencial:potencialQ,gap:Math.max(0,potencialQ-totalQ),cd,byType:T};
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
  const ek=params.eapMod==='30'?'eAP30':'eAP20';
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
    add('esf','vínculo com a comunidade',r.vEsf,r.classe,VINCULO.eSF,'vin');
    add('esf','qualidade do atendimento',r.qEsf,r.classe,QUALIDADE.eSF,'qual');
    add('eap','vínculo com a comunidade',r.vEap,r.classe,VINCULO[ek],'vin');
    add('eap','qualidade do atendimento',r.qEap,r.classe,QUALIDADE[ek],'qual');
    add('esb','qualidade do atendimento',r.qEsb,r.classe,QUALIDADE[params.esbMod],'qual');
    add('emulti','qualidade do atendimento',r.qEmulti,r.classe,QUALIDADE[params.emultiMod],'qual');
  });
  return passos.sort((a,b)=>b.gain-a.gain);
}
