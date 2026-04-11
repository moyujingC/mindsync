# Aimandala 知识库 v2.1 剩余整改执行计划

> 日期：2026-04-11
> 范围：`projects/aimandala/toC/app/backend`
> 目标：把知识库 `v2.1` 从“主链路已可用”推进到“可交付收尾态”

## 背景

当前 `v2.1` 的核心骨架已经具备：

- YAML pack / JSON build / runtime services 已落地
- `Layer0Assembler`、`QueryResult`、`schema_version: v2.1` 已接入主链路
- Lite / Pro / 问答上下文的知识 runtime 已贯通
- 单测与 pack 校验当前为通过状态

剩余问题不再是“有没有新知识 runtime”，而是最后一段收口工作：

1. `app/core/knowledge` 仍然偏厚，不够像“薄兼容层”
2. `/api/v2` 还缺一组面向知识库整改结果的端到端合同回归

## 执行范围

本轮只处理以下内容：

- `app/core/knowledge` 兼容层收口
- `/api/v2` 知识库相关合同回归测试
- 验证与文档回写

本轮不处理：

- 前端改造
- `routes_v2.py` 的无关并行改动
- `app/core/llm/runtime.py` 的无关并行改动
- 公司侧文档和其他项目文件

## 执行清单

- [x] 任务 1：把 `app/core/knowledge` 收成薄兼容入口
  - 提取 legacy 数据导出聚合模块
  - 提取 runtime facade 模块
  - 保持现有导出名和兼容导入路径不变

- [x] 任务 2：补齐 `/api/v2` 的知识库整改回归
  - 覆盖 `interpretations -> status -> report -> upgrade -> pro report`
  - 覆盖 `history` ready/pending 过滤合同
  - 覆盖 `report-debug` 与 `chat` 的受控行为

- [x] 任务 3：全量验证
  - `pytest -q projects/aimandala/toC/app/backend/tests/unit`
  - `python3 projects/aimandala/toC/app/backend/scripts/check_knowledge_pack_v21.py`

## 验收标准

- `app/core/knowledge/__init__.py` 不再继续承载大段 runtime 适配实现
- 旧导入路径继续可用
- 新增 API 合同回归测试通过
- 当前后端 unit 全量继续通过
- knowledge pack `v2.1` 校验继续通过

## 完成记录

- [x] 已完成，结果如下
  - `app/core/knowledge/__init__.py` 已收成兼容聚合入口
  - 新增 `legacy_exports.py` 与 `runtime_facade.py`，把 legacy 静态导出与 runtime helper 分层
  - 新增 `tests/unit/test_api_v2_report_contracts.py`，独立锁定知识库 `v2.1` 的 `/api/v2` 合同回归
  - `pytest -q projects/aimandala/toC/app/backend/tests/unit` 结果：`186 passed`
  - `python3 projects/aimandala/toC/app/backend/scripts/check_knowledge_pack_v21.py` 结果：passed
