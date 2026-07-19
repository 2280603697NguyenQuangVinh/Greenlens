#!/usr/bin/env python3
"""Remove gray/white fringe borders from female model PNGs (make edges fully transparent)."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

MODEL_DIR = Path(__file__).resolve().parents[1] / "src/assets/Character/female/model"


def is_removable_background(r: int, g: int, b: int, a: int) -> bool:
    if a <= 8:
        return True

    avg = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)

    # Pure / near-white matte
    if r >= 238 and g >= 238 and b >= 238:
        return True

    # Gray fringe halo (desaturated edge pixels from export)
    if spread <= 28:
        if avg >= 200:
            return True
        if avg >= 55 and a <= 220:
            return True

    return False


def strip_border(path: Path) -> tuple[int, int]:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    px = img.load()

    removable = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def try_add(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or removable[y][x]:
            return
        r, g, b, a = px[x, y]
        if is_removable_background(r, g, b, a):
            removable[y][x] = True
            queue.append((x, y))

    for x in range(w):
        try_add(x, 0)
        try_add(x, h - 1)
    for y in range(h):
        try_add(0, y)
        try_add(w - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            try_add(nx, ny)

    changed = 0
    for y in range(h):
        for x in range(w):
            if removable[y][x]:
                r, g, b, a = px[x, y]
                if a != 0:
                    px[x, y] = (r, g, b, 0)
                    changed += 1

    img.save(path, format="PNG", optimize=True)
    return changed, w * h


def main() -> None:
    files = sorted(MODEL_DIR.glob("model_*.png"))
    if not files:
        raise SystemExit(f"No PNG files found in {MODEL_DIR}")

    total_changed = 0
    for path in files:
        changed, pixels = strip_border(path)
        total_changed += changed
        print(f"{path.name}: cleared {changed}/{pixels} px")

    print(f"Done — processed {len(files)} files, {total_changed} pixels total.")


if __name__ == "__main__":
    main()
