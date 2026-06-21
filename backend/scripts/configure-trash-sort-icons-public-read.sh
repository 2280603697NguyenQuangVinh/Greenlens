#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/.env"
  set +a
fi

REGION="${AWS_REGION:-ap-southeast-1}"
BUCKET="${MINI_GAME_ASSET_BUCKET_NAME:-${AI_CAMERA_BUCKET_NAME:-}}"
PREFIX="${MINI_GAME_ASSET_PREFIX:-mini-games/trash-sort/icons}"

if [ -z "$BUCKET" ]; then
  echo "MINI_GAME_ASSET_BUCKET_NAME or AI_CAMERA_BUCKET_NAME is required." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to configure mini game icon public read." >&2
  exit 1
fi

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false

policy_file="$(mktemp)"
existing_policy_file="$(mktemp)"
current_policy_response_file="$(mktemp)"
trap 'rm -f "$policy_file" "$existing_policy_file" "$current_policy_response_file"' EXIT

if aws s3api get-bucket-policy \
  --bucket "$BUCKET" \
  --region "$REGION" >"$current_policy_response_file" 2>/dev/null; then
  jq -r '.Policy' "$current_policy_response_file" > "$existing_policy_file"
else
  jq -n '{Version:"2012-10-17", Statement: []}' > "$existing_policy_file"
fi

jq -n \
  --slurpfile existing "$existing_policy_file" \
  --arg bucket "$BUCKET" \
  --arg prefix "$PREFIX" \
  '
    $existing[0] as $policy |
    {
      Sid: "AllowPublicReadMiniGameTrashSortIcons",
      Effect: "Allow",
      Principal: "*",
      Action: "s3:GetObject",
      Resource: ("arn:aws:s3:::" + $bucket + "/" + $prefix + "/*")
    } as $miniGameStatement |
    $policy + {
      Version: ($policy.Version // "2012-10-17"),
      Statement: (
        (($policy.Statement // []) | map(select(.Sid != "AllowPublicReadMiniGameTrashSortIcons"))) +
        [$miniGameStatement]
      )
    }' > "$policy_file"

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --policy "file://$policy_file"

echo "Public read enabled for s3://$BUCKET/$PREFIX/*"
