export type ImagePreset = {
  k: string;
  label: string;
  w: number;
  h: number;
  aspect: string;
};

export type ImagePurpose = {
  k: string;
  label: string;
  hint?: string;
  presets: ImagePreset[];
};

// 用途 -> 预设。公众号主链路使用 1080 宽横版图；小红书预设保留给通用生图入口。
export const IMAGE_PURPOSES: ImagePurpose[] = [
  {
    k: "xhs_card",
    label: "公众号横版图 / 知识卡或氛围图",
    hint: "用于公众号正文插图，系统会按文章内容判断生成横版知识卡或横版氛围图。",
    presets: [
      {
        k: "wx-visual-1080-608",
        label: "公众号横版图 · 1080×608",
        w: 1080,
        h: 608,
        aspect: "16:9",
      },
      {
        k: "wx-visual-1080-720",
        label: "公众号横版图宽松 · 1080×720",
        w: 1080,
        h: 720,
        aspect: "3:2",
      },
      {
        k: "xhs-1280",
        label: "小红书图文 3:4 高清 · 1280×1706",
        w: 1280,
        h: 1706,
        aspect: "3:4",
      },
    ],
  },
  {
    k: "xhs_full",
    label: "小红书全屏图",
    presets: [
      {
        k: "xhs-9-16",
        label: "小红书全屏 9:16 · 1440×2560",
        w: 1440,
        h: 2560,
        aspect: "9:16",
      },
      {
        k: "xhs-9-15",
        label: "小红书全屏 9:15 · 1350×2250",
        w: 1350,
        h: 2250,
        aspect: "9:15",
      },
    ],
  },
  {
    k: "quote",
    label: "金句卡",
    hint: "横版来源以公众号正文为准，宽度 1080。",
    presets: [
      {
        k: "q-3-4",
        label: "金句卡 3:4 · 1280×1706",
        w: 1280,
        h: 1706,
        aspect: "3:4",
      },
      {
        k: "q-1-1",
        label: "金句卡 1:1 · 1080×1080",
        w: 1080,
        h: 1080,
        aspect: "1:1",
      },
      {
        k: "q-h-608",
        label: "金句卡横版（公众号） · 1080×608",
        w: 1080,
        h: 608,
        aspect: "16:9",
      },
      {
        k: "q-h-720",
        label: "金句卡横版（公众号宽松） · 1080×720",
        w: 1080,
        h: 720,
        aspect: "3:2",
      },
    ],
  },
  {
    k: "wx_cover",
    label: "公众号封面",
    presets: [
      {
        k: "wx-cover",
        label: "公众号封面大图 · 900×383",
        w: 900,
        h: 383,
        aspect: "2.35:1",
      },
      {
        k: "wx-thumb",
        label: "公众号转发小图 · 383×383",
        w: 383,
        h: 383,
        aspect: "1:1",
      },
    ],
  },
  {
    k: "wx_inline",
    label: "公众号正文配图",
    hint: "公众号正文图片宽度统一以 1080 为基准。",
    presets: [
      {
        k: "wx-inline-608",
        label: "公众号正文配图 · 1080×608",
        w: 1080,
        h: 608,
        aspect: "16:9",
      },
      {
        k: "wx-inline-720",
        label: "公众号正文配图 · 1080×720",
        w: 1080,
        h: 720,
        aspect: "3:2",
      },
    ],
  },
];

export const DEFAULT_PRESET_KEYS = {
  knowledgeCard: "wx-visual-1080-608",
  quoteCard: "q-h-608",
  wechatCover: "wx-cover",
  wechatInline: "wx-inline-608",
} as const;

export function findPurpose(purposeKey: string) {
  return IMAGE_PURPOSES.find((p) => p.k === purposeKey);
}

export function findPreset(presetKey: string) {
  for (const purpose of IMAGE_PURPOSES) {
    const preset = purpose.presets.find((item) => item.k === presetKey);
    if (preset) return { purpose, preset };
  }
  return null;
}
