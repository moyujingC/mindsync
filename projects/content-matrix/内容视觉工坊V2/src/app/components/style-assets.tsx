import {
  Star,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  QrCode,
  FileType,
} from "lucide-react";
import { Btn, Tag, COLORS, FoggyArt, Panel } from "./ui-kit";

const IMAGE_STYLES = [
  {
    name: "蓝雾静读",
    desc: "低饱和雾蓝、灰白与暖灰，强调留白与单点光源。",
    scope: ["公众号封面", "知识卡片"],
    palette: ["#5B6E84", "#94A8BC", "#C8D2DD", "#EEF2F6"],
    variant: "mountain",
    hue: 0,
    isDefault: true,
  },
  {
    name: "留白水墨",
    desc: "近似水墨的笔触和压暗的留白，适合长文配图。",
    scope: ["正文配图"],
    palette: ["#2E3340", "#5C626E", "#A0A4AD", "#ECEAE3"],
    variant: "leaf",
    hue: 5,
  },
  {
    name: "暖灰晨间",
    desc: "极浅暖灰底色，少量米色提亮，安静耐看。",
    scope: ["知识卡片", "金句卡"],
    palette: ["#7A6F5A", "#B5A992", "#DCD4C7", "#F4EFE8"],
    variant: "circle",
    hue: 1,
  },
  {
    name: "薄雾林间",
    desc: "灰绿与雾白，自然类内容的克制版本。",
    scope: ["正文配图", "金句卡"],
    palette: ["#5C7368", "#94AA9C", "#CFD9D2", "#E8EEEA"],
    variant: "wave",
    hue: 2,
  },
];

const LAYOUT_STYLES = [
  {
    name: "蓝雾静读版",
    source: "富文本样本 · 公众号编辑器",
    updated: "2026 / 06 / 02",
    body: "#3F4754 · 15 / 1.85",
    title: "#5B6E84 · 16 / 1.5",
    isDefault: true,
  },
  {
    name: "暖灰晨间版",
    source: "富文本样本 · 飞书文档",
    updated: "2026 / 05 / 18",
    body: "#3D3328 · 15 / 1.8",
    title: "#7A6F5A · 17 / 1.4",
  },
  {
    name: "占位 · 待粘贴",
    source: "未导入",
    updated: "—",
    body: "—",
    title: "—",
    placeholder: true,
  },
];

const QUOTE_TPLS = [
  {
    name: "竖版 · 主图",
    use: "公众号 · 朋友圈分享",
    hasQR: true,
    fits: ["公众号", "朋友圈"],
    variant: "mountain",
    hue: 0,
  },
  {
    name: "方形 · 居中文字",
    use: "通用社交分享，不挑场景。",
    hasQR: false,
    fits: ["公众号", "小红书", "朋友圈"],
    variant: "circle",
    hue: 3,
  },
  {
    name: "横版 · 留白引言",
    use: "适合长金句，二维码靠右下。",
    hasQR: true,
    fits: ["公众号"],
    variant: "wave",
    hue: 2,
  },
  {
    name: "九宫格 · 小红书",
    use: "小红书首图友好，比例 3:4。",
    hasQR: false,
    fits: ["小红书"],
    variant: "leaf",
    hue: 4,
  },
];

