# PROJECT_CONTEXT.md - BRD Concordia

Gerado em: 2026-07-14 10:22:21

## Descricao

Sistema juridico para gestao de debitos, acordos, cobrancas extrajudiciais e judiciais, prazos, documentos e recuperacao de credito.

## Objetivo

Centralizar cadastros de credores, devedores e debitos; negociacao e acompanhamento de acordos; agenda de vencimentos; gestao financeira; documentos; dashboard; e IA para analise e apoio a cobranca.

## Publico Alvo

Advogados e equipe interna do BRD responsaveis por cobranca, negociacao e recuperacao de credito.

## Requisitos Futuros Informados

- Interface visual: Demonstracao local implementada
- Login/autenticacao: Planejado
- Banco de dados: Planejado
- Offline/PWA: Nao
- Mobile: Nao
- Dashboard/graficos: Planejado
- API propria: Nao
- Integracoes externas: Nao
- Multiusuario: Planejado

## Capacidades Atuais

- Ciclo do projeto: scaffold de dominio com demonstracao visual local.
- Documentacao do dominio e decisoes arquiteturais.
- Politicas puras de dominio executadas em Node.js, sem dependencias externas.
- Testes automatizados do scaffold e das politicas.
- Frontend demonstrativo em HTML/CSS/JavaScript, servido localmente por Node.js.
- Sem autenticacao, banco de dados, Supabase ou integracao externa reais.
- Dados ficticios e data-base fixa identificados; sem persistencia ou cadastro de dados pessoais.

## Primeira Interface Local

Solicitada pelo usuario em 2026-09-19, com identidade visual do BRD Assistant e construcao direta em codigo. Inclui visao geral, consulta de debitos, acordos e prazos, filtros e detalhes relacionados. A auditoria usa Impeccable e revisao UI/UX.

Alternativas comparadas: HTML/CSS/JavaScript com servidor Node nativo permite avaliar a interface sem dependencias; React + Vite adicionaria build e dependencias sem necessidade comprovada nesta demonstracao. Foi adotada a primeira opcao. A decisao e reversivel: interface isolada em `public/`, politicas puras preservadas em `src/domain/`. Persistencia e autenticacao continuam fora desta entrega.

Execute `start.cmd` ou `npm.cmd start`; a demonstracao fica em `http://127.0.0.1:4317`. `PORT` permite outra porta. O servidor atende somente arquivos publicos e escuta apenas na interface de loopback. A porta propria evita a origem 4173, na qual o navegador do usuario exibiu um login antigo do BRD Assistant apesar de o servidor responder o HTML do Concordia. Cache de PWA e a causa provavel; a demonstracao nao possui login.

Ativos do BRD Assistant foram copiados como arquivos locais, sem importar codigo nem compartilhar historico Git. A implementacao atual usa DM Sans nos titulos; essa evidencia prevalece sobre o handoff antigo com Gupter.

Esta demonstracao cobre quatro vistas de consulta e nao substitui o contrato de oito abas registrado em `src/domain/navegacao.js`. Os assets e o guia anteriores em `assets/brand/` e `docs/identidade-visual.md` permanecem preservados; para esta interface, a referencia visual escolhida expressamente pelo usuario e o BRD Assistant. O sistema implementado esta descrito em `DESIGN.md`.

## Escopo Funcional Extraido Dos Documentos

- Identidade visual: criar a marca BRD Concordia preservando fontes e caracteristicas principais da identidade BRD.
- Debitos e acordos: vincular credores, clientes e devedores cadastrados; registrar origem, situacao da cobranca, fase extrajudicial/judicial/pre-contenciosa, observacoes e grau de recuperabilidade.
- Financeiro do debito: controlar valor original e atualizado, descontos, encargos, saldo, entrada, parcelas, vencimentos, formas e status de pagamento; permitir comprovante por pagamento e registrar quem o conferiu.
- Judicial: registrar processo, vara, comarca, tipo de acao, valor da causa e datas de distribuicao e suspensao.
- Cadastros: manter credores/clientes e devedores PF ou PJ, contatos, endereco, representante legal, responsavel interno e acordos relacionados.
- Prazos e agenda: gerar compromissos a partir dos vencimentos dos acordos, com calendario e lista nos moldes do BRD Pactum/Integra e visoes de vence hoje, proximos 30 dias e vencidos.
- Cobranca: gerar mensagens antes e depois do vencimento, incluindo uma versao mais incisiva para inadimplemento persistente.
- Documentos: disponibilizar modelos extrajudiciais e judiciais para cobranca, acordo, quitacao, mora, descumprimento e andamento processual.
- Dashboard: filtrar por credor e acompanhar vencimentos, atrasos, acordos proximos da quitacao, debitos sem acordo, valores recuperados, pendentes, ativos e em atraso.
- Financeiro e atualizacao monetaria: usar as telas correspondentes do Integra como referencia funcional e visual, sem assumir integracao externa nesta fase.
- IA Concordia: ler documentos, extrair credor, devedor, valores e datas, resumir casos, sugerir mensagens, identificar documentos faltantes e apontar riscos do acordo.

