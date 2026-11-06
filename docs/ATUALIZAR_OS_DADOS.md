# Como atualizar os dados do painel

**Quando:** a cada novo resultado de quadrimestre publicado no SIAPS (cerca de 3 vezes por ano), quando a lista de clientes mudar ou quando souber a modalidade correta de algum município.

**Quanto tempo leva:** uns 15 minutos.

**O que você vai precisar:** o projeto no seu computador (pasta `painel-repasses-aps`), o GitHub Desktop instalado (veja [PRIMEIROS_PASSOS_GITHUB.md](PRIMEIROS_PASSOS_GITHUB.md)) e um navegador (Chrome ou Edge).

---

## Passo 0: pegue a versão mais recente do projeto

Abra o **GitHub Desktop** e clique em **Fetch origin**. Se aparecer **Pull origin**, clique também. Isso garante que você vai trabalhar em cima da última versão.

## Passo 1: baixe os dois relatórios no SIAPS

Os relatórios são públicos e não precisam de login.

1. Acesse **siaps.saude.gov.br/publico** e localize o bloco **Avaliação do Quadrimestre**.
2. Em **Componente**, selecione **Vínculo e Acompanhamento Territorial e Qualidade**.
3. Escolha **todos os quadrimestres disponíveis** (quanto mais, maior o histórico).
4. Em **Unidade Federativa**, marque **os estados que quer atualizar**. Pode marcar vários, ou todos. **Deixe o município em branco ("Todos").** É isso que traz os estados inteiros de uma vez.
5. Clique em **Aplicar Filtros**, role até o fim da página e clique em **Gerar e baixar o relatório**, formato **.xlsx**.
6. Volte ao filtro, troque o **Componente** para **Qualidade – Conceito obtido por indicador**, com os mesmos quadrimestres, os mesmos estados e município em branco. Gere e baixe o **.xlsx** do mesmo jeito.

Você terá dois arquivos `.xlsx`. Não precisa abrir nem mexer neles.

> Se o SIAPS der erro ou demorar demais com todos os estados marcados, baixe em partes (por exemplo, uma região por vez). Na ferramenta, dá para selecionar todos os arquivos juntos.

> Dica: quadrimestres antigos que já estão no painel **não se perdem** se você baixar só os mais recentes. A ferramenta mantém o histórico e substitui apenas os quadrimestres que vierem no arquivo novo.

## Passo 2: abra a ferramenta de manutenção

Na pasta do projeto, entre em `manutencao/` e dê dois cliques em **`atualizar-dados.html`**. Ela abre no navegador.

No topo, o quadro **"Dados publicados hoje"** mostra o que o painel tem agora.

## Passo 3: importe os relatórios

No bloco **1 · Relatórios do SIAPS**, clique em **Selecionar relatórios do SIAPS** e escolha **todos os arquivos de uma vez** (segure Ctrl e clique em cada um).

Aparece uma mensagem verde para cada arquivo, com quantos municípios, quais quadrimestres e quais estados foram lidos. Cada município vai para o seu estado sozinho, pelo código IBGE. Uma mensagem vermelha indica um arquivo errado (por exemplo, de outro relatório). Nesse caso, nada é importado e você pode tentar de novo.

## Passo 4 (só se mudou): lista de clientes

No bloco **2 · Lista de clientes**, selecione a planilha do comercial (a exportação "Visão Geral", com a coluna **Cliente**).

A ferramenta reconhece o município pelo nome (por exemplo, "PM URUGUAIANA" vira Uruguaiana). A lista pode ter clientes de vários estados. Nesse caso, **a planilha precisa ter uma coluna "UF"**, porque há nomes que existem em mais de um estado (como "Bom Jesus"). Os nomes que ela não reconhecer aparecem em amarelo. Normalmente são hospitais ou fundações, e podem ser ignorados. Se for um município, confira a grafia na planilha e importe de novo.

## Passo 5 (opcional): modalidades

