# PROJECT_CONTEXT.md - BRD Concordia

Gerado em: 2026-07-14 10:22:21

## Descricao

Sistema juridico para gestao de debitos, acordos, cobrancas extrajudiciais e judiciais, prazos, documentos e recuperacao de credito.

## Objetivo

Centralizar cadastros de credores, devedores e debitos; negociacao e acompanhamento de acordos; agenda de vencimentos; gestao financeira; documentos; dashboard; e IA para analise e apoio a cobranca.

## Publico Alvo

Advogados e equipe interna do BRD responsaveis por cobranca, negociacao e recuperacao de credito.

## Caracteristicas Informadas

- Interface visual: Sim
- Login/autenticacao: Sim
- Banco de dados: Sim
- Offline/PWA: Nao
- Mobile: Nao
- Dashboard/graficos: Sim
- API propria: Nao
- Integracoes externas: Nao
- Multiusuario: Sim

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

## Stack Escolhida

```text
React + Vite + Supabase
```

## Motivo Da Stack

O projeto tem interface e sinais de login, multiusuario ou dados persistentes. React organiza telas/estado e Supabase reduz custo inicial de auth e banco.

## Alternativas Rejeitadas

HTML/CSS/JS vanilla: pode limitar evolucao com varias telas. Backend customizado: rejeitado no inicio para evitar manutencao antes da necessidade real.

## Revisao Obrigatoria De Stack

Antes da primeira feature real, o `senior-dev` deve validar se a stack escolhida ainda faz sentido.

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
