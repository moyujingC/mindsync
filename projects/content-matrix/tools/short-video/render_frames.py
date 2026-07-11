#!/usr/bin/env python3

import argparse
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


DEFAULT_FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
DEFAULT_AVATAR = "projects/content-matrix/accounts/墨予镜/assets/logo/moyujing-logo-current.png"


def resolve_path(repo_root: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else repo_root / path


def wrap_text(text: str, max_chars: int) -> str:
    normalized = " ".join(str(text).split())
    lines = []
    current = ""

    for char in normalized:
        current += char
        if len(current) >= max_chars and (char in "，。！？、；：,.!?;:" or len(current) >= max_chars + 4):
            lines.append(current.strip())
            current = ""

    if current.strip():
        lines.append(current.strip())

    return "\n".join(lines)


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, spacing: int = 10) -> tuple[int, int]:
    bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align="center")
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    width: int,
    spacing: int,
    box_fill: tuple[int, int, int, int] | None = None,
    box_padding: int = 0,
) -> None:
    text_w, text_h = text_size(draw, text, font, spacing)
    x = int((width - text_w) / 2)

    if box_fill:
        draw.rounded_rectangle(
            (x - box_padding, y - box_padding, x + text_w + box_padding, y + text_h + box_padding),
            radius=24,
            fill=box_fill,
        )

    draw.multiline_text((x, y), text, font=font, fill=fill, spacing=spacing, align="center")


def make_gradient(width: int, height: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (width, height), top)
    draw = ImageDraw.Draw(image)

    for y in range(height):
        ratio = y / max(1, height - 1)
        color = tuple(int(top[i] * (1 - ratio) + bottom[i] * ratio) for i in range(3))
        draw.line((0, y, width, y), fill=color)

    return image


def crop_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    source_w, source_h = image.size
    scale = max(target_w / source_w, target_h / source_h)
    resized = image.resize((math.ceil(source_w * scale), math.ceil(source_h * scale)), Image.Resampling.LANCZOS)
    left = int((resized.width - target_w) / 2)
    top = int((resized.height - target_h) / 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def make_circle_avatar(image: Image.Image, size: int) -> Image.Image:
    avatar = crop_cover(image.convert("RGBA"), (size, size))
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)

    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(avatar, (0, 0), mask)
    return output


def render_scene(config: dict, repo_root: Path, scene: dict, index: int, total: int, output_path: Path) -> None:
    width = int(config.get("width", 1080))
    height = int(config.get("height", 1920))
    font_file = config.get("fontFile", DEFAULT_FONT)

    title_font = ImageFont.truetype(font_file, int(config.get("titleSize", 72)))
    subtitle_font = ImageFont.truetype(font_file, int(config.get("subtitleSize", 34)))
    body_font = ImageFont.truetype(font_file, int(scene.get("fontSize", config.get("bodySize", 58))))
    cta_font = ImageFont.truetype(font_file, int(config.get("ctaSize", 42)))
    small_font = ImageFont.truetype(font_file, 30)

    image = make_gradient(width, height, (22, 32, 28), (44, 56, 49))
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rounded_rectangle((64, 120, width - 64, 420), radius=42, fill=(10, 13, 12, 98))
    draw.rounded_rectangle((70, 505, width - 70, 1068), radius=54, fill=(15, 19, 17, 132))
    draw.rounded_rectangle((64, 1328, width - 64, 1698), radius=54, fill=(12, 15, 14, 138))
    draw.rounded_rectangle((114, 1138, width - 114, 1198), radius=30, fill=(214, 247, 213, 32))

    image = Image.alpha_composite(image.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(image)

    draw_centered_text(
        draw,
        wrap_text(config["title"], int(config.get("titleMaxChars", 12))),
        int(config.get("titleY", 172)),
        title_font,
        (248, 243, 233),
        width,
        spacing=16,
    )

    if config.get("subtitle"):
        draw_centered_text(
            draw,
            config["subtitle"],
            int(config.get("subtitleY", 326)),
            subtitle_font,
            (217, 228, 230),
            width,
            spacing=8,
        )

    body = wrap_text(scene["text"], int(scene.get("maxChars", config.get("bodyMaxChars", 14))))
    draw_centered_text(
        draw,
        body,
        int(scene.get("y", config.get("bodyY", 604))),
        body_font,
        (255, 255, 255),
        width,
        spacing=22,
        box_fill=(0, 0, 0, 52),
        box_padding=28,
    )

    draw_centered_text(
        draw,
        f"{index + 1}/{total}",
        1150,
        small_font,
        (214, 247, 213),
        width,
        spacing=8,
    )

    avatar_path = resolve_path(repo_root, config.get("avatarImage", DEFAULT_AVATAR))
    avatar = make_circle_avatar(Image.open(avatar_path), int(config.get("avatarSize", 260)))
    avatar_shadow = Image.new("RGBA", avatar.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(avatar_shadow)
    shadow_draw.ellipse((0, 0, avatar.size[0], avatar.size[1]), fill=(0, 0, 0, 120))
    avatar_shadow = avatar_shadow.filter(ImageFilter.GaussianBlur(18))

    avatar_x = int((width - avatar.width) / 2)
    avatar_y = int(config.get("avatarY", 1340))
    image.alpha_composite(avatar_shadow, (avatar_x + 4, avatar_y + 12))
    image.alpha_composite(avatar, (avatar_x, avatar_y))

    if config.get("avatarLabel", "数字人头像"):
        draw_centered_text(
            draw,
            config.get("avatarLabel", "数字人头像"),
            avatar_y + avatar.height + 34,
            subtitle_font,
            (217, 228, 230),
            width,
            spacing=8,
        )

    if config.get("cta") and index == total - 1:
        draw_centered_text(
            draw,
            wrap_text(config["cta"], int(config.get("ctaMaxChars", 18))),
            int(config.get("ctaY", 1578)),
            cta_font,
            (214, 247, 213),
            width,
            spacing=12,
            box_fill=(0, 0, 0, 70),
            box_padding=20,
        )

    image.convert("RGB").save(output_path, quality=95)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--repo-root", required=True)
    args = parser.parse_args()

    repo_root = Path(args.repo_root)
    script_path = resolve_path(repo_root, args.script)
    out_dir = resolve_path(repo_root, args.out)
    frames_dir = out_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    config = json.loads(script_path.read_text(encoding="utf-8"))
    scenes = config["scenes"]

    concat_lines = []
    for index, scene in enumerate(scenes):
        frame_path = frames_dir / f"scene-{index + 1:02d}.png"
        render_scene(config, repo_root, scene, index, len(scenes), frame_path)
        concat_lines.append(f"file '{frame_path}'")
        concat_lines.append(f"duration {float(scene.get('duration', 4)):.3f}")

    concat_lines.append(f"file '{frames_dir / f'scene-{len(scenes):02d}.png'}'")
    (out_dir / "concat.txt").write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

    manifest = {
        "frames": [str((frames_dir / f"scene-{index + 1:02d}.png").relative_to(repo_root)) for index in range(len(scenes))],
        "concat": str((out_dir / "concat.txt").relative_to(repo_root)),
        "durationSeconds": sum(float(scene.get("duration", 4)) for scene in scenes),
    }
    (out_dir / "frame-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
