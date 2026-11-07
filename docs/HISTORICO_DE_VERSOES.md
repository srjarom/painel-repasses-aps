# Histórico de versões

Mais recente primeiro. A mesma lista aparece no rodapé do painel (clique no número da versão).

Ao publicar uma mudança no código: suba o número em `site/js/versao.js` (`APP_VERSION`), acrescente uma entrada no topo de `APP_CHANGELOG` e copie o texto para cá.

Regra do número (versão semântica, `MAIOR.MENOR.CORREÇÃO`):

- **MAIOR** (2.0.0 → 3.0.0): muda a forma de usar ou o formato dos dados.
- **MENOR** (2.0.0 → 2.1.0): funcionalidade nova.
- **CORREÇÃO** (2.0.0 → 2.0.1): conserto ou ajuste de texto.

Atualizar só os dados (novo quadrimestre) **não** muda a versão.

## 4.15.0

Página "Sobre o painel" separada por público e guia técnico por indicador. Novo bloco "Para quem é": gestão e equipe comercial (o que descobrir de cada município e como preparar uma visita) e consultor técnico e analista (roteiro em 4 passos para um chamado do tipo "os indicadores caíram": abrir o município, ver o Raio-X, revisar no sistema e decidir a ação; o que conferir antes de tudo — INE, CBO, cadastro e vínculo, envio até o 20º dia útil; e o checklist de cada indicador de ESF/eAP, eSB e eMulti). No Raio-X, cada indicador ganhou o botão "O que revisar no sistema", com o que o Ministério conta e os campos que precisam estar preenchidos. O conteúdo resume o manual interno "Indicadores Saúde 360", sem códigos internos de telas nem nomes de pessoas (o site é público). Adendo sobre modalidades: informar a modalidade das equipes é opcional — o painel serve para acompanhar tendências e prospectar, e classificação, indicadores e equipes a menos não dependem dela.

## 4.14.0

Estimativa à vista e nova página "Sobre o painel". A modalidade das equipes (eAP 20h/30h, eSB I/II, eMulti, eCR, eAPP) não aparece no relatório público do SIAPS e muda bastante o valor; por isso o painel agora mostra a faixa possível: no cartão azul do município ("Estimativa — pode ficar entre R$ X e R$ Y por mês, conforme a modalidade de eSB, eMulti…"), no do estado (soma das faixas) e um aviso no do Brasil, todos com o atalho "Por que é estimativa?". O Relatório do quadrimestre e o Resumo para o secretário trazem, logo abaixo do valor, o quadro "Valores estimados" com as modalidades consideradas e a faixa. O aviso em Parâmetros do cálculo foi corrigido (dizia que as modalidades vinham dos dados publicados). Nova página "Sobre o painel" (menu do topo): por que o painel existe, o que dá para descobrir de cada município, roteiro para preparar uma visita com perguntas que abrem a conversa, o que o painel não sabe (público × suposto × não temos) e como falar sobre os números ("diga" × "evite"), e de onde vêm os dados. No Relatório do quadrimestre, as prioridades e o quadro final vêm logo depois de "O que puxou", e a tabela indicador por indicador fica no fim (menos páginas vazias). No celular, o menu do topo usa nomes curtos.

## 4.13.0

Guia "Como funciona o repasse" mais completo e visual. No topo, a conta inteira numa linha (Fixo + Vínculo + Qualidade = Repasse mensal) e atalhos para cada parte do guia. Cada componente mostra "quem tem" e se "depende da nota". A escala de classificação traz um exemplo em reais (quanto uma equipe ESF recebe de Vínculo + Qualidade em cada degrau: subir um degrau = + R$ 4.000/mês). Duas seções novas: "Como usar o painel" (Brasil → estado → município, em 3 passos) e "Palavras que aparecem no painel" (repasse mensal, potencial, margem em aberto, tendência, equipes a menos, estrato IED, quadrimestre e prioridade). Corrigida a menção ao gráfico de evolução, que agora fica na tela do município.

## 4.12.0

PDFs mais caprichados. Resumo p/ secretário: cabeçalho no mesmo padrão dos outros dois PDFs (nome do município em destaque), a variação contra o quadrimestre anterior ao lado do valor, os três componentes com nome simples e técnico, a "outra oportunidade" num quadro com o valor em destaque (antes era uma frase em itálico) e, no espaço que sobrava, um gráfico de barras de como o repasse mensal evoluiu; corrigido o texto "equipes de Equipes de Saúde da Família". Relatório do quadrimestre: o aviso de equipes a menos virou um quadro âmbar com título, o que mudou em negrito e a orientação em texto normal (antes era um parágrafo inteiro em vermelho), e os valores abaixo do potencial ficam numa linha só, em selos do mesmo tamanho. Raio-X: os rótulos dos quadros do topo não são mais cortados ("Com equipe em Regular", "Com todas em Ótimo") e a coluna Situação ficou mais larga, sem quebrar em duas linhas.

## 4.11.0

