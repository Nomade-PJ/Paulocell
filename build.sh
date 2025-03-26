#!/bin/bash

echo "Iniciando build customizado..."
echo "Instalando dependências na raiz..."
npm install

echo "Copiando index.html para raiz se necessário..."
if [ ! -f "index.html" ]; then
  cp "Paulo Cell/index.html" .
fi

echo "Instalando o Vite globalmente..."
npm install -g vite

echo "Entrando na pasta Paulo Cell..."
cd "Paulo Cell" || exit 1

echo "Instalando dependências dentro da pasta Paulo Cell..."
npm install

echo "Executando build com Vite diretamente..."
npx vite build --outDir ../dist

echo "Build concluído com sucesso!" 