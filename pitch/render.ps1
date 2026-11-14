# Renders pitch/deck.html to pitch/LeftOnTable-pitch-deck.pdf (and optional PNG previews).
# Usage: powershell -File pitch/render.ps1 [-Previews <folder>]
param([string]$Previews = "")

$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$browser = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw "Edge or Chrome not found" }

$deck = (Join-Path $here "deck.html")
$url = ([System.Uri]::new($deck)).AbsoluteUri  # encodes spaces in the path
$pdf = Join-Path $here "LeftOnTable-pitch-deck.pdf"
$profile = Join-Path $env:TEMP "lot-deck-profile"

Start-Process -FilePath $browser -Wait -WindowStyle Hidden -ArgumentList @("--headless=new","--disable-gpu","--no-pdf-header-footer","--user-data-dir=`"$profile`"","--virtual-time-budget=15000","--print-to-pdf=`"$pdf`"",$url)
Write-Output "PDF: $pdf ($((Get-Item $pdf).Length) bytes)"

if ($Previews) {
  New-Item -ItemType Directory -Force $Previews | Out-Null
  for ($i = 1; $i -le 10; $i++) {
    $png = Join-Path $Previews ("slide-{0:D2}.png" -f $i)
    Start-Process -FilePath $browser -Wait -WindowStyle Hidden -ArgumentList @("--headless=new","--disable-gpu","--hide-scrollbars","--user-data-dir=`"$profile`"","--virtual-time-budget=8000","--window-size=1920,1080","--screenshot=`"$png`"","$url`?only=$i")
  }
  Write-Output "Previews: $Previews"
}
