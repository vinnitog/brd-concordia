const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function readJson(file) {
  return JSON.parse(read(file).replace(/^\uFEFF/, ""));
}

test("workflow kit files exist", () => {
  for (const file of [
    "AGENTS.md",
    "CONTEXT.md",
    "PROJECT_CONTEXT.md",
    "SKILLS_MANAGED.md",
    ".techtogs-utilities.json",
    "SKILLS_SHARED.md",
    "docs/adr/0001-preservar-estado-auditavel-sem-event-sourcing.md",
    "test.cmd",
    "package.json",
    ".gitignore",
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
  }
});

test("agent instructions define the mandatory workflow", () => {
  const agents = read("AGENTS.md");
  for (const content of [agents]) {
    const order = ["senior-dev", "ui-ux-expert", "code-reviewer", "qa-senior", "qa-automate"];
    let lastIndex = -1;
    for (const step of order) {
      const index = content.indexOf(step);
      assert.ok(index > lastIndex, `${step} should appear after the previous workflow step`);
      lastIndex = index;
    }
    assert.match(content, /develop/);
    assert.match(content, /Nunca.*push direto.*main|Nunca faca push direto para `main`/s);
  }
});

test("frontend work requires ui ux review", () => {
  const agents = read("AGENTS.md");
  assert.match(agents, /qualquer ajuste de front-end deve acionar `ui-ux-expert`/);
});

test("browser blocked by client policy is documented", () => {
  const agents = read("AGENTS.md");
  for (const content of [agents]) {
    assert.match(content, /ERR_BLOCKED_BY_CLIENT/);
    assert.match(content, /file:\/\//);
    assert.match(content, /localhost/);
    assert.match(content, /127\.0\.0\.1/);
  }
});

test("project context records the runtime stack as a future hypothesis", () => {
  const context = read("PROJECT_CONTEXT.md");
  assert.match(context, /## Hipotese De Stack Futura/);
  assert.match(context, /React \+ Vite \+ Supabase/);
  assert.match(context, /nao.*capacidade atual/is);
  assert.doesNotMatch(context, /## Stack Escolhida/);
});

test("project context preserves the Concordia scope extracted from source documents", () => {
  const context = read("PROJECT_CONTEXT.md");
  for (const requirement of [
    "Identidade visual",
    "Debitos e acordos",
    "Prazos e agenda",
    "Documentos",
    "Dashboard",
    "Financeiro e atualizacao monetaria",
    "IA Concordia",
    "Integra",
  ]) {
    assert.match(context, new RegExp(requirement));
  }
  assert.match(context, /Conteudos exclusivos do BRD Pactum, melhorias do BRD Assistant.*nao fazem parte deste escopo/s);
});

test("shared skills preserve scaffold capabilities without activating planned services", () => {
  const manifest = readJson(".techtogs-utilities.json");
  const capabilities = readJson("docs/agent-rules/capabilities.json");
  assert.equal(manifest.projectId, "brd-concordia");
  assert.equal(capabilities.projectId, "brd-concordia");
  assert.ok(capabilities.capabilities.includes("planned-supabase"));
  assert.equal(manifest.skills.supabase, undefined);
  assert.equal(manifest.skills["supabase-postgres-best-practices"], undefined);
  for (const skill of ["senior-dev", "tdd", "code-reviewer", "qa-senior", "qa-automate"]) {
    assert.deepEqual(manifest.bindings[`.agents/skills/${skill}`]?.path, manifest.skills[skill]?.path);
    assert.match(manifest.skills[skill]?.sha256 ?? "", /^[a-f0-9]{64}$/);
  }
});

test("shared skills manifest pins portable bindings without requiring private files for app tests", () => {
  const manifest = readJson(".techtogs-utilities.json");
  assert.equal(manifest.repository, "git@github.com:vinnitog/techtogs-utilities.git");
  assert.match(manifest.libraryCommit, /^[a-f0-9]{40}$/);
  assert.deepEqual(manifest.profiles, ["core", "planning", "javascript", "product"]);
  assert.equal(Object.keys(manifest.bindings).length, Object.keys(manifest.skills).length);
  for (const [name, skill] of Object.entries(manifest.skills)) {
    assert.equal(skill.path, `skills/${name}`);
    assert.match(skill.sha256, /^[a-f0-9]{64}$/);
    const binding = manifest.bindings[`.agents/skills/${name}`];
    assert.equal(binding?.path, skill.path);
    assert.equal(binding?.sha256, skill.sha256);
  }
  for (const rule of manifest.projectRules) {
    assert.ok(rule.startsWith("docs/agent-rules/"));
    assert.ok(fs.existsSync(path.join(root, rule)));
  }
});

test("npm manifest uses a portable package identifier", () => {
  const manifest = readJson("package.json");
  assert.equal(manifest.name, "brd-concordia");
});

test("continuous integration runs repository tests for pull requests", () => {
  const workflow = read(".github/workflows/test.yml");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches: \[develop, main\]/);
  assert.match(workflow, /run: npm test/);
});

test("domain glossary and ADR preserve the agreed language and audit strategy", () => {
  const glossary = read("CONTEXT.md");
  const decision = read("docs/adr/0001-preservar-estado-auditavel-sem-event-sourcing.md");

  for (const term of [
    "Parte",
    "Debito",
    "Acordo",
    "Parcela",
    "Pagamento",
    "Prazo",
    "MemoriaDeCalculo",
    "ModeloDeDocumento",
    "DocumentoGerado",
    "UsuarioBRD",
  ]) {
    assert.match(glossary, new RegExp(`\\*\\*${term}\\*\\*`));
  }

  assert.match(decision, /fatos imutaveis/);
  assert.match(decision, /nao event sourcing/);
});
