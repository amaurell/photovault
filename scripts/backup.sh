#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-photovault}"
DB_USER="${DB_USER:-photovault}"
DB_HOST="${DB_HOST:-localhost}"
UPLOAD_PATH="${UPLOAD_PATH:-./uploads}"
LOG_PATH="${LOG_PATH:-./logs}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

echo "Creating backup in $BACKUP_PATH..."

mkdir -p "$BACKUP_PATH"

echo "Dumping database..."
PGPASSWORD="${PGPASSWORD:-photovault}" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_PATH/database.sql"

echo "Backing up uploads..."
cp -r "$UPLOAD_PATH" "$BACKUP_PATH/uploads"

echo "Backing up logs..."
cp -r "$LOG_PATH" "$BACKUP_PATH/logs"

echo "Compressing..."
cd "$BACKUP_DIR"
tar -czf "$TIMESTAMP.tar.gz" "$TIMESTAMP"
rm -rf "$TIMESTAMP"

echo "Backup completed: $BACKUP_DIR/$TIMESTAMP.tar.gz"