Painel do estado no mesmo padrão das outras telas. Os quatro quadros brancos do lado direito viraram o cartão azul (igual ao do Brasil e do município): repasse mensal do estado, variação contra o quadrimestre anterior, potencial, margem em aberto, barra de quanto já foi alcançado e o número de municípios (ou de clientes, quando o filtro de clientes está ligado). A legenda do mapa cabe numa linha só, com rótulos curtos ("mais de +5%", "até −2%"…; o texto completo aparece ao passar o mouse). A lista de tendência ficou um pouco mais compacta, e a coluna da direita cabe inteira na tela.

## 4.10.0

Abas do município redesenhadas. Raio-X: os tipos de equipe e o quadrimestre ficam numa linha só, cada tipo mostra quantos indicadores estão em prioridade, e um resumo no topo traz a contagem (prioridade / consolidados) e a legenda de cores; cada indicador mostra a barra mais larga com as quantidades por faixa embaixo e a nota colorida (vermelho abaixo de 50%, verde a partir de 90%). Diagnóstico: os pontos agora ficam agrupados por tipo de equipe, com o histórico de classificação uma vez só no topo do bloco (antes se repetia em cada cartão), e aparecem todos (antes só 6); no topo, a contagem por tipo de ponto; o botão virou "Copiar agenda". Detalhamento: tabelas com cabeçalho claro e valores sem quebra de linha, e a classificação das equipes em barras horizontais com as quantidades dentro e a % em Ótimo/Bom ao lado, no lugar do gráfico pequeno.

## 4.9.0

Tela inicial do Brasil em três colunas, com o mapa quase duas vezes maior. À esquerda, o resumo: o cartão azul (mesmo estilo da tela do município) com o repasse mensal do país, a variação contra o quadrimestre anterior, o potencial, a margem em aberto e a barra de quanto já foi alcançado; abaixo, uma barra mostrando quantos municípios subiram, ficaram iguais ou caíram, e o quadro de equipes a menos com o impacto estimado e os estados onde mais aparece (clicáveis). No meio, o mapa ocupa toda a altura, com a legenda e a dica na mesma linha. À direita, a lista dos estados, mais compacta. Em telas médias o resumo vira uma faixa em cima; no celular, tudo em uma coluna, com margem lateral de 16px.

## 4.8.0

Tela do município mais limpa. O cartão azul destaca o repasse mensal e a tendência; logo abaixo, Fixo/IED, Vínculo e Qualidade em três números lado a lado, e o potencial e a margem em aberto com a barra de quanto já foi alcançado. O alerta de equipes a menos virou uma lista curta (uma linha por tipo, com "eram X, agora Y"); a explicação fica em "Entender". Os cartões por tipo de equipe ficaram enxutos: nome, quantidade e selo do potencial no topo, valor por mês em destaque, margem em aberto e a composição em selos pequenos. O botão do Raio-X (PDF) foi para a barra do topo, junto dos outros PDFs. Ajustes para celular.

## 4.7.0

Padrão visual único em todo o painel: uma escala só para tamanhos de texto, espaços, cantos arredondados e sombras (variáveis no início do bloco 4.7.0 do CSS). Todos os cartões têm a mesma borda, canto e sombra leve; os títulos de seção, os textos de apoio e os rótulos pequenos seguem o mesmo tamanho e peso; os números usam algarismos de mesma largura (as colunas não "dançam"); os botões seguem três estilos (azul principal, contorno secundário e o verde de destaque). Transições suaves ao trocar de tela, aba e ao passar o mouse (desligadas para quem prefere menos movimento no sistema). Ao abrir um estado, um esqueleto de carregamento no formato da tela substitui a rodinha. Se o mapa do Brasil não carregar, aparece um aviso em vez de um desenho quebrado.

## 4.6.0

Novo gráfico de evolução do repasse. A visão padrão agora é a curva do repasse mensal, com a escala ajustada aos valores do município (nas barras empilhadas, o Fixo/IED, que quase não muda, escondia a variação), a linha do potencial e, entre as duas, a faixa verde da margem em aberto; o valor do primeiro e do último quadrimestre fica escrito no gráfico. Acima, um resumo: valor do mês, variação vs. o quadrimestre anterior, variação desde o início do histórico e margem em aberto. As barras de composição (Fixo/IED + Vínculo + Qualidade) continuam na chave "Composição". Topo do município mais limpo: "Brasil › estado" pequeno em cima e o nome do município em destaque, com UF e IBGE discretos ao lado.

## 4.5.0

Tela do município redesenhada no mesmo padrão do estado. No topo, uma barra fina com "Brasil › estado › município" (o estado é clicável para voltar) e os botões dos PDFs. Embaixo, duas colunas: à esquerda as abas (Visão geral, Raio-X, Diagnóstico, Detalhamento) com a largura toda; à direita, fixos ao rolar, o resumo do repasse (valor do mês, tendência, Fixo/Vínculo/Qualidade, potencial e margem), o alerta de equipes a menos e os parâmetros do cálculo (estrato, modalidades e destinatário do PDF) em grade compacta e recolhível. Antes era uma coluna estreita com tudo empilhado.

## 4.4.4

Aba Equipes a menos: o quadro vazava para fora da tela e se sobrepunha ao rodapé (o código forçava um modo de exibição que impedia a rolagem por dentro). Agora fica contido na altura da tela e rola por dentro, como o Ranking. Colunas com largura fixa, selos de "o que mudou" lado a lado e linhas mais baixas.

