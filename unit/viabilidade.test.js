const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const doc = "docs/viabilidade.md";

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("viability recommendation document exists", () => {
  assert.ok(fs.existsSync(path.join(root, doc)), `${doc} should exist`);
});

test("viability doc answers the card checklist", () => {
  const content = read(doc);
  // Checklist do card: custos, esforco tecnico, viabilidade, recomendacao.
  assert.match(content, /Escopo de Custos/i);
  assert.match(content, /Esforco Tecnico/i);
  assert.match(content, /Viabilidade Tecnica/i);
  assert.match(content, /Recomendacao/i);
});

test("viability doc covers both technical and commercial viability", () => {
  const content = read(doc);
  // Decisao dos socios no card: viabilidade "ambos".
  assert.match(content, /Viabilidade Tecnica/i);
  assert.match(content, /Viabilidade Comercial/i);
});

test("viability doc keeps the full Concordia scope", () => {
  const content = read(doc);
  for (const modulo of [
    "Cadastros",
    "Debitos e acordos",
    "Financeiro",
    "Judicial",
    "Prazos e agenda",
    "Cobranca",
    "Documentos",
    "Dashboard",
    "IA Concordia",
  ]) {
    assert.match(content, new RegExp(modulo));
  }
});

test("viability doc flags the socio decisions still pending", () => {
  const content = read(doc);
  // Prazo e orcamento ficaram em branco no card; devem constar como pendencia.
  assert.match(content, /orcamento/i);
  assert.match(content, /prazo/i);
});
