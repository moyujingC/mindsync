import brandPattern from "../assets/pattern.webp";
import {
  createReportEntryPageDescriptor,
  type ReportEntryAvailability,
} from "../pages/report-entry-page";
import type {
  MobileWebReportProductType,
  MobileWebUploadDraft,
} from "../state";

export interface MobileWebReportEntryPageProps {
  draft: MobileWebUploadDraft;
  onBack?: () => void;
  onChooseReportType?: (reportType: MobileWebReportProductType) => void;
}

function EntryCard({
  title,
  description,
  bullets,
  tone,
  cta,
  note,
  priceLabel,
  availability,
  onClick,
}: {
  title: string;
  description: string;
  bullets: string[];
  tone: "lite" | "pro";
  cta: string;
  note: string;
  priceLabel: string;
  availability: ReportEntryAvailability;
  onClick?: () => void;
}) {
  const isPro = tone === "pro";
  const isAvailable = availability === "available";
  const accentColor =
    tone === "lite"
      ? "#7A8EA8"
      : "#D4A054";
  const borderColor = isPro
    ? "rgba(212,160,84,0.24)"
    : `color-mix(in srgb, ${accentColor} 22%, transparent)`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAvailable}
      style={{
        width: "100%",
        textAlign: "left",
        border: `1px solid ${borderColor}`,
        borderRadius: 24,
        padding: 20,
        background: isPro
          ? "linear-gradient(135deg, rgba(26,40,68,0.98) 0%, rgba(37,56,96,0.96) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(245,239,226,0.92) 100%)",
        boxShadow: isPro ? "0 14px 36px rgba(26,40,68,0.18)" : "0 14px 32px rgba(74,61,48,0.08)",
        color: isPro ? "#E8DCC8" : "#4A3D30",
        opacity: isAvailable ? 1 : 0.88,
        cursor: isAvailable ? "pointer" : "default",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.18em", color: isPro ? "rgba(212,160,84,0.86)" : accentColor }}>解读版本</div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
        <h2 style={{ margin: 0, fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600, lineHeight: 1.35 }}>{title}</h2>
        <span
          style={{
            flexShrink: 0,
            marginTop: 2,
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: "0.04em",
            color: isPro ? "#E8DCC8" : accentColor,
            background: isPro ? "rgba(212,160,84,0.12)" : `color-mix(in srgb, ${accentColor} 12%, white)`,
            border: isPro ? "1px solid rgba(212,160,84,0.18)" : `1px solid color-mix(in srgb, ${accentColor} 18%, transparent)`,
          }}
        >
          {priceLabel}
        </span>
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.8, color: isPro ? "rgba(232,220,200,0.82)" : "#67594E" }}>{description}</p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {bullets.map((item) => (
          <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.7, color: isPro ? "rgba(232,220,200,0.74)" : "#7A6A5A" }}>
            <span style={{ color: isPro ? "#D4A054" : accentColor }}>·</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: "16px 0 0", fontSize: 12, lineHeight: 1.75, color: isPro ? "rgba(232,220,200,0.58)" : "#8A7C6C" }}>{note}</p>
      <div
        style={{
          marginTop: 18,
          minHeight: 44,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isPro
            ? "linear-gradient(135deg, rgba(212,160,84,0.18) 0%, rgba(200,120,80,0.14) 100%)"
            : `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 10%, white) 0%, color-mix(in srgb, ${accentColor} 4%, white) 100%)`,
          color: isPro ? "#E8DCC8" : accentColor,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.04em",
          opacity: isAvailable ? 1 : 0.76,
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
  onChooseReportType,
}: MobileWebReportEntryPageProps) {
  const descriptor = createReportEntryPageDescriptor(draft);

  return (
    <div style={{ minHeight: "100%", background: "linear-gradient(180deg, #F4EEDF 0%, #FAF8F5 100%)", fontFamily: "'Noto Sans SC', sans-serif" }}>
      <div style={{ position: "relative", padding: "18px 20px 28px", background: "linear-gradient(180deg, #1A2844 0%, #223358 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${brandPattern})`, backgroundSize: 280, backgroundRepeat: "repeat", opacity: 0.03 }} />
        <button type="button" onClick={onBack} style={{ position: "relative", padding: 0, background: "transparent", border: 0, color: "rgba(232,220,200,0.72)", fontSize: 14 }}>
          返回
        </button>
        <div style={{ position: "relative", marginTop: 28 }}>
          <div style={{ fontSize: 11, color: "rgba(212,160,84,0.86)", letterSpacing: "0.16em" }}>{descriptor.statusLabel}</div>
          <h1 style={{ margin: "10px 0 10px", fontFamily: "'Noto Serif SC', serif", fontSize: 30, lineHeight: 1.28, color: "#E8DCC8" }}>
            {descriptor.title}
          </h1>
          <p style={{ margin: 0, maxWidth: 320, fontSize: 14, lineHeight: 1.8, color: "rgba(232,220,200,0.72)" }}>
            {descriptor.description}
          </p>
          <div style={{ marginTop: 14, fontSize: 12, color: "rgba(212,160,84,0.72)" }}>
            这次你更想重点看：{descriptor.themeLabel}
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 18px 28px", display: "grid", gap: 16 }}>
        {descriptor.cards.map((card) => (
          <EntryCard
            key={card.id}
            title={card.title}
            description={card.description}
            bullets={card.bullets}
            tone={card.tone}
            cta={card.cta}
            note={card.note}
            priceLabel={card.priceLabel}
            availability={card.availability}
            onClick={
              card.availability === "available" && onChooseReportType
                ? () => onChooseReportType(card.id)
                : undefined
            }
          />
        ))}

        <section
          style={{
            borderRadius: 18,
            padding: "16px 18px",
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(122,142,168,0.12)",
            color: "#6D604F",
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          {descriptor.footnote}
        </section>
      </div>
    </div>
  );
}
