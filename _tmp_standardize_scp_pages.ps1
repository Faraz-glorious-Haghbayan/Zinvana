$ErrorActionPreference = "Stop"

Set-Location -LiteralPath "C:\Zinvana"

# Create root-level proxies so pages can link like scp-3008.html
Copy-Item -Path ".\js\site.js" -Destination ".\site.js" -Force

$proxyCss = @" 
/* Proxy stylesheet so SCP pages can link to "site.css" like scp-3008.html */
@import url("css/site.css");
"@.TrimStart()

Set-Content -Path ".\site.css" -Value $proxyCss -Encoding UTF8

$files = Get-ChildItem -Path . -Filter "scp-*.html" -File |
  Where-Object { $_.Name -ne "scp-personality-quiz.html" }

function Fix-Mojibake([string]$text) {
  # If a UTF-8 file was accidentally read as Windows-1252/ANSI and then saved,
  # you'll see mojibake like "Ã¢â‚¬â€" for punctuation.
  # This converts the string back by reinterpreting it as 1252 bytes and decoding as UTF-8.
  $enc1252 = [System.Text.Encoding]::GetEncoding(1252)
  $fixed = [System.Text.Encoding]::UTF8.GetString($enc1252.GetBytes($text))

  function Score-Latin1([string]$s) {
    $score = 0
    foreach ($ch in $s.ToCharArray()) {
      $cp = [int]$ch
      if ($cp -ge 0x00C0 -and $cp -le 0x00FF) { $score++ }
    }
    return $score
  }

  # Prefer the version with fewer Latin-1 supplement characters.
  if ((Score-Latin1 $fixed) -lt (Score-Latin1 $text)) { return $fixed }
  return $text
}

foreach ($f in $files) {
  $c = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8

  $c = Fix-Mojibake $c

  if ($c -notmatch 'name="theme-color"') {
    $c = [regex]::Replace(
      $c,
      '(<meta[\s\S]*?name="description"[\s\S]*?/?>\s*)',
      '$1' + "`r`n    <meta name=""theme-color"" content=""#0b1220"" />`r`n",
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
  }

  # Match scp-3008.html asset link style
  $c = $c -replace 'href="/css/site\.css"', 'href="site.css"'
  $c = $c -replace 'href="css/site\.css"', 'href="site.css"'
  $c = $c -replace 'href="/scp-profile\.css"', 'href="scp-profile.css"'
  $c = $c -replace 'src="/js/site\.js"', 'src="site.js"'

  # Normalize indentation for the standardized head assets
  $c = [regex]::Replace(
    $c,
    '^\s*<meta\s+name="theme-color"[^>]*?>\s*$',
    '    <meta name="theme-color" content="#0b1220" />',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Multiline
  )
  $c = [regex]::Replace(
    $c,
    '^\s*<link\s+rel="stylesheet"\s+href="site\.css"\s*/>\s*$',
    '    <link rel="stylesheet" href="site.css" />',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Multiline
  )
  $c = [regex]::Replace(
    $c,
    '^\s*<link\s+rel="stylesheet"\s+href="scp-profile\.css"\s*/>\s*$',
    '    <link rel="stylesheet" href="scp-profile.css" />',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Multiline
  )
  $c = [regex]::Replace(
    $c,
    '^\s*<script\s+src="site\.js"\s+defer><\/script>\s*$',
    '    <script src="site.js" defer></script>',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Multiline
  )

  # Ensure a blank line after theme-color (cosmetic consistency)
  $c = [regex]::Replace(
    $c,
    '(<meta\s+name="theme-color"[^>]*?>)\s*\r?\n(\s*<link\s)',
    '$1' + "`r`n`r`n" + '$2',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )

  Set-Content -LiteralPath $f.FullName -Value $c -Encoding UTF8
}

Write-Host "Updated $($files.Count) SCP pages. Proxies created: site.css, site.js"