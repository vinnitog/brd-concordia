# Analise de Custos e Viabilidade - BRD Concordia

Origem: Trello card https://trello.com/c/22I5Mg68 (Issue #4)
Documento de referencia versionado. Atende ao checklist do card:
levantar escopo de custos, estimar esforco tecnico, analisar viabilidade e
registrar recomendacao.

Reconciliado em 09/10/2026 com `PROJECT_CONTEXT.md`, o codigo e as Issues
[#3](https://github.com/vinnitog/brd-concordia/issues/3),
[#4](https://github.com/vinnitog/brd-concordia/issues/4),
[#14](https://github.com/vinnitog/brd-concordia/issues/14) e
[#17](https://github.com/vinnitog/brd-concordia/issues/17).
As faixas de esforco e custos abaixo sao estimativas historicas, sem nova
cotacao, pesquisa de precos ou compromisso de prazo. Nao representam trabalho
restante medido. O total da tabela foi corrigido apenas pela soma de suas linhas.

> Este documento e uma recomendacao tecnica, nao uma aprovacao financeira.
> Valores de dinheiro e prazo aparecem como faixas e cenarios, com premissas
> marcadas como "a confirmar". Cabe aos socios fixar orcamento e prazo finais.

## 1. Sumario Executivo

- **Escopo analisado:** todas as funcionalidades ja definidas em
  `PROJECT_CONTEXT.md` (confirmacao dos socios no card: "todas que passamos").
- **Tipo de viabilidade:** tecnica e comercial (confirmacao dos socios: "ambos").
- **Estado atual:** Node.js e biblioteca padrao, politicas puras e demonstracao
  HTML/CSS/JavaScript com dados ficticios. A demonstracao esta publicada no
  [GitHub Pages](https://vinnitog.github.io/brd-concordia/); nao ha autenticacao,
  banco de dados nem integracao de IA real.
- **Recomendacao historica:** evoluir por fases. React + Vite + Supabase e
  apenas uma hipotese futura, sujeita a requisitos e comparacao de alternativas;
  nao e a stack atual nem uma decisao de contratacao.
- **Esforco historico (escopo completo):** a soma das linhas da secao 4 e
  **28 a 43 semanas-dev**, corrigindo o total anterior de 26 a 40. Essa correcao
  aritmetica nao reestima a entrega atual.
- **Custo:** ainda depende de equipe, operacao e volume; nao ha evidencia para
  afirmar que IA sera o unico custo recorrente relevante.

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
- **Stack atual:** Node.js com biblioteca padrao e interface estatica. A
  hipotese React + Vite + Supabase nao autoriza migracao de backend.
- **Autenticacao e banco:** planejados; nao implementados. As estimativas
  historicas que citam Supabase sao cenarios condicionais.
- **Hospedagem:** GitHub Pages autorizado em 24/09/2026 para a demonstracao
  publica. Sem integracoes operacionais; Integra e referencia visual/funcional.
- **Pendencia de marca:** a assinatura das mensagens do Concordia
  ("BRD Pactum" vs "BRD Concordia") segue por confirmar e afeta apenas texto de
  template, nao arquitetura.

## 4. Estimativa de Esforco Tecnico

Esforco em **semanas-dev** (uma semana-dev = uma pessoa trabalhando uma semana).
Faixas cobrem do enxuto (reuso de componentes, acabamento simples) ao completo
(validacoes, estados de erro, acabamento visual maior).
Valores mantidos da analise historica; nao foram recalculados com o progresso
posterior. A linha Supabase descreve uma hipotese, nao a implementacao atual.

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
| **Total aritmetico das faixas historicas** | | **28 - 43** |

Observacoes:
- A **fundacao** deve vir primeiro; todos os modulos dependem dela.
- **Debitos/acordos + financeiro** sao o nucleo de valor e concentram a maior
  complexidade de regras (encargos, saldos, parcelas).
- A **IA Concordia** tem a maior incerteza: alem do esforco de integracao, tem
  custo recorrente por uso (secao 5) e depende da qualidade dos documentos
  reais para calibrar extracao/resumo.

## 5. Escopo de Custos

O levantamento historico considerou desenvolvimento, infraestrutura e uso de
IA. O peso relativo depende das premissas de operacao ainda nao medidas.

### 5.1 Custo de desenvolvimento (principal)

Custo = (semanas-dev da secao 4) x (valor-hora x horas/semana).
O **valor-hora nao e arbitrado aqui** (a confirmar com os socios). Estrutura de
calculo para quando o valor for definido:

- Cenario **MVP** (fundacao + cadastros + debitos/acordos + financeiro basico +
  agenda + dashboard minimo): ~13 a 20 semanas-dev.
- Cenario **Completo v1** (todos os modulos, exceto refino profundo de IA):
  ~22 a 34 semanas-dev.
- Cenario **Completo + IA madura:** ~26 a 40 semanas-dev.

Esses tres cenarios tambem sao historicos e nao foram reestimados. A faixa do
ultimo nao coincide com a soma da tabela; nao usa-la como compromisso de entrega.

### 5.2 Custo de infraestrutura recorrente

- **Banco/autenticacao futuros:** fornecedor, plano, limites, backups e custo
  devem ser cotados quando houver requisitos. Supabase nao esta contratado por
  esta demonstracao; as referencias anteriores a planos gratuitos/pagos nao
  sao precos ou limites atuais verificados.
- **Hospedagem atual:** GitHub Pages publica somente `public/`, com dados
  ficticios. Nao ha necessidade comprovada de outro provedor nesta etapa.
- **Dominio e transporte de mensagens:** custos ainda nao cotados. A Issue #14
  ja cita e-mail, SMS, WhatsApp e telegrama; falta definir a implementacao e
  operacao desses canais, sem autorizar envios automaticos.

### 5.3 Custo variavel de IA (Concordia)

- Cobrado **por uso** (por documento lido / por geracao de texto). Escala com o
  volume de casos processados, nao com o numero de usuarios.
- E o item de maior risco de custo recorrente; recomenda-se **limite de uso** e
  medicao desde o piloto para projetar o gasto mensal antes de liberar em larga
  escala.

## 6. Viabilidade Tecnica

**Conclusao atual: o scaffold e a demonstracao sao executaveis; a viabilidade
do sistema completo continua condicionada as premissas de produto e operacao.**

- A stack atual entrega consulta demonstrativa e testes de dominio sem
  dependencias externas. Autenticacao, persistencia e multiusuario exigem uma
  decisao futura proporcional; nao se conclui que uma stack hipotetica cobre
  todo o escopo sem validar seus requisitos.
- Riscos tecnicos concentram-se em **regras financeiras** (atualizacao
  monetaria, encargos, saldos, parcelas) e na **IA** (qualidade de extracao).
  Ambos sao contornaveis: as regras financeiras sao deterministicas e testaveis;
  a IA pode comecar como apoio (sugestao revisada por humano) antes de qualquer
  automacao critica.
- **Quando revisitar a stack:** antes de implementar persistencia, autenticacao
  ou integracoes reais, comparar alternativas e registrar as decisoes conforme
  `PROJECT_CONTEXT.md`. Nenhum backend e introduzido nesta auditoria.

## 7. Viabilidade Comercial / Mercado

**Hipotese historica: favoravel, sujeita a validacao do uso interno.**

- **Publico e dor claros:** advogados e equipe interna do BRD que hoje lidam com
  cobranca/recuperacao. O produto substitui controle disperso (planilhas,
  documentos soltos) por um fluxo unico. O primeiro "cliente" e o proprio BRD,
  o que reduz risco de adocao e da retorno rapido.
- **Diferencial:** a IA Concordia (extracao de dados de documentos, resumo de
  casos, sugestao de mensagens) e o que distingue de um CRM/cobranca generico.
- **Caminho de mercado:** provado o ganho interno, o mesmo produto pode ser
  oferecido a outros escritorios/credores. SaaS multiusuario nao e capacidade
  atual; depende de validacao e decisao posterior.
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

1. **Preservar** o scaffold e a demonstracao existentes; nao interpretar esta
   analise historica como aprovacao de infraestrutura futura.
2. **Entregar por fases**, comecando pelo MVP (fundacao, cadastros,
   debitos/acordos, financeiro basico, agenda, dashboard minimo) — nucleo de
   valor com menor incerteza.
3. **Adiar a IA Concordia** para uma fase seguinte, com piloto medido de custo
   antes de liberacao ampla.
4. **Definir com os socios**, para fechar o cronograma e o custo final (nao sao
   bloqueios para esta analise, mas sao para o planejamento executivo):
   - prazo esperado e recursos dedicados;
   - orcamento maximo / valor-hora praticado;
   - operacao e fornecedores dos canais ja citados na Issue #14, que afetam
     custos; a geracao de rascunhos nao autoriza envio externo;
   - assinatura correta das mensagens do Concordia.

## 10. Proximos Passos

- Registrar esta recomendacao (este documento) como fonte versionada.
- Levar ao ciclo dos socios as definicoes da secao 9.4 para fechar cronograma e
  custo.
- Continuar por lotes verificaveis, confrontando as pendencias com codigo e
  evidencias atuais. A interface e as politicas ja existem; o antigo bloqueio
  por ausencia total de app nao descreve mais o projeto.
- Financeiro: a ultima resposta dos socios na Issue #17 torna os campos de
  cadastro opcionais; aprovacao do pagamento e comprovantes condicionais
  permanecem regras de operacao. Indices/taxas e datas especificas de atualizacao
  ainda precisam de detalhamento para automatizar encargos.
- Judicial: campos opcionais e quatro tipos de acao ja estao implementados.
  O impacto da suspensao em calculos/relatorios segue sem especificacao na
  Issue #3; nao introduzir efeito financeiro ou ajuizamento automatico.
