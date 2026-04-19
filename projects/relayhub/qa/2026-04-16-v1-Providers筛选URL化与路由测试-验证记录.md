# RelayHub v1 Providers 筛选 URL 化与路由测试验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-Providers筛选URL化与路由测试-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-Providers筛选URL化与路由测试-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在推进 `Providers` 筛选 URL 化与路由测试后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `Providers` 查询参数同步
- `Dashboard` / `Providers` / `Eval` 路由级自动化测试
- `Vitest + Testing Library` 最小测试基础设施

## 2. 验证方式

### 2.1 构建与测试

- 在 `projects/relayhub/console` 运行 `npm install --cache .npm-cache`
- 运行 `npm run build`
- 运行 `npm test`

### 2.2 URL 人工核对

人工核对：

- `/providers/freebridge-sandbox?kind=免费国外 API&environment=开发版`
- 筛选切换后 URL 是否同步变化
- 刷新后筛选状态是否保留

### 2.3 误导表达搜索

全文搜索以下关键词，确认仍只存在于“明确不做”语境：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

## 3. 验证结果

### 3.1 Providers URL 查询参数

结果：通过

说明：

- `kind`、`environment`、`health`、`transparency` 已可进入 URL
- 页面首次加载可从查询参数恢复筛选状态
- 更新筛选时会同步更新 URL

### 3.2 路由级自动化测试

结果：通过

说明：

- 已新增 `Dashboard` 测试
- 已新增 `Providers` 深链与筛选恢复测试
- 已新增 `Providers` 点击筛选后 URL 更新测试
- 已新增 `Providers` 详情链接保留筛选参数测试
- 已新增 `Providers?mock=error` 组合错误态测试
- 已新增 `Eval` 推荐页测试
- `npm test` 已通过，共 `14` 条测试全部通过

### 3.3 边界表达

结果：通过

说明：

- 页面仍为只读
- 测试与页面均未引入真实控制动作
- 生产边界文案未被稀释

### 3.4 构建验证

结果：通过

说明：

- `npm run build` 已通过

## 4. 当前残留风险

1. 当前测试覆盖的是路由级渲染，不包含更细的交互事件回归。
2. `Providers` 查询参数尚未覆盖 `mock=error` 这类特殊调试参数组合测试。
3. 目前测试仍在前端本地 mock API 上运行，不代表未来真实接口的集成稳定性。

## 5. 结论

当前 `RelayHub` 控制台已经支持通过 URL 分享与恢复 `Providers` 筛选状态，并具备最小核心路由回归测试能力，可作为下一阶段继续接近真实只读 API 的稳定前端基础。
