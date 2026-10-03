# 参考图系统分析（v4 方向依据，2026-10-03）

由 claude-opus-5-5 逐张观察 6 张参考图 + 我方 v3 问题版后输出。核心结论：

## 光影机制（"金钱能量/金灿灿"的第一因）
- 高光三层结构：①发光核心（emissive core：月亮/法器/金沙，近纯白 #FFFDF2，带 bloom 外溢）→ ②金属高光（镂空边缘细线状白金点 #FFE9A8，面积极小亮度极高，珠宝感）→ ③反射环境光（沙面奶油金 #F0D9A8 衰减、轮廓 rim light、飘带逆光半透明）。
- 金 = 白金高光点 + 饱和香槟金中间调 + 深棕金暗部，三位一体；只有中间调 = 土黄（v3 的问题）。
- 暗部 = 深群青/靛紫（#0E1230~#141A3D），混孔雀蓝青与紫，无 L*<10 死黑，全冷色。
- 可进 prompt 的词：glowing emissive core, radiant bloom halo, 4-point star sparkle flares, floating golden dust motes, bokeh particles, metallic specular highlights on filigree edges, warm rim light, warm bounce light pooling on dunes, volumetric haze, single heroic light source, high dynamic range, cool shadows + warm highlights。

## 色彩系统
- 分层：暗部全冷（群青/藏青/靛紫/孔雀蓝绿）→ 中间调低饱和暖中性（香槟/玫瑰金/暖雾灰）→ 亮部白金/蜜金/米白极小面积极高亮度。
- 冷暖沿对角线或地平线切开（上蓝下暖，约 4:6），不混合。
- 飘带"五光十色"和谐三机制：①全部压同一高明度带（L70-92）、低中饱和；②统一暖环境光罩一层；③彩色只出现在受光侧、相邻色用白/金隔开。彩色=灵气，金色=光，分工不重叠。
- 整体 S 25-45% 低中饱和 + 极大明度跨度（L15→L98）+ 局部高饱和高亮。

## 现代感/灵性来源
- 现代 = 电影摄影语言（单主光源、bloom、景深、体积雾、四点星芒）+ CG 干净渲染（非水彩/壁画平涂）+ 珠光/泡泡/全息材质 + 数字级规整几何纹样 + 超现实尺度（巨物悬空）。
- 灵性 = 大留白（~40% 纯净区）+ 中轴/对角对称 + 单一巨物精神焦点 + 发光粒子。

## v3 问题根源（逐点）
1. 没有任何物体在发光（均匀环境照明→平）；
2. 金色只有中间调（无白金高光点、无冷色相邻衬托→壁画黄）；
3. 整图被单层暖黄褐覆盖（无上蓝下金分区→灰闷旧）。

## 构图
- 竖构图 3:4 左右；金色法器 30-45%、月亮 30-40%、人物 15-25%、驼队 5-10% 但被光带连成引导线。
- 飞天视线 + 飘带流线 + 地面光轨三线闭环指向法器。
- 文字区绝对干净（纯天空/纯云零细节）。
- 能当独立配图的原因：竖构图、单一主体缩略可辨、留白干净、明度对比高、叙事完整。

## 试验产物
- generated/test-recreate.png（深色复刻方向，portrait）
- generated/test-light.png（浅色高 key 版，portrait）
- STYLE 常量 v4 已按本分析重写（generate.mjs 内注记）。
