import {
  type CSSProperties,
  type ClipboardEvent as ReactClipboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Copy,
  RefreshCw,
  Bookmark,
  Info,
  CheckCircle2,
  ChevronRight,
  CopyPlus,
  Trash2,
} from "lucide-react";
import { SectionTitle, Btn, Tag, COLORS, Divider, FoggyArt } from "./ui-kit";
import { useWorkspace } from "../workspace";

const STORAGE_KEY = "content-visual-studio.wechat-theme-library.v1";

type MappingMode = "h1h2" | "h2h3";
type PreviewMode = "sample" | "article";

type SavedWechatBaseline = {
  id: string;
  name: string;
  mapping?: MappingMode;
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

type WechatStyleTemplate = {
  containerStyle: string;
  titleStyle: string;
  metaStyle: string;
  primaryHeadingStyle: string;
  secondaryHeadingStyle: string;
  tertiaryHeadingStyle: string;
  paragraphStyle: string;
  quoteStyle: string;
  noteStyle: string;
  eyebrowStyle: string;
  figcaptionStyle: string;
};

type WechatArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "heading"; level: "primary" | "secondary" | "tertiary"; title: string; body?: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; label: string; sectionKey?: string };

type SampleBlockRole =
  | "primary"
  | "secondary"
  | "body"
  | "bold"
  | "quote"
  | "meta";

