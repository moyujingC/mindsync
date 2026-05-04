---
name: content-grounded-transform
description: 基于真实研究、真实项目素材和真实个人边界做内容转译，不用外部拼装伪专业感。
owner: Content Lead
status: draft
version: 0.1.0
skill_type: role-specific
applies_to:
  - content
  - ceo
when_to_use: >
  当任务需要把研究、产品、实践结论转成内容角度、大纲或表达结构时使用。
inputs:
  - 研究或项目素材
  - 目标账号
outputs:
  - 内容转译结构
handoff_to:
  - content
---

# Content Grounded Transform

## 目标

确保内容专业度来自真实上游材料，而不是内容侧自行拼装外部资料。

## 执行步骤

1. 确认素材来源项目。
2. 确认发布账号归属。
3. 判断是观点、方法、主题还是转化内容。
4. 把上游素材转成：
   - 内容角度
   - 结构建议
   - 可传播论点
5. 写清不能越界补写的部分。

## 输出格式

建议基于：

- `templates/内容转译模板.md`

## 示例调用

示例：

- 输入：
  - “把 Claude Code 研究转成一篇给墨予镜个人号的 build in public 选题结构。”

## 示例产物

最小结果应类似：

- 内容角度：
  - 为什么补 skill 比继续补 prompt 更重要
- 推荐结构：
  - 问题暴露 -> 研究对象 -> 关键发现 -> 墨予镜的动作
- 需要避开的表述：
  - 伪装成官方源码真相
