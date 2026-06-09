#!/usr/bin/env python3
import argparse
import os
import zipfile
from pathlib import Path

import requests
from kagglesdk import KaggleClient
from kagglesdk.datasets.types.dataset_api_service import ApiDownloadDatasetRequest


def download_with_access_token(owner_slug, dataset_slug, output_dir):
    request = ApiDownloadDatasetRequest()
    request.owner_slug = owner_slug
    request.dataset_slug = dataset_slug

    with KaggleClient() as client:
        redirect = client.datasets.dataset_api_client.download_dataset(request)

    zip_path = output_dir / f"{dataset_slug}.zip"
    with requests.get(redirect.url, stream=True, timeout=120) as response:
        response.raise_for_status()
        with zip_path.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)

    with zipfile.ZipFile(zip_path) as archive:
        archive.extractall(output_dir)

    return zip_path


def main():
    parser = argparse.ArgumentParser(description="Download and unzip the Kaggle garbage classification dataset.")
    parser.add_argument("--dataset", default="mostafaabla/garbage-classification")
    parser.add_argument("--output", default="raw")
    args = parser.parse_args()

    if "/" not in args.dataset:
        raise SystemExit("--dataset must be in owner/slug format")

    if not os.getenv("KAGGLE_API_TOKEN"):
        raise SystemExit("KAGGLE_API_TOKEN is required for this downloader.")

    base = Path(__file__).resolve().parent
    output_dir = (base / args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    owner_slug, dataset_slug = args.dataset.split("/", 1)
    zip_path = download_with_access_token(owner_slug, dataset_slug, output_dir)
    print(f"Downloaded and unzipped {args.dataset} into {output_dir}")
    print(f"Archive: {zip_path}")


if __name__ == "__main__":
    main()
