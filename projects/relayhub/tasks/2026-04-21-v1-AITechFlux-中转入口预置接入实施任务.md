# RelayHub v1：AITechFlux 中转入口预置接入实施任务

## Summary

本轮目标是把 `AITechFlux` 作为新的系统预置中转入口补入 `RelayHub`，并保持前端 mock、服务端 seed、页面语义和测试口径一致。

## Tasks

1. 补齐正式 artifact
   - 新增 spec / task / qa / delivery 四份文档
   - 更新对应 `README` 索引

2. 补齐前端 mock 预置入口
   - 在 `controlPlaneData.ts` 新增 `AITechFlux 中转`
   - 填入固定 `baseUrl`、`purchaseUrl`、`modelId`
   - 补齐轻量引导字段

3. 补齐 control-plane 服务端 seed
   - 在 `seed-data.mjs` 新增同名预置入口
   - 保持和前端 mock 字段一致

4. 补齐自动化验证
   - 前端路由/UI 测试覆盖预置可见性与锁定行为
   - control-plane 测试覆盖新增条目返回和预置锁定

5. 完成回归验证
   - `control-plane npm test`
   - `console npm test`
   - `console npm run build`
