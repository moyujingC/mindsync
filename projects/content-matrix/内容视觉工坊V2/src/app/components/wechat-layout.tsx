import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  RefreshCw,
  ClipboardPaste,
  Bookmark,
  Info,
  CheckCircle2,
  ChevronRight,
  CopyPlus,
  Trash2,
} from "lucide-react";
import { SectionTitle, Btn, Tag, COLORS, Divider, FoggyArt } from "./ui-kit";
import { useWorkspace, type ArticleBlock } from "../workspace";

const STORAGE_KEY = "content-visual-studio.wechat-theme-library.v1";
const ARTICLE_FOOTER = "—— 内容视觉工坊";

type MappingMode = "h1h2" | "h2h3";

type SavedWechatBaseline = {
  id: string;
  name: string;
  mapping: MappingMode;
  rawHtml: string;
  plainText: string;
  savedAt: string;
};

type SavedWechatThemeLibrary = {
  activeThemeId: string;
  themes: SavedWechatBaseline[];
};

type WechatTheme = {
  titleColor: string;
  bodyColor: string;
  metaColor: string;
  accentColor: string;
  blockBg: string;
  bodyFontSize: number;
  titleFontSize: number;
  headingFontSize: number;
  bodyLineHeight: number;
  quoteFontSize: number;
};

const DEFAULT_THEME: WechatTheme = {
  titleColor: "#303543",
  bodyColor: "#393D49",
  metaColor: "#A8B1C4",
  accentColor: "#6E7FA8",
  blockBg: "#F0F3FA",
  bodyFontSize: 16,
  titleFontSize: 23,
  headingFontSize: 24,
  bodyLineHeight: 1.8,
  quoteFontSize: 16,
};

