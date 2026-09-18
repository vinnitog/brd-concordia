# Identidade Visual - BRD Concordia

Origem: Trello card https://trello.com/c/FTaDH1Bk (Issue #13).
Documento de referencia versionado da marca BRD Concordia.

> Este documento registra a identidade visual aprovada pelos socios e o inventario
> de assets. Ele nao introduz runtime, framework ou servico externo: os assets sao
> arquivos SVG estaticos, coerentes com o scaffold `Node.js + biblioteca padrao`.

## 1. Decisao dos Socios

A triagem apontou tres pendencias de produto; os socios (Luis Bernardo Junior)
responderam no card:

| Pergunta | Decisao |
|---|---|
| Logo proprio ou variacao da marca BRD? | **Variacao da marca BRD** |
| Caracteristica visual principal que distingue o Concordia? | **Tipografia (em italico)** |
| Formatos e tamanhos de entrega? | **Todos** (web, app, impressao, favicon) |

Consequencias diretas dessas decisoes:

- A marca **preserva a assinatura BRD** (peso reto) e adiciona "Concordia".
- O **elemento distintivo e tipografico**: "Concordia" e sempre grafado em
  **italico**. A distincao nao depende de cor nova nem de icone novo.
- A entrega cobre **todos os formatos** a partir de um mestre vetorial (SVG), que
  escala sem perda para web, app, impressao e favicon.

## 2. Assinatura (Logo)

Composicao horizontal (lockup principal):

```
[badge C] BRD Concordia
```

- **BRD**: reto (upright), peso bold, preservando a marca BRD.
- **Concordia**: **italico**, peso regular - assinatura visual do produto.
- **Badge**: selo quadrado com "C" italico, derivado da mesma marca; serve de
  brandmark isolado para favicon e icone de app.

Variacoes entregues:

| Uso | Arquivo |
|---|---|
| Principal (cor, fundos claros) | `assets/brand/logo-concordia.svg` |
| Monocromatica (impressao 1 cor, carimbo) | `assets/brand/logo-concordia-mono.svg` |
| Reversa (fundos escuros, header) | `assets/brand/logo-concordia-reverse.svg` |
| Favicon / icone de app (quadrado) | `assets/brand/favicon.svg` |

## 3. Tipografia

- Familia base: **serifada** (`Georgia, 'Times New Roman', serif`), que confere
  seriedade juridica e faz o italico ler com elegancia.
- **Concordia sempre em italico** (`font-style: italic`) - regra invariavel da
  marca.
- "BRD" sempre reto e bold.

> Nota de preservacao: quando o arquivo oficial da marca BRD estiver disponivel, a
> familia tipografica deve ser reconciliada com a fonte original do BRD, mantendo a
> regra do italico para "Concordia". A troca e reversivel (afeta apenas os SVGs).

## 4. Cores

Coerente com a decisao "variacao da marca BRD", a cor e unica e sobria; a distincao
fica por conta do italico, nao de uma cor nova.

```text
--brd-navy:   #0B2A4A   /* primaria da marca (texto e badge) */
--brd-white:  #FFFFFF   /* reverso e interior do badge */
```

- Contraste navy `#0B2A4A` sobre branco: ~13:1 (WCAG AAA).
- Contraste branco sobre navy (reversa/favicon): ~13:1 (WCAG AAA).

## 5. Formatos e Tamanhos ("Todos")

O SVG e o **mestre**; dele derivam-se os formatos raster quando necessario, sem
perda de qualidade.

| Contexto | Formato de entrega | Tamanhos de referencia |
|---|---|---|
| Web (header, rodape) | SVG (lockup) | responsivo; altura minima 24px |
| App (splash, sobre) | SVG / PNG | 1x, 2x, 3x |
| Impressao (papelaria, PDF) | SVG / PDF vetorial | qualquer escala |
| Favicon | SVG + PNG | 16, 32, 48px |
| Icone de app | PNG a partir do `favicon.svg` | 180 (Apple), 192, 512px |

Como gerar rasters a partir do mestre (fora do runtime da aplicacao, sem adicionar
dependencia ao projeto): usar qualquer conversor SVG->PNG/ICO (ex.: ferramenta de
design ou linha de comando pontual). Os PNG/ICO nao sao versionados agora para nao
duplicar fonte de verdade; o SVG e a origem canonica.

## 6. Area de Protecao e Uso Minimo

- **Area de respiro**: manter, em volta do lockup, uma margem >= altura do badge.
- **Tamanho minimo do lockup**: 24px de altura (web) para preservar legibilidade do
  italico.
- **Nao** condensar, inclinar manualmente, recolorir fora da paleta, nem remover o
  italico de "Concordia".

## 7. Inventario e Rastreabilidade

Os arquivos vivem em `assets/brand/` (ver `assets/brand/README.md`). A validacao
automatizada em `unit/identidade-visual.test.js` garante que os assets existem, que
o italico de "Concordia" esta presente e que o favicon e quadrado.
