#!/bin/bash
# ============================================================================
# Asistente para conectar los backups de muebleuno con Google Drive (rclone).
# Ejecutar UNA sola vez:   bash scripts/setup-gdrive.sh
#
# Crea (si no existe) el remote "gdrive" y verifica que funcione subiendo
# los backups actuales. A partir de ahí, scripts/backup.sh sube solo cada día.
# ============================================================================
set -euo pipefail

REMOTE="gdrive"
TARGET="gdrive:muebleuno-backups"
BACKUP_ROOT="${BACKUP_DIR:-/var/backups/muebleuno}"

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone no está instalado. Instalá con: sudo apt-get install -y rclone"
  exit 1
fi

if rclone listremotes 2>/dev/null | grep -q "^${REMOTE}:"; then
  echo "✔ El remote '${REMOTE}' ya existe."
else
  cat <<'TXT'
────────────────────────────────────────────────────────────────────────────
 Vamos a crear el remote de Google Drive. Cuando se abra rclone, respondé:

   n                      -> New remote
   name>  gdrive          -> nombre del remote (escribí exactamente: gdrive)
   Storage>  drive        -> elegí "Google Drive" (podés escribir: drive)
   client_id>             -> (dejá vacío, Enter)
   client_secret>         -> (dejá vacío, Enter)
   scope>  1              -> 1 = acceso completo
   root_folder_id>        -> (vacío, Enter)
   service_account_file>  -> (vacío, Enter)
   Edit advanced config?  -> n
   Use auto config?       -> n   (este servidor no tiene navegador)

 Entonces rclone te mostrará un comando como:
     rclone authorize "drive"
 Copialo y ejecutalo EN TU COMPUTADORA (que tenga navegador y rclone).
 Iniciás sesión con tu cuenta de Google, y rclone te devuelve un código largo.
 Pegá ese código acá cuando rclone te lo pida.

   Configure this as a Shared Drive (Team Drive)?  -> n
   y)  -> confirmar
   q)  -> salir (quit) al terminar
────────────────────────────────────────────────────────────────────────────
TXT
  read -p "Presioná Enter para abrir rclone config..."
  rclone config
fi

if ! rclone listremotes 2>/dev/null | grep -q "^${REMOTE}:"; then
  echo "✖ No se creó el remote '${REMOTE}'. Volvé a correr este script."
  exit 1
fi

echo
echo "Probando la conexión y subiendo los backups actuales a ${TARGET} ..."
rclone mkdir "${TARGET}" 2>/dev/null || true
rclone copy "${BACKUP_ROOT}/daily" "${TARGET}/daily" --progress
rclone copy "${BACKUP_ROOT}/full"  "${TARGET}/full"  --progress

echo
echo "✔ Listo. Contenido en Google Drive:"
rclone ls "${TARGET}" | head
echo
echo "Desde ahora, el backup diario subirá automáticamente a Google Drive."
