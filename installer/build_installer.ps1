<#
================================================================================
.SYNOPSIS
    Script tự động Build, Ký số (Code Sign) và Đóng gói BIMAutomation.Installer.exe
.DESCRIPTION
    1. Biên dịch C# DLLs cho các phiên bản Revit (2022-2027)
    2. Ký số mã nguồn DLLs qua SignTool (tránh bị Antivirus cảnh báo)
    3. Đóng gói bộ cài đặt độc lập Inno Setup
    4. Tính toán mã băm SHA-256 Checksum
================================================================================
#>

param(
    [string]$Version = "2.5.0",
    [string]$CertPfxPath = "",
    [string]$CertPassword = "",
    [string]$TimestampServer = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [1/4] Khởi tạo quá trình đóng gói BIMAutomation v$Version" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutputDir = Join-Path $ScriptDir "Output"
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# 1. Ký số (Code Signing) nếu có Certificate
if ($CertPfxPath -and (Test-Path $CertPfxPath)) {
    Write-Host "[2/4] Đang ký số các file DLL và binaries bằng SignTool..." -ForegroundColor Yellow
    $SignToolPath = "C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe"
    if (Test-Path $SignToolPath) {
        $DllFiles = Get-ChildItem -Path (Join-Path $ScriptDir "bin") -Filter "*.dll" -Recurse
        foreach ($dll in $DllFiles) {
            & $SignToolPath sign /f $CertPfxPath /p $CertPassword /fd SHA256 /tr $TimestampServer /td SHA256 $dll.FullName
        }
        Write-Host " -> Đã ký số xong các thư viện DLL!" -ForegroundColor Green
    } else {
        Write-Warning "Không tìm thấy signtool.exe tại $SignToolPath. Bỏ qua bước ký số DLL."
    }
} else {
    Write-Host "[2/4] Không cấu hình chứng chỉ PFX. Bỏ qua bước ký số nội bộ." -ForegroundColor Gray
}

# 2. Biên dịch Inno Setup
Write-Host "[3/4] Đang biên dịch bộ cài đặt Inno Setup..." -ForegroundColor Yellow
$InnoCompiler = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $InnoCompiler)) {
    $InnoCompiler = "C:\Program Files\Inno Setup 6\ISCC.exe"
}

$IssFile = Join-Path $ScriptDir "RevitAPP.iss"

if (Test-Path $InnoCompiler) {
    & $InnoCompiler "/DMyAppVersion=$Version" $IssFile
    Write-Host " -> Đã tạo xong file cài đặt trong thư mục: $OutputDir" -ForegroundColor Green
} else {
    Write-Warning "Chưa cài đặt Inno Setup 6 (ISCC.exe). Bạn có thể mở tệp RevitAPP.iss bằng Inno Setup GUI để biên dịch."
}

# 3. Tính toán SHA-256 Checksum
$InstallerPath = Join-Path $OutputDir "BIMAutomation.Installer.exe"
if (Test-Path $InstallerPath) {
    Write-Host "[4/4] Tính toán mã băm SHA-256 toàn vẹn:" -ForegroundColor Yellow
    $hash = (Get-FileHash -Path $InstallerPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $fileSize = "{0:N2} MB" -f ((Get-Item $InstallerPath).Length / 1MB)

    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " THÔNG TIN PHÁT HÀNH BẢN CÀI ĐẶT (RELEASE METADATA):" -ForegroundColor Green
    Write-Host " - Tên file:    BIMAutomation.Installer.exe"
    Write-Host " - Phiên bản:   v$Version"
    Write-Host " - Dung lượng:  $fileSize"
    Write-Host " - SHA-256:     $hash"
    Write-Host "==========================================================" -ForegroundColor Green

    Write-Host "`nCác bước tiếp theo:" -ForegroundColor Cyan
    Write-Host "1. Upload file 'BIMAutomation.Installer.exe' lên Cloudflare R2 / AWS S3 / GitHub Release."
    Write-Host "2. Đăng nhập vào trang Admin Portal: https://bimautomation.myminiserver.info/admin/releases"
    Write-Host "3. Nhập Version: v$Version | URL: [Direct Link] | Dung lượng: $fileSize | SHA-256: $hash"
    Write-Host "4. Nhấn 'Phát hành phiên bản mới' để người dùng tải về ngay!"
}
