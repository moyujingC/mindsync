#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
墨予镜账号目录清理：删除未发布的文章类文件，保留排版/Skill/卡片等基建。

删除范围（仅 TARGET_DIR 根目录这一层）：
  - 日期前缀的文章文件：草稿 / 成稿 / 配图版 / 公众号成品 HTML / 拆卡指令
  - 文章专属的配图目录：`*-成稿-assets`、`*-成稿-cover-assets`

保留（不动）：
  - styles/ skills/ cards/ assets/ covers/ feedback/ reference-samples/
    short-videos/ 公众号封面/ 图文出图/ 贴图文案/
  - README.md、账号定位与视觉规范.md、鹿吉祥物-配图prompt模板.md、
    公众号排版样文.md、排版测试样例、首轮选题计划、小红书选题策划、
    多平台关键词策略、成稿编辑Skill-v1、试点设计/记录 等规划与基建文件

用法：
  1. 先直接运行（DRY_RUN=True），检查输出的「将删除」清单
  2. 确认无误后，把下方 DRY_RUN 改成 False，再运行一次真正删除

注意：删除前这些文件都已提交进 git 历史，必要时可通过 git 找回。
"""

import shutil
import sys
from pathlib import Path

DRY_RUN = False

TARGET = Path("/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/accounts/墨予镜")

# 文章文件判定：日期前缀 + 草稿/成稿；或无日期但为公众号成品
ARTICLE_FILE_PATTERNS = [
    "草稿",
    "成稿",
    "公众号成品",
]
# 例外：这些日期前缀文件不是文章，明确保留
KEEP_FILES = {
    "2026-06-08-小红书求职向选题策划.md",
    "2026-06-08-长期行业观察系统-方法论内容矩阵.md",
    "2026-07-09-墨予镜文章成稿编辑Skill-v1.md",  # 含「成稿」但是 Skill 文档
    "2026-07-19-企业AI服务初访助理自用试点记录.md",
    "2026-07-19-企业AI服务初访助理试点设计.md",
    "2026-07-27-多平台关键词策略.md",
    "2026-07-28-FDE企业AI服务IP-首轮选题与表达计划.md",
    # 排版测试样例：属于 styles/skills 基建的测试产物，不是文章
    "2026-08-17-排版测试-全格式样例.md",
    "2026-08-17-排版测试-全格式样例-公众号成品-增长女黑客-橙色强调.html",
    "2026-08-17-排版测试-全格式样例-公众号成品-墨予镜-mdnice.html",
}
# 明确要删、但不匹配上面模式的文件
EXTRA_DELETE_FILES = {
    "2026-08-17-企业上AI先别急着选工具-小红书拆卡画图指令.md",
    "AI提升了效率，为何难获轻松-公众号成品.html",  # 无日期前缀的文章成品
}
# 目录名以 assets 结尾、日期前缀 → 文章配图目录
ASSETS_DIR_SUFFIX = "assets"


def is_article_file(name: str) -> bool:
    if name in KEEP_FILES:
        return False
    if name in EXTRA_DELETE_FILES:
        return True
    if not name[:10].count("-") == 2:  # 非日期前缀
        return False
    return any(p in name for p in ARTICLE_FILE_PATTERNS)


def is_article_assets_dir(name: str) -> bool:
    return name[:10].count("-") == 2 and name.endswith(ASSETS_DIR_SUFFIX)


def main() -> None:
    if not TARGET.is_dir():
        sys.exit(f"目标目录不存在：{TARGET}")
    #  Sanity check：确认没指错目录
    if not (TARGET / "README.md").exists():
        sys.exit("目录里缺少 README.md，疑似指错目录，已中止。")

    to_delete_files = []
    to_delete_dirs = []
    kept = []

    for item in sorted(TARGET.iterdir()):
        name = item.name
        if name == ".DS_Store":
            continue
        if item.is_dir():
            (to_delete_dirs if is_article_assets_dir(name) else kept).append(item)
        else:
            (to_delete_files if is_article_file(name) else kept).append(item)

    mode = "DRY-RUN（未真正删除）" if DRY_RUN else "正式删除"
    print(f"模式：{mode}\n目标：{TARGET}\n")
    print(f"== 将删除：文件 {len(to_delete_files)} 个 ==")
    for f in to_delete_files:
        print(f"  [F] {f.name}")
    print(f"\n== 将删除：目录 {len(to_delete_dirs)} 个（整目录）==")
    for d in to_delete_dirs:
        count = sum(1 for _ in d.rglob("*") if _.is_file())
        print(f"  [D] {d.name}（含 {count} 个文件）")
    print(f"\n== 保留：{len(kept)} 项 ==")
    for k in kept:
        print(f"  [KEEP] {k.name}{'/' if k.is_dir() else ''}")

    if DRY_RUN:
        print("\n以上为预览。确认无误后，把脚本里 DRY_RUN 改为 False 再运行。")
        return

    confirm = input("\n输入 yes 确认删除：").strip().lower()
    if confirm != "yes":
        sys.exit("已取消。")
    for d in to_delete_dirs:
        shutil.rmtree(d)
        print(f"已删目录：{d.name}")
    for f in to_delete_files:
        f.unlink()
        print(f"已删文件：{f.name}")
    print(f"\n完成：删除文件 {len(to_delete_files)} 个、目录 {len(to_delete_dirs)} 个。")


if __name__ == "__main__":
    main()
