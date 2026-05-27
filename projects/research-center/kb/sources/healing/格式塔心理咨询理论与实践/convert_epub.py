#!/usr/bin/env python3
"""从 EPUB 提取文本并转换为 Markdown"""

import zipfile, os, re
from html.parser import HTMLParser

EPUB_PATH = "/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/sources/healing/格式塔心理咨询理论与实践/格式塔心理咨询理论与实践.epub"
OUT_DIR = "/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/sources/healing/格式塔心理咨询理论与实践"

class HTMLToText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip = False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'head'): self.skip = True
        elif tag == 'br': self.text.append('\n')
        elif tag in ('p', 'div'): self.text.append('\n\n')
        elif tag in ('h1','h2','h3','h4','h5','h6'): self.text.append('\n\n## ')
        elif tag == 'li': self.text.append('\n- ')
        elif tag in ('b','strong','em','i'): self.text.append('**' if tag in ('b','strong') else '*')
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'head'): self.skip = False
        elif tag in ('b','strong','em','i'): self.text.append('**' if tag in ('b','strong') else '*')
    def handle_data(self, data):
        if not self.skip: self.text.append(data)
    def get_text(self):
        text = ''.join(self.text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        return text.strip()

def extract_epub(epub_path, out_dir):
    with zipfile.ZipFile(epub_path, 'r') as zf: zf.extractall(out_dir)

def convert_file(html_path, md_path):
    with open(html_path, 'r', encoding='utf-8') as f: html = f.read()
    md = convert_html_to_markdown(html)
    with open(md_path, 'w', encoding='utf-8') as f:
        fname = os.path.basename(html_path)
        f.write(f"# {fname}\n\n{md}")

def convert_html_to_markdown(html_content):
    parser = HTMLToText()
    parser.feed(html_content)
    return parser.get_text()

def main():
    extract_epub(EPUB_PATH, OUT_DIR)
    text_dir = os.path.join(OUT_DIR, 'OEBPS', 'Text')
    html_files = sorted([f for f in os.listdir(text_dir) if f.endswith('.xhtml') or f.endswith('.html')])
    print(f"找到 {len(html_files)} 个文件")
    for i, html_file in enumerate(html_files):
        html_path = os.path.join(text_dir, html_file)
        md_file = f"{i+1:02d}-{html_file.replace('.xhtml','.md').replace('.html','.md')}"
        md_path = os.path.join(OUT_DIR, md_file)
        convert_file(html_path, md_path)
        print(f"转换: {html_file} -> {md_file}")
    print(f"\n完成! 共 {len(html_files)} 个文件")

if __name__ == '__main__': main()