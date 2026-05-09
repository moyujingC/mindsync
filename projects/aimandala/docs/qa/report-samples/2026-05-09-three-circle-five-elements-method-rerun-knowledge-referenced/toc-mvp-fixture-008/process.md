# 三圈五行流派方法链演练过程记录 - 知识引用版

> fixture_id: `toc-mvp-fixture-008`
> 样本图：`projects/aimandala/fixtures/toc-mvp/assets/IMG_5079.jpeg`
> 主题：`general` / 通用解读
> 演练日期：2026-05-09
> 方法依据：`projects/aimandala/docs/sources/知识库构建/三圈五行流派解读方法与步骤.md`
> Prompt 依据：第 03、04、10-12、13、14 步 prompt，以及第 05、06、07 步执行规范
> 案例参照：`projects/aimandala/docs/sources/知识库构建/原始解读案例篇11例.md`
> 执行方式：离线方法链演练，复用既有 Qwen-VL 视觉评测结果，不新增外部 API 调用，不实际生成文生图。

## 执行说明

本次是对上一版 `2026-05-09-three-circle-five-elements-method` 的重跑。

主要调整：

- 第 3 步改用 `visual_units`，不再把颜色和形状拆成两个孤立清单。
- 第 3 步忽略画纸原有黑色线框画稿，只记录用户填色形成的颜色区域、形状、面积和相邻关系。
- 第 5、6、7 步按新增执行规范输出，参照 11 个案例的推导节奏。
- 第 10-14 步按更新后的 prompt 生成，学习案例中的“先看画面、逐圈推进、五行生克解释、再落主题和疗愈方向”的表达方式。
- 本次没有重新调用视觉模型；视觉基础复用 `projects/aimandala/docs/qa/model-evals/2026-05-06-vision-stability/round-001/qwen-vl/toc-mvp-fixture-008.json`，并人工复核原图。

## Stage 00: 运行上下文

