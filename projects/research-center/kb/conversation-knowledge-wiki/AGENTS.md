# 对话知识库协作说明

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-10
> source_of_truth：projects/research-center/kb/conversation-knowledge-wiki/AGENTS.md

本目录用于把用户与 AI 讨论后产生的高价值内容，整理为长期可复用知识。

## Agent 默认动作

当用户说“这个也想存下来”“按知识库方式沉淀”“以后要复用”时：

1. 先判断内容处于哪个阶段：
   - `inbox`：只有线索，还没整理；
   - `source`：已有来源消化，但还不是正式知识；
   - `entry`：已经通过质量门，可长期复用；
   - `review`：正在检查是否可迁移或入库。
2. 不要把整段聊天直接放进 `entries/`。
3. 不要把 AI 自己生成的连续文本默认当成可信知识。
4. 重要判断必须写来源、适用场景和不适用场景。
5. 来自旧 `ai-product-agent-wiki` 的内容必须先写 review，再决定是否迁移。

## 写入规则

- 未确认内容进入 `inbox/`。
- 已消化来源进入 `sources/`。
- 通过质量门的知识进入 `entries/`。
- 主题索引和项目映射进入 `maps/`。
- 质量检查、迁移判断和人工确认记录进入 `reviews/`。

## Entry 规则

每个正式条目只表达一个主要结论。

条目必须写清：

- 一句话结论；
- 类型：事实 / 判断 / 方法 / 偏好 / 项目经验；
- 来源；
- 适用场景；
- 不适用场景；
- 相关项目或角色；
- review 状态。

## 旧库迁移规则

旧 `ai-product-agent-wiki` 的内容默认不可直接迁移。

允许迁移的前提：

1. 能找到原始来源；
2. 用户仍认可该判断；
3. 能说明复用场景；
4. 能写清边界；
5. 有一份 `reviews/` 下的迁移 review 记录。
