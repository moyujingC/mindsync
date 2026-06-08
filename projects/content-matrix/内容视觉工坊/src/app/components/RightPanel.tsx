import { CheckCircle2, ExternalLink, RefreshCw, Smartphone, Eye, X, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { DraftPreviewBlock, GenerationStageStatus, InputMode, ReviewCheck, WorkspaceData } from "../types";
import { buildWechatLayoutTheme } from "../lib/layoutTheme";

interface RightPanelProps {
  data: WorkspaceData;
  inputMode: InputMode;
  copyFeedback: string;
  onCopyWechatHtml: () => Promise<void>;
  isTablet: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function RightPanel({ data, inputMode, copyFeedback, onCopyWechatHtml, isTablet, isOpen, onClose }: RightPanelProps) {
  const draftSyncStage = data.workflowStages.find((stage) => stage.key === "draftSync");
  const isTextMode = inputMode === "text";
  const layoutTheme = data.layoutThemes[data.styleSelections.wechatLayout];
  const theme = buildWechatLayoutTheme(layoutTheme);
  const panelClassName = isTablet
    ? `absolute inset-y-0 right-0 z-30 w-[min(464px,96vw)] bg-card shadow-2xl transition-transform duration-200 ${isOpen ? "translate-x-0" : "translate-x-full"}`
    : "w-[420px] xl:w-[464px] shrink-0 border-l border-border bg-card/40 flex flex-col overflow-hidden";

  return (
    <>
      {isTablet && isOpen && <button className="absolute inset-0 z-20 bg-black/20" onClick={onClose} aria-label="关闭审稿面板" />}
      <aside className={panelClassName}>
      <div className="px-5 pt-4 pb-3 flex items-end justify-between border-b border-border/70">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-muted-foreground tracking-[0.2em]">03</span>
          <h2 className="text-[13.5px] tracking-wide" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{isTextMode ? "图片模式说明" : "公众号审稿"}</h2>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{isTextMode ? "文本模式" : "iPhone 视图"}</span>
          </div>
          {isTablet && (
            <button className="hover:text-foreground" onClick={onClose} aria-label="关闭">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Review verdict gate */}
      <div className="px-5 pt-4 pb-4 border-b border-border/70 bg-gradient-to-b from-emerald-700/[0.04] to-transparent">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-700/15 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="text-[12.5px] text-foreground" style={{ fontWeight: 500 }}>{data.draftReview.readyTitle}</div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">{data.draftReview.readyDescription}</div>
            </div>
          </div>
          <span className={`text-[10px] tracking-[0.15em] ${draftSyncStage?.status === "success" ? "text-emerald-800" : "text-muted-foreground"}`}>
            {draftSyncStage ? stageLabelMap[draftSyncStage.status] : "READY"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {data.draftReview.reviewChecks.map((check) => <ReviewCheckCard key={check.title} check={check} />)}
        </div>
        <div className="mt-3 rounded-lg border border-border/70 bg-card/70 px-3 py-2.5">
          <div className="text-[10.5px] text-muted-foreground tracking-wide mb-2">{isTextMode ? "模式说明" : "正文配图节奏"}</div>
          <div className="space-y-2">
            {data.draftReview.imagePlacements.slice(0, 2).map((placement) => (
              <div key={placement.imageId} className="text-[10.5px] leading-relaxed text-muted-foreground">
                <span className="text-foreground/90" style={{ fontWeight: 500 }}>{placement.sectionHeading}</span>
                <span> · {placement.anchorText}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phone-like preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <Smartphone className="w-3 h-3" />
            <span>{isTextMode ? "纯文本模式 · 图片工作流" : "微信公众号 · 阅读视图"}</span>
            <span className="opacity-60">·</span>
            <span>{isTextMode ? "不生成排版" : "375 × auto"}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{isTextMode ? "当前仅展示模式说明" : "阅读预览"}</span>
        </div>

        <div className="px-5 pb-3">
          <div className="rounded-[14px] p-2.5 border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]" style={{ background: theme.shellBg }}>
            <div className="rounded-[10px] shadow-sm border border-border/70 overflow-hidden" style={{ background: theme.articleBg }}>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border/40">
                <h1 className="leading-[1.5]" style={{ fontFamily: "var(--font-serif)", fontSize: "20px", fontWeight: 600, color: theme.titleColor }}>
                  {data.draftReview.preview.title}
                </h1>
                <div className="mt-2.5 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                <div className="w-5 h-5 rounded-full text-primary-foreground flex items-center justify-center text-[9px]" style={{ fontFamily: "var(--font-serif)", background: theme.headingColor }}>墨</div>
                <span style={{ color: theme.bodyColor }}>{data.draftReview.preview.accountName}</span>
                  <span>·</span>
                  <span>{data.draftReview.preview.publishDate}</span>
                  <span className="ml-auto opacity-70" style={{ color: theme.bodyColor }}>公众号</span>
                </div>
              </div>

              {/* Body */}
              <article className="px-6 py-6 text-[13px] leading-[1.95]" style={{ fontFamily: "var(--font-sans-cn)", color: theme.bodyColor }}>
                {data.draftReview.preview.intro ? (
                  <InheritBlock>
                    <div
                      className="px-4 py-4"
                      style={{
                        marginBottom: theme.paragraphSpacing + 2,
                        background: theme.placeholderBg,
                        borderTop: `1px solid ${theme.placeholderBorder}`,
                        borderRadius: Math.max(theme.quoteRadius - 2, 6),
                      }}
                    >
                      <p className="italic text-[12.5px] leading-[2]" style={{ color: theme.bodyColor }}>
                        {data.draftReview.preview.intro}
                      </p>
                    </div>
                  </InheritBlock>
                ) : null}

                {data.draftReview.preview.blocks.map((block, index) => (
                  <PreviewBlock
                    key={`${block.type}-${index}`}
                    block={block}
                    prevBlock={index > 0 ? data.draftReview.preview.blocks[index - 1] : undefined}
                    nextBlock={index < data.draftReview.preview.blocks.length - 1 ? data.draftReview.preview.blocks[index + 1] : undefined}
                    inlineImage={block.type === "image" ? data.wechatInlineImages.find((item) => item.id === block.imageId)?.img : undefined}
                    theme={theme}
                  />
                ))}
              </article>
            </div>
          </div>
        </div>

        {/* Sync status */}
        <div className="px-5 pb-4">
          <div className="rounded-lg bg-card/80 border border-border/70">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <div>
                <div className="text-[12px]" style={{ fontWeight: 500 }}>复制与同步</div>
                <div className="text-[10.5px] text-muted-foreground mt-0.5">{copyFeedback || draftSyncStage?.detail || "尚未复制公众号正文"}</div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-1 rounded ${
                draftSyncStage?.status === "success"
                  ? "text-foreground bg-secondary/70"
                  : "text-muted-foreground bg-secondary/50"
              }`}>
                <CheckCircle2 className={`w-3 h-3 ${draftSyncStage?.status === "success" ? "text-emerald-700" : "text-muted-foreground"}`} /> {draftSyncStage?.status === "success" ? "已就绪" : "待复制"}
              </span>
            </div>
            <ul className="divide-y divide-border/60">
              {data.draftReview.syncStatus.map((row) => (
                <li key={row.label} className="px-4 py-2.5 flex items-center gap-2.5 text-[11.5px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0"></span>
                  <span className="shrink-0" style={{ fontWeight: 500 }}>{row.label}</span>
                  <span className="text-muted-foreground truncate flex-1">{row.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3.5 border-t border-border bg-card/80 shrink-0">
        <Button
          onClick={() => void onCopyWechatHtml()}
          disabled={isTextMode || !data.draftReview.editorHtml}
          className="w-full h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isTextMode ? "纯文本模式不生成正文" : "复制公众号正文"}
        </Button>
        <div className="mt-2 flex items-center justify-between text-[11.5px]">
          <button className="text-foreground/85 hover:text-foreground inline-flex items-center gap-1 px-1.5 py-1" disabled={isTextMode}>
            <RefreshCw className="w-3 h-3" /> {isTextMode ? "排版未启用" : "重新生成排版"}
          </button>
          <span className="text-border">·</span>
          <button className="text-foreground/85 hover:text-foreground inline-flex items-center gap-1 px-1.5 py-1" disabled={isTextMode}>
            <ExternalLink className="w-3 h-3" /> {isTextMode ? "公众号链路未启用" : "打开公众号编辑器"}
          </button>
          <span className="text-border">·</span>
          <span className="text-[10.5px] text-muted-foreground">{isTextMode ? "请直接生成图片素材" : "先复制再粘贴"}</span>
        </div>
      </div>
      </aside>
    </>
  );
}

function PreviewBlock({
  block,
  prevBlock,
  nextBlock,
  inlineImage,
  theme,
}: {
  block: DraftPreviewBlock;
  prevBlock?: DraftPreviewBlock;
  nextBlock?: DraftPreviewBlock;
  inlineImage?: string;
  theme: ReturnType<typeof buildWechatLayoutTheme>;
}) {
  const metrics = getBlockSpacing(block, prevBlock, nextBlock, theme);

  if (block.type === "heading2") {
    return (
      <InheritBlock className="mt-0">
        <div
          className="pl-3.5"
          style={{
            marginTop: metrics.marginTop,
            marginBottom: metrics.marginBottom,
            paddingTop: 2,
            borderLeft: `${Math.max(theme.quoteBorderWidth - 2, 1)}px solid ${theme.placeholderBorder}`,
          }}
        >
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: `${Math.max(theme.headingFontSize - 4.5, 17)}px`, fontWeight: 600, lineHeight: 1.6, color: theme.headingColor }}>
            {block.text}
          </h2>
        </div>
      </InheritBlock>
    );
  }

  if (block.type === "blockquote") {
    return (
      <InheritBlock className="mt-0">
        <blockquote className="px-4 py-3.5 text-[12.5px] leading-[1.9]" style={{ marginTop: metrics.marginTop, marginBottom: metrics.marginBottom, fontFamily: "var(--font-serif)", background: theme.quoteBg, borderLeft: `${Math.max(theme.quoteBorderWidth - 1, 2)}px solid ${theme.quoteBorder}`, borderRadius: theme.quoteRadius, color: theme.bodyColor }}>
          {block.text}
        </blockquote>
      </InheritBlock>
    );
  }

  if (block.type === "ordered-list") {
    return (
      <InheritBlock className="mt-0">
        <ol className="space-y-2.5 pl-0.5" style={{ marginTop: metrics.marginTop, marginBottom: metrics.marginBottom }}>
          {block.items.map((item, i) => (
            <li key={`${item}-${i}`} className="flex gap-2.5">
              <span className="shrink-0" style={{ fontFamily: "var(--font-serif)", fontWeight: 600, color: theme.headingColor }}>{i + 1}.</span>
              <div>{item}</div>
            </li>
          ))}
        </ol>
      </InheritBlock>
    );
  }

  if (block.type === "image") {
    return (
      <SystemBlock className="mt-0" style={{ marginTop: metrics.marginTop, marginBottom: metrics.marginBottom }}>
        <figure>
          {inlineImage ? (
            <div className="overflow-hidden relative" style={{ aspectRatio: "16/9", maxHeight: 240, background: theme.figureBg, borderRadius: theme.imageRadius }}>
              <ImageWithFallback
                src={inlineImage}
                alt={`正文配图 ${block.imageId}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="border border-dashed px-4 py-10 text-center" style={{ background: theme.placeholderBg, borderColor: theme.placeholderBorder, color: theme.mutedColor, borderRadius: theme.imageRadius }}>
              <AlertTriangle className="w-4 h-4 mx-auto mb-2" />
              <div className="text-[11px]">这张正文配图还未生成</div>
            </div>
          )}
          <figcaption className="mt-3" style={{ textAlign: theme.captionAlign }}>
            <div className="text-[10.5px] leading-[1.9]" style={{ color: theme.mutedColor }}>
              {block.caption}
            </div>
          </figcaption>
        </figure>
      </SystemBlock>
    );
  }

  if (block.type === "cta") {
    return (
      <SystemBlock className="pt-0" style={{ marginTop: metrics.marginTop, marginBottom: metrics.marginBottom }}>
        <div
          className="px-4 py-4.5 text-center text-[11.5px] text-muted-foreground"
          style={{
            background: theme.placeholderBg,
            borderTop: `1px solid ${theme.placeholderBorder}`,
            borderRadius: Math.max(theme.quoteRadius, 10),
          }}
        >
          <div className="mb-2 text-[10px]" style={{ color: theme.mutedColor }}>
            最后想说
          </div>
          <div className="mb-3" style={{ fontFamily: "var(--font-serif)", color: theme.headingColor, fontWeight: 500, lineHeight: 1.8 }}>
            {block.title}
          </div>
          <div className="text-[11px]" style={{ color: theme.mutedColor }}>
            {block.buttonText}
          </div>
        </div>
      </SystemBlock>
    );
  }

  return <p style={{ marginTop: metrics.marginTop, marginBottom: metrics.marginBottom, lineHeight: 2 }}>{block.text}</p>;
}

function getBlockSpacing(
  block: DraftPreviewBlock,
  prevBlock: DraftPreviewBlock | undefined,
  nextBlock: DraftPreviewBlock | undefined,
  theme: ReturnType<typeof buildWechatLayoutTheme>,
) {
  const paragraph = theme.paragraphSpacing + 2;
  const section = theme.sectionSpacing + 4;
  const image = theme.inlineImageSpacing + 2;
  const quote = theme.quoteSpacing + 2;

  if (block.type === "heading2") {
    return {
      marginTop: prevBlock?.type === "image" ? section + 2 : section,
      marginBottom: nextBlock?.type === "paragraph" ? 10 : 14,
    };
  }

  if (block.type === "paragraph") {
    return {
      marginTop: prevBlock?.type === "heading2" ? 0 : prevBlock?.type === "image" ? 18 : paragraph,
      marginBottom: nextBlock?.type === "heading2" ? 4 : nextBlock?.type === "image" ? 8 : 0,
    };
  }

  if (block.type === "blockquote") {
    return {
      marginTop: prevBlock?.type === "paragraph" ? quote + 2 : quote,
      marginBottom: nextBlock?.type === "heading2" ? 8 : 2,
    };
  }

  if (block.type === "ordered-list") {
    return {
      marginTop: prevBlock?.type === "heading2" ? 6 : paragraph,
      marginBottom: nextBlock?.type === "image" ? 10 : 4,
    };
  }

  if (block.type === "image") {
    return {
      marginTop: prevBlock?.type === "paragraph" ? image + 2 : image,
      marginBottom: nextBlock?.type === "paragraph" ? 12 : 6,
    };
  }

  return {
    marginTop: prevBlock ? section + 10 : section + 6,
    marginBottom: 0,
  };
}

const stageLabelMap: Record<GenerationStageStatus, string> = {
  idle: "IDLE",
  processing: "RUNNING",
  success: "READY",
  failed: "FAILED",
};

function ReviewCheckCard({ check }: { check: ReviewCheck }) {
  return (
    <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-md bg-card border border-border/70">
      <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-foreground/90 truncate" style={{ fontWeight: 500 }}>{check.title}</div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5">{check.detail}</div>
      </div>
    </div>
  );
}

function InheritBlock({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute -left-2.5 top-1 bottom-1 w-px bg-border/45" aria-hidden></span>
      {children}
    </div>
  );
}

function SystemBlock({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative group ${className}`} style={style}>
      <span className="absolute -left-2.5 top-1 bottom-1 w-px bg-border/35" aria-hidden></span>
      {children}
    </div>
  );
}
