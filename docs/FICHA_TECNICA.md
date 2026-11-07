# Painel de Repasses APS: ficha técnica

**Versão do painel:** 4.11.0
**Responsável (desenvolvimento, dados e publicação):** Jarom Rosa

Resumo técnico do painel para avaliação e autorização de publicação no hub corporativo: o que ele é, como funciona, que dados usa e o que precisa ser autorizado.

**Papéis:**

- **Responsável pelo painel:** mantém o código e os dados e faz a publicação (deploy).
- **Infraestrutura / TI:** autoriza a publicação e define as regras do ambiente (onde hospedar, acesso, autenticação).

---

## 1. Em uma frase

É um **site estático**: HTML, CSS e JavaScript puros. Não tem servidor de aplicação, banco de dados, login próprio nem build. Os dados vêm em arquivos `.js` dentro da própria pasta. Basta servir a pasta `site/` como arquivos estáticos.

## 2. Arquitetura

```
          (manutenção — só no computador do responsável)
  Relatórios públicos do SIAPS (.xlsx) ──┐
  Lista de clientes do comercial (.xlsx) ─┤──► manutencao/atualizar-dados.html
                                          │        (roda no navegador, offline)
                                          ▼
                              site/dados/uf/<UF>.js, indice.js, clientes.js
                                          │
                                   git commit / push
                                          │
                                          ▼
          Repositório ──► publicação da pasta site/ (pelo responsável) ──► hub corporativo
                                                                  │
                                                     usuários (só leitura)
```

- **Front-end:** JavaScript sem framework, em arquivos `<script>` clássicos. A ordem de carregamento está no fim de `site/index.html` e é a mesma ordem de dependência. Nada é compilado e não há `npm install` para o site.
- **Bibliotecas** (versionadas em `site/vendor/`, sem CDN):
  - Chart.js 4: gráficos.
  - jsPDF 2: geração dos PDFs no navegador.
  - SheetJS (`xlsx`): só na manutenção, em `manutencao/vendor/`.
- **Dados:** `site/dados/*.js`. Cada arquivo chama `PainelDados.registrar…(…)`. Os dados são `.js` em vez de `.json` para o painel também abrir por duplo clique (`file://`), sem `fetch`. O formato está em [FORMATO_DOS_DADOS.md](FORMATO_DOS_DADOS.md).
- **Fontes:** Guanabara Sans e IBM Plex Sans, servidas da própria pasta (`site/fontes/*.woff2`, 236 KB) e embutidas nos PDFs. A Guanabara é comercial: ver [FONTES.md](FONTES.md) sobre a licença de uso web/PDF.
- **Requisições externas:** **nenhuma.** Não há CDN, fontes externas, analytics nem API. O único link externo é para a Portaria no Diário Oficial, e ele só abre se o usuário clicar.
- **Armazenamento no navegador:** só preferências, em `localStorage`:
  - `painel-repasses-tema`: claro ou escuro.
  - `painel-repasses-filtro-clientes`: estado do filtro.
- **PDFs:** gerados no próprio navegador do usuário (jsPDF). Nada sai da máquina.
- **Tamanho:** cerca de 7 MB na pasta (5 MB são os mapas dos 27 estados e 620 KB são bibliotecas), mas quem abre o painel baixa só a página e o estado escolhido (cerca de 2 MB). Comprime bem com gzip/brotli.

## 3. O que publicar e o que NÃO publicar

| Pasta | Publicar? | Por quê |
|---|---|---|
| `site/` | **Sim** (raiz do site) | É o painel. |
| `manutencao/` | **Não, nunca** | Ferramenta de importação, de uso exclusivo do responsável pelos dados. Ela não grava nada no servidor, mas não deve ficar disponível aos usuários. |
| `docs/`, `testes/`, `marca/`, `README.md` | Não | Documentação, testes e arquivos originais das fontes. |

Se a publicação for automática a partir do repositório, ela deve copiar **só o conteúdo de `site/`**.

## 4. Dados e LGPD

- **Fonte:** relatórios **públicos** do SIAPS/Ministério da Saúde, agregados por município: quantidade de equipes por classificação e notas por indicador. **Não há dado pessoal** de paciente ou profissional.
- **Lista de clientes:** apenas **código IBGE + nome do cliente** (por exemplo, "PM URUGUAIANA"). Valores, contratos e contatos da planilha comercial **não são gravados**.
- **Dado digitado pelo usuário:** o único campo é "Destinatário do relatório", que vai só para o cabeçalho do PDF gerado na máquina. Ele não é enviado nem salvo.
- **Por ser informação comercial interna**, a lista de clientes é a parte mais sensível. Por isso o painel deve ficar **atrás da autenticação do hub**, e não em um link aberto.

