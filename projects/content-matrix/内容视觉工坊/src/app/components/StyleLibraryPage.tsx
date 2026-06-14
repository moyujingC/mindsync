import type { WorkspaceData } from "../types";

interface StyleLibraryPageProps {
  data: WorkspaceData;
}

function getStyleReferenceImageSrc(referenceImage: string) {
  return `/风格库/${referenceImage}`;
}

export function StyleLibraryPage({ data }: StyleLibraryPageProps) {
  const selectedLayoutTheme = data.layoutThemes[data.styleSelections.wechatLayout];

  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-background">
      <div className="px-8 pt-6 pb-8">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <div className="text-[10px] text-muted-foreground tracking-[0.2em]">STYLE LIBRARY</div>
            <h1 className="mt-2 text-[24px] text-foreground" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>
              风格资产
            </h1>
            <p className="mt-2 text-[12.5px] text-muted-foreground max-w-[720px] leading-relaxed">
              这里单独管理知识卡片、公众号配图、封面和排版基准。工作台只保留当前任务所需的最小操作。
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/70 px-4 py-3 min-w-[220px]">
            <div className="text-[10.5px] text-muted-foreground tracking-[0.15em]">当前公众号排版基准</div>
            <div className="mt-2 text-[14px] text-foreground/95" style={{ fontWeight: 600 }}>
              {selectedLayoutTheme?.name ?? "未命名"}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              蓝雾静读版样式样本已接入新排版链路
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card/70 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[10.5px] text-muted-foreground tracking-[0.15em]">图片风格库</div>
              <div className="mt-1 text-[15px] text-foreground" style={{ fontWeight: 600 }}>可选风格资产</div>
            </div>
            <div className="text-[11px] text-muted-foreground">{data.styleAssets.length} 套</div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {data.styleAssets.map((asset, index) => (
              <div key={`${asset.name}-${index}`} className="rounded-lg border border-border bg-background/70 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] text-foreground/95" style={{ fontWeight: 600 }}>{asset.name}</div>
                      <div className="text-[10.5px] text-muted-foreground mt-0.5">{asset.desc}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">{asset.meta}</div>
                  </div>
                </div>

                <div className="px-4 py-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {asset.palette.map((color) => (
                      <span key={color} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: color }} />
                        {color}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {asset.fit.map((fit) => (
                      <span key={fit} className="inline-flex rounded-full bg-secondary/70 px-2 py-1 text-[10px] text-muted-foreground">
                        {fit}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {asset.promptBase}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {asset.referenceImages.slice(0, 6).map((image) => (
                      <div key={image} className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted/20">
                        <img src={getStyleReferenceImageSrc(image)} alt={asset.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
