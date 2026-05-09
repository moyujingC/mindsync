# 三圈五行流派方法链演练过程记录

> fixture_id: `toc-mvp-fixture-008`
> 样本图：`projects/aimandala/fixtures/toc-mvp/assets/IMG_5079.jpeg`
> 主题：`general` / 通用解读
> 演练日期：2026-05-09
> 方法依据：`projects/aimandala/docs/sources/知识库构建/三圈五行流派解读方法与步骤.md`
> 执行方式：离线方法链演练，复用既有 Qwen-VL 视觉评测结果，不新增外部 API 调用，不实际生成文生图。

## 执行说明

本次不是生产流水线输出，而是按当前“三圈五行流派解读方法与步骤”手工跑通一版 QA 样稿。

复用的视觉来源：

- `projects/aimandala/docs/qa/model-evals/2026-05-06-vision-stability/round-001/qwen-vl/toc-mvp-fixture-008.json`

本次新增过程交付物：

- `stage-00-input-context`
- `stage-01-user-input-context`
- `stage-02-circle-boundary-decision`
- `stage-03-visual-evidence`
- `stage-04-direct-judgment-high-hit-check`
- `stage-05-per-circle-color-shape-element-sensing`
- `stage-06-per-circle-element-generation-control`
- `stage-07-per-circle-imbalance-patterns`
- `stage-08-energy-flow-diagnosis`
- `stage-09-evidence-consolidation`
- `stage-10-core-thesis-selection`
- `stage-11-user-facing-framing`
- `stage-12-healing-direction-and-report-branching`
- `stage-13-lite-draft`
- `stage-14-pro-draft`
- `stage-15-visual-assets`
- `stage-16-final-report`

## Stage 00: 运行上下文

```json
{
  "stage": "stage-00-input-context",
  "run_id": "2026-05-09-three-circle-five-elements-method/toc-mvp-fixture-008",
  "fixture_id": "toc-mvp-fixture-008",
  "method_version": "三圈五行流派解读方法与步骤.md@2026-05-09",
  "knowledge_sources": [
    "直断法高命中模式.md",
    "颜色五行感知规则.md",
    "形状五行感知规则.md",
    "五行生克与失衡模式.md",
    "三圈语义与能量流动.md",
    "主题知识与疗愈映射.md",
    "报告语言风格规范.md",
    "报告可视化规范.md"
  ],
  "model_usage": {
    "vision_reused_from_existing_eval": true,
    "new_external_model_calls": false,
    "image_generation_executed": false
  }
}
```

## Stage 01: 用户输入与解读上下文

```json
{
  "stage": "stage-01-user-input-context",
  "image_path": "fixtures/toc-mvp/assets/IMG_5079.jpeg",
  "theme": "general",
  "theme_label": "通用解读",
  "painting_intention": "观察画面结构与三圈边界",
  "painting_feeling": "保持开放观察",
  "required_inputs_complete": true,
  "optional_inputs_present": true
}
```

说明：本次主题为通用解读，因此后续主题映射落在自我认知、情绪平衡、生命能量和成长方向，不映射到财富事业或亲密关系等专属主题。

## Stage 02: 三圈边界锁定

```json
{
  "stage": "stage-02-circle-boundary-decision",
  "boundary_source": "fixture/eval default calibrated image",
  "inner": "中心花瓣结构、浅蓝几何框与粉色内环附近",
  "middle": "向外扩展的黄绿叶状结构、蓝色矩形框和四向几何结构",
  "outer": "浅蓝外场、粉色外环、紫色圆点、星形和外缘装饰",
  "locked": true
}
```

说明：本次以脱敏 fixture 的校准图为准，不重新调整三圈边界。

## Stage 03: 视觉证据

来源：既有 Qwen-VL 结果 + 本次人工复核原图。

