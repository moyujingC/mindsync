# 敦煌柔光风 · Prompt 手册

## 场景写法模板

```
<单一主体：玉梳/金莲/藻井圆盘…> + <位置：upper center / lower third…>
+ <它的状态：floating gently / glowing softly…>
+ <辅助元素1> + <辅助元素2（可选）>
+ <环境：smooth empty night sky / quiet desert dunes below>
+ <光线：one large soft crescent moon / mirror reflecting soft moonlight>
+ <氛围：enormous calm negative space, the scene feels like a gentle quiet breath>
```

要点：先写主体和它的"安静动作"，再写环境；氛围收尾句能有效压住喧闹感。

## 翻车模式 → 修法

| 翻车 | 症状 | 修法 |
|---|---|---|
| 脏 | 元素堆叠、满屏纹样 | 场景里砍到 1 主体 + ≤2 辅助；STYLE 已禁 dense filigree，仍翻车则在场景句加 "only" "nothing else" |
| 乱 | 主体多个互相重叠 | 场景句明确 "a single …" + "enormous calm negative space" |
| 硬 | 对比强、光锐利 | 已在 STYLE 锁 diffused/low contrast；再翻车加 "hazy soft-focus, no harsh light" |
| 俗 | 金色橙爆 | STYLE 已锁 muted；再翻车把主体改成玉绿/月光白，金色只留轮廓 |
| 青黑 | 暗部发青 | STYLE 已写 never cyan-black；验收时取样暗部确认偏蓝 `#1E2D4D` 族 |
| 死白 | 浅色卡过曝 | "warm beige cream #F5EFE2, absolutely NOT white, subtle paper grain, no blowout, no gradient blowout" 四件套 |

## 密排文字卡变体（图案占比 ≤40%，留白区纯色无细节）

深色卡：留白区 "solid flat deep indigo #141E38, no stars no clouds no glow"；
浅色卡：留白区 "solid flat warm beige #F5EFE2 aged rice paper, NOT white, paper grain"。
分割方式：顶部留白 / 左侧留白 / 四角纹样框（边框 ≤20%）。
文案一律后期排版层加，prompt 里禁字。

## 已知好图锚点

- `examples/hero-02.png`：v2 基准图（1 梳 + 2 蝶 + 月牙 + 远景驼队，留白 60%）。
- `references/card-light-frame` 系（见 ai-shifu docs/brand/illustrations/generated/）：浅色密排卡过曝修正后的合格版。


## 梳子锁定模式（--comb）

- 场景句只写梳子**周围**的环境与氛围，不要描述梳子本身（造型由锚图决定，prompt 里描述梳子反而诱导模型改它）。
- 例：`--comb` + "the comb floats gently in the upper center of a vast smooth indigo night sky, two small luminous butterflies nearby, a tiny camel caravan on quiet dunes far below, enormous calm negative space, gentle diffused moonlight, the scene feels like a gentle quiet breath"。
- 多把梳子（如"两把梳子交错"）：仍传一张锚图，场景句写 "a second identical comb gently leaning against the first one, mirror-like symmetry"，并验收第二把不走样。
- 验收对照 `references/comb-logo.png`：葫芦玉身形、顶部圆镜+鎏金卷草框、腹部朱红花+绿心、两侧蓝珐琅祥云、金色卷线、玉梳齿。任一走样即重出。
