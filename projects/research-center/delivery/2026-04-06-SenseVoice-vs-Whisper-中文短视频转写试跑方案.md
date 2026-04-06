# SenseVoice vs Whisper 中文短视频转写试跑方案

> 状态：working
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-06
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/delivery/2026-04-06-SenseVoice-vs-Whisper-中文短视频转写试跑方案.md
> 项目：研究中心
> 阶段：delivery

这份文档用于定义 `SenseVoice` 与 `Whisper / faster-whisper` 在中文短视频场景下的最小试跑对比方案。

目标不是做学术 benchmark，而是判断：

- 哪个引擎更适合作为当前默认转写 backend

## 1. 试跑目标

本轮只验证 3 个问题：

1. 中文短视频口播转写准确率谁更稳
2. 带背景音乐、压缩和口语化表达时谁更可用
3. 哪个方案更适合接入 `media-transcribe`

## 2. 对比对象

- A 组：
  - `SenseVoice`
- B 组：
  - `Whisper / faster-whisper`

说明：

- 如果 `Whisper` 原版部署成本过高，允许直接用 `faster-whisper` 代表 Whisper 路线

## 3. 试跑样本

第一轮建议只选 3 个中文视频样本：

1. 抖音口播视频
   - 节奏快、信息密度高
2. 小红书视频
   - 口语化更强、停顿和转场多
3. 带背景音乐的短视频
   - 用来验证抗噪能力

要求：

- 样本长度控制在 30 秒到 3 分钟
- 每个样本都能提供原始链接和本地音频或视频文件

## 4. 执行步骤

### 第一步：统一抽音频

所有样本都先用同一方式抽取音频：

- 单声道
- 16k 或 16k 以上

避免因为前处理不同影响结果。

### 第二步：分别转写

同一个样本分别用：

- `SenseVoice`
- `Whisper / faster-whisper`

各跑一轮。

### 第三步：人工对比

按同一套标准人工比较两份结果。

## 5. 评价维度

### 5.1 准确率维度

- 中文专有名词是否正确
- 关键判断句是否失真
- 是否漏掉关键信息
- 是否把口语词错误扩写成别的意思

### 5.2 可读性维度

- 断句是否自然
- 标点是否可用
- 是否方便直接进入 source-pack

### 5.3 鲁棒性维度

- 背景音乐下是否明显掉字
- 快语速下是否明显错字
- 平台压缩音频下是否明显失真

### 5.4 成本维度

- 单次推理耗时
- 本机资源占用
- 安装与维护复杂度

## 6. 判定规则

满足以下多数条件的引擎，可作为当前默认候选：

- 关键句准确率更高
- 中文专有名词错误更少
- 背景噪音下可读性更好
- 本机运行成本可接受

## 7. 输出结果

每个样本最终应输出：

- 样本说明
- `SenseVoice` 转写结果
- `Whisper / faster-whisper` 转写结果
- 人工对比结论
- 默认推荐引擎判断

## 8. 当前建议

当前不建议仅凭历史印象继续默认 `Whisper`。

更合理的做法是：

- 先用 3 个真实样本做小规模试跑
- 如果 `SenseVoice` 在中文视频场景下明显更稳，就将其设为默认 backend
- `Whisper / faster-whisper` 退为 fallback
