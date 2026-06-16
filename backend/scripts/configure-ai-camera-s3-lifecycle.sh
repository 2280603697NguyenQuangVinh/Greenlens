#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LIFECYCLE_FILE="$SCRIPT_DIR/ai-camera-uploads-lifecycle.json"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$BACKEND_DIR/.env"
  set +a
fi

if [ -z "${AI_CAMERA_BUCKET_NAME:-}" ]; then
  echo "AI_CAMERA_BUCKET_NAME is required."
  exit 1
fi

aws s3api put-bucket-lifecycle-configuration \
  --bucket "$AI_CAMERA_BUCKET_NAME" \
  --lifecycle-configuration "file://$LIFECYCLE_FILE"

aws s3api get-bucket-lifecycle-configuration \
  --bucket "$AI_CAMERA_BUCKET_NAME"
