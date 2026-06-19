#!/bin/bash
set -e
cd /var/www/muebleuno

npm run build

# La app corre con `next start` (ver ecosystem.config.js), que sirve .next/
# y public/ directamente. No se usa el output "standalone", por eso ya no se
# copia nada a .next/standalone/. uploads vive en public/uploads (volumen real).

pm2 restart muebleuno --update-env
echo "Deploy OK"
