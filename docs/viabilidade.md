# Analise de Custos e Viabilidade - BRD Concordia

Origem: Trello card https://trello.com/c/22I5Mg68 (Issue #4)
Documento de referencia versionado. Atende ao checklist do card:
levantar escopo de custos, estimar esforco tecnico, analisar viabilidade e
registrar recomendacao.

> Este documento e uma recomendacao tecnica, nao uma aprovacao financeira.
> Valores de dinheiro e prazo aparecem como faixas e cenarios, com premissas
> marcadas como "a confirmar". Cabe aos socios fixar orcamento e prazo finais.

## 1. Sumario Executivo

- **Escopo analisado:** todas as funcionalidades ja definidas em
  `PROJECT_CONTEXT.md` (confirmacao dos socios no card: "todas que passamos").
- **Tipo de viabilidade:** tecnica e comercial (confirmacao dos socios: "ambos").
- **Recomendacao:** o projeto e **viavel** na stack escolhida
  (React + Vite + Supabase), desde que entregue **por fases**, comecando por um
  MVP de gestao de debitos/acordos e agenda de vencimentos. A IA Concordia deve
  entrar em fase posterior por ter o maior custo variavel e o maior grau de
  incerteza.
- **Esforco total estimado (escopo completo):** faixa de **26 a 40 semanas-dev**
  (ver secao 4), sensivel ao tamanho da equipe e ao nivel de acabamento visual.
- **Custo:** dominado por horas de desenvolvimento; custo de infraestrutura e
  baixo no inicio (ver secao 5). O unico custo recorrente relevante e a IA.

## 2. Escopo Considerado

Todos os modulos ja levantados em `PROJECT_CONTEXT.md`:

1. Identidade visual (marca BRD Concordia).
2. Cadastros (credores/clientes, devedores PF/PJ, contatos, representantes).
3. Debitos e acordos (origem, situacao, fase, recuperabilidade).
4. Financeiro do debito (valor original/atualizado, descontos, encargos,
   parcelas, comprovantes, conferencia).
5. Judicial (processo, vara, comarca, acao, valor da causa, datas).
6. Prazos e agenda (compromissos a partir de vencimentos; vence hoje,
   proximos 30 dias, vencidos).
7. Cobranca (mensagens pre e pos-vencimento, versao incisiva).
8. Documentos (modelos extrajudiciais e judiciais).
9. Dashboard (filtros por credor, atrasos, recuperados, pendentes).
10. Financeiro e atualizacao monetaria (referencia visual/funcional do Integra).
11. IA Concordia (leitura de documentos, extracao, resumo, sugestao de
    mensagens, deteccao de documentos faltantes, apontamento de riscos).

Fora de escopo (ja registrado no contexto): conteudos exclusivos do BRD Pactum,
melhorias do BRD Assistant e a agenda generica de salas de reuniao.

## 3. Premissas e Restricoes

- **Equipe base assumida (a confirmar):** 1 a 2 desenvolvedores dedicados.
- **Prazo e orcamento maximo:** nao foram fixados pelos socios no card
  (campos em branco). Por isso o custo e apresentado em cenarios; o numero final
  depende dessa definicao e do valor-hora praticado, que **nao** e arbitrado
  aqui.
- **Stack:** React + Vite + Supabase, conforme decisao registrada. A revisao
  obrigatoria de stack (secao 6) confirma que ela atende ao escopo.
- **Autenticacao e banco:** providos pelo Supabase (reduz esforco inicial de
  auth/DB), incluindo controle multiusuario com papeis.
- **Sem integracoes externas** nesta fase (confirmado no contexto); Integra
  entra apenas como referencia visual/funcional.
- **Pendencia de marca:** a assinatura das mensagens do Concordia
  ("BRD Pactum" vs "BRD Concordia") segue por confirmar e afeta apenas texto de
  template, nao arquitetura.

## 4. Estimativa de Esforco Tecnico

Esforco em **semanas-dev** (uma semana-dev = uma pessoa trabalhando uma semana).
Faixas cobrem do enxuto (reuso de componentes, acabamento simples) ao completo
(validacoes, estados de erro, acabamento visual maior).

| Modulo | Complexidade | Esforco (semanas-dev) |
|---|---|---|
| Fundacao (projeto, auth Supabase, papeis, layout base, CI/testes) | Media | 2 - 3 |
| Identidade visual / design system | Baixa-Media | 1 - 2 |
| Cadastros (credores, devedores PF/PJ, contatos) | Media | 3 - 4 |
| Debitos e acordos | Alta | 4 - 6 |
| Financeiro do debito (parcelas, comprovantes, conferencia) | Alta | 3 - 5 |
| Judicial | Media | 2 - 3 |
| Prazos e agenda (calendario + visoes) | Media-Alta | 2 - 3 |
| Cobranca (mensagens/templates) | Baixa-Media | 1 - 2 |
| Documentos (modelos) | Media | 2 - 3 |
| Dashboard (filtros + graficos) | Media-Alta | 2 - 3 |
| Financeiro e atualizacao monetaria | Media | 2 - 3 |
| IA Concordia | Muito Alta | 4 - 6 |
| **Total** | | **26 - 40** |

Observacoes:
- A **fundacao** deve vir primeiro; todos os modulos dependem dela.
- **Debitos/acordos + financeiro** sao o nucleo de valor e concentram a maior
  complexidade de regras (encargos, saldos, parcelas).
- A **IA Concordia** tem a maior incerteza: alem do esforco de integracao, tem
  custo recorrente por uso (secao 5) e depende da qualidade dos documentos
  reais para calibrar extracao/resumo.

