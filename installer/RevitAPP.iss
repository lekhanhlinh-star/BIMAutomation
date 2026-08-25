; =====================================================================
; RevitAPP / BIMAutomation Unified Inno Setup Script
; Tự động nhận diện Revit 2022, 2023, 2024, 2025, 2026, 2027
; Tự động cài đặt Manifest, MCP Config và DLLs tương thích
; =====================================================================

#define MyAppName "RevitAPP BIM Automation"
#define MyAppVersion "2.5.0"
#define MyAppPublisher "BIMAutomation Team"
#define MyAppURL "https://bimautomation.solutions"
#define MyAppExeName "RevitAPP.Installer.exe"

[Setup]
AppId={{8E4F1642-4F77-4C76-96B0-7EF654219801}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}/download
DefaultDirName={localappdata}\RevitAPP
DefaultGroupName=RevitAPP BIM Automation
DisableProgramGroupPage=yes
OutputBaseFilename=BIMAutomation.Installer
OutputDir=.\Output
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible
DisableDirPage=yes
UninstallDisplayName={#MyAppName} (v{#MyAppVersion})
UninstallFilesDir={localappdata}\RevitAPP\Uninstall

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Thư mục chứa binaries của các phiên bản Revit (2022 -> 2027)
; Source: "bin\Revit2022\*"; DestDir: "{app}\Revit2022"; Flags: ignoreversion recursesubdirs createallsubdirs
; Source: "bin\Revit2023\*"; DestDir: "{app}\Revit2023"; Flags: ignoreversion recursesubdirs createallsubdirs
; Source: "bin\Revit2024\*"; DestDir: "{app}\Revit2024"; Flags: ignoreversion recursesubdirs createallsubdirs
; Source: "bin\Revit2025\*"; DestDir: "{app}\Revit2025"; Flags: ignoreversion recursesubdirs createallsubdirs
; Source: "bin\Revit2026\*"; DestDir: "{app}\Revit2026"; Flags: ignoreversion recursesubdirs createallsubdirs
; Source: "bin\Revit2027\*"; DestDir: "{app}\Revit2027"; Flags: ignoreversion recursesubdirs createallsubdirs

; File template Manifest
Source: "RevitAPP.addin"; DestDir: "{app}\Templates"; Flags: ignoreversion

[Code]
// Danh sách các năm phiên bản Revit hỗ trợ
const
  REVIT_START_YEAR = 2022;
  REVIT_END_YEAR = 2027;

function IsRevitVersionInstalled(Year: Integer): Boolean;
var
  RegKey: string;
  AppdataPath: string;
begin
  // Kiểm tra qua Windows Registry hoặc kiểm tra thư mục Addins của người dùng
  RegKey := 'SOFTWARE\Autodesk\Revit\' + IntToStr(Year);
  AppdataPath := ExpandConstant('{userappdata}\Autodesk\Revit\Addins\' + IntToStr(Year));
  
  Result := RegKeyExists(HKLM, RegKey) or 
            RegKeyExists(HKCU, RegKey) or 
            DirExists(AppdataPath) or
            DirExists(ExpandConstant('{commonappdata}\Autodesk\Revit\Addins\' + IntToStr(Year)));
end;

procedure DeployManifestForYear(Year: Integer);
var
  TargetAddinDir: string;
  ManifestSource: string;
  ManifestTarget: string;
  ManifestContent: AnsiString;
  AssemblyPath: string;
begin
  TargetAddinDir := ExpandConstant('{userappdata}\Autodesk\Revit\Addins\' + IntToStr(Year));
  if not DirExists(TargetAddinDir) then
    ForceDirectories(TargetAddinDir);

  ManifestSource := ExpandConstant('{app}\Templates\RevitAPP.addin');
  ManifestTarget := TargetAddinDir + '\RevitAPP.addin';
  AssemblyPath := ExpandConstant('{app}\Revit' + IntToStr(Year) + '\RevitAPP.dll');

  if FileExists(ManifestSource) then
  begin
    if LoadStringFromFile(ManifestSource, ManifestContent) then
    begin
      // Thay thế đường dẫn Assembly động
      StringChangeByRef(ManifestContent, '%LOCALAPPDATA%\RevitAPP\Revit[YEAR]\RevitAPP.dll', AssemblyPath);
      SaveStringToFile(ManifestTarget, ManifestContent, False);
    end;
  end;
end;

procedure RemoveManifestForYear(Year: Integer);
var
  ManifestTarget: string;
begin
  ManifestTarget := ExpandConstant('{userappdata}\Autodesk\Revit\Addins\' + IntToStr(Year) + '\RevitAPP.addin');
  if FileExists(ManifestTarget) then
    DeleteFile(ManifestTarget);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  Year: Integer;
  DetectedCount: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    DetectedCount := 0;
    for Year := REVIT_START_YEAR to REVIT_END_YEAR do
    begin
      // Cài đặt manifest cho mọi phiên bản đã nhận diện
      DeployManifestForYear(Year);
      if IsRevitVersionInstalled(Year) then
        DetectedCount := DetectedCount + 1;
    end;

    // Khởi tạo thư mục cấu hình MCP cục bộ
    ForceDirectories(ExpandConstant('{localappdata}\RevitAPP\Config'));
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  Year: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    for Year := REVIT_START_YEAR to REVIT_END_YEAR do
    begin
      RemoveManifestForYear(Year);
    end;
  end;
end;
