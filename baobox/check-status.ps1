# Check BaoBox Build Status
Write-Host "🔍 Checking BaoBox build status..." -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "src-tauri\tauri.conf.json")) {
    Write-Host "❌ Error: Run this script from the baobox project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "`n📊 GitHub Actions:" -ForegroundColor Yellow
Write-Host "Actions: https://github.com/twigform/baobox/actions" -ForegroundColor Blue
Write-Host "Releases: https://github.com/twigform/baobox/releases" -ForegroundColor Blue

Write-Host "`n🏗️ Local Windows builds:" -ForegroundColor Yellow
$localBuilds = @(
    "src-tauri\target\release\baobox.exe",
    "src-tauri\target\release\bundle\msi\baobox_0.1.0_x64_en-US.msi",
    "src-tauri\target\release\bundle\nsis\baobox_0.1.0_x64-setup.exe"
)

foreach ($build in $localBuilds) {
    if (Test-Path $build) {
        $size = [math]::Round((Get-Item $build).Length / 1MB, 1)
        Write-Host "✅ $build ($size MB)" -ForegroundColor Green
    } else {
        Write-Host "❌ $build (not found)" -ForegroundColor Red
    }
}

Write-Host "`n🚀 Expected GitHub builds:" -ForegroundColor Yellow
Write-Host "• Windows: .exe, .msi, .nsis installers" -ForegroundColor Gray
Write-Host "• Linux: .AppImage (universal binary)" -ForegroundColor Gray  
Write-Host "• macOS: .dmg (Intel), .dmg (Apple Silicon)" -ForegroundColor Gray

Write-Host "`n💡 To create a new release:" -ForegroundColor Cyan
Write-Host "git tag v0.1.1 && git push --tags" -ForegroundColor White
