#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$BACKEND_DIR/.env"
  set +a
fi

AWS_REGION="${AWS_REGION:-ap-southeast-1}"

enable_pitr() {
  local table_name="$1"

  if [ -z "$table_name" ]; then
    return
  fi

  if ! aws dynamodb describe-table \
    --table-name "$table_name" \
    --region "$AWS_REGION" \
    >/dev/null 2>&1; then
    echo "skip missing table: $table_name"
    return
  fi

  aws dynamodb update-continuous-backups \
    --table-name "$table_name" \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region "$AWS_REGION" \
    >/dev/null

  local status
  status="$(aws dynamodb describe-continuous-backups \
    --table-name "$table_name" \
    --region "$AWS_REGION" \
    --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus' \
    --output text)"

  echo "dynamodb pitr: $table_name -> $status"
}

echo "Enabling DynamoDB point-in-time recovery..."

tables=(
  "${CHILD_PROFILES_TABLE_NAME:-${DYNAMODB_CHILD_PROFILES_TABLE:-}}"
  "${MINI_GAME_RESULTS_TABLE_NAME:-}"
  "${MINI_GAME_ITEMS_TABLE_NAME:-}"
  "${QUIZ_FALLBACK_TABLE_NAME:-}"
  "${DYNAMODB_CLASSIFICATIONS_TABLE:-}"
  "${DYNAMODB_QUIZ_HISTORY_TABLE:-}"
  "${DYNAMODB_DAILY_ACTIVITIES_TABLE:-}"
)

for table in "${tables[@]}"; do
  enable_pitr "$table"
done

bucket="${MINI_GAME_ASSET_BUCKET_NAME:-${AI_CAMERA_BUCKET_NAME:-}}"

if [ -z "$bucket" ]; then
  echo "skip s3 backup: MINI_GAME_ASSET_BUCKET_NAME or AI_CAMERA_BUCKET_NAME is required."
  exit 0
fi

echo "Enabling S3 versioning and lifecycle backup policy for bucket: $bucket"

export AI_CAMERA_BUCKET_NAME="$bucket"
"$SCRIPT_DIR/configure-ai-camera-s3-lifecycle.sh" >/dev/null

versioning_status="$(aws s3api get-bucket-versioning \
  --bucket "$bucket" \
  --region "$AWS_REGION" \
  --query 'Status' \
  --output text)"

echo "s3 versioning: $bucket -> $versioning_status"
echo "s3 lifecycle: uploads/ expires after 1 day; mini-games/trash-sort/icons/ keeps current files and expires old versions after 90 days."
