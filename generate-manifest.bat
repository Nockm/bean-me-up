@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\generate-manifest.ps1"
if errorlevel 1 (
  echo Manifest generation failed. Your previous manifest has been kept.
  pause
  exit /b 1
)
echo Ready to commit and push your coffee folders and coffees.json.
pause
