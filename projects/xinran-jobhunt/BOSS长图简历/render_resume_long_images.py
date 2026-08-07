#!/usr/bin/env python3
"""Render the three active Markdown resumes as mobile-friendly long images."""

from __future__ import annotations

import html
import re
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = Path(__file__).resolve().parent
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
RESUMES = (
    ("崔兴-AI产品经理简历.md", "崔兴-AI产品经理-BOSS长图.png"),
    ("崔兴-AI应用工程师简历.md", "崔兴-AI应用工程师-BOSS长图.png"),
    ("崔兴-FDE-AI解决方案工程师简历.md", "崔兴-FDE-AI解决方案工程师-BOSS长图.png"),
)


def inline_markdown(text: str) -> str:
    """Escape source text, then retain only the emphasis and URL styling we need."""
    rendered = html.escape(text)
    rendered = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", rendered)
    return re.sub(
        r"(https?://[^\s&lt;]+)",
        r'<span class="url">\1</span>',
        rendered,
    )


def markdown_to_html(source: str) -> tuple[str, str]:
    title = ""
    sections: list[str] = []
    items: list[str] = []

    def flush_items() -> None:
        nonlocal items
        if items:
            sections.append("<ol>" + "".join(items) + "</ol>")
            items = []

    for raw_line in source.splitlines():
        line = raw_line.strip()
        if not line:
            flush_items()
            continue
        if line.startswith("# "):
            title = line[2:].replace(" · 简历", "")
            continue
        if line.startswith("## "):
            flush_items()
            sections.append(f"<h2>{inline_markdown(line[3:])}</h2>")
            continue
        if line.startswith("### "):
            flush_items()
            sections.append(f"<h3>{inline_markdown(line[4:])}</h3>")
            continue
        numbered = re.match(r"\d+\.\s+(.+)", line)
        if numbered:
            items.append(f"<li>{inline_markdown(numbered.group(1))}</li>")
            continue
        if line.startswith("- "):
            flush_items()
            sections.append(f"<p class=\"bullet\">{inline_markdown(line[2:])}</p>")
            continue
        flush_items()
        sections.append(f"<p>{inline_markdown(line)}</p>")

    flush_items()
    return title, "\n".join(sections)


def render_page(title: str, body: str, output: Path) -> None:
    page = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; background: #eef2f5; }}
  body {{ color: #17212b; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }}
  .page {{ width: 1080px; min-height: 100vh; margin: 0 auto; background: #fff; padding: 0 64px 72px; }}
  header {{ margin: 0 -64px 38px; padding: 62px 64px 40px; color: #fff; background: linear-gradient(135deg, #0b3a53, #145d75); }}
  .label {{ margin-bottom: 14px; color: #bfe0eb; font-size: 20px; font-weight: 650; letter-spacing: .14em; }}
  h1 {{ margin: 0; font-size: 44px; font-weight: 750; letter-spacing: .01em; }}
  h2 {{ margin: 38px 0 18px; padding: 0 0 12px 16px; border-bottom: 2px solid #d9e5e9; border-left: 7px solid #16809d; color: #0d5067; font-size: 28px; line-height: 1.25; }}
  h3 {{ margin: 28px 0 12px; color: #183c4b; font-size: 24px; line-height: 1.45; }}
  p, li {{ font-size: 20px; line-height: 1.72; }}
  p {{ margin: 10px 0; }}
  p.bullet {{ position: relative; padding-left: 25px; }}
  p.bullet::before {{ position: absolute; left: 2px; color: #16809d; content: "•"; font-weight: 800; }}
  ol {{ margin: 8px 0 0; padding-left: 33px; }}
  li {{ margin: 7px 0; padding-left: 4px; }}
  li::marker {{ color: #16809d; font-weight: 700; }}
  strong {{ font-weight: 750; }}
  .url {{ color: #067b9e; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; word-break: break-all; }}
  footer {{ margin-top: 44px; padding-top: 18px; border-top: 1px solid #d9e5e9; color: #70818a; font-size: 15px; letter-spacing: .04em; }}
</style>
</head>
<body>
  <main class="page">
    <header><div class="label">BOSS 直聘｜附件简历</div><h1>{html.escape(title)}</h1></header>
    {body}
    <footer>崔兴｜上海｜附件简历长图</footer>
  </main>
</body>
</html>
"""
    html_path = output.with_suffix(".html")
    html_path.write_text(page, encoding="utf-8")

    # A tall viewport produces one continuous PNG rather than stitched page screenshots.
    command = [
        str(CHROME),
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=1080,16300",
        f"--screenshot={output}",
        html_path.as_uri(),
    ]
    result = subprocess.run(command, capture_output=True, text=True, timeout=45)
    if result.returncode != 0 or not output.exists():
        raise RuntimeError(result.stderr.strip() or "Chrome screenshot rendering failed")
    crop_bottom_whitespace(output)


def crop_bottom_whitespace(path: Path) -> None:
    """Remove the unused lower area of Chrome's deliberately tall viewport."""
    image = Image.open(path).convert("RGB")
    pixels = image.load()
    last_content_row = 0
    for y in range(image.height - 1, -1, -1):
        if any(pixels[x, y] != (255, 255, 255) for x in range(0, image.width, 8)):
            last_content_row = y
            break
    image.crop((0, 0, image.width, last_content_row + 1)).save(path, optimize=True)


def main() -> int:
    if not CHROME.exists():
        print(f"Chrome not found: {CHROME}", file=sys.stderr)
        return 1
    OUTPUT.mkdir(exist_ok=True)
    for source_name, image_name in RESUMES:
        source = ROOT / source_name
        title, body = markdown_to_html(source.read_text(encoding="utf-8"))
        render_page(title, body, OUTPUT / image_name)
        print(f"Rendered {image_name}")
        time.sleep(0.3)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
