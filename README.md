# BRD Concordia

Primeira interface para avaliacao local, com identidade visual do BRD Assistant. Todos os registros sao ficticios; a data-base da demonstracao e 19/09/2026.

## Demonstracao publica

Acesse [BRD Concordia](https://vinnitog.github.io/brd-concordia/).

O GitHub Pages publica somente a pasta `public/`. O workflow `.github/workflows/pages.yml` executa os testes e publica automaticamente apos alteracoes chegarem a `main`; tambem pode ser executado manualmente nessa branch. As mudancas seguem por `develop` e PR para `main`.

A demonstracao usa arquivos estaticos, sem build ou servidor Node em producao. Os caminhos relativos preservam fontes, scripts, logo e favicon tanto na URL do projeto quanto no servidor local.

## Executar

Requer Node.js 22 ou superior. No Windows:

```powershell
.\start.cmd
```

Abra http://127.0.0.1:4317. Para outra porta, defina `$env:PORT = '4318'` antes de iniciar. Encerre com Ctrl+C no terminal que executa o servidor.

A porta propria evita reutilizar a origem de previews de outros apps. Se o navegador mostrar o login do Assistant em uma porta antiga, abra o endereco acima: esta demonstracao do Concordia nao tem tela de login. Um service worker de outro app pode continuar interceptando uma origem usada anteriormente, mesmo que o servidor tenha mudado.

## Avaliar

- Navegue entre Visao geral, Debitos, Acordos e Prazos.
- Use os filtros de credor, busca e situacao para consultar os registros.
- Abra um debito para examinar o acordo e as parcelas relacionadas.
- Experimente uma busca sem resultados e limpe os filtros.

A demonstracao nao autentica usuarios, nao salva alteracoes e nao realiza cobrancas. Nao insira dados pessoais reais. Nenhuma dependencia externa precisa ser instalada.

## Validar

```powershell
.\test.cmd
git diff --check
```

Consulte `PROJECT_CONTEXT.md` para escopo e limites; `DESIGN.md` descreve o sistema visual implementado.
