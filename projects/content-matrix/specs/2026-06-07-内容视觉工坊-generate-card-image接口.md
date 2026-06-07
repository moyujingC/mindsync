> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-06-07
> source_of_truth：projects/content-matrix/specs/2026-06-07-内容视觉工坊-generate-card-image接口.md
> 项目：内容矩阵
> 阶段：architecture
> depends_on：projects/content-matrix/specs/2026-06-07-内容视觉工坊-plan-cards接口.md

# 内容视觉工坊 `generate-card-image` 接口

## 1. 目标

为单张知识卡片生成真实图片。

当前实现形态：

- 前端调用本地轻代理 `/api/generate-card-image`
- 轻代理调用 aitechflux 的 OpenAI 兼容图片接口
- 当前图片模型：`gpt-image-2`

## 2. 请求

`POST /api/generate-card-image`

请求体：

```json
{
  "title": "判断力比知识更稀缺",
  "summary": "信息过载时代，在一堆正确答案里挑出最适合此刻的那一个，才是真正的稀缺能力。",
  "styleName": "墨予镜 · 手绘知识卡",
  "ratio": "3:4",
  "width": 1536,
  "height": 2048
}
```

## 3. 响应

```json
{
  "provider": "image-model",
  "imageUrl": "http://.../image.png",
  "prompt": "请为一张中文知识卡片生成图片..."
}
```

## 4. 当前实现说明

- 当前 prompt（提示词）由服务端本地模板拼装
- 当前返回 `imageUrl`
- 若底层返回 base64，则服务层会转成 data URL（数据地址）回前端

## 5. 后续扩展

后续可继续补：

1. 批量生成整组卡片
2. 公众号封面生成
3. 小红书封面生成
4. 更强的风格模板系统
5. 图像失败自动重试和审查降级策略
