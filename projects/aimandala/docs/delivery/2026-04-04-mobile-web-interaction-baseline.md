# 一镜一梳 To C mobile-web 交互基线记录

> 状态：draft
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-mobile-web-interaction-baseline.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-frontend-baseline-delivery.md

## 1. 本轮目标

这一轮不是接真实业务接口，而是把 `mobile-web` 从“能展示骨架”继续推进到“能表达真实页面节奏”的交互基线。

重点是：

- 上传页更像手机端上传入口
- loading / report / history 的页面状态更清楚
- 本地预览模式与真实联调运行时的边界更清楚

## 2. 当前交付结果

### 2.1 上传页

当前上传页已经具备：

- 上传入口卡
- 浏览器原生选图
- 本地缩略图预览
- 示例路径回填
- 主题 / 创作意图 / 创作感受输入
- 三圈检测占位卡
- 预览模式下的“模拟三圈检测结果”动作

当前页面节奏已经收口为：

1. 先选择画作
2. 再拿到三圈建议
3. 然后才能进入当前解读流程

这一步只是预览节奏，不代表真实文件上传链路已经完成。

### 2.2 loading / report

当前 loading / report 页面已经具备：

- 结果页指标卡
- loading 进度条
- loading 阶段列表
- Lite 结构化内容卡
- 更明确的下一步动作

当前页面行为：

- `loading`
  - 可以继续查看生成进度
  - 也可以返回上传页
- `report`
  - 可以进入历史页
  - 也可以重新上传画作

### 2.3 history

当前历史页已经具备：

- 历史摘要卡
- 历史记录列表
- `全部 / 可查看 / 生成中` 筛选
- 按筛选状态变化的空态文案

这意味着历史页已经开始具备最小的信息组织能力，而不只是简单列表。

### 2.4 环境边界说明

当前手机页面本身已经能明确说明：

- 当前是否是本地预览模式
- 当前是否是联调运行时
- 当前页面中的检测、进度、报告是否来自占位数据

这一步解决的是协作时最容易混淆的问题：

- 现在看到的是“前端预览结果”
- 还是“真实 loader + 接口装配结果”

## 3. 当前仍未完成

当前仍未完成的部分包括：

- 真实文件上传接口
- 真实 `detect-circles` 前端触发链路
- loading 页真实轮询
- report 页真实数据刷新
- history 页真实筛选参数回传
- 上传、loading、report、history 之间的正式路由方案

## 4. 当前价值

这一轮最重要的价值不是“页面变漂亮了”，而是：

1. `mobile-web` 已经开始具备真实产品节奏，而不是静态骨架
2. 页面内动作开始成链
3. 预览模式与联调运行时的边界已经可见
4. 后续接真实接口时，有明确的 UI 落点和状态语义

## 5. 下一步建议

后续优先建议：

1. 把上传页的浏览器选图与真实上传接口语义对齐
2. 把 `detect-circles` 真正接到上传页动作上
3. 把 loading 页的进度条改成真实轮询状态
4. 把 report / history 逐步从 fixture 语义切到真实接口结果
