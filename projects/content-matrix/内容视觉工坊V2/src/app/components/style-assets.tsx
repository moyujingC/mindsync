import { useEffect, useMemo, useState } from "react";
import {
  Star,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  QrCode,
  FileType,
} from "lucide-react";
import { Btn, Tag, COLORS, FoggyArt, Panel } from "./ui-kit";

const WECHAT_THEME_LIBRARY_KEY = "content-visual-studio.wechat-theme-library.v1";

type SavedWechatBaseline = {
  id: string;
  name: string;
  mapping: "h1h2" | "h2h3";
  rawHtml: string;
  plainText: string;
  savedAt: string;
};

type SavedWechatThemeLibrary = {
  activeThemeId: string;
  themes: SavedWechatBaseline[];
};

type LayoutStyleAsset = {
  id: string;
  name: string;
  source: string;
  updated: string;
  body: string;
  title: string;
  isDefault?: boolean;
  placeholder?: boolean;
  previewTitle: string;
  previewBody: string;
  bodyColor: string;
  titleColor: string;
};

const IMAGE_STYLES = [
  {
    name: "企业AI手绘白板",
    desc: "温白纸面、水彩色块、黑色手写标题、虚线框和业务场景插画，适合公众号横版知识卡与氛围图。",
    scope: ["公众号横版图", "横版知识卡", "横版氛围图", "企业AI"],
    palette: ["#2F2A24", "#EAF0EA", "#D8E3EE", "#F3E2B8", "#E7B18E"],
    variant: "grid",
    hue: 3,
    isDefault: true,
  },
  {
    name: "极简纸本信息板",
    desc: "纸张拼贴、便签、胶带、色板与铅笔元素，适合知识卡和金句底图。",
    scope: ["知识卡片", "正文配图", "金句底图"],
    palette: ["#35312B", "#8EA0AA", "#D7CDBA", "#F4F1EA"],
    variant: "grid",
    hue: 1,
  },
  {
    name: "手绘流程讲解板",
    desc: "温白纸面、粗黑手写标题、粉彩色块、涂鸦箭头与小人，适合流程说明和案例拆解。",
    scope: ["知识卡片", "小红书全屏图", "案例拆解", "流程说明"],
    palette: ["#2F2A24", "#F6ECDD", "#AFC5B7", "#9EB8C8", "#E0A36E"],
    variant: "grid",
    hue: 3,
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

const FALLBACK_LAYOUT_STYLES: LayoutStyleAsset[] = [
  {
    id: "fallback-blue-fog",
    name: "蓝雾静读版",
    source: "富文本样本 · 公众号编辑器",
    updated: "2026 / 06 / 02",
    body: "#3F4754 · 15 / 1.85",
    title: "#5B6E84 · 16 / 1.5",
    isDefault: true,
    previewTitle: "一、专注的真正成本",
    previewBody: "真正的专注从来不是用力，而是放弃……",
    bodyColor: "#3F4754",
    titleColor: "#5B6E84",
  },
  {
    id: "fallback-warm-gray",
    name: "暖灰晨间版",
    source: "富文本样本 · 飞书文档",
    updated: "2026 / 05 / 18",
    body: "#3D3328 · 15 / 1.8",
    title: "#7A6F5A · 17 / 1.4",
    previewTitle: "一、专注的真正成本",
    previewBody: "真正的专注从来不是用力，而是放弃……",
    bodyColor: "#3D3328",
    titleColor: "#7A6F5A",
  },
];

const PLACEHOLDER_LAYOUT_STYLE: LayoutStyleAsset = {
  id: "placeholder",
  name: "占位 · 待粘贴",
  source: "未导入",
  updated: "—",
  body: "—",
  title: "—",
  placeholder: true,
  previewTitle: "",
  previewBody: "",
  bodyColor: COLORS.textMid,
  titleColor: COLORS.text,
};

const LAYOUT_STYLES: LayoutStyleAsset[] = [
  ...FALLBACK_LAYOUT_STYLES,
  {
    ...PLACEHOLDER_LAYOUT_STYLE,
    name: "占位 · 待粘贴",
  },
];

const QUOTE_TPLS = [
  {
    name: "纸本文稿",
    use: "预设底图 · 适合长金句。",
    hasQR: true,
    fits: ["公众号", "朋友圈"],
    variant: "mountain",
    hue: 0,
  },
  {
    name: "双栏纸片",
    use: "预设底图 · 适合对照型金句。",
    hasQR: false,
    fits: ["公众号", "小红书", "朋友圈"],
    variant: "circle",
    hue: 3,
  },
  {
    name: "中心留白",
    use: "预设底图 · 适合短句和标题式金句。",
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
  const [themeLibrary, setThemeLibrary] = useState<SavedWechatThemeLibrary | null>(null);

  useEffect(() => {
    function readThemeLibrary() {
      const raw = window.localStorage.getItem(WECHAT_THEME_LIBRARY_KEY);
      if (!raw) {
        setThemeLibrary(null);
        return;
      }

      try {
        setThemeLibrary(JSON.parse(raw) as SavedWechatThemeLibrary);
      } catch {
        setThemeLibrary(null);
      }
    }

    readThemeLibrary();
    window.addEventListener("storage", readThemeLibrary);
    window.addEventListener("focus", readThemeLibrary);
    return () => {
      window.removeEventListener("storage", readThemeLibrary);
      window.removeEventListener("focus", readThemeLibrary);
    };
  }, []);

  const savedLayoutStyles = useMemo(() => {
    const themes = themeLibrary?.themes ?? [];
    if (themes.length === 0) return LAYOUT_STYLES;

    const activeThemeId = themeLibrary?.activeThemeId || themes[0]?.id;
    return [
      ...themes.map((theme) => toLayoutStyleAsset(theme, theme.id === activeThemeId)),
      PLACEHOLDER_LAYOUT_STYLE,
    ];
  }, [themeLibrary]);
  const activeLayoutStyle =
    savedLayoutStyles.find((style) => style.isDefault && !style.placeholder) ??
    savedLayoutStyles.find((style) => !style.placeholder);
  const savedLayoutCount = savedLayoutStyles.filter((style) => !style.placeholder).length;
  const defaultLayoutCount = savedLayoutStyles.filter((style) => style.isDefault).length;

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
                  {activeLayoutStyle?.name || "未保存排版样本"}
                </span>
                {activeLayoutStyle && <Tag tone="blue">默认</Tag>}
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
            count={`${savedLayoutCount} 个样本 · ${defaultLayoutCount} 默认 · 1 占位`}
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
            {savedLayoutStyles.map((s) => (
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
                          color: s.titleColor,
                          fontSize: 12,
                        }}
                      >
                        {s.previewTitle}
                      </div>
                      <div
                        style={{
                          color: s.bodyColor,
                          fontSize: 11.5,
                          lineHeight: 1.85,
                          marginTop: 4,
                        }}
                      >
                        {s.previewBody}
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
            desc="独立于知识卡片。每个风格可预存 2-3 张金句底图，生成时直接绑定，不必频繁文生图。"
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

function toLayoutStyleAsset(
  theme: SavedWechatBaseline,
  isDefault: boolean
): LayoutStyleAsset {
  const doc = theme.rawHtml
    ? new DOMParser().parseFromString(theme.rawHtml, "text/html")
    : null;
  const styledNodes = doc
    ? Array.from(doc.body.querySelectorAll<HTMLElement>("p,section,div,span,h1,h2,h3"))
        .filter((node) => node.textContent?.trim())
    : [];
  const headingNodes = doc
    ? Array.from(doc.body.querySelectorAll<HTMLElement>("h1,h2,h3")).filter((node) =>
        node.textContent?.trim()
      )
    : [];
  const textNodes = styledNodes.filter((node) => {
    const text = node.textContent?.trim() || "";
    return text.length >= 16;
  });
  const bodyNode = textNodes[0] ?? styledNodes[0] ?? null;
  const titleNode = headingNodes[0] ?? styledNodes.find((node) => {
    const text = node.textContent?.trim() || "";
    const fontSize = parseCssNumber(getInlineCssValue(node, "font-size"));
    const fontWeight = getInlineCssValue(node, "font-weight");
    return text.length > 0 && text.length <= 40 && (fontSize >= 16 || /bold|[5-9]00/i.test(fontWeight));
  }) ?? null;
  const previewTitle = titleNode?.textContent?.trim() || firstNonEmptyLine(theme.plainText);
  const previewBody =
    textNodes.find((node) => node !== titleNode)?.textContent?.trim() ||
    firstNonEmptyLine(theme.plainText, previewTitle);
  const bodyColor = pickCssColor(getInlineCssValue(bodyNode, "color")) || "#3F4754";
  const titleColor = pickCssColor(getInlineCssValue(titleNode, "color")) || bodyColor;
  const bodyFontSize = formatCssSummary(getInlineCssValue(bodyNode, "font-size"), "15");
  const bodyLineHeight = formatCssSummary(getInlineCssValue(bodyNode, "line-height"), "1.8");
  const titleFontSize = formatCssSummary(getInlineCssValue(titleNode, "font-size"), "16");
  const titleLineHeight = formatCssSummary(getInlineCssValue(titleNode, "line-height"), "1.5");

  return {
    id: theme.id,
    name: theme.name,
    source: "富文本样本 · 本地保存",
    updated: formatSavedDate(theme.savedAt),
    body: `${bodyColor} · ${bodyFontSize} / ${bodyLineHeight}`,
    title: `${titleColor} · ${titleFontSize} / ${titleLineHeight}`,
    isDefault,
    previewTitle: truncateText(previewTitle || "排版样本", 22),
    previewBody: truncateText(
      previewBody || "在公众号排版页粘贴样本后，这里会显示样本摘要。",
      42
    ),
    bodyColor,
    titleColor,
  };
}

function getInlineCssValue(node: HTMLElement | null, property: string) {
  if (!node) return "";
  const inline = node.style.getPropertyValue(property);
  if (inline) return inline.trim();
  const style = node.getAttribute("style") || "";
  const escaped = property.replace("-", "\\-");
  return new RegExp(`${escaped}\\s*:\\s*([^;]+)`, "i")
    .exec(style)?.[1]
    ?.trim() || "";
}

function parseCssNumber(value: string) {
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function formatCssSummary(value: string, fallback: string) {
  if (!value) return fallback;
  return value.replace(/\s*px\b/i, "").trim() || fallback;
}

function pickCssColor(value: string) {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) || /^rgb/i.test(trimmed)) {
    return trimmed;
  }
  return "";
}

function firstNonEmptyLine(text: string, except?: string) {
  return (
    text
      .split(/\n+/)
      .map((line) => line.trim())
      .find((line) => line && line !== except) || ""
  );
}

function truncateText(text: string, maxLength: number) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength)}...`;
}

function formatSavedDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join(" / ");
}
