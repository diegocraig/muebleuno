#!/bin/bash
# ============================================================================
# Backup automático de muebleuno.com  (respaldo COMPLETO)
#   - Snapshot consistente de la base de datos SQLite (sqlite3 .backup)
#   - Copia completa de la carpeta de imágenes (public/uploads)
#   - Código y configuración del proyecto (app/) para reconstruirlo desde cero,
#     excluyendo lo que se regenera (node_modules, .next) o vive en git (.git)
#   - Configuración del sistema (config/): nginx, crontab, scripts de /home
#   - Comprimido en un único .tar.gz con manifest.json
#
# El layout db/ + uploads/ se mantiene intacto para que restore.sh (panel web)
# siga funcionando; app/ y config/ son adicionales para recuperación total.
#
# Uso:
#   backup.sh daily    -> backup diario + rotación + promoción a "completo" + Drive
#   backup.sh manual   -> igual que daily (disparado desde la web)
#   backup.sh safety   -> snapshot de seguridad (antes de restaurar), sin rotar ni subir
#
# Retención:
#   - daily: se mantienen los últimos 6
#   - full : cada 10 días se promueve uno; se mantienen los últimos 6 (~60 días)
#   - safety: se mantienen los últimos 10
# ============================================================================
set -euo pipefail

APP_DIR="/var/www/muebleuno"
DB_FILE="$APP_DIR/prisma/muebleuno.db"
UPLOADS_DIR="$APP_DIR/public/uploads"

BACKUP_ROOT="${BACKUP_DIR:-/var/backups/muebleuno}"
DAILY_DIR="$BACKUP_ROOT/daily"
FULL_DIR="$BACKUP_ROOT/full"
SAFETY_DIR="$BACKUP_ROOT/safety"
LOG="$BACKUP_ROOT/logs/backup.log"

DAILY_KEEP=6
FULL_KEEP=6
SAFETY_KEEP=10
FULL_INTERVAL_DAYS=10
RCLONE_REMOTE="gdrive:muebleuno-backups"

MODE="${1:-daily}"

mkdir -p "$DAILY_DIR" "$FULL_DIR" "$SAFETY_DIR" "$BACKUP_ROOT/logs"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

STAMP="$(date '+%Y%m%d-%H%M%S')"
NAME="muebleuno-$STAMP.tar.gz"

case "$MODE" in
  safety) DEST_DIR="$SAFETY_DIR" ;;
  *)      DEST_DIR="$DAILY_DIR" ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

log "Iniciando backup ($MODE) -> $NAME"
mkdir -p "$TMP/db" "$TMP/uploads"

# --- Snapshot consistente de la DB -----------------------------------------
if [ -f "$DB_FILE" ]; then
  sqlite3 "$DB_FILE" ".backup '$TMP/db/muebleuno.db'"
else
  log "ADVERTENCIA: no se encontró la base de datos en $DB_FILE"
fi

# --- Imágenes / uploads -----------------------------------------------------
if [ -d "$UPLOADS_DIR" ]; then
  cp -a "$UPLOADS_DIR/." "$TMP/uploads/" 2>/dev/null || true
fi

# --- Código y configuración del proyecto (app/) -----------------------------
# Todo lo necesario para reconstruir el sitio desde cero, EXCEPTO:
#   - node_modules y .next : se regeneran con npm install + build
#   - .git                 : el código vive en GitHub (y evita guardar el token)
#   - public/uploads       : ya va en uploads/, no se duplica
mkdir -p "$TMP/app" "$TMP/config"
if [ -d "$APP_DIR" ]; then
  tar -C "$APP_DIR" \
      --exclude='./node_modules' \
      --exclude='./.next' \
      --exclude='./.git' \
      --exclude='./public/uploads' \
      -cf - . 2>/dev/null | tar -C "$TMP/app" -xf - 2>/dev/null || true
fi

# --- Configuración del sistema (config/) ------------------------------------
# Lo que vive fuera del proyecto y hace falta para dejar el server igual.
cp -a /etc/nginx/sites-available "$TMP/config/nginx-sites-available" 2>/dev/null || true
cp -a /home/ubuntu/scripts        "$TMP/config/home-scripts"         2>/dev/null || true
crontab -l > "$TMP/config/crontab.ubuntu.txt" 2>/dev/null || true

