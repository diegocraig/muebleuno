#!/bin/bash
set -e
cd /var/www/muebleuno

npm run build

cp -r .next/static .next/standalone/.next/static

# Recrea el symlink de uploads
mkdir -p .next/standalone/public
rm -rf .next/standalone/public/uploads
ln -s /var/www/muebleuno/public/uploads .next/standalone/public/uploads

pm2 restart muebleuno --update-env
echo "Deploy OK"
