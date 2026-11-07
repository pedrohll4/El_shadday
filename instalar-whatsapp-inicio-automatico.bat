@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%~dp0iniciar-whatsapp.bat"

powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP%\Motor WhatsApp El Shadday.lnk');" ^
  "$s.TargetPath='%TARGET%'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()"

if exist "%STARTUP%\Motor WhatsApp El Shadday.lnk" (
  echo Pronto! O motor do WhatsApp vai abrir sozinho ^(minimizado^) sempre que o Windows iniciar.
  echo Para desfazer, apague o atalho "Motor WhatsApp El Shadday" em:
  echo %STARTUP%
) else (
  echo [ERRO] Nao consegui criar o atalho de inicializacao.
)
pause
