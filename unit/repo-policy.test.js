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
    "CLAUDE.md",
    "CONTEXT.md",
    "PROJECT_CONTEXT.md",
    "SKILLS_MANAGED.md",
    ".togs/orchestrator.json",
    "docs/adr/0001-preservar-estado-auditavel-sem-event-sourcing.md",
    "test.cmd",
    "package.json",
    ".gitignore",
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
  }
});

test("codex and claude share the mandatory workflow", () => {
  const agents = read("AGENTS.md");
  const claude = read("CLAUDE.md");
  for (const content of [agents, claude]) {
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
  const claude = read("CLAUDE.md");
  assert.match(agents, /qualquer ajuste de front-end deve acionar `ui-ux-expert`/);
  assert.match(claude, /qualquer mudanca de front-end deve passar por avaliacao UI\/UX/);
});

test("browser blocked by client policy is documented", () => {
  const agents = read("AGENTS.md");
  const claude = read("CLAUDE.md");
  for (const content of [agents, claude]) {
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

test("repository metadata describes an independent scaffold node", () => {
  const orchestrator = readJson(".togs/orchestrator.json");
  const managedSkills = read("SKILLS_MANAGED.md");

  assert.equal(orchestrator.projectId, "brd-concordia");
  assert.equal(orchestrator.lifecycle, "scaffold");
  assert.equal(orchestrator.policy.repositoryOwnsCodeAndGitHistory, true);
  assert.equal(orchestrator.policy.crossProjectImportsAllowed, false);
  assert.equal(orchestrator.policy.orchestratorMayCommitOrPush, false);

  for (const skill of orchestrator.skills) {
    assert.match(managedSkills, new RegExp("\\| `" + skill + "` \\|"));
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
