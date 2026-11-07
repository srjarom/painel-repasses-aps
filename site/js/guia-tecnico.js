/* =========================================================================
   GUIA TÉCNICO POR INDICADOR (v4.15.0)
   -------------------------------------------------------------------------
   Para o consultor técnico: quando um indicador está baixo, o que o Ministério
   conta e o que revisar no sistema para que o atendimento seja registrado e
   reconhecido no envio das fichas. Resumo do manual interno "Indicadores Saúde
   360" (Governança Brasil), que segue as fichas técnicas do Ministério da Saúde.
   Por ser um site público, aqui ficam só os nomes dos campos e telas — sem os
   códigos internos das telas do sistema nem nomes de pessoas.
   Usado na página "Sobre o painel" (seção do consultor técnico) e no Raio-X
   por indicador (botão "O que revisar no sistema" em cada linha).
   A chave é o nome do indicador exatamente como vem no relatório do SIAPS.
   ========================================================================= */
const GUIA_TECNICO={
  'Mais Acesso à Atenção Primária à Saúde':{grupo:'ESF e eAP',
    conta:'Proporção de atendimentos de demanda programada sobre o total (programada + espontânea).',
    revisar:[
      'Em todo atendimento individual, o campo <b>Tipo de atendimento</b> (Definições da consulta) precisa estar preenchido.',
      'Demanda programada = <b>Consulta agendada</b> ou <b>Consulta agendada programada / cuidado continuado</b>. Demanda espontânea = <b>Consulta no dia</b> ou <b>Escuta inicial / orientação</b>.',
      'Usuário identificado com nome, data de nascimento e CNS ou CPF válido (CadSUS).',
      'Agenda: se quase tudo é “consulta no dia”, o indicador fica baixo mesmo com muito atendimento — vale olhar como a agenda está organizada.'
    ]},
  'Cuidado no Desenvolvimento Infantil':{grupo:'ESF e eAP',
    conta:'Crianças de até 2 anos vinculadas à equipe com o acompanhamento completo: consultas, peso e altura, visitas do ACS e vacinas.',
    revisar:[
      '1ª consulta com médico(a) ou enfermeiro(a) até o 30º dia de vida, e pelo menos 9 consultas até os 2 anos: <b>Classificação de atendimento = Puericultura</b> + CID ou CIAP relacionado.',
      'Pelo menos 9 registros de <b>peso e altura no mesmo dia</b> até os 2 anos — por avaliação antropométrica, procedimento, atividade coletiva ou visita. Usar um só modo, para não duplicar.',
      '2 visitas do ACS/TACS (até 30 dias e até 6 meses de vida) com os acompanhamentos <b>Recém-nascido</b> e <b>Criança</b> marcados. A criança precisa estar vinculada a uma família.',
      'Vacinas (difteria, tétano, coqueluche, hepatite B, Hib, poliomielite, sarampo, caxumba e rubéola) registradas ou transcritas na <b>caderneta de vacinação</b>.'
    ]},
  'Cuidado da Gestante e da Puérpera':{grupo:'ESF e eAP',
    conta:'Gestantes vinculadas à equipe com o pré-natal e o puerpério completos (consultas, PA, peso/altura, visitas, dTpa, testes rápidos, odontologia).',
    revisar:[
      'Abrir a <b>ficha Pré-Natal</b> na 1ª consulta (com DUM): é ela que classifica a paciente como gestante. Sem isso, nada do resto conta.',
      '1ª consulta até a 12ª semana e pelo menos 7 consultas: <b>Classificação de atendimento = Pré-natal</b> + CID ou CIAP de gravidez.',
      'Pelo menos 7 registros de <b>pressão arterial</b> e 7 de <b>peso e altura</b> na gestação (um só modo de registro para não duplicar).',
      '3 visitas do ACS/TACS depois da 1ª consulta, com acompanhamento <b>Gestante</b>; 1 visita no puerpério com acompanhamento <b>Puérpera</b>.',
      'Vacina <b>dTpa</b> a partir da 20ª semana, com grupo de atendimento <b>Gestante</b> e “Gestante = Sim”.',
      '<b>Testes rápidos</b>: sífilis, HIV e hepatites B e C no 1º trimestre; sífilis e HIV no 3º.',
      '1 consulta no puerpério com <b>Classificação = Puerpério (até 42 dias)</b>, e 1 atendimento odontológico durante a gestação.'
    ]},
  'Cuidado da Pessoa com Diabetes Mellitus':{grupo:'ESF e eAP',
    conta:'Pessoas com diabetes (avaliada por médico ou enfermeiro) com acompanhamento em dia: consulta, PA, peso/altura, visitas, hemoglobina glicada e exame dos pés.',
    revisar:[
      'Consulta com médico(a) ou enfermeiro(a) nos últimos 6 meses: <b>Classificação de atendimento = Diabetes</b> + CID ou CIAP.',
      'Pressão arterial nos últimos 6 meses (PAS/PAD na avaliação, procedimento 03.01.10.003-9, atividade coletiva ou visita).',
      'Peso e altura nos últimos 12 meses.',
      '2 visitas do ACS/TACS em 12 meses, com 30 dias de intervalo, com acompanhamento <b>Pessoa com diabetes</b>.',
      '<b>Hemoglobina glicada</b> solicitada — ou com resultado informado — nos últimos 12 meses.',
      '<b>Exame do pé diabético</b> (procedimento 03.01.04.009-5) nos últimos 12 meses.'
    ]},
  'Cuidado da Pessoa com Hipertensão':{grupo:'ESF e eAP',
    conta:'Pessoas com hipertensão (avaliada por médico ou enfermeiro) com acompanhamento em dia: consulta, PA, peso/altura e visitas.',
    revisar:[
      'Consulta com médico(a) ou enfermeiro(a) nos últimos 6 meses: <b>Classificação de atendimento = Hipertensão arterial</b> + CID ou CIAP2.',
      'Pressão arterial nos últimos 6 meses (PAS/PAD na avaliação, procedimento 03.01.10.003-9, atividade coletiva ou visita).',
      'Peso e altura nos últimos 12 meses.',
      '2 visitas do ACS/TACS em 12 meses, com 30 dias de intervalo, com acompanhamento <b>Pessoa com hipertensão</b>.'
    ]},
  'Cuidado da Pessoa Idosa':{grupo:'ESF e eAP',
    conta:'Pessoas de 60 anos ou mais vinculadas à equipe com consulta, peso/altura, visitas e vacina de influenza.',
    revisar:[
      'Consulta com médico(a) ou enfermeiro(a) nos últimos 12 meses, com o <b>Tipo de atendimento</b> preenchido.',
      'Pelo menos 2 registros de <b>peso e altura</b> no mesmo dia, em 12 meses.',
      '2 visitas do ACS em 12 meses, com 30 dias de intervalo, com acompanhamento <b>Pessoa idosa</b>.',
      'Vacina de <b>influenza</b> registrada na caderneta nos últimos 12 meses.'
    ]},
  'Cuidado Integral à Saúde da Mulher':{grupo:'ESF e eAP',
    conta:'Mulheres de 9 a 69 anos vinculadas à equipe com rastreamento de câncer, HPV e atendimento em saúde sexual e reprodutiva.',
    revisar:[
      '<b>Citopatológico</b> (25 a 64 anos) em 36 meses: requisição em Saúde da Mulher ou procedimento SIGTAP; exame feito fora informado como <b>resultado de exame externo</b>.',
      '<b>Vacina HPV</b> (9 a 14 anos) registrada na caderneta.',
      'Atendimento em saúde sexual e reprodutiva (14 a 69 anos) em 12 meses: <b>Classificação = Saúde sexual e reprodutiva</b> + CID ou CIAP2.',
      '<b>Mamografia</b> (50 a 69 anos) solicitada ou avaliada em 24 meses: requisição em Saúde da Mulher.'
    ]},
  '1ª Consulta Odontológica programada na APS':{grupo:'eSB',
    conta:'Usuários com a 1ª consulta odontológica programática no período (conta uma vez por dentista a cada 12 meses).',
    revisar:[
      'No atendimento odontológico, <b>Tipo de consulta = Primeira consulta odontológica programática</b>.',
      'Lançar também o <b>procedimento</b> Primeira consulta odontológica programática.'
    ]},
  'Tratamento Odontológico concluído na APS':{grupo:'eSB',
    conta:'Quanto dos tratamentos iniciados (1ª consulta programática) a equipe conclui.',
    revisar:[
      'Ao terminar o plano de tratamento, <b>Conduta = Tratamento concluído</b>.',
      'Só conta se o usuário tiver a <b>1ª consulta odontológica programática</b> registrada antes.'
    ]},
  'Taxa de exodontias na APS':{grupo:'eSB',
    conta:'Exodontias sobre o total de procedimentos preventivos, curativos e exodontias — aqui, quanto <b>menor</b>, melhor.',
    revisar:[
      'Registrar no odontograma ou em procedimentos <b>todos</b> os procedimentos preventivos e curativos feitos — se só a extração é lançada, a taxa sobe artificialmente.',
      'Exodontias contadas: 04.14.02.013-8 (dente permanente) e 04.14.02.014-6 (múltipla com alveoloplastia).'
    ]},
  'Escovação Supervisionada na APS':{grupo:'eSB',
    conta:'Crianças de 6 a 12 anos vinculadas à eSF/eAP de referência da eSB que participaram de escovação supervisionada.',
    revisar:[
      'Registrar como <b>atividade coletiva</b>: tipo <b>Avaliação/procedimento coletivo</b>, público <b>Crianças de 6 a 11 anos</b>, tema <b>Saúde bucal</b>.',
      'Práticas: <b>Escovação dentária supervisionada</b>; procedimento 01.01.02.003-1 (ação coletiva de escovação dental supervisionada).',
      'Participantes identificados e vinculados à equipe de referência.'
    ]},
  'Procedimentos Odontológicos preventivos na APS':{grupo:'eSB',
    conta:'Proporção de procedimentos preventivos entre os procedimentos odontológicos realizados.',
    revisar:[
      'Lançar os procedimentos preventivos no odontograma ou em procedimentos: aplicação de flúor, selante, cariostático, evidenciação de placa, orientação de higiene bucal etc.'
    ]},
  'Tratamento Restaurador Atraumático na APS':{grupo:'eSB',
    conta:'Proporção de restaurações por Tratamento Restaurador Atraumático (TRA/ART) entre as restaurações.',
    revisar:[
      'Lançar o procedimento <b>03.07.01.007-4 — Tratamento restaurador atraumático</b> quando for o caso, e não uma restauração genérica.'
    ]},
  'Média de atendimentos da eMulti por pessoa':{grupo:'eMulti',
    conta:'Atendimentos individuais e coletivos da eMulti por pessoa atendida.',
    revisar:[
      'Atendimento individual com <b>tipo de atendimento</b>, <b>conduta</b> e <b>forma de participação</b> preenchidos.',
      'Atividades coletivas dos tipos Educação em saúde, Atendimento em grupo, Avaliação/procedimento coletivo e Mobilização social.',
      'Participantes com cadastro completo e o profissional com <b>INE compatível com a eMulti</b>.'
    ]},
  'Ações interprofissionais realizadas pela eMulti na APS':{grupo:'eMulti',
    conta:'Ações de cuidado compartilhado entre a eMulti e outras equipes da APS.',
    revisar:[
      'Atendimento individual com <b>Atendimento compartilhado</b> marcado e o profissional auxiliar de outra equipe.',
      'Ou <b>cuidado compartilhado</b>: solicitar, acompanhar e <b>finalizar</b> — a ficha só é gerada ao concluir.',
      'Ou atividade coletiva: reunião de equipe / com outras equipes / intersetorial com tema <b>Discussão de caso ou projeto terapêutico singular</b>; ou atividades de educação, grupo, procedimento coletivo ou mobilização feitas por 2 ou mais profissionais de equipes diferentes.'
    ]}
};
// indicadores da eSFR têm nome próprio no relatório, mas o registro é o mesmo da eSF
const GUIA_TECNICO_ALIAS={
  'Mais Acesso à equipe de Saúde da Família Ribeirinha (eSFR)':'Mais Acesso à Atenção Primária à Saúde',
  'Cuidado da pessoa com hipertensão realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Cuidado da Pessoa com Hipertensão',
  'Cuidado da pessoa com diabetes realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Cuidado da Pessoa com Diabetes Mellitus',
  'Cuidado na Gestação e Puerpério realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Cuidado da Gestante e da Puérpera',
  'Cuidado no desenvolvimento infantil realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Cuidado no Desenvolvimento Infantil',
  'Cuidado da mulher na prevenção do câncer realizado pela equipe de Saúde da Família Ribeirinha (eSFR)':'Cuidado Integral à Saúde da Mulher'
};
// o que vale para todos os indicadores — conferir antes de mergulhar num indicador específico
const GUIA_TECNICO_GERAL=[
  '<b>Cadastro da unidade e da equipe</b>, e o <b>vínculo de cada profissional</b> com a equipe e o <b>CBO</b> que consta no CNES — confira no CNES local ou no CNES web, buscando pelo nome do profissional.',
  'Profissional <b>sem INE</b> não conta para os indicadores de Qualidade.',
  'Profissionais com <b>CBO e carga horária compatíveis</b> com a equipe, e vinculados à equipe certa também <b>no sistema</b> (usuário criado e com produção registrada).',
  'Usuários identificados (nome, data de nascimento, CNS ou CPF válido) e <b>vinculados</b> à equipe — base cadastral e cobertura do território pesam no resultado.',
  'A avaliação é <b>por equipe</b>: uma equipe mal configurada pode puxar a nota mesmo com as demais bem.',
  'Os dados são extraídos pelo SIAPS no <b>20º dia útil de cada mês</b> e a avaliação é quadrimestral: o que não foi enviado até lá não entra.'
];
function guiaTecnicoDe(indicador){return GUIA_TECNICO[indicador]||GUIA_TECNICO[GUIA_TECNICO_ALIAS[indicador]]||null;}
function guiaTecnicoHTML(g){
  if(!g)return'';
  return`<p class="gt-conta"><b>O Ministério conta:</b> ${g.conta}</p><ul class="gt-rev">${g.revisar.map(r=>`<li>${r}</li>`).join('')}</ul>`;
}
// lista completa na página "Sobre o painel", agrupada por tipo de equipe
function renderGuiaTecnicoSobre(){
  const el=document.getElementById('sobre-tec-lista');if(!el||el.dataset.ok)return;
  const grupos={};
  Object.entries(GUIA_TECNICO).forEach(([nome,g])=>{(grupos[g.grupo]=grupos[g.grupo]||[]).push([nome,g]);});
  el.innerHTML=Object.entries(grupos).map(([grupo,itens])=>`
    <div class="gt-grupo"><div class="gt-gh">${grupo}</div>
      ${itens.map(([nome,g])=>`<details class="gt-item"><summary>${nome.replace(/ na APS$/,'')}</summary>${guiaTecnicoHTML(g)}</details>`).join('')}
    </div>`).join('');
  const geral=document.getElementById('sobre-tec-geral');
  if(geral)geral.innerHTML=GUIA_TECNICO_GERAL.map(t=>`<li>${t}</li>`).join('');
  el.dataset.ok='1';
}
// preenche a página Sobre assim que o arquivo carrega (não depende de outra parte do painel)
if(document.readyState!=='loading')renderGuiaTecnicoSobre();
else document.addEventListener('DOMContentLoaded',renderGuiaTecnicoSobre);
