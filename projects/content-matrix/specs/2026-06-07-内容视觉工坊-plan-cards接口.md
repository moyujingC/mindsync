> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-06-07
> source_of_truth：projects/content-matrix/specs/2026-06-07-内容视觉工坊-plan-cards接口.md
> 项目：内容矩阵
> 阶段：architecture
> depends_on：projects/content-matrix/specs/2026-06-07-内容视觉工坊-图片链路与排版链路分工.md

# 内容视觉工坊 `plan-cards` 接口

## 1. 目标

为“全文 -> 拆图方案”定义一个稳定接口。

当前实现形态是：

- 前端调用本地轻代理 `/api/plan-cards`
- 轻代理当前返回本地兜底规划结果
- 后续可替换为真实 LLM 拆图

## 2. 请求

`POST /api/plan-cards`

请求体：

```json
{
  "articleTitle": "在算法替你思考之前，先把判断力留下来",
  "rawText": "全文内容...",
  "styleName": "墨予镜 · 手绘知识卡",
  "cardRatio": "3:4",
  "cardWidth": 1536,
  "cardHeight": 2048
}
```

## 3. 响应

```json
{
  "provider": "local-fallback",
  "analysis": {
    "imageGenerationSource": {
      "contentKind": "full-article-text",
      "strategy": "当前使用本地规划器..."
    },
    "cardOutlineTitles": [
      "信息过载时代，判断力比知识更稀缺"
    ],
    "keyQuotes": [
      "提示词不是工作，提问才是。"
    ],
    "coverTheme": {
      "title": "判断力",
      "keywords": "判断力 / 提问 / 编辑视角"
    }
  },
  "cardPlan": [
    {
      "index": 1,
      "title": "信息过载时代，判断力比知识更稀缺",
      "summary": "当所有人都能获取同样的资料..."
    }
  ]
}
```

## 4. provider 语义

- `local-fallback`
  - 当前由本地规划器生成
- `llm`
  - 后续由真实大模型生成

前端应在界面上显示当前结果来源。

## 5. 后续替换方式

后续接真实 LLM 时，不改前端调用方式，只替换轻代理内部实现：

1. 接收请求体
2. 调真实模型
3. 按当前响应结构返回
4. 失败时退回 `local-fallback`

这样可以保证：

- 前端不需要重写
- provider 来源可见
- 本地兜底仍然保留
