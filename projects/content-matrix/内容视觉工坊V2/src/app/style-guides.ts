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

export const HANDDRAWN_FLOW_EXPLAINER_REFERENCE_IMAGES: StyleReferenceImage[] = [
  {
    label: "手绘流程讲解板 01",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/E/EF88AEBF-2339-4539-9954-1F161E2AB7C1_1_105_c.jpeg",
    note: "参考粗黑手写标题、分区讲解和温白纸面",
  },
  {
    label: "手绘流程讲解板 02",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/8/8D74C2FB-1936-48D7-8EF8-ADB5C2089F61_1_105_c.jpeg",
    note: "参考流程箭头、编号步骤和粉彩信息块",
  },
  {
    label: "手绘流程讲解板 03",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/8/8F5B0473-B64F-4AD1-93B6-80025CCEEA77_1_105_c.jpeg",
    note: "参考手绘案例拆解、气泡标签和小图标",
  },
  {
    label: "手绘流程讲解板 04",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/A/ADA47AB7-B96C-4B9B-99E7-5A2C9578BBBC_1_105_c.jpeg",
    note: "参考对比面板、路线图和说明性插画",
  },
  {
    label: "手绘流程讲解板 05",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/4/4D202433-CC36-4706-B7AA-88C43F588BE5_1_105_c.jpeg",
    note: "参考卡片分栏、强调下划线和手账式层次",
  },
  {
    label: "手绘流程讲解板 06",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/8/86CCE264-3BCE-4A1F-8F9B-6EE32D976FBA_1_105_c.jpeg",
    note: "参考可爱黑色小人、标注箭头和轻松讲解感",
  },
  {
    label: "手绘流程讲解板 07",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/1/115DEBA2-003F-47D7-91D8-BD9D2CA00F7A_1_105_c.jpeg",
    note: "参考漏斗、天平、路线等结构化视觉隐喻",
  },
  {
    label: "手绘流程讲解板 08",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/2/253EF7D9-0FF0-4AE2-B248-13FA4A6A353C_1_105_c.jpeg",
    note: "参考教程手册式布局和多模块信息承载",
  },
  {
    label: "手绘流程讲解板 09",
    url: "file:///Users/xinran/Pictures/Photos%20Library.photoslibrary/resources/derivatives/F/F38310CE-5F5C-4278-BD18-ED1CC71387D0_1_105_c.jpeg",
    note: "参考粉彩蓝绿橙色块和黑色线稿装饰",
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

export const HANDDRAWN_FLOW_EXPLAINER_STYLE_GUIDE = `视觉风格：手绘流程讲解板

整体风格：
参考一组手绘中文知识讲解图。画面像老师在纸上整理出来的流程板、案例手册或提示词说明页：温白纸面、粗黑手写标题、低饱和粉彩色块、涂鸦箭头、气泡标签、简笔图标和少量可爱黑色小人。整体要清楚、有亲手画出来的温度，但仍然是成熟的信息图，不要变成儿童漫画。

画面结构：
适合竖版 3:4、小红书全屏图或单页知识卡。优先使用流程图、编号步骤、对比面板、漏斗、路线图、天平、左右分栏、上下分段等结构，把信息拆成 3-6 个清晰模块。每个模块之间要有箭头、连线或空间关系，读者一眼能看出阅读顺序。

背景：
温白、浅米白或带轻微纸纹的手账纸面。允许有铅笔阴影、水彩笔涂抹、轻微扫描感和手绘边框。不要纯数字界面背景，不要玻璃拟态，不要深色科技背景。

配色：
主色是黑色线稿和温白纸面，辅助色使用低饱和蓝、灰绿、浅黄、奶油橙、淡粉或浅棕。色块像马克笔、水彩笔或蜡笔轻涂，边缘可以略不规则。避免高饱和霓虹、强商业海报色和单一紫蓝渐变。

文字：
中文标题要大、黑、手写感强，类似粗马克笔标题。模块标题和标签可以用清晰手写体或打印体，但必须可读。可以用下划线、圈画、荧光笔和箭头强调。所有需要渲染的文字仍必须按提示词规则用反引号包裹，不要自造无关文字。

素材元素：
可以出现手绘箭头、对话气泡、便签框、编号圆点、勾选框、小旗子、放大镜、灯泡、天平、漏斗、道路、文档、小人、表情符号式简笔头像。元素必须服务信息解释，不要堆满装饰。

限制：
不要把正文改写成无关内容，不要塞满小字，不要生成真实照片感，不要 3D 渲染，不要厚重商业海报，不要二次元角色，不要过度可爱，不要把黑色小人画成主要人物肖像。`;

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

export const PAPER_INFO_BOARD_COVER_STYLE_GUIDE = `视觉风格：极简纸本信息板 · 公众号封面

整体风格：
沿用“极简纸本信息板”的温白纸面、纸张拼贴、便签、胶带、色板、铅笔和轻扫描感，但画面必须更像公众号头条封面。封面只负责标题入口和主题气质，不承载正文信息。

画面结构：
横版 900×383，按 2.35:1 公众号头条封面设计。标题必须放在画面中心安全区，中心 383×383 裁切后仍能看到完整标题和主要视觉。构图以中心聚焦、对称或轻微错位为主，不使用左侧大留白标题方案。

背景：
温白、浅米白、浅灰白纸面，轻微纸纹和柔和阴影。可以有一层中心纸片、少量胶带、便签或桌面小物件，但不能做成复杂拼贴。

配色：
米白、纸灰、浅雾蓝、灰蓝、浅卡其、暖灰、深墨黑为主。强调色只用少量低饱和蓝灰或卡其。避免高饱和、霓虹、强商业营销感。

文字：
只允许渲染文章原标题，必须用反引号包裹并原样呈现。标题居中或接近居中，字号足够大，中心裁切后仍清楚可读。不要额外添加副标题、作者名、栏目名、日期、水印或英文装饰字。

素材元素：
可以出现纸条、便签、胶带、回形针、铅笔、色卡、简洁图标、注释线、桌面物件。元素要少，围绕中心标题布置，不要抢标题。

限制：
不要知识卡片布局，不要信息图，不要段落文字，不要清单，不要人物大头，不要复杂商业海报，不要小红书竖版卡片感，不要把整篇文章内容都讲完，不要把标题放在左侧或右侧边缘。`;

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
