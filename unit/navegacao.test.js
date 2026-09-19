const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ABAS_CONCORDIA,
  ABA_INICIAL,
  podeAcessarAba,
  montarNavegacao,
} = require("../src/domain/navegacao");

test("a navegacao expoe as oito abas previstas na ordem do card", () => {
  assert.deepEqual(
    ABAS_CONCORDIA.map((aba) => aba.id),
    [
      "debitos",
      "cadastros",
      "prazos",
      "documentos",
      "dashboard",
      "financeiro",
      "atualizacao-monetaria",
      "ia-concordia",
    ],
  );
});

test("a aba inicial pos-login e o dashboard", () => {
  assert.equal(ABA_INICIAL, "dashboard");
  assert.equal(montarNavegacao().abaInicial, "dashboard");
});

test("no prototipo todos os perfis acessam todas as abas", () => {
  const navegacao = montarNavegacao({ perfil: "estagiario" });

  assert.ok(navegacao.abas.every((aba) => aba.acessivel));
  assert.equal(navegacao.abas.length, 8);
});

test("um perfil restrito nao acessa a aba bloqueada", () => {
  assert.deepEqual(
    podeAcessarAba({
      perfil: "estagiario",
      aba: "financeiro",
      restricoesPorPerfil: { estagiario: ["financeiro"] },
    }),
    { permitido: false, motivo: "aba-restrita-ao-perfil" },
  );
});

test("a restricao de um perfil nao afeta outros perfis", () => {
  assert.deepEqual(
    podeAcessarAba({
      perfil: "advogado",
      aba: "financeiro",
      restricoesPorPerfil: { estagiario: ["financeiro"] },
    }),
    { permitido: true },
  );
});

test("uma aba inexistente e recusada", () => {
  assert.deepEqual(
    podeAcessarAba({ perfil: "advogado", aba: "relatorios" }),
    { permitido: false, motivo: "aba-desconhecida" },
  );
});

test("a navegacao marca apenas as abas restritas do perfil como inacessiveis", () => {
  const navegacao = montarNavegacao({
    perfil: "estagiario",
    restricoesPorPerfil: { estagiario: ["financeiro"] },
  });

  const financeiro = navegacao.abas.find((aba) => aba.id === "financeiro");
  const dashboard = navegacao.abas.find((aba) => aba.id === "dashboard");

  assert.equal(financeiro.acessivel, false);
  assert.equal(dashboard.acessivel, true);
});

test("sem perfil informado nenhuma restricao e aplicada", () => {
  const navegacao = montarNavegacao({
    restricoesPorPerfil: { estagiario: ["financeiro"] },
  });

  assert.ok(navegacao.abas.every((aba) => aba.acessivel));
});