```json
{
  "stage": "stage-03-visual-evidence",
  "global_summary": "画面呈高度对称的几何曼陀罗结构，中心为黄绿花瓣状图案，周围有浅蓝、粉色、黄色、绿色、紫色和橙色元素。整体中心感明确，层次清楚，重复和放射结构稳定。",
  "circles": {
    "inner": {
      "colors": ["黄色", "黄绿色", "浅蓝色", "粉色"],
      "shapes": ["花瓣状", "圆弧", "方形几何框", "放射状中心"],
      "visible_notes": ["中心花瓣对称", "浅蓝几何框形成明显边界", "粉色环带包裹中心外侧"]
    },
    "middle": {
      "colors": ["黄色", "绿色", "浅蓝色", "粉色", "橙色"],
      "shapes": ["叶状重复", "方形边框", "星形", "四向对称"],
      "visible_notes": ["黄绿色叶片向外扩展", "蓝色矩形框和深色线条形成秩序感", "星形点缀带来外放感"]
    },
    "outer": {
      "colors": ["浅蓝色", "粉色", "紫色", "蓝色", "黄色"],
      "shapes": ["外环", "圆点", "星形花饰", "矩形块", "格子"],
      "visible_notes": ["外圈浅蓝成片", "粉色外环清晰", "紫色圆点规律分布", "四角有重复装饰组合"]
    }
  },
  "evidence_digest": [
    "整体高度对称，中心感明确。",
    "蓝色和绿色同时出现，且分布明显。",
    "外圈有紫色圆点、星形和花饰状装饰。",
    "方形、矩形、格子和深色线条形成强结构边界。",
    "黄绿叶片从中心向中外圈重复扩展。",
    "外圈粉色环和浅蓝场域形成清晰保护边界。"
  ],
  "uncertainties": [
    "三圈边界为演练口径，非本次重新测量的精确半径。",
    "颜色深浅为人工视觉判断，未做像素级统计。"
  ]
}
```

## Stage 04: 直断法双路命中检查

```json
{
  "stage": "stage-04-direct-judgment-high-hit-check",
  "vision_result": [
    {
      "mode": "蓝绿搭配",
      "hit_strength": "full_hit",
      "visible_evidence": ["画面中浅蓝色外场、蓝色矩形块和绿色/黄绿色叶状结构同时清楚出现"]
    },
    {
      "mode": "外圈花边、星星点点",
      "hit_strength": "full_hit",
      "visible_evidence": ["外圈有紫色圆点、星形、四角花饰和细碎装饰"]
    },
    {
      "mode": "渐变色",
      "hit_strength": "partial_hit",
      "visible_evidence": ["彩铅涂色局部有深浅过渡，但不是明确设计成连续渐变"]
    }
  ],
  "program_match_result": [
    {
      "mode": "蓝绿搭配",
      "hit_strength": "full_hit",
      "matched_terms": ["蓝色", "绿色"]
    },
    {
      "mode": "外圈花边、星星点点",
      "hit_strength": "full_hit",
      "matched_terms": ["外圈", "紫色圆点", "星形", "装饰"]
    },
    {
      "mode": "大面积黄色",
      "hit_strength": "partial_hit",
      "matched_terms": ["黄色面积较多，但不是全画绝对主色"]
    }
  ],
  "cross_validation": [
    {
      "mode": "蓝绿搭配",
      "result": "consistent",
      "handling": "进入强证据，但在 general 主题下只作为表达、流动和关系感知的线索，不直接套财富或口才结论。"
    },
    {
      "mode": "外圈花边、星星点点",
      "result": "consistent",
      "handling": "进入强证据，但在 general 主题下转为外在注意力分散、边缘能量外散或装饰性表达线索。"
    },
    {
      "mode": "渐变色",
      "result": "vision_only_weak",
      "handling": "保留为弱证据，不进入核心主轴。"
    },
    {
      "mode": "大面积黄色",
      "result": "program_only_partial",
      "handling": "黄色明显但不单独主导全画，作为土元素候选，不作为直断核心。"
    }
  ]
}
```

## Stage 05: 逐圈颜色、形状五行感知映射

