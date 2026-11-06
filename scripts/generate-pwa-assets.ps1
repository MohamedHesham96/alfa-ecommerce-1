# Generates the static PWA icon and splash assets from the existing Alfa logo.
# Requires Windows PowerShell with System.Drawing (available on Windows).
# Run from the frontend root: powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-assets.ps1

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$logoPath = Join-Path $root "public\Images\logo.png"
$iconsDir = Join-Path $root "public\icons"
$splashDir = Join-Path $root "public\splash"

New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null
New-Item -ItemType Directory -Force -Path $splashDir | Out-Null

$logo = [System.Drawing.Image]::FromFile($logoPath)

function New-Icon {
  param(
    [int]$Size,
    [double]$LogoRatio,
    [string]$Background,
    [string]$OutputPath
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($Background))
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $logoSize = [int][Math]::Round($Size * $LogoRatio)
    $offset = [int][Math]::Round(($Size - $logoSize) / 2)
    $graphics.DrawImage($logo, $offset, $offset, $logoSize, $logoSize)
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function New-Splash {
  param(
    [int]$Width,
    [int]$Height,
    [string]$OutputPath
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#f6f5f8"))
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $logoSize = [int][Math]::Round([Math]::Min($Width, $Height) * 0.24)
    $x = [int][Math]::Round(($Width - $logoSize) / 2)
    $y = [int][Math]::Round(($Height - $logoSize) / 2)
    $graphics.DrawImage($logo, $x, $y, $logoSize, $logoSize)

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

try {
  New-Icon -Size 192 -LogoRatio 0.82 -Background "#ffffff" -OutputPath (Join-Path $iconsDir "icon-192.png")
  New-Icon -Size 512 -LogoRatio 0.82 -Background "#ffffff" -OutputPath (Join-Path $iconsDir "icon-512.png")
  New-Icon -Size 192 -LogoRatio 0.58 -Background "#ffffff" -OutputPath (Join-Path $iconsDir "icon-192-maskable.png")
  New-Icon -Size 512 -LogoRatio 0.58 -Background "#ffffff" -OutputPath (Join-Path $iconsDir "icon-512-maskable.png")
  New-Icon -Size 180 -LogoRatio 0.78 -Background "#ffffff" -OutputPath (Join-Path $iconsDir "apple-touch-icon.png")

  New-Splash -Width 1170 -Height 2532 -OutputPath (Join-Path $splashDir "apple-splash-1170x2532.png")
  New-Splash -Width 1290 -Height 2796 -OutputPath (Join-Path $splashDir "apple-splash-1290x2796.png")
  New-Splash -Width 2048 -Height 2732 -OutputPath (Join-Path $splashDir "apple-splash-2048x2732.png")
  New-Splash -Width 828 -Height 1792 -OutputPath (Join-Path $splashDir "apple-splash-828x1792.png")
  New-Splash -Width 1080 -Height 2340 -OutputPath (Join-Path $splashDir "apple-splash-1080x2340.png")
  New-Splash -Width 1125 -Height 2436 -OutputPath (Join-Path $splashDir "apple-splash-1125x2436.png")
  New-Splash -Width 1179 -Height 2556 -OutputPath (Join-Path $splashDir "apple-splash-1179x2556.png")
  New-Splash -Width 1206 -Height 2622 -OutputPath (Join-Path $splashDir "apple-splash-1206x2622.png")
  New-Splash -Width 1242 -Height 2688 -OutputPath (Join-Path $splashDir "apple-splash-1242x2688.png")
  New-Splash -Width 1284 -Height 2778 -OutputPath (Join-Path $splashDir "apple-splash-1284x2778.png")
  New-Splash -Width 1320 -Height 2868 -OutputPath (Join-Path $splashDir "apple-splash-1320x2868.png")
  New-Splash -Width 1536 -Height 2048 -OutputPath (Join-Path $splashDir "apple-splash-1536x2048.png")
  New-Splash -Width 1668 -Height 2388 -OutputPath (Join-Path $splashDir "apple-splash-1668x2388.png")

  Write-Output "Generated PWA icons and splash screens."
}
finally {
  $logo.Dispose()
}