No bloco **3 · Modalidades por município**, digite o nome do município e escolha na lista (ela mostra o estado, como "Alegrete (RS)"), ajuste o estrato IED ou as modalidades (eAP, eSB, eMulti) e clique em **Aplicar a este município**.

Os municípios novos entram com o estrato oficial do Anexo VI e com as modalidades mais comuns: eAP 30h, eSB II comum e eMulti complementar.

> **Uma vez só, na primeira atualização:** se você tem o backup da carteira da versão antiga do painel (arquivo `carteira-repasses-aps-AAAA-MM-DD.json`), use o botão **"Trazer modalidades e histórico de um backup antigo"**. Ele recupera as modalidades que você já tinha ajustado e quadrimestres antigos.

## Passo 6: confira e baixe os arquivos

No bloco **4 · Conferir e gerar os arquivos**:

1. Leia o resumo, com a tabela dos estados (os alterados aparecem como "alterado — baixar"), e os avisos em amarelo. Por exemplo, "município sem dados no quadrimestre mais recente" é informação, não erro.
2. Clique em **Baixar dados dos estados alterados** e, se a lista de clientes mudou, em **Baixar lista de clientes**. Os arquivos vão para a sua pasta **Downloads**: um por estado (`RS.js`, `SP.js`…) e o `indice.js`. Se o navegador perguntar se a página pode baixar vários arquivos, responda que sim.

## Passo 7: coloque os arquivos no lugar

Copie os arquivos baixados para dentro do projeto, **substituindo** os antigos:

| Arquivo baixado | Vai para |
|---|---|
| `RS.js`, `SP.js`… (um por estado) | `site/dados/uf/` |
| `indice.js` | `site/dados/indice.js` |
| `clientes.js` | `site/dados/clientes.js` |

> O `indice.js` é o que faz o estado aparecer no seletor como "com dados". **Sempre copie o `indice.js` junto com os estados.**

> Se o Windows salvar como `RS (1).js`, renomeie para `RS.js` antes de copiar.

## Passo 8: confira o painel

Dê dois cliques em `site/index.html`. Escolha no seletor de estado os estados que você atualizou e confira:

- no topo, "Avaliação mais recente" mostra o quadrimestre novo e a data de hoje;
- o mapa aparece colorido;
- ao abrir um município que você conhece, os valores fazem sentido.

## Passo 9: envie para o GitHub

No **GitHub Desktop**:

1. À esquerda, aparecem os arquivos alterados (por exemplo, `site/dados/uf/RS.js`, `site/dados/indice.js` e, talvez, `clientes.js`).
2. Embaixo, em **Summary**, escreva algo como `Dados 2026Q3 — todos os estados` ou `Lista de clientes atualizada`.
3. Clique em **Commit to main** e depois em **Push origin**.

Pronto. Em 1 a 2 minutos o link do painel mostra os dados novos ([PUBLICAR_NO_HUB.md](PUBLICAR_NO_HUB.md)).

---

## Se algo der errado

- **A ferramenta não mostra nada ao selecionar o arquivo:** confira se é `.xlsx` (não `.csv` nem `.pdf`).
- **"não parece um relatório do SIAPS":** o arquivo pode ter sido aberto e salvo de novo no Excel. Baixe de novo no SIAPS.
- **O estado aparece como "sem dados ainda" depois de trocar os arquivos:** faltou copiar o `indice.js` para `site/dados/`.
- **O estado ficou em branco depois de trocar o arquivo:** o arquivo foi colocado com nome errado. Ele precisa se chamar exatamente a sigla do estado (`RS.js`, `SP.js`…), dentro de `site/dados/uf/`. Para voltar ao que estava, no GitHub Desktop clique com o botão direito no arquivo e escolha **Discard changes**.
- **Quero desfazer uma atualização já enviada:** no GitHub Desktop, aba **History**, clique com o botão direito no commit e escolha **Revert changes in commit**. Depois faça **Push origin**.
