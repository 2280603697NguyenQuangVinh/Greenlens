#!/usr/bin/env python3
import argparse
import csv
import json
import shutil
from collections import Counter, defaultdict
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
KNOWN_CLASSES = {
    "battery": "battery",
    "batteries": "battery",
    "biological": "biological",
    "brown-glass": "brown-glass",
    "brown_glass": "brown-glass",
    "cardboard": "cardboard",
    "clothes": "clothes",
    "green-glass": "green-glass",
    "green_glass": "green-glass",
    "metal": "metal",
    "paper": "paper",
    "plastic": "plastic",
    "shoes": "shoes",
    "trash": "trash",
    "white-glass": "white-glass",
    "white_glass": "white-glass",
}


def normalize_segment(value):
    return value.strip().lower().replace(" ", "-")


def class_from_path(path):
    for part in path.parts:
        normalized = normalize_segment(part)
        if normalized in KNOWN_CLASSES:
            return KNOWN_CLASSES[normalized]
    return None


def iter_images(source):
    for path in source.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            yield path


def clarity_score(path, max_side):
    from PIL import Image, ImageFilter, ImageStat

    with Image.open(path) as image:
        image.verify()

    with Image.open(path) as image:
        image = image.convert("L")
        width, height = image.size
        longest = max(width, height)
        if longest > max_side:
            scale = max_side / float(longest)
            image = image.resize((max(1, int(width * scale)), max(1, int(height * scale))))

        laplacian = image.filter(
            ImageFilter.Kernel(
                (3, 3),
                [0, 1, 0, 1, -4, 1, 0, 1, 0],
                scale=1,
                offset=128,
            )
        )
        return ImageStat.Stat(laplacian).var[0], width, height


def copy_image(source, destination_root, image_class, source_root):
    relative = source.relative_to(source_root)
    target = destination_root / image_class / relative.name
    if target.exists():
        stem = target.stem
        suffix = target.suffix
        parent_hash = abs(hash(str(relative.parent))) % 100000
        target = target.with_name(f"{stem}_{parent_hash}{suffix}")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return target


def main():
    parser = argparse.ArgumentParser(
        description="Filter blurry garbage-classification images into class folders ready for S3 upload."
    )
    parser.add_argument("--source", default="raw", help="Source directory containing the unzipped Kaggle dataset.")
    parser.add_argument("--clear-output", default="filtered/clear", help="Destination for accepted sharp images.")
    parser.add_argument("--reject-output", default="filtered/rejected_blurry", help="Destination for blurry/invalid images.")
    parser.add_argument("--manifest", default="filtered/clear-manifest.csv", help="CSV manifest path.")
    parser.add_argument("--summary", default="filtered/summary.json", help="JSON summary path.")
    parser.add_argument("--threshold", type=float, default=100.0, help="Minimum clarity score to keep an image.")
    parser.add_argument("--min-width", type=int, default=1, help="Minimum original image width.")
    parser.add_argument("--min-height", type=int, default=1, help="Minimum original image height.")
    parser.add_argument("--max-side", type=int, default=512, help="Longest side used for scoring.")
    parser.add_argument("--copy-rejected", action="store_true", help="Copy rejected images for audit.")
    args = parser.parse_args()

    base = Path(__file__).resolve().parent
    source = (base / args.source).resolve()
    clear_output = (base / args.clear_output).resolve()
    reject_output = (base / args.reject_output).resolve()
    manifest_path = (base / args.manifest).resolve()
    summary_path = (base / args.summary).resolve()

    if not source.exists():
        raise SystemExit(f"Source directory does not exist: {source}")

    rows = []
    totals = Counter()
    kept = Counter()
    rejected = Counter()
    reject_reasons = Counter()
    errors = defaultdict(list)

    for image_path in iter_images(source):
        image_class = class_from_path(image_path.relative_to(source))
        if not image_class:
            rejected["unknown"] += 1
            reject_reasons["unknown_class"] += 1
            continue

        totals[image_class] += 1
        reason = ""
        try:
            score, width, height = clarity_score(image_path, args.max_side)
            if width < args.min_width or height < args.min_height:
                reason = "too_small"
            elif score < args.threshold:
                reason = "blurry"
        except Exception as exc:
            score, width, height = 0.0, 0, 0
            reason = "invalid_image"
            errors[image_class].append(f"{image_path}: {exc}")

        if reason:
            rejected[image_class] += 1
            reject_reasons[reason] += 1
            if args.copy_rejected:
                copy_image(image_path, reject_output / reason, image_class, source)
            continue

        target = copy_image(image_path, clear_output, image_class, source)
        kept[image_class] += 1
        rows.append(
            {
                "class": image_class,
                "source_path": str(image_path.relative_to(base)),
                "output_path": str(target.relative_to(base)),
                "width": width,
                "height": height,
                "clarity_score": round(score, 3),
                "s3_key": f"datasets/garbage-classification/clear/{image_class}/{target.name}",
            }
        )

    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["class", "source_path", "output_path", "width", "height", "clarity_score", "s3_key"],
        )
        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "source": str(source),
        "clearOutput": str(clear_output),
        "threshold": args.threshold,
        "minWidth": args.min_width,
        "minHeight": args.min_height,
        "classes": sorted(set(KNOWN_CLASSES.values())),
        "totalByClass": dict(sorted(totals.items())),
        "keptByClass": dict(sorted(kept.items())),
        "rejectedByClass": dict(sorted(rejected.items())),
        "rejectReasons": dict(sorted(reject_reasons.items())),
        "manifest": str(manifest_path),
        "errors": {key: value[:10] for key, value in sorted(errors.items())},
    }
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