## 5. Escopo de Custos

O custo do projeto e dominado pelo **esforco de desenvolvimento** (horas);
infraestrutura inicial e barata.

### 5.1 Custo de desenvolvimento (principal)

Custo = (semanas-dev da secao 4) x (valor-hora x horas/semana).
O **valor-hora nao e arbitrado aqui** (a confirmar com os socios). Estrutura de
calculo para quando o valor for definido:

- Cenario **MVP** (fundacao + cadastros + debitos/acordos + financeiro basico +
  agenda + dashboard minimo): ~13 a 20 semanas-dev.
- Cenario **Completo v1** (todos os modulos, exceto refino profundo de IA):
  ~22 a 34 semanas-dev.
- Cenario **Completo + IA madura:** ~26 a 40 semanas-dev.

### 5.2 Custo de infraestrutura recorrente

- **Supabase:** plano gratuito cobre desenvolvimento e piloto; plano pago
  (faixa de dezenas de USD/mes, a confirmar no ato da contratacao) quando crescer
  volume de dados/usuarios e necessidade de backups.
- **Hospedagem do front (ex.: Vercel/Netlify):** faixa gratuita atende inicio.
- **Dominio + e-mail transacional (se cobranca sair por e-mail):** custo baixo,
  a confirmar conforme canal escolhido.

### 5.3 Custo variavel de IA (Concordia)

- Cobrado **por uso** (por documento lido / por geracao de texto). Escala com o
  volume de casos processados, nao com o numero de usuarios.
- E o item de maior risco de custo recorrente; recomenda-se **limite de uso** e
  medicao desde o piloto para projetar o gasto mensal antes de liberar em larga
  escala.

## 6. Viabilidade Tecnica

**Conclusao: viavel.**

- A stack **React + Vite + Supabase** cobre todo o escopo: telas com estado
  (React), auth/multiusuario e persistencia (Supabase), sem backend proprio no
  inicio. Isso reduz custo e tempo ate a primeira entrega.
- Riscos tecnicos concentram-se em **regras financeiras** (atualizacao
  monetaria, encargos, saldos, parcelas) e na **IA** (qualidade de extracao).
  Ambos sao contornaveis: as regras financeiras sao deterministicas e testaveis;
  a IA pode comecar como apoio (sugestao revisada por humano) antes de qualquer
  automacao critica.
- **Quando revisitar a stack:** se surgir necessidade de logica de servidor
  complexa (calculos pesados, jobs agendados, regras que nao devem viver no
  cliente), avaliar Supabase Edge Functions antes de introduzir backend proprio.

## 7. Viabilidade Comercial / Mercado

**Conclusao: favoravel, com uso interno como primeira validacao.**

- **Publico e dor claros:** advogados e equipe interna do BRD que hoje lidam com
  cobranca/recuperacao. O produto substitui controle disperso (planilhas,
  documentos soltos) por um fluxo unico. O primeiro "cliente" e o proprio BRD,
  o que reduz risco de adocao e da retorno rapido.
- **Diferencial:** a IA Concordia (extracao de dados de documentos, resumo de
  casos, sugestao de mensagens) e o que distingue de um CRM/cobranca generico.
- **Caminho de mercado:** provado o ganho interno, o mesmo produto pode ser
  oferecido a outros escritorios/credores (modelo SaaS multiusuario ja suportado
  pela stack). Isso deve ser tratado como fase posterior, nao como requisito da
  v1.
- **Riscos comerciais:** custo variavel da IA sobre a margem; sensibilidade de
  dados juridicos/financeiros (LGPD) exige cuidado com acesso, trilha de
  auditoria e retencao desde o inicio.

## 8. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|---|---|---|
| Escopo grande entregue de uma vez | Atraso, retrabalho | Entregar por fases; MVP primeiro |
| Custo recorrente da IA | Margem | Limite de uso + medicao desde o piloto |
| Regras financeiras incorretas | Erro de cobranca | Testes automatizados das regras deterministicas |
| Dados sensiveis (LGPD) | Legal/reputacional | Papeis, controle de acesso e trilha desde o inicio |
| Prazo/orcamento nao fixados | Planejamento incerto | Confirmar com socios antes de fechar cronograma |
| Pendencia de marca nas mensagens | Retrabalho de texto | Confirmar assinatura antes de gerar templates |

## 9. Recomendacao

1. **Aprovar** o inicio do desenvolvimento na stack atual.
2. **Entregar por fases**, comecando pelo MVP (fundacao, cadastros,
   debitos/acordos, financeiro basico, agenda, dashboard minimo) — nucleo de
   valor com menor incerteza.
3. **Adiar a IA Concordia** para uma fase seguinte, com piloto medido de custo
   antes de liberacao ampla.
4. **Definir com os socios**, para fechar o cronograma e o custo final (nao sao
   bloqueios para esta analise, mas sao para o planejamento executivo):
   - prazo esperado e recursos dedicados;
   - orcamento maximo / valor-hora praticado;
   - canal da cobranca (somente no sistema, e-mail, etc.), que afeta custo de
     e-mail transacional;
   - assinatura correta das mensagens do Concordia.

## 10. Proximos Passos

- Registrar esta recomendacao (este documento) como fonte versionada.
- Levar ao ciclo dos socios as definicoes da secao 9.4 para fechar cronograma e
  custo.
- Iniciar o MVP na proxima rodada de desenvolvimento seguindo o workflow
  obrigatorio (senior-dev -> ui-ux-expert -> code-reviewer -> qa-senior ->
  qa-automate).
