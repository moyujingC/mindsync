# 三圈五行流派方法链演练过程记录 - 知识库引用校正版

> fixture_id: `toc-mvp-fixture-008`  
> 样本图：`projects/aimandala/fixtures/toc-mvp/assets/IMG_5079.jpeg`  
> 主题：`general` / 通用解读  
> 演练日期：2026-05-09  
> 方法依据：`projects/aimandala/docs/sources/知识库构建/三圈五行流派解读方法与步骤.md`  
> 执行方式：离线重跑，复用既有 Qwen-VL 视觉评测结果，不新增外部 API 调用，不实际生成文生图。

## 执行说明

这版重跑修正四个重点：

- Stage 03 以 `visual_units` 记录“位置 + 颜色 + 形状 + 面积 + 相邻关系”，忽略原始黑色线框画稿。
- Stage 04-07 的 `knowledge_refs` 只指向知识库具体条目；Prompt / 规范文档只进入 `prompt_refs` 或 `spec_refs`。
- Stage 04 只保留知识库真实存在的直断模式命中；“方形/矩形结构明显”降级为视觉观察和形状五行依据。
- 最终 Lite / Pro 报告只整合已有过程数据，不新增画面事实或未被知识库支持的失衡标签。

## Stage 00: 运行上下文

```json
{
  "stage": "stage-00-input-context",
  "method_version": "三圈五行流派解读方法与步骤.md@2026-05-09",
  "knowledge_runtime_version": "packs/v2.1",
  "report_versions": [
    "lite",
    "pro"
  ],
  "process_trace_enabled": true,
  "case_reference": "原始解读案例篇11例.md",
  "output_policy": "保留中间每一步过程交付物和最终交付物。"
}
```

## Stage 01: 用户输入与解读上下文

```json
{
  "stage": "stage-01-user-input-context",
  "image_path": "projects/aimandala/fixtures/toc-mvp/assets/IMG_5079.jpeg",
  "theme": "general",
  "theme_label": "通用解读",
  "painting_intention": "观察画面结构与三圈边界",
  "painting_feeling": "保持开放观察",
  "required_inputs_complete": true,
  "optional_inputs_present": true,
  "knowledge_refs": [
    "主题知识与疗愈映射.md::当前主题域/general",
    "主题知识与疗愈映射.md::主题挂载原则"
  ]
}
```

## Stage 02: 三圈边界锁定

```json
{
  "stage": "stage-02-circle-boundary-decision",
  "boundary_source": "fixture/eval default calibrated image",
  "inner_middle_radius": 0.33,
  "middle_outer_radius": 0.66,
  "radius_unit": "normalized_ratio",
  "locked": true,
  "output_for_next_stage": [
    "inner_middle_radius",
    "middle_outer_radius",
    "radius_unit"
  ],
  "knowledge_refs": [
    "三圈语义与能量流动.md::三圈基础语义",
    "packs/v2.1/circles/three_circles.yaml"
  ]
}
```

## Stage 03: 视觉证据

本阶段只记录可见事实，不下心理结论；黑色模板线稿不作为作者填色证据。

