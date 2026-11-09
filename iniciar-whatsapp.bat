@echo off
chcp 65001 >nul
title Motor WhatsApp - El Shadday (NAO FECHE ESTA JANELA)
cd /d "%~dp0"

echo ============================================================
echo   Motor de WhatsApp - El Shadday
echo   Deixe esta janela aberta (pode minimizar).
echo   Fechar a janela = parar as mensagens automaticas.
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org ^(versao LTS^) e rode de novo.
  pause
  exit /b 1
)

if not exist "node_modules\@whiskeysockets\baileys" (
  echo Instalando dependencias pela primeira vez, aguarde...
  call npm install
)

if not exist ".env.local" (
  echo [AVISO] Arquivo .env.local nao encontrado.
  echo         Crie o arquivo .env.local nesta pasta com a linha:
  echo         SUPABASE_SERVICE_ROLE_KEY=chave_service_role_do_supabase
  echo         Sem ela, depois da atualizacao de seguranca o motor nao ve os pedidos.
  echo.
)

:loop
echo [%date% %time%] Iniciando motor...
node server/whatsapp-service.js
echo.
echo [%date% %time%] O motor parou. Reiniciando em 10 segundos... ^(feche a janela para parar de vez^)
timeout /t 10 /nobreak >nul
goto loop
