#!/bin/bash
# ============================================================================
# Restaura un backup de muebleuno.com.
# Antes de tocar nada crea un snapshot de seguridad del estado ACTUAL,
# de modo que una restauración siempre se pueda deshacer.
#
# Uso: restore.sh /ruta/al/backup.tar.gz
#
# Se ejecuta de forma desprendida (nohup) desde la web, porque al final
# reinicia el proceso pm2 que atendía la petición.
# ============================================================================
set -euo pipefail

ARCHIVE="${1:?Falta la ruta del backup}"
APP_DIR="/var/www/muebleuno"
DB_FILE="$APP_DIR/prisma/muebleuno.db"
UPLOADS_DIR="$APP_DIR/public/uploads"
BACKUP_ROOT="${BACKUP_DIR:-/var/backups/muebleuno}"
LOG="$BACKUP_ROOT/logs/restore.log"

mkdir -p "$BACKUP_ROOT/logs"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

log "=== RESTORE solicitado: $ARCHIVE ==="
if [ ! -f "$ARCHIVE" ]; then log "ERROR: el archivo no existe"; exit 1; fi

# 1) Snapshot de seguridad del estado actual
log "Creando snapshot de seguridad del estado actual..."
if ! "$APP_DIR/scripts/backup.sh" safety >> "$LOG" 2>&1; then
  log "ERROR: no se pudo crear el snapshot de seguridad; se aborta"
  exit 1
fi

# 2) Extraer y validar
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
tar -xzf "$ARCHIVE" -C "$TMP"
if [ ! -f "$TMP/db/muebleuno.db" ]; then
  log "ERROR: el backup no contiene una base de datos válida; se aborta"
  exit 1
fi

# 3) Restaurar la base de datos (limpiando WAL/SHM obsoletos)
log "Restaurando base de datos..."
rm -f "$DB_FILE-wal" "$DB_FILE-shm"
cp -f "$TMP/db/muebleuno.db" "$DB_FILE"

# 4) Restaurar imágenes (reemplazo en sitio, conservando la carpeta)
log "Restaurando imágenes..."
mkdir -p "$UPLOADS_DIR"
find "$UPLOADS_DIR" -mindepth 1 -delete 2>/dev/null || true
cp -a "$TMP/uploads/." "$UPLOADS_DIR/" 2>/dev/null || true

# 5) Reiniciar la aplicación
log "Reiniciando aplicación (pm2)..."
pm2 restart muebleuno --update-env >> "$LOG" 2>&1 || log "ADVERTENCIA: fallo en pm2 restart"

log "=== RESTORE COMPLETADO ==="
