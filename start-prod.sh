#!/bin/bash

echo "===== Sistema Paulo Cell - Inicialização em Produção ====="
echo ""

# Configurar ambiente de produção
export NODE_ENV=production

# Executar o script de configuração de ambiente
echo "Configurando ambiente de produção..."
node setup-env.js

if [ $? -ne 0 ]; then
  echo "Erro ao configurar ambiente! Verifique se o arquivo .env.production existe."
  exit 1
fi

# Iniciar servidor
echo ""
echo "Iniciando servidor em modo produção..."
node server.js 