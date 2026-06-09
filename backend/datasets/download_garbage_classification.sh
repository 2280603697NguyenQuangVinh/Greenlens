#!/usr/bin/env bash
set -euo pipefail

DATASET_SLUG="mostafaabla/garbage-classification"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAW_DIR="${ROOT_DIR}/raw"

mkdir -p "${RAW_DIR}"

if [[ -n "${KAGGLE_API_TOKEN:-}" ]]; then
  python3 "${ROOT_DIR}/download_garbage_classification.py" --dataset "${DATASET_SLUG}" --output raw
else
  kaggle datasets download -d "${DATASET_SLUG}" -p "${RAW_DIR}" --unzip
fi
