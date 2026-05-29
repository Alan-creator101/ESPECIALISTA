@echo off
setlocal
cd /d "%~dp0"
title Especialista AI - Iniciador Windows

echo =====================================================
echo  Especialista AI - SaaS de anuncios de marketplace
echo =====================================================
echo.
echo Este arquivo deve ser aberto com duplo clique ou pelo CMD/PowerShell.
echo Nao digite estes comandos dentro da tela "Welcome to Node.js".
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  echo Instale em https://nodejs.org e tente novamente.
  pause
  exit /b 1
)

echo Node encontrado:
node --version
echo.

echo Instalando/preparando o projeto...
call npm install
if errorlevel 1 (
  echo.
  echo ERRO ao executar npm install.
  pause
  exit /b 1
)

echo.
echo Abrindo navegador em http://localhost:3000 ...
start "" "http://localhost:3000"
echo.
echo Servidor iniciado. Mantenha esta janela aberta enquanto usa o SaaS.
echo Login demo: admin@especialista.ai
echo Senha demo: Admin123!
echo.
call npm run dev

echo.
echo Servidor encerrado.
pause
