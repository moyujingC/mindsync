#!/bin/bash
# init-workspace.sh - 初始化墨予镜工作空间

set -e

echo "🚀 初始化墨予镜 (MindSync) 工作空间..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查目录
WORKSPACE_DIR="$HOME/workspaces/mindsync"
if [[ ! -d "$WORKSPACE_DIR" ]]; then
    echo -e "${RED}❌ 错误: 工作空间目录不存在: $WORKSPACE_DIR${NC}"
    echo "请先创建目录: mkdir -p $WORKSPACE_DIR"
    exit 1
fi

cd "$WORKSPACE_DIR"

# 1. 初始化 Git（如果尚未初始化）
echo "📦 步骤 1/6: 初始化 Git 仓库..."
if [[ ! -d ".git" ]]; then
    git init
    echo -e "${GREEN}✅ Git 仓库已初始化${NC}"
else
    echo -e "${YELLOW}⚠️  Git 仓库已存在，跳过${NC}"
fi

# 2. 创建目录结构
echo ""
echo "📁 步骤 2/6: 创建目录结构..."

mkdir -p agents/{ceo,cmo,qa,mandala-expert}
mkdir -p projects/{yijingyishu,huaijinnwooyu}/{docs,design,deliverables}
mkdir -p shared/{templates,assets,tools}
mkdir -p archive external

echo -e "${GREEN}✅ 目录结构已创建${NC}"

# 3. 创建 Agent 初始配置
echo ""
echo "🤖 步骤 3/6: 创建 Agent 初始配置..."

# CEO (CEO)
cat > agents/ceo/AGENTS.md << 'EOF'
# CEO - CEO

## 基本信息
- **ID**: `d3d3f38e-7003-49d6-8301-825d8faf9ff8`
- **角色**: CEO
- **Adapter**: claude_local

## 职责
- 公司战略规划和决策
- 协调各 Agent 工作
- 项目进度把控
- 对外代表公司

## 记忆/上下文
- [重要决策记录](memories/decisions.md)
- [会议纪要](memories/meetings/)

## 关联
- **Reports to**: 无（最高层级）
- **Goals**: 所有公司目标
EOF

# CMO
cat > agents/cmo/AGENTS.md << 'EOF'
# CMO

## 基本信息
- **ID**: `8ee8ca86-8478-43e7-b22e-9878315a1271`
- **角色**: CMO
- **Adapter**: claude_local

## 职责
- 市场策略规划
- 品牌建设
- 内容营销
- 用户增长

## 关联
- **Reports to**: CEO
EOF

# QA
cat > agents/qa/AGENTS.md << 'EOF'
# QA

## 基本信息
- **ID**: `98779e06-b071-42c6-b6e9-ca42cf491578`
- **角色**: QA
- **Adapter**: codex_local

## 职责
- 质量保证
- 测试策略
- Bug 追踪
- 代码审查

## 关联
- **Reports to**: CEO
EOF

# 曼陀罗专家
cat > agents/mandala-expert/AGENTS.md << 'EOF'
# 曼陀罗专家

## 基本信息
- **ID**: `bae3a947-b810-476f-8a7c-ff7d85dbfe86`
- **角色**: Researcher
- **Adapter**: claude_local

## 职责
- 曼陀罗艺术研究
- 创意指导
- 内容创作
- 一镜一梳项目支持

## 关联
- **Reports to**: CEO
- **Projects**: 一镜一梳
EOF

echo -e "${GREEN}✅ Agent 配置已创建${NC}"

# 4. 创建项目 README
echo ""
echo "📋 步骤 4/6: 创建项目 README..."

# 一镜一梳
cat > projects/yijingyishu/README.md << 'EOF'
# 一镜一梳 (YiJingYiShu)

## 项目链接
- **源码仓库**：[ai-mandala](https://github.com/MindSyncHub/ai-mandala) (Git 子模块: `src/`)
- **Paperclip Goal**：[怀瑾握瑜产品化](https://paperclip.moyujing.cn/goals/8cadf9b9-969e-4d30-9c1b-2c6f8b051c02)
- **负责 Agent**：曼陀罗专家、CEO

## 文档导航
- [项目文档](./docs/)
- [设计稿](./design/)
- [交付物](./deliverables/)

## 快速开始

### 更新源码
```bash
git submodule update --remote src
```

### 查看文档
cd docs/
ls -la
```

## 里程碑

- [ ] MVP 完成
- [ ] 内测发布
- [ ] 公测发布
EOF

# 怀瑾握瑜
cat > projects/huaijinnwooyu/README.md << 'EOF'
# 怀瑾握瑜 (HuaiJinWooyu)

## 项目链接
- **源码仓库**：[ai-career](https://github.com/MindSyncHub/ai-career) (Git 子模块: `src/`)
- **Paperclip Goal**：[怀瑾握瑜产品化](https://paperclip.moyujing.cn/goals/8cadf9b9-969e-4d30-9c1b-2c6f8b051c02)
- **负责 Agent**：CEO

## 文档导航
- [项目文档](./docs/)
- [设计稿](./design/)
- [交付物](./deliverables/)

## 快速开始

### 更新源码
```bash
git submodule update --remote src
```
EOF

echo -e "${GREEN}✅ 项目 README 已创建${NC}"

# 5. 验证文件
echo ""
echo "🔍 步骤 5/6: 验证文件..."

# 检查关键文件
files=(
    "README.md"
    "CLAUDE.md"
    ".gitignore"
    "agents/ceo/AGENTS.md"
    "shared/tools/sync-agents.sh"
)

all_exist=true
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        all_exist=false
    fi
done

# 6. 首次提交
echo ""
echo "📦 步骤 6/6: 首次提交..."

if [[ "$all_exist" == true ]]; then
    git add .
    git commit -m "feat(init): initialize MindSync workspace

- Add agent configurations (CEO, CMO, QA, Mandala Expert)
- Add project structure for YiJingYiShu and HuaiJinWooyu
- Add sync script for Paperclip agent sync
- Add comprehensive README and CLAUDE.md

Refs: #init"

    echo ""
    echo -e "${GREEN}✅ 初始化完成！${NC}"
    echo ""
    echo "下一步："
    echo "  1. 在 GitHub 上创建 MindSyncHub/mindsync 仓库"
    echo "  2. 运行: git remote add origin https://github.com/MindSyncHub/mindsync.git"
    echo "  3. 运行: git push -u origin main"
    echo ""
else
    echo -e "${YELLOW}⚠️  部分文件缺失，首次提交已跳过${NC}"
fi

echo ""
echo "🎉 MindSync 工作空间已准备就绪！"
echo "   位置: $WORKSPACE_DIR"
