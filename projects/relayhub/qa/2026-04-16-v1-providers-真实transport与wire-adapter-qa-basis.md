# RelayHub v1 Providers 真实 transport 与 wire adapter QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-真实transport与wire-adapter-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-providers-真实transport与wire-adapter实施任务.md

这份文档定义 `RelayHub` 控制台在为 `Providers` 试点抽出真实 transport 与 wire adapter 时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. providers 真实试点已拆成 transport / wire adapter / facade 三层
2. transport 继续保持最小请求语义，不引入 runtime 配置
3. wire adapter 能把真实 body 占位映射成当前 payload contract
4. 页面与 service 对外接口保持不变

## 2. 验收标准

### 2.1 transport 与 adapter 落位

必须满足：

- 存在独立 transport 类型与文件
- 存在独立 collection / detail wire adapter
- `createRealProvidersReadonlyDataSource(...)` 已通过对象参数编排 transport 与 adapter

### 2.2 行为稳定

必须满足：

- `empty / not-found / filters` 语义保持不变
- transport 错误继续向上抛出
- adapter 非法 payload 会抛明确错误
- datasource 组合工厂与页面 helper 返回值不变

### 2.3 边界保持

必须满足：

- 不引入真实 API 地址
- 不引入写操作或真实控制动作
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- providers transport / wire adapter / facade 三层已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
