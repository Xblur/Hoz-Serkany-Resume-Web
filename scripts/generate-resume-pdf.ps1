# Regenerates public/Hoz-Serkany-Resume.pdf from scripts/resume-print.html
# Requires Google Chrome or Microsoft Edge.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root 'scripts\resume-print.html'
$pdfPath = Join-Path $root 'public\Hoz-Serkany-Resume.pdf'

if (-not (Test-Path $htmlPath)) {
  throw "Missing printable HTML: $htmlPath"
}

$chromeCandidates = @(
  "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)

$browser = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  throw 'Chrome or Edge not found. Install one to generate the resume PDF.'
}

New-Item -ItemType Directory -Force -Path (Split-Path $pdfPath) | Out-Null
$fileUrl = 'file:///' + ($htmlPath -replace '\\', '/')

& $browser --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdfPath" $fileUrl
if (-not (Test-Path $pdfPath)) {
  throw "PDF was not written to $pdfPath"
}

$info = Get-Item $pdfPath
Write-Host "Wrote $($info.Length) bytes to $($info.FullName)"
