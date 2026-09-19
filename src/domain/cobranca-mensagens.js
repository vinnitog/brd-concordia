// Politica de dominio para geracao de mensagens de cobranca de parcelas.
//
// Decisoes dos socios registradas no card do Trello (Issue #14):
// - As mensagens sao apenas GERADAS como rascunho; ninguem envia automaticamente.
//   Um UsuarioBRD revisa, pode editar e so entao registra o envio.
// - Disparo automatico do rascunho: 2 dias antes do vencimento e 24h apos.
// - Destinatarios: devedor e fiador (ambos).
// - "Cobranca incisiva" = aviso de que serao adotadas as medidas juridicas cabiveis.
// - Nao ha limite de tentativas antes de escalar para cobranca juridica.
// - O historico de mensagens fica visivel tambem para o cliente.
//
// O canal de envio (WhatsApp, e-mail, SMS...) ainda nao esta decidido de forma
// consensual e o scaffold nao possui integracao externa, portanto o transporte
// fica fora deste modulo: aqui so se gera o texto e se registra o historico.

const TIPOS_MENSAGEM = new Set([
  "antes-do-vencimento",
  "apos-vencimento",
  "incisiva",
]);
const PAPEIS_DESTINATARIO = new Set(["devedor", "fiador"]);

const DIAS_ANTES_DO_VENCIMENTO = 2;
const DIAS_APOS_O_VENCIMENTO = 1; // 24h apos o vencimento
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const ASSINATURA_PADRAO = "BRD Concordia";

