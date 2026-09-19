// Dados judiciais do Debito (Issue #3, card do Trello).
// Codifica as decisoes dos socios registradas nos comentarios do card:
// - todos os campos sao OPCIONAIS (processo, vara, comarca, tipo de acao,
//   valor da causa, data de distribuicao e data de suspensao);
// - "tipo de acao" e uma lista pre-definida: acao de cobranca, acao monitoria,
//   acao de execucao e cumprimento de sentenca.
//
// O ProcessoJudicial ja e um conceito canonico do dominio (ver CONTEXT.md) com
// ciclo de vida independente do Debito. Este modulo cobre apenas o cadastro dos
// dados judiciais. Os socios confirmaram que ha regras de negocio associadas a
// suspensao judicial (comportamento diferente em relatorios/calculos), porem
// essas regras ainda nao foram especificadas; portanto ficam fora deste escopo
// e devem ser tratadas quando os relatorios/calculos que as consomem existirem.

const TIPOS_ACAO = new Set([
  "acao-de-cobranca",
  "acao-monitoria",
  "acao-de-execucao",
  "cumprimento-de-sentenca",
]);

function temTexto(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function informado(valor) {
  return valor !== undefined && valor !== null;
}

function valorMonetarioValido(valor) {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
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

// Todos os campos sao opcionais: um processo sem nenhum dado ainda e valido.
// Quando um campo e informado, precisa respeitar o formato/dominio esperado.
function validarProcessoJudicial({
  numeroProcesso,
  vara,
  comarca,
  tipoAcao,
  valorCausa,
  dataDistribuicao,
  dataSuspensao,
} = {}) {
  const erros = [];

  if (informado(numeroProcesso) && !temTexto(numeroProcesso)) {
    erros.push("numero-processo-invalido");
  }

  if (informado(vara) && !temTexto(vara)) {
    erros.push("vara-invalida");
  }

  if (informado(comarca) && !temTexto(comarca)) {
    erros.push("comarca-invalida");
  }

  if (informado(tipoAcao) && !TIPOS_ACAO.has(tipoAcao)) {
    erros.push("tipo-acao-invalido");
  }

  if (informado(valorCausa) && !valorMonetarioValido(valorCausa)) {
    erros.push("valor-causa-invalido");
  }

  const distribuicaoValida = informado(dataDistribuicao) && dataCalendarioValida(dataDistribuicao);
  const suspensaoValida = informado(dataSuspensao) && dataCalendarioValida(dataSuspensao);

  if (informado(dataDistribuicao) && !distribuicaoValida) {
    erros.push("data-distribuicao-invalida");
  }

  if (informado(dataSuspensao) && !suspensaoValida) {
    erros.push("data-suspensao-invalida");
  }

  // Integridade temporal: uma acao so pode ser suspensa depois de distribuida.
  // Segue o mesmo precedente do modulo financeiro (conferencia nao pode ser
  // anterior ao lancamento); nao e uma regra de produto nova, e um invariante.
  if (
    distribuicaoValida &&
    suspensaoValida &&
    Date.parse(dataSuspensao) < Date.parse(dataDistribuicao)
  ) {
    erros.push("data-suspensao-anterior-a-distribuicao");
  }

  return erros.length === 0 ? { valido: true } : { valido: false, erros };
}

module.exports = {
  TIPOS_ACAO,
  validarProcessoJudicial,
};