## 4.4.3

Ao clicar num município no mapa, o cartão dele aparece no alto do painel do lado (que volta ao topo sozinho), com o botão verde "Abrir relatório do município" logo abaixo do nome — a primeira coisa que se vê. Saiu o campo "Achar no mapa", que repetia a busca do topo; sem município selecionado fica só uma dica de uma linha.

## 4.4.2

Linha das abas (Mapa · Ranking · Equipes a menos) e seletor de cor do mapa mais finos, com menos espaço acima: o mapa ganha mais altura. As alturas do painel são recalculadas também depois que as fontes terminam de carregar.

## 4.4.1

Ranking e Equipes a menos redesenhados para a coluna do painel. Ranking: uma linha por município, cabeçalho leve (sem a faixa azul), sem rolagem para os lados, tendência em selo curto (▲ +3,5%), barra de % do potencial, indicador mais crítico numa linha só, a linha inteira abre o relatório e o ícone mostra no mapa; busca na mesma linha do título; 50 por vez. Equipes a menos: título de uma linha com o botão "Ver só esses no mapa", resumo em três pílulas, tabela mais enxuta (os quadrimestres da série ficam na dica), 20 por vez. Na aba Equipes a menos, o quadro vazio que sobrava no painel do lado sumiu.

## 4.4.0

Painel do estado redesenhado em duas colunas, no padrão da tela do Brasil. À esquerda, o mapa (ou o ranking, ou as equipes a menos) ocupa toda a altura da tela; os botões de cor do mapa subiram para a linha das abas e o título repetido saiu, então o mapa ficou bem maior. À direita, um painel com os quatro números em grade, os filtros de tendência em lista (um por linha) e a busca/município selecionado. O filtro "Todos / Clientes" foi para a barra do topo, ao lado da busca. A legenda do mapa fica numa linha embaixo dele. No celular, o painel de números aparece antes do mapa.

## 4.3.1

Os botões de "cor do mapa" (e o filtro de clientes) viraram um seletor compacto, tipo chave, em vez de botões grandes separados. A legenda da "Variação" no mapa do Brasil, que quebrava o texto palavra por palavra, agora mostra cada item numa linha só, lado a lado.

## 4.3.0

Layout que cabe na tela. O painel passa a usar a largura da tela (até 1640 px, antes 1200 px) e, no computador, o mapa, o ranking, a lista de equipes a menos e a tela do Brasil ocupam exatamente a altura que sobra na janela: a página não precisa rolar, e cada quadro rola por dentro (o cabeçalho das tabelas fica preso no alto). No mapa do estado, o desenho ocupa a altura toda e o painel do lado (busca, município selecionado e legenda) rola sozinho. As abas e os filtros de tendência ficam na mesma linha. No celular, tudo continua no fluxo normal.

## 4.2.3

Tela "Como funciona o repasse": sem o espaço vazio grande entre o topo e o título, e com menos espaço entre os blocos. O cartão de Qualidade passa a citar também as equipes ribeirinhas (eSFR), prisionais (eAPP) e de Consultório na Rua (eCR).

## 4.2.2

Topo e quadros de números mais finos (barra de navegação, barra do Brasil/estado e os quatro quadros): o mapa começa cerca de 100 px mais acima, sem perder a leitura.

## 4.2.1

Mapa de Pernambuco: Fernando de Noronha, que fica a uns 350 km da costa, espremia o estado num canto do mapa. Agora a ilha aparece ampliada num quadro tracejado com o nome, logo acima do litoral, e o continente ocupa a largura toda. A ilha continua clicável.

## 4.2.0

Topo mais limpo: uma faixa escura só (a de navegação). A barra do Brasil/estado ficou clara, com "Brasil › estado" discreto, o nome do estado em destaque sem caixa pesada e uma busca curta ("Buscar município"), que não corta mais o texto. A linha de informação ficou mais curta (quadrimestre · municípios · histórico desde · atualizado em) e o plural foi corrigido ("1 município"). A referência à Portaria saiu do topo e foi para o rodapé.

## 4.1.0

Painel do estado mais enxuto: a tendência do repasse deixou de ser uma segunda fileira de cartões grandes e virou uma barra fina de filtros (todos · subiram · iguais · caíram · com equipes a menos), logo abaixo das abas, valendo para o Mapa e o Ranking (na aba Equipes a menos ela some). Os quatro quadros de números ficaram mais baixos.

## 4.0.0

Nova navegação, com muito menos rolagem. O painel abre numa tela do Brasil: quatro números do país, mapa do Brasil colorido por estado (margem em aberto, % do potencial, repasse ou variação) e a lista dos 27 estados, que pode ser ordenada; clicar num estado abre o painel dele. Busca no topo para ir direto a qualquer município do Brasil ou a um estado. No painel do estado, o bloco azul grande virou uma barra fina presa no topo (Brasil › estado, troca de estado e busca), os números ficam numa linha só e o conteúdo foi dividido em três abas: Mapa, Ranking e Equipes a menos. O endereço acompanha a navegação (…?uf=SC e …?uf=SC&m=420540), então dá para mandar o link de um estado ou de um município, e o botão voltar do navegador funciona. A ferramenta de manutenção passa a gerar também o resumo de cada estado (dados/indice.js) e a lista da busca (dados/busca.js).