```json
{
  "stage": "stage-03-visual-evidence",
  "global_summary": "画面呈高度对称的几何曼陀罗结构。中心是黄绿花瓣状填色区域，外侧有浅蓝几何填色区和粉色环带；中圈有黄绿叶片、蓝色矩形填色块、米色格子填色区和星形点缀；外圈由浅蓝场域、粉色外环、紫色圆点和四角花饰组成。整体中心感明确，层次稳定，颜色区域关系清楚。原始黑色线框仅作为模板，不进入证据判断。",
  "calibrated_image_ref": "projects/aimandala/fixtures/toc-mvp/assets/IMG_5079.jpeg",
  "circle_boundary_ref": {
    "inner_middle_radius": 0.33,
    "middle_outer_radius": 0.66,
    "radius_unit": "normalized_ratio"
  },
  "circles": {
    "inner": {
      "summary": "内圈由中心黄绿花瓣、浅蓝几何承接区和粉色环带组成，中心感明显，整体较明亮。",
      "visual_units": [
        {
          "id": "inner-001",
          "position": "中心",
          "description": "中心有黄色与黄绿色花瓣状填色区域，围绕中心点放射展开，不同花瓣色块相邻清楚。",
          "color": {
            "main": "黄色、黄绿色",
            "depth": "明亮",
            "saturation": "中等偏高"
          },
          "shape": {
            "type": "花瓣状、放射状",
            "edge": "由填色区域形成边缘，不使用黑色模板线判断",
            "arrangement": "围绕中心重复放射"
          },
          "area_ratio": "内圈主体",
          "fill_state": "填色较完整，有轻微手绘纹理",
          "whitespace_state": "留白少",
          "relation_to_neighbors": [
            "外侧接浅蓝几何框",
            "再外侧接粉色环带"
          ],
          "visible_evidence": "黄绿花瓣围绕中心点展开。"
        },
        {
          "id": "inner-002",
          "position": "内圈外缘",
          "description": "浅蓝色几何框包住中心花瓣，呈方形回折填色区和矩形色块关系。",
          "color": {
            "main": "浅蓝色",
            "depth": "浅",
            "saturation": "中等"
          },
          "shape": {
            "type": "方形回折、矩形色块",
            "edge": "由浅蓝填色区和相邻色块形成边缘",
            "arrangement": "包裹中心"
          },
          "area_ratio": "内圈到中圈过渡处",
          "fill_state": "浅蓝成片，填色区域清楚",
          "whitespace_state": "留白少",
          "relation_to_neighbors": [
            "内接黄绿花瓣",
            "外接粉色环带"
          ],
          "visible_evidence": "浅蓝几何填色区承接中心花瓣。"
        },
        {
          "id": "inner-003",
          "position": "内圈外侧",
          "description": "粉色环带围绕浅蓝填色区外侧，形成柔和颜色过渡。",
          "color": {
            "main": "粉色",
            "depth": "浅",
            "saturation": "柔和"
          },
          "shape": {
            "type": "环带、圆弧",
            "edge": "由粉色填色带形成",
            "arrangement": "围绕浅蓝区连续包裹"
          },
          "area_ratio": "内圈外侧一圈",
          "fill_state": "粉色较柔和，面积适中",
          "whitespace_state": "留白少",
          "relation_to_neighbors": [
            "连接内圈浅蓝框和中圈叶片"
          ],
          "visible_evidence": "粉色环带形成内中圈之间的过渡。"
        }
      ],
      "intra_circle_relations": [
        "黄绿中心向外放射，浅蓝几何区承接，粉色环带过渡。"
      ],
      "uncertainties": []
    },
    "middle": {
      "summary": "中圈由黄绿叶片、蓝色矩形块、浅蓝回折区域、米色格子和紫粉星形组成，重复节奏明显。",
      "visual_units": [
        {
          "id": "middle-001",
          "position": "中圈四向扩展区域",
          "description": "黄绿色叶片从内圈向外重复展开，叶片之间有黄色和橙色小区域。",
          "color": {
            "main": "黄绿色",
            "secondary": [
              "黄色",
              "橙色"
            ],
            "depth": "明亮",
            "saturation": "中等偏高"
          },
          "shape": {
            "type": "叶状、弧形、重复放射",
            "edge": "由填色叶片形成",
            "arrangement": "四向重复展开"
          },
          "area_ratio": "中圈主要面积",
          "fill_state": "黄绿较亮，黄色面积较大，橙色点缀",
          "whitespace_state": "留白少",
          "relation_to_neighbors": [
            "内接粉色环带",
            "外接浅蓝场域和矩形框"
          ],
          "visible_evidence": "黄绿叶片从内圈向外重复延伸。"
        },
        {
          "id": "middle-002",
          "position": "中圈左右及上下结构位",
          "description": "蓝色矩形块、浅蓝回折填色区和米色格子填色区在四个方向重复出现。",
          "color": {
            "main": "深蓝色、浅蓝色、米黄色",
            "depth": "深浅对比明显",
            "saturation": "中等"
          },
          "shape": {
            "type": "矩形、方形格子、回折形色块",
            "edge": "由蓝色和米色填色区形成",
            "arrangement": "四向结构骨架"
          },
          "area_ratio": "中圈四向结构骨架",
          "fill_state": "蓝色较深，米色较浅，填色区对比明显",
          "whitespace_state": "留白少",
          "relation_to_neighbors": [
            "位于黄绿叶片与浅蓝外场之间"
          ],
          "visible_evidence": "蓝色矩形和米色格子形成中圈承接结构。"
        },
        {
          "id": "middle-003",
          "position": "中圈内外过渡",
          "description": "紫粉色星形分布在浅蓝区域中，和黄绿叶片之间形成点状外放。",
          "color": {
            "main": "紫粉色",
            "depth": "中等",
            "saturation": "中等偏高"
          },
          "shape": {
            "type": "星形、尖角",
            "edge": "由紫粉填色形成",
            "arrangement": "点状分布"
          },
          "area_ratio": "中圈过渡点缀",
          "fill_state": "面积较小但视觉醒目",
          "whitespace_state": "周围有浅蓝场域",
          "relation_to_neighbors": [
            "位于浅蓝场域内",
            "靠近黄绿叶片和粉色环带"
          ],
          "visible_evidence": "紫粉星形作为小面积外放点缀。"
        }
      ],
      "intra_circle_relations": [
        "黄绿叶片持续向外，蓝色和米色方形结构提供承接，紫粉星形形成小面积外放。"
      ],
      "uncertainties": []
    },
    "outer": {
      "summary": "外圈浅蓝场域面积大，粉色外环连续包裹，紫色圆点和四角花饰形成多个表达点。",
      "visual_units": [
        {
          "id": "outer-001",
          "position": "外圈背景",
          "description": "浅蓝色成片铺在外圈，围绕中圈形成一层宽阔场域。",
          "color": {
            "main": "浅蓝色",
            "depth": "浅",
            "saturation": "中等偏低"
          },
          "shape": {
            "type": "弧形场域、环状背景",
            "edge": "由浅蓝填色区域形成",
            "arrangement": "围绕中圈展开"
          },
          "area_ratio": "外圈主要背景",
          "fill_state": "浅蓝面积大，填色较轻",
          "whitespace_state": "外场较开阔",
          "relation_to_neighbors": [
            "内接黄绿叶片和蓝色结构",
            "外接粉色外环"
          ],
          "visible_evidence": "浅蓝成片外场构成外圈底色。"
        },
        {
          "id": "outer-002",
          "position": "最外缘",
          "description": "粉色外环沿最外圈包裹整幅画，形成连续外缘色带。",
          "color": {
            "main": "粉色",
            "depth": "浅",
            "saturation": "柔和"
          },
          "shape": {
            "type": "外环、圆弧色带",
            "edge": "由粉色填色带形成",
            "arrangement": "连续包裹"
          },
          "area_ratio": "最外缘",
          "fill_state": "粉色柔和，外缘色带连续",
          "whitespace_state": "留白少",
          "relation_to_neighbors": [
            "包住浅蓝外场"
          ],
          "visible_evidence": "粉色外环形成外部收束。"
        },
        {
          "id": "outer-003",
          "position": "外圈周边",
          "description": "紫色圆点沿外圈规律分布，数量较多，像一圈节奏点。",
          "color": {
            "main": "紫色",
            "depth": "中等偏深",
            "saturation": "中等"
          },
          "shape": {
            "type": "圆点、重复排列",
            "edge": "由紫色点状填色形成",
            "arrangement": "沿外圈规律重复"
          },
          "area_ratio": "单点面积小，数量较多",
          "fill_state": "点状填色清楚",
          "whitespace_state": "落在浅蓝外场中",
          "relation_to_neighbors": [
            "靠近粉色外环",
            "与浅蓝外场相邻"
          ],
          "visible_evidence": "紫色圆点在外圈形成重复节奏。"
        },
        {
          "id": "outer-004",
          "position": "四角装饰位",
          "description": "四角有紫色花瓣包围橙黄色星形的装饰组合，和蓝色矩形结构相邻。",
          "color": {
            "main": "紫色、橙黄色、蓝色",
            "depth": "中等",
            "saturation": "橙黄色较醒目"
          },
          "shape": {
            "type": "花瓣状、星形、矩形",
            "edge": "由填色花瓣和星形形成",
            "arrangement": "四角重复"
          },
          "area_ratio": "四角重复装饰",
          "fill_state": "橙黄色星形醒目，紫色花瓣包裹",
          "whitespace_state": "留白少",
          "relation_to_neighbors": [
            "连接外圈浅蓝场域和中圈蓝色矩形结构"
          ],
          "visible_evidence": "四角紫色花瓣和橙黄星形形成外圈表达点。"
        }
      ],
      "intra_circle_relations": [
        "浅蓝外场承载多个点状和星形表达点，粉色外环持续包裹。"
      ],
      "uncertainties": []
    }
  },
  "inter_circle_relations": [
    "中心黄绿花瓣到中圈黄绿叶片有连续生长感。",
    "浅蓝从内圈承接区延伸到中圈和外圈，形成流动底色。",
    "粉色环带在内圈外侧和最外缘都出现，形成温和包裹。"
  ],
  "evidence_summary": [
    "中心黄绿花瓣稳定。",
    "浅蓝几何区和外场明显。",
    "方形、矩形、格子结构明显。",
    "外圈圆点和星形表达点多。",
    "整体三圈连续，没有明显断裂。"
  ],
  "uncertainties": [
    "三圈边界为演练口径，非本次重新测量的精确半径。",
    "颜色深浅为人工视觉判断，未做像素级统计。",
    "原始黑色线框画稿已按底图模板处理，不作为作者填色证据。"
  ]
}
```