```json
{
  "stage": "stage-05-per-circle-color-shape-element-sensing",
  "per_circle": {
    "inner": {
      "color_elements": ["土: 黄色", "木: 黄绿色", "水: 浅蓝色", "火: 粉色"],
      "shape_elements": ["金: 圆弧/环形", "土: 方形几何框", "木: 花瓣向外生长"],
      "dominant_tendency": "木、土、水并存，土和金提供边界，木提供生长感",
      "strength": "中等偏稳",
      "evidence_refs": ["中心黄绿花瓣", "浅蓝方形框", "粉色环带"]
    },
    "middle": {
      "color_elements": ["木: 绿色/黄绿色", "土: 黄色", "水: 浅蓝/蓝色", "火: 橙色/粉色星形"],
      "shape_elements": ["木: 叶状重复", "土: 方形/矩形结构", "火: 星形", "金: 环绕结构"],
      "dominant_tendency": "木的生长感明显，但被方形土结构和蓝色水场承接",
      "strength": "稳定但带结构约束",
      "evidence_refs": ["中圈黄绿叶片", "四向蓝色矩形框", "橙色与粉色星形"]
    },
    "outer": {
      "color_elements": ["水: 浅蓝外场/蓝色块", "火: 粉色外环/紫色点/橙色星", "金: 圆点/外环", "土: 方形格子"],
      "shape_elements": ["金: 圆点与外环", "火: 星形", "土: 矩形与格子", "水: 点状分散"],
      "dominant_tendency": "外圈水和金明显，边界清楚；火性点缀带来表达和外放；土结构提供秩序",
      "strength": "外圈边界强，表达点较多",
      "evidence_refs": ["浅蓝外场", "粉色外环", "紫色圆点", "四角星形花饰", "蓝色矩形和格子"]
    }
  }
}
```

## Stage 06: 五行生克与主题映射分析

主题：`general`，映射到自我认知、情绪平衡、生命能量、成长方向。

```json
{
  "stage": "stage-06-per-circle-element-generation-control",
  "theme": "general",
  "per_circle": {
    "inner": {
      "relations": ["水生木: 浅蓝承接黄绿色生长感", "土承载木: 黄色和方形结构让中心不散", "金收束: 环形与圆弧形成边界"],
      "theme_meaning": "内在不是空散的，而是在一个有边界的容器里保持生长。自我层面有想展开的生命力，也有先确认安全边界的需要。",
      "risk": "如果土和金过强，可能让内在表达变得谨慎。"
    },
    "middle": {
      "relations": ["木持续向外扩展", "水提供流动背景", "土结构提供秩序", "火点缀带来表达冲动"],
      "theme_meaning": "关系和当下能量层面有开放、表达和连接的意愿，但这种开放并不是无边界的，而是需要清楚结构承接。",
      "risk": "容易在想表达和想保持秩序之间来回确认。"
    },
    "outer": {
      "relations": ["水场明显，外界流动感强", "金环和圆点形成边界与收束", "火点状外放，土结构稳定外在秩序"],
      "theme_meaning": "外在呈现层面并不封闭，反而有不少表达点和连接点；只是这些表达被强边界和规则结构管理着。",
      "risk": "外圈装饰点较多，注意力或能量可能在外部多个方向分散。"
    }
  }
}
```

## Stage 07: 失衡候选收束

```json
{
  "stage": "stage-07-per-circle-imbalance-patterns",
  "candidates": [
    {
      "name": "结构承接偏强",
      "evidence": ["方形/矩形/格子结构明显", "深色线条形成强边界", "三圈都有清晰秩序"],
      "theme_expression": "在通用解读中，更像是先要把自己放进稳定框架，再允许生命力自然展开。",
      "severity": "conditional",
      "enter_core": true
    },
    {
      "name": "外圈能量分散",
      "evidence": ["外圈紫色圆点、星形和花饰较多", "外圈装饰性元素分布规律但数量多"],
      "theme_expression": "外在注意力或表达出口较多，容易同时被多个外部刺激牵动。",
      "severity": "conditional",
      "enter_core": false
    },
    {
      "name": "过渡负荷",
      "evidence": ["木的生长感、水的流动感、土/金的边界感同时存在", "画面既开放又有强结构"],
      "theme_expression": "像是在从旧的稳定方式进入更开放的表达方式，中间需要时间整合。",
      "severity": "weak_to_conditional",
      "enter_core": true
    }
  ],
  "not_selected_as_core": [
    "大面积黄色对应的单一土过重：黄色明显，但画面同时有蓝、绿、粉、紫、橙等多色，不宜判断为单一土主导。"
  ]
}
```

