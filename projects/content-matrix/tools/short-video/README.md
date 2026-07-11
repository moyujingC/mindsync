# 短视频代码剪辑工具

这个目录用于把 `墨予镜` 长文或短文观点快速转成抖音 / 小红书可上传的竖屏短视频。

当前最小链路：

1. 写一个 `script.json`
2. 用 Python Pillow（图像绘制库）生成分镜 PNG
3. 用 Node.js 调用 ffmpeg 合成 9:16 mp4
4. 视频里包含标题、分镜字幕、结尾提示和一个数字人头像占位

这里的“数字人头像”先用账号头像或个人头像静态图承接。它不是口型同步数字人，目标是先跑通短视频发布格式和代码剪辑链路。后续可以把头像图层替换成真人口播素材、HeyGen / 即梦 / 可灵等生成的视频片段，或接入本地数字人渲染。

## 使用

```bash
node projects/content-matrix/tools/short-video/make-short-video.mjs \
  --script projects/content-matrix/accounts/墨予镜/short-videos/2026-07-12-ai-fatigue/script.json \
  --out projects/content-matrix/accounts/墨予镜/short-videos/2026-07-12-ai-fatigue/render
```

输出：

- `short-video.mp4`：可上传到抖音 / 小红书的竖屏视频
- `frames/`：自动生成的分镜画面，属于中间产物
- `render-manifest.json`：渲染参数与 ffmpeg 命令记录

依赖：

- Node.js
- Python 3
- Python Pillow
- ffmpeg

## script.json 字段

```json
{
  "title": "短视频标题",
  "subtitle": "墨予镜 | AI 工作系统笔记",
  "avatarImage": "projects/content-matrix/accounts/墨予镜/assets/logo/moyujing-logo-current.png",
  "cta": "关注我，继续记录 AI + 疗愈的真实实践。",
  "scenes": [
    {
      "duration": 4,
      "text": "第一幕字幕"
    }
  ]
}
```

## 当前适用边界

- 适合先跑通平台发布：抖音、小红书、视频号。
- 适合短观点：15-45 秒。
- 暂不负责自动配音、口型同步和真人感数字人。
- 如果要上语音，下一步可以接入 TTS（文字转语音）输出音频，再把 `anullsrc` 静音轨替换成真实音频。
