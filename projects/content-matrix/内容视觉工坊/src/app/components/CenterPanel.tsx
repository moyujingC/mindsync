import { RefreshCw, Image as ImageIcon, AlertTriangle, CheckCircle2, Layers, MoreHorizontal, Maximize2, Quote, LoaderCircle, Download } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { CoverAsset, GenerationStageStatus, InputMode, KnowledgeCardItem, WechatInlineImageAsset, WorkspaceData, WorkflowStage } from "../types";

interface CenterPanelProps {
  data: WorkspaceData;
  inputMode: InputMode;
  onReplanContent: () => Promise<void>;
  onRegenerateCardImage: (cardNumber: string) => Promise<void>;
  onRegenerateInlineImage: (imageId: string) => Promise<void>;
  onRegenerateAllCardImages: () => Promise<void>;
  onRegenerateCoverAsset: (coverKey: "wechatCover" | "wechatShareCover" | "xiaohongshuCover") => Promise<void>;
}

export function CenterPanel({ data, inputMode, onReplanContent, onRegenerateCardImage, onRegenerateInlineImage, onRegenerateAllCardImages, onRegenerateCoverAsset }: CenterPanelProps) {
  const isBatchGenerating = [...data.knowledgeCards, ...data.wechatInlineImages, ...data.covers].some((item) => item.state === "processing");
  const isReplanning = data.workflowStages.find((stage) => stage.key === "contentAnalysis")?.status === "processing";
  const cardStyleName = data.styleAssets[data.styleSelections.knowledgeCards]?.name ?? "默认风格";
  const inlineStyleName = data.styleAssets[data.styleSelections.wechatInlineImages]?.name ?? "默认风格";
  const downloadableCount =
    data.knowledgeCards.filter((item) => item.img && item.state !== "failed").length +
    data.wechatInlineImages.filter((item) => item.img && item.state !== "failed").length +
    data.covers.filter((item) => item.img && item.state !== "failed").length;
  const wechatWideCover = data.covers.find((item) => item.key === "wechatCover" && item.img && item.state !== "failed");
  const wechatShareCover = data.covers.find((item) => item.key === "wechatShareCover" && item.img && item.state !== "failed");

  return (
    <main className="flex-1 min-w-0 bg-background flex flex-col overflow-hidden xl:min-w-[640px]">
      {/* Summary bar — two stable rows */}
      <div className="px-8 pt-5 pb-5 border-b border-border bg-card/30">
        <div className="flex items-baseline gap-3 text-[11px] text-muted-foreground">
          <span className="tracking-[0.18em]">CURRENT DRAFT</span>
          <span className="text-border">/</span>
          <span>{data.article.fileName}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-6">
          <h1 className="text-foreground truncate flex-1 min-w-0" style={{ fontFamily: "var(--font-serif)", fontSize: "23px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {data.article.title}
          </h1>
          <div className="hidden lg:flex items-baseline gap-7 shrink-0 text-[12px]">
            {data.generation.summaryMeta.map((item) => (
              <Meta key={item.label} label={item.label} value={item.value} emerald={item.emerald} />
            ))}
          </div>
        </div>
        <div className="mt-1.5 text-[11px] text-muted-foreground">
          {data.article.wordCount.toLocaleString()} 字 · {data.parsedMarkdown.structure.subheadings} 小标题 · 卡片 {shortStyleName(cardStyleName)} · 配图 {shortStyleName(inlineStyleName)}
        </div>
        <div className="mt-2 text-[10.5px] text-muted-foreground">
          文生图输入：整篇正文全文 · 模型会自行判断拆图数量与段落配图位置
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.workflowStages.slice(0, 5).map((stage) => (
            <StageChip key={stage.key} stage={stage} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ============ UPPER: Understanding ============ */}
        <section className="px-8 pt-6 pb-5">
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-[10px] text-muted-foreground tracking-[0.2em]">02</span>
              <h3 className="text-[14.5px]" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>内容拆解</h3>
              <span className="text-[11.5px] text-muted-foreground ml-1 mb-0.5">这一篇文章会被拆成哪些画面与重点</span>
            </div>
            <button
              onClick={() => onReplanContent()}
              disabled={isReplanning}
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary/50 disabled:opacity-50 disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
            >
              <RefreshCw className={`w-3 h-3 ${isReplanning ? "animate-spin" : ""}`} /> {isReplanning ? (inputMode === "text" ? "拆图中" : "拆解中") : (inputMode === "text" ? "重新拆图" : "重新拆解")}
            </button>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7 rounded-lg border border-border bg-card/70">
              <div className="px-4 py-2 border-b border-border/60 flex items-center justify-between text-[10.5px] text-muted-foreground tracking-wide">
                <span>拆解为 {data.cardPlan.length} 张知识卡片</span>
                <span>{inputMode === "text" ? "基于全文语义拆图" : "对应 H2 段落"}</span>
              </div>
              <ol className="divide-y divide-border/50">
                {data.cardPlan.map((card) => (
                  <li key={card.index} className="px-4 py-2.5 flex items-baseline gap-3 text-[12.5px] hover:bg-secondary/25 transition-colors">
                    <span className="text-[10px] text-muted-foreground tracking-widest shrink-0">{String(card.index).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground/90 block leading-snug" style={{ fontFamily: "var(--font-serif)" }}>{card.title}</span>
                      <span className="text-[10.5px] text-muted-foreground mt-0.5 block truncate">{card.summary}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="col-span-5 space-y-3">
              <div className="rounded-lg border border-border bg-card/70 p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Quote className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10.5px] text-muted-foreground tracking-wide">识别出的重点句</span>
                </div>
                <div className="space-y-2">
                  {data.analysis.keyQuotes.map((q, i) => (
                    <div key={i} className="text-[12.5px] leading-snug pl-3 border-l-2 border-primary/40 text-foreground/90" style={{ fontFamily: "var(--font-serif)" }}>
                      「{q}」
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card/70 p-4">
                <div className="text-[10.5px] text-muted-foreground mb-1 tracking-wide">封面主题与配图方向</div>
                <div className="text-[14px] text-foreground/95 leading-snug" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{data.analysis.coverTheme.title}</div>
                <div className="text-[10.5px] text-muted-foreground mt-1.5">{data.analysis.coverTheme.keywords}</div>
                <div className="text-[10.5px] text-muted-foreground mt-2 leading-relaxed">
                  {data.analysis.imageGenerationSource.strategy}
                </div>
                <div className="mt-2 text-[10px] text-foreground/70">
                  当前拆解来源：{data.workflowStages.find((stage) => stage.key === "contentAnalysis")?.providerLabel ?? "未标记"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="px-8">
          <div className="border-t border-border/70"></div>
        </div>

        {/* ============ LOWER: Visual results (HERO) ============ */}
        <section className="px-8 pt-7 pb-8 bg-gradient-to-b from-card/25 to-transparent">
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-baseline gap-3">
              <span className="text-[10px] text-muted-foreground tracking-[0.2em]">03</span>
              <h3 className="text-[17px]" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>图片生成结果</h3>
              <span className="text-[11.5px] text-muted-foreground ml-1 mb-0.5">{data.generation.cardsCount} 张知识卡片 + {data.wechatInlineImages.length} 张正文配图 + {data.generation.coversCount} 张封面</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void downloadWechatCompositeCover(wechatWideCover?.img, wechatShareCover?.img, data.article.title)}
                disabled={!wechatWideCover?.img || !wechatShareCover?.img}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11.5px] px-2 py-1 rounded hover:bg-secondary/50 disabled:opacity-50 disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
              >
                <Download className="w-3 h-3" />
                下载公众号拼接封面
              </button>
              <button
                onClick={() => void downloadAllAssets(data)}
                disabled={downloadableCount === 0}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11.5px] px-2 py-1 rounded hover:bg-secondary/50 disabled:opacity-50 disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
              >
                <Download className="w-3 h-3" />
                下载全部图片
              </button>
              <button
                onClick={() => onRegenerateAllCardImages()}
                disabled={isBatchGenerating}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11.5px] px-2 py-1 rounded hover:bg-secondary/50 disabled:opacity-50 disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
              >
                <RefreshCw className={`w-3 h-3 ${isBatchGenerating ? "animate-spin" : ""}`} />
                {isBatchGenerating ? "批量生成中" : "全部重生成"}
              </button>
            </div>
          </div>

          {/* Knowledge cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {data.knowledgeCards.map((card) => (
              <KnowledgeCard key={card.n} c={card} onRegenerate={onRegenerateCardImage} />
            ))}
          </div>

          <div className="mt-8 mb-4 flex items-center gap-3">
            <span className="text-[10.5px] text-muted-foreground tracking-[0.15em]">公众号正文配图</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {data.wechatInlineImages.map((image) => (
              <InlineImageCard key={image.id} image={image} onRegenerate={onRegenerateInlineImage} />
            ))}
          </div>

          {/* Covers divider */}
          <div className="mt-8 mb-4 flex items-center gap-3">
            <span className="text-[10.5px] text-muted-foreground tracking-[0.15em]">封面</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <div className="mb-4 text-[10.5px] text-muted-foreground">
            公众号封面会生成列表大图与转发小图两张，并支持自动拼接后下载上传。
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            {data.covers.map((cover) => (
              <div key={cover.label} className={cover.wide ? "xl:col-span-3" : "xl:col-span-2"}>
                <CoverCard
                  cover={cover}
                  articleTitle={data.article.title}
                  coverThemeTitle={data.analysis.coverTheme.title}
                  coverThemeKeywords={data.analysis.coverTheme.keywords}
                  onRegenerate={onRegenerateCoverAsset}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function shortStyleName(name: string) {
  const parts = name.split("·").map((item) => item.trim()).filter(Boolean);
  return parts[parts.length - 1] || name;
}

function sanitizeFilename(input: string) {
  return input.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

function getExtensionFromMimeType(mimeType?: string) {
  if (!mimeType) return "png";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

async function downloadImageAsset(imageUrl: string, filename: string) {
  if (typeof window === "undefined") return;

  if (imageUrl.startsWith("data:")) {
    const mimeType = imageUrl.slice(5, imageUrl.indexOf(";"));
    const ext = getExtensionFromMimeType(mimeType);
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const ext = getExtensionFromMimeType(blob.type);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${filename}.${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

async function downloadAllAssets(data: WorkspaceData) {
  const wechatWideCover = data.covers.find((item) => item.key === "wechatCover" && item.img && item.state !== "failed");
  const wechatShareCover = data.covers.find((item) => item.key === "wechatShareCover" && item.img && item.state !== "failed");
  const tasks: Array<{ url: string; filename: string }> = [
    ...data.knowledgeCards
      .filter((item) => item.img && item.state !== "failed")
      .map((item) => ({
        url: item.img,
        filename: sanitizeFilename(`知识卡片-${item.n}-${item.title}`),
      })),
    ...data.wechatInlineImages
      .filter((item) => item.img && item.state !== "failed")
      .map((item, index) => ({
        url: item.img,
        filename: sanitizeFilename(`正文配图-${String(index + 1).padStart(2, "0")}-${item.sectionTheme}`),
      })),
    ...data.covers
      .filter((item) => item.img && item.state !== "failed")
      .map((item) => ({
        url: item.img,
        filename: sanitizeFilename(`${item.label}-${data.article.title}`),
      })),
  ];

  for (const task of tasks) {
    await downloadImageAsset(task.url, task.filename);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
  }

  if (wechatWideCover?.img && wechatShareCover?.img) {
    await downloadWechatCompositeCover(wechatWideCover.img, wechatShareCover.img, data.article.title);
  }
}

async function fetchImageAsObjectUrl(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`image fetch failed: ${response.status}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function loadImageElement(src: string) {
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image decode failed"));
  });
  image.src = src;
  return loaded;
}

async function buildWechatCompositeCoverDataUrl(wideCoverUrl?: string, squareCoverUrl?: string) {
  if (!wideCoverUrl || !squareCoverUrl || typeof window === "undefined") return;

  const wideObjectUrl = await fetchImageAsObjectUrl(wideCoverUrl);
  const squareObjectUrl = await fetchImageAsObjectUrl(squareCoverUrl);

  try {
    const [wideImage, squareImage] = await Promise.all([
      loadImageElement(wideObjectUrl),
      loadImageElement(squareObjectUrl),
    ]);

    const targetHeight = Math.min(wideImage.height, squareImage.height);
    const wideWidth = Math.round((wideImage.width / wideImage.height) * targetHeight);
    const squareWidth = targetHeight;
    const canvas = document.createElement("canvas");
    canvas.width = wideWidth + squareWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(wideImage, 0, 0, wideWidth, targetHeight);
    ctx.drawImage(squareImage, wideWidth, 0, squareWidth, targetHeight);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(wideObjectUrl);
    URL.revokeObjectURL(squareObjectUrl);
  }
}

async function downloadWechatCompositeCover(wideCoverUrl?: string, squareCoverUrl?: string, articleTitle?: string) {
  const dataUrl = await buildWechatCompositeCoverDataUrl(wideCoverUrl, squareCoverUrl);
  if (!dataUrl) return;
  await downloadImageAsset(dataUrl, sanitizeFilename(`公众号拼接封面-${articleTitle ?? "未命名文章"}`));
}

function getGenerationModeLabel(mode?: "reference-edit" | "prompt-only") {
  if (mode === "reference-edit") return "参考图引导";
  if (mode === "prompt-only") return "纯提示词";
  return "";
}

function appendGenerationMode(providerLabel: string, mode?: "reference-edit" | "prompt-only") {
  const label = getGenerationModeLabel(mode);
  return label ? `${providerLabel} · ${label}` : providerLabel;
}

function InlineImageCard({ image, onRegenerate }: { image: WechatInlineImageAsset; onRegenerate: (imageId: string) => Promise<void> }) {
  const failed = image.state === "failed";
  const processing = image.state === "processing";
  const providerLabel = image.isStale ? "需重生成" : image.provider === "image-model" ? "真实出图" : "示例图";
  const sectionTypeLabelMap: Record<WechatInlineImageAsset["sectionType"], string> = {
    concept: "概念图",
    quote: "轻观点图",
    method: "方法图",
    transition: "换气图",
  };
  const sectionIndex = image.id.replace("inline-", "");

  return (
    <ResultCardShell
      aspect="16/9"
      cornerChip={`段落配图 ${sectionIndex}`}
      statusChip={
        processing ? (
          <><LoaderCircle className="w-3 h-3 animate-spin" /> 生成中</>
        ) : !failed ? (
          <><span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span> 已就绪</>
        ) : null
      }
      imageNode={
        !failed && image.img ? (
          <ImageWithFallback src={image.img} alt={image.sectionTheme} className="absolute inset-0 w-full h-full object-cover" />
        ) : processing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#f3ecdb]">
            <LoaderCircle className="w-5 h-5 text-primary animate-spin" />
            <div className="text-[12.5px] text-foreground" style={{ fontWeight: 500 }}>正在生成正文配图</div>
            <div className="text-[10.5px] text-muted-foreground leading-relaxed">已提交到 gpt-image-2，通常需要几秒钟</div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#f3ecdb]">
            <div className="w-9 h-9 rounded-full bg-amber-700/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
            </div>
            <div className="text-[12.5px] text-amber-900" style={{ fontWeight: 500 }}>生成失败</div>
            <div className="text-[10.5px] text-muted-foreground leading-relaxed">prompt 触发了安全限制 · 可单独重试</div>
            <button onClick={() => onRegenerate(image.id)} className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-primary bg-card border border-border rounded-md px-2.5 py-1 hover:bg-secondary/60">
              <RefreshCw className="w-3 h-3" /> 重新生成
            </button>
          </div>
        )
      }
      title={image.sectionTheme}
      caption={image.visualDirection}
      spec={`${appendGenerationMode(providerLabel, image.imageGenerationMode)} · ${sectionTypeLabelMap[image.sectionType]} · ${image.ratio} · ${image.width}×${image.height}`}
      actions={
        <>
          <ToolBtn title="重生成" onClick={processing ? undefined : () => onRegenerate(image.id)} disabled={processing}><RefreshCw className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} /></ToolBtn>
          <ToolBtn
            title="下载图片"
            onClick={image.img && !failed ? () => void downloadImageAsset(image.img, sanitizeFilename(`正文配图-${sectionIndex}-${image.sectionTheme}`)) : undefined}
            disabled={!image.img || failed || processing}
          >
            <Download className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn title="替换图片" disabled><ImageIcon className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn title="大图预览"><Maximize2 className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn title="更多"><MoreHorizontal className="w-3.5 h-3.5" /></ToolBtn>
        </>
      }
    />
  );
}

function Meta({ label, value, emerald }: { label: string; value: string; emerald?: boolean }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-[10px] text-muted-foreground tracking-[0.18em]">{label}</span>
      <span className={`text-[13px] mt-1 ${emerald ? "text-emerald-800" : "text-foreground"}`} style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function StageChip({ stage }: { stage: WorkflowStage }) {
  const styles: Record<GenerationStageStatus, string> = {
    idle: "bg-secondary/60 text-muted-foreground",
    processing: "bg-secondary text-foreground",
    success: "bg-emerald-700/10 text-emerald-800",
    failed: "bg-amber-700/10 text-amber-900",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10.5px] ${styles[stage.status]}`}>
      {stage.status === "processing" ? <LoaderCircle className="w-3 h-3 animate-spin" /> : null}
      {stage.status === "success" ? <CheckCircle2 className="w-3 h-3" /> : null}
      {stage.status === "failed" ? <AlertTriangle className="w-3 h-3" /> : null}
      <span>{stage.label}</span>
      {stage.providerLabel ? <span className="opacity-80">· {stage.providerLabel}</span> : null}
    </span>
  );
}

/**
 * Unified result-card skeleton:
 *   ┌───────────────────────────────┐
 *   │  image area · corner chip(TL) │
 *   │  status chip(BL)              │
 *   ├───────────────────────────────┤
 *   │  title (serif, 1 line)        │
 *   │  caption (sans, 1 line)       │
 *   ├───────────────────────────────┤
 *   │  spec · │ · toolbar           │
 *   └───────────────────────────────┘
 */
function ResultCardShell({
  aspect,
  cornerChip,
  statusChip,
  imageNode,
  title,
  caption,
  spec,
  actions,
}: {
  aspect: string;
  cornerChip?: React.ReactNode;
  statusChip?: React.ReactNode;
  imageNode: React.ReactNode;
  title: React.ReactNode;
  caption?: React.ReactNode;
  spec: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.02),0_10px_28px_-20px_rgba(31,58,54,0.35)] transition-shadow hover:shadow-[0_1px_0_rgba(0,0,0,0.02),0_14px_30px_-18px_rgba(31,58,54,0.4)]">
      <div className="relative bg-[#ece6d6] overflow-hidden" style={{ aspectRatio: aspect }}>
        {imageNode}
        {cornerChip && (
          <span className="absolute top-2.5 left-2.5 text-[10px] text-foreground/80 bg-card/85 backdrop-blur px-1.5 py-0.5 rounded tracking-widest">{cornerChip}</span>
        )}
        {statusChip && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] text-foreground/80 bg-card/85 backdrop-blur px-1.5 py-0.5 rounded">
            {statusChip}
          </span>
        )}
      </div>
      <div className="px-4 pt-3 pb-2.5 min-h-[68px]">
        <h4 className="text-[13.5px] leading-snug truncate" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{title}</h4>
        {caption && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-1">{caption}</p>}
      </div>
      <div className="h-9 px-2.5 border-t border-border/60 flex items-center text-[10.5px] text-muted-foreground">
        <span className="px-1.5">{spec}</span>
        <div className="ml-auto flex items-center gap-0.5">{actions}</div>
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  title,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50 disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function KnowledgeCard({ c, onRegenerate }: { c: KnowledgeCardItem; onRegenerate: (cardNumber: string) => Promise<void> }) {
  const failed = c.state === "failed";
  const processing = c.state === "processing";
  const providerLabel = c.isStale ? "需重生成" : c.provider === "image-model" ? "真实出图" : c.provider === "llm" ? "真实 LLM" : "示例图";
  return (
    <ResultCardShell
      aspect="3/4"
      cornerChip={c.n}
      statusChip={
        processing ? (
          <><LoaderCircle className="w-3 h-3 animate-spin" /> 生成中</>
        ) : !failed ? (
          <><span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span> 已就绪</>
        ) : null
      }
      imageNode={
        !failed && c.img ? (
          <ImageWithFallback src={c.img} alt={typeof c.title === "string" ? c.title : ""} className="absolute inset-0 w-full h-full object-cover" />
        ) : processing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#f3ecdb]">
            <LoaderCircle className="w-5 h-5 text-primary animate-spin" />
            <div className="text-[12.5px] text-foreground" style={{ fontWeight: 500 }}>正在生成图片</div>
            <div className="text-[10.5px] text-muted-foreground leading-relaxed">已提交到 gpt-image-2，通常需要几秒钟</div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#f3ecdb]">
            <div className="w-9 h-9 rounded-full bg-amber-700/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
            </div>
            <div className="text-[12.5px] text-amber-900" style={{ fontWeight: 500 }}>生成失败</div>
            <div className="text-[10.5px] text-muted-foreground leading-relaxed">prompt 触发了安全限制 · 可调整后重试</div>
            <button onClick={() => onRegenerate(c.n)} className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-primary bg-card border border-border rounded-md px-2.5 py-1 hover:bg-secondary/60">
              <RefreshCw className="w-3 h-3" /> 重新生成
            </button>
          </div>
        )
      }
      title={c.title}
      caption={c.composition}
      spec={`${appendGenerationMode(providerLabel, c.imageGenerationMode)} · 3:4 · 1536×2048`}
      actions={
        <>
          <ToolBtn title="重生成" onClick={processing ? undefined : () => onRegenerate(c.n)} disabled={processing}><RefreshCw className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} /></ToolBtn>
          <ToolBtn
            title="下载图片"
            onClick={c.img && !failed ? () => void downloadImageAsset(c.img, sanitizeFilename(`知识卡片-${c.n}-${c.title}`)) : undefined}
            disabled={!c.img || failed || processing}
          >
            <Download className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn title="替换图片"><ImageIcon className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn title="大图预览"><Maximize2 className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn title="更多"><MoreHorizontal className="w-3.5 h-3.5" /></ToolBtn>
        </>
      }
    />
  );
}

function CoverCard({
  cover,
  articleTitle,
  coverThemeTitle,
  coverThemeKeywords,
  onRegenerate,
}: {
  cover: CoverAsset;
  articleTitle: string;
  coverThemeTitle: string;
  coverThemeKeywords: string;
  onRegenerate: (coverKey: "wechatCover" | "wechatShareCover" | "xiaohongshuCover") => Promise<void>;
}) {
  const processing = cover.state === "processing";
  const failed = cover.state === "failed";
  const providerLabel = cover.isStale ? "需重生成" : cover.provider === "image-model" ? "真实出图" : "示例图";
  const keywordLine = coverThemeKeywords
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");

  return (
    <ResultCardShell
      aspect={cover.wide ? "2.35/1" : "3/4"}
      cornerChip={cover.ratio}
      statusChip={
        processing ? (
          <><LoaderCircle className="w-3 h-3 animate-spin" /> 生成中</>
        ) : failed ? (
          <><AlertTriangle className="w-3 h-3" /> 生成失败</>
        ) : (
          <><span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span> {cover.status}</>
        )
      }
      imageNode={
        cover.img && !failed ? (
          <>
            <ImageWithFallback src={cover.img} alt={cover.label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            <div className="absolute bottom-3.5 left-4 right-4 text-white">
              <div className="text-[10px] tracking-[0.16em] opacity-80">{coverThemeTitle}</div>
              <div className="leading-tight mt-0.5" style={{ fontFamily: "var(--font-serif)", fontSize: cover.wide ? "22px" : "18px", fontWeight: 600 }}>
                {articleTitle}
              </div>
              {cover.wide && keywordLine ? <div className="text-[12px] opacity-85 mt-1" style={{ fontFamily: "var(--font-serif)" }}>—— {keywordLine}</div> : null}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#f3ecdb]">
            {processing ? <LoaderCircle className="w-5 h-5 text-primary animate-spin" /> : <AlertTriangle className="w-5 h-5 text-amber-800" />}
            <div className="text-[12.5px] text-foreground" style={{ fontWeight: 500 }}>{processing ? "正在生成封面" : "封面生成失败"}</div>
            <div className="text-[10.5px] text-muted-foreground leading-relaxed">
              {processing ? "已提交到 gpt-image-2，通常需要几秒钟" : "可以继续重试，或稍后更换风格再生成"}
            </div>
          </div>
        )
      }
      title={
        <span className="inline-flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          {cover.label}
        </span>
      }
      caption="主标题、副线及账号信息已嵌入封面"
      spec={`${appendGenerationMode(providerLabel, cover.imageGenerationMode)} · ${cover.key === "wechatCover" ? "2.35:1 · 公众号列表" : cover.key === "wechatShareCover" ? "1:1 · 公众号转发" : "3:4 · 小红书"}`}
      actions={
        <>
          <ToolBtn
            title="重生成"
            onClick={processing ? undefined : () => onRegenerate(cover.key)}
            disabled={processing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} />
          </ToolBtn>
          <ToolBtn
            title="下载图片"
            onClick={cover.img && !failed ? () => void downloadImageAsset(cover.img, sanitizeFilename(`${cover.label}-${articleTitle}`)) : undefined}
            disabled={!cover.img || failed || processing}
          >
            <Download className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn title="替换图片"><ImageIcon className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn title="更多"><MoreHorizontal className="w-3.5 h-3.5" /></ToolBtn>
        </>
      }
    />
  );
}
