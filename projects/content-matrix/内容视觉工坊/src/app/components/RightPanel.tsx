import { CheckCircle2, ExternalLink, RefreshCw, Smartphone, Eye, X } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { ReviewCheck, SyncStatusItem, WorkspaceData } from "../types";

interface RightPanelProps {
  data: WorkspaceData;
  isTablet: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function RightPanel({ data, isTablet, isOpen, onClose }: RightPanelProps) {
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
          <h2 className="text-[13.5px] tracking-wide" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>公众号审稿</h2>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>iPhone 视图</span>
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
              <div className="text-[12.5px] text-foreground" style={{ fontWeight: 500 }}>可同步到草稿箱</div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">4 项审稿检查全部通过</div>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground tracking-[0.15em]">READY</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {data.reviewChecks.map((check) => <ReviewCheckCard key={check.title} check={check} />)}
        </div>
      </div>

      {/* Phone-like preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <Smartphone className="w-3 h-3" />
            <span>微信公众号 · 阅读视图</span>
            <span className="opacity-60">·</span>
            <span>375 × auto</span>
          </div>
          <span className="text-[10px] text-muted-foreground">滚动查看完整审稿</span>
        </div>

        <div className="px-5 pb-3">
          {/* legend — once, not repeated per block */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2 px-0.5">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-px bg-[#cfc6b3]"></span>来自 Markdown</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-px bg-primary/55"></span>系统加工</span>
          </div>

          <div className="rounded-[14px] bg-[#e8e3d6] p-2.5 border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <div className="rounded-[10px] bg-white shadow-sm border border-border/70 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-5 pb-3.5 border-b border-border/50">
                <h1 className="text-[#1a1a1a] leading-[1.45]" style={{ fontFamily: "var(--font-serif)", fontSize: "19px", fontWeight: 600 }}>
                  在算法替你思考之前，先把判断力留下来
                </h1>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center text-[9px]" style={{ fontFamily: "var(--font-serif)" }}>墨</div>
                <span className="text-foreground/80">墨予镜</span>
                  <span>·</span>
                  <span>2026年6月7日</span>
                  <span className="ml-auto text-primary/80">关注</span>
                </div>
              </div>

              {/* Body */}
              <article className="px-6 py-5 text-[13px] leading-[1.95] text-[#2a2a2a]" style={{ fontFamily: "var(--font-sans-cn)" }}>
                {/* Intro — markdown inherited */}
                <InheritBlock>
                  <p className="italic text-[#7a7568] text-[12.5px] leading-[1.85]">
                    写给在 AI 工具丛林里有点迷路的内容创作者。这不是一篇关于「怎么用 AI」的文章，是关于「怎么不被 AI 用掉」的笔记。
                  </p>
                </InheritBlock>

                <InheritBlock className="mt-5">
                  <h2 className="text-[#1f3a36]" style={{ fontFamily: "var(--font-serif)", fontSize: "15.5px", fontWeight: 600 }}>
                    一 · 信息过载时代，判断力比知识更稀缺
                  </h2>
                </InheritBlock>

                <p className="mt-3">
                  过去十年我们以为最值钱的是知识，现在发现真正稀缺的是<MarkBold>「在一堆都对的答案里，挑出最适合此刻的那一个」</MarkBold>的能力。
                </p>

                {/* image slot — system added */}
                <SystemBlock label="图片位 · 知识卡片 01" className="mt-5">
                  <figure>
                    <div className="rounded-md overflow-hidden bg-[#ece6d6] relative" style={{ aspectRatio: "3/4", maxHeight: 300 }}>
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1686806372785-fcfe9efa9b70?w=700&q=80"
                        alt="知识卡片 01"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <figcaption className="text-center text-[11px] text-muted-foreground mt-2">▲ 判断力比知识更稀缺</figcaption>
                  </figure>
                </SystemBlock>

                <InheritBlock className="mt-5">
                  <blockquote className="bg-[#f6f2e8] border-l-[3px] border-[#1f3a36] px-4 py-3 text-[12.5px] text-[#3a3a3a] leading-[1.85]" style={{ fontFamily: "var(--font-serif)" }}>
                    提示词不是工作，提问才是。创作者的护城河，正在向「问什么」迁移。
                  </blockquote>
                </InheritBlock>

                <InheritBlock className="mt-6">
                  <h2 className="text-[#1f3a36]" style={{ fontFamily: "var(--font-serif)", fontSize: "15.5px", fontWeight: 600 }}>
                    二 · 三个练习：把判断力的肌肉养回来
                  </h2>
                </InheritBlock>

                <InheritBlock className="mt-3">
                  <ol className="space-y-2 pl-0.5">
                    {[
                      ["每天 20 分钟不被推荐流喂养", "只读一段自己挑的、长一点的文字。"],
                      ["把「我觉得」放回文章里", "在 AI 的工整里，留一处不工整的、属于你的判断。"],
                      ["保留一份「不发布」的写作", "写给自己看，不为流量校准语气。"],
                    ].map(([t, d], i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="text-[#1f3a36] shrink-0" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{i + 1}.</span>
                        <div>
                          <span style={{ fontWeight: 500 }}>{t}</span>
                          <span className="text-muted-foreground"> —— {d}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </InheritBlock>

                <p className="mt-5">
                  AI 给的是答案，编辑要的是问题。<MarkBold>越是工具普及的时代，越要把「为什么是这一个」想清楚。</MarkBold>
                </p>

                {/* CTA — system added */}
                <SystemBlock label="结尾 CTA · 系统生成" className="mt-7 pt-5 border-t border-dashed border-border/80">
                  <div className="text-center text-[11.5px] text-muted-foreground">
                    <div className="mb-2.5" style={{ fontFamily: "var(--font-serif)", color: "#1f3a36", fontWeight: 500 }}>—— 如果这段文字让你停了一下，欢迎留言告诉我 ——</div>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#1f3a36] text-white text-[11px]">点亮「在看」 · 分享给同样在思考的人</span>
                  </div>
                </SystemBlock>
              </article>
            </div>
          </div>
        </div>

        {/* Sync status */}
        <div className="px-5 pb-4">
          <div className="rounded-lg bg-card border border-border">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <div>
                <div className="text-[12px]" style={{ fontWeight: 500 }}>草稿同步状态</div>
                <div className="text-[10.5px] text-muted-foreground mt-0.5">最近同步：2026-06-07 14:32 · 墨予镜</div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-800 bg-emerald-700/10 px-2 py-1 rounded">
                <CheckCircle2 className="w-3 h-3" /> 草稿已创建
              </span>
            </div>
            <ul className="divide-y divide-border/60">
              {data.syncStatus.map((row) => (
                <li key={row.label} className="px-4 py-2.5 flex items-center gap-2.5 text-[11.5px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
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
        <Button className="w-full h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]">
          <CheckCircle2 className="w-4 h-4" /> 同步到公众号草稿
        </Button>
        <div className="mt-2 flex items-center justify-between text-[11.5px]">
          <button className="text-foreground/85 hover:text-foreground inline-flex items-center gap-1 px-1.5 py-1">
            <RefreshCw className="w-3 h-3" /> 重新同步
          </button>
          <span className="text-border">·</span>
          <button className="text-foreground/85 hover:text-foreground inline-flex items-center gap-1 px-1.5 py-1">
            <ExternalLink className="w-3 h-3" /> 打开草稿
          </button>
          <span className="text-border">·</span>
          <span className="text-[10.5px] text-muted-foreground">仅写入草稿箱</span>
        </div>
      </div>
      </aside>
    </>
  );
}

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
      <span className="absolute -left-3 top-0 bottom-0 w-px bg-[#cfc6b3]" aria-hidden></span>
      {children}
    </div>
  );
}

function SystemBlock({ children, label, className = "" }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <span className="absolute -left-3 top-0 bottom-0 w-px bg-primary/55" aria-hidden></span>
      <span className="absolute -top-2 right-0 text-[9.5px] text-primary/85 bg-white px-1.5 py-[1px] rounded-sm border border-primary/20 whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  );
}

function MarkBold({ children }: { children: React.ReactNode }) {
  return (
    <strong
      className="text-[#1f3a36] relative px-0.5"
      style={{ fontWeight: 600, backgroundImage: "linear-gradient(to top, rgba(31,58,54,0.10) 0%, rgba(31,58,54,0.10) 30%, transparent 30%)" }}
    >
      {children}
    </strong>
  );
}