```json
{
  "stage": "stage-00-input-context",
  "run_id": "2026-05-09-three-circle-five-elements-method-rerun-knowledge-referenced/toc-mvp-fixture-008",
  "fixture_id": "toc-mvp-fixture-008",
  "method_version": "三圈五行流派解读方法与步骤.md@2026-05-09",
  "case_reference": "原始解读案例篇11例.md",
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

本次主题为通用解读。后续主题映射落在自我认知、情绪平衡、生命能量和成长方向，不映射到财富事业或亲密关系等专属主题。

## Stage 02: 三圈边界锁定

```json
{
  "stage": "stage-02-circle-boundary-decision",
  "boundary_source": "fixture/eval default calibrated image",
  "inner_middle_radius": 0.33,
  "middle_outer_radius": 0.66,
  "radius_unit": "normalized_ratio",
  "locked": true,
  "notes": "本次以脱敏 fixture 的校准图为准，不重新调整三圈边界。"
}
```

## Stage 03: 视觉证据

这一阶段只记录可见事实，不做心理结论。

```json
{
  "stage": "stage-03-visual-evidence",
  "global_summary": "画面呈高度对称的几何曼陀罗结构。中心是黄绿花瓣状填色区域，外侧有浅蓝几何填色区和粉色环带；中圈有黄绿叶片、蓝色矩形填色块、米色格子填色区和星形点缀；外圈由浅蓝场域、粉色外环、紫色圆点和四角花饰组成。整体中心感明确，层次稳定，颜色区域关系清楚。原始黑色线框仅作为模板，不进入证据判断。",
  "circles": {
    "inner": {
      "visual_units": [
        {
          "visual_unit_id": "inner-001",
          "position": "中心",
          "description": "中心有黄色与黄绿色花瓣状填色区域，围绕中心点放射展开，不同花瓣色块相邻清楚。",
          "colors": "黄色、黄绿色",
          "shape": "花瓣状、放射状",
          "area": "内圈主体",
          "fill": "颜色较明亮，填色有轻微手绘纹理",
          "neighbor_relation": "外侧接浅蓝几何框和粉色环带"
        },
        {
          "visual_unit_id": "inner-002",
          "position": "内圈外缘",
          "description": "浅蓝色几何框包住中心花瓣，框线厚重，呈方形回折结构。",
          "colors": "浅蓝色",
          "shape": "方形回折填色区、矩形色块关系",
          "area": "内圈到中圈过渡处",
          "fill": "浅蓝成片，填色区域清楚",
          "neighbor_relation": "内接花瓣，外接粉色环带"
        },
        {
          "visual_unit_id": "inner-003",
          "position": "内圈外侧",
          "description": "粉色环带围绕浅蓝填色区外侧，形成柔和颜色过渡。",
          "colors": "粉色",
          "shape": "环带、圆弧",
          "area": "内圈外侧一圈",
          "fill": "粉色较柔和，面积适中",
          "neighbor_relation": "连接内圈浅蓝框和中圈叶片"
        }
      ]
    },
    "middle": {
      "visual_units": [
        {
          "visual_unit_id": "middle-001",
          "position": "中圈四向扩展区域",
          "description": "黄绿色叶片从内圈向外重复展开，叶片之间有黄色和橙色小区域。",
          "colors": "黄绿色、黄色、橙色",
          "shape": "叶状、弧形、重复放射",
          "area": "中圈主要面积",
          "fill": "黄绿较亮，黄色面积较大，橙色点缀",
          "neighbor_relation": "内接粉色环带，外接浅蓝场域和矩形框"
        },
        {
          "visual_unit_id": "middle-002",
          "position": "中圈左右及上下结构位",
          "description": "蓝色矩形块、浅蓝回折填色区和米色格子填色区在四个方向重复出现。",
          "colors": "深蓝色、浅蓝色、米黄色",
          "shape": "矩形填色块、方形格子填色区、回折形色块",
          "area": "中圈四向结构骨架",
          "fill": "蓝色较深，米色较浅，填色区对比明显",
          "neighbor_relation": "压在黄绿叶片与浅蓝场域之间"
        },
        {
          "visual_unit_id": "middle-003",
          "position": "中圈内外过渡",
          "description": "紫粉色星形分布在浅蓝区域中，和黄绿叶片之间形成点状外放。",
          "colors": "紫粉色",
          "shape": "星形、尖角",
          "area": "中圈过渡点缀",
          "fill": "面积较小但视觉醒目",
          "neighbor_relation": "位于浅蓝场域内，靠近黄绿叶片和粉色环带"
        }
      ]
    },
    "outer": {
      "visual_units": [
        {
          "visual_unit_id": "outer-001",
          "position": "外圈背景",
          "description": "浅蓝色成片铺在外圈，围绕中圈形成一层宽阔场域。",
          "colors": "浅蓝色",
          "shape": "弧形场域、环状背景",
          "area": "外圈主要背景",
          "fill": "浅蓝面积大，填色较轻",
          "neighbor_relation": "内接黄绿叶片和蓝色结构，外接粉色外环"
        },
        {
          "visual_unit_id": "outer-002",
          "position": "最外缘",
          "description": "粉色外环沿最外圈包裹整幅画，形成连续外缘色带。",
          "colors": "粉色",
          "shape": "外环、圆弧色带",
          "area": "最外缘",
          "fill": "粉色柔和，外缘色带连续",
          "neighbor_relation": "包住浅蓝外场"
        },
        {
          "visual_unit_id": "outer-003",
          "position": "外圈周边",
          "description": "紫色圆点沿外圈规律分布，数量较多，像一圈节奏点。",
          "colors": "紫色",
          "shape": "圆点、重复排列",
          "area": "外圈周边点状区域",
          "fill": "紫色中等偏深，单点面积小",
          "neighbor_relation": "落在浅蓝外场中，靠近粉色外环"
        },
        {
          "visual_unit_id": "outer-004",
          "position": "四角装饰位",
          "description": "四角有紫色花瓣包围橙黄色星形的装饰组合，和蓝色矩形结构相邻。",
          "colors": "紫色、橙黄色、蓝色",
          "shape": "花瓣状、星形、矩形",
          "area": "四角重复装饰",
          "fill": "橙黄色星形醒目，紫色花瓣包裹",
          "neighbor_relation": "连接外圈浅蓝场域和中圈蓝色矩形结构"
        }
      ]
    }
  },
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
      "visual_unit_refs": ["inner-001", "inner-002", "middle-001", "outer-001"]
    },
    {
      "mode": "外圈花边、星星点点",
      "hit_strength": "full_hit",
      "visual_unit_refs": ["outer-003", "outer-004", "middle-003"]
    },
    {
      "mode": "方形/矩形结构明显",
      "hit_strength": "partial_hit",
      "visual_unit_refs": ["inner-002", "middle-002"]
    }
  ],
  "program_match_result": [
    {
      "mode": "蓝绿搭配",
      "hit_strength": "full_hit",
      "matched_unit_refs": ["middle-001", "outer-001"]
    },
    {
      "mode": "外圈花边、星星点点",
      "hit_strength": "full_hit",
      "matched_unit_refs": ["outer-003", "outer-004"]
    }
  ],
  "cross_validation": [
    {
      "mode": "蓝绿搭配",
      "result": "consistent",
      "handling": "进入强证据。通用主题下解释为流动感与生长感并存。"
    },
    {
      "mode": "外圈花边、星星点点",
      "result": "consistent",
      "handling": "进入强证据。通用主题下解释为外在表达点多、注意力出口多。"
    },
    {
      "mode": "方形/矩形结构明显",
      "result": "vision_supported_program_indirect",
      "handling": "仅把蓝色矩形填色块、浅蓝回折填色区和米色格子填色区作为结构线索进入第 5、6 步；原始黑色线稿不作为证据。"
    }
  ]
}
```

## Stage 05: 逐圈颜色、形状五行感知映射

本步参照 11 个案例的推进方式：先说明每圈看到了什么，再定颜色和形状的五行，再判断主次和强弱。

本次修正后，每条映射都必须带 `knowledge_refs`。没有知识库条目支撑的说法，只能进入 `uncertainties` 或 `watch_only`，不能写成结论。

```json
{
  "stage": "stage-05-per-circle-color-shape-element-sensing",
  "unit_results": [
    {
      "visual_unit_id": "inner-001",
      "circle": "inner",
      "color_element_candidates": [
        {
          "element": "earth",
          "basis": "黄色填色区域",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/土/黄色",
            "packs/v2.1/elements/five_elements.yaml::土.colors.黄色"
          ]
        },
        {
          "element": "wood",
          "basis": "黄绿色填色区域",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/木/黄绿色",
            "packs/v2.1/elements/five_elements.yaml::木.colors.黄绿色"
          ]
        }
      ],
      "shape_element_candidates": [
        {
          "element": "wood",
          "basis": "放射状排列",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/木/放射状"
          ]
        }
      ],
      "color_shape_relation": "reinforce",
      "combined_element_tendency": "黄色对应土，黄绿色与放射状排列对应木；本单元只能稳定判断为土木并见，不直接生成心理结论。",
      "knowledge_refs": [
        "颜色五行感知规则.md::颜色分析顺序",
        "形状五行感知规则.md::形状与颜色的关系/加强",
        "三圈语义与能量流动.md::三圈基础语义/内圈"
      ],
      "evidence_refs": ["stage-03.visual_units.inner-001"]
    },
    {
      "visual_unit_id": "inner-002",
      "circle": "inner",
      "color_element_candidates": [
        {
          "element": "water",
          "basis": "浅蓝色填色区",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/水/蓝色",
            "packs/v2.1/elements/five_elements.yaml::水.colors.蓝色"
          ]
        }
      ],
      "shape_element_candidates": [
        {
          "element": "earth",
          "basis": "方形/矩形回折填色区",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/土/方形/矩形"
          ]
        }
      ],
      "color_shape_relation": "regulate",
      "combined_element_tendency": "浅蓝色按颜色规则归水；方形回折填色区按形状规则归土。本单元只能判断为水被土形承接，后续是否形成土克水需到第 6 步看强弱。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/水",
        "形状五行感知规则.md::形状与颜色的关系/调和",
        "五行生克与失衡模式.md::基础关系/相克/土克水"
      ],
      "evidence_refs": ["stage-03.visual_units.inner-002"]
    },
    {
      "visual_unit_id": "middle-001",
      "circle": "middle",
      "color_element_candidates": [
        {
          "element": "wood",
          "basis": "黄绿色叶片填色区域",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/木/黄绿色",
            "packs/v2.1/elements/five_elements.yaml::木.colors.黄绿色"
          ]
        },
        {
          "element": "earth",
          "basis": "黄色填色区域",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/土/黄色",
            "packs/v2.1/elements/five_elements.yaml::土.colors.黄色"
          ]
        },
        {
          "element": "fire",
          "basis": "橙色点缀区域",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/火/橙色",
            "packs/v2.1/elements/five_elements.yaml::火.colors.橙色"
          ]
        }
      ],
      "shape_element_candidates": [
        {
          "element": "wood",
          "basis": "叶状重复向外展开，按放射/延伸类形态处理",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/木/放射状",
            "形状五行感知规则.md::常见形状提示/条形/放射状"
          ]
        }
      ],
      "color_shape_relation": "reinforce",
      "combined_element_tendency": "黄绿色与放射延展形态共同支持木；黄色与橙色分别作为土、火候选保留。",
      "knowledge_refs": [
        "颜色五行感知规则.md::颜色分析顺序",
        "形状五行感知规则.md::形状与颜色的关系/加强",
        "三圈语义与能量流动.md::三圈基础语义/中圈"
      ],
      "evidence_refs": ["stage-03.visual_units.middle-001"]
    },
    {
      "visual_unit_id": "middle-002",
      "circle": "middle",
      "color_element_candidates": [
        {
          "element": "water",
          "basis": "蓝色和浅蓝色填色区",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/水/蓝色",
            "packs/v2.1/elements/five_elements.yaml::水.colors.蓝色"
          ]
        },
        {
          "element": "earth",
          "basis": "米黄色格子填色区",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/土/黄色",
            "packs/v2.1/elements/five_elements.yaml::土.colors.黄色"
          ]
        }
      ],
      "shape_element_candidates": [
        {
          "element": "earth",
          "basis": "矩形、方形格子、回折形色块",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/土/方形/矩形"
          ]
        }
      ],
      "color_shape_relation": "regulate",
      "combined_element_tendency": "蓝色按颜色规则归水，方形/矩形按形状规则归土；本单元记录为水与土形并见，不直接推导现实状态。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/水",
        "形状五行感知规则.md::形状与颜色的关系/调和",
        "五行生克与失衡模式.md::基础关系/相克/土克水"
      ],
      "evidence_refs": ["stage-03.visual_units.middle-002"]
    },
    {
      "visual_unit_id": "outer-001",
      "circle": "outer",
      "color_element_candidates": [
        {
          "element": "water",
          "basis": "外圈浅蓝成片背景",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/水/蓝色",
            "packs/v2.1/elements/five_elements.yaml::水.colors.蓝色"
          ]
        }
      ],
      "shape_element_candidates": [
        {
          "element": "metal",
          "basis": "环状外圈区域",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/金/环形",
            "形状五行感知规则.md::常见形状提示/圆形/环形"
          ]
        }
      ],
      "color_shape_relation": "regulate",
      "combined_element_tendency": "外圈浅蓝按颜色规则归水，环状区域按形状规则归金；本单元记录为水与金形并见。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/水",
        "形状五行感知规则.md::形状与颜色的关系/调和",
        "三圈语义与能量流动.md::三圈基础语义/外圈"
      ],
      "evidence_refs": ["stage-03.visual_units.outer-001"]
    },
    {
      "visual_unit_id": "outer-003",
      "circle": "outer",
      "color_element_candidates": [
        {
          "element": "fire",
          "basis": "紫色圆点",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/火/紫色",
            "packs/v2.1/elements/five_elements.yaml::火.colors.紫色"
          ]
        }
      ],
      "shape_element_candidates": [
        {
          "element": "metal",
          "basis": "圆点形态",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/金/圆形"
          ]
        },
        {
          "element": "water",
          "basis": "点状重复",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/水/点状"
          ]
        }
      ],
      "color_shape_relation": "conflict",
      "combined_element_tendency": "紫色按颜色规则归火；圆点按形状规则可归金，点状重复也可作为水形候选。本单元存在颜色与形状方向不一致，进入第 6 步时只能作为候选关系。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/火/紫色",
        "形状五行感知规则.md::形状与颜色的关系/冲突",
        "形状五行感知规则.md::常见形状提示/点状/星点"
      ],
      "evidence_refs": ["stage-03.visual_units.outer-003"]
    },
    {
      "visual_unit_id": "outer-004",
      "circle": "outer",
      "color_element_candidates": [
        {
          "element": "fire",
          "basis": "橙黄色星形与紫色花瓣",
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/火/橙色/紫色",
            "packs/v2.1/elements/five_elements.yaml::火.colors.橙色"
          ]
        }
      ],
      "shape_element_candidates": [
        {
          "element": "fire",
          "basis": "星形",
          "knowledge_refs": [
            "形状五行感知规则.md::形状五行基础映射/火/星形",
            "形状五行感知规则.md::常见形状提示/三角形/尖角"
          ]
        }
      ],
      "color_shape_relation": "reinforce",
      "combined_element_tendency": "橙黄色和紫色按颜色规则归火，星形按形状规则归火；本单元可稳定记录为火性表达候选。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/火",
        "形状五行感知规则.md::形状与颜色的关系/加强",
        "三圈语义与能量流动.md::三圈基础语义/外圈"
      ],
      "evidence_refs": ["stage-03.visual_units.outer-004"]
    }
  ],
  "circle_summaries": [
    {
      "circle": "inner",
      "dominant_elements": ["wood", "earth"],
      "secondary_elements": ["water", "fire"],
      "summary": "内圈可稳定记录为木、土候选较明显，水和火作为辅助色候选保留；不直接生成心理结论。",
      "knowledge_refs": [
        "三圈语义与能量流动.md::三圈基础语义/内圈",
        "颜色五行感知规则.md::圈层语境/内圈",
        "packs/v2.1/circles/three_circles.yaml::内圈"
      ],
      "evidence_refs": ["stage-05.unit_results.inner-001", "stage-05.unit_results.inner-002"]
    },
    {
      "circle": "middle",
      "dominant_elements": ["wood", "earth", "water"],
      "secondary_elements": ["fire"],
      "summary": "中圈可稳定记录为木、水、土候选并见，火作为星形和橙色点缀候选保留。",
      "knowledge_refs": [
        "三圈语义与能量流动.md::三圈基础语义/中圈",
        "颜色五行感知规则.md::圈层语境/中圈",
        "packs/v2.1/circles/three_circles.yaml::中圈"
      ],
      "evidence_refs": ["stage-05.unit_results.middle-001", "stage-05.unit_results.middle-002", "stage-05.unit_results.middle-003"]
    },
    {
      "circle": "outer",
      "dominant_elements": ["water", "fire"],
      "secondary_elements": ["metal", "earth"],
      "summary": "外圈可稳定记录为水色面积较大、火性点状表达明显，金和土来自圆点、环形和方形填色结构的形状候选。",
      "knowledge_refs": [
        "三圈语义与能量流动.md::三圈基础语义/外圈",
        "颜色五行感知规则.md::圈层语境/外圈",
        "packs/v2.1/circles/three_circles.yaml::外圈"
      ],
      "evidence_refs": ["stage-05.unit_results.outer-001", "stage-05.unit_results.outer-003", "stage-05.unit_results.outer-004"]
    }
  ]
}
```

## Stage 06: 五行生克与主题映射分析

主题：`general`，映射到自我认知、情绪平衡、生命能量、成长方向。

```json
{
  "stage": "stage-06-per-circle-element-generation-control",
  "theme": "general",
  "circle_results": [
    {
      "circle": "inner",
      "element_relations": [
        {
          "relation": "water_generates_wood_candidate",
          "plain_explanation": "内圈浅蓝色水候选与黄绿色木候选并见，可作为水生木的候选关系；因未做面积量化，只标记为候选。",
          "evidence_refs": ["stage-05.unit_results.inner-001", "stage-05.unit_results.inner-002"],
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相生/水生木",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相生.水",
            "三圈语义与能量流动.md::三圈基础语义/内圈"
          ]
        },
        {
          "relation": "wood_controls_earth_candidate",
          "plain_explanation": "内圈木、土候选并见，按规则存在木克土的候选关系；当前没有证据显示过度相克。",
          "evidence_refs": ["stage-05.unit_results.inner-001"],
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/木克土",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.木"
          ]
        }
      ],
      "circle_semantic_context": "内圈对应自我关系、原生经验、自我价值和内在根基。",
      "circle_semantic_refs": [
        "三圈语义与能量流动.md::三圈基础语义/内圈",
        "packs/v2.1/circles/three_circles.yaml::内圈"
      ],
      "theme_mapping": [
        {
          "theme": "general",
          "interpretation_candidate": "通用主题下，只能候选解释为内在生长与自我承接同时出现。",
          "confidence": "medium",
          "knowledge_refs": [
            "主题知识与疗愈映射.md::当前主题域/general",
            "主题知识与疗愈映射.md::主题挂载原则"
          ],
          "evidence_refs": ["stage-05.circle_summaries.inner"]
        }
      ]
    },
    {
      "circle": "middle",
      "element_relations": [
        {
          "relation": "water_generates_wood_candidate",
          "plain_explanation": "中圈蓝色水候选与黄绿色木候选并见，可作为水生木候选；没有证据显示水过多或木漂。",
          "evidence_refs": ["stage-05.unit_results.middle-001", "stage-05.unit_results.middle-002"],
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相生/水生木",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相生.水",
            "三圈语义与能量流动.md::三圈基础语义/中圈"
          ]
        },
        {
          "relation": "earth_controls_water_candidate",
          "plain_explanation": "中圈方形/矩形土形与蓝色水色并见，可作为土克水候选；当前仅作为承接关系，不能直接判断失衡。",
          "evidence_refs": ["stage-05.unit_results.middle-002"],
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/土克水",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.土"
          ]
        }
      ],
      "circle_semantic_context": "中圈对应当下情绪、亲密关系、互动方式和能量状态。",
      "circle_semantic_refs": [
        "三圈语义与能量流动.md::三圈基础语义/中圈",
        "packs/v2.1/circles/three_circles.yaml::中圈"
      ],
      "theme_mapping": [
        {
          "theme": "general",
          "interpretation_candidate": "通用主题下，只能候选解释为当下能量有生长和流动，同时需要结构承接。",
          "confidence": "medium",
          "knowledge_refs": [
            "主题知识与疗愈映射.md::当前主题域/general",
            "主题知识与疗愈映射.md::主题映射方式"
          ],
          "evidence_refs": ["stage-05.circle_summaries.middle"]
        }
      ]
    },
    {
      "circle": "outer",
      "element_relations": [
        {
          "relation": "water_controls_fire_candidate",
          "plain_explanation": "外圈浅蓝水色面积较大，星形/紫橙火候选同时存在，可作为水克火候选；当前没有量化证据支持水多火灭。",
          "evidence_refs": ["stage-05.unit_results.outer-001", "stage-05.unit_results.outer-004"],
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/水克火",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.水",
            "三圈语义与能量流动.md::三圈基础语义/外圈"
          ]
        },
        {
          "relation": "fire_controls_metal_candidate",
          "plain_explanation": "紫色/橙色火候选与圆点/环形金候选并见，可作为火克金候选；当前只记录关系，不判断过度。",
          "evidence_refs": ["stage-05.unit_results.outer-003", "stage-05.unit_results.outer-004"],
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/火克金",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.火"
          ]
        }
      ],
      "circle_semantic_context": "外圈对应行动、外在呈现、身体、财富、事业和与世界的关系。",
      "circle_semantic_refs": [
        "三圈语义与能量流动.md::三圈基础语义/外圈",
        "packs/v2.1/circles/three_circles.yaml::外圈"
      ],
      "theme_mapping": [
        {
          "theme": "general",
          "interpretation_candidate": "通用主题下，只能候选解释为外在表达点较多，且需要聚焦；不能直接判断焦虑或混乱。",
          "confidence": "medium",
          "knowledge_refs": [
            "主题知识与疗愈映射.md::当前主题域/general",
            "主题知识与疗愈映射.md::主题映射方式"
          ],
          "evidence_refs": ["stage-05.circle_summaries.outer"]
        }
      ]
    }
  ],
  "user_input_alignment": {
    "painting_intention_response": "用户关注结构与三圈关系，只能作为辅助上下文，与方形填色区、环形色带和三圈层次呼应。",
    "drawing_feelings_response": "保持开放观察，与蓝绿流动和多处表达点相呼应，但不能替代画面证据。",
    "knowledge_refs": [
      "主题知识与疗愈映射.md::主题挂载原则",
      "主题知识与疗愈映射.md::主题映射方式"
    ],
    "evidence_refs": [
      "stage-01-user-input-context.painting_intention",
      "stage-01-user-input-context.painting_feeling",
      "stage-03-visual-evidence"
    ]
  }
}
```

## Stage 07: 失衡候选收束

```json
{
  "stage": "stage-07-per-circle-imbalance-patterns",
  "imbalance_candidates": [
    {
      "candidate_id": "imbalance-001",
      "imbalance_type": "transition-overload",
      "role": "background_pattern",
      "severity": "low_to_medium",
      "theme_manifestation": "通用主题下，只能候选解释为新旧节奏正在切换：一部分想开放和表达，另一部分仍在寻找承接。",
      "knowledge_refs": [
        "五行生克与失衡模式.md::运行时常见失衡类型/transition-overload",
        "主题知识与疗愈映射.md::当前主题域/general",
        "packs/v2.1/rules/imbalance_types.yaml::transition-overload",
        "packs/v2.1/rules/theme_mappings.yaml::general.transition-overload"
      ],
      "evidence_chain": [
        {
          "type": "visual",
          "summary": "黄绿叶片显示生长，蓝色场域显示流动，方形填色区和外环显示承接。",
          "evidence_refs": ["stage-03.visual_units.middle-001", "stage-03.visual_units.middle-002", "stage-03.visual_units.outer-001"],
          "knowledge_refs": [
            "颜色五行感知规则.md::五行颜色基础映射/木/水",
            "形状五行感知规则.md::形状五行基础映射/土/金"
          ]
        },
        {
          "type": "element_relation",
          "summary": "第 6 步只形成水生木、土克水、水克火等候选关系，尚不足以判断某个具体相克失衡。",
          "evidence_refs": ["stage-06.circle_results"],
          "knowledge_refs": [
            "五行生克与失衡模式.md::分析顺序",
            "五行生克与失衡模式.md::失衡浮现原则"
          ]
        }
      ],
      "report_relevance": "可作为 Pro 背景机制线索，暂不作为 Lite 核心卡点。"
    }
  ],
  "watch_only": [
    {
      "name": "承接结构偏强",
      "reason": "知识库没有对应失衡条目，且当前证据不足以匹配土多水干、金多木折或其他具体失衡；只能作为观察项。",
      "evidence_refs": ["stage-05.unit_results.inner-002", "stage-05.unit_results.middle-002"],
      "knowledge_refs": [
        "五行生克与失衡模式.md::失衡浮现原则"
      ]
    },
    {
      "name": "外圈表达点分散",
      "reason": "外圈点状元素较多，但知识库没有独立失衡条目支持该命名；只能作为外圈观察项，交给第 8 步能量流动判断。",
      "evidence_refs": ["stage-05.unit_results.outer-003", "stage-05.unit_results.outer-004"],
      "knowledge_refs": [
        "三圈语义与能量流动.md::三圈基础语义/外圈",
        "三圈语义与能量流动.md::整体能量流动"
      ]
    }
  ],
  "not_selected_as_core": [
    "单一土过重：黄色明显，但水、木、火、金都有稳定证据，不宜简化为单一土主导。",
    "明显断裂：画面整体对称、三圈连续，没有明显断裂。",
    "水多火灭：外圈有水克火候选，但缺少蓝色占比极高、火极弱等知识库要求的证据。"
  ]
}
```

## Stage 08: 能量流动诊断

```json
{
  "stage": "stage-08-energy-flow-diagnosis",
  "circle_flow": {
    "inner": "中心花瓣向外打开，但被浅蓝回折框和粉色环带稳稳包住。内在有生长，也有自我保护。",
    "middle": "黄绿叶片继续向外扩展，但会经过蓝色矩形和米色格子的结构过滤。关系和当下能量可以流动，但需要规则承接。",
    "outer": "浅蓝外场很宽，粉色外环清楚，紫色圆点和星形让外在表达变得活跃。外在不是封闭，而是出口较多。"
  },
  "whole_flow": {
    "main_flow_pattern": "有承接结构的开放流动",
    "healthy_flow_points": [
      "内圈到中圈的花瓣和叶片连续展开。",
      "三圈层次清楚，整体不破碎。",
      "蓝绿搭配让情绪流动和生长意愿同时存在。"
    ],
    "blockage_points": [
      "中圈和外圈的矩形填色块、格子填色区和粉色外环较明显，能量外放前会经过承接结构。"
    ],
    "jump_points": [
      "外圈点状元素较多，外在表达点可能多于当前主线承载力。"
    ]
  }
}
```

## Stage 09: 证据池整合

强证据：

- 中心黄绿花瓣稳定，三圈结构清楚。
- 蓝绿搭配明显，支持流动与生长并存。
- 方形、矩形、格子、回折形填色区和外环形成明显承接结构。
- 外圈紫色圆点、星形、花饰较多。
- 画面整体对称，没有明显断裂。

弱证据：

- 渐变主要来自手绘涂色，不作为核心判断。
- 黄色明显，但不单独主导全画。

冲突项：

- 不能把这张画简单归为“能量不足”。
- 不能把外圈点状装饰直接解释成混乱，因为它们分布有规律。

## Stage 10: 核心主轴选择

```json
{
  "stage": "stage-10-core-thesis-selection",
  "selected_thesis": "这张画最核心的状态，是生命力和表达意愿已经在场，但它们需要通过清晰的承接结构和可承受节奏，被安全地带到外在行动里。",
  "supporting_evidence": [
    "黄绿花瓣和叶片显示内在生长与恢复。",
    "浅蓝场域显示情绪和感受流动。",
    "方形、矩形、格子填色区和粉色外环显示承接与收束。",
    "外圈圆点、星形和花饰显示表达点很多。",
    "整体对称说明当前不是失控，而是在有结构地整合。"
  ],
  "case_style_reference": {
    "used_for": "先整体命中，再逐圈推进，再从五行生克收束到现实状态",
    "not_used_for": "复制案例结论或新增当前画作没有的判断"
  },
  "confidence_boundary": "这是通用主题下的自我整理和成长节奏判断，不应扩展成确定的人格诊断。"
}
```

## Stage 11: 用户可见表达框架

```json
{
  "stage": "stage-11-user-facing-framing",
  "opening_hit_point": "你现在不像是没有力量，而是力量已经慢慢回来；真正需要学习的是，怎样让这些力量在稳定承接里表达出来。",
  "visual_basis_candidates": [
    "中心黄绿花瓣说明生命力和生长感在内圈出现。",
    "浅蓝几何框、蓝色矩形和外圈浅蓝场域说明感受流动明显。",
    "方形、格子、回折形填色区和外环说明承接和秩序感较强。",
    "外圈紫色圆点、星形和花饰说明外在表达出口多。"
  ],
  "term_explanations": [
    {
      "term": "三圈",
      "plain_explanation": "内圈看自我根基，中圈看关系和当下能量，外圈看行动和外在呈现。"
    },
    {
      "term": "五行",
      "plain_explanation": "这里是把颜色和形状里的力量翻译成生长、表达、承载、收束和流动。"
    },
    {
      "term": "生克",
      "plain_explanation": "看这些力量是在互相支持，还是互相拉扯。"
    }
  ]
}
```

## Stage 12: 疗愈方向与 Lite / Pro 分流

```json
{
  "stage": "stage-12-healing-direction-and-report-branching",
  "healing_direction": "先承认生命力已经在场，再选择一个足够小、足够安全的表达出口，让承接结构服务表达，而不是替代表达。",
  "lite_writing_input": {
    "opening": "你不是没有力量，而是正在学习让力量安全地表达。",
    "visual_basis": ["中心黄绿花瓣", "浅蓝和蓝色场域", "方形格子与外环", "外圈圆点星形"],
    "current_state": "有生长和表达意愿，也有较强的秩序、承接和安全需求。",
    "theme_connection": "在通用解读里，这对应自我整理、情绪平衡和成长节奏。",
    "small_step_suggestion": "今天只选一个最小的表达出口，不急着同时打开所有方向。"
  },
  "pro_writing_input": {
    "opening": "这张画呈现的是有承接结构的开放流动。",
    "mechanism_analysis": "木和水带来生长与流动，土和金通过方形填色区、环带和圆点提供承接与收束，火以星形、紫粉和橙黄的点状方式出现，提示表达意愿在外圈活跃但需要聚焦。",
    "root_cause_chain": [
      "画面证据：三圈清楚、黄绿生长、浅蓝流动、方形结构强、外圈点状表达多。",
      "状态机制：生命力想展开，但外放前会先寻找规则、安全感和承接。",
      "现实主题：通用解读下，更像是在学习如何既保持开放，又不失去自己的节奏。"
    ],
    "phased_healing_plan": [
      "短期：从多个出口里选择一个最小行动。",
      "中期：练习让承接结构服务表达，而不是把准备和确认变成推迟表达的理由。",
      "长期：形成内在生长、关系承接和外在行动之间的稳定循环。"
    ]
  }
}
```

## Stage 13: Lite 草稿

见同目录：`lite.report.md`

## Stage 14: Pro 草稿

见同目录：`pro.report.md`

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
- 第 3 步已按 `visual_units` 输出。
- 第 5、6、7 步已按新增规范输出。
- 第 10-14 步已加入 逐条知识引用口径。
- Lite / Pro 都保留画面依据区。
- Lite 2 个可视化模块、Pro 4 个可视化模块均已生成请求。
- 未实际生成图片，已提供 fallback_text。
- 本次样稿没有新增外部模型调用费用。
