# Auditoria da primeira interface

## Retomada — 09/10/2026

A auditoria confrontou as pendências históricas com a implementação atual.
O problema da origem 4173, o favicon próprio do Concordia, os estados de detalhe
e o reset de Todos os prazos já estavam corrigidos. Os dois últimos agora têm
evidência de navegador, assim como filtros combinados, CSV, teclado e foco.
O aplicativo continua uma demonstração fictícia e não possui login.

| Impacto | Achado atual | Estado |
| --- | --- | --- |
| P1 | Página móvel excedia a viewport por um rótulo oculto da tabela | Corrigido com posicionamento relativo no contêiner; quatro vistas/detalhes aprovados entre 320 e 1440 px |
| P2 | Botão de exportação transbordava em Acordos com texto a 200% | Corrigido com quebra do cabeçalho e largura preservada do botão |
| P2 | Anúncio acessível contava débitos na vista de acordos/prazos | Corrigido; anúncio acompanha contagem e período exibidos |
| P2 | Evidência de interação I01–I04 ausente | Resolvido por 12 testes Playwright; resultados separados em `qa-interface.md` |
| P2 | Zoom nativo e leitores de tela | Pendente; fonte raiz ampliada e região viva testada não substituem essas avaliações |
| P3 | Variante menor do logotipo institucional | Adiada; ativo original preservado |

Não foi necessário redesenhar a identidade ou trocar a stack. A confirmação
visual mostrou a hierarquia preservada no desktop, reflow dos controles no
celular e exportação íntegra com texto ampliado. A tabela continua rolável
horizontalmente, inclusive pelo teclado, sem ampliar a largura da página.

O contexto Impeccable foi carregado uma vez; o detector foi executado uma vez
nesta retomada sobre HTML/CSS/JS e não emitiu achados. Isso não certifica
acessibilidade. Foram capturadas referências antes e uma rodada de confirmação
depois do lote; arquivos locais em `.tmp/interaction-audit/`.
Modelo, HTTP, navegador e limites estão em `docs/qa-interface.md`.

Para o próximo lote, priorizar avaliação assistiva e zoom nativo; a variante do
logo tem impacto menor. Decisões de produto financeiro e suspensão judicial
permanecem em `docs/viabilidade.md`, sem bloquear estas correções da demonstração.

## Histórico da primeira entrega

Data: 19/09/2026. Escopo: demonstracao local do BRD Concordia.

## Ponto de partida

A inspecao inicial encontrou apenas politicas de dominio, documentacao e testes. Nao havia HTML, CSS, tela ou comando de servidor nas branches disponiveis localmente. Portanto, nao existe uma interface anterior a pontuar ou um comparativo visual antes/depois.

O usuario confirmou a criacao da primeira interface, escolheu construcao direta em codigo e indicou o BRD Assistant como referencia visual.

Antes da entrega, o checkout foi sincronizado com origin/develop. Essa atualizacao trouxe politicas, testes e um guia de marca anterior, sem frontend. O trabalho remoto foi preservado integralmente. A demonstracao segue a referencia Assistant explicitamente escolhida nesta sessao; o guia e os SVGs anteriores continuam versionados.

## Direcao e melhorias aplicadas

- Identidade BRD: logo institucional, DM Sans, fundo escuro e violeta. O CSS atual do Assistant prevalece sobre a referencia antiga a Gupter.
- Navegacao orientada a tarefas: visao geral, debitos, acordos e prazos.
- Filtros compartilhados e detalhes vinculados para reduzir a troca de contexto durante a consulta.
- Estados de atraso, vencimento e pagamento descritos em texto, sem depender apenas da cor.
- Dados ficticios e data-base fixa explicitados, incluindo o limite de consulta sem persistencia.
- Fontes locais e ausencia de dependencias, requisicoes externas ou build na demonstracao.
- Separacao entre frontend demonstrativo e politicas de dominio existentes.

## Evidencia e limites

A verificacao automatizada e estatica e prioritaria conforme AGENTS.md. Nao foi aberto Browser em localhost, pois o pedido foi iniciar o servidor para avaliacao do usuario. Sem capturas renderizadas, nao se declara conformidade WCAG integral, responsividade validada em dispositivo real nem aprovacao visual definitiva.