## Stage 08: 能量流动诊断

```json
{
  "stage": "stage-08-energy-flow-diagnosis",
  "circle_flow": {
    "inner": "内圈中心感清楚，花瓣和几何框共同形成稳定容器，内在能量有中心、有边界，也有生长感。",
    "middle": "中圈重复叶片向外扩展，蓝色矩形和四向结构提供秩序，能量可流动但会先经过规则确认。",
    "outer": "外圈浅蓝场域和粉色外环形成清晰边界，紫色圆点和星形让外在表达变得活跃但略分散。"
  },
  "whole_flow": {
    "main_flow_pattern": "有结构承接的正向流动",
    "healthy_flow_points": ["中心到中圈的叶片重复形成连续扩展", "三圈边界清晰，整体不破碎", "蓝绿搭配带来流动与生长的支持"],
    "blockage_points": ["中外圈的方形矩形结构较强，能量外放前会先被秩序和边界过滤"],
    "backflow_points": [],
    "jump_points": ["外圈星点和圆点较多，外部表达点较散，可能比内在整合更活跃"]
  },
  "theme_connection": "在通用解读中，这更像是一个人正在学习：不是没有生命力，而是要让生命力在清晰边界里稳定表达。"
}
```

## Stage 09: 证据池整合

强证据：

- 整体高度对称，中心感明确。
- 蓝绿搭配明显，支持流动与生长并存。
- 方形、矩形、格子和深色线条形成强结构。
- 外圈紫色圆点、星形和花饰较多。
- 三圈边界清楚，未见明显断裂或失控。

弱证据：

- 渐变色只在彩铅涂抹中局部出现，不作为核心。
- 大面积黄色明显，但不是唯一主导色，不作为“土过重”的直接结论。

冲突项：

- 旧样稿曾将三圈主轴归为“土”，但本次三圈证据显示水、木、土、金、火同时存在，不能再简化为单一土主轴。

报告候选信息：

- 核心主线候选 1：生命力已经在场，但需要边界与秩序承接。
- 核心主线候选 2：外在表达活跃，但注意力出口较多。
- 核心主线候选 3：从稳定到开放的过渡期，需要降低一次性突破的压力。

## Stage 10: 核心主轴选择

```json
{
  "stage": "stage-10-core-thesis-selection",
  "selected_thesis": "这张画的核心不是能量不足，而是生命力、流动感和表达意愿已经在场；真正需要整理的是如何让这些力量经过清晰边界和稳定节奏，被安全地带到外在行动里。",
  "supporting_evidence": [
    "黄绿叶片和蓝色场域显示生长与流动并存。",
    "方形、矩形、格子和黑色线条显示边界和秩序很强。",
    "外圈星点、圆点和花饰显示外在表达点较多。",
    "整体对称且三圈边界清楚，说明不是混乱，而是在有结构地整合。"
  ],
  "excluded_candidates": [
    {
      "candidate": "单一土过重",
      "reason": "黄色明显但不是唯一主色，且蓝、绿、粉、紫、橙都有稳定存在。"
    },
    {
      "candidate": "明显能量断裂",
      "reason": "画面整体连续、对称、边界清楚，没有明显断裂。"
    }
  ]
}
```

## Stage 11: 用户可见表达框架

