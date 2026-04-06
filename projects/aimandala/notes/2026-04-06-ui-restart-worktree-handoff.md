# 一镜一梳 UI Restart Worktree Handoff

> 状态：draft
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-06
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/notes/2026-04-06-ui-restart-worktree-handoff.md
> 项目：aimandala
> 阶段：handoff
> handoff_from：`/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart`
> handoff_branch：`codex/aimandala-ui-restart`

## 1. 这份 handoff 的目的

这份 handoff 用于把 `codex/aimandala-ui-restart` 里的阶段性进展，交还到当前 `mindsync` 主工作区，方便新窗口直接续上。

当前结论：

1. 代码级改动仍主要留在独立 worktree
2. 本次 handoff 先回收上下文，不直接把代码强行 merge 到当前 `main`
3. 原因不是功能冲突，而是当前 `/Users/xinran/Downloads/dev/mindsync` 工作树本身已有大量其他方向改动，直接合并风险高
4. 用户已说明这些大量改动大多不是 `一镜一梳` 当前项目内容，因此后续应按“选择性合回”而不是“整树混合”处理

## 2. 当前 UI 重启线的核心方向

本轮已经明确，`Upload` 页不再做“近似重写”，而是回到：

- 以原版组件为权威来源
- 按组件逐块搬运
- 视觉优先对齐
- 交互行为尽量与原版一致

原版参考源主要是：

1. `/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/UploadPage.tsx`
2. `/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ThreeCirclesPreview.tsx`
3. `/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ThemeSelector.tsx`
4. `/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/TextInputField.tsx`
5. `/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/BottomPanel.tsx`
6. `/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/NavigationBar.tsx`

## 3. 在 worktree 中已完成的主要成果

### 3.1 Upload 与校准主链路

1. `Upload` 页圆盘材质已明显回到原版方向
2. 中心多余小圈已移除
3. CTA 按钮结构已回到原版布局，不再维持自写偏移修正
4. 输入框交互已改回“点击展开编辑”的原版行为
5. 主题卡片已恢复横向滑动、分页点状态、主题按钮点击
6. 全屏校准页已恢复拖动、缩放等基础操作
7. 全屏校准页顶部两行提示文字已调整，并回填到更接近目标样式
8. 校准完成后，上传页圆盘中的画作显示已按“先取校准页圆内结果，再做圆形归一化”的思路修正
9. 上传页中的画作已进一步放大，使其更贴近圆盘边界

### 3.2 页面流转与状态

1. 从上传页重新点圆盘时，已修正为重新进入系统选图链路，而不是直接跳校准页
2. 在全屏校准页点返回时，目标应是回到“选择图片”系统弹窗语义，而不是回上传页
3. `Loading` 页已接回
4. 报告入口流程已调整为 `Lite` / `Pro` 并列选择，而不是旧的升级关系
5. 手机上报告入口页采用“上 Lite、下 Pro”的竖向结构
6. 用户确认生成后才进入“生成中”页面

### 3.3 报告阅读

1. `Lite` 与 `Pro` 报告已先按旧版内容方向接回当前框架
2. `Pro` 报告的 Markdown 渲染问题已修复，不再是原始 Markdown 文本直出
3. 历史记录打开报告的链路已补齐，保证 `Pro` 记录能正确进入对应页面
4. `Report` 页的最终视觉还未定稿，用户计划先在 Figma Make 里重新设计，再回到代码复刻

### 3.4 文档沉淀

worktree 内已新增或更新以下正式文档：

1. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/docs/decisions/2026-04-06-用户分群与产品矩阵决策.md`
2. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/docs/specs/2026-04-06-产品矩阵-目标用户与最小交付单元.md`
3. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/docs/specs/2026-04-06-报告产品-用户任务定义.md`
4. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/docs/specs/2026-04-06-当前两份报告内容评估.md`

这些文档已经把此前关于：

- 用户分群
- 产品矩阵
- AI 与真人支持边界
- 报告不是只能锁死成 `Lite / Pro`
- 当前阶段先保持主题体系内外一致

等关键决策记录了下来。

## 4. worktree 中的关键代码文件

如果下一窗口继续写代码，最关键的文件仍是这些：

1. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/upload-page.tsx`
2. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/loading-page.tsx`
3. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/report-entry-page.tsx`
4. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/report-page-legacy.tsx`
5. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/pro-report-page.tsx`
6. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/runtime.tsx`
7. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/browser-shell.tsx`
8. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/styles.css`

## 5. 已验证结果

在 worktree 中，最近一轮关键验证包括：

1. `npm run typecheck`
2. `npm run build:mobile-web`

这两项在最近的 UI / 报告改动后已通过。

## 6. 当前仍然成立的产品口径

这部分是为了避免下一窗口又绕回旧逻辑：

1. 不要再被原来的 `Lite 升级到 Pro` 关系绑住
2. 当前可以先保留 `Lite / Pro` 作为页面与内容形态，但长期产品不必只剩两档
3. 报告设计应围绕用户任务，而不是先围绕既有价格
4. 当前主题体系先保持与知识库支持一致，不在这轮大改内外两套主题
5. 曼陀罗产品不是纯解读产品，后续产品矩阵必须同时考虑：
   - 账号内容
   - 陪你画 / 共修营
   - 报告
   - 主题方案
   - 21 天定制方案

## 7. 对下一位的直接建议

如果下一位是在新窗口继续推进，建议按这个顺序：

1. 继续在 `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart` 工作，不要先切回当前 `main`
2. 如需回收代码到主工作区，优先做“按项目选择性合回”，不要直接把当前脏的 `main` 全量混合
3. 若要合回，先以 `projects/aimandala/` 为边界看差异，不要被其他不相关改动干扰
4. 报告页视觉细化暂缓，等用户从 Figma Make 带回设计稿后再复刻
5. 当前最值得继续的是：
   - 收口 Upload / Loading / Report Entry / Report 阅读这条主链路
   - 让旧版报告内容与当前框架更稳地缝合
   - 后续再补报告视觉统一

## 8. 本次 handoff 没有做的事

1. 没有在当前 `main` 上执行 merge
2. 没有执行 rebase
3. 没有清理或回退当前主工作区的其他改动
4. 没有碰只读分支 `codex/aimandala-deploy-jingshu-cc`

## 9. 一句话接力口径

如果要在新窗口快速接上，可以直接用这句：

**继续沿用 `原版搬运 + 当前框架缝合` 的方式，在 `codex/aimandala-ui-restart` worktree 上推进 `一镜一梳` mobile-web 主链路；主工作区先只接收 handoff，不直接混入代码。**
