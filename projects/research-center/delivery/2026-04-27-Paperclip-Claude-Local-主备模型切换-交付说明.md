# Paperclip claude_local 主备模型切换交付说明

## Summary

本轮将 `Paperclip` 的 `claude_local` 主链路切换为 `PPChat / gpt-5.4`，并补充 `AITechFlux / Claude混合版` 作为正式备用口径。

## Delivery Notes

- 更新了 `claude_local` 的正式配置说明
- 同步了 `Paperclip` 运行时中的主模型配置
- 明确备用链路当前为“已定义的备用配置”，不是已实现的自动回退