## 5. Fluxo de atualização (quem faz o quê)

1. **Responsável pelo painel**, a cada novo quadrimestre do SIAPS (cerca de 3 vezes por ano), e quando a lista de clientes muda:
   - baixa os relatórios;
   - roda `manutencao/atualizar-dados.html`;
   - substitui os arquivos dos estados atualizados (`site/dados/uf/<UF>.js`), o `site/dados/indice.js` e, se mudou, o `site/dados/clientes.js`;
   - confere localmente;
   - faz commit e push.

   Passo a passo em [ATUALIZAR_OS_DADOS.md](ATUALIZAR_OS_DADOS.md).
2. **Publicação (deploy):** também pelo responsável, seguindo [PUBLICAR_NO_HUB.md](PUBLICAR_NO_HUB.md), dentro das regras autorizadas (seção 7).
3. **Mudanças de código:** também pelo responsável, com apoio de IA. Cada versão é registrada em `site/js/versao.js` e em [HISTORICO_DE_VERSOES.md](HISTORICO_DE_VERSOES.md).

Os arquivos de dados têm **um município por linha**. Assim o diff do Git mostra exatamente quais municípios mudaram em cada atualização.

## 6. Pontos técnicos que podem interessar

- **Content-Security-Policy:** o HTML ainda usa alguns `onclick="…"` inline e estilos inline herdados da versão 1.x. Uma CSP restritiva precisaria de `script-src 'self' 'unsafe-inline'` e `style-src 'self' 'unsafe-inline'`. Se for requisito, dá para migrar para `addEventListener` em uma próxima versão.
- **Cache:** os arquivos não têm hash no nome. Para os usuários verem dados novos logo após o deploy, sugiro:
  - `Cache-Control: no-cache` em `index.html` e em `dados/`; ou
  - acrescentar `?v=<versão>` nas tags `<script>` a cada publicação.
- **Navegadores:** Chrome, Edge e Firefox atuais. Funciona no celular, com layout responsivo.
- **Teste automático (opcional):** `testes/` tem um smoke test com Playwright. Ele abre o painel, confere que não há erros no console, abre um município e gera os três PDFs. Rodar com `cd testes && npm install && npm test`. Dá para colocá-lo no CI antes do deploy.
- **Sem backend:** se no futuro for preciso login por perfil (por exemplo, só alguns usuários verem o filtro de clientes) ou dados de todo o Brasil, aí sim faz sentido uma API ou banco. Veja a seção 8.

## 7. O que precisa de autorização

1. **Publicação no hub:** autorização para hospedar a pasta `site/` e em qual caminho ou domínio (por exemplo, `hub…/painel-repasses-aps/`). O painel funciona em subpasta, porque todos os caminhos são relativos.
2. **Acesso de publicação:** permissão para o responsável publicar no ambiente, e de que forma (upload dos arquivos, pipeline, GitHub Actions…).
3. **Repositório:** onde o código fica guardado (GitHub da empresa ou outra plataforma), sempre como repositório privado.
4. **Autenticação:** o painel deve ficar atrás do login do hub (SSO), por causa da lista de clientes. Não precisa de nenhuma integração no código.
5. **Homologação (opcional):** se existe um ambiente de teste para conferir antes de produção.
6. **Política de TI/IA:** se há checklist ou aprovação específica para ferramentas feitas com apoio de IA.
7. **Licença de fonte:** confirmar que a licença da Guanabara Sans cobre uso web e em PDF ([FONTES.md](FONTES.md)).

## 8. Próximos passos possíveis (não urgentes)

- **Visão Brasil:** desde a versão 3.0.0 o painel tem seletor com os 27 estados, mapas de todos eles e carrega só o estado escolhido (cerca de 1 MB por estado; o Brasil inteiro soma cerca de 12 MB). Um próximo passo possível é uma tela inicial com o ranking dos estados.
- **Atualização automática:** os relatórios do SIAPS hoje são baixados manualmente no portal público. Se o Ministério oferecer API ou download direto, a manutenção pode virar uma rotina agendada.

---

Toda a documentação de uso, manutenção e publicação está nesta pasta `docs/`.
