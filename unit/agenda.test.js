const test = require("node:test");
const assert = require("node:assert/strict");

const { gerarParcelas, montarAgenda } = require("../src/domain/agenda");

function somarCentavos(parcelas) {
  return parcelas.reduce((total, parcela) => total + parcela.valorEmCentavos, 0);
}

test("gerar 12 parcelas de valor divisivel produz parcelas iguais que somam o total", () => {
  const resultado = gerarParcelas({
    valorTotalEmCentavos: 120000,
    quantidadeParcelas: 12,
    primeiroVencimento: "2026-01-10",
  });

  assert.equal(resultado.valido, true);
  assert.equal(resultado.parcelas.length, 12);
  assert.equal(somarCentavos(resultado.parcelas), 120000);
  assert.ok(resultado.parcelas.every((parcela) => parcela.valorEmCentavos === 10000));
});

test("gerar parcelas com resto distribui os centavos nas primeiras e soma o total", () => {
  const resultado = gerarParcelas({
    valorTotalEmCentavos: 10000,
    quantidadeParcelas: 3,
    primeiroVencimento: "2026-01-10",
  });

  assert.equal(resultado.valido, true);
  assert.deepEqual(
    resultado.parcelas.map((parcela) => parcela.valorEmCentavos),
    [3334, 3333, 3333],
  );
  assert.equal(somarCentavos(resultado.parcelas), 10000);
});

test("os vencimentos avancam de mes em mes a partir do primeiro", () => {
  const resultado = gerarParcelas({
    valorTotalEmCentavos: 30000,
    quantidadeParcelas: 3,
    primeiroVencimento: "2026-01-10",
  });

  assert.deepEqual(
    resultado.parcelas.map((parcela) => parcela.venceEm),
    ["2026-01-10", "2026-02-10", "2026-03-10"],
  );
});

test("o vencimento mensal ajusta o dia ao ultimo dia de meses mais curtos", () => {
  const resultado = gerarParcelas({
    valorTotalEmCentavos: 30000,
    quantidadeParcelas: 3,
    primeiroVencimento: "2026-01-31",
  });

  assert.deepEqual(
    resultado.parcelas.map((parcela) => parcela.venceEm),
    ["2026-01-31", "2026-02-28", "2026-03-31"],
  );
});

test("gerar parcelas rejeita valor, quantidade e vencimento invalidos", () => {
  assert.deepEqual(
    gerarParcelas({
      valorTotalEmCentavos: 0,
      quantidadeParcelas: 0,
      primeiroVencimento: "10/01/2026",
    }),
    {
      valido: false,
      erros: [
        "valor-total-invalido",
        "quantidade-parcelas-invalida",
        "primeiro-vencimento-invalido",
      ],
    },
  );
});

test("gerar parcelas rejeita valores nao inteiros", () => {
  assert.deepEqual(
    gerarParcelas({
      valorTotalEmCentavos: 100.5,
      quantidadeParcelas: 2,
      primeiroVencimento: "2026-01-10",
    }),
    { valido: false, erros: ["valor-total-invalido"] },
  );
});

const ACORDOS_EXEMPLO = [
  {
    id: "acordo-1",
    idCliente: "cliente-1",
    tipo: "extrajudicial",
    status: "ativo",
    parcelas: [
      { numero: 1, valorEmCentavos: 5000, venceEm: "2026-09-01" }, // vencida
      { numero: 2, valorEmCentavos: 5000, venceEm: "2026-09-18" }, // vence hoje
      { numero: 3, valorEmCentavos: 5000, venceEm: "2026-10-10" }, // proximos 30 dias
    ],
  },
  {
    id: "acordo-2",
    idCliente: "cliente-2",
    tipo: "judicial",
    status: "cancelado",
    parcelas: [
      { numero: 1, valorEmCentavos: 8000, venceEm: "2026-11-30" }, // agendado (>30 dias)
    ],
  },
  {
    id: "acordo-3",
    idCliente: "cliente-3",
    tipo: "extrajudicial",
    status: "em_negociacao",
    parcelas: [{ numero: 1, valorEmCentavos: 9000, venceEm: "2026-09-18" }],
  },
];

test("a agenda separa vencido, vence hoje e proximos 30 dias", () => {
  const agenda = montarAgenda({ acordos: ACORDOS_EXEMPLO, hoje: "2026-09-18" });

  assert.equal(agenda.valido, true);
  assert.deepEqual(
    agenda.colunas.vencido.map((item) => item.numeroParcela),
    [1],
  );
  assert.deepEqual(
    agenda.colunas.venceHoje.map((item) => item.numeroParcela),
    [2],
  );
  assert.deepEqual(
    agenda.colunas.proximos30Dias.map((item) => item.numeroParcela),
    [3],
  );
});