## 3.2.0

O cálculo do repasse passa a incluir as equipes de Saúde da Família Ribeirinha (eSFR), Atenção Primária Prisional (eAPP) e Consultório na Rua (eCR), que antes ficavam de fora. Qualidade pelos valores do Anexo XCIX-B (redação da Portaria GM/MS nº 7.799/2025); custeio mensal da eSFR (R$ 24.000, Portaria nº 5.850/2024) e da eCR (I R$ 20.000, II R$ 28.000, III R$ 36.000, art. 84). O custeio mensal da eAPP e o Vínculo da eSFR não entram, por falta de valor confirmado ou de dado no relatório público. Novos campos de modalidade eCR e eAPP (padrão: os menores valores, eCR I e eAPP Essencial 20h), ajustáveis na tela e na manutenção. Cada município mostra só os tipos de equipe que tem: cartões, campos de modalidade, abas do Raio-X, tabelas, gráficos, alertas de equipes a menos, diagnóstico e PDFs. No Brasil, as três equipes somam cerca de R$ 20,6 milhões/mês a mais no quadrimestre mais recente.

## 3.1.0

Raio-X por indicador na tela com abas para todos os tipos de equipe do relatório: além de ESF, eAP, eSB e eMulti, agora eSFR (Saúde da Família Ribeirinha), eAPP (Atenção Primária Prisional) e eCR (Consultório na Rua). O nome completo do tipo aparece ao passar o mouse na aba. Os indicadores dessas equipes ganharam sugestão de ação, como os demais. Os PDFs já traziam esses tipos.

## 3.0.0

Painel nacional: seletor de estado no topo do painel, com os 27 estados (os que ainda não têm dados aparecem como "sem dados ainda"). Cada estado carrega só quando é escolhido, então quem abre o painel baixa só o estado que vai ver. O endereço guarda o estado (…/?uf=SC), para mandar o link de um estado direto a um colega, e o painel lembra o último estado escolhido. Mapas dos 27 estados (IBGE). O filtro de clientes mostra só os clientes do estado escolhido. A ferramenta de manutenção aceita relatórios do SIAPS de um ou de vários estados de uma vez (cada município vai para o seu estado pelo código IBGE), lê listas de clientes de vários estados (de preferência com coluna UF) e gera um arquivo por estado, mais o índice dados/indice.js.

## 2.4.0

PDF "Raio-X por indicador" refeito no padrão visual do Relatório do quadrimestre. Saiu a "nota em %", difícil de entender; entraram: resumo em quatro quadros (indicadores avaliados, com equipe em Regular, com todas em Ótimo, quantos melhoraram/pioraram), "Onde focar na próxima agenda" (mesmas regras de prioridade do relatório, com a sugestão de ação de cada indicador) e, por tipo de equipe, cada indicador com um quadrado por equipe na cor do conceito (quadrimestre anterior e atual), a situação em palavras ("2 de 3 em Regular", "Todas em Ótimo") e a tendência. Municípios com mais de 6 equipes mostram uma barra proporcional com as quantidades. Rodapé deixa claro que é documento de uso interno.

## 2.3.1

Divulgação de uso de IA, conforme a Política de Governança de IA (item 7.1, material entregue a clientes): o rodapé dos três PDFs (relatório do quadrimestre, resumo para o secretário e Raio-X) e a metodologia da tela passam a informar "Ferramenta desenvolvida com apoio de IA; valores calculados por regras fixas a partir de dados públicos do SIAPS." O rodapé do resumo subiu um pouco para caber a nova linha.

## 2.3.0

Os avisos "O download não começou sozinho? Clique aqui", que ficavam fixos embaixo do nome do município depois de gerar um PDF, viraram um aviso discreto no canto inferior direito da tela: confirma qual PDF foi gerado (com o nome do arquivo), traz o link "Baixar de novo" para os computadores que bloqueiam o download automático e some sozinho em 10 segundos (com barra de tempo; pausa com o mouse em cima; pode ser fechado no ×). No celular aparece na parte de baixo da tela.

## 2.2.0

Fontes oficiais da Governança Brasil: Guanabara Sans nos títulos e números de destaque e IBM Plex Sans nos textos, tabelas e gráficos — no painel, na ferramenta de manutenção e nos três PDFs (fontes embutidas). Antes eram Cambria/Calibri na tela e Helvetica nos PDFs. Como a Plex é mais larga, o ranking foi compactado: o nome do município abre o relatório e os links "Ver relatório · No mapa" ficam logo abaixo do nome. Arquivos das fontes em site/fontes/ (web), marca/fontes/ (originais) e docs/FONTES.md.

## 2.1.0

