// Modulo financeiro do Debito (Issue #17).
// Codifica as decisoes dos socios registradas no card de origem:
// - obrigatorios: valor original, valor atualizado e data do vencimento original;
// - formas de pagamento aceitas: boleto, pix, cartao, transferencia, cheque, permuta, dinheiro;
// - status de parcela: a-vencer, paga, vencida, cancelada;
// - saldo devedor calculado automaticamente;
// - comprovante obrigatorio ao marcar parcela como paga por transferencia, pix ou boleto;
// - marcar parcela como paga exige aprovacao;
// - pagamento parcial de parcela e permitido;
// - valores perdoado e remido sao mutuamente exclusivos no mesmo debito.

const FORMAS_PAGAMENTO = new Set([
  "boleto",
  "pix",
  "cartao",
  "transferencia",
  "cheque",
  "permuta",
  "dinheiro",
]);

const FORMAS_COM_COMPROVANTE_OBRIGATORIO = new Set([
  "transferencia",
  "pix",
  "boleto",
]);

const STATUS_PARCELA = new Set(["a-vencer", "paga", "vencida", "cancelada"]);

function temTexto(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function informado(valor) {
  return valor !== undefined && valor !== null;
}

function valorMonetarioValido(valor) {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
}

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function dataCalendarioValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function validarCadastroFinanceiro({
  valorOriginal,
  valorAtualizado,
  dataVencimentoOriginal,
  valorPerdoado,
  valorRemido,
} = {}) {
  const erros = [];

  if (!informado(valorOriginal)) {
    erros.push("valor-original-obrigatorio");
  } else if (!valorMonetarioValido(valorOriginal)) {
    erros.push("valor-original-invalido");
  }

  if (!informado(valorAtualizado)) {
    erros.push("valor-atualizado-obrigatorio");
  } else if (!valorMonetarioValido(valorAtualizado)) {
    erros.push("valor-atualizado-invalido");
  }

  if (!temTexto(dataVencimentoOriginal)) {
    erros.push("data-vencimento-original-obrigatoria");
  } else if (!dataCalendarioValida(dataVencimentoOriginal)) {
    erros.push("data-vencimento-original-invalida");
  }

  if (informado(valorPerdoado) && !valorMonetarioValido(valorPerdoado)) {
    erros.push("valor-perdoado-invalido");
  }

  if (informado(valorRemido) && !valorMonetarioValido(valorRemido)) {
    erros.push("valor-remido-invalido");
  }

  const temPerdoado = valorMonetarioValido(valorPerdoado) && valorPerdoado > 0;
  const temRemido = valorMonetarioValido(valorRemido) && valorRemido > 0;
  if (temPerdoado && temRemido) {
    erros.push("perdao-e-remicao-mutuamente-exclusivos");
  }

  return erros.length === 0 ? { valido: true } : { valido: false, erros };
}

function validarFormaPagamento(forma) {
  return FORMAS_PAGAMENTO.has(forma)
    ? { valida: true }
    : { valida: false, erros: ["forma-pagamento-nao-suportada"] };
}

function validarStatusParcela(status) {
  return STATUS_PARCELA.has(status)
    ? { valido: true }
    : { valido: false, erros: ["status-parcela-nao-suportado"] };
}

// Saldo devedor sempre calculado (nunca ajustado manualmente).
// saldo = valor atualizado + encargos - reducoes - total pago, nunca negativo.
function calcularSaldoDevedor({
  valorAtualizado = 0,
  juros = 0,
  multa = 0,
  honorarios = 0,
  custas = 0,
  despesasExtrajudiciais = 0,
  desconto = 0,
  valorPerdoado = 0,
  valorRemido = 0,
  pagamentos = [],
} = {}) {
  const encargos =
    juros + multa + honorarios + custas + despesasExtrajudiciais;
  const reducoes = desconto + valorPerdoado + valorRemido;
  const totalPago = pagamentos.reduce(
    (soma, pagamento) => soma + (pagamento?.valor ?? 0),
    0,
  );

  return Math.max(0, arredondar(valorAtualizado + encargos - reducoes - totalPago));
}

// Marcar parcela como paga exige aprovacao previa e, para transferencia,
// pix ou boleto, comprovante anexado.
function validarMarcacaoPagamento({ forma, aprovadoPor, comprovante } = {}) {
  const erros = [];

  if (!FORMAS_PAGAMENTO.has(forma)) {
    erros.push("forma-pagamento-nao-suportada");
  }

  if (!temTexto(aprovadoPor)) {
    erros.push("aprovacao-obrigatoria");
  }

  if (FORMAS_COM_COMPROVANTE_OBRIGATORIO.has(forma) && !temTexto(comprovante)) {
    erros.push("comprovante-obrigatorio");
  }

  return erros.length === 0 ? { valida: true } : { valida: false, erros };
}

// Pagamento pode ser parcial: aceita valor menor ou igual ao saldo da parcela.
function validarPagamento({ valor, saldoParcela } = {}) {
  const erros = [];
  const valorOk = valorMonetarioValido(valor) && valor > 0;
  const saldoOk = valorMonetarioValido(saldoParcela);

  if (!valorOk) {
    erros.push("valor-pagamento-invalido");
  }

  if (!saldoOk) {
    erros.push("saldo-parcela-invalido");
  }

  if (valorOk && saldoOk && valor > saldoParcela) {
    erros.push("valor-excede-saldo-da-parcela");
  }

  if (erros.length > 0) {
    return { valido: false, erros };
  }

  return { valido: true, tipo: valor < saldoParcela ? "parcial" : "integral" };
}

module.exports = {
  FORMAS_PAGAMENTO,
  STATUS_PARCELA,
  validarCadastroFinanceiro,
  validarFormaPagamento,
  validarStatusParcela,
  calcularSaldoDevedor,
  validarMarcacaoPagamento,
  validarPagamento,
};
