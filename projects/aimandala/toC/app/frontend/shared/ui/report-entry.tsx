import type { CSSProperties } from "react";

export type SharedReportEntryAvailability = "available";

type SharedReportEntryPatternStyle = CSSProperties;

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

function EntryArrowGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m13 7 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
  const isAvailable = availability === "available";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAvailable}
      className={`am-report-entry-card am-report-entry-card--${tone}${isAvailable ? " is-available" : " is-unavailable"}`}
    >
      <div className="am-report-entry-card__topline" />
      <div className="am-report-entry-card__eyebrow">解读版本</div>
      <div className="am-report-entry-card__head">
        <h2 className="am-report-entry-card__title">{title}</h2>
        <span className="am-report-entry-card__price">
          {priceLabel}
        </span>
      </div>
      <p className="am-report-entry-card__description">{description}</p>
      <div className="am-report-entry-card__bullets">
        {bullets.map((item) => (
          <div key={item} className="am-report-entry-card__bullet">
            <span className="am-report-entry-card__bullet-dot">·</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <p className="am-report-entry-card__note">{note}</p>
      <div className="am-report-entry-card__cta">
        <span>{cta}</span>
        <EntryArrowGlyph />
      </div>
    </button>
  );
}

export interface SharedReportEntrySelectionPageProps {
  descriptor: SharedReportEntryDescriptor;
  heroClassName?: string;
  heroPatternClassName?: string;
  heroPatternStyle?: SharedReportEntryPatternStyle;
  redeemCode?: string;
  onRedeemCodeChange?: (value: string) => void;
  onBack?: () => void;
  onChoose?: (cardId: string) => void;
}

export function SharedReportEntrySelectionPage({
  descriptor,
  heroClassName,
  heroPatternClassName,
  heroPatternStyle,
  redeemCode = "",
  onRedeemCodeChange,
  onBack,
  onChoose,
}: SharedReportEntrySelectionPageProps) {
  return (
    <div className="am-report-entry-page">
      <div className={`am-report-entry-hero${heroClassName ? ` ${heroClassName}` : ""}`}>
        <div
          className={`am-report-entry-hero__pattern${heroPatternClassName ? ` ${heroPatternClassName}` : ""}`}
          style={heroPatternStyle}
        />
        <button type="button" onClick={onBack} className="am-report-entry-back">
          返回
        </button>
        <div className="am-report-entry-hero__content">
          <div className="am-report-entry-hero__eyebrow">{descriptor.statusLabel}</div>
          <h1 className="am-report-entry-hero__title">{descriptor.title}</h1>
          <p className="am-report-entry-hero__description">
            {descriptor.description}
          </p>
          <p className="am-report-entry-hero__hint">
            你选的不是“更贵或更便宜”，而是这一次更适合自己的阅读深度。
          </p>
          <div className="am-report-entry-theme-pill">
            <span className="am-report-entry-theme-pill__label">当前主题</span>
            <span>{descriptor.themeLabel}</span>
          </div>
        </div>
      </div>

      <div className="am-report-entry-body">
        <section className="am-report-entry-redeem">
          <label className="am-report-entry-redeem__label" htmlFor="am-report-entry-redeem-code">
            优惠券 / 兑换码
          </label>
          <input
            id="am-report-entry-redeem-code"
            className="am-report-entry-redeem__input"
            value={redeemCode}
            onChange={(event) => onRedeemCodeChange?.(event.target.value)}
            placeholder="请输入可用兑换码"
          />
          <p className="am-report-entry-redeem__hint">
            系统会在生成前校验兑换码；Lite 和 Pro 仍按所选版本生成。
          </p>
        </section>

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

        <section className="am-report-entry-footnote">
          <div className="am-report-entry-footnote__label">温柔提示</div>
          {descriptor.footnote}
        </section>
      </div>
    </div>
  );
}
