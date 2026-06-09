#!/bin/bash
set -e
cd /var/www/muebleuno

npm run build

cp -r .next/static .next/standalone/.next/static

# Copia archivos públicos estáticos al standalone
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/ 2>/dev/null || true

# Recrea el symlink de uploads (sobreescribe lo copiado)
rm -rf .next/standalone/public/uploads
ln -s /var/www/muebleuno/public/uploads .next/standalone/public/uploads

pm2 restart muebleuno --update-env
echo "Deploy OK"
