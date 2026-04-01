# 墨予镜工作空间指南

> 快速导航和学习参考

---

## 🗺️ 工作空间总览

```
~/workspaces/
├── paperclip-contrib/          # Paperclip 贡献仓库（fork）
│   └── ...                      # 用于向上游提交 PR
│
├── mindsync/                   # ⭐ 墨予镜公司工作空间（本目录）
│   ├── .paperclip.yaml          # 公司核心配置
│   ├── README.md                # 工作空间说明
│   ├── CLAUDE.md                # AI 协作规则
│   ├── WORKSPACE-GUIDE.md       # ⭐ 本文件
│   ├── LEARNING-CENTER.md       # 学习中心（从参考仓库学习）
│   │
│   ├── agents/                  # 🤖 Agent 配置
│   │   ├── ceo/              # CEO
│   │   ├── cmo/                 # CMO
│   │   ├── qa/                  # QA
│   │   └── mandala-expert/      # Researcher
│   │
│   ├── projects/                # 📁 项目交付物
│   │   ├── yijingyishu/         # 一镜一梳
│   │   │   ├── docs/            # 项目文档
│   │   │   ├── design/          # 设计稿
│   │   │   ├── deliverables/    # 交付物
│   │   │   └── src/             # 🔗 子模块: ai-mandala
│   │   │
│   │   └── huaijinnwooyu/       # 怀瑾握瑜
│   │       └── ...              # 类似结构，子模块: ai-career
│   │
│   ├── shared/                  # 🔧 共享资源
│   │   ├── templates/           # 文档模板
│   │   ├── assets/              # 图片、字体等资源
│   │   └── tools/               # 工具脚本
│   │       └── sync-agents.sh   # ⭐ Agent 同步脚本
│   │
│   ├── archive/                 # 📦 归档文件
│   │
│   └── external/                # 🔗 外部参考仓库
│       └── companies/           # paperclipai/companies
│           └── ...              # 官方示例公司，供学习参考
│
└── ...                          # 其他工作目录
```

---

## 🚀 快速开始

### 每日工作流

```bash
# 1. 进入工作空间
cd ~/workspaces/mindsync

# 2. 同步最新 Agent 配置（从 Paperclip 导出）
./shared/tools/sync-agents.sh export

# 3. 拉取最新变更
git pull

# 4. 开始工作...
# 编辑文档、修改配置、添加交付物等

# 5. 提交变更
git add .
git commit -m "type(scope): description"
git push

# 6. 同步到 Paperclip（如修改了 Agent 配置）
./shared/tools/sync-agents.sh import
```

### 常用命令速查

| 命令 | 说明 |
|------|------|
| `./shared/tools/sync-agents.sh export` | 从 Paperclip 导出 Agent 配置 |
| `./shared/tools/sync-agents.sh import` | 导入 Agent 配置到 Paperclip |
| `./shared/tools/sync-agents.sh status` | 查看同步状态 |
| `git submodule update --remote` | 更新所有项目子模块 |
| `git submodule update --remote projects/yijingyishu/src` | 更新特定子模块 |

---

## 📚 学习资源

### 从官方示例学习

```bash
# 查看官方公司配置
cat external/companies/security-research/.paperclip.yaml

# 对比学习
# 使用 VS Code 的对比功能
code --diff external/companies/security-research/.paperclip.yaml .paperclip.yaml
```

### 推荐学习路径

1. **第一步**: 阅读 [LEARNING-CENTER.md](./LEARNING-CENTER.md) - 从官方示例学习的系统指南
2. **第二步**: 对比 `.paperclip.yaml` 配置 - 理解官方最佳实践
3. **第三步**: 研究 Agent 组织结构 - 学习如何组织 Agent 配置
4. **第四步**: 探索 Skill 设计 - 了解如何设计可复用的技能

---

## 🏗️ 架构核心

### 双轨分离

```
┌─────────────────────────────────────────────────────────────────┐
│                     你的工作空间                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────┐     ┌─────────────────────────┐  │
│   │  paperclip-contrib/     │     │  mindsync/              │  │
│   │  ────────────────────   │     │  ─────────────────────  │  │
│   │  Paperclip fork 仓库    │     │  墨予镜公司工作空间       │  │
│   │  用于向上游提交 PR        │     │  所有文档、配置、交付物    │  │
│   │                         │     │                         │  │
│   │  工作流:                 │     │  工作流:                 │  │
│   │  1. 修复 bug             │     │  1. export 同步配置       │  │
│   │  2. 提交到 personal      │     │  2. 修改文档/配置         │  │
│   │  3. 创建 PR 到 upstream  │     │  3. commit → push         │  │
│   │                         │     │  4. import 同步回 Paperclip│  │
│   └─────────────────────────┘     └─────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 核心设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| **Paperclip 贡献** | 独立目录 `paperclip-contrib/` | 保持与上游同步的纯净性 |
| **公司文档** | 集中目录 `mindsync/` | 所有资产统一 Git 管理 |
| **Agent 配置** | 双向同步脚本 | mindsync 作为 source of truth |
| **项目源码** | Git 子模块 | 保持独立仓库历史 |
| **参考仓库** | `external/` 目录 | 方便学习对比 |

---

## ❓ 常见问题

### Q1: 如何添加一个新的 Agent?

```bash
# 1. 在 .paperclip.yaml 中添加 Agent 配置

# 2. 创建 Agent 目录
mkdir -p agents/new-agent
cat > agents/new-agent/AGENTS.md << 'EOF'
# New Agent

## 基本信息
- **ID**: "uuid-here"
- **角色**: "role"
- **Adapter**: "claude_local"

## 职责
...
EOF

# 3. 同步到 Paperclip
./shared/tools/sync-agents.sh import
```

### Q2: 如何添加一个新的项目?

```bash
# 1. 创建项目目录结构
mkdir -p projects/new-project/{docs,design,deliverables}

# 2. 添加 README
cat > projects/new-project/README.md << 'EOF'
# New Project

## 项目链接
- **源码仓库**: ...
- **Paperclip Goal**: ...
EOF

# 3. 如需要，添加子模块
git submodule add https://github.com/... projects/new-project/src

# 4. 在 .paperclip.yaml 中添加项目配置
```

### Q3: 如何更新参考仓库?

```bash
cd ~/workspaces/mindsync/external/companies
git pull origin main

# 查看更新后的内容
ls -la
```

---

## 📞 获取帮助

- **查看详细架构**: 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md)
- **可视化架构**: 阅读 [ARCHITECTURE-visual.md](./ARCHITECTURE-visual.md)
- **学习官方示例**: 阅读 [LEARNING-CENTER.md](./LEARNING-CENTER.md)
- **AI 协作规则**: 阅读 [CLAUDE.md](./CLAUDE.md)

---

**最后更新**: 2026-04-01
**维护者**: 墨予镜
