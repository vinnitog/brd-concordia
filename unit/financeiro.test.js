const test = require("node:test");
const assert = require("node:assert/strict");

const {
  FORMAS_PAGAMENTO,
  STATUS_PARCELA,
  validarCadastroFinanceiro,
  validarFormaPagamento,
  validarStatusParcela,
  calcularSaldoDevedor,
  validarMarcacaoPagamento,
  validarPagamento,
} = require("../src/domain/financeiro");

test("o cadastro financeiro aceita apenas os campos obrigatorios preenchidos", () => {
  assert.deepEqual(
    validarCadastroFinanceiro({
      valorOriginal: 1000,
      valorAtualizado: 1200,
      dataVencimentoOriginal: "2026-01-31",
    }),
    { valido: true },
  );
});

test("o cadastro financeiro exige valor original, atualizado e vencimento original", () => {
  assert.deepEqual(validarCadastroFinanceiro({}), {
    valido: false,
    erros: [
      "valor-original-obrigatorio",
      "valor-atualizado-obrigatorio",
      "data-vencimento-original-obrigatoria",
    ],
  });
});

test("o cadastro financeiro rejeita valores nao monetarios e data inexistente", () => {
  assert.deepEqual(
    validarCadastroFinanceiro({
      valorOriginal: -1,
      valorAtualizado: "muito",
      dataVencimentoOriginal: "2026-02-30",
    }),
    {
      valido: false,
      erros: [
        "valor-original-invalido",
        "valor-atualizado-invalido",
        "data-vencimento-original-invalida",
      ],
    },
  );
});

test("o cadastro financeiro rejeita vencimento fora do formato ISO", () => {
  assert.deepEqual(
    validarCadastroFinanceiro({
      valorOriginal: 1000,
      valorAtualizado: 1000,
      dataVencimentoOriginal: "31/01/2026",
    }),
    { valido: false, erros: ["data-vencimento-original-invalida"] },
  );
});

test("perdao e remicao nao podem coexistir no mesmo debito", () => {
  assert.deepEqual(
    validarCadastroFinanceiro({
      valorOriginal: 1000,
      valorAtualizado: 1000,
      dataVencimentoOriginal: "2026-01-31",
      valorPerdoado: 100,
      valorRemido: 100,
    }),
    { valido: false, erros: ["perdao-e-remicao-mutuamente-exclusivos"] },
  );
});

test("um debito pode ter apenas perdao ou apenas remicao", () => {
  assert.deepEqual(
    validarCadastroFinanceiro({
      valorOriginal: 1000,
      valorAtualizado: 1000,
      dataVencimentoOriginal: "2026-01-31",
      valorPerdoado: 100,
    }),
    { valido: true },
  );
  assert.deepEqual(
    validarCadastroFinanceiro({
      valorOriginal: 1000,
      valorAtualizado: 1000,
      dataVencimentoOriginal: "2026-01-31",
      valorRemido: 100,
    }),
    { valido: true },
  );
});

test("as formas de pagamento aceitas pelos socios sao aprovadas", () => {
  for (const forma of [
    "boleto",
    "pix",
    "cartao",
    "transferencia",
    "cheque",
    "permuta",
    "dinheiro",
  ]) {
    assert.deepEqual(validarFormaPagamento(forma), { valida: true }, forma);
    assert.ok(FORMAS_PAGAMENTO.has(forma));
  }
});

test("uma forma de pagamento fora do catalogo e rejeitada", () => {
  assert.deepEqual(validarFormaPagamento("bitcoin"), {
    valida: false,
    erros: ["forma-pagamento-nao-suportada"],
  });
});

test("os status de parcela definidos pelos socios sao aceitos", () => {
  for (const status of ["a-vencer", "paga", "vencida", "cancelada"]) {
    assert.deepEqual(validarStatusParcela(status), { valido: true }, status);
    assert.ok(STATUS_PARCELA.has(status));
  }
});

test("um status de parcela fora do catalogo e rejeitado", () => {
  assert.deepEqual(validarStatusParcela("atrasada"), {
    valido: false,
    erros: ["status-parcela-nao-suportado"],
  });
});

test("o saldo devedor soma encargos e desconta reducoes e pagamentos", () => {
  const saldo = calcularSaldoDevedor({
    valorAtualizado: 1000,
    juros: 50,
    multa: 20,
    honorarios: 100,
    custas: 30,
    despesasExtrajudiciais: 10,
    desconto: 60,
    valorPerdoado: 50,
    pagamentos: [{ valor: 200 }, { valor: 100 }],
  });

  assert.equal(saldo, 800);
});

test("o saldo devedor nunca fica negativo", () => {
  const saldo = calcularSaldoDevedor({
    valorAtualizado: 100,
    pagamentos: [{ valor: 250 }],
  });

  assert.equal(saldo, 0);
});

test("o saldo devedor e arredondado para duas casas", () => {
  const saldo = calcularSaldoDevedor({
    valorAtualizado: 100.1,
    juros: 0.2,
  });

  assert.equal(saldo, 100.3);
});

test("marcar parcela como paga por pix, boleto ou transferencia exige comprovante", () => {
  for (const forma of ["pix", "boleto", "transferencia"]) {
    assert.deepEqual(
      validarMarcacaoPagamento({ forma, aprovadoPor: "admin-1" }),
      { valida: false, erros: ["comprovante-obrigatorio"] },
      forma,
    );
  }
});

test("marcar parcela como paga por pix com comprovante e aprovacao e valido", () => {
  assert.deepEqual(
    validarMarcacaoPagamento({
      forma: "pix",
      aprovadoPor: "admin-1",
      comprovante: "recibo.pdf",
    }),
    { valida: true },
  );
});

test("dinheiro e cheque nao exigem comprovante, mas exigem aprovacao", () => {
  for (const forma of ["dinheiro", "cheque"]) {
    assert.deepEqual(
      validarMarcacaoPagamento({ forma, aprovadoPor: "admin-1" }),
      { valida: true },
      forma,
    );
  }
});

test("marcar parcela como paga sem aprovacao e rejeitado", () => {
  assert.deepEqual(
    validarMarcacaoPagamento({ forma: "dinheiro" }),
    { valida: false, erros: ["aprovacao-obrigatoria"] },
  );
});

test("marcar pagamento acumula forma invalida, falta de aprovacao e comprovante", () => {
  assert.deepEqual(validarMarcacaoPagamento({}), {
    valida: false,
    erros: ["forma-pagamento-nao-suportada", "aprovacao-obrigatoria"],
  });
});

test("um pagamento parcial e aceito quando o valor e menor que o saldo", () => {
  assert.deepEqual(validarPagamento({ valor: 300, saldoParcela: 500 }), {
    valido: true,
    tipo: "parcial",
  });
});

test("um pagamento que quita a parcela e classificado como integral", () => {
  assert.deepEqual(validarPagamento({ valor: 500, saldoParcela: 500 }), {
    valido: true,
    tipo: "integral",
  });
});

test("um pagamento acima do saldo da parcela e rejeitado", () => {
  assert.deepEqual(validarPagamento({ valor: 600, saldoParcela: 500 }), {
    valido: false,
    erros: ["valor-excede-saldo-da-parcela"],
  });
});

test("um pagamento com valor zero ou negativo e rejeitado", () => {
  assert.deepEqual(validarPagamento({ valor: 0, saldoParcela: 500 }), {
    valido: false,
    erros: ["valor-pagamento-invalido"],
  });
  assert.deepEqual(validarPagamento({ valor: -10, saldoParcela: 500 }), {
    valido: false,
    erros: ["valor-pagamento-invalido"],
  });
});
