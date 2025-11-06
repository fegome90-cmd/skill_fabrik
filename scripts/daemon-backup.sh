#!/usr/bin/env bash
set -euo pipefail

DEST_DIR=${1:-"backups"}
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p "$DEST_DIR"

echo "[backup] Creating snapshot at $DEST_DIR/sf-backup-$TS.tar.gz"
tar -czf "$DEST_DIR/sf-backup-$TS.tar.gz" \
  packages/daemon/config \
  packages/daemon/schemas \
  obs || { echo "backup failed"; exit 1; }

echo "[backup] Done"

