# 外部参考仓库

此目录用于存放外部参考仓库，方便学习和对比。

## 目录结构

```
external/
├── README.md                    # 本文件
├── companies/                   # paperclipai/companies 参考仓库
│   ├── README.md
│   ├── .paperclip.yaml          # 官方 companies 配置示例
│   ├── <company-1>/             # 示例公司 1
│   │   ├── COMPANY.md
│   │   ├── .paperclip.yaml
│   │   ├── agents/
│   │   └── skills/
│   └── <company-2>/             # 示例公司 2
│       └── ...
└── paperclip/                   # paperclipai/paperclip 官方仓库 (可选)
    └── ...
```

## 使用说明

### 1. 拉取参考仓库

```bash
# 进入 external 目录
cd ~/workspaces/mindsync/external

# 拉取 companies 参考仓库
git clone https://github.com/paperclipai/companies.git

# (可选) 拉取 paperclip 官方仓库
git clone https://github.com/paperclipai/paperclip.git
```

### 2. 查看和学习

```bash
# 查看 companies 目录结构
tree -L 2 companies/

# 查看某个示例公司的配置
cat companies/security-research/.paperclip.yaml

# 对比学习
# 在 VS Code 中使用 "文件对比" 功能
# 对比: mindsync/.paperclip.yaml vs companies/<company>/.paperclip.yaml
```

### 3. 参考文档

- [官方 Companies 仓库](https://github.com/paperclipai/companies)
- [官方 Paperclip 文档](https://docs.paperclip.ai)

## 学习建议

### 1. 对比学习 `.paperclip.yaml` 配置

对比官方示例和墨予镜的配置，学习最佳实践：

```bash
# 查看某个官方公司配置
cat external/companies/security-research/.paperclip.yaml

# 查看墨予镜配置
cat .paperclip.yaml

# 使用 VS Code 的对比功能
code --diff external/companies/security-research/.paperclip.yaml .paperclip.yaml
```

### 2. 学习 Agent 组织结构

查看官方示例中 Agent 的组织方式：

```bash
# 查看某个公司的 Agent 结构
tree external/companies/security-research/agents/

# 查看某个 Agent 的配置
cat external/companies/security-research/agents/threat-analyst/AGENT.md
```

### 3. 学习 Skill 设计

查看官方示例中 Skill 的设计：

```bash
# 查看某个公司的 Skill 结构
tree external/companies/security-research/skills/

# 查看某个 Skill 的配置
cat external/companies/security-research/skills/threat-intelligence/SKILL.md
```

## 注意事项

1. **不要直接修改参考仓库**：参考仓库仅供学习，不要在其中进行修改。
2. **定期更新**：定期执行 `git pull` 获取最新的参考内容。
3. **选择性借鉴**：不是所有官方设计都适合你的场景，选择性借鉴即可。

## 更新参考仓库

```bash
cd ~/workspaces/mindsync/external/companies
git pull origin main
```

---

**最后更新**: 2026-04-01
**维护者**: 墨予镜
