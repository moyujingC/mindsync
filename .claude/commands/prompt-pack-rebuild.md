# prompt-pack-rebuild

手动重新打包 Aimandala 某个议题的 prompt pack，并输出打包报告与 Prompt Cache 预算信息。

适用时机：
- 疗愈体系知识库更新后，需要同步到 generated prompt pack
- 某个议题目录、报告模板或文件清单更新后，需要重新打包
- 需要检查 Prompt Cache 是否够用

默认按仓库内 `projects/research-center/skills/prompt-pack-rebuild/SKILL.md` 执行。

默认 topic：
- `wealth-relationship`

常用命令：

```bash
cd projects/aimandala/toC/app/backend
python3 scripts/build_mandala_prompt_packs.py \
  --topic wealth-relationship \
  --report-path /tmp/wealth-relationship-prompt-pack-report.md
```