Alerta de equipes a menos agora mostra também as equipes que ENTRARAM no mesmo período. Caso que motivou: Rosário do Sul perdeu 1 eMulti (−R$ 28.500/mês) mas ganhou 3 eAP (+R$ 32.600/mês) — o Fixo/IED caiu só R$ 2.400 (R$ 136.256 → R$ 133.856) e o repasse total subiu. A tela do município explica a compensação e o saldo do Fixo/IED; a tabela do alerta no painel do estado ganhou selos verdes (+3 eAP); o PDF do relatório inclui a frase. Novo quadro "Equipes no relatório e Componente Fixo/IED" na aba Detalhamento: quantas equipes de cada tipo havia em cada quadrimestre, o que entrou/saiu e quanto isso mudou o Fixo.

## 2.0.0

Projeto reestruturado para publicação no hub corporativo: o painel passa a ser só de consulta para todos os usuários, com os dados (todos os municípios do RS, indicadores e lista de clientes GOVBR Saúde / Celk) publicados pela manutenção em arquivos próprios (site/dados/). Importação de relatórios do SIAPS, da lista de clientes e ajustes de modalidade ficam numa ferramenta de manutenção separada (manutencao/), usada só pelo responsável pelos dados. Código dividido em arquivos por assunto, bibliotecas e imagens em pastas próprias, e documentação para manutenção e implantação (docs/). Também: nomes dos municípios com a grafia oficial do IBGE (em vez de MAIÚSCULAS), ranking com busca e exibição de 25 em 25 (antes listava os 497 de uma vez), "Voltar ao painel do estado" volta ao mesmo ponto da página, e a aba "Como funciona o repasse" separada do painel.

## 1.29.0

Alerta de equipes a menos: como o Componente Fixo/IED é calculado por equipe presente no relatório do SIAPS, uma queda no Fixo significa equipes que saíram do relatório (descredenciamento, desativação no CNES, suspensão por falta de envio de produção, equipe não avaliada ou dado preliminar). A Carteira ganhou o quadro "⚠ Possível perda de equipes" — quem perdeu equipes em relação ao quadrimestre anterior, de que tipo, o histórico de equipes por quadrimestre e o impacto estimado em R$/mês — além de destacar municípios que nem aparecem no relatório mais recente e perdas antigas que ainda não voltaram. Conversões entre eAP e eSF não contam como perda. O alerta também aparece no filtro acima do mapa, no tooltip, no painel do município selecionado, no topo da tela do município, no Diagnóstico e no relatório do quadrimestre (PDF).

## 1.28.0

Tendência em destaque: o mapa da carteira abre colorido pela tendência do repasse em relação ao quadrimestre anterior (azul = subiu, cinza = igual, vermelho = caiu, em três intensidades), com a contagem de cada faixa na legenda. Acima do mapa, um resumo clicável ("▲ melhoraram · = iguais · ▼ pioraram") filtra o mapa e o ranking — com "pioraram", o ranking passa a mostrar da maior queda para a menor. Clicar num município agora o seleciona e abre um painel ao lado com a tendência e os números; o relatório abre pelo botão do painel (ou duplo clique). Novo campo de busca de município, coluna "Tendência" e link "No mapa" no ranking, e selo de tendência no topo da tela do município.

## 1.27.0

Correção: o potencial de Qualidade das eSF/eAP usava a quantidade de equipes da coluna de Vínculo; quando o SIAPS traz números diferentes nas duas colunas (no RS, Pedro Osório e Porto Alegre no 2026Q2), a margem podia sair negativa. Agora usa a quantidade de equipes avaliadas em Qualidade. Filtro de clientes na Carteira: o botão "⤒ Lista de clientes (.xlsx)" lê uma planilha com a coluna "Cliente" (ex.: a exportação do comercial com os contratos ativos do parceiro Celk), identifica o município de cada linha pelo nome e liga o filtro "Só clientes GOVBR Saúde / Celk" — vale para os totais, o mapa e o ranking. Com o filtro desligado, os clientes aparecem marcados no ranking. A lista vai junto no backup (.json); só o IBGE e o nome do cliente são guardados, nenhum dado de contrato.

## 1.26.0

Importação em lote na Carteira: novo botão "⤒ Importar relatórios do estado (.xlsx)" lê os dois relatórios do SIAPS gerados com a UF e o município em branco ("Todos") e separa município por município automaticamente — dá para trazer o estado inteiro de uma vez ou só atualizar os municípios que já estão na carteira. Quem já estava na carteira mantém estrato, modalidades e destinatário; só os quadrimestres do arquivo novo são substituídos. Municípios novos entram com o estrato do Anexo VI e as modalidades padrão.

## 1.25.0

Novo PDF principal — "Relatório do quadrimestre" — no lugar do antigo relatório com gráficos de barras. Página 1: quanto o repasse subiu ou caiu em relação ao quadrimestre anterior, Qualidade/Vínculo/Fixo e % do potencial em destaque, quanto ficou abaixo do potencial em cada avaliação, a classificação das equipes por tipo (Ótimo antes × agora, margem até tudo Ótimo) e o que puxou a mudança. Página 2 (quando o relatório por indicador estiver carregado no Raio-X): o conceito de cada indicador com um quadrado por equipe, comparando os dois últimos quadrimestres, a tendência de cada um, prioridades sugeridas e o ganho possível no próximo quadrimestre. Novo campo opcional "Destinatário do relatório" (aparece como "Para: …" no cabeçalho e fica salvo na carteira). Também volta o alerta de possível divergência com o Fundo Municipal de Saúde na tela e nos PDFs.

