# 一镜一梳 To C 双端共享 UI QA 基线

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-dual-channel-shared-ui-qa-basis.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-dual-channel-shared-ui-implementation-plan.md
> reviewers：CEO / Orchestrator, Engineer

## 1. 目标行为

1. 报告页和历史页主体可以由 shared UI 承接
2. `mobile-web` 页面行为不退化
3. `miniapp` 已有正式入口骨架，不再只是 `export * from "../shared"`
4. 双端后续可以围绕同一组共享展示组件继续开发

## 2. 当前检查点

1. shared UI 不依赖浏览器文件上传
2. shared UI 不依赖 Web 路由
3. shared UI 可以被 Web 页面和 miniapp 页面壳同时引用
4. shared UI 渲染后的关键文案与结构不退化
5. `mobile-web` 现有测试与构建命令继续通过

## 3. 当前测试矩阵

### 3.1 自动化

- `npm test`
- `npm run typecheck`
- `npm run build:mobile-web`

### 3.2 结构性验证

- shared UI 单测
- `mobile-web` 报告页渲染回归
- `mobile-web` 历史页渲染回归
- miniapp 预览壳静态渲染

## 4. 当前风险

1. 共享 UI 仍保留了部分 `mobile-web` 样式契约
2. miniapp 当前仍是正式骨架，不是真实微信运行时
3. 统一身份与支付链路尚未进入本批实现
