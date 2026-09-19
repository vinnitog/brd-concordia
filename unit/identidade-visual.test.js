const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const doc = "docs/identidade-visual.md";
const assetsDir = "assets/brand";
const logos = [
  "logo-concordia.svg",
  "logo-concordia-mono.svg",
  "logo-concordia-reverse.svg",
];
const favicon = "favicon.svg";

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("brand guide document exists", () => {
  assert.ok(fs.existsSync(path.join(root, doc)), `${doc} should exist`);
});

test("brand guide records the three socio decisions", () => {
  const content = read(doc);
  // Decisao dos socios no card (Issue #13).
  assert.match(content, /Variacao da marca BRD/i);
  assert.match(content, /Tipografia \(em italico\)/i);
  assert.match(content, /Todos/); // formatos: web, app, impressao, favicon
  for (const formato of ["web", "app", "impressao", "favicon"]) {
    assert.match(content, new RegExp(formato, "i"));
  }
});

test("all brand assets exist", () => {
  for (const file of [...logos, favicon, "README.md"]) {
    assert.ok(
      fs.existsSync(path.join(root, assetsDir, file)),
      `${assetsDir}/${file} should exist`,
    );
  }
});

test("logo lockups are well-formed SVG with the BRD signature", () => {
  for (const file of logos) {
    const svg = read(path.join(assetsDir, file));
    assert.match(svg, /<svg[\s\S]*<\/svg>\s*$/, `${file} should be an SVG`);
    assert.match(svg, /viewBox=/, `${file} should declare a viewBox (scales to any size)`);
    assert.match(svg, /BRD/, `${file} should preserve the BRD signature`);
    assert.match(svg, /Concordia/, `${file} should contain Concordia`);
  }
});

test("Concordia is rendered in italic - the distinctive element chosen by the socios", () => {
  for (const file of logos) {
    const svg = read(path.join(assetsDir, file));
    // "Concordia" deve aparecer dentro de um tspan italico.
    assert.match(
      svg,
      /font-style="italic"[^>]*>Concordia|font-style:\s*italic/i,
      `${file} should set Concordia in italic`,
    );
  }
});

test("favicon is a square brandmark", () => {
  const svg = read(path.join(assetsDir, favicon));
  assert.match(svg, /<svg[\s\S]*<\/svg>\s*$/);
  const viewBox = /viewBox="([\d.\s]+)"/.exec(svg);
  assert.ok(viewBox, "favicon should declare a viewBox");
  const [, , width, height] = viewBox[1].trim().split(/\s+/).map(Number);
  assert.equal(width, height, "favicon viewBox should be square");
});
