const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validarCadastroParte,
  resumirAcordosCelebrados,
} = require("../src/domain/policies");

// Decisoes dos socios na Issue #9 sobre o cadastro de credor e devedor.

test("um cadastro exige a selecao de tipo", () => {
  assert.deepEqual(validarCadastroParte({}), {
    valido: false,
    erros: ["tipo-obrigatorio"],
  });
});

test("um cadastro rejeita tipo fora de PF/PJ", () => {
  assert.deepEqual(validarCadastroParte({ tipo: "ONG" }), {
    valido: false,
    erros: ["tipo-invalido"],
  });
});

test("um cadastro PF com apenas o tipo e valido porque os dados sao opcionais nesta fase", () => {
  assert.deepEqual(validarCadastroParte({ tipo: "PF" }), { valido: true });
});

test("um cadastro aceita qualquer CPF/CNPJ sem validar formato", () => {
  assert.deepEqual(
    validarCadastroParte({ tipo: "PJ", documento: "nao-e-um-cnpj" }),
    { valido: true },
  );
});

test("a mesma Parte pode acumular os papeis de credor e devedor", () => {
  assert.deepEqual(
    validarCadastroParte({ tipo: "PF", papeis: ["credor", "devedor"] }),
    { valido: true },
  );
});

test("um cadastro rejeita papel fora de credor/devedor", () => {
  assert.deepEqual(
    validarCadastroParte({ tipo: "PJ", papeis: ["credor", "fiador"] }),
    { valido: false, erros: ["papel-invalido"] },
  );
});

test("representante legal nao se aplica a uma Parte PF", () => {
  assert.deepEqual(
    validarCadastroParte({
      tipo: "PF",
      representanteLegal: { nome: "Maria" },
    }),
    { valido: false, erros: ["representante-legal-nao-se-aplica-a-pf"] },
  );
});

test("uma Parte PJ aceita representante legal e o mesmo representante pode reaparecer em outra PJ", () => {
  const representante = { nome: "Joao", documento: "123" };

  assert.deepEqual(
    validarCadastroParte({ tipo: "PJ", representanteLegal: representante }),
    { valido: true },
  );
  assert.deepEqual(
    validarCadastroParte({ tipo: "PJ", representanteLegal: representante }),
    { valido: true },
  );
});

test("um cadastro acumula todos os erros encontrados", () => {
  assert.deepEqual(
    validarCadastroParte({ tipo: "ONG", papeis: ["fiador"] }),
    { valido: false, erros: ["tipo-invalido", "papel-invalido"] },
  );
});

// Acordos celebrados por cliente (checklist do card + criterios dos socios).

test("uma Parte sem acordos nao revela dinheiro a entrar", () => {
  assert.deepEqual(
    resumirAcordosCelebrados({ idParte: "parte-1", acordos: [] }),
    { idParte: "parte-1", quantidadeAcordos: 0, itens: [], totalPrevisto: 0 },
  );
});

test("o resumo expoe valor, parcelas e vencimentos e soma o dinheiro previsto", () => {
  const acordos = [
    {
      id: "acordo-1",
      idCredor: "parte-1",
      idDevedor: "parte-9",
      valor: 3000,
      parcelas: [
        { vencimento: "2026-10-10", valor: 1000 },
        { vencimento: "2026-11-10", valor: 1000 },
        { vencimento: "2026-12-10", valor: 1000 },
      ],
    },
  ];

  assert.deepEqual(resumirAcordosCelebrados({ idParte: "parte-1", acordos }), {
    idParte: "parte-1",
    quantidadeAcordos: 1,
    itens: [
      {
        idAcordo: "acordo-1",
        valor: 3000,
        quantidadeParcelas: 3,
        vencimentos: ["2026-10-10", "2026-11-10", "2026-12-10"],
        valoresParcelas: [1000, 1000, 1000],
      },
    ],
    totalPrevisto: 3000,
  });
});

test("o resumo considera todos os acordos da Parte, seja como credor ou devedor", () => {
  const acordos = [
    { id: "a1", idCredor: "parte-1", parcelas: [{ vencimento: "2026-10-01", valor: 500 }] },
    { id: "a2", idDevedor: "parte-1", parcelas: [{ vencimento: "2026-11-01", valor: 700 }] },
    { id: "a3", idCredor: "parte-2", parcelas: [{ vencimento: "2026-12-01", valor: 999 }] },
  ];

  const resumo = resumirAcordosCelebrados({ idParte: "parte-1", acordos });

  assert.equal(resumo.quantidadeAcordos, 2);
  assert.deepEqual(
    resumo.itens.map((item) => item.idAcordo),
    ["a1", "a2"],
  );
  assert.equal(resumo.totalPrevisto, 1200);
});
