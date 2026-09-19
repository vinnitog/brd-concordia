const VERSAO_BIBLIOTECA = "1.0.0";
const PADRAO_PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;
const COLLATOR_PT = new Intl.Collator("pt-BR", { sensitivity: "base" });

// Biblioteca fixa de modelos, gerados automaticamente a partir dos dados do
// caso (decisao dos socios na Issue #12). O usuario nao customiza o conteudo;
// os dados vem do registro do cadastro e a geracao e solicitada manualmente.
// Documentos gerados permanecem no app, sem envio externo.
const MODELOS = [
  {
    id: "acordo-termo-pagamento",
    categoria: "Acordo",
    subtipo: "Termo de acordo de pagamento",
    corpo:
      "TERMO DE ACORDO DE PAGAMENTO\n\n" +
      "Credor: {{credor.nome}} ({{credor.documento}})\n" +
      "Devedor: {{devedor.nome}} ({{devedor.documento}})\n" +
      "Debito {{debito.numero}}, saldo atualizado de {{debito.valorAtualizado}}.\n" +
      "As partes acordam a regularizacao conforme o acordo {{acordo.numero}}.",
  },
  {
    id: "acordo-termo-parcelado",
    categoria: "Acordo",
    subtipo: "Termo de acordo parcelado",
    corpo:
      "TERMO DE ACORDO PARCELADO\n\n" +
      "Credor: {{credor.nome}} ({{credor.documento}})\n" +
      "Devedor: {{devedor.nome}} ({{devedor.documento}})\n" +
      "Debito {{debito.numero}} regularizado pelo acordo {{acordo.numero}} " +
      "em {{acordo.quantidadeParcelas}} parcelas.",
  },
  {
    id: "acoes-execucao-titulo-extrajudicial",
    categoria: "Acoes",
    subtipo: "Peticao inicial de execucao de titulo extrajudicial",
    corpo:
      "EXECUCAO DE TITULO EXTRAJUDICIAL\n\n" +
      "Exequente: {{credor.nome}} ({{credor.documento}})\n" +
      "Executado: {{devedor.nome}} ({{devedor.documento}})\n" +
      "Referente ao debito {{debito.numero}}, no valor de {{debito.valorAtualizado}}.\n" +
      "Distribuicao na comarca de {{processo.comarca}}.",
  },
  {
    id: "acoes-acao-monitoria",
    categoria: "Acoes",
    subtipo: "Peticao inicial de acao monitoria",
    corpo:
      "ACAO MONITORIA\n\n" +
      "Autor: {{credor.nome}} ({{credor.documento}})\n" +
      "Reu: {{devedor.nome}} ({{devedor.documento}})\n" +
      "Debito {{debito.numero}} no valor de {{debito.valorAtualizado}}, " +
      "comarca de {{processo.comarca}}.",
  },
  {
    id: "cobranca-extrajudicial-notificacao",
    categoria: "Cobranca extrajudicial",
    subtipo: "Notificacao extrajudicial de cobranca",
    corpo:
      "NOTIFICACAO EXTRAJUDICIAL\n\n" +
      "Prezado(a) {{devedor.nome}},\n" +
      "Consta em aberto o debito {{debito.numero}}, no valor atualizado de " +
      "{{debito.valorAtualizado}}, devido a {{credor.nome}}.\n" +
      "Solicitamos a regularizacao no prazo legal.",
  },
  {
    id: "cobranca-extrajudicial-carta-amigavel",
    categoria: "Cobranca extrajudicial",
    subtipo: "Carta de cobranca amigavel",
    corpo:
      "CARTA DE COBRANCA\n\n" +
      "Prezado(a) {{devedor.nome}},\n" +
      "Identificamos o debito {{debito.numero}} em aberto no valor de " +
      "{{debito.valorAtualizado}}. Entre em contato para negociarmos.",
  },
  {
    id: "cobranca-judicial-cumprimento-sentenca",
    categoria: "Cobranca judicial",
    subtipo: "Requerimento de cumprimento de sentenca",
    corpo:
      "CUMPRIMENTO DE SENTENCA\n\n" +
      "Exequente: {{credor.nome}} ({{credor.documento}})\n" +
      "Executado: {{devedor.nome}} ({{devedor.documento}})\n" +
      "Processo {{processo.numero}}, vara {{processo.vara}}, comarca " +
      "{{processo.comarca}}. Valor atualizado: {{debito.valorAtualizado}}.",
  },
  {
    id: "pesquisas-patrimoniais-sisbajud",
    categoria: "Pesquisas patrimoniais",
    subtipo: "Requerimento de pesquisa SISBAJUD",
    corpo:
      "REQUERIMENTO DE PESQUISA SISBAJUD\n\n" +
      "Processo {{processo.numero}}, vara {{processo.vara}}.\n" +
      "Executado: {{devedor.nome}} ({{devedor.documento}}).\n" +
      "Requer-se bloqueio de ativos financeiros ate {{debito.valorAtualizado}}.",
  },
  {
    id: "pesquisas-patrimoniais-renajud",
    categoria: "Pesquisas patrimoniais",
    subtipo: "Requerimento de pesquisa RENAJUD",
    corpo:
      "REQUERIMENTO DE PESQUISA RENAJUD\n\n" +
      "Processo {{processo.numero}}, vara {{processo.vara}}.\n" +
      "Executado: {{devedor.nome}} ({{devedor.documento}}).\n" +
      "Requer-se pesquisa e restricao de veiculos.",
  },
  {
    id: "pesquisas-patrimoniais-infojud",
    categoria: "Pesquisas patrimoniais",
    subtipo: "Requerimento de pesquisa INFOJUD",
    corpo:
      "REQUERIMENTO DE PESQUISA INFOJUD\n\n" +
      "Processo {{processo.numero}}, vara {{processo.vara}}.\n" +
      "Executado: {{devedor.nome}} ({{devedor.documento}}).\n" +
      "Requer-se acesso as declaracoes fiscais para localizacao patrimonial.",
  },
  {
    id: "quitacao-termo-quitacao",
    categoria: "Quitacao",
    subtipo: "Termo de quitacao de debito",
    corpo:
      "TERMO DE QUITACAO\n\n" +
      "Credor: {{credor.nome}} ({{credor.documento}})\n" +
      "Devedor: {{devedor.nome}} ({{devedor.documento}})\n" +
      "Declara-se quitado o debito {{debito.numero}} pelo acordo {{acordo.numero}}.",
  },
];

