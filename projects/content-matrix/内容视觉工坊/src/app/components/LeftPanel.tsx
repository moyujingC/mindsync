import { FileText, Clipboard, CheckCircle2, RefreshCw, Eraser, Sparkles, ChevronDown, FileType2, Pin, X, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useEffect, useRef, useState } from "react";
import type { InputMode, StyleSelectionKey, WorkspaceData } from "../types";

interface LeftPanelProps {
  data: WorkspaceData;
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  onImportMarkdown: (file: File) => Promise<void>;
  onGenerateAll: () => Promise<void>;
  onGenerateLayout: () => Promise<void>;
  onSetOutputToggle: (key: "knowledgeCards" | "wechatCover" | "xiaohongshuCover", enabled: boolean) => void;
  onSetStyleSelection: (key: StyleSelectionKey, index: number) => void;
  onSetCardSize: (nextCardSize: WorkspaceData["cardSize"]) => void;
  isTablet: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function LeftPanel({
  data,
  inputMode,
  setInputMode,
  onImportMarkdown,
  onGenerateAll,
  onGenerateLayout,
  onSetOutputToggle,
  onSetStyleSelection,
  onSetCardSize,
  isTablet,
  isOpen,
  onClose,
}: LeftPanelProps) {
  const [widthInput, setWidthInput] = useState(String(data.cardSize.width));
  const [heightInput, setHeightInput] = useState(String(data.cardSize.height));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isGenerating = [...data.knowledgeCards, ...data.wechatInlineImages, ...data.covers].some((item) => item.state === "processing");
  const styleTargets: Array<{ key: StyleSelectionKey; label: string; hint: string }> = [
    { key: "knowledgeCards", label: "知识卡片", hint: "小红书 / 观点卡" },
    { key: "wechatInlineImages", label: "正文配图", hint: "公众号中段插图" },
    { key: "wechatCover", label: "公众号封面", hint: "文章入口图" },
    { key: "xiaohongshuCover", label: "小红书封面", hint: "笔记首图" },
  ];
  const ratioPresets: Record<string, { width: number; height: number }> = {
    "3:4": { width: 1536, height: 2048 },
    "4:3": { width: 2048, height: 1536 },
    "1:1": { width: 1536, height: 1536 },
    "9:16": { width: 1080, height: 1920 },
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
            <Input placeholder="文章标题" className="bg-input-background border-border h-9" />
            <textarea
              className="w-full h-40 rounded-md bg-input-background border border-border px-3 py-2 text-[12.5px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
              placeholder="将正文粘贴到此处…（推荐使用 Markdown 上传以保留结构）"
            />
            <p className="text-[10.5px] text-muted-foreground">纯文本模式不会识别小标题、引用等结构。</p>
          </div>
        )}

        <Separator />

        {/* Output settings — merged compact block */}
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          {/* Account header */}
          <button className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 hover:bg-secondary/30 transition-colors">
            <span className="flex items-center gap-2 text-[12.5px]">
              <span className="w-5 h-5 rounded-sm bg-primary/90 text-primary-foreground flex items-center justify-center text-[10px]" style={{ fontFamily: "var(--font-serif)" }}>墨</span>
              <span style={{ fontWeight: 500 }}>墨予镜</span>
              <span className="text-[10.5px] text-muted-foreground">订阅号</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Output toggles */}
          <div className="divide-y divide-border/60">
            {[
              ...data.outputToggles,
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between px-3.5 py-2 text-[12px]">
                <span>{item.label}</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10.5px] text-muted-foreground">{item.hint}</span>
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={(checked) => onSetOutputToggle(item.key, checked)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Card size — inline within same module */}
          <div className="border-t border-border/60 bg-secondary/25 px-3.5 py-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-foreground/85" style={{ fontWeight: 500 }}>卡片尺寸</span>
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
        </div>

        <div className="rounded-lg border border-border bg-card/70 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-foreground/85" style={{ fontWeight: 500 }}>输出风格分配</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">四种图片各自独立选择，不再共用同一套风格</div>
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {styleTargets.map((target) => (
              <div key={target.key} className="px-3.5 py-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11.5px]" style={{ fontWeight: 500 }}>{target.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{target.hint}</div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {data.styleAssets[data.styleSelections[target.key]]?.palette.slice(0, 3).map((color) => (
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
                    {data.styleAssets.map((style, index) => (
                      <SelectItem key={`${target.key}-${style.name}`} value={String(index)}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Style asset library — slimmer */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[10.5px] text-muted-foreground tracking-[0.15em]">风格资产</span>
              <span className="text-[10px] text-muted-foreground/70">4 套</span>
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] truncate" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{s.name}</span>
                    {s.pinned && <Pin className="w-2.5 h-2.5 text-muted-foreground/70 shrink-0" />}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 truncate">{s.desc} · {s.meta}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1.5 transition-colors">
            + 新建风格方案
          </button>
        </div>
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
