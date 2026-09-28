# 课1 全局变量登记表（治理用，build 不消费本文件）

> 状态：current
> 版本：1.0.0
> owner：assistant
> last_updated：2026-09-29
> 口径：遵循 ai-shifu-course-creator data-contracts 变量表规则——表内变量须有跨节或 Course Prompt 使用；单节内部使用的变量在表末单列。

## 跨节变量（全局表）

| name | collected_in | used_in | effect_scope |
|---|---|---|---|
| arrival_state | L01 | L01, L02, L08, L12, L13, L14, L15, L16 | cross_lesson |
| practice_background | L01 | L01, L03 | cross_lesson |
| expectation | L01 | L01, L16 | cross_lesson |
| practice_time | L04 | L04, L05 | cross_lesson |
| body_first_feeling | L05 | L05, L06 | cross_lesson |
| map_go_to | L08 | L08, L09, L10, L11 | cross_lesson |
| draw_tool | L12 | L12, L13, L15 | cross_lesson |
| practice_action | L13 | L13, L14, L15 | cross_lesson |
| current_state | L16 | L16（与 L01 的 arrival_state 对照，含第 7 项"状态变了"） | cross_lesson |
| daily_tools | L16 | L16（结课收集，课2 上线后可消费） | cross_lesson |

## 单节变量（课内分支使用，暂不跨节）

| name | collected_in | 课内用途 | 升级候选 |
|---|---|---|---|
| healing_view | L02 | 4 分支各有实质回应（零基础安抚/正常化卡点/邀请验证/避开灵丹妙药心态） | 可在课2 落地页复用为"你对自我疗愈的第一反应" |
| body_part_focus | L06 | 身体信号观察起点，课内与 body_first_feeling 互参 | 可在练习记录单第 2 次练习消费 |
| beginner_mind_reaction | L07 | 初学者心态接纳度的课内教学分支 | 暂不需要跨节 |

<!-- 本文件以下划线开头，build 的 lesson-*.md 发现规则不会拾取。 -->
