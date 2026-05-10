# DeepSeek V4 真实报告样本包

> fixture_id: `toc-mvp-fixture-008`  
> build_selector: `candidate:v2.2-theme-md`  
> 知识包：`aimandala-v2.2`  
> 视觉模型：`qwen-vl-max-latest`  
> 文字模型：`deepseek-v4-pro`  
> 生成日期：2026-05-10

## 文件清单

- [lite.report.md](lite.report.md)：Lite 用户可见报告与产品区块。
- [lite.process.md](lite.process.md)：Lite 中间过程链，保留每一步交付物。
- [lite.report.json](lite.report.json)：Lite API 合同输出，包含完整 `report` 正文和 `structured` 字段。
- [lite.process.json](lite.process.json)：Lite 结构化过程链。
- [lite.debug.json](lite.debug.json)：Lite QA 调试信息。
- [pro.report.md](pro.report.md)：Pro 用户可见报告与产品区块。
- [pro.process.md](pro.process.md)：Pro 中间过程链，保留每一步交付物。
- [pro.report.json](pro.report.json)：Pro API 合同输出，包含完整 `report` 正文和 `structured` 字段。
- [pro.process.json](pro.process.json)：Pro 结构化过程链。
- [pro.debug.json](pro.debug.json)：Pro QA 调试信息。

## 执行结论

本次跑通的是 `Qwen 视觉 + DeepSeek V4 文字报告` 的真实链路。Lite 和 Pro 都已返回 `error = null`，并写入完整报告正文。

DeepSeek V4 直接作为当前视觉接口调用时，官方 OpenAI-compatible 文本接口未按本地现有 `image_url` 多模态格式成功接受图片输入，返回 400。因此本次没有把 DeepSeek V4 当视觉模型使用；视觉仍使用 MVP 默认的 Qwen。

## 已修复的问题

- 文本生成请求已禁用 `thinking`，避免 DeepSeek V4 在 Pro 报告生成时长时间卡住。
- 本次 Pro 重新执行后已成功落盘。

## 初步质量观察

Lite 已能形成完整叙事和命中感，但仍有模板化痕迹，尤其是安全声明、六个核心洞察和日常小觉察的结构感偏强。

Pro 信息量明显更足，证据摘要、三圈解释、失衡诊断和根因链都有内容；但仍存在术语密度偏高、部分段落像结构字段展开、与旧版疗愈师口吻相比不够自然的问题。
