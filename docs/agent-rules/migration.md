# Migracao das skills compartilhadas

Revisao: 2026-10-09. Este documento complementa `AGENTS.md` e nao substitui as
decisoes de produto em `PROJECT_CONTEXT.md` e `CONTEXT.md`.

## Contrato e escopo

- Biblioteca privada `vinnitog/techtogs-utilities`, commit fixado
  `547b07aa1c645f8f7517c908b330305242c350fb`.
- Manifesto existente preservado, com os perfis core, planning, javascript e product.
  Bootstrap instala somente seus bindings; nenhum perfil novo foi adicionado.
- Regras particulares permanecem no projeto. Capacidades estao em
  `docs/agent-rules/capabilities.json`; a interface estatica e o Pages ja existem.
  Autenticacao, banco e servicos de produto continuam planejados.
- A decisao de 2026-10-07 continua vigente: Gemini somente na triagem; Codex no
  desenvolvimento, revisao e integracao. A migracao de skills nao altera provedores.
- `.agents/skills/` contem links locais ignorados pelo Git. As 18 copias antigas
  versionadas precisam sair do indice na mesma entrega do manifesto, bootstrap,
  regras e testes. Remover do indice preserva os links e seus targets compartilhados.
  Nao apagar os arquivos atraves das junctions.
- As licencas historicas em `.togs/licenses/` permanecem preservadas.

## Correcoes verificadas

O teste de automacao antigo exigia apenas `OPENAI_API_KEY`, mas os callers preparados
para utilities ja passavam `TECHTOGS_UTILITIES_SSH_KEY`. A allowlist agora verifica
ambas, com mapeamento explicito e sem `secrets: inherit`. O contrato publicado do
`brd-ci` declara a chave utilities opcional. A presenca do Secret foi consultada;
nenhum valor foi lido ou alterado.

O teste de politica exigia arquivos privados instalados e fazia um clone sem skills
ou PR de fork falhar. Os testes do aplicativo agora validam o manifesto portable e
seus bindings sem depender dos arquivos privados. A verificacao de integridade
continua separada no bootstrap e no CI de origem confiavel; nao foi ignorada.
PRs de forks nao baixam skills privadas nem executam o review com credenciais.

O bootstrap verifica repositorio e commit antes de executar o CLI da biblioteca.
Os workflows de testes e Pages usam checkout privado sem persistir credenciais,
fora do artefato publico; somente `public/` e publicado.

## Dependencia central preservada

O `verify` da biblioteca compartilhada em uso falhou com:

```text
Pinned content mismatch: .agents/skills/senior-dev
```

Existe uma modificacao anterior em `skills/senior-dev/SKILL.md` na biblioteca.
O arquivo, os hashes e o commit fixado foram preservados. A correcao central deve
reconciliar essa modificacao antes de considerar saudavel a instalacao compartilhada
local. Nao atualizar hashes, reinstalar todos os perfis ou trocar silenciosamente a
biblioteca por um clone limpo para ocultar a divergencia.

## Evidencias e limites

- 14 testes de politica/automacao passaram com Node, sem chamadas pagas.
- `git diff --check` passou depois de normalizar finais de linha dos dois callers.
- Clone remoto de `develop` em `f924b9302afdd3c0c7adf817c7cacde79bcb51ae`,
  inicialmente limpo, recebeu somente os arquivos candidatos da migracao. As copias
  antigas foram movidas para backup temporario, fora do clone, sem apagar conteudo.
  Os 195 testes desse candidato passaram sem skills instaladas, reproduzindo o
  ambiente de um colaborador sem acesso a biblioteca privada.
- Um clone temporario da biblioteca privada, autenticado via SSH e destacado no
  commit fixado, permitiu validar o bootstrap do candidato: 49 bindings instalados
  e 49 verificados. Nenhum perfil alem do manifesto foi instalado. Esse clone e
  exclusivamente uma evidencia isolada, nao substitui a biblioteca compartilhada
  em uso. Os arquivos da biblioteca limpa permaneceram sem modificacoes.
- Essa validacao usa a autenticacao SSH local existente; nao expoe credenciais nem
  prova, por si so, a execucao da deploy key pelo GitHub Actions. A presenca do Secret
  foi confirmada, e o resultado remoto precisa ser conferido no CI do commit publicado.
- O candidato ainda nao representa um commit publicado da migracao. Depois de
  registrar a entrega coerente (incluindo as remocoes do indice), repetir clone limpo
  do commit e bootstrap antes de declarar a publicacao validada. A falha central do
  workspace original continua registrada acima, mesmo quando o clone limpo passa.
- Nenhuma alteracao de banco, producao, cobrancas ou mensagens externas faz parte
  desta migracao. Testes de modelo, HTTP e navegador estao registrados separadamente
  em `docs/qa-interface.md`.
