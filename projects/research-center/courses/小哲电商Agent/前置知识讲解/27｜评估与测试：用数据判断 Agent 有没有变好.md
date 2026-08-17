# 评估与测试：用数据判断 Agent 有没有变好

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396398879-e5256f5d-1ae9-4fd9-9817-278f29714062.png" title="null" crop="0,0,1,1" id="u4evc" class="ne-image">

本节总览图：这张图从 `测试数据集 Dataset` 开始，进入 `target agent`，输出结果后进入 `evaluators`，再生成 `experiment`。Evaluator 分成规则评估、人工评估和 LLM-as-judge。右侧画对比实验：prompt v1 和 prompt v2 在同一 dataset 上比较正确率、引用率、延迟和成本。

## 课程目标

学完这一节，你应该能说清：
- 为什么 Agent 不能只靠手工试几句。
- Dataset、Evaluator、Experiment 分别是什么。
- 节点测试和端到端评估有什么区别。
- 电商客服评估集应该包含哪些问题。
- 常见指标：正确性、引用、拒答、工具调用、延迟、成本。
- LLM-as-judge 的价值和风险。

---

## 1. 为什么需要评估 你改了一版 prompt，模型看起来更礼貌了。但它是否真的更好？

你需要回答：
- 正确率有没有提高。
- 有没有更少编造政策。
- 工具调用是否更准确。
- 拒答是否更稳。
- 延迟和成本是否可接受。
- 有没有在旧场景上退步。
评估的目标是：

```latex
用一组稳定样例和明确评分标准比较不同版本。
```

---

## 2. LangSmith 评估三要素 官方 quickstart 中，评估通常有三类核心对象：

| 对象 | 作用 |
| --- | --- |
| Dataset | 测试输入和可选参考答案 |
| Evaluator | 对输出打分的函数或模型 |
| Experiment | 一次评估运行及结果 |

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396398933-203b9de6-64c0-46ac-8175-a54d7991941d.png" title="null" crop="0,0,1,1" id="EtWtL" class="ne-image">

Dataset Evaluator Experiment 图：这张图画 Dataset 提供多条 example，每条 example 输入 target agent，输出 answer；answer 和 reference 进入 Evaluator，得到 score 和 comment；所有结果汇总成 Experiment。图中强调同一 Dataset 可以反复评估不同版本。

---

## 3. 电商客服评估集应该包含什么 至少覆盖：
- 普通商品咨询。
- 订单物流查询。
- 售后政策问答。
- 缺少订单号的追问。
- 知识库没有答案。
- 高风险退款或赔付请求。
- 用户试图越权或诱导承诺。
- 多轮上下文问题。
不要只放“模型容易答对”的样例。评估集要包含边界和失败场景。

---

## 4. 常见评估指标 | 指标 | 说明 |
| --- | --- |
| 正确性 | 答案是否符合事实和政策 |
| 引用率 | RAG 回答是否给出来源 |
| 工具调用准确性 | 是否该调用工具、工具参数是否正确 |
| 拒答边界 | 高风险问题是否没有越权承诺 |
| 完整性 | 是否回答了用户关键问题 |
| 延迟 | 用户等待时间 |
| 成本 | token 和工具调用成本 | ---

## 5. 节点测试和端到端测试 LangGraph 支持测试单个节点和边，也可以测试完整图。 节点测试适合：
- 分类节点是否输出正确 intent。
- 路由函数是否走正确分支。
- 工具包装是否处理错误。
端到端测试适合：
- 用户问题到最终回答是否正确。
- Agent 是否按预期调用工具。
- 多轮流程是否能完成。
两者都需要。只测端到端，定位问题慢；只测节点，无法保证整体效果。

---

## 6. 最小评估样例

```python
examples = [{'input': '订单 20260001 到哪了？', 'expected': {'should_call_tool': True, 'tool_name': 'get_order_logistics'}}, {'input': '签收 10 天还能无理由退吗？', 'expected': {'should_use_policy': True, 'must_not_promise_refund': True}}]
```

这只是评估数据的雏形。真正评估会把 target function、evaluator 和实验结果组织起来。

---

## 7. LLM-as-judge 的边界 LLM-as-judge 可以评估语义质量，比如回答是否完整、是否遵守规则。但它也可能误判。 建议：
- 关键业务规则优先用确定性评估。
- 语义质量可以用 LLM 评估。
- 高风险场景保留人工抽检。
- evaluator 本身也要迭代。

---

## 8. 常见错误

### 错误一：只手测几条成功案例 这无法发现回归。

### 错误二：评估集没有边界问题 没有高风险样例，就无法评估安全边界。

### 错误三：只看平均分 平均分可能掩盖退款、隐私、越权这类严重错误。

---

## 9. 本节知识框架总结

```latex
评估 -> Dataset：稳定样例 -> Evaluator：评分规则 -> Experiment：一次运行结果 -> 节点测试 + 端到端测试 -> 指标包括正确性、引用、工具调用、拒答、延迟、成本 -> LLM-as-judge 适合语义评估，但不能替代确定性规则
```

## 10. 本节小结 你需要记住：
1. Agent 迭代必须有评估集。
2. Dataset、Evaluator、Experiment 是评估核心。
3. 电商评估要覆盖正常、边界和高风险问题。
4. 节点测试和端到端评估互补。
5. 高风险指标不能被平均分掩盖。
课后练习：
1. 写 10 条电商客服评估样例。
2. 为“不能承诺退款”设计确定性 evaluator。
3. 设计一个 RAG 引用率指标。
4. 比较 prompt v1 和 v2 应该看哪些指标。
