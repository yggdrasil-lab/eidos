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

# 3. Patch the GitHub Actions runner to use Node 24 (silences the Node 20 deprecation warning)
RUNNER_ENV_FILE=$(find /home -name '.env' -path '*/actions-runner/*' 2>/dev/null | head -n 1)
if [ -n "$RUNNER_ENV_FILE" ]; then
  if ! grep -q 'FORCE_JAVASCRIPT_ACTIONS_TO_NODE24' "$RUNNER_ENV_FILE"; then
    echo "[Info] Patching GitHub Actions runner at $RUNNER_ENV_FILE to use Node 24..."
    echo 'FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true' >> "$RUNNER_ENV_FILE"
    echo "[Info] Restarting runner service..."
    sudo systemctl restart "$(systemctl list-units --type=service | grep actions.runner | awk '{print $1}' | head -n 1)" 2>/dev/null || echo "[Warning] Could not auto-restart runner. Please restart it manually."
  else
    echo "[Info] Runner already configured for Node 24. Skipping."
  fi
else
  echo "[Warning] GitHub Actions runner .env not found. Please manually add FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true to your runner's .env file."
fi

echo "[Success] Host directories initialized."
echo "You can now safely deploy the Eidos MCP stack to the swarm."
