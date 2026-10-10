# Logo responsivo — etapa final de dimensionamento

A matriz institucional e o PNG lossless do lote anterior continuam intactos.
Esta etapa redimensiona somente derivados de entrega, sem redesenho, recorte,
recoloração ou fundo opaco. Resize altera pixels: não é uma otimização lossless.

| Artefato | Dimensões | PNG bytes | Superfície RGBA nominal |
| --- | ---: | ---: | ---: |
| Lote anterior | 10869×2946 | 367577 | 128080296 bytes |
| DPR 1 | 440×119 | 17558 | 209440 bytes |
| DPR 2 ou superior | 880×239 | 37117 | 841280 bytes |

`srcset` usa densidades 1x/2x. Cada derivado continua excedendo em quatro/oito
vezes a largura desktop de 110px; mobile conserva 81×22. Apenas o candidato
selecionado é solicitado. As superfícies nominais diminuem 99,84%/99,34%; isso
não é medição de memória total, decode em milissegundos ou Web Vitals. Bytes
caem 95,22%/89,90% frente ao PNG servido anteriormente. O aspect ratio usa
arredondamento de um pixel na altura, sem mudança de caixa CSS ou recorte.

Tooling opcional `scripts/resize-logo.py`, Pillow 12.3.0 já fixado para o lote
anterior. `--check` não grava: confere hash da matriz, reencodificação determinista,
hashes dos derivados, dimensões e RGBA/alpha. Node confere IHDR, cor RGBA e os
quatro hashes; os originais permanecem publicados para referência.

## Fidelidade e QA

Comparação visual desktop1440/DPR1 e mobile390/DPR2 está em
`qa-assets/logo-responsive/`: `desktop-before.png`, `desktop-after.png`,
`mobile-before.png`, `mobile-after.png`. Marca, espaço, transparência e leitura
se preservam; os derivados ficam mais nítidos que a redução extrema no Chrome.
Nas capturas RGB, RMS por canal ficou entre 9,24 e 11,61/255, média entre 3,39
e 4,37/255; máximos de borda até 103/255. Não se afirma igualdade de pixels.
Houve uma rodada de comparação das duas classes e uma confirmação final, sem
refinamentos visuais adicionais.

O teste real também compõe original/derivado sobre o mesmo fundo para comparar
canvas em escalas1/2/4 (RMS<20 e média<8 por canal), evitando comparar RGB oculto
de pixels transparentes. Essa tolerância é um guarda de regressão, não laudo
subjetivo de qualidade. Caixas CSS, alt, link, foco e Enter se mantêm; recursos
reais confirmam URL/hash/bytes selecionados. 200/200 Node, 17/17 Edge,
`resize-logo.py --check`, verify49 e diffcheck aprovados. Dados são fictícios,
servidor loopback; nenhuma autenticação ou infraestrutura de produto foi criada.

## Pendências externas

As jornadas existentes cobrem quatro vistas, reflow320px, texto200% simulado,
teclado, anúncios e fontes/fallback. Isso não homologa leitor de tela humano,
zoom nativo ou dispositivos físicos; permanecem avaliações externas, sem
defeito demonstrado a corrigir neste lote. Após o deploy, conferir as novas
URLs e bytes servidos considerando cache Pages600s; este commit não faz deploy.