export function WechatLayout() {
  const {
    currentArticle,
    currentArticleBlocks,
    currentArticleMeta,
    generationRecords,
    workbenchState,
  } =
    useWorkspace();
  const [mapping, setMapping] = useState<MappingMode>("h2h3");
  const [importedHtml, setImportedHtml] = useState("");
  const [importedText, setImportedText] = useState("");
  const [themeName, setThemeName] = useState("蓝雾静读版");
  const [themeLibrary, setThemeLibrary] = useState<SavedWechatBaseline[]>([]);
  const [activeThemeId, setActiveThemeId] = useState("");
  const [statusMessage, setStatusMessage] = useState("尚未保存新的样式基准");
  const [isPasting, setIsPasting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SavedWechatThemeLibrary;
      const themes = saved.themes ?? [];
      const active = themes.find((item) => item.id === saved.activeThemeId) ?? themes[0];
      setThemeLibrary(themes);
      if (active) {
        setActiveThemeId(active.id);
        setThemeName(active.name);
        setMapping(active.mapping);
        setImportedHtml(active.rawHtml);
        setImportedText(active.plainText);
      }
      setStatusMessage(
        active
          ? `最近一次保存于 ${formatSavedAt(active.savedAt)} · 已应用为默认基准`
          : "已读取本地主题库"
      );
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const sampleSummary = useMemo(() => {
    if (!importedHtml && !importedText.trim()) {
      return {
        paragraphCount: 12,
        headingCount: 3,
        bodyFontSize: "15 px",
        headingFontSize: mapping === "h1h2" ? "17 / 16 px" : "16 / 15 px",
        lineHeight: "1.85",
        letterSpacing: "0.01em",
      };
    }

    const textSource = importedText.trim() || stripHtml(importedHtml);
    const htmlSource = importedHtml
      ? importedHtml
      : `<div>${escapeHtml(textSource).replace(/\n/g, "<br/>")}</div>`;
    const doc = new DOMParser().parseFromString(htmlSource, "text/html");

    const paragraphCount = Math.max(
      doc.querySelectorAll("p").length,
      textSource
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean).length || 1
    );
    const headingCount = Math.max(
      doc.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
      textSource
        .split("\n")
        .map((item) => item.trim())
        .filter((line) => /^#{1,3}\s/.test(line)).length
    );

    return {
      paragraphCount,
      headingCount,
      bodyFontSize: "15 px",
      headingFontSize: mapping === "h1h2" ? "17 / 16 px" : "16 / 15 px",
      lineHeight: "1.85",
      letterSpacing: "0.01em",
    };
  }, [importedHtml, importedText, mapping]);

  const activeTheme = useMemo(
    () => deriveWechatTheme(importedHtml, sampleSummary),
    [importedHtml, sampleSummary]
  );

  const samplePreview = useMemo(() => {
    if (importedHtml) return { mode: "html" as const, value: importedHtml };
    if (importedText.trim()) return { mode: "text" as const, value: importedText };
    return null;
  }, [importedHtml, importedText]);
  const articleMetaLine = useMemo(
    () => buildArticleMetaLine(currentArticleMeta),
    [currentArticleMeta]
  );
  const coverGeneration = generationRecords.find((item) => item.purposeKey === "wx_cover");
  const inlineGeneration = generationRecords.find((item) => item.purposeKey === "wx_inline");
  const selectedCoverIndex = workbenchState.coverSelection?.selectedCoverIndex ?? 0;
  const previewCover = coverGeneration?.images[selectedCoverIndex]?.imageUrl ?? null;
  const inlineImageMap = useMemo(
    () =>
      new Map(
        (inlineGeneration?.images ?? [])
          .filter((item) => item.inlineLink?.sectionKey)
          .map((item) => [item.inlineLink!.sectionKey, item.imageUrl])
      ),
    [inlineGeneration]
  );

  async function handlePasteFromClipboard() {
    setIsPasting(true);
    try {
      let html = "";
      let text = "";

      if (navigator.clipboard && "read" in navigator.clipboard) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (!html && item.types.includes("text/html")) {
            const blob = await item.getType("text/html");
            html = await blob.text();
          }
          if (!text && item.types.includes("text/plain")) {
            const blob = await item.getType("text/plain");
            text = await blob.text();
          }
        }
      }

      if (!html && navigator.clipboard?.readText) {
        text = await navigator.clipboard.readText();
      }

      const nextText = (text || stripHtml(html)).trim();
      if (!html && !nextText) {
        setStatusMessage("剪贴板里没有可用内容，请先从公众号编辑器复制");
        return;
      }

      setImportedHtml(html);
      setImportedText(nextText);
      setStatusMessage("已接收新样本 · 待保存");
    } catch {
      setStatusMessage("读取剪贴板失败，请先允许浏览器访问剪贴板");
    } finally {
      setIsPasting(false);
    }
  }

  function handleSaveBaseline() {
    const payload: SavedWechatBaseline = {
      id: activeThemeId || createThemeId(),
      name: themeName.trim() || "未命名排版",
      mapping,
      rawHtml: importedHtml,
      plainText: importedText,
      savedAt: new Date().toISOString(),
    };
    const nextThemes = upsertTheme(themeLibrary, payload);
    const library: SavedWechatThemeLibrary = {
      activeThemeId: payload.id,
      themes: nextThemes,
    };
    setThemeLibrary(nextThemes);
    setActiveThemeId(payload.id);
    setThemeName(payload.name);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    setStatusMessage(
      `最近一次保存于 ${formatSavedAt(payload.savedAt)} · 已应用为默认基准`
    );
  }

  function handleSwitchTheme(themeId: string) {
    const theme = themeLibrary.find((item) => item.id === themeId);
    if (!theme) return;
    setActiveThemeId(theme.id);
    setThemeName(theme.name);
    setMapping(theme.mapping);
    setImportedHtml(theme.rawHtml);
    setImportedText(theme.plainText);
    const library: SavedWechatThemeLibrary = {
      activeThemeId: theme.id,
      themes: themeLibrary,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    setStatusMessage(
      `已切换到 ${theme.name} · 最近保存于 ${formatSavedAt(theme.savedAt)}`
    );
  }

  function handleDuplicateTheme() {
    const source = themeLibrary.find((item) => item.id === activeThemeId);
    const payload: SavedWechatBaseline = {
      id: createThemeId(),
      name: `${(source?.name || themeName || "未命名排版").trim()} 副本`,
      mapping,
      rawHtml: importedHtml,
      plainText: importedText,
      savedAt: new Date().toISOString(),
    };
    const nextThemes = [payload, ...themeLibrary];
    const library: SavedWechatThemeLibrary = {
      activeThemeId: payload.id,
      themes: nextThemes,
    };
    setThemeLibrary(nextThemes);
    setActiveThemeId(payload.id);
    setThemeName(payload.name);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    setStatusMessage(`已新建副本：${payload.name}`);
  }

  function handleDeleteTheme(themeId: string) {
    const nextThemes = themeLibrary.filter((item) => item.id !== themeId);
    if (nextThemes.length === themeLibrary.length) return;

    const nextActive = nextThemes[0];
    const library: SavedWechatThemeLibrary = {
      activeThemeId: nextActive?.id || "",
      themes: nextThemes,
    };

    setThemeLibrary(nextThemes);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));

    if (!nextActive) {
      setActiveThemeId("");
      setThemeName("蓝雾静读版");
      setImportedHtml("");
      setImportedText("");
      setMapping("h2h3");
      setStatusMessage("主题已删除，当前主题库为空");
      return;
    }

    setActiveThemeId(nextActive.id);
    setThemeName(nextActive.name);
    setImportedHtml(nextActive.rawHtml);
    setImportedText(nextActive.plainText);
    setMapping(nextActive.mapping);
    setStatusMessage(`已删除主题，当前切换到 ${nextActive.name}`);
  }

  async function handleCopyWechatHtml() {
    setIsCopying(true);
    try {
      const html = buildWechatArticleHtml(
        activeTheme,
        currentArticle.title,
        articleMetaLine,
        currentArticleBlocks,
        inlineImageMap
      );
      const plainText = buildWechatArticleText(currentArticle.title, currentArticleBlocks);

      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard &&
        "write" in navigator.clipboard
      ) {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plainText);
      } else {
        throw new Error("Clipboard API unavailable");
      }

      setStatusMessage("公众号正文已复制，可直接粘贴到公众号编辑器");
    } catch {
      setStatusMessage("复制失败，请确认浏览器已允许访问剪贴板");
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className="grid grid-cols-[340px_1fr_360px] h-full overflow-hidden">
      <aside
        className="overflow-y-auto px-6 py-6 border-r"
        style={{ borderColor: COLORS.border, background: COLORS.pageBg }}
      >
        <div
          style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}
        >
          MAPPING
        </div>
        <div className="mt-1 mb-3" style={{ color: COLORS.text }}>
          标题映射规则
        </div>

        <div className="space-y-2">
          {[
            {
              k: "h1h2",
              t: "# 作为一级标题",
              s: "## 作为二级标题",
              note: "适用于完整文档",
            },
            {
              k: "h2h3",
              t: "## 作为一级标题",
              s: "### 作为二级标题",
              note: "适用于已经省略 H1 的稿件",
            },
          ].map((o) => {
            const active = mapping === o.k;
            return (
              <button
                key={o.k}
                onClick={() => setMapping(o.k as MappingMode)}
                className="w-full text-left rounded-md p-3.5 flex items-start gap-3 transition-colors"
                style={{
                  background: active ? COLORS.blueTint : COLORS.surface,
                  border: `1px solid ${active ? "transparent" : COLORS.border}`,
                }}
              >
                <span
                  className="mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{
                    border: `1.5px solid ${active ? COLORS.blueDeep : COLORS.textFaint}`,
                  }}
                >
                  {active && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: COLORS.blueDeep }}
                    />
                  )}
                </span>
                <div className="flex-1">
                  <div
                    style={{
                      color: active ? COLORS.blueDeep : COLORS.text,
                      fontSize: 13,
                    }}
                  >
                    {o.t}
                  </div>
                  <div
                    style={{
                      color: active ? COLORS.blueDeep : COLORS.textMid,
                      fontSize: 12,
                      marginTop: 2,
                      opacity: active ? 0.85 : 1,
                    }}
                  >
                    {o.s}
                  </div>
                  <div
                    style={{
                      color: active ? COLORS.blueDeep : COLORS.textFaint,
                      fontSize: 11,
                      marginTop: 6,
                      opacity: active ? 0.7 : 1,
                    }}
                  >
                    {o.note}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <div
            style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}
          >
            BASELINE
          </div>
          <div className="mt-1 mb-3" style={{ color: COLORS.text }}>
            当前排版基准
          </div>
          <div
            className="rounded-md p-4"
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              <FoggyArt
                hue={0}
                variant="grid"
                style={{ width: 44, height: 44, borderRadius: 6 }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    style={{ color: COLORS.text, fontSize: 14 }}
                  />
                  <Tag tone="blue">默认</Tag>
                </div>
                <div
                  style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}
                >
                  来源：富文本样本 · 本地保存
                </div>
              </div>
            </div>

            <div
              className="mt-4 grid grid-cols-2 gap-y-1.5"
              style={{ fontSize: 11.5, color: COLORS.textMid }}
            >
              <span style={{ color: COLORS.textFaint }}>正文字号</span>
              <span>{sampleSummary.bodyFontSize}</span>
              <span style={{ color: COLORS.textFaint }}>行高</span>
              <span>{sampleSummary.lineHeight}</span>
              <span style={{ color: COLORS.textFaint }}>正文颜色</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: activeTheme.bodyColor }}
                />
                {activeTheme.bodyColor}
              </span>
              <span style={{ color: COLORS.textFaint }}>标题颜色</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: activeTheme.accentColor }}
                />
                {activeTheme.accentColor}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Btn variant="secondary" size="sm" onClick={handleDuplicateTheme}>
                <CopyPlus size={12} strokeWidth={1.6} />
                新建副本
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => activeThemeId && handleDeleteTheme(activeThemeId)}
                disabled={!activeThemeId}
              >
                <Trash2 size={12} strokeWidth={1.6} />
                删除主题
              </Btn>
            </div>

            <div className="mt-4">
              <div
                className="mb-2 flex items-center justify-between"
                style={{ color: COLORS.textFaint, fontSize: 11 }}
              >
                <span>已保存主题</span>
                <span>{themeLibrary.length} 套</span>
              </div>
              <div className="space-y-1.5">
                {themeLibrary.length === 0 ? (
                  <div style={{ color: COLORS.textFaint, fontSize: 11.5 }}>
                    还没有保存主题，先接入样本后点击保存。
                  </div>
                ) : (
                  themeLibrary.map((theme) => {
                    const active = theme.id === activeThemeId;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleSwitchTheme(theme.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left"
                        style={{
                          background: active ? COLORS.blueTint : COLORS.pageBg,
                          border: `1px solid ${active ? "transparent" : COLORS.borderSoft}`,
                        }}
                      >
                        <span className="min-w-0">
                          <span
                            className="block truncate"
                            style={{ color: active ? COLORS.blueDeep : COLORS.text, fontSize: 12.5 }}
                          >
                            {theme.name}
                          </span>
                          <span
                            className="block truncate"
                            style={{ color: COLORS.textFaint, fontSize: 10.5, marginTop: 1 }}
                          >
                            {formatSavedAt(theme.savedAt)} · {theme.mapping === "h1h2" ? "#/##" : "##/###"}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {active && <Tag tone="blue">当前</Tag>}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTheme(theme.id);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded"
                            style={{ color: COLORS.textFaint }}
                            title="删除主题"
                          >
                            <Trash2 size={11} strokeWidth={1.6} />
                          </button>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <Btn variant="primary" size="lg" block onClick={handleCopyWechatHtml}>
            <Copy size={15} strokeWidth={1.6} />
            {isCopying ? "复制中..." : "复制公众号正文"}
          </Btn>
          <Btn variant="secondary" size="md" block onClick={handleSaveBaseline}>
            <Bookmark size={13} strokeWidth={1.6} />
            保存为蓝雾静读版
          </Btn>
          <button
            className="w-full flex items-center justify-center gap-1.5 mt-1"
            style={{
              color: COLORS.textMuted,
              fontSize: 12.5,
              height: 30,
            }}
          >
            <RefreshCw size={12} strokeWidth={1.6} />
            重新生成排版
          </button>
        </div>

        <div
          className="mt-3 flex items-start gap-1.5 px-1"
          style={{ color: COLORS.textFaint, fontSize: 11, lineHeight: 1.6 }}
        >
          <Info size={12} strokeWidth={1.6} className="mt-0.5 shrink-0" />
          <span>复制后直接粘贴至公众号编辑器，可保留段落、间距与颜色。</span>
        </div>
      </aside>

      <section
        className="overflow-y-auto py-8 px-6 flex justify-center"
        style={{
          background:
            "linear-gradient(180deg,#E9ECF0 0%,#E2E6EB 60%,#DDE2E8 100%)",
        }}
      >
        <div
          className="rounded-xl shadow-sm"
          style={{
            width: 420,
            background: "#FFFFFF",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 28px rgba(60,72,90,0.10)",
            border: `1px solid ${COLORS.border}`,
            height: "fit-content",
          }}
        >
          <div
            className="flex items-center justify-between px-5 pt-4"
            style={{ color: activeTheme.metaColor, fontSize: 11 }}
          >
            <span>9:41</span>
            <span>公众号 · 阅读视图</span>
            <span>●●●</span>
          </div>

          <div className="px-7 pt-5 pb-8">
            <div
              style={{
                color: activeTheme.titleColor,
                fontSize: activeTheme.titleFontSize,
                lineHeight: 1.45,
                letterSpacing: 0,
                fontWeight: 600,
              }}
            >
              {currentArticle.title}
            </div>
            <div
              className="mt-3 flex items-center gap-2"
              style={{ color: activeTheme.metaColor, fontSize: 11 }}
            >
              <span
                className="w-5 h-5 rounded-full"
                style={{ background: "#D6DEE7" }}
              />
              <span>静读笔记</span>
              <span>·</span>
              <span>2026-06-09</span>
              <span style={{ marginLeft: "auto" }}>
                {articleMetaLine.split(" · ").at(-1)}
              </span>
            </div>

            {previewCover ? (
              <img
                src={previewCover}
                alt="公众号封面预览"
                style={{
                  aspectRatio: "16/9",
                  marginTop: 16,
                  borderRadius: 6,
                  width: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <FoggyArt
                hue={0}
                variant="mountain"
                style={{ aspectRatio: "16/9", marginTop: 16, borderRadius: 6 }}
                label="蓝雾静读 · 封面"
              />
            )}

            {currentArticleBlocks.map((block, i) => {
              if (block.type === "eyebrow") {
                return (
                  <div
                    key={`eyebrow-${i}`}
                    className="mt-5"
                    style={{
                      color: activeTheme.accentColor,
                      fontSize: 11.5,
                      letterSpacing: "0.14em",
                    }}
                  >
                    {block.text}
                  </div>
                );
              }

              if (block.type === "paragraph") {
                return (
                  <div
                    key={`paragraph-${i}`}
                    className="mt-5"
                    style={{
                      color: activeTheme.bodyColor,
                      fontSize: activeTheme.bodyFontSize,
                      lineHeight: activeTheme.bodyLineHeight,
                      letterSpacing: 0,
                      textAlign: "justify",
                    }}
                  >
                    {block.text}
                  </div>
                );
              }

              if (block.type === "quote") {
                return (
                  <div
                    key={`quote-${i}`}
                    className="my-5"
                    style={{
                      borderLeft: `3px solid ${activeTheme.accentColor}`,
                      paddingLeft: 14,
                      color: activeTheme.accentColor,
                      fontSize: activeTheme.quoteFontSize,
                      lineHeight: activeTheme.bodyLineHeight,
                      background: activeTheme.blockBg,
                      padding: "10px 14px",
                      borderRadius: "0 8px 8px 0",
                    }}
                  >
                    {block.text}
                  </div>
                );
              }

              if (block.type === "note") {
                return (
                  <div
                    key={`note-${i}`}
                    className="mt-4 px-3 py-2.5 rounded-md"
                    style={{
                      background: "#FAF7F2",
                      border: `1px solid ${COLORS.borderSoft}`,
                      color: activeTheme.bodyColor,
                      fontSize: activeTheme.bodyFontSize - 1,
                      lineHeight: activeTheme.bodyLineHeight,
                    }}
                  >
                    {block.text}
                  </div>
                );
              }

              if (block.type === "image") {
                const inlineImageUrl = block.sectionKey
                  ? inlineImageMap.get(block.sectionKey) ?? null
                  : null;
                return (
                  <div key={`image-${i}`} className="mt-6">
                    {inlineImageUrl ? (
                      <img
                        src={inlineImageUrl}
                        alt={block.label}
                        style={{
                          aspectRatio: "16/9",
                          borderRadius: 8,
                          width: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <FoggyArt
                        hue={1}
                        variant="wave"
                        style={{ aspectRatio: "16/9", borderRadius: 6 }}
                        label={block.label}
                      />
                    )}
                    <div
                      className="mt-2"
                      style={{
                        color: activeTheme.metaColor,
                        fontSize: 10.5,
                        textAlign: "center",
                      }}
                    >
                      {block.label}
                    </div>
                  </div>
                );
              }

              return (
                <div key={`section-${i}`} className="mt-6">
                  <h2
                    style={{
                      margin: 0,
                      color: activeTheme.accentColor,
                      fontSize: activeTheme.headingFontSize,
                      lineHeight: 1.5,
                      letterSpacing: 0,
                      fontWeight: 600,
                    }}
                  >
                    {block.title}
                  </h2>
                  <div
                    style={{
                      color: activeTheme.bodyColor,
                      fontSize: activeTheme.bodyFontSize,
                      lineHeight: activeTheme.bodyLineHeight,
                      marginTop: 15,
                      textAlign: "justify",
                    }}
                  >
                    {block.body}
                  </div>
                </div>
              );
            })}

            <div
              className="mt-8 pt-5 flex items-center justify-between"
              style={{
                borderTop: `1px solid ${COLORS.borderSoft}`,
                color: activeTheme.metaColor,
                fontSize: 11,
              }}
            >
              <span>{ARTICLE_FOOTER}</span>
              <span>分享 · 在看 · 点赞</span>
            </div>
          </div>
        </div>
      </section>

      <aside
        className="overflow-y-auto px-6 py-6 border-l"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}
      >
        <div
          style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}
        >
          STYLE INGESTION
        </div>
        <div className="mt-1" style={{ color: COLORS.text }}>
          微信编辑器回贴
        </div>
        <div
          className="mt-1.5"
          style={{ color: COLORS.textFaint, fontSize: 12, lineHeight: 1.6 }}
        >
          直接从公众号编辑器复制富文本后，粘贴到下方区域。系统会自动抓取颜色、字号、行高与样例块。
        </div>

        <div
          className="mt-4 rounded-md overflow-hidden"
          style={{
            background: COLORS.surfaceAlt,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            className="px-4 pt-3.5 pb-2 flex items-center justify-between"
            style={{
              borderBottom: `1px dashed ${COLORS.borderSoft}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: COLORS.blueMid }}
              />
              <span style={{ color: COLORS.textMid, fontSize: 12 }}>
                富文本样本接入区
              </span>
            </div>
            <button
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1.5 px-2 rounded"
              style={{
                color: COLORS.blueDeep,
                fontSize: 12,
                height: 26,
                background: "transparent",
              }}
            >
              <ClipboardPaste size={12} strokeWidth={1.6} />
              {isPasting ? "读取中..." : "粘贴样本"}
            </button>
          </div>

          <div className="px-4 py-4">
            <div
              style={{
                color: COLORS.textFaint,
                fontSize: 11.5,
                lineHeight: 1.7,
              }}
            >
              来源：公众号后台编辑器、Word、飞书文档、Notion 导出。
              <br />
              建议包含一级 / 二级标题、正文段落、引用块。
            </div>

            <textarea
              value={importedText}
              onChange={(e) => {
                setImportedHtml("");
                setImportedText(e.target.value);
                setStatusMessage("已接收新样本 · 待保存");
              }}
              placeholder="也可以直接把从公众号编辑器复制的内容粘贴到这里。"
              className="mt-3 w-full rounded-md px-3 py-2.5 outline-none resize-none"
              style={{
                minHeight: 104,
                background: COLORS.surface,
                border: `1px solid ${COLORS.borderSoft}`,
                color: COLORS.textMid,
                fontSize: 12,
                lineHeight: 1.7,
              }}
            />

            <div
              className="mt-3 px-3 py-2.5 rounded"
              style={{
                background: COLORS.pageBg,
                fontSize: 11.5,
                lineHeight: 1.7,
              }}
            >
              {samplePreview ? (
                samplePreview.mode === "html" ? (
                  <div
                    style={{ color: activeTheme.bodyColor }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizePreviewHtml(samplePreview.value),
                    }}
                  />
                ) : (
                  <div
                    style={{ color: activeTheme.bodyColor, whiteSpace: "pre-wrap" }}
                  >
                    {samplePreview.value.slice(0, 240)}
                  </div>
                )
              ) : (
                <>
                  <div style={{ color: activeTheme.accentColor }}>
                    「专注不是用力」 · {sampleSummary.headingFontSize}
                  </div>
                  <div style={{ color: activeTheme.bodyColor, marginTop: 2 }}>
                    正文 · {sampleSummary.bodyFontSize} · {activeTheme.bodyColor}
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            className="px-4 py-3 flex items-center justify-end gap-2"
            style={{
              borderTop: `1px solid ${COLORS.borderSoft}`,
              background: COLORS.pageBg,
            }}
          >
            <span
              className="mr-auto"
              style={{ color: COLORS.textFaint, fontSize: 11 }}
            >
              {statusMessage.includes("已应用") ? "已保存" : "已接收 · 待保存"}
            </span>
            <Btn variant="secondary" size="sm" onClick={handleSaveBaseline}>
              <Bookmark size={12} strokeWidth={1.6} />
              保存为蓝雾静读版
            </Btn>
          </div>
        </div>

        <Divider />
        <div className="my-5" />

        <SectionTitle hint="基于最近一次粘贴样本">已抓取样式摘要</SectionTitle>

        <div
          className="grid grid-cols-2 gap-y-3 gap-x-4 mt-2"
          style={{ fontSize: 12 }}
        >
          {[
            ["段落数", String(sampleSummary.paragraphCount)],
            ["标题数", String(sampleSummary.headingCount)],
            ["正文字号", sampleSummary.bodyFontSize],
            ["标题字号", sampleSummary.headingFontSize],
            ["行高", sampleSummary.lineHeight],
            ["字间距", sampleSummary.letterSpacing],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ color: COLORS.textFaint, fontSize: 11 }}>{k}</div>
              <div style={{ color: COLORS.text, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2" style={{ color: COLORS.textFaint, fontSize: 11 }}>
            色彩
          </div>
          <div className="flex items-center gap-2">
            {[
              [activeTheme.bodyColor, "正文"],
              [activeTheme.accentColor, "标题"],
              [activeTheme.metaColor, "辅助"],
              [activeTheme.blockBg, "块底"],
              ["#FFFFFF", "底色"],
            ].map(([c, l]) => (
              <div key={c} className="flex flex-col items-center gap-1">
                <span
                  className="w-7 h-7 rounded"
                  style={{
                    background: c,
                    border:
                      c === "#FFFFFF"
                        ? `1px solid ${COLORS.border}`
                        : "none",
                  }}
                />
                <span style={{ color: COLORS.textFaint, fontSize: 10 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span style={{ color: COLORS.textFaint, fontSize: 11 }}>样例块</span>
            <button
              className="flex items-center gap-1"
              style={{ color: COLORS.blue, fontSize: 11 }}
            >
              查看全部 <ChevronRight size={11} strokeWidth={1.6} />
            </button>
          </div>
          <div className="space-y-2">
            <div
              className="px-3 py-2 rounded text-xs"
              style={{
                background: COLORS.surfaceAlt,
                border: `1px solid ${COLORS.borderSoft}`,
                color: activeTheme.accentColor,
                fontSize: activeTheme.headingFontSize,
              }}
            >
              一、为什么注意力会碎片化
            </div>
            <div
              className="px-3 py-2 rounded"
              style={{
                background: COLORS.surfaceAlt,
                border: `1px solid ${COLORS.borderSoft}`,
                color: activeTheme.bodyColor,
                fontSize: activeTheme.bodyFontSize,
                lineHeight: activeTheme.bodyLineHeight,
              }}
            >
              真正的专注从来不是用力，而是放弃……
            </div>
            <div
              className="px-3 py-2 rounded"
              style={{
                borderLeft: `3px solid ${activeTheme.accentColor}`,
                background: activeTheme.blockBg,
                color: activeTheme.accentColor,
                fontSize: activeTheme.quoteFontSize,
                lineHeight: 1.6,
              }}
            >
              引用块 · 用于金句段
            </div>
          </div>
        </div>

        <div
          className="mt-5 flex items-center gap-2 px-3 py-2.5 rounded-md"
          style={{ background: "#E5EDE6", color: "#4F6B57" }}
        >
          <CheckCircle2 size={14} strokeWidth={1.6} />
          <span style={{ fontSize: 12 }}>{statusMessage}</span>
        </div>
      </aside>
    </div>
  );
}

function stripHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function sanitizePreviewHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style").forEach((node) => node.remove());
  return doc.body.innerHTML.slice(0, 1000);
}

function formatSavedAt(isoString: string) {
  const date = new Date(isoString);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildWechatArticleHtml(
  theme: WechatTheme,
  title: string,
  meta: string,
  blocks: ArticleBlock[],
  inlineImageMap: Map<string, string>
) {
  const blocksHtml = blocks.map((block) => {
    if (block.type === "eyebrow") {
      return `
        <p style="margin:18px 0 8px;color:${theme.accentColor};font-size:11.5px;letter-spacing:0.14em;">
          ${escapeHtml(block.text)}
        </p>
      `;
    }

    if (block.type === "paragraph") {
      return `
        <p style="margin:18px 0 0;padding:8px 0;color:${theme.bodyColor};font-size:${theme.bodyFontSize}px;line-height:${theme.bodyLineHeight};text-align:justify;">
          ${escapeHtml(block.text)}
        </p>
      `;
    }

    if (block.type === "quote") {
      return `
        <blockquote style="margin:20px 0 12px;padding:10px 14px;border-left:3px solid ${theme.accentColor};background:${theme.blockBg};color:${theme.accentColor};font-size:${theme.quoteFontSize}px;line-height:${theme.bodyLineHeight};border-radius:0 8px 8px 0;">
          ${escapeHtml(block.text)}
        </blockquote>
      `;
    }

    if (block.type === "note") {
      return `
        <div style="margin:18px 0 0;padding:10px 12px;border:1px solid #ECEAE3;border-radius:8px;background:#FAF7F2;color:${theme.bodyColor};font-size:${Math.max(
          theme.bodyFontSize - 1,
          12
        )}px;line-height:${theme.bodyLineHeight};">
          ${escapeHtml(block.text)}
        </div>
      `;
    }

    if (block.type === "image") {
      const inlineImageUrl = block.sectionKey
        ? inlineImageMap.get(block.sectionKey) ?? null
        : null;
      return `
        <figure style="margin:26px 0 12px;text-align:center;">
          ${
            inlineImageUrl
              ? `<img src="${escapeHtml(inlineImageUrl)}" alt="${escapeHtml(block.label)}" style="display:block;width:100%;max-width:720px;height:auto;margin:0 auto;border-radius:8px;object-fit:cover;background:#f0f3fa;" />`
              : `<div style="aspect-ratio:16/9;border-radius:8px;background:linear-gradient(160deg,#DCE5EE 0%,#B9C7D5 100%);"></div>`
          }
          <figcaption style="margin-top:8px;color:${theme.metaColor};font-size:10.5px;line-height:1.6;text-align:center;">
            ${escapeHtml(block.label)}
          </figcaption>
        </figure>
      `;
    }

    return `
      <section style="margin-top:34px;">
        <h2 style="margin:0 0 15px;color:${theme.accentColor};font-size:${theme.headingFontSize}px;line-height:1.5;letter-spacing:0;font-weight:600;">
          ${escapeHtml(block.title)}
        </h2>
        <p style="margin:0;padding:8px 0;color:${theme.bodyColor};font-size:${theme.bodyFontSize}px;line-height:${theme.bodyLineHeight};text-align:justify;">
          ${escapeHtml(block.body)}
        </p>
      </section>
    `;
  }).join("");

  return `
    <section data-tool="moyujing-wechat-article" style="font-size:${theme.bodyFontSize}px;line-height:${theme.bodyLineHeight};color:${theme.bodyColor};background:#ffffff;padding:0 30px;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;">
      <h1 style="margin:0 0 12px;color:${theme.titleColor};font-size:${theme.titleFontSize}px;line-height:1.45;font-weight:600;letter-spacing:0;">
        ${escapeHtml(title)}
      </h1>
      <p style="margin:0 0 18px;color:${theme.metaColor};font-size:11px;line-height:1.6;">
        ${escapeHtml(meta)}
      </p>
      ${blocksHtml}
      <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #ECEAE3;color:${theme.metaColor};font-size:11px;line-height:1.6;">
        ${escapeHtml(ARTICLE_FOOTER)}
      </p>
    </section>
  `.trim();
}

function buildWechatArticleText(title: string, blocks: ArticleBlock[]) {
  return [
    title,
    "",
    ...blocks.flatMap((block) => {
      if (
        block.type === "paragraph" ||
        block.type === "quote" ||
        block.type === "eyebrow" ||
        block.type === "note"
      ) {
        return [block.text, ""];
      }
      if (block.type === "image") {
        return [`[图片] ${block.label}`, ""];
      }
      return [block.title, block.body, ""];
    }),
    ARTICLE_FOOTER,
  ].join("\n");
}

function buildArticleMetaLine(articleMeta: string) {
  const charCount = Number(articleMeta.match(/(\d+)\s*字/u)?.[1] ?? 0);
  const readingMinutes = Math.max(1, Math.ceil(charCount / 420));
  return `静读笔记 · 2026-06-09 · ${readingMinutes} 分钟阅读`;
}

function deriveWechatTheme(
  importedHtml: string,
  summary: {
    bodyFontSize: string;
    headingFontSize: string;
    lineHeight: string;
  }
): WechatTheme {
  if (!importedHtml) {
    return {
      ...DEFAULT_THEME,
      bodyFontSize: parsePixel(summary.bodyFontSize, DEFAULT_THEME.bodyFontSize),
      headingFontSize: parseHeadingFontSize(
        summary.headingFontSize,
        DEFAULT_THEME.headingFontSize
      ),
      bodyLineHeight: parseFloat(summary.lineHeight) || DEFAULT_THEME.bodyLineHeight,
      quoteFontSize: parsePixel(summary.bodyFontSize, DEFAULT_THEME.quoteFontSize),
    };
  }

  const doc = new DOMParser().parseFromString(importedHtml, "text/html");
  const styledNodes = Array.from(doc.body.querySelectorAll<HTMLElement>("[style]"));
  const colors = collectMatches(styledNodes, /color\s*:\s*([^;]+)/i);
  const backgrounds = collectMatches(styledNodes, /background(?:-color)?\s*:\s*([^;]+)/i);
  const fontSizes = collectMatches(styledNodes, /font-size\s*:\s*([^;]+)/i);
  const lineHeights = collectMatches(styledNodes, /line-height\s*:\s*([^;]+)/i);

  const bodyColor = pickCssColor(colors[0]) || DEFAULT_THEME.bodyColor;
  const accentColor =
    pickCssColor(colors.find((item) => item !== bodyColor)) || DEFAULT_THEME.accentColor;
  const blockBg = pickCssColor(backgrounds[0]) || DEFAULT_THEME.blockBg;
  const bodyFontSize =
    parsePixel(fontSizes.find((item) => item.includes("px")), DEFAULT_THEME.bodyFontSize);
  const headingFontSize =
    parsePixel(
      fontSizes.find((item) => parsePixel(item, 0) >= bodyFontSize + 1),
      DEFAULT_THEME.headingFontSize
    );
  const bodyLineHeight =
    parseLineHeight(lineHeights[0], DEFAULT_THEME.bodyLineHeight);

  return {
    titleColor: accentColor,
    bodyColor,
    metaColor: DEFAULT_THEME.metaColor,
    accentColor,
    blockBg,
    bodyFontSize,
    titleFontSize: Math.max(headingFontSize + 5, DEFAULT_THEME.titleFontSize),
    headingFontSize,
    bodyLineHeight,
    quoteFontSize: bodyFontSize,
  };
}

function collectMatches(nodes: HTMLElement[], pattern: RegExp) {
  return nodes
    .map((node) => pattern.exec(node.getAttribute("style") || "")?.[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

function pickCssColor(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ||
    /^rgb/i.test(trimmed)
  ) {
    return trimmed;
  }
  return null;
}

function parsePixel(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const match = value.match(/([\d.]+)/);
  return match ? Number(match[1]) : fallback;
}

function parseHeadingFontSize(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const first = value.split("/")[0]?.trim();
  return parsePixel(first, fallback);
}

function parseLineHeight(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const numeric = parseFloat(value.replace("px", "").trim());
  if (!Number.isFinite(numeric)) return fallback;
  return value.includes("px")
    ? Number((numeric / DEFAULT_THEME.bodyFontSize).toFixed(2))
    : numeric;
}

function createThemeId() {
  return `theme-${Date.now().toString(36)}`;
}

function upsertTheme(
  themes: SavedWechatBaseline[],
  nextTheme: SavedWechatBaseline
) {
  const existingIndex = themes.findIndex((item) => item.id === nextTheme.id);
  if (existingIndex === -1) {
    return [nextTheme, ...themes];
  }

  const clone = [...themes];
  clone[existingIndex] = nextTheme;
  return clone;
}
