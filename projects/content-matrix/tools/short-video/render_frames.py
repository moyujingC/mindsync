#!/usr/bin/env python3

import argparse
import json
import math
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


def draw_left_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    spacing: int,
    shadow: bool = True,
) -> None:
    x, y = xy
    if shadow:
        draw.multiline_text((x + 4, y + 6), text, font=font, fill=(0, 0, 0, 150), spacing=spacing, align="left")
    draw.multiline_text((x, y), text, font=font, fill=fill, spacing=spacing, align="left")


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


def draw_digital_human_avatar(width: int = 236, height: int = 300) -> Image.Image:
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw.ellipse((8, 8, width - 8, width - 8), fill=(255, 250, 241, 245), outline=(255, 255, 255, 235), width=6)
    draw.ellipse((68, 54, width - 68, 166), fill=(226, 188, 160, 255))
    draw.pieslice((58, 36, width - 58, 142), 180, 360, fill=(52, 48, 44, 255))
    draw.pieslice((64, 60, 110, 152), 88, 270, fill=(52, 48, 44, 255))
    draw.pieslice((width - 110, 60, width - 64, 152), -90, 95, fill=(52, 48, 44, 255))
    draw.ellipse((91, 103, 101, 113), fill=(47, 39, 35, 255))
    draw.ellipse((width - 101, 103, width - 91, 113), fill=(47, 39, 35, 255))
    draw.arc((96, 122, width - 96, 146), 18, 162, fill=(142, 77, 70, 255), width=3)
    draw.rounded_rectangle((86, 170, width - 86, 214), radius=22, fill=(221, 184, 155, 255))
    draw.rounded_rectangle((54, 206, width - 54, height + 24), radius=66, fill=(33, 58, 54, 255))
    draw.rounded_rectangle((79, 224, width - 79, height + 10), radius=42, fill=(235, 242, 232, 255))
    draw.arc((52, 80, width - 52, 178), 190, 350, fill=(58, 170, 155, 220), width=5)
    draw.ellipse((47, 118, 64, 146), fill=(58, 170, 155, 235))
    draw.ellipse((width - 64, 118, width - 47, 146), fill=(58, 170, 155, 235))
    draw.rounded_rectangle((width - 64, 155, width - 30, 166), radius=6, fill=(58, 170, 155, 235))
    return image


def make_background(config: dict, repo_root: Path, width: int, height: int) -> Image.Image:
    background_image = config.get("backgroundImage")
    if background_image:
        source = Image.open(resolve_path(repo_root, background_image)).convert("RGB")
        image = crop_cover(source, (width, height)).filter(ImageFilter.GaussianBlur(26))
    else:
        image = make_gradient(width, height, (238, 229, 213), (48, 69, 62))

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    for y in range(height):
        ratio = y / max(1, height - 1)
        alpha = int(42 + 148 * ratio)
        overlay_draw.line((0, y, width, y), fill=(23, 33, 30, alpha))

    overlay_draw.ellipse((-220, 620, 520, 1360), fill=(242, 221, 184, 42))
    overlay_draw.ellipse((690, 140, 1320, 760), fill=(83, 180, 158, 36))
    overlay_draw.ellipse((570, 1170, 1320, 1960), fill=(17, 27, 24, 88))

    image = Image.alpha_composite(image.convert("RGBA"), overlay)
    wash = Image.new("RGBA", (width, height), (245, 237, 222, 26))
    return Image.alpha_composite(image, wash)


def draw_publishable_scene(config: dict, repo_root: Path, scene: dict, index: int, total: int, output_path: Path) -> None:
    width = int(config.get("width", 1080))
    height = int(config.get("height", 1920))
    font_file = config.get("fontFile", DEFAULT_FONT)

    eyebrow_font = ImageFont.truetype(font_file, int(config.get("eyebrowSize", 34)))
    title_font = ImageFont.truetype(font_file, int(config.get("titleSize", 58)))
    body_font = ImageFont.truetype(font_file, int(scene.get("fontSize", config.get("bodySize", 86))))
    note_font = ImageFont.truetype(font_file, int(config.get("noteSize", 34)))
    cta_font = ImageFont.truetype(font_file, int(config.get("ctaSize", 44)))

    image = make_background(config, repo_root, width, height)
    draw = ImageDraw.Draw(image)

    margin_x = 72
    draw.rounded_rectangle((margin_x, 88, margin_x + 392, 150), radius=31, fill=(255, 250, 241, 232))
    draw.text((margin_x + 28, 101), config.get("subtitle", "墨予镜 | AI 工作系统笔记"), font=eyebrow_font, fill=(31, 49, 45))

    title = wrap_text(config["title"], int(config.get("titleMaxChars", 15)))
    draw_left_text(draw, title, (margin_x, 220), title_font, (255, 250, 241), spacing=12)

    body = wrap_text(scene["text"], int(scene.get("maxChars", config.get("bodyMaxChars", 11))))
    body_y = int(scene.get("y", config.get("bodyY", 690)))
    body_box = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    body_draw = ImageDraw.Draw(body_box)
    text_w, text_h = text_size(body_draw, body, body_font, spacing=28)
    body_draw.rounded_rectangle(
        (margin_x - 28, body_y - 36, min(width - 70, margin_x + text_w + 58), body_y + text_h + 38),
        radius=36,
        fill=(14, 20, 18, 66),
    )
    image = Image.alpha_composite(image, body_box)
    draw = ImageDraw.Draw(image)
    draw_left_text(draw, body, (margin_x, body_y), body_font, (255, 255, 255), spacing=28)

    note = scene.get("note")
    if note:
        draw.rounded_rectangle((margin_x, 1126, width - 250, 1196), radius=28, fill=(255, 255, 255, 36))
        draw.text((margin_x + 24, 1144), note, font=note_font, fill=(220, 238, 226))

    avatar_size = tuple(config.get("digitalHumanSize", [236, 300]))
    if config.get("avatarImage") and not config.get("useGeneratedDigitalHuman", True):
        avatar = make_circle_avatar(Image.open(resolve_path(repo_root, config.get("avatarImage", DEFAULT_AVATAR))), avatar_size[0])
    else:
        avatar = draw_digital_human_avatar(avatar_size[0], avatar_size[1])

    avatar_x = int(config.get("avatarX", width - avatar.width - 72))
    avatar_y = int(config.get("avatarY", height - avatar.height - 284))
    shadow = Image.new("RGBA", avatar.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((12, 12, avatar.width - 12, avatar.width - 12), fill=(0, 0, 0, 116))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    image.alpha_composite(shadow, (avatar_x + 8, avatar_y + 18))
    image.alpha_composite(avatar, (avatar_x, avatar_y))

    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((margin_x, height - 230, width - 72, height - 190), radius=20, fill=(255, 255, 255, 150))
    progress_w = int((width - 144) * ((index + 1) / total))
    draw.rounded_rectangle((margin_x, height - 230, margin_x + progress_w, height - 190), radius=20, fill=(54, 180, 155, 230))

    if config.get("cta") and index == total - 1:
        cta = wrap_text(config["cta"], int(config.get("ctaMaxChars", 17)))
        draw_left_text(draw, cta, (margin_x, height - 390), cta_font, (230, 252, 230), spacing=14)

    image.convert("RGB").save(output_path, quality=95)


def render_scene(config: dict, repo_root: Path, scene: dict, index: int, total: int, output_path: Path) -> None:
    if config.get("template", "publishable") == "publishable":
        draw_publishable_scene(config, repo_root, scene, index, total, output_path)
        return

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