function temTexto(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function dataCalendarioValida(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
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

function valorMonetarioValido(valor) {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0;
}

function formatarValorBRL(valor) {
  const centavos = Math.round(valor * 100);
  const inteiro = Math.floor(centavos / 100);
  const fracao = String(centavos % 100).padStart(2, "0");
  const milhar = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${milhar},${fracao}`;
}

function formatarDataBR(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function diferencaEmDias(de, ate) {
  const [anoA, mesA, diaA] = de.split("-").map(Number);
  const [anoB, mesB, diaB] = ate.split("-").map(Number);
  const inicio = Date.UTC(anoA, mesA - 1, diaA);
  const fim = Date.UTC(anoB, mesB - 1, diaB);
  return Math.round((fim - inicio) / MILISSEGUNDOS_POR_DIA);
}

function montarTexto({ tipo, nome, valorFormatado, vencimentoFormatado, assinatura }) {
  if (tipo === "antes-do-vencimento") {
    return (
      `Ola, ${nome}. Lembramos que a parcela no valor de ${valorFormatado} ` +
      `vence em ${vencimentoFormatado}. Para evitar encargos, mantenha o ` +
      `pagamento em dia. Em caso de duvida, estamos a disposicao. ${assinatura}.`
    );
  }

  if (tipo === "apos-vencimento") {
    return (
      `Ola, ${nome}. Identificamos que a parcela no valor de ${valorFormatado}, ` +
      `com vencimento em ${vencimentoFormatado}, encontra-se em aberto. ` +
      `Solicitamos a regularizacao o quanto antes para evitar encargos ` +
      `adicionais. ${assinatura}.`
    );
  }

  // incisiva
  return (
    `${nome}, a parcela no valor de ${valorFormatado}, vencida em ` +
    `${vencimentoFormatado}, permanece em aberto. Informamos que, ` +
    `persistindo a inadimplencia, serao adotadas as medidas juridicas ` +
    `cabiveis para a cobranca do debito. Regularize com urgencia para ` +
    `evitar essa medida. ${assinatura}.`
  );
}

// Gera o rascunho de uma mensagem de cobranca para um unico destinatario.
// Retorna { gerada: true, mensagem } ou { gerada: false, erros }.
function gerarMensagemCobranca({
  tipo,
  destinatario,
  papelDestinatario,
  valor,
  vencimento,
  assinatura = ASSINATURA_PADRAO,
} = {}) {
  const erros = [];

  if (!TIPOS_MENSAGEM.has(tipo)) {
    erros.push("tipo-nao-suportado");
  }

  if (!temTexto(destinatario)) {
    erros.push("destinatario-obrigatorio");
  }

  if (!PAPEIS_DESTINATARIO.has(papelDestinatario)) {
    erros.push("papel-destinatario-invalido");
  }

  if (!valorMonetarioValido(valor)) {
    erros.push("valor-invalido");
  }

  if (!temTexto(vencimento)) {
    erros.push("vencimento-obrigatorio");
  } else if (!dataCalendarioValida(vencimento)) {
    erros.push("vencimento-invalido");
  }

  if (erros.length > 0) {
    return { gerada: false, erros };
  }

  const nome = destinatario.trim();
  const texto = montarTexto({
    tipo,
    nome,
    valorFormatado: formatarValorBRL(valor),
    vencimentoFormatado: formatarDataBR(vencimento),
    assinatura: temTexto(assinatura) ? assinatura.trim() : ASSINATURA_PADRAO,
  });

  return {
    gerada: true,
    mensagem: {
      tipo,
      destinatario: nome,
      papelDestinatario,
      texto,
      // Rascunho editavel; ninguem envia automaticamente (decisao dos socios).
      situacao: "rascunho",
    },
  };
}

// Gera os rascunhos para os dois papeis cobraveis (devedor e fiador).
// Ignora um papel quando o nome correspondente nao for informado.
// Retorna { gerada: true, mensagens } ou { gerada: false, erros }.
function gerarMensagensCobranca({
  tipo,
  devedor,
  fiador,
  valor,
  vencimento,
  assinatura,
} = {}) {
  const alvos = [
    { papel: "devedor", nome: devedor },
    { papel: "fiador", nome: fiador },
  ].filter((alvo) => temTexto(alvo.nome));

  if (alvos.length === 0) {
    return { gerada: false, erros: ["destinatario-obrigatorio"] };
  }

  const mensagens = [];

  for (const alvo of alvos) {
    const resultado = gerarMensagemCobranca({
      tipo,
      destinatario: alvo.nome,
      papelDestinatario: alvo.papel,
      valor,
      vencimento,
      assinatura,
    });

    if (!resultado.gerada) {
      return resultado;
    }

    mensagens.push(resultado.mensagem);
  }

  return { gerada: true, mensagens };
}

// Decide se um rascunho deve ser gerado automaticamente em uma data de
// referencia, conforme a agenda definida pelos socios.
// Retorna { valido: true, tipo } com tipo em
// "antes-do-vencimento" | "apos-vencimento" | null (sem disparo no dia).
function classificarMomentoCobranca({ vencimento, referencia } = {}) {
  const erros = [];

  if (!temTexto(vencimento)) {
    erros.push("vencimento-obrigatorio");
  } else if (!dataCalendarioValida(vencimento)) {
    erros.push("vencimento-invalido");
  }

  if (!temTexto(referencia)) {
    erros.push("referencia-obrigatoria");
  } else if (!dataCalendarioValida(referencia)) {
    erros.push("referencia-invalida");
  }

  if (erros.length > 0) {
    return { valido: false, erros };
  }

  const diasAte = diferencaEmDias(referencia, vencimento);

  if (diasAte === DIAS_ANTES_DO_VENCIMENTO) {
    return { valido: true, tipo: "antes-do-vencimento" };
  }

  if (diasAte === -DIAS_APOS_O_VENCIMENTO) {
    return { valido: true, tipo: "apos-vencimento" };
  }

  return { valido: true, tipo: null };
}

// Registra no historico o envio de uma mensagem revisada por um UsuarioBRD.
// O historico e visivel tambem para o cliente (decisao dos socios) e nao
// substitui as entradas anteriores. Retorna { registrado: true, historico }
// ou { registrado: false, erros }.
function registrarMensagemEnviada({
  historico = [],
  mensagem,
  enviadaPor,
  enviadaEm,
} = {}) {
  const erros = [];

  if (!mensagem || typeof mensagem !== "object" || !temTexto(mensagem.texto)) {
    erros.push("mensagem-obrigatoria");
  }

  if (!temTexto(enviadaPor)) {
    erros.push("enviada-por-obrigatorio");
  }

  if (!temTexto(enviadaEm)) {
    erros.push("enviada-em-obrigatorio");
  }

  if (erros.length > 0) {
    return { registrado: false, erros };
  }

  const entrada = {
    tipo: mensagem.tipo,
    destinatario: mensagem.destinatario,
    papelDestinatario: mensagem.papelDestinatario,
    texto: mensagem.texto,
    enviadaPor: enviadaPor.trim(),
    enviadaEm,
    visivelParaCliente: true,
  };

  return { registrado: true, historico: [...historico, entrada] };
}

module.exports = {
  gerarMensagemCobranca,
  gerarMensagensCobranca,
  classificarMomentoCobranca,
  registrarMensagemEnviada,
};