## Stage 04: 直断法双路命中检查

本阶段的 `knowledge_refs` 只指向知识库具体条目；执行文档另放在 `prompt_refs` / `spec_refs`。

```json
{
  "stage": "stage-04-direct-judgment-high-hit-check",
  "strong_hits": [
    {
      "mode": "蓝绿搭配",
      "mode_id": "direct_judgment.blue_green_expression",
      "result": "consistent",
      "visual_unit_refs": [
        "inner-001",
        "inner-002",
        "middle-001",
        "outer-001"
      ],
      "knowledge_refs": [
        "packs/v2.1/rules/direct_judgments.yaml::judgments.direct_judgment.blue_green_expression"
      ]
    },
    {
      "mode": "外圈花边、星星点点",
      "mode_id": "direct_judgment.outer_decorative_fragmented",
      "result": "consistent",
      "visual_unit_refs": [
        "outer-003",
        "outer-004",
        "middle-003"
      ],
      "knowledge_refs": [
        "packs/v2.1/rules/direct_judgments.yaml::judgments.direct_judgment.outer_decorative_fragmented"
      ]
    }
  ],
  "knowledge_refs": [
    "packs/v2.1/rules/direct_judgments.yaml::judgments.direct_judgment.blue_green_expression",
    "packs/v2.1/rules/direct_judgments.yaml::judgments.direct_judgment.outer_decorative_fragmented"
  ],
  "visual_observations_not_direct_judgments": [
    {
      "name": "方形/矩形结构明显",
      "reason": "当前直断知识库没有该模式条目，因此不作为 stage-04 直断命中；仅作为 stage-03 视觉证据和 stage-05 形状五行映射依据。",
      "visual_unit_refs": [
        "inner-002",
        "middle-002"
      ],
      "evidence_refs": [
        "stage-03.visual_units.inner-002",
        "stage-03.visual_units.middle-002"
      ]
    }
  ],
  "prompt_refs": [
    "第04步直断命中检查Prompt.md"
  ]
}
```