function temTexto(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function dataHoraValida(valor) {
  if (!temTexto(valor)) {
    return false;
  }

  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
    valor,
  );

  if (!partes) {
    return false;
  }

  const [, ano, mes, dia, hora, minuto, segundo, fuso] = partes;
  const [, horaFuso = "00", minutoFuso = "00"] = /[+-](\d{2}):(\d{2})/.exec(fuso) ?? [];
  const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));

  return (
    data.getUTCFullYear() === Number(ano) &&
    data.getUTCMonth() === Number(mes) - 1 &&
    data.getUTCDate() === Number(dia) &&
    Number(hora) <= 23 &&
    Number(minuto) <= 59 &&
    Number(segundo) <= 59 &&
    Number(horaFuso) <= 23 &&
    Number(minutoFuso) <= 59 &&
    !Number.isNaN(Date.parse(valor))
  );
}

function camposDoModelo(modelo) {
  const campos = new Set();
  for (const [, campo] of modelo.corpo.matchAll(PADRAO_PLACEHOLDER)) {
    campos.add(campo);
  }
  return [...campos];
}

function resolverCampo(caso, caminho) {
  return caminho.split(".").reduce((valor, chave) => {
    if (valor && typeof valor === "object" && chave in valor) {
      return valor[chave];
    }
    return undefined;
  }, caso);
}

function valorPreenchido(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor);
  }
  return temTexto(valor);
}

// Catalogo em ordem alfabetica de categoria e subtipo; os subtipos ficam
// aninhados na categoria para aparecerem quando ela for aberta.
function listarCatalogo() {
  const porCategoria = new Map();

  for (const modelo of MODELOS) {
    if (!porCategoria.has(modelo.categoria)) {
      porCategoria.set(modelo.categoria, []);
    }
    porCategoria.get(modelo.categoria).push({
      id: modelo.id,
      subtipo: modelo.subtipo,
    });
  }

  return [...porCategoria.entries()]
    .sort(([a], [b]) => COLLATOR_PT.compare(a, b))
    .map(([categoria, subtipos]) => ({
      categoria,
      subtipos: subtipos.sort((a, b) => COLLATOR_PT.compare(a.subtipo, b.subtipo)),
    }));
}

// Geracao manual solicitada pelo usuario: preenche o modelo fixo com os dados
// do caso e preserva versao e vinculo juridico, alem de autoria e data exigidas
// pela ADR-0001. Retorna erros de dados incompletos em vez de emitir documento
// com lacunas.
function gerarDocumento({ idModelo, caso, geradoPor, geradoEm } = {}) {
  const erros = [];
  const modelo = MODELOS.find((item) => item.id === idModelo);

  if (!modelo) {
    return { gerado: false, erros: ["modelo-nao-encontrado"] };
  }

  if (!temTexto(geradoPor)) {
    erros.push("gerado-por-obrigatorio");
  }

  if (!temTexto(geradoEm)) {
    erros.push("gerado-em-obrigatorio");
  } else if (!dataHoraValida(geradoEm)) {
    erros.push("gerado-em-invalido");
  }

  const camposFaltantes = camposDoModelo(modelo).filter(
    (campo) => !valorPreenchido(resolverCampo(caso, campo)),
  );

  if (camposFaltantes.length > 0) {
    erros.push("dados-do-caso-incompletos");
  }

  if (erros.length > 0) {
    const resultado = { gerado: false, erros };
    if (camposFaltantes.length > 0) {
      resultado.camposFaltantes = camposFaltantes;
    }
    return resultado;
  }

  const conteudo = modelo.corpo.replace(PADRAO_PLACEHOLDER, (_, campo) =>
    String(resolverCampo(caso, campo)),
  );

  const vinculo = {};
  for (const [chave, caminho] of [
    ["idDebito", "debito.numero"],
    ["idAcordo", "acordo.numero"],
    ["idProcesso", "processo.numero"],
  ]) {
    const valor = resolverCampo(caso, caminho);
    if (valorPreenchido(valor)) {
      vinculo[chave] = valor;
    }
  }

  return {
    gerado: true,
    documento: {
      idModelo: modelo.id,
      categoria: modelo.categoria,
      subtipo: modelo.subtipo,
      versaoModelo: VERSAO_BIBLIOTECA,
      geradoPor,
      geradoEm,
      vinculo,
      conteudo,
    },
  };
}

module.exports = {
  VERSAO_BIBLIOTECA,
  listarCatalogo,
  gerarDocumento,
};
