---
name: BRD Concordia
description: Identidade BRD escura para acompanhamento jurídico.
colors:
  surface: "#0b0911"
  panel: "#110e1a"
  raised: "#181320"
  hover: "#211a2e"
  line: "#30283e"
  line-strong: "#776b86"
  ink: "#f5f2fa"
  muted: "#b8b0c7"
  brand: "#964afb"
  brand-text: "#c9a5fe"
  danger: "#fca5a5"
  warning: "#fde68a"
  success: "#a7f3d0"
typography:
  headline:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  badge: "4px"
  control: "6px"
  navigation: "7px"
  detail: "8px"
spacing:
  compact: "8px"
  control: "12px"
  regular: "16px"
  section: "24px"
  workspace: "40px"
components:
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-text:
    backgroundColor: transparent
    textColor: "{colors.brand-text}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation:
    textColor: "{colors.muted}"
    rounded: "{rounded.navigation}"
    padding: "10px 16px"
  badge:
    rounded: "{rounded.badge}"
    padding: "3px 8px"
  detail:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.detail}"
    padding: "26px"
---

# Design System: BRD Concordia

## Overview

**Creative North Star: "Identidade BRD"**

Superfícies escuras com subtom violeta, logotipo institucional e DM Sans preservam a identidade do BRD Assistant escolhida pelo usuário. A interface usa hierarquia tipográfica, divisores e ações discretas para organizar informação jurídica densa.

Este registro descreve a implementação em `public/styles.css` e `public/index.html`, extraída estaticamente em 19/09/2026. Não representa validação visual em navegador. Medidas no frontmatter são extrações do CSS; não existe um gerador de tokens conectado ao código.

Para esta demonstração, a escolha explícita da identidade atual do Assistant prevalece sobre a referência anterior navy/serifada em `docs/identidade-visual.md`. O guia anterior e os SVGs de `assets/brand` permanecem preservados; este documento não redefine suas aplicações de marca. As quatro vistas implementadas são um recorte para avaliação, não substituem a navegação canônica futura de oito abas registrada no contexto do projeto.

**Key Characteristics:**

- Superfícies escuras com separação tonal e bordas.
- DM Sans local, com títulos em negrito.
- Ações textuais violetas e estados acompanhados de rótulos.
- Tabelas legíveis, números tabulares e detalhes no fluxo da página.

## Colors

A paleta combina neutros violetas escuros, texto claro e violeta BRD para orientação e ações.

### Primary

- **Violeta BRD** (`brand`): referência institucional declarada no CSS; atualmente não aplicada por seletores.
- **Violeta de leitura** (`brand-text`): ações, códigos de registro, ícones ativos, cursor de texto e foco visível.

### Neutral

- **Escuro profundo** (`surface`): fundo principal.
- **Painel violeta** (`panel`): navegação, cabeçalhos de tabela e detalhe.
- **Superfície elevada** (`raised`) e **realce tonal** (`hover`): campos e resposta à interação.
- **Divisor discreto** (`line`) e **contorno de controle** (`line-strong`): separação estrutural e limites de campos/botões.
- **Texto claro** (`ink`) e **texto secundário** (`muted`): conteúdo principal e metadados.

### Status

`danger`, `warning` e `success` distinguem atraso, atenção e conclusão. Os badges combinam essas cores com fundos próprios e texto explícito. Cores pontuais de estados estão no CSS e nos exemplos do sidecar; não constituem escalas tonais adicionais.

## Typography

**Display Font:** DM Sans, system-ui, sans-serif.

**Body Font:** DM Sans, system-ui, sans-serif.

Arquivos locais oferecem os pesos regular, médio e negrito (400, 500 e 700). O CSS desativa síntese tipográfica. A base é 16px; tabela e conteúdo compacto usam o papel `body`, enquanto descrições de página e dados de detalhe usam 0.875rem. Metadados permanecem com pelo menos 0.75rem.

O papel `headline` corresponde ao título da página; `title`, às seções. O título de detalhe usa 1.5rem. Valores financeiros usam números tabulares, com 1.375rem no resumo. Descrições de página têm largura máxima de 65ch; notas chegam a 75ch.

## Layout

O shell desktop usa navegação de 228px e conteúdo flexível. O conteúdo tem largura máxima de 1496px e padding lateral de 40px. Resumos usam quatro colunas; filtros seguem uma linha com quebra responsiva. Tabelas têm rolagem horizontal própria; detalhes aparecem abaixo do conteúdo com dados em duas colunas.

Breakpoints reais, reproduzidos no sidecar:

- A partir de 1600px: conteúdo com padding superior de 46px e barra superior com padding lateral de 48px.
- Até 1199px: navegação de 196px, conteúdo com padding lateral de 25px e resumo em duas colunas; tabelas têm mínimo de 700px, parcelas de 490px.
- Até 850px: navegação horizontal no topo, filtros quebram linha e título principal passa a 1.75rem.
- Até 560px: conteúdo com padding lateral de 18px, filtros empilhados, campos com fonte de 1rem e detalhe em uma coluna; ícones de navegação ficam ocultos.
- Até 360px: resumo em uma coluna e marca/data podem quebrar linha.

## Elevation & Depth

A implementação não usa sombras. A profundidade resulta de fundos tonais e bordas: campos usam `raised`; navegação e detalhe usam `panel`. O detalhe tem contorno mais forte, sem sobrepor a tabela ou criar um modal.

## Shapes

Cantos levemente arredondados distinguem badges, controles, navegação e detalhe conforme `rounded`. Tabelas e faixas de resumo usam divisores retos. Ícones SVG têm traço simples, sem preenchimento, geralmente em 20px.

## Components

### Buttons

Botões de contorno e texto têm altura mínima de 44px. O hover usa realce tonal; o estado pressionado dos botões usa fundo violeta mais fechado. Desabilitados reduzem a opacidade e mudam o cursor. Ações de linha são textuais e ganham sublinhado no hover.

### Inputs / Fields

Campos têm labels visíveis, fundo elevado e contorno forte. Busca inclui ícone à esquerda. Todos os controles usam foco visível de 2px em `brand-text`, afastado 4px do elemento.

### Navigation

Links têm altura mínima de 48px, peso médio e ícone SVG. A seleção é indicada por `aria-current`, texto claro e fundo violeta. A navegação horizontal mantém os quatro destinos na implementação estreita.

### Chips

Badges de estado têm altura mínima de 26px e texto explícito. São indicadores, não controles interativos.

### Cards / Containers

O painel de detalhe usa borda forte e padding de 26px, reduzido para 19px 15px até 560px. O cabeçalho permite fechar o detalhe; seu conteúdo permanece no fluxo de leitura. Tabelas e resumo usam faixas com divisores, sem cards independentes para cada valor.

Transições de cor, borda e fundo duram 160ms com `ease-out`, somente quando `prefers-reduced-motion: no-preference` permite. Não há animações de entrada.

## Do's and Don'ts

### Do:

- **Do** preservar o logotipo institucional e as fontes locais DM Sans.
- **Do** manter foco visível, labels de campos e texto nos estados.
- **Do** manter valores tabulares e rolagem horizontal restrita às tabelas.

### Don't:

- **Don't** substituir DM Sans dos títulos por Gupter com base no handoff antigo.
- **Don't** comunicar o estado de um registro apenas pela cor.
- **Don't** remover a identificação de dados fictícios desta demonstração.
