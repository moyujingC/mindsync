export type StyleReferenceImage = {
  label: string;
  url: string;
  note?: string;
};

export type QuoteBackgroundAsset = {
  id: string;
  styleName: string;
  label: string;
  url: string;
  width: number;
  height: number;
  note: string;
};

export const PAPER_INFO_BOARD_REFERENCE_IMAGES: StyleReferenceImage[] = [
  {
    label: "极简纸本信息板 01",
    url: "file:///Users/xinran/Downloads/dev/mindsync/projects/content-matrix/内容视觉工坊/风格库/01_极简纸本信息板/IMG_7772.JPG",
    note: "参考大标题、纸张拼贴、便签和低饱和色块",
  },
  {
    label: "极简纸本信息板 02",
    url: "file:///Users/xinran/Downloads/dev/mindsync/projects/content-matrix/内容视觉工坊/风格库/01_极简纸本信息板/IMG_7773.JPG",
    note: "参考对比排版、小图框、胶带和纸本层次",
  },
  {
    label: "极简纸本信息板 03",
    url: "file:///Users/xinran/Downloads/dev/mindsync/projects/content-matrix/内容视觉工坊/风格库/01_极简纸本信息板/IMG_7774.JPG",
    note: "参考留白、中心小图和极简注释线",
  },
  {
    label: "极简纸本信息板 04",
    url: "file:///Users/xinran/Downloads/dev/mindsync/projects/content-matrix/内容视觉工坊/风格库/01_极简纸本信息板/IMG_7775.JPG",
    note: "参考色板、纸条说明和克制强调色",
  },
  {
    label: "极简纸本信息板 05",
    url: "file:///Users/xinran/Downloads/dev/mindsync/projects/content-matrix/内容视觉工坊/风格库/01_极简纸本信息板/IMG_7776.JPG",
    note: "参考字体层级、标题压迫感和纸面材质",
  },
  {
    label: "极简纸本信息板 06",
    url: "file:///Users/xinran/Downloads/dev/mindsync/projects/content-matrix/内容视觉工坊/风格库/01_极简纸本信息板/IMG_7777.JPG",
    note: "参考清单式信息板、勾选框和便签组合",
  },
];

export const PAPER_INFO_BOARD_KNOWLEDGE_STYLE_GUIDE = `视觉风格：极简纸本信息板 · 小红书知识卡

整体风格：
参考“极简纸本信息板”系列，画面像一张被整理好的纸本研究板。核心是大标题、纸张拼贴、便签、小图框、胶带、色板、铅笔和少量手写注释，整体高级、克制、安静。

画面结构：
竖版 3:4。顶部保留明确序号与大标题区，中部用纸片、便签、图框和小标签承载 3-4 个信息点，底部可放少量来源感、页脚感或补充信息。版面要像精心排过的纸本页面，不要像后台面板。

背景：
温白、浅米白或浅灰白纸张底，允许轻微纸纹、扫描感、贴纸边缘阴影和胶带层次。不要纯色渐变背景。

配色：
低饱和纸本色系：米白、纸灰、浅雾蓝、灰蓝、浅卡其、暖灰、深墨黑。可以用一两个低饱和蓝灰/卡其色块做强调。避免高饱和红黄蓝、霓虹色和糖果色。

文字：
中文标题要清楚、有质感，可用粗宋体/现代 serif 感或高质感黑体。信息点文字可像打印体或清晰手写注释。文字必须可读，不能太小、不能糊。所有需要渲染的文字仍必须按提示词规则用反引号包裹。

素材元素：
可以出现纸条、便签、胶带、回形针、铅笔、色卡、拍立得小图、简洁图标、勾选框、注释箭头、细线框。元素数量克制，服务信息层级。

限制：
不要手绘涂鸦儿童感，不要卡通贴纸感，不要科技霓虹，不要厚重营销海报，不要复杂拼贴到失去留白，不要把信息压成普通金句卡。`;

export const PAPER_INFO_BOARD_INLINE_STYLE_GUIDE = `视觉风格：极简纸本信息板 · 公众号正文配图

整体风格：
沿用“极简纸本信息板”的纸张、便签、胶带、色板、铅笔和小图框语言，但密度明显低于小红书知识卡。它是公众号正文里的阅读换气图，不是知识卡，不负责承载完整信息。

画面结构：
横版公众号正文图。主体少、留白多，可以是一张桌面纸片、一个便签组合、一个小图框、一个低饱和纸本隐喻物件。最多表达一个认知锚点。

背景：
温白、浅米白、浅灰白纸面，轻微纸纹和柔和阴影。允许出现胶带、纸张叠层和桌面边角，但不要铺满。

配色：
米白、纸灰、浅雾蓝、灰蓝、浅卡其、暖灰、深墨黑为主。强调色只用少量低饱和蓝灰或卡其。避免鲜艳色、霓虹色和强对比。

文字：
默认无正文文字。若需要，只允许 1-3 个极短中文手写标注词或小标签，必须用反引号包裹。不要大标题，不要段落文字，不要清单。

素材元素：
可以出现一张纸、一截胶带、铅笔、便签、色卡、小照片框、注释线、勾选框、抽象小物件。元素必须少，画面要能插入长文中不打断阅读。

限制：
不要知识卡布局，不要信息图，不要大标题海报，不要多段文字，不要复杂流程图，不要封面感，不要强叙事漫画。`;

export const PAPER_INFO_BOARD_QUOTE_BACKGROUNDS: QuoteBackgroundAsset[] = [
  {
    id: "paper-info-board-quote-01",
    styleName: "极简纸本信息板",
    label: "纸本文稿",
    url: "/assets/quote-backgrounds/paper-info-board/quote-bg-01.svg",
    width: 1080,
    height: 608,
    note: "左侧文稿纸 + 中央留白，适合长金句。",
  },
  {
    id: "paper-info-board-quote-02",
    styleName: "极简纸本信息板",
    label: "双栏纸片",
    url: "/assets/quote-backgrounds/paper-info-board/quote-bg-02.svg",
    width: 1080,
    height: 608,
    note: "双栏纸片 + 小图框，适合对照型金句。",
  },
  {
    id: "paper-info-board-quote-03",
    styleName: "极简纸本信息板",
    label: "中心留白",
    url: "/assets/quote-backgrounds/paper-info-board/quote-bg-03.svg",
    width: 1080,
    height: 608,
    note: "中心大留白 + 右侧纸片，适合短句和标题式金句。",
  },
];
