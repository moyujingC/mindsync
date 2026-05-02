# 本机试跑 SenseVoice 可行性判断

> 状态：working
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-06
> source_of_truth：projects/research-center/delivery/2026-04-06-本机试跑SenseVoice可行性判断.md
> 项目：研究中心
> 阶段：delivery

这份文档用于判断当前这台机器是否适合先本地试跑 `SenseVoice`。

## 1. 当前环境

本机环境检查结果：

- 系统：
  - macOS 14.1.2
- 架构：
  - `arm64`
- 芯片：
  - Apple M1 Pro
- 内存：
  - 16GB
- Python：
  - 3.11.3
- `uv`：
  - 0.10.6
- `ffmpeg`：
  - 已安装
- `yt-dlp`：
  - 当前未安装

## 2. 与试跑目标的匹配度

### 2.1 有利条件

- Apple Silicon 对本地轻量模型试跑比较友好
- 已有 `Python 3.11`
- 已有 `uv`
- 已有 `ffmpeg`
- 当前目标只是“先做小规模试跑”，不是立刻上生产

### 2.2 风险点

- 当前没有现成 `yt-dlp`
  - 链接到媒体文件的自动获取还不完整
- `SenseVoice` 生态对 Linux/NVIDIA 的公开案例更多
  - macOS Apple Silicon 可跑，但需要额外验证依赖兼容性
- 即使模型能跑，最终效果也仍需真实视频验证

## 3. 结合官方信息的判断

结合 `SenseVoice` 官方仓库当前公开信息：

- 官方强调其多语言识别性能和效率，并宣称中文等识别能力优于 Whisper
- 官方提供 Python、FastAPI、Docker 等使用方式
- 官方也列出了多种第三方部署路径

这说明：

- 从“能力层面”看，值得试
- 从“本机快速验证”看，也具备试跑条件
- 但当前更适合先做最小试跑，而不是直接承诺稳定长期接入

## 4. 当前结论

当前这台机器适合先本地试跑 `SenseVoice`。

结论级别：

- `可以试`
- 但还不是“可直接默认接入生产链路”

## 5. 推荐动作

建议按以下顺序推进：

1. 先补齐媒体获取层
   - 至少补一个稳定下载器或手动 source-pack fallback
2. 再对 1 到 3 个真实中文视频样本试跑 `SenseVoice`
3. 同时保留 `Whisper / faster-whisper` 作为对照组
4. 试跑效果通过后，再决定是否把 `SenseVoice` 接成默认 backend

## 6. 暂不建议直接做的事

- 不建议现在就把 `SenseVoice` 视为唯一方案
- 不建议还没跑真实样本就把它写死到正式链路
- 不建议把“下载层失败”和“转写层失败”混为一谈