test("a fronteira dos proximos 30 dias inclui o dia 30 e exclui o dia 31", () => {
  const acordos = [
    {
      id: "acordo-limite",
      status: "ativo",
      parcelas: [
        { numero: 1, valorEmCentavos: 100, venceEm: "2026-10-18" }, // exatos 30 dias
        { numero: 2, valorEmCentavos: 100, venceEm: "2026-10-19" }, // 31 dias
      ],
    },
  ];

  const agenda = montarAgenda({ acordos, hoje: "2026-09-18" });

  assert.deepEqual(
    agenda.colunas.proximos30Dias.map((item) => item.numeroParcela),
    [1],
  );
  assert.equal(agenda.colunas.proximos30Dias.length, 1);
});

test("parcelas pagas nao entram na agenda", () => {
  const acordos = [
    {
      id: "acordo-1",
      status: "ativo",
      parcelas: [
        { numero: 1, valorEmCentavos: 5000, venceEm: "2026-09-01", pago: true },
        { numero: 2, valorEmCentavos: 5000, venceEm: "2026-09-18" },
      ],
    },
  ];

  const agenda = montarAgenda({ acordos, hoje: "2026-09-18" });

  assert.equal(agenda.lista.length, 1);
  assert.equal(agenda.lista[0].numeroParcela, 2);
});

test("a agenda considera apenas acordos celebrados", () => {
  const agenda = montarAgenda({ acordos: ACORDOS_EXEMPLO, hoje: "2026-09-18" });

  const idsAcordos = new Set(agenda.lista.map((item) => item.idAcordo));
  assert.ok(!idsAcordos.has("acordo-3"));
  assert.ok(idsAcordos.has("acordo-1"));
  assert.ok(idsAcordos.has("acordo-2"));
});

test("por padrao a agenda mostra acordos de todos os clientes", () => {
  const agenda = montarAgenda({ acordos: ACORDOS_EXEMPLO, hoje: "2026-09-18" });

  const clientes = new Set(agenda.lista.map((item) => item.idCliente));
  assert.deepEqual([...clientes].sort(), ["cliente-1", "cliente-2"]);
});

test("o filtro por cliente restringe a agenda", () => {
  const agenda = montarAgenda({
    acordos: ACORDOS_EXEMPLO,
    hoje: "2026-09-18",
    filtros: { idCliente: "cliente-1" },
  });

  assert.ok(agenda.lista.every((item) => item.idCliente === "cliente-1"));
  assert.equal(agenda.lista.length, 3);
});

test("o filtro por status restringe a agenda entre os acordos celebrados", () => {
  const agenda = montarAgenda({
    acordos: ACORDOS_EXEMPLO,
    hoje: "2026-09-18",
    filtros: { status: "cancelado" },
  });

  assert.ok(agenda.lista.every((item) => item.status === "cancelado"));
  assert.deepEqual(
    agenda.lista.map((item) => item.idAcordo),
    ["acordo-2"],
  );
});

test("o filtro por tipo restringe a agenda", () => {
  const agenda = montarAgenda({
    acordos: ACORDOS_EXEMPLO,
    hoje: "2026-09-18",
    filtros: { tipo: "judicial" },
  });

  assert.ok(agenda.lista.every((item) => item.tipo === "judicial"));
  assert.deepEqual(
    agenda.lista.map((item) => item.idAcordo),
    ["acordo-2"],
  );
});

test("a lista sai ordenada por vencimento e o calendario agrupa por dia", () => {
  const agenda = montarAgenda({ acordos: ACORDOS_EXEMPLO, hoje: "2026-09-18" });

  const vencimentos = agenda.lista.map((item) => item.venceEm);
  assert.deepEqual(vencimentos, [...vencimentos].sort());

  assert.deepEqual(Object.keys(agenda.calendario).sort(), [
    "2026-09-01",
    "2026-09-18",
    "2026-10-10",
    "2026-11-30",
  ]);
  assert.equal(agenda.calendario["2026-09-18"][0].numeroParcela, 2);
});

test("a agenda rejeita data de referencia invalida", () => {
  assert.deepEqual(
    montarAgenda({ acordos: ACORDOS_EXEMPLO, hoje: "18/09/2026" }),
    { valido: false, erros: ["data-referencia-invalida"] },
  );
});
