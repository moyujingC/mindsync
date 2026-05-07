# MVP Direct Deploy Checklist

目标环境：
- dev / prod

目标分支：
- dev -> main
- prod -> release

部署前检查：
- 最新 `mvp-release` 是否存在成功的 `push` run
- 该 run 中 `mvp-ci` 是否为绿色
- 本次部署是否明确允许复用该绿灯结果

触发动作：
- workflow: `mvp-deploy-direct`
- target:
- smoke_mode:

触发后观察：
- `verify-latest-mvp-ci`
- `mvp-deploy`
- smoke 结果

通过标准：
- direct deploy workflow 通过
- smoke 通过
- 当前环境恢复可用