## 1.24.0

Quadro "Composição do repasse por quadrimestre" (tela de Detalhamento e PDF do relatório) revisado: a linha "Potencial máximo" agora mostra também o valor máximo de CVAT e de Qualidade (antes ficava em branco, só o Fixo/IED e o Total apareciam) e cada quadrimestre — inclusive os já avaliados/anteriores — ganhou uma coluna "Perda/mês" mostrando explicitamente, em R$, o quanto ficou abaixo do potencial máximo naquele período.

## 1.23.1

O menu superior (logo, abas Carteira/Adicionar município e o botão de modo claro/escuro) agora acompanha a rolagem — fica sempre visível e fixo no topo da tela, em vez de sumir ao rolar a página para baixo.

## 1.23.0

Novo modo escuro: um botão de sol/lua no canto superior direito do menu alterna entre modo claro e modo escuro em todo o painel — mapa da carteira, gráficos, cartões de diagnóstico, tabelas, tutorial e guia "Como funciona o repasse" incluídos. A escolha fica salva neste navegador (não é enviada a lugar nenhum) e, na primeira visita, o painel já abre no modo preferido do sistema operacional, se houver um definido.

## 1.22.0

Reorganização da porta de entrada do painel: agora que a carteira costuma já ter todos os municípios importados, a tela que abre primeiro passou a ser a Carteira (mapa + ranking + indicadores consolidados) sempre que já existir pelo menos um município salvo neste navegador — antes, era sempre a tela de upload, mesmo para quem já tinha tudo salvo. A tela de upload (com o formulário de envio, "Como funciona o repasse" e o tutorial do SIAPS) continua com todo o conteúdo de sempre, sem nada removido, só passou a se chamar "＋ Adicionar/atualizar município" no menu — reflete melhor seu novo papel de manutenção pontual, não mais de porta de entrada. A Carteira também ganhou um cabeçalho com o mesmo tratamento visual do restante do painel, à altura de ser a primeira tela vista.

## 1.21.6

No Raio-X por indicador, o quadrimestre de referência era mencionado só numa frase no rodapé "Como ler" — fácil de passar batido. Agora aparece logo acima das abas ESF/eAP/eSB/eMulti e da lista de indicadores um selo "Indicadores de [quadrimestre]", visível assim que a aba é aberta.

## 1.21.5

Em alguns computadores (política de antivírus/segurança corporativa), o download automático do PDF podia ser silenciosamente bloqueado sem gerar nenhum erro visível — a pessoa clicava em "Baixar PDF", nada parecia acontecer, e nenhum arquivo aparecia. Agora, toda vez que um PDF é gerado (relatório completo, Resumo p/ secretário ou Raio-X), além da tentativa automática de download, aparece também um link amarelo de clique manual — "O download não começou sozinho? Clique aqui" — que baixa o mesmo arquivo já pronto, sem precisar gerar de novo. Esse link some novamente ao trocar de arquivo/município.

## 1.21.4

Novo tipo de ponto na aba Diagnóstico: "Oportunidade em CVAT", específico para ESF/eAP quando há margem relevante no componente de Vínculo e Acompanhamento Territorial. Diferente dos outros pontos (mais genéricos), a sugestão de agenda copiável aqui já é focada no que efetivamente move a nota de CVAT: atualização e qualificação dos cadastros das famílias, revisão do vínculo de cada família com a equipe do território, e apoio à rotina dos ACS de visita domiciliar e registro do acompanhamento.

## 1.21.3

O CVAT ganhou um cartão próprio no quadro "Onde estão os ganhos e as lacunas", em vez de ficar diluído dentro dos cartões de ESF e eAP. Como o CVAT atravessa os dois tipos de equipe, o novo cartão junta o valor atual, o potencial e a margem dos dois juntos, com a distribuição de classificação específica de Vínculo (que pode ser diferente da distribuição de Qualidade, já que são avaliações independentes). Os cartões de ESF/eAP continuam mostrando o valor de CVAT (pro total bater), mas agora apontam pro cartão dedicado em vez de repetir a margem.

## 1.21.2

No quadro "Onde estão os ganhos e as lacunas — por tipo de equipe" (Visão geral), a margem em aberto de ESF e eAP agora aparece separada por componente: quanto ainda pode ser ganho especificamente em Vínculo (CVAT) e quanto em Qualidade, cada um até a equipe chegar em "Ótimo" — antes só aparecia o total somado, sem dar pra saber qual dos dois estava pesando mais. eSB e eMulti continuam mostrando só Qualidade, que é o único componente variável que têm.

## 1.21.1

No mapa da Carteira, os municípios importados agora ganham um contorno azul-marinho bem definido e a rampa de cor foi ajustada para não chegar perto do branco/cinza — antes, um município com valor baixo na métrica escolhida podia ficar quase indistinguível dos municípios cinzas (sem dado) ao redor.

## 1.21.0

