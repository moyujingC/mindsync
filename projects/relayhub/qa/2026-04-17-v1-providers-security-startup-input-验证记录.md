# 2026-04-17 v1 Providers Security Startup Input 验证记录

## 执行项

- `npm test`
- `npm run build`
- 误导表达全文搜索

## 结果

- `npm test` 通过
- `vitest` 共 4 个测试文件、313 个测试全部通过
- `src/test/consoleDataSource.test.ts` 中新增的 startup security input 相关覆盖通过
- `consoleData.test.ts`、`routes.test.tsx` 等既有回归测试继续通过
- `npm run build` 通过
- `vite build` 成功产出前端构建结果
- 误导表达全文搜索已执行
- 代码命中仍仅见于 `console/src/app/AppRoutes.tsx` 的“不提供...”语境
- 其余命中来自 `tasks/`、`qa/` 等实施/验证文档检查项，以及构建产物回显，不构成新的产品语义误导
