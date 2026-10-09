param(
    [ValidateSet('install', 'verify', 'rollback')]
    [string]$Action = 'install',
    [string]$UtilitiesPath
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot '.techtogs-utilities.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'Manifesto .techtogs-utilities.json ausente.' }
$consumerManifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
if ($consumerManifest.repository -ne 'git@github.com:vinnitog/techtogs-utilities.git' -or
    $consumerManifest.libraryCommit -notmatch '^[a-f0-9]{40}$') {
    throw 'Repositorio ou commit fixado de utilities invalido no manifesto.'
}
if (-not $UtilitiesPath) { $UtilitiesPath = $env:TECHTOGS_UTILITIES_PATH }
if (-not $UtilitiesPath) {
    if ($consumerManifest.libraryCommit -notmatch '^[a-f0-9]{40}$') { throw 'Pin utilities invalido.' }
    $versionFolder = 'techtogs-utilities-' + $consumerManifest.libraryCommit.Substring(0, 12)
    $UtilitiesPath = Join-Path (Split-Path -Parent $projectRoot) $versionFolder
}
if (-not (Test-Path -LiteralPath (Join-Path $UtilitiesPath 'catalog.lock.json'))) {
    throw 'Clone a versao fixada de techtogs-utilities ao lado deste projeto ou informe -UtilitiesPath / TECHTOGS_UTILITIES_PATH. Consulte SKILLS_SHARED.md.'
}
$UtilitiesPath = (Resolve-Path -LiteralPath $UtilitiesPath).Path
$actualCommit = & git -C $UtilitiesPath rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or -not $actualCommit -or $actualCommit.Trim() -ne $consumerManifest.libraryCommit) {
    throw ('Checkout utilities diferente do commit fixado: ' + $consumerManifest.libraryCommit + '. Preserve a biblioteca compartilhada e consulte SKILLS_SHARED.md.')
}
& node (Join-Path $UtilitiesPath 'scripts\utilities.mjs') $Action --project $projectRoot
if ($LASTEXITCODE -ne 0) { throw ('Falha utilities: ' + $Action) }
