# Notion《Wikis & verified pages》

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-12
> source_of_truth：projects/research-center/kb/sources/ai/2026-05-12-Notion-Wikis-and-Verified-Pages.md

## 元数据

- 主题：AI
- 来源类型：文章
- 作者：Notion
- 发布时间：未注明
- 获取时间：2026-05-12
- 原始链接或文件路径：
  - 官方帮助文档：[https://www.notion.com/help/wikis-and-verified-pages](https://www.notion.com/help/wikis-and-verified-pages)
- 可信度：高
- 处理状态：已消化

## 摘要

这篇 Notion 官方帮助文档讲的是 Notion 如何把 wiki（团队知识库）做成带 owner（负责人）和 verification（验证状态）的知识系统。它的重点不是页面编辑技巧，而是“如何让知识集中、可找、可更新”。

相比传统 wiki 只强调收纳信息，这篇文档多了一层“知识新鲜度治理”。Notion 允许页面被标记为已验证，并在验证过期后通知 owner 重新确认内容是否还有效。

## 关键摘录

- Notion 把 wiki 定义为帮助团队集中、查找和更新知识的一类页面形态。
- 一个 wiki 默认提供 `Home`、`All pages` 和 `Pages I own` 三种视图，既有内容入口，也有个人负责页视图。
- 只有 page（页面）可以被转成 wiki，database（数据库）本身不能直接转成 wiki。
- verified pages（已验证页面）会在搜索结果和 @ 提及时显示标记，向读者传递“内容已被确认仍然有效”。
- 当验证过期时，系统会通知页面 owner 重新验证。
- 如果在数据库中启用 verification 属性，系统也会自动带出 owner 属性，说明“验证”和“责任归属”在产品设计上是绑定的。

## 初步判断

这篇来源非常适合支撑“知识库不只要能写进去，还要能管理有效期和责任人”这个方向。

对很多团队来说，知识库变旧的原因不是没人会写，而是没人对“这页还准不准”负责。Notion 的这套设计很值得借鉴，尤其适合抽象成自己的知识治理约定：

1. 重要知识页应有 owner。
2. 重要知识页应有可见的新鲜度状态。
3. 过期提醒不应依赖人工记忆，最好系统化。

## 可提取 atoms

- 知识库里的重要页面应绑定 owner，否则内容过期后很难自然更新。
- “已验证”状态能显式提高知识库内容的可信度和可用性。
- 知识治理应包含有效期或复核周期，而不只是一次性发布。
- 个人负责页视图有助于把知识维护责任落实到具体人。