type SampleBlockPreview = {
  id: string;
  role: SampleBlockRole;
  label: string;
  text: string;
  style: string;
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
    generationRecords,
    workbenchState,
    wechatPreviewMode: previewMode,
    setWechatPreviewMode: setPreviewMode,
  } =
    useWorkspace();
  const mapping: MappingMode = "h1h2";
  const [importedHtml, setImportedHtml] = useState("");
  const [importedText, setImportedText] = useState("");
  const [themeName, setThemeName] = useState("蓝雾静读版");
  const [themeLibrary, setThemeLibrary] = useState<SavedWechatBaseline[]>([]);
  const [activeThemeId, setActiveThemeId] = useState("");
  const [statusMessage, setStatusMessage] = useState("尚未保存新的样式基准");
  const [isCopying, setIsCopying] = useState(false);
  const [showAllSampleBlocks, setShowAllSampleBlocks] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

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
        primaryHeadingCount: 2,
        secondaryHeadingCount: 1,
        bodyFontSize: "15 px",
        primaryHeadingFontSize: mapping === "h1h2" ? "17 px" : "16 px",
        secondaryHeadingFontSize: mapping === "h1h2" ? "16 px" : "15 px",
        lineHeight: "1.85",
        letterSpacing: "0.01em",
      };
    }

    const textSource = importedText.trim() || stripHtml(importedHtml);
    const doc = importedHtml
      ? new DOMParser().parseFromString(importedHtml, "text/html")
      : null;
    const headingSelectors = doc
      ? detectRichTextHeadingSelectorMap(doc.body)
      : mapping === "h1h2"
        ? { primary: "h1", secondary: "h2" }
        : { primary: "h2", secondary: "h3" };
    const primaryHeadingNodes = doc
      ? Array.from(doc.querySelectorAll<HTMLElement>(headingSelectors.primary))
      : [];
    const secondaryHeadingNodes = doc
      ? Array.from(doc.querySelectorAll<HTMLElement>(headingSelectors.secondary))
      : [];
    const markdownLines = textSource
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const primaryMarkdownHeading = mapping === "h1h2" ? /^#\s+/ : /^##\s+/;
    const secondaryMarkdownHeading = mapping === "h1h2" ? /^##\s+/ : /^###\s+/;
    const primaryHeadingCount = doc
      ? primaryHeadingNodes.length
      : markdownLines.filter((line) => primaryMarkdownHeading.test(line)).length;
    const secondaryHeadingCount = doc
      ? secondaryHeadingNodes.length
      : markdownLines.filter((line) => secondaryMarkdownHeading.test(line)).length;

    const paragraphCount = Math.max(
      doc?.querySelectorAll("p").length ?? 0,
      textSource
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter((item) => item && !/^#{1,6}\s/.test(item)).length || 1
    );
    const styledBodyNodes = doc
      ? Array.from(doc.body.querySelectorAll<HTMLElement>("p,section,span,div")).filter(
          (node) => node.textContent?.trim() && isPlainParagraphCandidate(node)
        )
      : [];
    const primaryFontNodes = doc
      ? primaryHeadingNodes.map(findSampleStyleNode).filter((node): node is HTMLElement => Boolean(node))
      : primaryHeadingNodes;
    const secondaryFontNodes = doc
      ? secondaryHeadingNodes.map(findSampleStyleNode).filter((node): node is HTMLElement => Boolean(node))
      : secondaryHeadingNodes;

    return {
      paragraphCount,
      primaryHeadingCount,
      secondaryHeadingCount,
      bodyFontSize: formatCssValue(
        firstCssValue(styledBodyNodes, "font-size"),
        "15 px"
      ),
      primaryHeadingFontSize: formatCssValue(
        firstCssValue(primaryFontNodes, "font-size"),
        mapping === "h1h2" ? "17 px" : "16 px"
      ),
      secondaryHeadingFontSize: formatCssValue(
        firstCssValue(secondaryFontNodes, "font-size"),
        mapping === "h1h2" ? "16 px" : "15 px"
      ),
      lineHeight: formatCssValue(firstCssValue(styledBodyNodes, "line-height"), "1.85"),
      letterSpacing: formatCssValue(
        firstCssValue(styledBodyNodes, "letter-spacing"),
        "0.01em"
      ),
    };
  }, [importedHtml, importedText, mapping]);

  const activeTheme = useMemo(
    () => deriveWechatTheme(importedHtml, sampleSummary),
    [importedHtml, sampleSummary]
  );
  const styleTemplate = useMemo(
    () => extractWechatStyleTemplate(importedHtml, activeTheme),
    [activeTheme, importedHtml]
  );
  const sampleBlocks = useMemo(
    () => extractSampleBlockPreviews(importedHtml, importedText, mapping, styleTemplate),
    [importedHtml, importedText, mapping, styleTemplate]
  );
  const wechatArticleBlocks = useMemo(
    () => buildWechatArticleBlocks(currentArticle.body, mapping),
    [currentArticle.body, mapping]
  );

  const samplePreview = useMemo(() => {
    if (importedHtml) return { mode: "html" as const, value: importedHtml };
    if (importedText.trim()) return { mode: "text" as const, value: importedText };
    return null;
  }, [importedHtml, importedText]);
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
  const previewArticleHtml = useMemo(
    () =>
      buildWechatArticleHtml(
        styleTemplate,
        currentArticle.title,
        wechatArticleBlocks,
        previewCover,
        inlineImageMap
      ),
    [
      activeTheme,
      currentArticle.body,
      currentArticle.title,
      importedHtml,
      inlineImageMap,
      previewCover,
      styleTemplate,
      wechatArticleBlocks,
    ]
  );
  const previewPaneHtml = useMemo(() => {
    if (previewMode === "sample" && importedHtml) return sanitizePreviewHtml(importedHtml);
    if (previewMode === "sample" && importedText.trim()) {
      return plainTextToPreviewHtml(importedText);
    }
    return previewArticleHtml;
  }, [importedHtml, importedText, previewArticleHtml, previewMode]);

  function receivePastedSample(html: string, text: string) {
    const nextText = (text || stripHtml(html)).trim();
    if (!html && !nextText) {
      setStatusMessage("样本为空，请重新复制公众号排版内容");
      return;
    }
    setImportedHtml(html);
    setImportedText(nextText);
    setPreviewMode("sample");
    setStatusMessage(html ? "已接收富文本样本 · 待保存" : "已接收纯文本样本 · 待保存");
  }

  function handleSamplePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    if (!html && !text.trim()) return;
    event.preventDefault();
    receivePastedSample(html, text);
    event.currentTarget.textContent = "";
  }

  function handleSaveBaseline() {
    const payload: SavedWechatBaseline = {
      id: activeThemeId || createThemeId(),
      name: themeName.trim() || "未命名排版",
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
      setPreviewMode("article");
      setStatusMessage("主题已删除，当前主题库为空");
      return;
    }

    setActiveThemeId(nextActive.id);
    setThemeName(nextActive.name);
    setImportedHtml(nextActive.rawHtml);
    setImportedText(nextActive.plainText);
    setStatusMessage(`已删除主题，当前切换到 ${nextActive.name}`);
  }

  async function handleCopyWechatHtml() {
    setIsCopying(true);
    try {
      const html = previewPaneHtml;
      const plainText = htmlToPlainText(previewPaneHtml);

      if (!copyWechatArticleWithCopyEvent(html, plainText)) {
        await copyWechatArticleToClipboard(html, plainText);
      }

      setStatusMessage(
        previewMode === "sample" && samplePreview
          ? "预览窗富文本已复制，可直接粘贴到公众号编辑器"
          : "公众号正文已复制，可直接粘贴到公众号编辑器"
      );
    } catch (error) {
      console.warn("[wechat-copy] failed", error);
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
        <div>
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
                            {formatSavedAt(theme.savedAt)} · 样式资产
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {active && <Tag tone="blue">当前</Tag>}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTheme(theme.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteTheme(theme.id);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded"
                            style={{ color: COLORS.textFaint }}
                            title="删除主题"
                          >
                            <Trash2 size={11} strokeWidth={1.6} />
                          </span>
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
            {isCopying
              ? "复制中..."
              : previewMode === "article"
                ? "复制当前文章排版"
                : "复制预览富文本"}
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
        <div style={{ width: 420 }}>
          <div
            className="mb-3 rounded-md p-1 grid grid-cols-2"
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {[
              { mode: "sample" as const, label: "预览样本" },
              { mode: "article" as const, label: "排版当前文章" },
            ].map((item) => {
              const active = previewMode === item.mode;
              const disabled = item.mode === "sample" && !samplePreview;
              return (
                <button
                  key={item.mode}
                  disabled={disabled}
                  onClick={() => setPreviewMode(item.mode)}
                  className="rounded px-3 py-2 transition-colors"
                  style={{
                    background: active ? COLORS.blueTint : "transparent",
                    color: disabled
                      ? COLORS.textFaint
                      : active
                        ? COLORS.blueDeep
                        : COLORS.textMid,
                    fontSize: 12.5,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            className="rounded-xl shadow-sm"
            style={{
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
              <div dangerouslySetInnerHTML={{ __html: previewPaneHtml }} />

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
            <span style={{ color: COLORS.textFaint, fontSize: 10.5 }}>
              点击下方区域后 Cmd+V
            </span>
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

            <div
              className="relative mt-3"
              style={{ minHeight: 116 }}
            >
              {!samplePreview && (
                <div
                  className="pointer-events-none absolute left-3 right-3 top-2.5"
                  style={{ color: COLORS.textFaint, fontSize: 12, lineHeight: 1.7 }}
                >
                  在这里直接粘贴公众号编辑器内容。系统会优先读取富文本 HTML。
                </div>
              )}
              {samplePreview && (
                <div
                  className="pointer-events-none absolute left-3 right-3 top-2.5"
                  style={{ color: COLORS.textFaint, fontSize: 12, lineHeight: 1.7 }}
                >
                  已接入{samplePreview.mode === "html" ? "富文本" : "纯文本"}样本。
                  下方样式摘要已更新，可保存为默认基准。
                </div>
              )}
              <div
                ref={pasteAreaRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handleSamplePaste}
                onInput={(event) => {
                  const text = event.currentTarget.innerText.trim();
                  setImportedHtml("");
                  setImportedText(text);
                  setStatusMessage(
                    text
                      ? "已接收纯文本样本 · 待保存"
                      : "样本为空，请重新复制公众号排版内容"
                  );
                  event.currentTarget.textContent = "";
                }}
                className="mt-3 w-full rounded-md px-3 py-2.5 outline-none"
                style={{
                  minHeight: 116,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.borderSoft}`,
                  color: "transparent",
                  fontSize: 12,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  caretColor: COLORS.text,
                }}
              />
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
            ["一级标题", String(sampleSummary.primaryHeadingCount)],
            ["二级标题", String(sampleSummary.secondaryHeadingCount)],
            ["正文字号", sampleSummary.bodyFontSize],
            ["一级字号", sampleSummary.primaryHeadingFontSize],
            ["二级字号", sampleSummary.secondaryHeadingFontSize],
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
              onClick={() => setShowAllSampleBlocks((value) => !value)}
              className="flex items-center gap-1"
              style={{ color: COLORS.blue, fontSize: 11 }}
            >
              {showAllSampleBlocks ? "收起" : "查看全部"}
              <ChevronRight
                size={11}
                strokeWidth={1.6}
                style={{
                  transform: showAllSampleBlocks ? "rotate(90deg)" : "none",
                  transition: "transform 0.16s ease",
                }}
              />
            </button>
          </div>
          <div className="space-y-2">
            {(showAllSampleBlocks ? sampleBlocks : sampleBlocks.slice(0, 4)).map(
              (block) => (
                <div
                  key={block.id}
                  className="rounded overflow-hidden"
                  style={{
                    border: `1px solid ${COLORS.borderSoft}`,
                    background: COLORS.surface,
                  }}
                >
                  <div
                    className="px-3 py-1.5 flex items-center justify-between"
                    style={{
                      background: COLORS.surfaceAlt,
                      borderBottom: `1px solid ${COLORS.borderSoft}`,
                    }}
                  >
                    <span style={{ color: COLORS.blueDeep, fontSize: 11 }}>
                      {block.label}
                    </span>
                    <span style={{ color: COLORS.textFaint, fontSize: 10.5 }}>
                      来自富文本样本
                    </span>
                  </div>
                  <div
                    className="px-3 py-2"
                    style={{
                      ...sampleBlockStyleForRole(block.role, activeTheme),
                      ...parseReactStyle(block.style),
                    }}
                  >
                    {block.text}
                  </div>
                </div>
              )
            )}
            {sampleBlocks.length === 0 && (
              <div
                className="px-3 py-2 rounded"
                style={{
                  background: COLORS.surfaceAlt,
                  border: `1px solid ${COLORS.borderSoft}`,
                  color: COLORS.textFaint,
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                尚未识别到样本块。请先粘贴富文本样本。
              </div>
            )}
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

function htmlToPlainText(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.replace(/\n{3,}/g, "\n\n").trim() ?? "";
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function stripInlineMarkdown(text: string) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

function buildWechatArticleBlocks(body: string, mapping: MappingMode): WechatArticleBlock[] {
  const chunks = body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  const blocks: WechatArticleBlock[] = [];
  let lastSectionKey: string | undefined;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const markdownHeading = chunk.match(/^(#{1,3})\s+(.+)$/);

    if (/^>\s*/.test(chunk)) {
      blocks.push({
        type: "quote",
        text: chunk
          .split("\n")
          .map((line) => line.replace(/^>\s*/, ""))
          .join("\n"),
      });
      continue;
    }

    if (/^(图|图片)[:：]/.test(chunk)) {
      blocks.push({
        type: "image",
        label: chunk.replace(/^(图|图片)[:：]\s*/, ""),
        sectionKey: lastSectionKey,
      });
      continue;
    }

    if (markdownHeading) {
      const hashLevel = markdownHeading[1].length;
      const title = markdownHeading[2].trim();
      const mappedLevel = mapMarkdownHeadingLevel(hashLevel, mapping);
      lastSectionKey = toWechatSectionKey(title);
      blocks.push({ type: "heading", level: mappedLevel, title });
      continue;
    }

    const orderedList = parseMarkdownList(chunk, true);
    if (orderedList) {
      const items = [...orderedList];
      while (index + 1 < chunks.length) {
        const nextList = parseMarkdownList(chunks[index + 1], true);
        if (!nextList) break;
        items.push(...nextList);
        index += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    const unorderedList = parseMarkdownList(chunk, false);
    if (unorderedList) {
      const items = [...unorderedList];
      while (index + 1 < chunks.length) {
        const nextList = parseMarkdownList(chunks[index + 1], false);
        if (!nextList) break;
        items.push(...nextList);
        index += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    blocks.push({ type: "paragraph", text: chunk });
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: body.trim() }];
}

function mapMarkdownHeadingLevel(hashLevel: number, mapping: MappingMode) {
  if (mapping === "h1h2") {
    if (hashLevel <= 1) return "primary";
    if (hashLevel === 2) return "secondary";
    return "tertiary";
  }
  return hashLevel <= 2 ? "primary" : "secondary";
}

function detectRichTextHeadingSelectorMap(root: HTMLElement) {
  const hasSectionH1 = Array.from(root.querySelectorAll<HTMLElement>("h1")).some((node) =>
    isSectionHeadingText(node.textContent || "")
  );

  return hasSectionH1
    ? { primary: "h1", secondary: "h2" }
    : { primary: "h2", secondary: "h3" };
}

function detectRichTextHeadingSelectors(root: HTMLElement) {
  const headingMap = detectRichTextHeadingSelectorMap(root);
  return [headingMap.primary, headingMap.secondary];
}

function parseMarkdownList(chunk: string, ordered: boolean) {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const items = lines.map((line) => parseMarkdownListItem(line, ordered));
  if (items.some((item) => !item)) return null;
  return items.filter((item): item is string => Boolean(item));
}

function parseMarkdownListItem(line: string, ordered: boolean) {
  if (ordered) {
    const boldNumbered = line.match(/^\*\*\d+[.、]\s*([^*]+)\*\*(.*)$/);
    if (boldNumbered) return `**${boldNumbered[1].trim()}**${boldNumbered[2] || ""}`.trim();

    return line.match(/^\d+[.、]\s*(.+)$/)?.[1]?.trim() ?? "";
  }

  const boldBulleted = line.match(/^\*\*[-*•]\s+([^*]+)\*\*(.*)$/);
  if (boldBulleted) return `**${boldBulleted[1].trim()}**${boldBulleted[2] || ""}`.trim();

  return line.match(/^[-*•]\s+(.+)$/)?.[1]?.trim() ?? "";
}

function toWechatSectionKey(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function inlineMarkdownToHtml(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part) => {
      const match = part.match(/^\*\*([^*]+)\*\*$/);
      if (!match) return escapeHtml(part);
      return `<strong style="font-weight:700;">${escapeHtml(match[1])}</strong>`;
    })
    .join("");
}

function extractWechatStyleTemplate(
  importedHtml: string,
  theme: WechatTheme
): WechatStyleTemplate {
  const fallback = buildFallbackStyleTemplate(theme);
  if (!importedHtml) return fallback;

  const doc = new DOMParser().parseFromString(importedHtml, "text/html");
  doc.querySelectorAll("script,style").forEach((node) => node.remove());
  const candidates = Array.from(
    doc.body.querySelectorAll<HTMLElement>("section,p,div,blockquote,h1,h2,h3")
  ).filter((node) => getTextDensity(node) > 0);

  const headingSelectors = detectRichTextHeadingSelectors(doc.body);
  const visualHeadingNodes = rankVisualHeadingNodes(candidates);
  const titleNode =
    findFirstStyledNode(doc.body, ["h1"]) ??
    findLargestTextNode(candidates, { preferShort: true });
  const primaryHeadingNode =
    findFirstStyledNode(doc.body, [headingSelectors[0]]) ??
    visualHeadingNodes[0] ??
    titleNode;
  const secondaryHeadingNode =
    findFirstStyledNode(doc.body, [headingSelectors[1]]) ??
    visualHeadingNodes.find((node) => node !== primaryHeadingNode) ??
    primaryHeadingNode;
  const paragraphNode =
    findParagraphLikeNode(candidates, primaryHeadingNode, titleNode) ?? candidates[0];
  const quoteNode = findQuoteLikeNode(candidates) ?? paragraphNode;
  const metaNode = findMetaLikeNode(candidates, paragraphNode) ?? paragraphNode;
  const firstElement = doc.body.firstElementChild;
  const containerNode =
    findFirstStyledNode(doc.body, ["section"]) ??
    (firstElement instanceof HTMLElement ? firstElement : null);

  return {
    containerStyle: mergeStyleStrings(
      fallback.containerStyle,
      pickContainerStyle(containerNode)
    ),
    titleStyle: mergeStyleStrings(
      fallback.titleStyle,
      collectStyleChain(findSampleStyleNode(titleNode))
    ),
    metaStyle: mergeStyleStrings(
      fallback.metaStyle,
      collectStyleChain(findSampleStyleNode(metaNode))
    ),
    primaryHeadingStyle: normalizeHeadingStyle(
      mergeStyleStrings(
        fallback.primaryHeadingStyle,
        collectStyleChain(findSampleStyleNode(primaryHeadingNode))
      ),
      "primary"
    ),
    secondaryHeadingStyle: normalizeHeadingStyle(
      mergeStyleStrings(
        fallback.secondaryHeadingStyle,
        collectStyleChain(findSampleStyleNode(secondaryHeadingNode))
      ),
      "secondary"
    ),
    tertiaryHeadingStyle: normalizeTertiaryHeadingStyle(fallback.secondaryHeadingStyle),
    paragraphStyle: mergeStyleStrings(
      fallback.paragraphStyle,
      collectStyleChain(findSampleStyleNode(paragraphNode))
    ),
    quoteStyle: mergeStyleStrings(
      fallback.quoteStyle,
      collectStyleChain(findSampleStyleNode(quoteNode))
    ),
    noteStyle: mergeStyleStrings(
      fallback.noteStyle,
      collectStyleChain(findSampleStyleNode(quoteNode))
    ),
    eyebrowStyle: mergeStyleStrings(
      fallback.eyebrowStyle,
      collectStyleChain(findSampleStyleNode(metaNode))
    ),
    figcaptionStyle: mergeStyleStrings(
      fallback.figcaptionStyle,
      collectStyleChain(findSampleStyleNode(metaNode))
    ),
  };
}

function buildFallbackStyleTemplate(theme: WechatTheme): WechatStyleTemplate {
  return {
    containerStyle: `font-size:${theme.bodyFontSize}px;line-height:${theme.bodyLineHeight};color:${theme.bodyColor};background:#ffffff;padding:0 30px;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;`,
    titleStyle: `margin:0 0 12px;color:${theme.titleColor};font-size:${theme.titleFontSize}px;line-height:1.45;font-weight:600;letter-spacing:0;`,
    metaStyle: `margin:0 0 18px;color:${theme.metaColor};font-size:11px;line-height:1.6;`,
    primaryHeadingStyle: `margin:0 0 15px;color:${theme.accentColor};font-size:${theme.headingFontSize}px;line-height:1.5;letter-spacing:0;font-weight:600;`,
    secondaryHeadingStyle: `margin:0 0 12px;color:${theme.accentColor};font-size:${Math.max(
      theme.headingFontSize - 2,
      theme.bodyFontSize
    )}px;line-height:1.55;letter-spacing:0;font-weight:600;`,
    tertiaryHeadingStyle: `margin:0 0 10px;color:${theme.accentColor};font-size:${Math.max(
      theme.headingFontSize - 4,
      theme.bodyFontSize
    )}px;line-height:1.6;letter-spacing:0;font-weight:500;opacity:0.88;`,
    paragraphStyle: `margin:18px 0 0;padding:8px 0;color:${theme.bodyColor};font-size:${theme.bodyFontSize}px;line-height:${theme.bodyLineHeight};text-align:justify;`,
    quoteStyle: `margin:20px 0 12px;padding:10px 14px;border-left:3px solid ${theme.accentColor};background:${theme.blockBg};color:${theme.accentColor};font-size:${theme.quoteFontSize}px;line-height:${theme.bodyLineHeight};border-radius:0 8px 8px 0;`,
    noteStyle: `margin:18px 0 0;padding:10px 12px;border:1px solid #ECEAE3;border-radius:8px;background:#FAF7F2;color:${theme.bodyColor};font-size:${Math.max(
      theme.bodyFontSize - 1,
      12
    )}px;line-height:${theme.bodyLineHeight};`,
    eyebrowStyle: `margin:18px 0 8px;color:${theme.accentColor};font-size:11.5px;letter-spacing:0.14em;`,
    figcaptionStyle: `margin-top:8px;color:${theme.metaColor};font-size:10.5px;line-height:1.6;text-align:center;`,
  };
}

function getTextDensity(node: HTMLElement) {
  return (node.textContent || "").replace(/\s+/g, "").length;
}

function findFirstStyledNode(root: HTMLElement, selectors: string[]) {
  for (const selector of selectors) {
    const node = root.querySelector<HTMLElement>(selector);
    if (node?.textContent?.trim()) return node;
  }
  return null;
}

function findLargestTextNode(nodes: HTMLElement[], options?: { preferShort?: boolean }) {
  const filtered = nodes.filter((node) => node.textContent?.trim());
  if (options?.preferShort) {
    const shortNodes = filtered.filter((node) => getTextDensity(node) <= 36);
    if (shortNodes.length) {
      return shortNodes.sort((a, b) => scoreStyledNode(b) - scoreStyledNode(a))[0];
    }
  }
  return filtered.sort((a, b) => getTextDensity(b) - getTextDensity(a))[0] ?? null;
}

function findHeadingLikeNode(nodes: HTMLElement[]) {
  return (
    nodes
      .filter((node) => {
        const textLength = getTextDensity(node);
        const fontSize = parsePixel(getInlineCssValue(node, "font-size"), 0);
        const weight = getInlineCssValue(node, "font-weight");
        return (
          textLength > 0 &&
          textLength <= 40 &&
          (fontSize >= 16 || /bold|[5-9]00/i.test(weight))
        );
      })
      .sort((a, b) => scoreStyledNode(b) - scoreStyledNode(a))[0] ?? null
  );
}

function rankVisualHeadingNodes(nodes: HTMLElement[]) {
  const ranked = nodes
    .filter((node) => {
      const textLength = getTextDensity(node);
      if (textLength === 0 || textLength > 48) return false;
      const fontSize = parsePixel(getInlineCssValue(node, "font-size"), 0);
      const weight = getInlineCssValue(node, "font-weight");
      return fontSize >= 15 || /bold|[5-9]00/i.test(weight);
    })
    .sort((a, b) => {
      const aFont = parsePixel(getInlineCssValue(a, "font-size"), 0);
      const bFont = parsePixel(getInlineCssValue(b, "font-size"), 0);
      if (bFont !== aFont) return bFont - aFont;
      return scoreStyledNode(b) - scoreStyledNode(a);
    });

  return ranked.filter((node, index) => {
    const text = node.textContent?.trim();
    return text && ranked.findIndex((item) => item.textContent?.trim() === text) === index;
  });
}

function findParagraphLikeNode(
  nodes: HTMLElement[],
  headingNode: HTMLElement | null,
  titleNode: HTMLElement | null
) {
  return (
    nodes
      .filter((node) => {
        const textLength = getTextDensity(node);
        return (
          node !== headingNode &&
          node !== titleNode &&
          textLength >= 28 &&
          isPlainParagraphCandidate(node)
        );
      })
      .sort((a, b) => {
        const aTagScore = a.tagName.toLowerCase() === "p" ? 1 : 0;
        const bTagScore = b.tagName.toLowerCase() === "p" ? 1 : 0;
        if (bTagScore !== aTagScore) return bTagScore - aTagScore;
        return getTextDensity(b) - getTextDensity(a);
      })[0] ?? null
  );
}

function isPlainParagraphCandidate(node: HTMLElement) {
  const tag = node.tagName.toLowerCase();
  const style = collectStyleChain(node);
  const hasNestedBlocks = Boolean(
    node.querySelector("p,section,blockquote,h1,h2,h3,ol,ul")
  );
  const background = getInlineCssValue(node, "background") ||
    getInlineCssValue(node, "background-color");

  if (tag === "blockquote") return false;
  if (node.closest("blockquote")) return false;
  if (hasNestedBlocks) return false;
  if (/border-left|blockquote|quote/i.test(style)) return false;
  if (background && !/^(transparent|rgba?\(0,\s*0,\s*0,\s*0\)|none)$/i.test(background)) {
    return false;
  }

  return tag === "p" || tag === "span" || tag === "div" || tag === "section";
}

function findQuoteLikeNode(nodes: HTMLElement[]) {
  return (
    nodes.find((node) => node.tagName.toLowerCase() === "blockquote") ??
    nodes.find((node) => {
      const style = node.getAttribute("style") || "";
      return /border-left|background|blockquote|quote/i.test(style);
    }) ??
    null
  );
}

function findMetaLikeNode(nodes: HTMLElement[], paragraphNode: HTMLElement | null) {
  return (
    nodes
      .filter((node) => node !== paragraphNode && getTextDensity(node) > 0)
      .sort((a, b) => {
        const aSize = parsePixel(getInlineCssValue(a, "font-size"), 99);
        const bSize = parsePixel(getInlineCssValue(b, "font-size"), 99);
        return aSize - bSize;
      })[0] ?? null
  );
}

function scoreStyledNode(node: HTMLElement) {
  const style = node.getAttribute("style") || "";
  const fontSize = parsePixel(getInlineCssValue(node, "font-size"), 0);
  return style.length + fontSize * 3 + Math.min(getTextDensity(node), 80);
}

function collectStyleChain(node: HTMLElement | null) {
  if (!node) return "";
  const chain: string[] = [];
  let current: HTMLElement | null = node;
  while (current && current.tagName.toLowerCase() !== "body") {
    const style = current.getAttribute("style");
    if (style) chain.unshift(style);
    current = current.parentElement;
  }
  return chain.join(";");
}

function pickContainerStyle(node: HTMLElement | null) {
  if (!node) return "";
  const style = parseStyleString(collectStyleChain(node));
  return styleToString({
    color: style.color,
    background: style.background || style["background-color"] || "#ffffff",
    "font-family": style["font-family"],
    "font-size": style["font-size"],
    "line-height": style["line-height"],
    "letter-spacing": style["letter-spacing"],
    padding: style.padding,
  });
}

function mergeStyleStrings(base: string, override: string) {
  return styleToString({
    ...parseStyleString(base),
    ...parseStyleString(override),
  });
}

function normalizeHeadingStyle(style: string, level: "primary" | "secondary") {
  const parsed = parseStyleString(style);
  const baseSize = parsePixel(parsed["font-size"], level === "primary" ? 18 : 16);
  if (level === "primary") {
    return styleToString({
      ...parsed,
      "font-size": `${Math.max(baseSize, 17)}px`,
      "font-weight": parsed["font-weight"] || "600",
      "margin-bottom": parsed["margin-bottom"] || "15px",
    });
  }

  return styleToString({
    ...parsed,
    "font-size": `${Math.max(baseSize - 2, 14)}px`,
    "font-weight": parsed["font-weight"] || "500",
    "margin-bottom": parsed["margin-bottom"] || "10px",
    opacity: parsed.opacity || "0.92",
  });
}

function normalizeTertiaryHeadingStyle(style: string) {
  const parsed = parseStyleString(style);
  const baseSize = parsePixel(parsed["font-size"], 16);
  return styleToString({
    ...parsed,
    "font-size": `${Math.max(baseSize - 4, 13)}px`,
    "font-weight": parsed["font-weight"] || "500",
    "margin-bottom": parsed["margin-bottom"] || "8px",
    opacity: parsed.opacity || "0.84",
  });
}

function parseStyleString(style: string) {
  return style
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, item) => {
      const colonIndex = item.indexOf(":");
      if (colonIndex === -1) return acc;
      const property = item.slice(0, colonIndex).trim().toLowerCase();
      const value = item.slice(colonIndex + 1).trim();
      if (!property || !value) return acc;
      if (/^(-webkit-|-moz-|-ms-)/.test(property)) return acc;
      acc[property] = value;
      return acc;
    }, {});
}

function styleToString(style: Record<string, string | undefined>) {
  return Object.entries(style)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([property, value]) => `${property}:${value}`)
    .join(";");
}

function sanitizePreviewHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script,style,iframe,object,embed,link,meta")
    .forEach((node) => node.remove());
  doc.body.querySelectorAll<HTMLElement>("*").forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
        return;
      }
      if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        node.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function plainTextToPreviewHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(
      (chunk) =>
        `<p style="margin:16px 0;color:#393D49;font-size:15px;line-height:1.8;text-align:justify;">${escapeHtml(
          chunk
        ).replace(/\n/g, "<br />")}</p>`
    )
    .join("");
}

function extractSampleBlockPreviews(
  importedHtml: string,
  importedText: string,
  mapping: MappingMode,
  template: WechatStyleTemplate
): SampleBlockPreview[] {
  if (!importedHtml) {
    return importedText
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((text, index) => ({
        id: `text-${index}`,
        role: detectPlainTextSampleRole(text, mapping),
        label: sampleRoleLabel(detectPlainTextSampleRole(text, mapping)),
        text: stripInlineMarkdown(text).replace(/^#{1,6}\s+/, "").replace(/^>\s*/, ""),
        style: template.paragraphStyle,
      }));
  }

  const doc = new DOMParser().parseFromString(sanitizePreviewHtml(importedHtml), "text/html");
  const headingSelectors = detectRichTextHeadingSelectorMap(doc.body);
  const nodes = Array.from(
    doc.body.querySelectorAll<HTMLElement>("h1,h2,h3,p,blockquote,li")
  ).filter((node) => {
    const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
    return text.length >= 2 && !node.querySelector("h1,h2,h3,p,blockquote,li");
  });
  const boldNodes = Array.from(doc.body.querySelectorAll<HTMLElement>("strong,b,[style]"))
    .filter((node) => {
      const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
      if (text.length < 4) return false;
      if (node.closest("h1,h2,h3,blockquote")) return false;
      return isBoldSampleNode(node);
    });

  const blocks: SampleBlockPreview[] = [];
  const seen = new Set<string>();

  nodes.forEach((node, index) => {
    const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
    const role = detectHtmlSampleRole(node, headingSelectors);
    const styleNode = findSampleStyleNode(node);
    const dedupeKey = `${role}:${text}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    blocks.push({
      id: `html-${index}`,
      role,
      label: sampleRoleLabel(role),
      text: text.length > 72 ? `${text.slice(0, 72)}...` : text,
      style: collectStyleChain(styleNode),
    });
  });

  boldNodes.forEach((node, index) => {
    const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
    const dedupeKey = `bold:${text}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    blocks.push({
      id: `bold-${index}`,
      role: "bold",
      label: sampleRoleLabel("bold"),
      text: text.length > 72 ? `${text.slice(0, 72)}...` : text,
      style: collectStyleChain(node),
    });
  });

  return limitSampleBlocks(blocks, 18);
}

function detectPlainTextSampleRole(text: string, mapping: MappingMode): SampleBlockRole {
  const heading = text.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    return mapMarkdownHeadingLevel(heading[1].length, mapping) === "primary"
      ? "primary"
      : "secondary";
  }
  if (/^>\s*/.test(text)) return "quote";
  if (/^\*\*[^*]+\*\*$/.test(text)) return "bold";
  return "body";
}

function detectHtmlSampleRole(
  node: HTMLElement,
  headingSelectors: { primary: string; secondary: string }
): SampleBlockRole {
  const tag = node.tagName.toLowerCase();
  const textLength = getTextDensity(node);

  if (tag === "blockquote" || node.closest("blockquote")) return "quote";
  if (tag === headingSelectors.primary) return "primary";
  if (tag === headingSelectors.secondary) return "secondary";
  if (tag === "h1" || tag === "h2" || tag === "h3") return "secondary";
  if (tag === "p" && node.querySelector("strong,b") && textLength <= 120) return "bold";
  return "body";
}

function isSectionHeadingText(text: string) {
  return /^([一二三四五六七八九十]+、|\d+[.、])/.test(text.trim());
}

function isBoldSampleNode(node: HTMLElement) {
  const tag = node.tagName.toLowerCase();
  const style = node.getAttribute("style") || "";
  const weight = getInlineCssValue(node, "font-weight");
  return tag === "strong" || tag === "b" || /bold|[6-9]00/i.test(`${style};${weight}`);
}

function limitSampleBlocks(blocks: SampleBlockPreview[], limit: number) {
  const requiredRoles: SampleBlockRole[] = ["primary", "secondary", "body", "quote", "bold"];
  const selected: SampleBlockPreview[] = [];
  const selectedIds = new Set<string>();

  requiredRoles.forEach((role) => {
    const block = blocks.find((item) => item.role === role);
    if (!block || selectedIds.has(block.id)) return;
    selected.push(block);
    selectedIds.add(block.id);
  });

  blocks.forEach((block) => {
    if (selected.length >= limit) return;
    if (selectedIds.has(block.id)) return;
    selected.push(block);
    selectedIds.add(block.id);
  });

  return selected.sort((a, b) => {
    const aIndex = blocks.findIndex((item) => item.id === a.id);
    const bIndex = blocks.findIndex((item) => item.id === b.id);
    return aIndex - bIndex;
  });
}

function findSampleStyleNode(node: HTMLElement | null) {
  if (!node) return null;
  const nodeText = node.textContent?.replace(/\s+/g, " ").trim() || "";
  const styledDescendants = Array.from(node.querySelectorAll<HTMLElement>("[style]"))
    .filter((item) => {
      const text = item.textContent?.replace(/\s+/g, " ").trim() || "";
      return text && (text === nodeText || nodeText.includes(text));
    })
    .sort((a, b) => scoreStyledNode(b) - scoreStyledNode(a));

  return styledDescendants[0] ?? node;
}

function sampleRoleLabel(role: SampleBlockRole) {
  const labels: Record<SampleBlockRole, string> = {
    primary: "一级标题",
    secondary: "二级标题",
    body: "正文段落",
    bold: "加粗正文",
    quote: "引用块",
    meta: "辅助信息",
  };
  return labels[role];
}

function sampleBlockStyleForRole(role: SampleBlockRole, theme: WechatTheme) {
  const base = {
    color: theme.bodyColor,
    fontSize: theme.bodyFontSize,
    lineHeight: theme.bodyLineHeight,
  };

  if (role === "primary") {
    return {
      ...base,
      color: theme.accentColor,
      fontSize: theme.headingFontSize,
      fontWeight: 600,
    };
  }
  if (role === "secondary") {
    return {
      ...base,
      color: theme.accentColor,
      fontSize: Math.max(theme.headingFontSize - 2, theme.bodyFontSize),
      fontWeight: 600,
    };
  }
  if (role === "quote") {
    return {
      ...base,
      color: theme.accentColor,
      fontSize: theme.quoteFontSize,
      background: theme.blockBg,
      borderLeft: `3px solid ${theme.accentColor}`,
      padding: "10px 12px",
    };
  }
  if (role === "bold") {
    return {
      ...base,
      fontWeight: 700,
    };
  }
  if (role === "meta") {
    return {
      ...base,
      color: theme.metaColor,
      fontSize: 11,
      lineHeight: 1.6,
    };
  }
  return base;
}

function parseReactStyle(style: string): CSSProperties {
  return Object.entries(parseStyleString(style)).reduce<CSSProperties>(
    (acc, [property, value]) => {
      const camelProperty = property.replace(/-([a-z])/g, (_, char: string) =>
        char.toUpperCase()
      );
      return { ...acc, [camelProperty]: value };
    },
    {}
  );
}

function getInlineCssValue(node: HTMLElement, property: string) {
  const inline = node.style.getPropertyValue(property);
  if (inline) return inline.trim();
  const style = node.getAttribute("style") || "";
  const escaped = property.replace("-", "\\-");
  return new RegExp(`${escaped}\\s*:\\s*([^;]+)`, "i")
    .exec(style)?.[1]
    ?.trim();
}

function firstCssValue(nodes: HTMLElement[], property: string) {
  for (const node of nodes) {
    const value = getInlineCssValue(node, property);
    if (value) return value;
  }
  return "";
}

function formatCssValue(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\s*px\b/i, " px");
}

function formatSavedAt(isoString: string) {
  const date = new Date(isoString);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function copyWechatArticleToClipboard(html: string, plainText: string) {
  try {
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
      return;
    }
  } catch {
    // Fall through to the selection-based copy path.
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plainText);
    return;
  }

  throw new Error("Clipboard unavailable");
}

function copyWechatArticleWithCopyEvent(html: string, plainText: string) {
  let copied = false;
  const handleCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData("text/html", html);
    event.clipboardData.setData("text/plain", plainText);
    event.preventDefault();
    copied = true;
  };

  document.addEventListener("copy", handleCopy, { once: true });
  const marker = document.createElement("div");
  try {
    marker.setAttribute("contenteditable", "true");
    marker.innerHTML = html || escapeHtml(plainText || " ");
    marker.style.position = "fixed";
    marker.style.left = "-9999px";
    marker.style.top = "0";
    marker.style.width = "1px";
    marker.style.height = "1px";
    marker.style.opacity = "0";
    document.body.appendChild(marker);

    window.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(marker);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const commandSucceeded = document.execCommand("copy");
    return copied && commandSucceeded;
  } finally {
    document.removeEventListener("copy", handleCopy);
    window.getSelection()?.removeAllRanges();
    if (marker.parentNode) {
      document.body.removeChild(marker);
    }
  }
}

function buildWechatArticleHtml(
  template: WechatStyleTemplate,
  title: string,
  blocks: WechatArticleBlock[],
  coverImageUrl: string | null,
  inlineImageMap: Map<string, string> | null
) {
  const imageMap = inlineImageMap ?? new Map<string, string>();
  const coverHtml = coverImageUrl
    ? `
      <figure style="margin:18px 0 22px;text-align:center;">
        <img src="${escapeHtml(coverImageUrl)}" alt="公众号封面预览" style="display:block;width:100%;height:auto;margin:0 auto;border-radius:8px;object-fit:cover;background:#f0f3fa;" />
      </figure>
    `
    : "";
  const blocksHtml = blocks.map((block) => {
    if (block.type === "paragraph") {
      return `
        <p style="${template.paragraphStyle}">
          ${inlineMarkdownToHtml(block.text)}
        </p>
      `;
    }

    if (block.type === "quote") {
      return `
        <blockquote style="${template.quoteStyle}">
          ${inlineMarkdownToHtml(block.text)}
        </blockquote>
      `;
    }

    if (block.type === "list") {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map(
          (item) => `
            <li style="margin:0 0 8px;padding-left:2px;">
              ${inlineMarkdownToHtml(item)}
            </li>
          `
        )
        .join("");
      return `
        <${tag} style="${template.paragraphStyle};padding-left:1.35em;">
          ${items}
        </${tag}>
      `;
    }

    if (block.type === "image") {
      const inlineImageUrl = block.sectionKey
        ? imageMap.get(block.sectionKey) ?? null
        : null;
      return `
        <figure style="margin:26px 0 12px;text-align:center;">
          ${
            inlineImageUrl
              ? `<img src="${escapeHtml(inlineImageUrl)}" alt="${escapeHtml(block.label)}" style="display:block;width:100%;max-width:720px;height:auto;margin:0 auto;border-radius:8px;object-fit:cover;background:#f0f3fa;" />`
              : `<div style="aspect-ratio:16/9;border-radius:8px;background:linear-gradient(160deg,#DCE5EE 0%,#B9C7D5 100%);"></div>`
          }
          <figcaption style="${template.figcaptionStyle}">
            ${escapeHtml(block.label)}
          </figcaption>
        </figure>
      `;
    }

    if (block.type === "heading") {
      const headingStyle =
        block.level === "primary"
          ? template.primaryHeadingStyle
          : block.level === "secondary"
            ? template.secondaryHeadingStyle
            : template.tertiaryHeadingStyle;
      return `
      <section style="margin-top:34px;">
        <${block.level === "tertiary" ? "h4" : "h2"} style="${headingStyle}">
          ${escapeHtml(block.title)}
        </${block.level === "tertiary" ? "h4" : "h2"}>
        ${
          block.body
            ? `<p style="${template.paragraphStyle}">
              ${inlineMarkdownToHtml(block.body)}
            </p>`
            : ""
        }
      </section>
    `;
    }

    return "";
  }).join("");

  return `
    <section data-tool="moyujing-wechat-article" style="${template.containerStyle}">
      <h1 style="${template.titleStyle}">
        ${escapeHtml(title)}
      </h1>
      ${coverHtml}
      ${blocksHtml}
    </section>
  `.trim();
}

function deriveWechatTheme(
  importedHtml: string,
  summary: {
    bodyFontSize: string;
    primaryHeadingFontSize: string;
    secondaryHeadingFontSize: string;
    lineHeight: string;
  }
): WechatTheme {
  if (!importedHtml) {
    return {
      ...DEFAULT_THEME,
      bodyFontSize: parsePixel(summary.bodyFontSize, DEFAULT_THEME.bodyFontSize),
      headingFontSize: parsePixel(
        summary.primaryHeadingFontSize,
        DEFAULT_THEME.headingFontSize
      ),
      bodyLineHeight: parseFloat(summary.lineHeight) || DEFAULT_THEME.bodyLineHeight,
      quoteFontSize: parsePixel(summary.bodyFontSize, DEFAULT_THEME.quoteFontSize),
    };
  }

  const doc = new DOMParser().parseFromString(importedHtml, "text/html");
  const styledNodes = Array.from(doc.body.querySelectorAll<HTMLElement>("[style]"));
  const headingSelectors = detectRichTextHeadingSelectorMap(doc.body);
  const primaryHeadingNodes = Array.from(
    doc.body.querySelectorAll<HTMLElement>(headingSelectors.primary)
  );
  const bodyNodes = Array.from(
    doc.body.querySelectorAll<HTMLElement>("p,section,span,div")
  ).filter((node) => node.textContent?.trim());
  const colors = collectMatches(styledNodes, /(?:^|;)color\s*:\s*([^;]+)/i);
  const backgrounds = collectMatches(styledNodes, /background(?:-color)?\s*:\s*([^;]+)/i);
  const bodyFontValue = firstCssValue(bodyNodes, "font-size");
  const headingFontValue = firstCssValue(primaryHeadingNodes, "font-size");
  const bodyLineHeightValue = firstCssValue(bodyNodes, "line-height");

  const bodyColor = pickCssColor(colors[0]) || DEFAULT_THEME.bodyColor;
  const accentColor =
    pickCssColor(colors.find((item) => item !== bodyColor)) || DEFAULT_THEME.accentColor;
  const blockBg = pickCssColor(backgrounds[0]) || DEFAULT_THEME.blockBg;
  const bodyFontSize =
    parsePixel(bodyFontValue || summary.bodyFontSize, DEFAULT_THEME.bodyFontSize);
  const headingFontSize =
    parsePixel(
      headingFontValue || summary.primaryHeadingFontSize,
      DEFAULT_THEME.headingFontSize
    );
  const bodyLineHeight =
    parseLineHeight(bodyLineHeightValue || summary.lineHeight, DEFAULT_THEME.bodyLineHeight);

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
