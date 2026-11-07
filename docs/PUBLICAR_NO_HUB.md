# Como publicar o painel no hub

Quem publica é o responsável pelo painel. A publicação só acontece depois da autorização da Infraestrutura/TI (veja a seção 7 da [FICHA_TECNICA.md](FICHA_TECNICA.md)). As instruções do ambiente (onde e como subir os arquivos) vêm dessa autorização. Anote-as no fim deste documento quando as receber.

## A regra de ouro

**Só o conteúdo da pasta `site/` vai para o hub.** Nunca publique `manutencao/`, `marca/`, `docs/` nem `testes/`.

## Antes de publicar (checklist)

1. **Tudo salvo no GitHub:** no GitHub Desktop, não pode haver alterações pendentes. Faça Commit e Push antes.
2. **Painel conferido no seu computador:** abra `site/index.html` com dois cliques e confira:
   - o topo mostra o quadrimestre e a data certos;
   - o mapa aparece colorido;
   - um município abre e o PDF é gerado.
3. **Versão** (só se houve mudança de código, não de dados): atualizada em `site/js/versao.js` e em [HISTORICO_DE_VERSOES.md](HISTORICO_DE_VERSOES.md).
4. **Teste automático** (opcional, se tiver Node instalado): `cd testes`, depois `npm install` (só na primeira vez) e `npm test`. Precisa terminar com "Tudo certo.".

## Publicar

Siga o formato combinado na autorização. Os mais comuns:

- **Envio de arquivos** (upload, pasta de rede, painel do hub): copie **todo o conteúdo de `site/`** para o local do painel, substituindo o que estava lá. Mantenha as subpastas (`css/`, `js/`, `dados/`, `fontes/`, `img/`, `vendor/`) como estão.
- **Publicação automática pelo GitHub** (pipeline ou GitHub Actions): basta o **Push** na branch principal. A automação copia a pasta `site/` sozinha.

## Depois de publicar

1. Abra o endereço do painel no hub e recarregue com **Ctrl+F5**, para não ver a versão guardada no navegador.
2. Confira o rodapé (número da versão) e o "Avaliação mais recente" no topo.
3. Se algo der errado, publique de novo a versão anterior. No GitHub Desktop, use a aba **History** e "Revert changes in commit"; depois, publique de novo.

---

## Publicação atual: GitHub Pages (link aberto)

Desde novembro de 2026 o painel é publicado pelo **GitHub Pages**, a partir do repositório `srjarom/painel-repasses-aps`.

- **Endereço do painel:** https://srjarom.github.io/painel-repasses-aps/
- **Como publicar:** basta o **Push** na branch `main` (GitHub Desktop → Commit to main → Push origin). A automação em `.github/workflows/publicar-painel.yml` publica sozinha o conteúdo de `site/`, em cerca de 1 a 2 minutos.
- **Acompanhar ou repetir:** no GitHub, aba **Actions** → "Publicar painel". Um ✔ verde quer dizer que publicou. Para publicar de novo sem mudar nada: **Run workflow**.
- **Acesso:** o link é **aberto**, sem login. Qualquer pessoa com o endereço vê o painel, inclusive a lista de clientes. Decisão do responsável: os clientes também constam no Portal da Transparência.
- **Cache:** o GitHub Pages guarda os arquivos por até 10 minutos. Se os dados novos não aparecerem, espere um pouco e recarregue com **Ctrl+F5**.

Se no futuro o painel for para o hub da empresa, as instruções abaixo continuam valendo.

## Instruções do ambiente do hub

- Endereço do painel: (a definir pela TI)
- Onde/como enviar os arquivos: um **.zip com o conteúdo da pasta `site/`** (o `index.html` na raiz do zip), entregue à TI de sistemas internos, que publica no Hub corporativo. A TI pretende converter a plataforma para .NET antes de publicar.
- Versões enviadas: 2.4.0 (só RS, novembro de 2026) e depois **4.16.3** (Brasil todo), que substitui a anterior.
- Observações: o site é estático e usa caminhos relativos; os arquivos são chamados com `?v=<versão>` no `index.html` para o navegador não misturar versões — se a conversão mexer nisso, manter um mecanismo parecido.

### Como gerar o pacote .zip (com a nota para a TI)

No terminal (PowerShell), na pasta do projeto:

```
cd testes
npm.cmd run pacote
```

Se a janela abrir em outra pasta, digite antes `cd D:painel-repasses-aps	estes`. No PowerShell, use sempre `npm.cmd` e `npx.cmd` (com `.cmd`): o Windows bloqueia a forma sem `.cmd`.

**Na primeira vez num computador**, o teste precisa do navegador de teste. Se aparecer `Executable doesn't exist`, rode uma vez `npx.cmd playwright install chromium` (baixa uns 150 MB) e depois `npm.cmd run pacote` de novo.

O comando faz tudo em ordem e para se algo der errado:

1. Carimba o `site/index.html` (versão nos arquivos de código, carimbo nos dados).
2. Roda o teste automático. Se falhar, o pacote **não** é gerado.
3. Gera `pacote/painel-repasses-aps-v<versão>.zip`, com o conteúdo de `site/` e o `index.html` na raiz. Se só os dados mudaram, o nome leva a data dos dados (`…-v<versão>-dados-<data>.zip`).
4. Escreve `pacote/NOTAS-<nome do zip>.txt`: o texto para mandar junto, com o que mudou desde o último pacote gerado, se é só dado ou também código, e o quadrimestre mais recente.

Opções:

- `npm run pacote -- --desde 4.16.2`: lista as mudanças desde uma versão específica (útil se um pacote gerado não chegou a ser enviado).
- `npm run pacote -- --sem-teste`: pula o teste (não recomendado).

O último pacote gerado fica anotado em `pacote/ultimo-envio.json`. A pasta `pacote/` não vai para o GitHub (está no `.gitignore`).
