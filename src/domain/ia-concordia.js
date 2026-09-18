// Politicas de dominio da IA Concordia.
//
// A leitura efetiva de documentos por IA e um runtime externo ainda nao
// habilitado neste scaffold (ver docs/viabilidade.md, que adia a IA Concordia
// para fase posterior, e as capabilities em .togs/orchestrator.json). Este
// modulo estabelece apenas os contratos deterministicos que governam o recurso,
// no mesmo padrao puro e testavel de src/domain/policies.js.
//
// As regras abaixo codificam as decisoes tomadas pelos socios no card do Trello
// (Issue #16): tipos de documento aceitos, tratamento de baixa confianca,
// conteudo do resumo, tom/escopo das mensagens, documentos faltantes, riscos e
// validacao por socio antes da exibicao ao usuario.

// Tipos reconhecidos informados pelos socios. Documentos de outros tipos tambem
// sao aceitos ("aceitar tudo, sem ordem de prioridade"); apenas nao sao
// classificados como um tipo conhecido.
const TIPOS_DOCUMENTO_RECONHECIDOS = new Set([
  "contrato",
  "email",
  "comprovante",
  "sentenca",
  "fatura",
  "titulo-executivo-judicial",
  "titulo-executivo-extrajudicial",
]);

// Sem certeza suficiente a extracao vai para confirmacao manual (decisao dos
// socios: "deve solicitar confirmacao manual"). O limite e de referencia (citado
// na triagem) e permanece configuravel para calibracao com documentos reais.
const CONFIANCA_MINIMA_PADRAO = 0.8;

// Conteudo essencial do resumo do caso definido pelos socios.
const ELEMENTOS_RESUMO_OBRIGATORIOS = [
  "partes",
  "objeto",
  "valorDivida",
  "formasPagamento",
  "vencimentos",
  "penalidades",
];

// Documento que os socios consideram indispensavel para um acordo completo.
const DOCUMENTOS_OBRIGATORIOS_ACORDO = ["planilha-atualizada-debito"];

// Riscos que os socios querem que a IA aponte.
const RISCOS_RECONHECIDOS = new Set([
  "clausula-abusiva",
  "forma-pagamento-prejudicial-ao-credor",
  "objeto-do-documento",
]);

// Analises que so podem chegar ao usuario apos validacao de um socio do BRD.
const ANALISES_COM_VALIDACAO_DE_SOCIO = new Set([
  "risco",
  "documentos-faltantes",
]);

function temTexto(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function temConteudo(valor) {
  if (Array.isArray(valor)) {
    return valor.length > 0;
  }

  return temTexto(valor);
}

function classificarDocumento(tipo) {
  const normalizado = temTexto(tipo) ? tipo.trim() : "";
  const reconhecido = TIPOS_DOCUMENTO_RECONHECIDOS.has(normalizado);

  return {
    aceito: true, // socios: aceitar todos os documentos, sem ordem de prioridade
    tipo: reconhecido ? normalizado : "outro",
    reconhecido,
  };
}

function avaliarExtracao({
  campo,
  valor,
  confianca,
  confiancaMinima = CONFIANCA_MINIMA_PADRAO,
} = {}) {
  if (!temTexto(campo)) {
    return { status: "invalido", motivo: "campo-obrigatorio" };
  }

  if (
    typeof confianca !== "number" ||
    Number.isNaN(confianca) ||
    confianca < 0 ||
    confianca > 1
  ) {
    return { status: "invalido", motivo: "confianca-invalida" };
  }

  if (!temConteudo(valor)) {
    return { status: "confirmar-manualmente", motivo: "valor-ausente" };
  }

  if (confianca < confiancaMinima) {
    return {
      status: "confirmar-manualmente",
      motivo: "confianca-abaixo-do-limite",
    };
  }

  return { status: "aceito" };
}

function avaliarResumoCaso(resumo = {}) {
  const ausentes = ELEMENTOS_RESUMO_OBRIGATORIOS.filter(
    (chave) => !temConteudo(resumo[chave]),
  );

  return ausentes.length === 0
    ? { completo: true }
    : { completo: false, ausentes };
}

function avaliarMensagemSugerida({
  categoria,
  tipoDocumento,
  situacao,
  texto,
} = {}) {
  const erros = [];

  // Socios: mensagens sao avisos, especificas por tipo de documento e situacao,
  // nunca templates genericos.
  if (categoria !== "aviso") {
    erros.push("categoria-deve-ser-aviso");
  }

  if (!temTexto(tipoDocumento)) {
    erros.push("tipo-documento-obrigatorio");
  }

  if (!temTexto(situacao)) {
    erros.push("situacao-obrigatoria");
  }

  if (!temTexto(texto)) {
    erros.push("texto-obrigatorio");
  }

  return erros.length === 0 ? { valida: true } : { valida: false, erros };
}

function identificarDocumentosFaltantes({ documentosPresentes = [] } = {}) {
  const presentes = new Set(
    documentosPresentes.filter(temTexto).map((documento) => documento.trim()),
  );

  const faltantes = DOCUMENTOS_OBRIGATORIOS_ACORDO.filter(
    (documento) => !presentes.has(documento),
  );

  return faltantes.length === 0
    ? { acordoCompleto: true, faltantes: [] }
    : { acordoCompleto: false, faltantes };
}

function classificarRisco(tipo) {
  const normalizado = temTexto(tipo) ? tipo.trim() : "";

  return {
    tipo: normalizado || "desconhecido",
    reconhecido: RISCOS_RECONHECIDOS.has(normalizado),
  };
}

function liberarAnaliseParaUsuario({ tipoAnalise, validadoPorSocio = false } = {}) {
  if (!temTexto(tipoAnalise)) {
    return { liberada: false, motivo: "tipo-analise-obrigatorio" };
  }

  const exigeValidacao = ANALISES_COM_VALIDACAO_DE_SOCIO.has(tipoAnalise.trim());

  if (exigeValidacao && !validadoPorSocio) {
    return { liberada: false, motivo: "aguardando-validacao-de-socio" };
  }

  return { liberada: true };
}

module.exports = {
  classificarDocumento,
  avaliarExtracao,
  avaliarResumoCaso,
  avaliarMensagemSugerida,
  identificarDocumentosFaltantes,
  classificarRisco,
  liberarAnaliseParaUsuario,
};