## Stage 05: 逐圈颜色、形状五行感知映射

本阶段的 `knowledge_refs` 只指向知识库具体条目；执行文档另放在 `prompt_refs` / `spec_refs`。

```json
{
  "stage": "stage-05-per-circle-color-shape-element-sensing",
  "unit_results": [
    {
      "visual_unit_id": "inner-001",
      "circle": "inner",
      "combined_element_tendency": "黄色对应土，黄绿色与放射状排列对应木；本单元只稳定判断为土木并见，不直接生成心理结论。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/土/黄色",
        "颜色五行感知规则.md::五行颜色基础映射/木/黄绿色",
        "形状五行感知规则.md::形状五行基础映射/木/放射状",
        "三圈语义与能量流动.md::三圈基础语义/内圈",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.土",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.木",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.土",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.木"
      ],
      "evidence_refs": [
        "stage-03.visual_units.inner-001"
      ]
    },
    {
      "visual_unit_id": "inner-002",
      "circle": "inner",
      "combined_element_tendency": "浅蓝色按颜色规则归水；方形回折填色区按形状规则归土。本单元记录为水被土形承接，后续是否形成土克水需到第 6 步看强弱。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/水/蓝色",
        "形状五行感知规则.md::形状五行基础映射/土/方形/矩形",
        "五行生克与失衡模式.md::基础关系/相克/土克水",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.水",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.土",
        "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相克.土"
      ],
      "evidence_refs": [
        "stage-03.visual_units.inner-002"
      ]
    },
    {
      "visual_unit_id": "middle-001",
      "circle": "middle",
      "combined_element_tendency": "黄绿色与放射延展形态共同支持木；黄色与橙色分别作为土、火候选保留。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/木/黄绿色",
        "颜色五行感知规则.md::五行颜色基础映射/土/黄色",
        "颜色五行感知规则.md::五行颜色基础映射/火/橙色",
        "形状五行感知规则.md::形状五行基础映射/木/放射状",
        "三圈语义与能量流动.md::三圈基础语义/中圈",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.木",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.土",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.火",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.木"
      ],
      "evidence_refs": [
        "stage-03.visual_units.middle-001"
      ]
    },
    {
      "visual_unit_id": "middle-002",
      "circle": "middle",
      "combined_element_tendency": "蓝色按颜色规则归水，方形/矩形按形状规则归土；本单元记录为水与土形并见，不直接推导现实状态。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/水/蓝色",
        "颜色五行感知规则.md::五行颜色基础映射/土/黄色",
        "形状五行感知规则.md::形状五行基础映射/土/方形/矩形",
        "五行生克与失衡模式.md::基础关系/相克/土克水",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.水",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.土",
        "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相克.土"
      ],
      "evidence_refs": [
        "stage-03.visual_units.middle-002"
      ]
    },
    {
      "visual_unit_id": "outer-001",
      "circle": "outer",
      "combined_element_tendency": "外圈浅蓝按颜色规则归水，环状区域按形状规则归金；本单元记录为水与金形并见。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/水/蓝色",
        "形状五行感知规则.md::形状五行基础映射/金/环形",
        "三圈语义与能量流动.md::三圈基础语义/外圈",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.水",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.金",
        "packs/v2.1/circles/three_circles.yaml::payload.three_circles.外圈"
      ],
      "evidence_refs": [
        "stage-03.visual_units.outer-001"
      ]
    },
    {
      "visual_unit_id": "outer-003",
      "circle": "outer",
      "combined_element_tendency": "紫色按颜色规则归火；圆点按形状规则可归金，点状重复也可作为水形候选。本单元存在颜色与形状方向不一致。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/火/紫色",
        "形状五行感知规则.md::形状五行基础映射/金/圆形",
        "形状五行感知规则.md::形状五行基础映射/水/点状",
        "形状五行感知规则.md::形状与颜色的关系/冲突",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.火",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.金",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.水"
      ],
      "evidence_refs": [
        "stage-03.visual_units.outer-003"
      ]
    },
    {
      "visual_unit_id": "outer-004",
      "circle": "outer",
      "combined_element_tendency": "橙黄色和紫色按颜色规则归火，星形按形状规则归火；本单元可稳定记录为火性表达候选。",
      "knowledge_refs": [
        "颜色五行感知规则.md::五行颜色基础映射/火/橙色/紫色",
        "形状五行感知规则.md::形状五行基础映射/火/星形",
        "三圈语义与能量流动.md::三圈基础语义/外圈",
        "packs/v2.1/elements/color_meanings.yaml::payload.color_meanings.火",
        "packs/v2.1/elements/five_elements.yaml::payload.five_elements.火",
        "packs/v2.1/circles/three_circles.yaml::payload.three_circles.外圈"
      ],
      "evidence_refs": [
        "stage-03.visual_units.outer-004"
      ]
    }
  ],
  "circle_summaries": [
    {
      "circle": "inner",
      "summary": "内圈可稳定记录为木、土候选较明显，水和火作为辅助色候选保留；不直接生成心理结论。",
      "knowledge_refs": [
        "三圈语义与能量流动.md::三圈基础语义/内圈",
        "颜色五行感知规则.md::圈层语境/内圈",
        "packs/v2.1/circles/three_circles.yaml::内圈"
      ],
      "evidence_refs": [
        "stage-05.unit_results.inner-001",
        "stage-05.unit_results.inner-002"
      ]
    },
    {
      "circle": "middle",
      "summary": "中圈可稳定记录为木、水、土候选并见，火作为星形和橙色点缀候选保留。",
      "knowledge_refs": [
        "三圈语义与能量流动.md::三圈基础语义/中圈",
        "颜色五行感知规则.md::圈层语境/中圈",
        "packs/v2.1/circles/three_circles.yaml::中圈"
      ],
      "evidence_refs": [
        "stage-05.unit_results.middle-001",
        "stage-05.unit_results.middle-002",
        "stage-05.unit_results.middle-003"
      ]
    },
    {
      "circle": "outer",
      "summary": "外圈可稳定记录为水色面积较大、火性点状表达明显，金和土来自圆点、环形和方形填色结构的形状候选。",
      "knowledge_refs": [
        "三圈语义与能量流动.md::三圈基础语义/外圈",
        "颜色五行感知规则.md::圈层语境/外圈",
        "packs/v2.1/circles/three_circles.yaml::外圈"
      ],
      "evidence_refs": [
        "stage-05.unit_results.outer-001",
        "stage-05.unit_results.outer-003",
        "stage-05.unit_results.outer-004"
      ]
    }
  ],
  "spec_refs": [
    "第05步颜色形状五行感知映射规范.md"
  ]
}
```

