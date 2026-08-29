# BRD Concordia

O BRD Concordia organiza a recuperacao juridica de creditos, desde a obrigacao original ate acordos, pagamentos, prazos, documentos e eventual tratamento judicial.

## Pessoas E Responsabilidade

**Parte**:
Pessoa fisica ou juridica que participa de uma relacao de cobranca. Uma Parte assume um papel conforme o Debito, sem duplicacao cadastral.
_Avoid_: Cliente, cadastro, conta

**Credor**:
Papel da Parte que possui o credito em um Debito.
_Avoid_: Cliente

**Devedor**:
Papel da Parte responsavel pela obrigacao em um Debito.
_Avoid_: Inadimplente

**UsuarioBRD**:
Pessoa interna autorizada a operar o BRD Concordia e assumir responsabilidade por registros e conferencias. Nao e uma Parte da relacao juridica.
_Avoid_: Parte, cliente, operador externo

## Cobranca E Negociacao

**Debito**:
Obrigacao de uma Parte devedora perante uma Parte credora, com origem, valor e ciclo de cobranca proprios.
_Avoid_: Caso, acordo, parcela

**Acordo**:
Condicoes negociadas para a regularizacao de um unico Debito. Um Debito preserva seus acordos sucessivos e possui no maximo um Acordo ativo.
_Avoid_: Debito, contrato

**Parcela**:
Fracao exigivel de um Acordo, com valor, vencimento e ciclo de pagamento proprios.
_Avoid_: Debito, pagamento

**Pagamento**:
Valor recebido para satisfazer total ou parcialmente uma Parcela ou um Debito.
_Avoid_: Parcela, quitacao

**ConferenciaDePagamento**:
Registro dos UsuariosBRD responsaveis pelo lancamento e pela verificacao posterior de um Pagamento. Os dois papeis podem ser exercidos pela mesma pessoa enquanto nao houver politica de segregacao.
_Avoid_: Aprovacao, pagamento

## Prazos E Processo

**Prazo**:
Compromisso com data de vencimento que pode nascer de Parcela, Acordo, ProcessoJudicial ou registro manual.
_Avoid_: Agenda, lembrete

**OrigemDoPrazo**:
Vinculo que explica de onde um Prazo surgiu. Prazos manuais identificam UsuarioBRD responsavel e justificativa.
_Avoid_: Tipo de prazo

**ProcessoJudicial**:
Registro do tratamento judicial relacionado a um Debito, com ciclo independente dos ciclos de Debito, Acordo e Parcela.
_Avoid_: Debito judicial, caso

## Calculo E Documentos

**MemoriaDeCalculo**:
Registro imutavel dos valores, datas, encargos e parametros usados em uma atualizacao monetaria reproduzivel.
_Avoid_: Valor atualizado

**ModeloDeDocumento**:
Conteudo reutilizavel e versionado que orienta a criacao de documentos juridicos.
_Avoid_: Documento

**DocumentoGerado**:
Conteudo emitido a partir de um ModeloDeDocumento ou elaboracao especifica, preservado com sua versao e vinculo juridico.
_Avoid_: Modelo, arquivo editavel
