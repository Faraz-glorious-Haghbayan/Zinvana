$ErrorActionPreference = "Stop"

Set-Location -LiteralPath "C:\Zinvana"

$templatePath = Join-Path $PWD "scp-1048.html"
if (-not (Test-Path -LiteralPath $templatePath)) {
  throw "Template not found: $templatePath"
}

$template = Get-Content -LiteralPath $templatePath -Raw -Encoding UTF8
$marker = "<!-- Enhanced Professional Footer -->"
$markerIndex = $template.IndexOf($marker, [System.StringComparison]::Ordinal)
if ($markerIndex -lt 0) {
  throw "Footer marker not found in scp-1048.html: $marker"
}

$footerStart = $template.IndexOf("<footer", $markerIndex, [System.StringComparison]::OrdinalIgnoreCase)
if ($footerStart -lt 0) {
  throw "<footer> not found after marker in scp-1048.html"
}

$footerEnd = $template.IndexOf("</footer>", $footerStart, [System.StringComparison]::OrdinalIgnoreCase)
if ($footerEnd -lt 0) {
  throw "</footer> not found in scp-1048.html"
}

$footerBlock = $template.Substring($markerIndex, ($footerEnd + 9) - $markerIndex)

$rxOptions = [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor
  [System.Text.RegularExpressions.RegexOptions]::Singleline

$rx = [System.Text.RegularExpressions.Regex]::new(
  '<footer[\s\S]*?</footer>',
  $rxOptions
)

$files = Get-ChildItem -LiteralPath $PWD -Filter "scp-*.html" -File |
  Where-Object { $_.Name -ne "scp-personality-quiz.html" -and $_.Name -ne "scp-1048.html" }

$updated = 0
$skipped = 0

foreach ($f in $files) {
  $c = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $matches = $rx.Matches($c)
  if ($matches.Count -eq 0) {
    $skipped++
    continue
  }

  $last = $matches[$matches.Count - 1]
  $new = $c.Remove($last.Index, $last.Length).Insert($last.Index, $footerBlock)

  if ($new -ne $c) {
    Set-Content -LiteralPath $f.FullName -Value $new -Encoding UTF8
    $updated++
  }
}

Write-Host "Applied scp-1048 footer to $updated SCP pages. Skipped (no footer found): $skipped"