A identidade indicada pelo usuario substituiu a direcao provisoria antes da conclusao da interface. Nao foi realizada uma escolha de identidade por imagens: o usuario escolheu code-first e forneceu a referencia BRD Assistant.

## Achados tratados

| Prioridade | Achado | Tratamento |
| --- | --- | --- |
| P0 | Template do detalhe impedia o carregamento do JavaScript | Fechamento corrigido; sintaxe validada pelo Node |
| P1 | Bordas de campos com contraste de 2,80:1 | Token ajustado; contraste calculado passou a 3,67:1 |
| P2 | Metadados e estados em 11px | Oito declaracoes elevadas a 12px, incluindo sobrescritas moveis |
| P2 | Estado expandido do gatilho anterior permanecia ao trocar o detalhe | Estado anterior limpo antes da nova abertura |
| P2 | Link Todos os prazos herdava um periodo selecionado anteriormente | Acao agora redefine periodo para todos antes de navegar |
| P2 | Risco de conteudo inacessivel em janelas baixas/estreitas | Sidebar rolavel, navegacao com quebra e resumo em coluna ate 360px |

O detector Impeccable rodou uma vez sobre HTML/CSS/JS e retornou quatro avisos duplicados de `tiny-text`. A inspecao identificou oito declaracoes de 11px no CSS, todas corrigidas. A verificacao posterior inspecionou o codigo, sem repetir o detector.

## Avaliacao estatica apos ajustes

| Dimensao | Evidencia | Limite |
| --- | --- | --- |
| Acessibilidade | Labels, skip link, foco, landmarks, tabelas focaveis, estados textuais; contraste das combinacoes principais acima de 8:1 | Leitor de tela e navegacao real ainda nao exercitados |
| Performance | Modulos pequenos, fontes locais, sem bibliotecas externas | Logo original de 10869 x 2946 px preservado; uma versao reduzida seria melhoria futura |
| Tema | Tokens escuros e violeta, DM Sans conforme Assistant | Algumas variacoes de cor permanecem literais no CSS; tema claro fora do escopo |
| Responsividade | Breakpoints e reflow explicitamente implementados | Sem capturas de 390/1440px nem teste real de zoom |
| Integridade | Filtros, dados vinculados e avisos de demonstracao presentes | Nao equivale a sistema de producao |

Achado residual P3: o logotipo original poderia ter uma variante menor para reduzir o custo de decodificacao. Foi preservado sem editar a marca. Nao se atribui uma nota global de conformidade com base apenas no codigo.

## Etapas de revisao

Os papeis senior-dev, ui-ux-expert, impeccable finish reviewer, code-reviewer, qa-senior, qa-automate e documenter sao executados por subagentes genericos simulando essas funcoes, pois nao ha agentes formais registrados nesta sessao. A documentacao do sistema visual e extraida da implementacao final.

## Validacao final

`test.cmd`: 189 testes aprovados, zero falhas ou testes ignorados, incluindo 20 novos testes da demonstracao e a regressao completa do dominio atualizado. Os testes exercitam modelos puros, dados relacionados, filtros, CSV, sintaxe JavaScript e servidor HTTP real em porta efemera. `git diff --check` sem erros.

O servidor de avaliacao respondeu HTTP 200 para HTML, CSS, modulos, fonte e logotipo. A porta padrao atual e `127.0.0.1:4317`. Os fluxos de interacao real e a apresentacao visual permanecem para avaliacao manual, discriminados em `docs/qa-interface.md`. Resultado da revisao: liberado para avaliar a demonstracao, sem declarar homologacao visual ou uso em producao.

## Correcao do endereco de avaliacao

O usuario mostrou o login do BRD Assistant em `127.0.0.1:4173/login`. Na mesma origem, requisicoes HTTP diretas retornaram o HTML do Concordia em `/` e 404 em `/login`; o processo ativo era o servidor desta demonstracao. O Assistant configura VitePWA, tornando um service worker previamente registrado a causa provavel, ainda nao confirmada por inspecao do armazenamento do navegador. O Concordia passou a usar a porta propria 4317 para separar as origens. Nenhum cache, dado ou processo de outro aplicativo foi removido. O usuario confirmou que o novo endereco exibe o Concordia. Essa confirmacao encerra o problema de acesso; nao equivale a homologacao visual completa e os testes HTTP nao reproduzem a interceptacao por service worker.