Novo mapa interativo do Rio Grande do Sul na tela da Carteira, colorindo cada município importado conforme uma métrica escolhida (margem em aberto, % do potencial atingido ou repasse atual — quanto mais escuro, maior o valor). Passar o mouse (ou navegar por Tab) mostra os números do município; clicar abre o relatório completo dele, igual ao link "Ver relatório" da tabela de ranking. Municípios ainda não importados aparecem em cinza neutro. Os contornos geográficos ficam embutidos no próprio arquivo (fonte: IBGE, simplificados), então o mapa funciona 100% offline, sem carregar nenhum mapa ou serviço externo.

## 1.20.4

Melhorada a visibilidade dos botões secundários (fundo branco) — "Salvar na carteira", "Resumo p/ secretário", "Trocar arquivo", "Enviar outro", "Importar/Exportar backup" etc. Antes usavam uma borda cinza muito clara que quase não aparecia sobre o fundo da página; agora têm borda e sombra mais definidas (tons de azul-marinho da marca) e um destaque mais claro ao passar o mouse, sem mudar a paleta de cores do portal.

## 1.20.3

Corrigido desalinhamento na barra de parâmetros: quando o Estrato IED é identificado automaticamente (ou precisa de nota explicativa) e aparece junto de um campo de modalidade (eAP/eSB/eMulti) sem nota, os dois campos ficavam com os menus desalinhados verticalmente. Agora os campos alinham pelo topo.

## 1.20.2

Adicionado, logo abaixo do campo "Enviar relatório do SIAPS" na tela inicial, um link direto para o portal público do SIAPS (siaps.saude.gov.br/publico) — facilita pra quem ainda não tem o arquivo em mãos.

## 1.20.1

Ajuste de texto na seção "Como funciona o repasse, em resumo": frase de apoio reescrita para não citar diretamente a equipe comercial.

## 1.20.0

Nova seção "Como funciona o repasse, em resumo", logo abaixo do envio do relatório e antes do tutorial do SIAPS — explica de forma visual e didática o componente Fixo (por Estrato IED), os componentes variáveis Vínculo/CVAT e Qualidade, a escala de classificação (Regular a Ótimo) e o fato de o repasse ser pago com base na avaliação do quadrimestre anterior. Inclui uma tabela expansível com todos os valores oficiais por tipo de equipe (Portaria GM/MS nº 3.493/2024). Pensada para quem apresenta o portal sem dominar a Saúde Pública por dentro.

## 1.19.0

Adicionado favicon (ícone da marca Governança Brasil) na aba do navegador — embutido no próprio arquivo, sem depender de imagem externa.

## 1.18.2

Correção de robustez: as bibliotecas de leitura de planilha (XLSX), gráficos (Chart.js) e geração de PDF (jsPDF) agora ficam embutidas dentro do próprio arquivo, em vez de serem baixadas de um CDN externo ao abrir a página. Antes, se a rede/firewall de quem recebia o arquivo bloqueasse esse CDN, o botão "Selecionar" falhava com o erro "XLSX is not defined". Agora o arquivo funciona sozinho, mesmo sem acesso a esses domínios externos — continua 100% local, nenhum dado sai do navegador em nenhum momento.

## 1.18.1

Adicionado, dentro do bloco "Raio-X por indicador" (antes do primeiro envio), um passo a passo de como gerar esse relatório complementar no portal público do SIAPS — mesmo formato do tutorial já usado para o relatório principal, adaptado para o Componente "Qualidade – Conceito obtido por indicador".

## 1.18.0

Reorganizada a tela do município em abas — Visão geral, Raio-X por indicador, Diagnóstico e Detalhamento — em vez de um scroll único. O Raio-X por indicador virou a 2ª aba (logo depois da Visão geral, antes do Diagnóstico), com um contador vermelho mostrando quantos indicadores estão em "Prioridade" (nota abaixo de 50%) direto na aba, visível sem precisar abrir o painel. O Diagnóstico também ganhou contador. Os parâmetros (Estrato/modalidades) continuam sempre visíveis, fora das abas, porque afetam todas elas.

## 1.17.0

Novo bloco "Raio-X por indicador": envie também o relatório complementar do SIAPS "Qualidade – Conceito obtido por indicador" (upload opcional, na tela do município) para ver, indicador por indicador, exatamente por que uma equipe não chegou a "Ótimo" — não só o resultado agregado. Mostra a nota de cada indicador (peso oficial do SIAPS), destaca os mais críticos e sugere por onde começar a conversa técnica. Novo botão "⤓ Baixar Raio-X (PDF)" gera um relatório técnico de uso interno (consultoria/vendas), com as prioridades de agenda do município. Quando esse relatório é anexado a um município da Carteira, o ranking consolidado passa a mostrar também o indicador mais crítico de cada um, sem precisar abrir município por município.

## 1.16.0

Novo botão "▤ Resumo p/ secretário" gera um PDF de 1 página, em linguagem simples, para entregar diretamente ao secretário/gestor. Em vez do potencial máximo (todas as equipes em "Ótimo" — distante e abstrato), destaca o "próximo passo" mais realista: a maior oportunidade de um grupo de equipes já existente subir um único nível de classificação (ex.: de "Suficiente" para "Bom") já no próximo quadrimestre, com o ganho em R$/mês correspondente.

## 1.15.0

