#!/bin/sh
# Publicación manual de Vozalta en GitHub Pages mediante la rama gh-pages.
# Uso:  sh deploy.sh
set -e

echo "→ Instalando gh-pages si no está presente..."
npx --yes gh-pages --version > /dev/null

echo "→ Compilando con rutas relativas (imprescindible)..."
npx vite build --base=./

echo "→ Subiendo dist/ a la rama gh-pages..."
npx gh-pages -d dist

echo ""
echo "✔ Subido. En GitHub abre: Settings → Pages →"
echo "  Build and deployment → Source: 'Deploy from a branch' → gh-pages / (root)."
echo "  El sitio quedará en https://TU-USUARIO.github.io/TU-REPO/"
