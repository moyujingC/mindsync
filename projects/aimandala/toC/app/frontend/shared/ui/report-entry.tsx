import type { ReactNode } from "react";

export type SharedReportEntryAvailability = "available";

export interface SharedReportEntryCardDescriptor {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  note: string;
  priceLabel: string;
  tone: "lite" | "pro";
  availability: SharedReportEntryAvailability;
}

export interface SharedReportEntryDescriptor {
  statusLabel: string;
  title: string;
  description: string;
  themeLabel: string;
  footnote: string;
  cards: SharedReportEntryCardDescriptor[];
}

function EntryArrowGlyph({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="m13 7 5 5-5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SharedReportEntryCard({
  title,
  description,
  bullets,
  tone,
  cta,
  note,
  priceLabel,
  availability,
  onClick,
}: SharedReportEntryCardDescriptor & {
  onClick?: () => void;
}) {
  const isPro = tone === "pro";
  const isAvailable = availability === "available";
  const accentColor = isPro ? "#D4A054" : "#7A8EA8";
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
        borderRadius: 26,
        padding: 22,
        background: isPro
          ? "linear-gradient(135deg, rgba(26,40,68,0.98) 0%, rgba(37,56,96,0.96) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.84) 0%, rgba(245,239,226,0.94) 100%)",
        boxShadow: isPro ? "0 18px 40px rgba(26,40,68,0.2)" : "0 16px 36px rgba(74,61,48,0.09)",
        color: isPro ? "#E8DCC8" : "#4A3D30",
        opacity: isAvailable ? 1 : 0.88,
        cursor: isAvailable ? "pointer" : "default",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 auto auto 0",
          width: "100%",
          height: 1,
          background: isPro
            ? "linear-gradient(90deg, rgba(212,160,84,0.7), rgba(212,160,84,0.06))"
            : `linear-gradient(90deg, color-mix(in srgb, ${accentColor} 62%, white), rgba(122,142,168,0.06))`,
        }}
      />
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
      <div style={{ display: "grid", gap: 8, marginTop: 18, paddingTop: 14, borderTop: isPro ? "1px solid rgba(232,220,200,0.1)" : "1px solid rgba(122,142,168,0.12)" }}>
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
          background: isPro
            ? "linear-gradient(135deg, rgba(212,160,84,0.18) 0%, rgba(200,120,80,0.14) 100%)"
            : `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 10%, white) 0%, color-mix(in srgb, ${accentColor} 4%, white) 100%)`,
          color: isPro ? "#E8DCC8" : accentColor,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.04em",
          opacity: isAvailable ? 1 : 0.76,
          justifyContent: "space-between",
          padding: "0 14px",
        }}
      >
        <span>{cta}</span>
        <EntryArrowGlyph color={isPro ? "#E8DCC8" : accentColor} />
      </div>
    </button>
  );
}

export interface SharedReportEntrySelectionPageProps {
  descriptor: SharedReportEntryDescriptor;
  heroBackground?: ReactNode;
  onBack?: () => void;
  onChoose?: (cardId: string) => void;
}

export function SharedReportEntrySelectionPage({
  descriptor,
  heroBackground,
  onBack,
  onChoose,
}: SharedReportEntrySelectionPageProps) {
  return (
    <div style={{ minHeight: "100%", background: "linear-gradient(180deg, #F4EEDF 0%, #FAF8F5 100%)", fontFamily: "'Noto Sans SC', sans-serif" }}>
      <div style={{ position: "relative", padding: "18px 20px 32px", background: "linear-gradient(180deg, #1A2844 0%, #223358 100%)", overflow: "hidden" }}>
        {heroBackground}
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
          <p style={{ margin: "12px 0 0", maxWidth: 318, fontSize: 12.5, lineHeight: 1.85, color: "rgba(232,220,200,0.56)" }}>
            你选的不是“更贵或更便宜”，而是这一次更适合自己的阅读深度。
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginTop: 18,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(232,220,200,0.8)",
              fontSize: 12,
            }}
          >
            <span style={{ color: "rgba(212,160,84,0.82)", letterSpacing: "0.08em" }}>当前主题</span>
            <span>{descriptor.themeLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 18px 30px", display: "grid", gap: 18 }}>
        {descriptor.cards.map((card) => (
          <SharedReportEntryCard
            key={card.id}
            {...card}
            onClick={
              card.availability === "available" && onChoose
                ? () => onChoose(card.id)
                : undefined
            }
          />
        ))}

        <section
          style={{
            borderRadius: 18,
            padding: "16px 18px",
            background: "rgba(255,255,255,0.74)",
            border: "1px solid rgba(122,142,168,0.12)",
            color: "#6D604F",
            fontSize: 13,
            lineHeight: 1.8,
            boxShadow: "0 12px 28px rgba(74,61,48,0.05)",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#9B7B52", marginBottom: 6 }}>温柔提示</div>
          {descriptor.footnote}
        </section>
      </div>
    </div>
  );
}