```json
{
  "stage": "stage-11-user-facing-framing",
  "opening_hit_point": "你现在不像是没有力量，而是力量已经很多，但还在寻找一个足够安全、清楚、可持续的表达方式。",
  "visual_basis_candidates": [
    "中心和三圈结构高度对称，说明内在并不散乱。",
    "蓝色与绿色同时明显出现，说明流动感和生长感都在。",
    "方形、矩形、格子和深色线条很多，说明边界、规则、秩序感很重要。",
    "外圈星点和圆点较多，说明外在表达点多，注意力容易被多个方向牵动。"
  ],
  "term_explanations": [
    {
      "term": "三圈",
      "plain_explanation": "内圈看自我，中圈看关系和当下能量，外圈看行动和外在呈现。"
    },
    {
      "term": "五行",
      "plain_explanation": "这里不是玄学标签，而是把颜色和形状里不同力量翻译成生长、表达、承载、边界和流动。"
    },
    {
      "term": "能量流动",
      "plain_explanation": "看内在想法、情绪关系和外在行动之间是否能接上。"
    }
  ]
}
```

## Stage 12: 疗愈方向与 Lite / Pro 分流

```json
{
  "stage": "stage-12-healing-direction-and-report-branching",
  "healing_direction": "先承认生命力已经在场，再减少一次性外放的压力，用更清楚的小边界和节奏把力量带出来。",
  "lite_writing_input": {
    "opening": "你不是没有力量，而是正在学习让力量更安全地表达。",
    "visual_basis": ["中心稳定", "蓝绿并存", "方形结构强", "外圈星点较多"],
    "current_state": "有生长与表达意愿，也有很强的秩序和边界需求。",
    "theme_connection": "在通用解读里，这对应自我整理、情绪平衡和成长节奏。",
    "small_step_suggestion": "先选择一个最小、可控的表达出口，不急着一次性展开全部。"
  },
  "pro_writing_input": {
    "opening": "这张画呈现的是有结构承接的开放，而不是混乱或停滞。",
    "mechanism_analysis": "木和水带来生长与流动，土和金提供边界与规则，火以星点和粉紫橙色点缀的方式出现，提示表达意愿在外圈活跃。",
    "root_cause_chain": [
      "画面证据：三圈清楚、蓝绿并存、方形结构强、外圈点状装饰多。",
      "状态机制：生命力想展开，但外放前会先经过规则和安全感确认。",
      "现实主题：通用解读下，更像是在学习如何既保持开放，又不失去自己的节奏和边界。"
    ],
    "phased_healing_plan": [
      "短期：先把注意力从多个外部出口收回到一个最小行动。",
      "中期：练习用清楚边界承接表达，而不是等完全准备好才开始。",
      "长期：让内在生长、关系表达和外在行动形成稳定循环。"
    ]
  }
}
```

## Stage 13: Lite 草稿

见同目录：`lite.report.md`

Lite 草稿包含：

- 用户可见正文。
- 2 个可视化模块：画面依据摘要图、小步疗愈建议卡。
- 证据引用与建议边界。

## Stage 14: Pro 草稿

见同目录：`pro.report.md`

Pro 草稿包含：

- 用户可见正文。
- 4 个可视化模块：画面依据深度图、能量流动诊断图、根因链图、阶段性调节路径图。
- 机制分析、根因链、疗愈路径和证据引用。

## Stage 15: 可视化资产

```json
{
  "stage": "stage-15-visual-assets",
  "executed": false,
  "reason": "本次为离线方法链演练，不实际调用文生图模型。",
  "asset_requests": [
    "lite-visual-basis-summary",
    "lite-small-step-healing-card",
    "pro-visual-basis-depth",
    "pro-energy-flow-diagnosis",
    "pro-root-cause-chain",
    "pro-phased-healing-path"
  ],
  "fallback_available": true
}
```

## Stage 16: 最终报告包

见同目录：`final.package.md`

质检结论：

- 过程链覆盖 `stage-00` 到 `stage-16`。
- Lite / Pro 都保留画面依据区。
- Lite 2 个可视化模块、Pro 4 个可视化模块均已生成请求。
- 未实际生成图片，已提供 fallback_text。
- 本次样稿没有新增外部模型调用费用。
