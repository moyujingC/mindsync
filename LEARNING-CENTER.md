# 墨予镜学习中心

> 从 `paperclipai/companies` 官方示例学习的系统指南

---

## 🎯 学习目标

通过对比官方示例和墨予镜的实践，掌握：
1. **公司配置标准化** - `.paperclip.yaml` 最佳实践
2. **Agent 组织结构** - 如何设计清晰的 Agent 层级
3. **Skill 可复用性** - 如何设计通用的工作流技能
4. **元数据驱动** - 如何用配置而非代码驱动行为

---

## 📚 学习路径

### 第一阶段：理解官方架构（30分钟）

#### 1.1 浏览官方仓库结构

```bash
cd ~/workspaces/mindsync/external/companies

# 查看整体结构
ls -la

# 典型输出：
# README.md
# .paperclip.yaml          ← 全局配置
# company-a/
# company-b/
# ...
```

#### 1.2 查看全局配置

```bash
# 查看顶层 .paperclip.yaml
cat .paperclip.yaml
```

**思考**：全局配置和公司级配置的关系是什么？

#### 1.3 深入一个示例公司

```bash
# 选择一个公司，比如 security-research
cd security-research

# 查看结构
ls -la

# 查看公司配置
cat COMPANY.md
cat .paperclip.yaml

# 查看 Agent 结构
ls agents/

# 查看一个 Agent 的详情
cat agents/threat-analyst/AGENT.md
```

### 第二阶段：对比学习（45分钟）

#### 2.1 对比 `.paperclip.yaml` 配置

使用 VS Code 对比功能：

```bash
# 在 VS Code 中对比
code --diff \
  ~/workspaces/mindsync/external/companies/security-research/.paperclip.yaml \
  ~/workspaces/mindsync/.paperclip.yaml
```

**对比维度**：
- [ ] 字段完整性：官方有哪些字段我没有？
- [ ] 命名规范：字段命名风格是否一致？
- [ ] 层级结构：嵌套结构是否合理？
- [ ] 元数据丰富度：描述信息是否充分？

#### 2.2 对比 Agent 组织结构

```bash
# 对比 Agent 目录结构
echo "=== 官方示例 ==="
tree ~/workspaces/mindsync/external/companies/security-research/agents/

echo "=== 墨予镜 ==="
tree ~/workspaces/mindsync/agents/
```

**对比维度**：
- [ ] 命名规范：Agent 目录命名风格
- [ ] 配置文件：AGENTS.md vs AGENT.md
- [ ] 子目录结构：memories/, prompts/ 等
- [ ] 元数据完整性：ID、角色、Adapter 等信息

#### 2.3 对比 Skill 设计

```bash
# 查看官方 Skill 结构
tree ~/workspaces/mindsync/external/companies/security-research/skills/

# 查看一个 Skill 的详情
cat ~/workspaces/mindsync/external/companies/security-research/skills/threat-intelligence/SKILL.md
```

**思考**：
- 官方 Skill 有哪些元数据？
- Skill 的目录结构是怎样的？
- 如何将 Skill 概念应用到墨予镜的 `shared/tools/`？

### 第三阶段：应用到墨予镜（60分钟）

#### 3.1 完善 `.paperclip.yaml`

基于对比学习的成果，完善墨予镜的配置：

```yaml
# 当前配置（可能需要补充的字段）
company:
  id: "6a1f17f0-f9e9-416e-bed4-0f1556a8fc33"
  name: "墨予镜"
  description: "以墨书写，以镜自照"
  # TODO: 补充其他字段，如：
  # version: "1.0.0"
  # author: "CEO"
  # tags: ["ai", "content-creation"]
  # ...

# TODO: 是否需要添加其他顶层配置？
# 例如：
# defaults:
#   adapter: "claude_local"
#
# integrations:
#   - type: "github"
#     repo: "MindSyncHub/mindsync"
```

#### 3.2 标准化 Agent 配置

为每个 Agent 创建标准化的 `AGENTS.md`：

```bash
# 为每个 Agent 创建标准结构
for agent in ceo cmo qa mandala-expert; do
  mkdir -p agents/$agent/{memories,prompts}

  # 确保 AGENTS.md 存在且格式正确
  if [[ ! -f agents/$agent/AGENTS.md ]]; then
    cat > agents/$agent/AGENTS.md << EOF
# $(echo $agent | tr '[:lower:]' '[:upper:]') - Agent 配置

## 基本信息
- **ID**: "$(cat .paperclip.yaml | grep -A 10 "name: $agent" | grep id | head -1 | awk '{print $2}')"
- **角色**: "$(echo $agent)"
- **Adapter**: "$(cat .paperclip.yaml | grep -A 10 "name: $agent" | grep adapter | head -1 | awk '{print $2}')"

## 职责
TODO: 添加职责描述

## 记忆/上下文
- [决策记录](memories/decisions.md)
- [会议纪要](memories/meetings/)

## 关联
- **Reports to**: TODO
- **Goals**: TODO
EOF
  fi
done
```

#### 3.3 创建标准化的 Skill 模板

```bash
# 创建 shared/skills/ 目录结构
mkdir -p shared/skills/{meeting-notes,document-review,decision-record}

# 为每个 Skill 创建标准模板
cat > shared/skills/meeting-notes/SKILL.md << 'EOF'
# Meeting Notes - 会议纪要技能

## 用途
快速记录和整理会议内容

## 使用场景
- 日常站会
- 项目评审会
- 决策讨论会

## 输入
- 会议主题
- 参与人
- 讨论要点

## 输出
- 结构化会议纪要
- 行动项
- 决策记录

## 模板位置
`shared/templates/meeting-notes-template.md`
EOF
```

### 第四阶段：创建展示面板（30分钟）

#### 4.1 创建公司和参考对比面板

我已经创建了 `WORKSPACE-GUIDE.md`，现在创建一个学习对比面板：

（见下方创建的 `LEARNING-CENTER.md` 文件）

---

## 🎯 下一步行动

完成以上学习后，你应该能够：

1. ✅ 理解官方设计哲学
2. ✅ 对比墨予镜和官方示例的差异
3. ✅ 完善墨予镜的配置和结构
4. ✅ 创建标准化的 Skill 和模板

## 📞 获取帮助

- 查看 [WORKSPACE-GUIDE.md](./WORKSPACE-GUIDE.md) 了解工作空间全貌
- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解架构设计
- 查看 [CLAUDE.md](./CLAUDE.md) 了解 AI 协作规则

---

**开始学习吧！** 建议按照上述四个阶段逐步进行，每个阶段完成后回顾一下学到了什么。
