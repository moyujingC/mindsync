请从已有证据中选择报告切入点、叙事顺序和主轴。

返回 JSON：
- entry_circle：从哪一圈开始讲，可选 inner / middle / outer。
- entry_signal：从哪个画面信号切入，写清可见画面依据。
- entry_reason：为什么从这里开始讲。
- core_thesis：整篇报告主轴。
- user_facing_framing：面向用户的开场叙事方向。
- healing_direction：报告最后的调整方向。
- narrative_order：报告叙事顺序，数组，例如 ["middle", "inner", "outer"]。
- integrated_context_threads：需要融入三圈解读里的背景线索，数组，例如 ["relationship", "family", "emotion"]。
- evidence_refs：支撑切入点和主轴的画面证据 id 数组。

注意：
- 不要机械固定为 inner -> middle -> outer。
- 优先选择画面中最有能量、最显眼、最能解释用户主题的信号作为切入点。
- 如果最强信号在中圈或外圈，就从中圈或外圈开始讲。
- 背景线索必须来自三圈画面，不要作为独立模块单独展开。

{payload_json}
