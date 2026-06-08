import { FileText, Clipboard, CheckCircle2, RefreshCw, Eraser, Sparkles, ChevronDown, FileType2, Pin, X, Upload, Download, Import } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useEffect, useRef, useState } from "react";
import type { InputMode, StyleAssetFit, StyleSelectionKey, WorkspaceData } from "../types";

interface LeftPanelProps {
  data: WorkspaceData;
  inputMode: InputMode;
  textModeTitle: string;
  textModeBody: string;
  setInputMode: (mode: InputMode) => void;
  onTextModeTitleChange: (value: string) => void;
  onTextModeBodyChange: (value: string) => void;
  onImportPlainText: () => Promise<void>;
  onImportMarkdown: (file: File) => Promise<void>;
  onGenerateAll: () => Promise<void>;
  onGenerateLayout: () => Promise<void>;
  onSetOutputToggle: (key: "knowledgeCards" | "wechatCover" | "wechatShareCover" | "xiaohongshuCover", enabled: boolean) => void;
  onSetStyleSelection: (key: StyleSelectionKey, index: number) => void;
  onSetCardSize: (nextCardSize: WorkspaceData["cardSize"]) => void;
  onUpdateWechatLayoutTheme: (index: number, patch: Partial<WorkspaceData["layoutThemes"][number]>) => void;
  onExportWechatLayoutTheme: (index: number) => Promise<void>;
  onImportWechatLayoutTheme: (file: File) => Promise<void>;
  isTablet: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function LeftPanel({
  data,
  inputMode,
  textModeTitle,
  textModeBody,
  setInputMode,
  onTextModeTitleChange,
  onTextModeBodyChange,
  onImportPlainText,
  onImportMarkdown,
  onGenerateAll,
  onGenerateLayout,
  onSetOutputToggle,
  onSetStyleSelection,
  onSetCardSize,
  onUpdateWechatLayoutTheme,
  onExportWechatLayoutTheme,
  onImportWechatLayoutTheme,
  isTablet,
  isOpen,
  onClose,
}: LeftPanelProps) {
  const [widthInput, setWidthInput] = useState(String(data.cardSize.width));
  const [heightInput, setHeightInput] = useState(String(data.cardSize.height));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const layoutThemeImportRef = useRef<HTMLInputElement | null>(null);
  const isGenerating = [...data.knowledgeCards, ...data.wechatInlineImages, ...data.covers].some((item) => item.state === "processing");
  const styleTargets: Array<{ key: StyleSelectionKey; label: string; hint: string; toggleKey?: "knowledgeCards" | "wechatCover" | "wechatShareCover" | "xiaohongshuCover" }> = [
    { key: "knowledgeCards", label: "知识卡片", hint: "小红书 / 观点卡", toggleKey: "knowledgeCards" },
    { key: "wechatInlineImages", label: "正文配图", hint: "公众号中段插图" },
    { key: "wechatLayout", label: "公众号排版", hint: "正文阅读稿样式" },
    { key: "wechatCover", label: "公众号封面", hint: "列表大图 + 转发小图", toggleKey: "wechatCover" },
    { key: "xiaohongshuCover", label: "小红书封面", hint: "笔记首图", toggleKey: "xiaohongshuCover" },
  ];
  const ratioPresets: Record<string, { width: number; height: number }> = {
    "3:4": { width: 1536, height: 2048 },
    "4:3": { width: 2048, height: 1536 },
    "1:1": { width: 1536, height: 1536 },
    "9:16": { width: 1080, height: 1920 },
  };
  const getThemePalette = (key: StyleSelectionKey) =>
    key === "wechatLayout"
      ? data.layoutThemes[data.styleSelections.wechatLayout]?.previewPalette ?? []
      : data.styleAssets[data.styleSelections[key]]?.palette ?? [];
  const getThemeOptions = (key: StyleSelectionKey) =>
    key === "wechatLayout" ? data.layoutThemes : data.styleAssets;
  const getSelectedStyleAsset = (key: Exclude<StyleSelectionKey, "wechatLayout">) =>
    data.styleAssets[data.styleSelections[key]] ?? data.styleAssets[0];
  const selectedLayoutTheme = data.layoutThemes[data.styleSelections.wechatLayout];
  const fitLabelMap: Record<StyleAssetFit, string> = {
    knowledgeCards: "知识卡片",
    wechatInlineImages: "正文配图",
    wechatCover: "公众号封面",
    wechatShareCover: "公众号转发封面",
    xiaohongshuCover: "小红书封面",
  };

  const panelClassName = isTablet
    ? `absolute inset-y-0 left-0 z-30 w-[min(360px,92vw)] bg-card shadow-2xl transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"}`
    : "w-[minmax(320px,360px)] max-w-[360px] min-w-[320px] shrink-0 border-r border-border bg-card/40 flex flex-col overflow-hidden";

  useEffect(() => {
    setWidthInput(String(data.cardSize.width));
    setHeightInput(String(data.cardSize.height));
  }, [data.cardSize.width, data.cardSize.height]);

  return (
    <>
      {isTablet && isOpen && <button className="absolute inset-0 z-20 bg-black/20" onClick={onClose} aria-label="关闭输入面板" />}
      <aside className={panelClassName}>
      <div className="px-5 pt-4 pb-3 border-b border-border/70">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-muted-foreground tracking-[0.2em]">01</span>
            <h2 className="text-[13.5px] tracking-wide" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>原稿与生成设置</h2>
          </div>
          {isTablet && (
            <button className="text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="关闭">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Mode switch */}
        <div className="bg-secondary/70 rounded-md p-1 flex gap-1">
          <button
            onClick={() => setInputMode("md")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] py-1.5 rounded transition-all ${inputMode === "md" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <FileType2 className="w-3.5 h-3.5" /> Markdown
          </button>
          <button
            onClick={() => setInputMode("text")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] py-1.5 rounded transition-all ${inputMode === "text" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <Clipboard className="w-3.5 h-3.5" /> 粘贴文本
          </button>
        </div>

        {inputMode === "md" ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border border-dashed border-border bg-card/70 hover:bg-card transition-colors text-left px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02),0_4px_16px_-12px_rgba(31,58,54,0.18)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-secondary/60 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-primary/80" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px]" style={{ fontWeight: 500 }}>上传 Markdown 文档</div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">支持 `.md`，导入后自动识别标题和结构</div>
                </div>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown,text/plain"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await onImportMarkdown(file);
                event.currentTarget.value = "";
              }}
            />

            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.02),0_4px_16px_-12px_rgba(31,58,54,0.18)]">
            <div className="p-4 bg-gradient-to-br from-[#efe9da]/70 via-card to-card">
              <div className="flex items-start gap-3">
                <div className="w-9 h-11 rounded-sm bg-card border border-border flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] truncate" style={{ fontWeight: 500 }}>{data.article.fileName}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-700/85 shrink-0" />
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">{data.article.updatedAt} · {data.article.wordCount.toLocaleString()} 字</div>
                  <div className="text-[11.5px] text-foreground/85 mt-1.5 leading-snug line-clamp-2" style={{ fontFamily: "var(--font-serif)" }}>
                    {data.article.title}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{data.parsedMarkdown.structureTags.join(" · ")}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary/85 hover:text-primary inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> 重传
              </button>
            </div>
          </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Input value={textModeTitle} onChange={(event) => onTextModeTitleChange(event.target.value)} placeholder="文章标题" className="bg-input-background border-border h-9" />
            <textarea
              value={textModeBody}
              onChange={(event) => onTextModeBodyChange(event.target.value)}
              className="w-full h-40 rounded-md bg-input-background border border-border px-3 py-2 text-[12.5px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
              placeholder="将正文粘贴到此处。纯文本模式只负责拆图与出图，不生成公众号排版。"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10.5px] text-muted-foreground">纯文本模式不会识别小标题、引用等结构，也不会进入公众号排版链路。</p>
              <Button
                type="button"
                size="sm"
                onClick={() => void onImportPlainText()}
                disabled={!textModeTitle.trim() || !textModeBody.trim()}
                className="shrink-0 h-8"
              >
                应用文本
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div className="rounded-lg border border-border bg-card/70 overflow-hidden">
          <div className="px-3.5 py-3 border-b border-border/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-foreground/85" style={{ fontWeight: 500 }}>输出配置</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">按输出类型分别控制开关、风格和尺寸，避免在不同面板之间跳转。</div>
              </div>
              <span className="flex items-center gap-2 text-[12.5px] shrink-0">
                <span className="w-5 h-5 rounded-sm bg-primary/90 text-primary-foreground flex items-center justify-center text-[10px]" style={{ fontFamily: "var(--font-serif)" }}>墨</span>
                <span style={{ fontWeight: 500 }}>{selectedLayoutTheme?.accountName ?? "墨予镜"}</span>
              </span>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {styleTargets.map((target) => {
              const toggle = target.toggleKey ? data.outputToggles.find((item) => item.key === target.toggleKey) : null;

              return (
                <section key={target.key} className="px-3.5 py-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[12px]" style={{ fontWeight: 600 }}>{target.label}</div>
                        {toggle ? <span className="text-[10px] text-muted-foreground">{toggle.hint}</span> : null}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{target.hint}</div>
                    </div>
                    {toggle ? (
                      <Switch
                        checked={toggle.enabled}
                        onCheckedChange={(checked) => onSetOutputToggle(toggle.key, checked)}
                      />
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">仅排版</span>
                    )}
                  </div>

                  <div className="rounded-md border border-border/70 bg-secondary/20 px-2.5 py-2.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10.5px] text-muted-foreground">风格方案</div>
                      <div className="flex shrink-0 gap-1">
                        {getThemePalette(target.key).slice(0, 3).map((color) => (
                          <span key={`${target.key}-${color}`} className="w-3 h-3 rounded-full border border-border/70" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                    <Select
                      value={String(data.styleSelections[target.key])}
                      onValueChange={(value) => onSetStyleSelection(target.key, Number(value))}
                    >
                      <SelectTrigger className="h-9 bg-card border-border text-[11.5px]">
                        <SelectValue placeholder="选择风格" />
                      </SelectTrigger>
                      <SelectContent>
                        {getThemeOptions(target.key).map((style, index) => (
                          <SelectItem key={`${target.key}-${style.name}`} value={String(index)}>
                            {"fit" in style
                              ? `${style.name} · ${style.fit
                                  .map((fitKey) => fitLabelMap[fitKey])
                                  .join(" / ")}`
                              : style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {target.key !== "wechatLayout" ? (
                      <div className="space-y-2 rounded-md border border-border/70 bg-card px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] text-muted-foreground">参考图样本</span>
                          <span className="text-[10px] text-muted-foreground">
                            {getSelectedStyleAsset(target.key).referenceImages.length} 张
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {getSelectedStyleAsset(target.key).referenceImages.slice(0, 4).map((fileName) => (
                            <div
                              key={`${target.key}-${fileName}`}
                              className="aspect-[3/4] overflow-hidden rounded-sm border border-border/60 bg-secondary/30"
                            >
                              <img
                                src={`/风格库/${fileName}`}
                                alt={fileName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] leading-relaxed text-muted-foreground">
                          {getSelectedStyleAsset(target.key).promptBase}
                        </div>
                      </div>
                    ) : null}

                    {target.key === "knowledgeCards" ? (
                      <div className="pt-1 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] text-muted-foreground">卡片尺寸</span>
                          <span className="text-[10px] text-muted-foreground">{data.cardSize.ratio} · {data.cardSize.width} × {data.cardSize.height}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 bg-card p-1 rounded">
                          {data.cardSize.ratioOptions.map(r => (
                            <button
                              key={r}
                              onClick={() => {
                                const preset = ratioPresets[r] ?? { width: data.cardSize.width, height: data.cardSize.height };
                                setWidthInput(String(preset.width));
                                setHeightInput(String(preset.height));
                                onSetCardSize({
                                  ...data.cardSize,
                                  ratio: r,
                                  width: preset.width,
                                  height: preset.height,
                                });
                              }}
                              className={`text-[11px] py-1 rounded transition-all ${data.cardSize.ratio === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >{r}</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 relative">
                            <Input
                              value={widthInput}
                              onChange={(event) => setWidthInput(event.target.value)}
                              onBlur={() => {
                                const width = Number(widthInput);
                                if (!Number.isFinite(width) || width <= 0) {
                                  setWidthInput(String(data.cardSize.width));
                                  return;
                                }
                                onSetCardSize({
                                  ...data.cardSize,
                                  width,
                                });
                              }}
                              className="bg-card border-border pr-7 text-[11.5px] h-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">W</span>
                          </div>
                          <span className="text-muted-foreground/70 text-[11px]">×</span>
                          <div className="flex-1 relative">
                            <Input
                              value={heightInput}
                              onChange={(event) => setHeightInput(event.target.value)}
                              onBlur={() => {
                                const height = Number(heightInput);
                                if (!Number.isFinite(height) || height <= 0) {
                                  setHeightInput(String(data.cardSize.height));
                                  return;
                                }
                                onSetCardSize({
                                  ...data.cardSize,
                                  height,
                                });
                              }}
                              className="bg-card border-border pr-7 text-[11.5px] h-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">H</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground">尺寸变更只影响知识卡片，现有卡片会标记为需重生成。</div>
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* Style asset library — slimmer */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[10.5px] text-muted-foreground tracking-[0.15em]">风格资产</span>
              <span className="text-[10px] text-muted-foreground/70">{data.styleAssets.length} 套</span>
            </div>
            <button className="text-[10.5px] text-muted-foreground hover:text-foreground">管理</button>
          </div>
          <div className="rounded-lg border border-border bg-card/60 overflow-hidden divide-y divide-border/60">
            {data.styleAssets.map((s, i) => (
              <div
                key={i}
                className="w-full text-left flex items-center transition-colors hover:bg-secondary/30"
              >
                <div className="w-1 self-stretch bg-transparent"></div>
                <div className="w-11 h-11 shrink-0 flex flex-col my-2 ml-2.5 rounded-sm overflow-hidden" style={{ background: s.palette[0] }}>
                  <div className="flex-1 p-1.5 flex flex-col justify-between">
                    <div className="space-y-[3px]">
                      <div className="h-[3px] rounded-full w-6" style={{ background: s.palette[1], opacity: 0.85 }}></div>
                      <div className="h-[2px] rounded-full w-7" style={{ background: s.palette[1], opacity: 0.3 }}></div>
                    </div>
                    <div className="h-1 w-3 rounded-sm" style={{ background: s.palette[2] }}></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12px] truncate" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{s.name}</span>
                    {s.pinned && <Pin className="w-2.5 h-2.5 text-muted-foreground/70 shrink-0" />}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">{s.family} · {s.desc}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.fit.map((fitKey) => (
                      <span
                        key={`${s.name}-${fitKey}`}
                        className="rounded-full border border-border/70 bg-card px-1.5 py-0.5 text-[9.5px] text-muted-foreground"
                      >
                        {fitLabelMap[fitKey]}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1.5 flex gap-1 overflow-hidden">
                    {s.referenceImages.slice(0, 3).map((fileName) => (
                      <div
                        key={`${s.name}-${fileName}`}
                        className="h-9 w-7 shrink-0 overflow-hidden rounded-[4px] border border-border/60 bg-secondary/30"
                      >
                        <img
                          src={`/风格库/${fileName}`}
                          alt={fileName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                    {s.meta} · 参考图 {s.referenceImages.length} 张 · {s.mood.join(" / ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1.5 transition-colors">
            + 新建风格方案
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[10.5px] text-muted-foreground tracking-[0.15em]">排版主题</span>
              <span className="text-[10px] text-muted-foreground/70">{data.layoutThemes.length} 套</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="text-[10.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                onClick={() => layoutThemeImportRef.current?.click()}
              >
                <Import className="w-3 h-3" /> 导入
              </button>
              <button
                className="text-[10.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                onClick={() => void onExportWechatLayoutTheme(data.styleSelections.wechatLayout)}
              >
                <Download className="w-3 h-3" /> 导出
              </button>
            </div>
          </div>
          <input
            ref={layoutThemeImportRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await onImportWechatLayoutTheme(file);
              event.currentTarget.value = "";
            }}
          />
          <div className="rounded-lg border border-border bg-card/60 overflow-hidden divide-y divide-border/60">
            {data.layoutThemes.map((theme, i) => (
              <div
                key={i}
                className="w-full text-left flex items-center transition-colors hover:bg-secondary/30"
              >
                <div className="w-1 self-stretch bg-transparent"></div>
                <div className="w-11 h-11 shrink-0 flex flex-col my-2 ml-2.5 rounded-sm overflow-hidden border border-border/60" style={{ background: theme.previewPalette[0] }}>
                  <div className="flex-1 p-1.5 flex flex-col justify-between">
                    <div className="space-y-[3px]">
                      <div className="h-[3px] rounded-full w-6" style={{ background: theme.previewPalette[2], opacity: 0.92 }}></div>
                      <div className="h-[2px] rounded-full w-7" style={{ background: theme.previewPalette[3], opacity: 0.7 }}></div>
                    </div>
                    <div className="h-1.5 w-4 rounded-sm" style={{ background: theme.previewPalette[1], border: "1px solid rgba(0,0,0,0.06)" }}></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] truncate" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{theme.name}</span>
                    {theme.pinned && <Pin className="w-2.5 h-2.5 text-muted-foreground/70 shrink-0" />}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 truncate">{theme.desc} · {theme.meta}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1.5 transition-colors">
            + 新建排版主题
          </button>
        </div>

        {selectedLayoutTheme ? (
          <div className="rounded-lg border border-border bg-card/70 overflow-hidden">
            <div className="px-3.5 py-3 border-b border-border/60">
              <div className="text-[11px] text-foreground/85" style={{ fontWeight: 500 }}>当前排版主题编辑</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">先支持公众号名和核心配色，改完会立即刷新右侧阅读预览与导出 HTML。</div>
            </div>
            <div className="px-3.5 py-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10.5px] text-muted-foreground">公众号名称</label>
                <Input
                  value={selectedLayoutTheme.accountName}
                  onChange={(event) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { accountName: event.target.value })}
                  className="bg-card border-border h-8 text-[11.5px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] text-muted-foreground">结尾标题</label>
                <Input
                  value={selectedLayoutTheme.ctaTitle}
                  onChange={(event) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { ctaTitle: event.target.value })}
                  className="bg-card border-border h-8 text-[11.5px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] text-muted-foreground">结尾按钮文案</label>
                <Input
                  value={selectedLayoutTheme.ctaButtonText}
                  onChange={(event) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { ctaButtonText: event.target.value })}
                  className="bg-card border-border h-8 text-[11.5px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <ThemeColorField
                  label="外层底色"
                  value={selectedLayoutTheme.shellBg}
                  onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { shellBg: value, previewPalette: [value, selectedLayoutTheme.previewPalette[1], selectedLayoutTheme.previewPalette[2], selectedLayoutTheme.previewPalette[3]] })}
                />
                <ThemeColorField
                  label="正文底色"
                  value={selectedLayoutTheme.articleBg}
                  onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { articleBg: value, previewPalette: [selectedLayoutTheme.previewPalette[0], value, selectedLayoutTheme.previewPalette[2], selectedLayoutTheme.previewPalette[3]] })}
                />
                <ThemeColorField
                  label="标题颜色"
                  value={selectedLayoutTheme.headingColor}
                  onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { headingColor: value, titleColor: value, quoteBorder: value, ctaBg: value, previewPalette: [selectedLayoutTheme.previewPalette[0], selectedLayoutTheme.previewPalette[1], value, selectedLayoutTheme.previewPalette[3]] })}
                />
                <ThemeColorField
                  label="正文文字"
                  value={selectedLayoutTheme.bodyColor}
                  onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { bodyColor: value })}
                />
                <ThemeColorField
                  label="辅助文字"
                  value={selectedLayoutTheme.mutedColor}
                  onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { mutedColor: value, placeholderBorder: value, previewPalette: [selectedLayoutTheme.previewPalette[0], selectedLayoutTheme.previewPalette[1], selectedLayoutTheme.previewPalette[2], value] })}
                />
                <ThemeColorField
                  label="引用背景"
                  value={selectedLayoutTheme.quoteBg}
                  onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { quoteBg: value, placeholderBg: value })}
                />
              </div>

              <div className="pt-1 border-t border-border/60 space-y-2.5">
                <div className="text-[10.5px] text-muted-foreground">版式参数</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <ThemeNumberField
                    label="H2 字号"
                    value={selectedLayoutTheme.headingFontSize}
                    suffix="px"
                    min={16}
                    max={32}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { headingFontSize: value })}
                  />
                  <ThemeNumberField
                    label="段间距"
                    value={selectedLayoutTheme.paragraphSpacing}
                    suffix="px"
                    min={8}
                    max={32}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { paragraphSpacing: value })}
                  />
                  <ThemeNumberField
                    label="区块间距"
                    value={selectedLayoutTheme.sectionSpacing}
                    suffix="px"
                    min={16}
                    max={40}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { sectionSpacing: value })}
                  />
                  <ThemeNumberField
                    label="图片圆角"
                    value={selectedLayoutTheme.imageRadius}
                    suffix="px"
                    min={0}
                    max={24}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { imageRadius: value })}
                  />
                  <ThemeNumberField
                    label="引用圆角"
                    value={selectedLayoutTheme.quoteRadius}
                    suffix="px"
                    min={0}
                    max={24}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { quoteRadius: value })}
                  />
                  <ThemeNumberField
                    label="引用边线"
                    value={selectedLayoutTheme.quoteBorderWidth}
                    suffix="px"
                    min={1}
                    max={8}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { quoteBorderWidth: value })}
                  />
                  <ThemeNumberField
                    label="CTA 圆角"
                    value={selectedLayoutTheme.ctaRadius}
                    suffix="px"
                    min={0}
                    max={999}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { ctaRadius: value })}
                  />
                  <ThemeNumberField
                    label="首图下边距"
                    value={selectedLayoutTheme.coverBottomSpacing}
                    suffix="px"
                    min={0}
                    max={40}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { coverBottomSpacing: value })}
                  />
                  <ThemeNumberField
                    label="正文图间距"
                    value={selectedLayoutTheme.inlineImageSpacing}
                    suffix="px"
                    min={8}
                    max={40}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { inlineImageSpacing: value })}
                  />
                  <ThemeNumberField
                    label="引用块间距"
                    value={selectedLayoutTheme.quoteSpacing}
                    suffix="px"
                    min={8}
                    max={32}
                    onChange={(value) => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { quoteSpacing: value })}
                  />
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] text-muted-foreground">图注对齐</label>
                    <Select
                      value={selectedLayoutTheme.captionAlign}
                      onValueChange={(value: "left" | "center") => onUpdateWechatLayoutTheme(data.styleSelections.wechatLayout, { captionAlign: value })}
                    >
                      <SelectTrigger className="h-8 bg-card border-border text-[11.5px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">居中</SelectItem>
                        <SelectItem value="left">左对齐</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3.5 border-t border-border bg-card/80 shrink-0">
        <Button
          onClick={() => onGenerateAll()}
          disabled={isGenerating}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] disabled:opacity-60"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "生成中" : "生成全部"}
        </Button>
        <div className="mt-2 flex items-center justify-between text-[11.5px]">
          <button
            onClick={() => onGenerateLayout()}
            disabled={inputMode === "text"}
            className="text-foreground/85 hover:text-foreground px-1.5 py-1"
          >
            仅生成排版
          </button>
          <span className="text-border">·</span>
          <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-1">
            <Eraser className="w-3 h-3" /> 清空内容
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}

function ThemeColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10.5px] text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
        <input
          type="color"
          value={normalizeColor(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-6 w-6 rounded border border-border bg-transparent p-0"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 border-0 bg-transparent px-0 py-0 text-[11px] shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

function ThemeNumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10.5px] text-muted-foreground">{label}</label>
      <div className="relative">
        <Input
          type="number"
          value={String(value)}
          min={min}
          max={max}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            onChange(Math.max(min, Math.min(max, next)));
          }}
          className="bg-card border-border h-8 pr-9 text-[11.5px]"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function normalizeColor(value: string) {
  if (value.startsWith("#")) return value;
  const parts = value.match(/\d+/g)?.map(Number);
  if (!parts || parts.length < 3) return "#000000";
  return `#${parts.slice(0, 3).map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}
