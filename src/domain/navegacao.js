// Estrutura de abas do BRD Concordia (card Trello #10).
// Ordem canonica do menu segue a lista prevista no card; a aba inicial pos-login
// e o Dashboard, conforme decisao dos socios registrada na Issue.
// O acesso a cada aba pode ser restrito por perfil. No prototipo nenhum perfil
// tem restricoes (todos veem tudo); restricoes futuras (ex.: Financeiro fechado
// para estagiarios) sao expressas em `restricoesPorPerfil` sem alterar o dominio.

const ABAS_CONCORDIA = Object.freeze([
  Object.freeze({ id: "debitos", rotulo: "Débitos" }),
  Object.freeze({ id: "cadastros", rotulo: "Cadastros" }),
  Object.freeze({ id: "prazos", rotulo: "Prazos" }),
  Object.freeze({ id: "documentos", rotulo: "Documentos" }),
  Object.freeze({ id: "dashboard", rotulo: "Dashboard" }),
  Object.freeze({ id: "financeiro", rotulo: "Financeiro" }),
  Object.freeze({ id: "atualizacao-monetaria", rotulo: "Atualização monetária" }),
  Object.freeze({ id: "ia-concordia", rotulo: "IA Concordia" }),
]);

const ABA_INICIAL = "dashboard";

const IDS_ABAS = new Set(ABAS_CONCORDIA.map((aba) => aba.id));

function restricoesDoPerfil(perfil, restricoesPorPerfil = {}) {
  if (typeof perfil !== "string" || perfil.trim().length === 0) {
    return new Set();
  }

  const restritas = restricoesPorPerfil[perfil];

  return new Set(Array.isArray(restritas) ? restritas : []);
}

function podeAcessarAba({ perfil, aba, restricoesPorPerfil = {} } = {}) {
  if (!IDS_ABAS.has(aba)) {
    return { permitido: false, motivo: "aba-desconhecida" };
  }

  if (restricoesDoPerfil(perfil, restricoesPorPerfil).has(aba)) {
    return { permitido: false, motivo: "aba-restrita-ao-perfil" };
  }

  return { permitido: true };
}

function montarNavegacao({ perfil, restricoesPorPerfil = {} } = {}) {
  const restritas = restricoesDoPerfil(perfil, restricoesPorPerfil);

  return {
    abaInicial: ABA_INICIAL,
    abas: ABAS_CONCORDIA.map((aba) => ({
      id: aba.id,
      rotulo: aba.rotulo,
      acessivel: !restritas.has(aba.id),
    })),
  };
}

module.exports = {
  ABAS_CONCORDIA,
  ABA_INICIAL,
  podeAcessarAba,
  montarNavegacao,
};
