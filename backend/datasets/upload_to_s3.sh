#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash backend/datasets/upload_to_s3.sh --bucket <bucket-name> [--region <aws-region>] [--profile <aws-profile>] [--dry-run]

Uploads the filtered garbage-classification dataset to:
  s3://<bucket-name>/datasets/garbage-classification/clear/

Also uploads:
  s3://<bucket-name>/datasets/garbage-classification/clear-manifest.csv
  s3://<bucket-name>/datasets/garbage-classification/summary.json
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${REPO_BACKEND_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_BACKEND_DIR}/.env"
  set +a
fi

BUCKET=""
REGION="${AWS_REGION:-}"
PROFILE=""
DRY_RUN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)
      BUCKET="${2:-}"
      shift 2
      ;;
    --region)
      REGION="${2:-}"
      shift 2
      ;;
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="--dryrun"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "${BUCKET}" ]]; then
  echo "Missing required --bucket <bucket-name>." >&2
  usage >&2
  exit 2
fi

if [[ ! -d "${SCRIPT_DIR}/filtered/clear" ]]; then
  echo "Missing filtered dataset at ${SCRIPT_DIR}/filtered/clear." >&2
  echo "Run filter_clear_images.py first." >&2
  exit 1
fi

AWS_ARGS=()
if [[ -n "${REGION}" ]]; then
  AWS_ARGS+=(--region "${REGION}")
fi
if [[ -n "${PROFILE}" ]]; then
  AWS_ARGS+=(--profile "${PROFILE}")
fi

DEST_PREFIX="s3://${BUCKET}/datasets/garbage-classification"

aws "${AWS_ARGS[@]}" s3 sync \
  "${SCRIPT_DIR}/filtered/clear/" \
  "${DEST_PREFIX}/clear/" \
  --only-show-errors \
  ${DRY_RUN}

aws "${AWS_ARGS[@]}" s3 cp \
  "${SCRIPT_DIR}/filtered/clear-manifest.csv" \
  "${DEST_PREFIX}/clear-manifest.csv" \
  --only-show-errors \
  ${DRY_RUN}

aws "${AWS_ARGS[@]}" s3 cp \
  "${SCRIPT_DIR}/filtered/summary.json" \
  "${DEST_PREFIX}/summary.json" \
  --only-show-errors \
  ${DRY_RUN}

echo "Upload complete: ${DEST_PREFIX}/"
