#!/bin/bash
# Eidos Host Initialization Script
# Run this script on the Linux host (Gaia) to prepare the environment before deploying the Docker stack.

echo "========================================"
echo "    Project Eidos - Host Initialization "
echo "========================================"

# 1. Create the live database directory
EIDOS_DB_DIR="${EIDOS_DB_MOUNT_PATH:-/opt/eidos/data}"
echo "[Info] Creating live database directory at: $EIDOS_DB_DIR"
sudo mkdir -p "$EIDOS_DB_DIR"
sudo chown -R $USER:$USER "$EIDOS_DB_DIR"
sudo chmod 755 "$EIDOS_DB_DIR"

# 2. Create the backup directory (managed by charon-archive)
EIDOS_BACKUP_DIR="/mnt/storage/backups/eidos"
echo "[Info] Creating backup directory at: $EIDOS_BACKUP_DIR"
sudo mkdir -p "$EIDOS_BACKUP_DIR"
sudo chown -R $USER:$USER "$EIDOS_BACKUP_DIR"
sudo chmod 755 "$EIDOS_BACKUP_DIR"

echo "[Success] Host directories initialized."
echo "You can now safely deploy the Eidos MCP stack to the swarm."
