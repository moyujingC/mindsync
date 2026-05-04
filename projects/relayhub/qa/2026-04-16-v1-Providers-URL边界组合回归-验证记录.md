# RelayHub v1 Providers URL 边界组合回归验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-Providers-URL边界组合回归-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-16-v1-Providers-URL边界组合回归-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在补齐 `Providers` URL 边界组合回归后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `Providers` URL 非法值回退
- `Providers` 清除筛选后的 URL 删除行为
- `mock=error` 与筛选参数共存行为
- provider 详情深链对合法筛选参数的继承

## 2. 验证方式

### 2.1 自动化验证

- 在 `projects/relayhub/console` 运行 `npm install --cache .npm-cache`
- 运行 `npm test`
- 运行 `npm run build`

### 2.2 误导表达搜索

全文搜索：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

确认命中仍只出现在“明确不提供 / 不做”的说明语境中。

## 3. 验证结果

### 3.1 查询参数回退与清洗

结果：通过

说明：

- 非法 `kind / environment / health / transparency` 会回退到 `全部`
- 在非法参数 URL 上进行合法筛选交互后，URL 会被清洗为仅包含合法参数
- 单参数场景点击 `全部` 后，URL 会回到无该参数的简洁形态

### 3.2 查询参数保留与删除

结果：通过

说明：

- 多参数场景点击某组 `全部` 后，仅删除对应参数
- `mock=error` 在筛选交互后仍保留
- provider 详情深链只继承当前合法筛选参数，不透传 `mock`

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `20` 条测试全部通过
- `routes.test.tsx` 已新增 `Providers URL` 边界组合测试
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- 页面仍是只读浏览页
- 未引入任何真实控制动作
- 生产边界与国产模型约束未被改写

## 4. 当前残留风险

1. 当前 URL 边界回归仍是路由级测试，不覆盖浏览器原生前进后退历史行为。
2. `Providers` 仍未引入更显式的非法参数清洗策略，例如首次加载即主动替换 URL。
3. 当前数据仍来自前端本地 mock，不代表未来真实 API 集成稳定性。

## 5. 结论

当前 `RelayHub` 控制台的 `Providers` 页面已经把 URL 查询参数的主流程与关键边界组合都补进自动化回归，可作为后续继续整理只读契约或接近真实 API 的稳定前端基础。