export function StyleAssets() {
  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-[1240px] mx-auto px-10 py-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div
              style={{
                color: COLORS.textFaint,
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              STYLE ASSETS
            </div>
            <div
              className="mt-1"
              style={{ color: COLORS.text, fontSize: 22, letterSpacing: "0.02em" }}
            >
              风格资产
            </div>
            <div
              className="mt-1.5"
              style={{ color: COLORS.textFaint, fontSize: 13 }}
            >
              管理图片风格、排版样本与金句卡模板。各资产为团队共享。
            </div>
          </div>

          {/* default baseline card */}
          <div
            className="rounded-md flex items-center gap-3 px-4 py-3"
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              minWidth: 360,
            }}
          >
            <FoggyArt
              hue={0}
              variant="grid"
              style={{ width: 40, height: 40, borderRadius: 6 }}
            />
            <div className="flex-1">
              <div
                style={{
                  color: COLORS.textFaint,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                }}
              >
                当前默认公众号排版基准
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span style={{ color: COLORS.text, fontSize: 14 }}>
                  蓝雾静读版
                </span>
                <Tag tone="blue">默认</Tag>
              </div>
            </div>
            <Btn variant="ghost" size="sm">
              <ArrowUpRight size={13} strokeWidth={1.6} />
              打开
            </Btn>
          </div>
        </div>

        {/* Section 1: 图片风格 */}
        <div className="mt-10">
          <SectionHead
            kicker="01 / IMAGE"
            title="图片风格资产"
            count={`${IMAGE_STYLES.length} 个风格 · 1 默认`}
            desc="用于知识卡片、金句卡、公众号封面与正文配图。每个风格包含色板、参考图与适用范围。"
            tools={[{ label: "排序" }, { label: "筛选" }]}
            action={
              <Btn variant="secondary" size="sm">
                <Plus size={13} strokeWidth={1.6} />
                新增风格
              </Btn>
            }
          />

          <div className="grid grid-cols-4 gap-4 mt-5">
            {IMAGE_STYLES.map((s) => (
              <div
                key={s.name}
                className="rounded-lg overflow-hidden flex flex-col"
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <FoggyArt
                  hue={s.hue}
                  variant={s.variant as any}
                  style={{ aspectRatio: "4/3" }}
                />
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: COLORS.text, fontSize: 14 }}>
                      {s.name}
                    </span>
                    {s.isDefault && <Tag tone="blue">默认</Tag>}
                  </div>
                  <div
                    style={{
                      color: COLORS.textMuted,
                      fontSize: 12,
                      lineHeight: 1.6,
                      marginTop: 6,
                      minHeight: 38,
                    }}
                  >
                    {s.desc}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.scope.map((sc) => (
                      <Tag key={sc} tone="neutral">
                        {sc}
                      </Tag>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-1.5">
                    {s.palette.map((c) => (
                      <span
                        key={c}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: c,
                          border: `1px solid ${COLORS.borderSoft}`,
                        }}
                      />
                    ))}
                    <span
                      className="ml-1"
                      style={{ color: COLORS.textFaint, fontSize: 10.5 }}
                    >
                      {s.palette.length} 色
                    </span>
                  </div>

                  <div
                    className="mt-4 pt-3 flex items-center gap-2"
                    style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}
                  >
                    {s.isDefault ? (
                      <Btn variant="subtle" size="sm" className="flex-1">
                        <CheckCircle2 size={12} strokeWidth={1.6} />
                        当前默认
                      </Btn>
                    ) : (
                      <Btn variant="secondary" size="sm" className="flex-1">
                        <Star size={12} strokeWidth={1.6} />
                        设为默认
                      </Btn>
                    )}
                    <Btn variant="ghost" size="sm">
                      查看详情
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: 排版样式 */}
        <div className="mt-16">
          <SectionHead
            kicker="02 / TYPOGRAPHY"
            title="排版样式样本"
            count="2 个样本 · 1 默认 · 1 占位"
            desc="抓取自公众号编辑器富文本样本，作为排版基准。在「公众号排版」页粘贴富文本即可保存到此处。"
            tools={[{ label: "对比" }]}
            action={
              <Btn variant="secondary" size="sm">
                <Plus size={13} strokeWidth={1.6} />
                导入新样本
              </Btn>
            }
          />

          <div className="grid grid-cols-3 gap-4 mt-5">
            {LAYOUT_STYLES.map((s) => (
              <div
                key={s.name}
                className="rounded-lg p-5"
                style={{
                  background: s.placeholder ? "transparent" : COLORS.surface,
                  border: `1px ${s.placeholder ? "dashed" : "solid"} ${
                    s.placeholder ? COLORS.blueSoft : COLORS.border
                  }`,
                  minHeight: 220,
                }}
              >
                {s.placeholder ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center"
                      style={{ background: COLORS.blueTint, color: COLORS.blueDeep }}
                    >
                      <Plus size={16} strokeWidth={1.6} />
                    </div>
                    <div
                      className="mt-3"
                      style={{ color: COLORS.text, fontSize: 13 }}
                    >
                      新增排版样本
                    </div>
                    <div
                      className="mt-1 max-w-[200px]"
                      style={{ color: COLORS.textFaint, fontSize: 11.5, lineHeight: 1.6 }}
                    >
                      在「公众号排版」页粘贴样本即可保存到此处。
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center"
                        style={{
                          background: COLORS.blueTint,
                          color: COLORS.blueDeep,
                        }}
                      >
                        <FileType size={18} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span style={{ color: COLORS.text, fontSize: 14 }}>
                            {s.name}
                          </span>
                          {s.isDefault && <Tag tone="blue">默认</Tag>}
                        </div>
                        <div
                          style={{
                            color: COLORS.textFaint,
                            fontSize: 11.5,
                            marginTop: 2,
                          }}
                        >
                          来源：{s.source}
                        </div>
                      </div>
                    </div>

                    <div
                      className="mt-4 grid grid-cols-2 gap-y-1.5"
                      style={{ fontSize: 11.5 }}
                    >
                      <span style={{ color: COLORS.textFaint }}>更新</span>
                      <span style={{ color: COLORS.textMid }}>{s.updated}</span>
                      <span style={{ color: COLORS.textFaint }}>正文</span>
                      <span style={{ color: COLORS.textMid }}>{s.body}</span>
                      <span style={{ color: COLORS.textFaint }}>标题</span>
                      <span style={{ color: COLORS.textMid }}>{s.title}</span>
                    </div>

                    {/* mini preview */}
                    <div
                      className="mt-4 rounded p-3"
                      style={{
                        background: COLORS.surfaceAlt,
                        border: `1px solid ${COLORS.borderSoft}`,
                      }}
                    >
                      <div
                        style={{
                          color: s.name === "蓝雾静读版" ? "#5B6E84" : "#7A6F5A",
                          fontSize: 12,
                        }}
                      >
                        一、专注的真正成本
                      </div>
                      <div
                        style={{
                          color: s.name === "蓝雾静读版" ? "#3F4754" : "#3D3328",
                          fontSize: 11.5,
                          lineHeight: 1.85,
                          marginTop: 4,
                        }}
                      >
                        真正的专注从来不是用力，而是放弃……
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {s.isDefault ? (
                        <Btn variant="subtle" size="sm" className="flex-1">
                          当前默认
                        </Btn>
                      ) : (
                        <Btn variant="secondary" size="sm" className="flex-1">
                          设为默认
                        </Btn>
                      )}
                      <Btn variant="ghost" size="sm">
                        查看样本
                      </Btn>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: 金句卡模板 */}
        <div className="mt-16 mb-12">
          <SectionHead
            kicker="03 / QUOTE"
            title="金句卡模板"
            count={`${QUOTE_TPLS.length} 个模板 · 含二维码 / 不含`}
            desc="独立于知识卡片。用于金句卡片的版式选择，按比例与是否含二维码区分。"
            tools={[{ label: "按平台筛选" }]}
            action={
              <Btn variant="secondary" size="sm">
                <Plus size={13} strokeWidth={1.6} />
                新增模板
              </Btn>
            }
          />

          <div className="grid grid-cols-4 gap-4 mt-5">
            {QUOTE_TPLS.map((t) => (
              <div
                key={t.name}
                className="rounded-lg overflow-hidden flex flex-col"
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  className="p-4 flex items-center justify-center"
                  style={{ background: COLORS.borderSoft, height: 150 }}
                >
                  <div
                    className="rounded shadow-sm flex flex-col justify-between p-3"
                    style={{
                      background: "#FBFAF7",
                      width: 100,
                      height: 124,
                    }}
                  >
                    <div
                      style={{ color: COLORS.blueDeep, fontSize: 9 }}
                    >
                      “
                    </div>
                    <div
                      style={{
                        color: COLORS.text,
                        fontSize: 9,
                        lineHeight: 1.5,
                        letterSpacing: "0.04em",
                      }}
                    >
                      真正的专注，<br />不是用力，<br />而是放弃。
                    </div>
                    {t.hasQR ? (
                      <div className="flex items-center justify-end">
                        <span
                          className="rounded-sm flex items-center justify-center"
                          style={{
                            background: COLORS.blueTint,
                            width: 18,
                            height: 18,
                            color: COLORS.blueDeep,
                          }}
                        >
                          <QrCode size={11} strokeWidth={1.6} />
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{ color: COLORS.textFaint, fontSize: 7 }}
                        className="text-right"
                      >
                        — 静读
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div style={{ color: COLORS.text, fontSize: 13.5 }}>
                    {t.name}
                  </div>
                  <div
                    style={{
                      color: COLORS.textMuted,
                      fontSize: 11.5,
                      lineHeight: 1.6,
                      marginTop: 4,
                      minHeight: 32,
                    }}
                  >
                    {t.use}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    {t.hasQR ? (
                      <Tag tone="blue">含二维码区</Tag>
                    ) : (
                      <Tag tone="muted">无二维码</Tag>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.fits.map((f) => (
                      <Tag key={f} tone="neutral">
                        {f}
                      </Tag>
                    ))}
                  </div>

                  <div
                    className="mt-4 pt-3 flex items-center gap-2"
                    style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}
                  >
                    <Btn variant="ghost" size="sm" className="flex-1">
                      预览
                    </Btn>
                    <Btn variant="secondary" size="sm">
                      使用
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  desc,
  action,
  count,
  tools,
}: {
  kicker: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
  count?: string;
  tools?: { label: string }[];
}) {
  return (
    <div>
      <div
        className="flex items-end justify-between pb-3"
        style={{ borderBottom: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-end gap-4">
          <div
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: COLORS.blueTint,
              color: COLORS.blueDeep,
              fontSize: 11,
              letterSpacing: "0.06em",
            }}
          >
            {kicker.split(" / ")[0]}
          </div>
          <div>
            <div
              style={{
                color: COLORS.textFaint,
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              {kicker.split(" / ")[1]}
            </div>
            <div
              className="mt-0.5 flex items-baseline gap-2.5"
            >
              <span
                style={{ color: COLORS.text, fontSize: 17, letterSpacing: "0.02em" }}
              >
                {title}
              </span>
              {count && (
                <span style={{ color: COLORS.textFaint, fontSize: 12 }}>
                  · {count}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tools?.map((t) => (
            <button
              key={t.label}
              style={{
                color: COLORS.textMid,
                fontSize: 12.5,
                height: 28,
                paddingLeft: 10,
                paddingRight: 10,
                borderRadius: 5,
              }}
              className="hover:bg-black/5"
            >
              {t.label}
            </button>
          ))}
          {action}
        </div>
      </div>
      <div
        className="mt-2.5"
        style={{ color: COLORS.textFaint, fontSize: 12.5, lineHeight: 1.7 }}
      >
        {desc}
      </div>
    </div>
  );
}