## Stage 06: 逐圈五行生克与主题映射分析

本阶段的 `knowledge_refs` 只指向知识库具体条目；执行文档另放在 `prompt_refs` / `spec_refs`。

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
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相生/水生木",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相生.水",
            "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相生.水"
          ],
          "evidence_refs": [
            "stage-05.unit_results.inner-001",
            "stage-05.unit_results.inner-002"
          ]
        },
        {
          "relation": "wood_controls_earth_candidate",
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/木克土",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.木",
            "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相克.木"
          ],
          "evidence_refs": [
            "stage-05.unit_results.inner-001"
          ]
        }
      ],
      "circle_semantic_refs": [
        "三圈语义与能量流动.md::三圈基础语义/内圈",
        "packs/v2.1/circles/three_circles.yaml::内圈"
      ],
      "theme_mapping": [
        {
          "theme": "general",
          "interpretation_candidate": "通用主题下，只能候选解释为内在生长与自我承接同时出现。",
          "knowledge_refs": [
            "主题知识与疗愈映射.md::当前主题域/general",
            "主题知识与疗愈映射.md::主题挂载原则",
            "packs/v2.1/rules/theme_mappings.yaml::payload.mappings.general"
          ],
          "evidence_refs": [
            "stage-05.circle_summaries.inner"
          ]
        }
      ]
    },
    {
      "circle": "middle",
      "element_relations": [
        {
          "relation": "water_generates_wood_candidate",
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相生/水生木",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相生.水",
            "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相生.水"
          ],
          "evidence_refs": [
            "stage-05.unit_results.middle-001",
            "stage-05.unit_results.middle-002"
          ]
        },
        {
          "relation": "earth_controls_water_candidate",
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/土克水",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.土",
            "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相克.土"
          ],
          "evidence_refs": [
            "stage-05.unit_results.middle-002"
          ]
        }
      ],
      "circle_semantic_refs": [
        "三圈语义与能量流动.md::三圈基础语义/中圈",
        "packs/v2.1/circles/three_circles.yaml::中圈"
      ],
      "theme_mapping": [
        {
          "theme": "general",
          "interpretation_candidate": "通用主题下，只能候选解释为当下能量有生长和流动，同时需要结构承接。",
          "knowledge_refs": [
            "主题知识与疗愈映射.md::当前主题域/general",
            "主题知识与疗愈映射.md::主题映射方式",
            "packs/v2.1/rules/theme_mappings.yaml::payload.mappings.general"
          ],
          "evidence_refs": [
            "stage-05.circle_summaries.middle"
          ]
        }
      ]
    },
    {
      "circle": "outer",
      "element_relations": [
        {
          "relation": "water_controls_fire_candidate",
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/水克火",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.水",
            "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相克.水"
          ],
          "evidence_refs": [
            "stage-05.unit_results.outer-001",
            "stage-05.unit_results.outer-004"
          ]
        },
        {
          "relation": "fire_controls_metal_candidate",
          "knowledge_refs": [
            "五行生克与失衡模式.md::基础关系/相克/火克金",
            "packs/v2.1/elements/five_elements.yaml::relations.five_elements_relations.相克.火",
            "packs/v2.1/elements/five_elements.yaml::payload.relations.five_elements_relations.相克.火"
          ],
          "evidence_refs": [
            "stage-05.unit_results.outer-003",
            "stage-05.unit_results.outer-004"
          ]
        }
      ],
      "circle_semantic_refs": [
        "三圈语义与能量流动.md::三圈基础语义/外圈",
        "packs/v2.1/circles/three_circles.yaml::外圈"
      ],
      "theme_mapping": [
        {
          "theme": "general",
          "interpretation_candidate": "通用主题下，只能候选解释为外在表达点较多，且需要聚焦；不能直接判断焦虑或混乱。",
          "knowledge_refs": [
            "主题知识与疗愈映射.md::当前主题域/general",
            "主题知识与疗愈映射.md::主题映射方式",
            "packs/v2.1/rules/theme_mappings.yaml::payload.mappings.general"
          ],
          "evidence_refs": [
            "stage-05.circle_summaries.outer"
          ]
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
  },
  "spec_refs": [
    "第06步五行生克与主题映射规范.md"
  ]
}
```

## Stage 07: 逐圈失衡模式浮现

本阶段的 `knowledge_refs` 只指向知识库具体条目；执行文档另放在 `prompt_refs` / `spec_refs`。

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
        "packs/v2.1/rules/imbalance_types.yaml::payload.imbalances.transition-overload",
        "packs/v2.1/rules/theme_mappings.yaml::payload.mappings.general.transition-overload"
      ],
      "evidence_refs": [
        "stage-03.visual_units.middle-001",
        "stage-03.visual_units.middle-002",
        "stage-03.visual_units.outer-001",
        "stage-06.circle_results"
      ],
      "evidence_chain": [
        {
          "type": "visual",
          "summary": "中圈黄绿叶片向外展开，同时蓝色矩形和米色格子提供承接结构。",
          "evidence_refs": [
            "stage-03.visual_units.middle-001",
            "stage-03.visual_units.middle-002"
          ]
        },
        {
          "type": "element_relation",
          "summary": "中圈同时出现水生木和土克水候选，开放与承接并存。",
          "evidence_refs": [
            "stage-06.circle_results.middle.element_relations"
          ]
        },
        {
          "type": "theme_mapping",
          "summary": "general 主题下 transition-overload 对应新旧节奏暂时不同步。",
          "knowledge_refs": [
            "packs/v2.1/rules/theme_mappings.yaml::payload.mappings.general.transition-overload"
          ]
        }
      ]
    }
  ],
  "watch_only": [
    {
      "name": "承接结构偏强",
      "reason": "知识库没有对应失衡条目，且当前证据不足以匹配土多水干、金多木折或其他具体失衡；只能作为观察项。",
      "knowledge_refs": [
        "五行生克与失衡模式.md::失衡浮现原则",
        "packs/v2.1/rules/imbalance_types.yaml::payload.imbalances.土多水干",
        "packs/v2.1/rules/imbalance_types.yaml::payload.imbalances.金多木折"
      ],
      "evidence_refs": [
        "stage-05.unit_results.inner-002",
        "stage-05.unit_results.middle-002"
      ]
    },
    {
      "name": "外圈表达点分散",
      "reason": "外圈点状元素较多，但知识库没有独立失衡条目支持该命名；只能作为外圈观察项，交给第 8 步能量流动判断。",
      "knowledge_refs": [
        "三圈语义与能量流动.md::常见流动类型/跳跃",
        "packs/v2.1/circles/three_circles.yaml::payload.three_circles.外圈"
      ],
      "evidence_refs": [
        "stage-05.unit_results.outer-003",
        "stage-05.unit_results.outer-004"
      ]
    }
  ],
  "not_selected_as_core": [
    "单一土过重：黄色明显，但水、木、火、金都有稳定证据，不宜简化为单一土主导。",
    "明显断裂：画面整体对称、三圈连续，没有明显断裂。",
    "水多火灭：外圈有水克火候选，但缺少蓝色占比极高、火极弱等知识库要求的证据。"
  ],
  "spec_refs": [
    "第07步失衡模式浮现规范.md"
  ]
}
```