Os exemplos de mensagem na secao do Concordia aparecem assinados como "BRD Pactum". A marca correta dessas mensagens deve ser confirmada antes da implementacao.

Conteudos exclusivos do BRD Pactum, melhorias do BRD Assistant e a agenda generica de salas de reuniao nao fazem parte deste escopo.

## Decisoes De Dominio Atuais

- `Parte` e o cadastro juridico canonico; credor e devedor sao papeis assumidos em cada `Debito`.
- `UsuarioBRD` representa identidade operacional interna e nao se confunde com `Parte`; acesso externo esta fora do scaffold.
- Cada `Acordo` pertence a um unico `Debito`; um debito preserva acordos sucessivos e possui no maximo um acordo ativo.
- `Debito`, `Acordo`, `Parcela` e `ProcessoJudicial` possuem ciclos de vida separados.
- Pagamentos, conferencias, acordos sucessivos e memorias de calculo preservam historico auditavel sem exigir event sourcing.
- Atualizacao monetaria depende de politica configuravel futura e deve produzir `MemoriaDeCalculo` reproduzivel.
- `Prazo` pode ser derivado de parcela, acordo ou processo judicial, ou ser manual com responsavel e justificativa.
- `ModeloDeDocumento` e `DocumentoGerado` sao conceitos distintos; o documento emitido preserva versao e vinculo juridico.
- A conferencia registra quem lancou e quem conferiu o pagamento, sem segregacao obrigatoria nesta fase.
- Credor e devedor compartilham um unico cadastro de `Parte` com selecao de tipo (PF/PJ); a mesma Parte pode assumir os dois papeis simultaneamente ou em momentos distintos. Representante legal so se aplica a PJ e pode reaparecer em multiplas PJs. Nesta fase os demais dados sao opcionais e CPF/CNPJ aceita qualquer entrada (Issue #9, decisao dos socios).
- A navegacao expoe oito abas (Debitos, Cadastros, Prazos, Documentos, Dashboard, Financeiro, Atualizacao monetaria, IA Concordia); o Dashboard e a aba inicial pos-login. O acesso por aba pode ser restrito por perfil, permissivo por padrao no prototipo (todos veem tudo), com restricao futura prevista para Financeiro. A forma de apresentar a restricao (bloqueio, ocultacao ou desabilitacao visual) sera decidida quando existir front-end.

O vocabulario canonico esta em `CONTEXT.md`. A decisao de rastreabilidade esta em `docs/adr/0001-preservar-estado-auditavel-sem-event-sourcing.md`.

## Hipotese De Stack Futura

```text
React + Vite + Supabase
```

Essa combinacao e uma hipotese de evolucao, nao uma capacidade atual nem autorizacao para implementar infraestrutura. React pode atender futuras telas com rotas e estado; Supabase somente pode ser avaliado quando existirem requisitos de persistencia, autenticacao e dados pessoais suficientemente definidos.

## Stack Atual Do Scaffold

```text
Node.js + biblioteca padrao
```

O dominio usa modulos puros e o test runner nativo do Node.js. O frontend demonstrativo usa APIs nativas do navegador e servidor HTTP da biblioteca padrao. Nao ha dependencia externa de runtime, build ou servico.

## Revisao Obrigatoria De Stack

Antes da primeira feature real de interface, persistencia ou autenticacao, o `senior-dev` deve comparar alternativas e registrar a decisao proporcional ao custo de reversao.

Se houver front-end, `ui-ux-expert` deve validar impacto visual e UX.

O `code-reviewer` deve apontar risco de stack inadequada, excesso de complexidade ou falta de base para evolucao.

## Workflow Padrao

1. `senior-dev`
2. `ui-ux-expert`, quando houver front-end
3. `code-reviewer`
4. `qa-senior`
5. `qa-automate`
6. Validacao final com testes e diff
7. Commit/push em `develop` e PR `develop -> main`

## Comandos De Validacao

```powershell
.\test.cmd
npm.cmd test
git diff --check
```

## Notas De Escopo

- Trabalhar sempre em `develop`.
- Nunca fazer push direto para `main`.
- Preservar alteracoes existentes do usuario.
- Fazer staging explicito por arquivo.
- Manter documentacao de contexto versionada neste arquivo.
