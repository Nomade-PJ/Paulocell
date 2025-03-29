#!/bin/bash

echo "Iniciando processo de cópia..."

# Criar pasta dist e copiar arquivos estáticos
mkdir -p dist
cp index.html dist/
cp -r public dist/

# Para debug
ls -la
echo "Conteúdo atual:"
ls -la dist/

echo "Processo concluído com sucesso!" 