# Primeiros passos: GitHub, GitHub Desktop e VS Code

Este guia é para quem nunca usou versionamento. Você não vai precisar digitar comandos.

## O que é cada coisa

- **Git / versionamento:** guarda cada versão do projeto. Funciona como o "histórico de versões" do Google Docs, só que para uma pasta inteira. Cada vez que você salva uma etapa, cria um **commit** (uma "foto" da pasta com uma descrição). Dá para ver o que mudou e voltar atrás quando quiser.
- **GitHub:** o site onde essa pasta com o histórico fica guardada na nuvem. É de lá que sai a versão publicada no hub. O projeto fica num **repositório** (repo) **privado** da empresa.
- **GitHub Desktop:** programa com botões para fazer tudo isso sem comandos. **É o que você vai usar no dia a dia.**
- **VS Code (Visual Studio Code):** editor para abrir e ler os arquivos do projeto. Use quando for alterar algum texto ou código, ou quando for trabalhar junto com uma IA.

## As 4 palavras que você vai ver

| Palavra | O que significa |
|---|---|
| **Commit** | Salvar uma etapa com uma descrição ("Dados RS 2026Q3"). Fica só no seu computador até o Push. |
| **Push** | Enviar seus commits para o GitHub. |
| **Fetch / Pull** | Buscar no GitHub o que outra pessoa mudou e trazer para o seu computador. |
| **Branch** | Uma "cópia paralela" para testar algo sem mexer na principal (`main`). No começo, trabalhe só na `main`. |

---

## Configuração (uma vez só)

### 1. Crie sua conta no GitHub

Acesse github.com e crie uma conta com o **e-mail da empresa**. Se a empresa tiver uma organização no GitHub, peça à Infraestrutura/TI para incluir você.

### 2. Instale o GitHub Desktop

Baixe em desktop.github.com, instale e entre com a sua conta (**Sign in to GitHub.com**).

### 3. Coloque o projeto no GitHub

Confirme com a Infraestrutura/TI **onde** o repositório deve ficar (faz parte da autorização). Depois, siga um dos caminhos abaixo.

**Se a TI já criou o repositório vazio para você:**

1. No GitHub Desktop: **File → Clone repository**, escolha o repositório e uma pasta no seu computador (por exemplo, `Documentos\GitHub`).
2. Copie para dentro dessa pasta **todo o conteúdo** da pasta `painel-repasses-aps` que você recebeu: `site`, `manutencao`, `docs`, `testes`, `README.md`, `.gitignore`, `.editorconfig`.
3. Volte ao GitHub Desktop, escreva em Summary `Versão 2.0.0 — estrutura inicial` e clique em **Commit to main** e depois em **Push origin**.

**Se você mesmo for criar o repositório:**

1. No GitHub Desktop: **File → Add local repository**, escolha a pasta `painel-repasses-aps`. Ele vai dizer que não é um repositório: clique em **create a repository**.
2. Em seguida, clique em **Publish repository**. **Deixe marcado "Keep this code private".** Se houver organização da empresa, escolha-a em **Organization**.

### 4. Instale o VS Code (opcional, mas recomendado)

Baixe em code.visualstudio.com. No GitHub Desktop, **Repository → Open in Visual Studio Code** abre o projeto inteiro.

Extensões úteis: **Portuguese (Brazil) Language Pack** e **Live Server**. O Live Server abre o painel com um clique e recarrega sozinho quando um arquivo muda.

---

## O dia a dia

### Atualizar os dados

Siga [ATUALIZAR_OS_DADOS.md](ATUALIZAR_OS_DADOS.md). No fim, é sempre:

**Commit to main → Push origin → publicar no hub** ([PUBLICAR_NO_HUB.md](PUBLICAR_NO_HUB.md))

### Alterar algum texto ou funcionalidade (com ajuda de IA)

1. **Fetch origin** para estar com a versão mais recente.
2. Faça a alteração no VS Code, ou peça à IA, entregando a pasta do projeto.
3. Abra `site/index.html` e confira.
4. Atualize a versão em `site/js/versao.js` e anote a mudança em [HISTORICO_DE_VERSOES.md](HISTORICO_DE_VERSOES.md).
5. No GitHub Desktop, **confira a lista de arquivos alterados**. Se apareceu algo que você não esperava, pergunte antes. Depois, **Commit** e **Push**.

> Para mudanças maiores, você pode trabalhar numa **branch** (cópia paralela) e só juntar à `main` depois de conferir. Se a TI pedir revisão antes de publicar, isso se faz com um **Pull Request**.

### Voltar atrás

- **Antes do commit:** botão direito no arquivo → **Discard changes**.
- **Depois do push:** aba **History** → botão direito no commit → **Revert changes in commit** → **Push origin**. O histórico não se perde: o revert cria um novo commit que desfaz o anterior.

---

## Regras de ouro

1. **Nunca** coloque no repositório planilhas originais do comercial, senhas ou dados pessoais. O `.gitignore` do projeto já bloqueia arquivos `.xlsx`, `.csv` e `.json` soltos, por segurança.
2. **Sempre** faça Fetch antes de começar e Push quando terminar.
3. Escreva descrições de commit que digam **o quê** e **por quê**: `Dados RS 2026Q3`, `Corrige texto do aviso do Fundo Municipal`.
4. A pasta `manutencao/` fica no repositório (é ferramenta de trabalho), mas **não é publicada** no hub.
