#!/usr/bin/env python3
import argparse
from datetime import datetime
from pathlib import Path


def parse_image(value: str) -> tuple[Path, str, str]:
    parts = value.split("::")
    if len(parts) not in (1, 2, 3):
        raise argparse.ArgumentTypeError("--image must be 'path::label::note'")
    path = Path(parts[0]).expanduser().resolve()
    label = parts[1].strip() if len(parts) >= 2 and parts[1].strip() else path.stem
    note = parts[2].strip() if len(parts) == 3 else ""
    return path, label, note


def main() -> None:
    parser = argparse.ArgumentParser(description="Write a WeChat cover manifest.")
    parser.add_argument("--article-title", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--selected", type=int, default=None, help="1-based selected candidate index")
    parser.add_argument("--provider", default="", help="Generation provider/model if known")
    parser.add_argument("--image", action="append", default=[], type=parse_image)
    args = parser.parse_args()

    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    lines = [
        f"# 公众号封面 Manifest",
        "",
        f"- 文章标题：{args.article_title}",
        f"- 生成时间：{datetime.now().isoformat(timespec='seconds')}",
        f"- 尺寸目标：900×383；小封面从中心裁切 383×383",
        f"- 选中候选：{args.selected if args.selected else '未选择'}",
    ]
    if args.provider:
        lines.append(f"- 生成模型/服务：{args.provider}")
    lines.extend(["", "## 候选封面", ""])

    for index, (path, label, note) in enumerate(args.image, start=1):
        exists = "yes" if path.exists() else "no"
        lines.append(f"{index}. {label}")
        lines.append(f"   - path: `{path}`")
        lines.append(f"   - exists: {exists}")
        if note:
            lines.append(f"   - note: {note}")

    manifest = output_dir / "wechat-cover-manifest.md"
    manifest.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(manifest)


if __name__ == "__main__":
    main()
