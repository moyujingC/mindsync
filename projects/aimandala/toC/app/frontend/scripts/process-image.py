#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compress image assets for mobile-web while preserving transparency."
    )
    parser.add_argument("--input", required=True, help="Source image path")
    parser.add_argument("--output", required=True, help="Output image path")
    parser.add_argument(
        "--max-width",
        type=int,
        default=1024,
        help="Maximum output width, defaults to 1024",
    )
    parser.add_argument(
        "--max-height",
        type=int,
        default=1024,
        help="Maximum output height, defaults to 1024",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=92,
        help="WebP quality for lossy export, defaults to 92",
    )
    parser.add_argument(
        "--lossless",
        action="store_true",
        help="Use lossless WebP export",
    )
    parser.add_argument(
        "--trim-transparent",
        action="store_true",
        help="Trim fully transparent outer border before resizing",
    )
    parser.add_argument(
        "--skip-watermark-check",
        action="store_true",
        help="Skip default corner watermark detection/removal",
    )
    parser.add_argument(
        "--remove-checkerboard-bg",
        action="store_true",
        help="Remove light checkerboard background connected to image edges",
    )
    return parser.parse_args()


def trim_transparent(img: Image.Image) -> Image.Image:
    if "A" not in img.getbands():
        return img
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return img
    return img.crop(bbox)


def remove_corner_watermarks(img: Image.Image) -> tuple[Image.Image, list[tuple[int, int, int, int]]]:
    rgba = np.array(img)
    alpha = rgba[:, :, 3]
    mask = (alpha > 0).astype("uint8")
    num, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if num <= 1:
        return img, []

    components = []
    for idx in range(1, num):
        x, y, w, h, area = stats[idx]
        components.append(
            {
                "idx": idx,
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "area": int(area),
            }
        )

    main = max(components, key=lambda item: item["area"])
    width = rgba.shape[1]
    height = rgba.shape[0]
    max_corner_y = int(height * 0.22)
    max_corner_x = int(width * 0.28)
    min_area = max(64, int(width * height * 0.0005))

    detected: list[tuple[int, int, int, int]] = []
    for comp in components:
        if comp["idx"] == main["idx"] or comp["area"] < min_area:
            continue

        in_top_band = comp["y"] + comp["h"] <= max_corner_y
        in_left_corner = comp["x"] + comp["w"] <= max_corner_x
        in_right_corner = comp["x"] >= width - max_corner_x
        separated_from_main = comp["y"] + comp["h"] < main["y"] - int(height * 0.02)

        if in_top_band and separated_from_main and (in_left_corner or in_right_corner):
            labels_mask = labels == comp["idx"]
            rgba[labels_mask, 3] = 0
            detected.append((comp["x"], comp["y"], comp["w"], comp["h"]))

    return Image.fromarray(rgba, "RGBA"), detected


def remove_orphan_specks(img: Image.Image) -> tuple[Image.Image, list[tuple[int, int, int, int]]]:
    rgba = np.array(img)
    alpha = rgba[:, :, 3]
    mask = (alpha > 0).astype("uint8")
    num, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if num <= 1:
        return img, []

    components = []
    for idx in range(1, num):
        x, y, w, h, area = stats[idx]
        components.append(
            {
                "idx": idx,
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "area": int(area),
            }
        )

    main = max(components, key=lambda item: item["area"])
    width = rgba.shape[1]
    height = rgba.shape[0]
    main_left = main["x"] - int(width * 0.02)
    main_top = main["y"] - int(height * 0.02)
    main_right = main["x"] + main["w"] + int(width * 0.02)
    main_bottom = main["y"] + main["h"] + int(height * 0.02)
    max_area = max(16, int(width * height * 0.00002))

    removed: list[tuple[int, int, int, int]] = []
    for comp in components:
        if comp["idx"] == main["idx"] or comp["area"] > max_area:
            continue

        overlaps_main = not (
            comp["x"] + comp["w"] < main_left
            or comp["x"] > main_right
            or comp["y"] + comp["h"] < main_top
            or comp["y"] > main_bottom
        )
        if overlaps_main:
            continue

        labels_mask = labels == comp["idx"]
        rgba[labels_mask, 3] = 0
        removed.append((comp["x"], comp["y"], comp["w"], comp["h"]))

    return Image.fromarray(rgba, "RGBA"), removed


def remove_checkerboard_background(img: Image.Image) -> tuple[Image.Image, int]:
    rgba = np.array(img)
    rgb = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2HSV)
    saturation = rgb[:, :, 1]
    value = rgb[:, :, 2]

    # Light near-gray squares that touch the image edges are treated as background.
    candidate = ((saturation <= 42) & (value >= 168)).astype("uint8")
    h, w = candidate.shape

    flood = np.zeros((h + 2, w + 2), dtype="uint8")
    edge_points = []
    for x in range(w):
      edge_points.append((0, x))
      edge_points.append((h - 1, x))
    for y in range(h):
      edge_points.append((y, 0))
      edge_points.append((y, w - 1))

    for y, x in edge_points:
      if candidate[y, x]:
        cv2.floodFill(candidate, flood, (x, y), 2)

    removed_mask = candidate == 2
    rgba[removed_mask, 3] = 0
    return Image.fromarray(rgba, "RGBA"), int(removed_mask.sum())


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    img = Image.open(input_path).convert("RGBA")
    watermark_boxes: list[tuple[int, int, int, int]] = []
    speck_boxes: list[tuple[int, int, int, int]] = []
    removed_checker_pixels = 0
    if not args.skip_watermark_check:
        img, watermark_boxes = remove_corner_watermarks(img)
        img, speck_boxes = remove_orphan_specks(img)
    if args.remove_checkerboard_bg:
        img, removed_checker_pixels = remove_checkerboard_background(img)
    if args.trim_transparent:
        img = trim_transparent(img)

    img.thumbnail((args.max_width, args.max_height), Image.Resampling.LANCZOS)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    save_kwargs = {
        "format": "WEBP",
        "method": 6,
    }
    if args.lossless:
        save_kwargs["lossless"] = True
    else:
        save_kwargs["quality"] = args.quality
        save_kwargs["alpha_quality"] = 100

    img.save(output_path, **save_kwargs)
    message = (
        f"processed {input_path} -> {output_path} "
        f"({img.width}x{img.height}, {'lossless' if args.lossless else f'q={args.quality}'})"
    )
    if watermark_boxes:
        message += f" removed_watermarks={watermark_boxes}"
    else:
        message += " removed_watermarks=[]"
    if speck_boxes:
        message += f" removed_specks={speck_boxes}"
    if removed_checker_pixels:
        message += f" removed_checker_pixels={removed_checker_pixels}"
    print(message)


if __name__ == "__main__":
    main()
