#!/usr/bin/env python3
"""将 EPUB 文件转换为 Markdown 格式并按章节拆分"""

import os
import re
from ebooklib import epub
from bs4 import BeautifulSoup

def chap_to_markdown(chapter):
    """将章节内容转换为 Markdown"""
    soup = BeautifulSoup(chapter.content, 'html.parser')

    # 提取文本
    text = soup.get_text(separator='\n', strip=True)

    # 基础清理
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text

def process_epub(epub_path, output_dir):
    """处理 EPUB 文件"""
    book = epub.read_epub(epub_path)

    # 获取书名
    title = book.get_metadata('DC', 'title')
    book_title = title[0][0] if title else "unknown"

    # 获取作者
    creator = book.get_metadata('DC', 'creator')
    author = creator[0][0] if creator else "unknown"

    print(f"书名: {book_title}")
    print(f"作者: {author}")

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 处理每个章节
    chapters = []
    for item in book.get_items():
        if item.get_type() == 9:  # EPUB_TYPE.CHAPTER
            content = chap_to_markdown(item)
            if len(content) > 100:  # 过滤掉太短的章节
                # 获取章节标题
                soup = BeautifulSoup(item.content, 'html.parser')
                heading = soup.find(['h1', 'h2', 'h3'])
                chapter_title = heading.get_text(strip=True) if heading else item.id

                chapters.append({
                    'id': item.id,
                    'title': chapter_title,
                    'content': content
                })

    print(f"找到 {len(chapters)} 个章节")

    # 保存章节
    for i, chap in enumerate(chapters, 1):
        filename = f"{i:02d}-{chap['title'][:30]}.md"
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filepath = os.path.join(output_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {chap['title']}\n\n")
            f.write(f"来源: {book_title} / {author}\n\n")
            f.write(chap['content'])

        print(f"  保存: {filename}")

    return book_title, author, len(chapters)

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("用法: python3 epub_to_md.py <epub路径> <输出目录>")
        sys.exit(1)

    epub_path = sys.argv[1]
    output_dir = sys.argv[2]

    process_epub(epub_path, output_dir)