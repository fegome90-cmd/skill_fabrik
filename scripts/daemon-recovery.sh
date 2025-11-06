#!/usr/bin/env bash
set -euo pipefail

ARCHIVE=${1:?"Usage: $0 <backup-archive.tar.gz>"}

echo "[recovery] Restoring from $ARCHIVE"
tar -xzf "$ARCHIVE" -C . || { echo "recovery failed"; exit 1; }
echo "[recovery] Restored configs/schemas/obs from archive"

