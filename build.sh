#!/bin/bash

echo "Iniciando build customizado..."
cd "Paulo Cell" || exit 1
echo "Entrando na pasta Paulo Cell..."
npm install
echo "Instalação concluída, iniciando build..."
npm run build
echo "Build concluído com sucesso!" 