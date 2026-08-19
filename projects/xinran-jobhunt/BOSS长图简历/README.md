> 状态：current
> 版本：0.1.0
> source_of_truth：自动补齐

# BOSS 长图简历

三张 PNG 均由当前 active 附件简历生成，适合在 BOSS 直聘聊天中作为图片附件发送：

- `崔兴-AI产品经理-BOSS长图.png`
- `崔兴-AI应用工程师-BOSS长图.png`
- `崔兴-FDE-AI解决方案工程师-BOSS长图.png`

对应关系：AI 产品经理岗位发送产品版；AI 应用 / 大模型 / Agent 应用工程师岗位发送工程版；FDE（Forward Deployed Engineer，驻场交付工程师）/ AI 解决方案岗位发送 FDE 版。

如简历正文更新，在项目根目录运行：

```bash
python3 BOSS长图简历/render_resume_long_images.py
```

生成器仅重新读取以下三份 active 简历，不改动其内容：

- `崔兴-AI产品经理简历.md`
- `崔兴-AI应用工程师简历.md`
- `崔兴-FDE-AI解决方案工程师简历.md`
