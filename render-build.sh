#!/usr/bin/env bash
# exit on error
set -o errexit

# Instalar dependências
npm install

# Criar pasta public se não existir
mkdir -p public

# Copiar arquivos necessários para public
cp -r assets public/
cp -r *.html public/
cp -r *.css public/
cp -r *.js public/

echo "Build completed successfully!" 