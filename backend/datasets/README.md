# Garbage Classification Dataset

Target Kaggle dataset: `mostafaabla/garbage-classification`.

Source summary: the dataset has 15,150 household garbage images across 12 classes:

- `battery`
- `biological`
- `brown-glass`
- `cardboard`
- `clothes`
- `green-glass`
- `metal`
- `paper`
- `plastic`
- `shoes`
- `trash`
- `white-glass`

## Download

Download supports either:

- `KAGGLE_API_TOKEN` for Kaggle access tokens such as `KGAT_...`
- Kaggle CLI legacy auth via `~/.kaggle/kaggle.json` or `KAGGLE_USERNAME` + `KAGGLE_KEY`

```bash
cd backend/datasets
bash download_garbage_classification.sh
```

The script downloads and unzips the dataset into `backend/datasets/raw`.

## Filter Clear Images

Install the local image dependency:

```bash
python3 -m pip install -r backend/datasets/requirements.txt
```

Then filter blurry or invalid images:

```bash
python3 backend/datasets/filter_clear_images.py \
  --source raw \
  --clear-output filtered/clear \
  --reject-output filtered/rejected_blurry \
  --manifest filtered/clear-manifest.csv \
  --summary filtered/summary.json \
  --threshold 100
```

Output ready for S3 upload:

- `backend/datasets/filtered/clear/<class>/*`
- `backend/datasets/filtered/clear-manifest.csv`
- `backend/datasets/filtered/summary.json`

The manifest includes an `s3_key` column under:

```text
datasets/garbage-classification/clear/<class>/<filename>
```

Filtering uses variance of Laplacian. If the filter is too strict or too loose, adjust `--threshold`.
Higher values keep only sharper images.

## Upload to S3

After creating a new S3 bucket and configuring valid AWS credentials, upload the filtered dataset:

```bash
bash backend/datasets/upload_to_s3.sh --bucket <new-bucket-name>
```

Use a profile or dry run when needed:

```bash
bash backend/datasets/upload_to_s3.sh --bucket <new-bucket-name> --profile <aws-profile> --dry-run
```

The script syncs images to:

```text
s3://<new-bucket-name>/datasets/garbage-classification/clear/
```

It also uploads `clear-manifest.csv` and `summary.json` under `datasets/garbage-classification/`.

Verify the upload count:

```bash
aws s3 ls s3://<new-bucket-name>/datasets/garbage-classification/clear/ --recursive --summarize
```