## Stage 08: 能量流动诊断

```json
{
  "stage": "stage-08-energy-flow-diagnosis",
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
  ],
  "knowledge_refs": [
    "三圈语义与能量流动.md::整体能量流动",
    "三圈语义与能量流动.md::顺畅/卡点/跳跃",
    "packs/v2.1/circles/three_circles.yaml::payload.energy_flow"
  ],
  "evidence_refs": [
    "stage-03-visual-evidence",
    "stage-05-per-circle-color-shape-element-sensing",
    "stage-07-per-circle-imbalance-patterns"
  ]
}
```

## Stage 09: 证据池整合

```json
{
  "stage": "stage-09-evidence-consolidation",
  "strong_evidence": [
    "中心黄绿花瓣稳定，三圈结构清楚。",
    "蓝绿搭配明显，支持流动与生长并存。",
    "方形、矩形、格子、回折形填色区和外环形成明显承接结构。",
    "外圈紫色圆点、星形、花饰较多。",
    "画面整体对称，没有明显断裂。"
  ],
  "weak_evidence": [
    "渐变主要来自手绘涂色，不作为核心判断。",
    "黄色明显，但不单独主导全画。"
  ],
  "conflicts": [
    "不能把这张画简单归为能量不足。",
    "不能把外圈点状装饰直接解释成混乱，因为它们分布有规律。"
  ],
  "rule": "只整合第 1-8 步已有证据，不新增画面事实或失衡标签。",
  "evidence_refs": [
    "stage-01-user-input-context",
    "stage-03-visual-evidence",
    "stage-04-direct-judgment-high-hit-check",
    "stage-05-per-circle-color-shape-element-sensing",
    "stage-06-per-circle-element-generation-control",
    "stage-07-per-circle-imbalance-patterns",
    "stage-08-energy-flow-diagnosis"
  ]
}
```

