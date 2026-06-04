#!/usr/bin/env python3
"""
CBT书系EPUB转Markdown脚本
处理：心理自助CBT书系（5本书）
"""
import zipfile, os, re
from html.parser import HTMLParser

EPUB_PATH = "心理自助CBT书系.epub"
OUT_DIR = "."
TEXT_DIR = "OEBPS/Text/"

class HTMLToText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip = False
        self.skip_tags = {'script', 'style', 'head', 'svg', 'image'}
    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.skip = True
        elif tag == 'br':
            self.text.append('\n')
        elif tag in ('p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr'):
            self.text.append('\n\n')
        elif tag == 'td':
            self.text.append(' | ')
        elif tag == 'span':
            pass
        else:
            pass
    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip = False
    def handle_data(self, d):
        if not self.skip:
            d = d.strip()
            if d:
                self.text.append(d)

def html_to_text(html):
    parser = HTMLToText()
    try:
        parser.feed(html)
        text = ''.join(parser.text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()
    except Exception as e:
        return f"[转换错误: {e}]"

def main():
    with zipfile.ZipFile(EPUB_PATH, 'r') as z:
        files = [f for f in z.namelist() if f.startswith(TEXT_DIR) and f.endswith('.xhtml')]
        files.sort()

        for f in files:
            fname = os.path.basename(f)
            if fname in ('cover_page.xhtml', 'part0000.xhtml', 'part0001.xhtml', 'part0002.xhtml', 'part0034.xhtml', 'part0035.xhtml', 'part0051.xhtml', 'part0052.xhtml', 'part0091.xhtml', 'part0092.xhtml', 'part0126.xhtml', 'part0127.xhtml'):
                continue
            html = z.read(f).decode('utf-8', errors='ignore')
            text = html_to_text(html)
            if len(text) > 200:
                out_path = os.path.join(OUT_DIR, fname.replace('.xhtml', '.md'))
                with open(out_path, 'w', encoding='utf-8') as out:
                    out.write(f"# Source: {fname}\n\n{text}\n")
                print(f"转换: {fname} -> {os.path.basename(out_path)} ({len(text)} chars)")

if __name__ == '__main__':
    main()