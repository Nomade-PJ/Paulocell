@echo off
echo ===== Sistema Paulo Cell - Inicializacao em Producao =====
echo.

:: Configurar ambiente de producao
set NODE_ENV=production

:: Executar o script de configuracao de ambiente
echo Configurando ambiente de producao...
node setup-env.js

IF %ERRORLEVEL% NEQ 0 (
  echo Erro ao configurar ambiente! Verifique se o arquivo .env.production existe.
  pause
  exit /b 1
)

:: Iniciar servidor
echo.
echo Iniciando servidor em modo producao...
node server.js

pause 