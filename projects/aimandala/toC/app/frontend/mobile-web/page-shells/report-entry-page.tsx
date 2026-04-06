import brandPattern from "../assets/pattern.webp";
import type { MobileWebUploadDraft } from "../state";

export interface MobileWebReportEntryPageProps {
  draft: MobileWebUploadDraft;
  onBack?: () => void;
  onChooseLite?: () => void;
  onChoosePro?: () => void;
}

function EntryCard({
  eyebrow,
  title,
  description,
  bullets,
  tone,
  cta,
  onClick,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  tone: "lite" | "pro";
  cta: string;
  onClick?: () => void;
}) {
  const isPro = tone === "pro";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        border: isPro ? "1px solid rgba(212,160,84,0.24)" : "1px solid rgba(122,142,168,0.18)",
        borderRadius: 24,
        padding: 20,
        background: isPro
          ? "linear-gradient(135deg, rgba(26,40,68,0.98) 0%, rgba(37,56,96,0.96) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(245,239,226,0.92) 100%)",
        boxShadow: isPro ? "0 14px 36px rgba(26,40,68,0.18)" : "0 14px 32px rgba(74,61,48,0.08)",
        color: isPro ? "#E8DCC8" : "#4A3D30",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.14em", color: isPro ? "rgba(212,160,84,0.86)" : "#7A8EA8" }}>{eyebrow}</div>
      <h2 style={{ margin: "10px 0 10px", fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600, lineHeight: 1.35 }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: isPro ? "rgba(232,220,200,0.82)" : "#67594E" }}>{description}</p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {bullets.map((item) => (
          <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.7, color: isPro ? "rgba(232,220,200,0.74)" : "#7A6A5A" }}>
            <span style={{ color: isPro ? "#D4A054" : "#7A8EA8" }}>•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 18,
          minHeight: 46,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isPro
            ? "linear-gradient(135deg, rgba(212,160,84,0.22) 0%, rgba(200,120,80,0.18) 100%)"
            : "linear-gradient(135deg, rgba(122,142,168,0.12) 0%, rgba(122,142,168,0.06) 100%)",
          color: isPro ? "#E8DCC8" : "#4F657D",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        {cta}
      </div>
    </button>
  );
}

export function MobileWebReportEntryPage({
  draft,
  onBack,
  onChooseLite,
  onChoosePro,
}: MobileWebReportEntryPageProps) {
  return (
    <div style={{ minHeight: "100%", background: "linear-gradient(180deg, #F4EEDF 0%, #FAF8F5 100%)", fontFamily: "'Noto Sans SC', sans-serif" }}>
      <div style={{ position: "relative", padding: "18px 20px 28px", background: "linear-gradient(180deg, #1A2844 0%, #223358 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${brandPattern})`, backgroundSize: 280, backgroundRepeat: "repeat", opacity: 0.03 }} />
        <button type="button" onClick={onBack} style={{ position: "relative", padding: 0, background: "transparent", border: 0, color: "rgba(232,220,200,0.72)", fontSize: 14 }}>
          返回
        </button>
        <div style={{ position: "relative", marginTop: 28 }}>
          <div style={{ fontSize: 11, color: "rgba(212,160,84,0.86)", letterSpacing: "0.16em" }}>报告选择</div>
          <h1 style={{ margin: "10px 0 10px", fontFamily: "'Noto Serif SC', serif", fontSize: 30, lineHeight: 1.28, color: "#E8DCC8" }}>
            你想先生成哪一种解读？
          </h1>
          <p style={{ margin: 0, maxWidth: 320, fontSize: 14, lineHeight: 1.8, color: "rgba(232,220,200,0.72)" }}>
            当前画作与主题已经确认完成。接下来请在 Lite 与 Pro 之间选择一种报告，再进入生成过程。
          </p>
          <div style={{ marginTop: 14, fontSize: 12, color: "rgba(212,160,84,0.72)" }}>
            当前主题：{draft.theme || "全面解读"}
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 18px 28px", display: "grid", gap: 16 }}>
        <EntryCard
          eyebrow="一镜 LITE"
          title="适合先快速看清当前状态的人"
          description="Lite 会更快给你一个核心切口，适合你先把当下最明显的情绪、关系或能量线索抓出来。"
          bullets={[
            "想先快速获得一个主要方向",
            "更关心当前最突出的心理状态",
            "想先看简洁版本，再决定要不要深入",
          ]}
          tone="lite"
          cta="选择 Lite 并开始生成"
          onClick={onChooseLite}
        />

        <EntryCard
          eyebrow="一梳 PRO"
          title="适合一开始就想看完整深度分析的人"
          description="Pro 会直接进入更完整的内容生成，适合你已经准备好花更多时间去看结构、原因与下一步建议。"
          bullets={[
            "想一次看完整深度解读",
            "更在意三圈能量与失衡分析",
            "希望直接进入更完整的结果版本",
          ]}
          tone="pro"
          cta="选择 Pro 并开始生成"
          onClick={onChoosePro}
        />
      </div>
    </div>
  );
}
