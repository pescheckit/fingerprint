#!/bin/bash
# Deploy fingerprint API server to bingo-barry.nl
# Usage: ./deploy.sh

set -e

SERVER="ubuntu@84.235.169.30"
SSH_KEY="~/.ssh/oracle.key"
REMOTE_DIR="/var/www/html/fingerprint"

echo "Deploying fingerprint server..."

# Copy server files (exclude node_modules, db, and test files)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '*.db' \
  --exclude '*.test.js' \
  -e "ssh -i $SSH_KEY" \
  "$(dirname "$0")/" \
  "$SERVER:$REMOTE_DIR/"

# Install deps and restart
ssh -i $SSH_KEY $SERVER "cd $REMOTE_DIR && npm install --production && sudo pm2 restart fingerprint-api"

echo "Deployed! API live at https://bingo-barry.nl/fingerprint/"