## Stage 10: 核心解读主轴选择

```json
{
  "stage": "stage-10-core-thesis-selection",
  "selected_thesis": "这张画最核心的状态，是生命力和表达意愿已经在场，但它们需要通过清晰的承接结构和可承受节奏，被安全地带到外在行动里。",
  "confidence_boundary": "这是通用主题下的自我整理和成长节奏判断，不应扩展成确定的人格诊断。"
}
```

## Stage 11: 用户可见表达框架

```json
{
  "stage": "stage-11-user-facing-framing",
  "opening_hit_point": "你现在不像是没有力量，而是力量已经慢慢回来；真正需要学习的是，怎样让这些力量在稳定承接里表达出来。",
  "term_explanations": [
    "三圈",
    "五行",
    "生克"
  ],
  "visual_basis_candidates": [
    "中心黄绿花瓣",
    "浅蓝几何承接区和外场",
    "方形/矩形/格子结构",
    "粉色环带",
    "外圈紫色圆点和星形表达点"
  ],
  "style_rule": "术语可以使用，但必须紧跟通俗解释。"
}
```

## Stage 12: 疗愈方向与 Lite / Pro 分流

```json
{
  "stage": "stage-12-healing-direction-and-report-branching",
  "healing_direction": "先承认生命力已经在场，再选择一个足够小、足够安全的表达出口，让承接结构服务表达，而不是替代表达。",
  "lite_writing_input_summary": "你不是没有力量，而是正在学习让力量安全地表达。",
  "pro_writing_input_summary": "这张画呈现的是有承接结构的开放流动。"
}
```

