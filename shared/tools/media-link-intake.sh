#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  media-link-intake.sh <media-link> [output-dir]

Examples:
  /Users/xinran/Downloads/dev/mindsync/shared/tools/media-link-intake.sh \
    'https://v.douyin.com/xxxxxx/' \
    '/Users/xinran/Downloads/dev/mindsync/tmp/task-22-source-pack'

Notes:
  - Requires: yt-dlp, ffmpeg, python3
  - This script tries to:
    1. fetch metadata
    2. download the media file
    3. extract a mono 16k wav audio file
    4. write a minimal source-pack.md
  - If download fails, it still writes source-pack.md with failure details
EOF
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$cmd" >&2
    exit 1
  fi
}

slugify() {
  printf '%s' "$1" | tr '/: ?&=%#' '_' | tr -cd '[:alnum:]_.-'
}

timestamp() {
  date '+%Y%m%d-%H%M%S'
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || "${1:-}" == "help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

require_command yt-dlp
require_command ffmpeg
require_command python3

MEDIA_LINK="$1"
DEFAULT_DIR="$(pwd)/tmp/media-intake-$(timestamp)-$(slugify "${MEDIA_LINK}" | cut -c1-24)"
OUTPUT_DIR="${2:-$DEFAULT_DIR}"
META_DIR="${OUTPUT_DIR}/meta"
MEDIA_DIR="${OUTPUT_DIR}/media"
AUDIO_DIR="${OUTPUT_DIR}/audio"

mkdir -p "$META_DIR" "$MEDIA_DIR" "$AUDIO_DIR"

INFO_JSON="${META_DIR}/info.json"
META_LOG="${META_DIR}/metadata-fetch.log"
DOWNLOAD_LOG="${META_DIR}/download.log"
FFMPEG_LOG="${META_DIR}/ffmpeg.log"
SOURCE_PACK_MD="${OUTPUT_DIR}/source-pack.md"

DOWNLOAD_STATUS="failed"
AUDIO_STATUS="not_attempted"
VIDEO_FILE=""
AUDIO_FILE=""

if yt-dlp --dump-single-json --no-warnings --skip-download "$MEDIA_LINK" >"$INFO_JSON" 2>"$META_LOG"; then
  :
else
  printf '{ "webpage_url": "%s", "extractor_key": "", "title": "", "description": "" }\n' "$MEDIA_LINK" >"$INFO_JSON"
fi

META_TMP="${META_DIR}/meta-fields.txt"
python3 - "$INFO_JSON" >"$META_TMP" <<'PY'
import json, sys
path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
fields = [
    data.get("extractor_key") or "",
    data.get("title") or "",
    data.get("webpage_url") or "",
    data.get("description") or "",
    data.get("uploader") or "",
    data.get("upload_date") or "",
]
for item in fields:
    print(item.replace("\n", " ").strip())
PY

META_LINES=()
while IFS= read -r line || [[ -n "$line" ]]; do
  META_LINES+=("$line")
done <"$META_TMP"

EXTRACTOR_KEY="${META_LINES[0]:-}"
TITLE="${META_LINES[1]:-}"
WEBPAGE_URL="${META_LINES[2]:-$MEDIA_LINK}"
DESCRIPTION="${META_LINES[3]:-}"
UPLOADER="${META_LINES[4]:-}"
UPLOAD_DATE="${META_LINES[5]:-}"

OUTPUT_TEMPLATE="${MEDIA_DIR}/%(title).120B [%(id)s].%(ext)s"
if yt-dlp --no-playlist --output "$OUTPUT_TEMPLATE" "$MEDIA_LINK" >"$DOWNLOAD_LOG" 2>&1; then
  DOWNLOAD_STATUS="success"
  VIDEO_FILE="$(find "$MEDIA_DIR" -type f ! -name '*.info.json' | head -n 1 || true)"
else
  DOWNLOAD_STATUS="failed"
fi

if [[ -n "$VIDEO_FILE" && -f "$VIDEO_FILE" ]]; then
  AUDIO_BASENAME="$(basename "$VIDEO_FILE")"
  AUDIO_BASENAME="${AUDIO_BASENAME%.*}.wav"
  AUDIO_FILE="${AUDIO_DIR}/${AUDIO_BASENAME}"
  if ffmpeg -y -i "$VIDEO_FILE" -vn -ac 1 -ar 16000 "$AUDIO_FILE" >"$FFMPEG_LOG" 2>&1; then
    AUDIO_STATUS="success"
  else
    AUDIO_STATUS="failed"
  fi
fi

cat >"$SOURCE_PACK_MD" <<EOF
# Source Pack

## 1. 基本信息

- 原始链接：${MEDIA_LINK}
- 归一化链接：${WEBPAGE_URL}
- 来源平台：${EXTRACTOR_KEY}
- 标题：${TITLE}
- 作者：${UPLOADER}
- 上传日期：${UPLOAD_DATE}
- 获取时间：$(date '+%Y-%m-%d %H:%M:%S')

## 2. 获取结果

- 是否成功获取媒体文件：$( [[ "$DOWNLOAD_STATUS" == "success" ]] && printf '是' || printf '否' )
- 媒体文件位置：${VIDEO_FILE}
- 获取方式：自动抓取
- 失败说明：
  $( [[ "$DOWNLOAD_STATUS" == "success" ]] && printf -- '- 无\n' || printf -- '- 详见 %s\n' "$DOWNLOAD_LOG" )

## 3. 当前可用输入

- 视频文件：${VIDEO_FILE}
- 音频文件：${AUDIO_FILE}
- transcript：
- 文案：${DESCRIPTION}
- 截图：
- 评论区关键信息：
- 用户补充说明：

## 4. 转写准备情况

- 音频抽取状态：${AUDIO_STATUS}
- 音频抽取日志：${FFMPEG_LOG}

## 5. 下一步判断

- 是否可进入 \`media-transcribe\`：$( [[ "$AUDIO_STATUS" == "success" ]] && printf '是' || printf '否' )
- 是否可直接进入研究：$( [[ "$DOWNLOAD_STATUS" == "success" || -n "$DESCRIPTION" ]] && printf '是' || printf '否' )
- 当前阻塞点：$( [[ "$DOWNLOAD_STATUS" == "success" ]] && printf '无' || printf '媒体下载失败，需转人工 fallback 或专用 downloader' )
EOF

printf 'Source pack created at: %s\n' "$SOURCE_PACK_MD"
if [[ -n "$VIDEO_FILE" ]]; then
  printf 'Media file: %s\n' "$VIDEO_FILE"
fi
if [[ -n "$AUDIO_FILE" && "$AUDIO_STATUS" == "success" ]]; then
  printf 'Audio file: %s\n' "$AUDIO_FILE"
fi