Nova aba "Carteira" no menu superior: salva vários municípios já calculados (localmente, neste navegador) e mostra um ranking consolidado por margem em aberto, com resumo agregado. Cada município pode ser adicionado com um clique ("＋ Salvar na carteira") depois de definido o Estrato IED, reaberto a qualquer momento para gerar o PDF individual de novo, ou removido. Backup completo em .json disponível para importar/exportar — nenhum dado é enviado a servidor em nenhum momento.

## 1.14.0

"Composição do repasse" e "Repasse por tipo de equipe" agora ficam garantidas na 1ª página, sempre — não dependem mais de haver espaço sobrando. Quando o conteúdo é maior (mais quadrimestres, mais tipos de equipe), as duas tabelas encolhem moderadamente em vez de pular para a página 2.

## 1.13.2

Créditos ("Desenvolvido por...") movidos de volta para o rodapé — mas agora só no rodapé da última página, não em todas nem no cabeçalho. Corrigido também o texto de contexto do gráfico "Classificação das equipes", que estava ultrapassando a margem direita sem quebrar linha, e o próprio gráfico passou a ficar centralizado quando mais estreito que a página.

## 1.13.1

Créditos ("Desenvolvido por...") movidos do rodapé de todas as páginas para dentro do cabeçalho — e só na última página do relatório. O rodapé de cada página voltou a mostrar apenas a identificação do relatório e a numeração.

## 1.13.0

Créditos ("Desenvolvido por...") movidos para o rodapé fixo do PDF, em todas as páginas — antes ficavam soltos no fim do conteúdo, só na última página. O gráfico "Classificação das equipes por quadrimestre" ganhou uma linha de contexto (por que ele importa: é a classificação que define a Qualidade no repasse) e uma frase com a leitura da tendência (ex.: "a proporção em Ótimo/Bom caiu de X% para Y%").

## 1.12.1

Ajuste fino de espaçamento no PDF para que "Repasse por tipo de equipe" volte a caber na 1ª página junto com o resto do resumo, sempre que o conteúdo permitir — sem perder o respiro adicionado entre as tabelas.

## 1.12.0

Quadro de repasse mensal do PDF redesenhado em duas colunas (total à esquerda, potencial/margem à direita, com barra de progresso) em vez de uma única coluna estreita dentro de uma caixa larga — a caixa ficou mais baixa e usa o espaço horizontal de verdade, sem parecer "dado pequeno perdido num quadro gigante".

## 1.11.0

PDF com cabeçalho e rodapé em todas as páginas (antes só a capa tinha cabeçalho e não havia rodapé fixo); margens e espaçamento entre seções bem mais generosos — em especial entre "Composição do repasse" e "Repasse por tipo de equipe", que agora nunca ficam espremidas.

## 1.10.0

Diagramação do PDF revisada: a estimativa do quadrimestre agora acompanha cada número a que se refere (em vez de uma linha solta e apertada), com uma nota explicativa ao final do quadro; numeração de páginas em todo o relatório; e gráficos com menos linhas de grade e rótulos abreviados, para uma leitura mais limpa.

## 1.9.0

Estimativa do valor no quadrimestre (4 meses), não só mensal, ao lado do repasse principal e da margem em aberto — reforça que a avaliação de um quadrimestre vale para os 4 meses seguintes.

## 1.8.0

Base completa do Anexo VI (5.570 municípios + DF): o estrato IED agora é identificado automaticamente pelo código IBGE de qualquer município do Brasil, não só de Guaporé.

## 1.7.2

No PDF, "Classificação das equipes por quadrimestre" também passa a iniciar sempre em página nova, independente do diagnóstico.

## 1.7.1

Removida a linha de créditos duplicada que aparecia dentro do relatório depois do upload — agora só o rodapé fixo mostra os créditos.

## 1.7.0

Controle de versionamento — este histórico de mudanças, no rodapé da ferramenta.

## 1.6.1

Sugestões de agenda copiáveis passam a citar a fonte (relatório público do SIAPS) e os dois nomes do programa — "novo financiamento da Atenção Primária" e "Saúde Brasil 360".

## 1.6.0

Referência ao "Saúde Brasil 360" no cabeçalho, na chamada de topo e nos textos de metodologia (tela e PDF).

## 1.5.1

No PDF, a seção "Diagnóstico e oportunidades" passa a iniciar sempre em página nova.

## 1.5.0

Histórico dos quadrimestres anteriores nos quadros de diagnóstico, com correção da ordenação cronológica na virada do ano.

## 1.4.1

Rodapé de créditos redesenhado — sem logo grande e sem cargo, só nome e empresa.

## 1.4.0

Rodapé de créditos fixo, visível na página inicial mesmo antes do upload do relatório.

## 1.3.0

Componentes de Fixo/IED, Vínculo (CVAT) e Qualidade detalhados nos quadros por tipo de equipe.

## 1.2.0

Diagnóstico e oportunidades: detecção automática de padrões (estagnação, gap financeiro, queda de desempenho, anomalias) com sugestão de agenda copiável.

## 1.1.0

Créditos com nome e cargo do desenvolvedor, em tela e no PDF.

## 1.0.0

Versão base: upload do relatório do SIAPS, cálculo de repasse, gráficos, tabelas e geração de PDF.