## Stage 13: Lite 报告草稿

```json
{
  "stage": "stage-13-lite-draft",
  "path": "lite.report.md",
  "visual_module_count": 2,
  "source_stage_refs": [
    "stage-09",
    "stage-10",
    "stage-11",
    "stage-12"
  ]
}
```

## Stage 14: Pro 报告草稿

```json
{
  "stage": "stage-14-pro-draft",
  "path": "pro.report.md",
  "visual_module_count": 4,
  "source_stage_refs": [
    "stage-07",
    "stage-08",
    "stage-09",
    "stage-10",
    "stage-11",
    "stage-12"
  ]
}
```

## Stage 15: 可视化资产生成

```json
{
  "stage": "stage-15-visual-assets",
  "executed": false,
  "fallback_available": true,
  "reason": "本次只重跑报告文本和可视化模块说明，不实际调用文生图模型。"
}
```

## Stage 16: 最终质检与组装

```json
{
  "stage": "stage-16-final-report",
  "path": "final.package.md",
  "qa_result": "pass_with_manual_review_required",
  "notes": "结构、引用和敏感信息检查通过；内容口吻仍需产品侧人工评审。"
}
```

## QA 检查结论

- Stage 03 已按 `visual_units` 输出，并显式忽略原始黑色线稿。
- Stage 04 只保留知识库真实存在的直断命中：`direct_judgment.blue_green_expression` 和 `direct_judgment.outer_decorative_fragmented`。
- Stage 05 每个视觉单元和圈层汇总均包含知识库具体条目。
- Stage 06 每条生克关系、主题映射和用户输入回应均包含知识库具体条目。
- Stage 07 唯一进入候选的失衡为 `transition-overload`，其余未被知识库支持的命名均降级为 `watch_only`。
- Lite 包含 2 个可视化模块说明，Pro 包含 4 个可视化模块说明。
- 本次输出未包含 API key、私有 env 路径或运行时私有数据。
