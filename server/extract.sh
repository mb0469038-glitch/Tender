#!/bin/sh
apk add --no-cache sqlite > /dev/null
sqlite3 /data/tender-studio.sqlite "SELECT value FROM workspace_snapshot WHERE id = 'current';" > /data/snapshot.json
echo "EXTRACT_COMPLETE"