# --- Manifest ---------------------------------------------------------------
DB_SIZE=$(stat -c%s "$TMP/db/muebleuno.db" 2>/dev/null || echo 0)
UP_COUNT=$(find "$TMP/uploads" -type f 2>/dev/null | wc -l | tr -d ' ')
APP_COUNT=$(find "$TMP/app" -type f 2>/dev/null | wc -l | tr -d ' ')
CFG_COUNT=$(find "$TMP/config" -type f 2>/dev/null | wc -l | tr -d ' ')
COMMIT=$(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
cat > "$TMP/manifest.json" <<EOF
{
  "created_at": "$(date -Is)",
  "mode": "$MODE",
  "db_bytes": $DB_SIZE,
  "uploads_files": $UP_COUNT,
  "app_files": $APP_COUNT,
  "config_files": $CFG_COUNT,
  "app_commit": "$COMMIT",
  "hostname": "$(hostname)"
}
EOF

# --- Comprimir --------------------------------------------------------------
tar -czf "$DEST_DIR/$NAME" -C "$TMP" db uploads app config manifest.json
SIZE=$(du -h "$DEST_DIR/$NAME" | cut -f1)
log "Backup creado: $DEST_DIR/$NAME ($SIZE)"
echo "$DEST_DIR/$NAME"   # ruta del archivo creado (la consume la app)

# --- Rotación + promoción + off-site (solo daily/manual) -------------------
if [ "$MODE" != "safety" ]; then
  # Promoción a "completo" cada FULL_INTERVAL_DAYS días
  PROMOTE=1
  NEWEST_FULL=$(ls -1t "$FULL_DIR"/muebleuno-*.tar.gz 2>/dev/null | head -1 || true)
  if [ -n "$NEWEST_FULL" ]; then
    AGE_DAYS=$(( ( $(date +%s) - $(stat -c %Y "$NEWEST_FULL") ) / 86400 ))
    [ "$AGE_DAYS" -lt "$FULL_INTERVAL_DAYS" ] && PROMOTE=0
  fi
  if [ "$PROMOTE" = "1" ]; then
    cp "$DEST_DIR/$NAME" "$FULL_DIR/$NAME"
    log "Promovido a backup completo (cada $FULL_INTERVAL_DAYS días): $FULL_DIR/$NAME"
  fi

  # Retención local
  ls -1t "$DAILY_DIR"/muebleuno-*.tar.gz 2>/dev/null | tail -n +$((DAILY_KEEP + 1)) | xargs -r rm -f
  ls -1t "$FULL_DIR"/muebleuno-*.tar.gz  2>/dev/null | tail -n +$((FULL_KEEP + 1))  | xargs -r rm -f
  log "Retención local aplicada (daily=$DAILY_KEEP, full=$FULL_KEEP)"

  # Off-site a Google Drive (si rclone y el remote están configurados)
  if command -v rclone >/dev/null 2>&1 && rclone listremotes 2>/dev/null | grep -q '^gdrive:'; then
    log "Subiendo a Google Drive ($RCLONE_REMOTE)..."
    rclone copy "$DAILY_DIR" "$RCLONE_REMOTE/daily" --transfers 2 >>"$LOG" 2>&1 || log "ERROR subiendo daily a Drive"
    rclone copy "$FULL_DIR"  "$RCLONE_REMOTE/full"  --transfers 2 >>"$LOG" 2>&1 || log "ERROR subiendo full a Drive"
    # Espejar la retención de diarios en Drive
    rclone delete "$RCLONE_REMOTE/daily" --min-age $((DAILY_KEEP + 1))d >>"$LOG" 2>&1 || true
    log "Subida a Drive completada"
  else
    log "rclone/gdrive no configurado; se omite la subida off-site"
  fi
else
  # Retención de los snapshots de seguridad
  ls -1t "$SAFETY_DIR"/muebleuno-*.tar.gz 2>/dev/null | tail -n +$((SAFETY_KEEP + 1)) | xargs -r rm -f
fi

log "Backup finalizado OK ($MODE)"
