import { useState, type CSSProperties } from "react";

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
  heroHint?: string;
  redeemHint?: string;
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

function BackGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 13.7 8l4.8 1.7-4.8 1.7L12 16l-1.7-4.6-4.8-1.7L10.3 8 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M18.5 14.5 19.3 17l2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8.8-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 15.5 5.6 17l1.4.5-1.4.5L5 19.5 4.4 18 3 17.5l1.4-.5.6-1.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CoinsGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7.5c0 2-1.6 3.5-3.5 3.5S2 9.5 2 7.5 3.6 4 5.5 4 9 5.5 9 7.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 14.5c0 2-1.6 3.5-3.5 3.5S7 16.5 7 14.5 8.6 11 10.5 11 14 12.5 14 14.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M22 11.5c0 2-1.6 3.5-3.5 3.5S15 13.5 15 11.5 16.6 8 18.5 8 22 9.5 22 11.5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SharedReportEntryCard({
  id,
  title,
  description,
  bullets,
  tone,
  cta,
  note,
  priceLabel,
  availability,
  redeemCode,
  redeemHint,
  onRedeemCodeChange,
  onClick,
}: SharedReportEntryCardDescriptor & {
  redeemCode?: string;
  redeemHint?: string;
  onRedeemCodeChange?: (value: string) => void;
  onClick?: () => void;
}) {
  const isAvailable = availability === "available";
  const redeemInputId = `am-report-entry-redeem-code-${id}`;
  const [redeemState, setRedeemState] = useState<"idle" | "ready" | "empty">("idle");

  const handleRedeem = () => {
    setRedeemState(redeemCode?.trim() ? "ready" : "empty");
  };

  const handleRedeemCodeChange = (value: string) => {
    if (redeemState !== "idle") {
      setRedeemState("idle");
    }
    onRedeemCodeChange?.(value);
  };
  const priceMatch = priceLabel.match(/^(.+?)\s*(元)$/);

  return (
    <article
      className={`am-report-entry-card am-report-entry-card--${tone}${isAvailable ? " is-available" : " is-unavailable"}`}
    >
      <div className="am-report-entry-card__head">
        <div className="am-report-entry-card__version">
          <span className="am-report-entry-card__icon">
            <SparklesGlyph />
          </span>
          <div>
            <div className="am-report-entry-card__eyebrow">解读版本</div>
            <h2 className="am-report-entry-card__title">{title}</h2>
          </div>
        </div>
        <span className="am-report-entry-card__price">
          {priceMatch ? (
            <>
              <span className="am-report-entry-card__price-main">{priceMatch[1]}</span>
              <span className="am-report-entry-card__price-unit">{priceMatch[2]}</span>
            </>
          ) : (
            priceLabel
          )}
        </span>
      </div>
      {description ? <p className="am-report-entry-card__description">{description}</p> : null}

      <section className="am-report-entry-redeem" aria-label="优惠券或兑换码">
        <label className="am-report-entry-redeem__label" htmlFor={redeemInputId}>
          优惠券 / 兑换码
        </label>
        <div className="am-report-entry-redeem__row">
          <input
            id={redeemInputId}
            className={`am-report-entry-redeem__input am-report-entry-redeem__input--${redeemState}`}
            value={redeemCode}
            onChange={(event) => handleRedeemCodeChange(event.target.value)}
          />
          <button
            type="button"
            className="am-report-entry-redeem__button"
            onClick={handleRedeem}
          >
            兑换
          </button>
        </div>
        {redeemState !== "idle" ? (
          <p className={`am-report-entry-redeem__hint am-report-entry-redeem__hint--${redeemState}`}>
            {redeemState === "empty"
              ? "请先输入优惠券或兑换码。"
              : redeemHint ?? "兑换码已填写，支付时会一起校验。"}
          </p>
        ) : null}
      </section>

      <div className="am-report-entry-card__bullets">
        <div className="am-report-entry-card__bullets-title">本次 Lite 解读会包含</div>
        {bullets.map((item) => (
          <div key={item} className="am-report-entry-card__bullet">
            <span className="am-report-entry-card__bullet-dot">
              <CheckGlyph />
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      {note ? <p className="am-report-entry-card__note">{note}</p> : null}
      <button
        type="button"
        onClick={onClick}
        disabled={!isAvailable}
        className="am-report-entry-card__cta"
      >
        <span>{cta}</span>
        {cta.length > 4 ? <EntryArrowGlyph /> : null}
      </button>
    </article>
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
        <div className="am-report-entry-topbar">
          <button type="button" onClick={onBack} className="am-report-entry-back">
            <BackGlyph />
            <span>返回</span>
          </button>
          <div className="am-report-entry-topbar__status">{descriptor.statusLabel}</div>
          <div className="am-report-entry-topbar__spacer" />
        </div>
        <div className="am-report-entry-hero__content">
          <h1 className="am-report-entry-hero__title">{descriptor.title}</h1>
          <p className="am-report-entry-hero__description">
            {descriptor.description}
          </p>
          <p className="am-report-entry-hero__hint">
            {descriptor.heroHint ?? "你选的不是“更贵或更便宜”，而是这一次更适合自己的阅读深度。"}
          </p>
          <div className="am-report-entry-theme-pill">
            <span className="am-report-entry-theme-pill__label">当前议题</span>
            <CoinsGlyph />
            <span>{descriptor.themeLabel}</span>
          </div>
        </div>
      </div>

      <div className="am-report-entry-body">
        {descriptor.cards.map((card) => (
          <SharedReportEntryCard
            key={card.id}
            {...card}
            redeemCode={redeemCode}
            redeemHint={descriptor.redeemHint}
            onRedeemCodeChange={onRedeemCodeChange}
            onClick={
              card.availability === "available" && onChoose
                ? () => onChoose(card.id)
                : undefined
            }
          />
        ))}

        {descriptor.footnote ? <section className="am-report-entry-footnote">
          <div className="am-report-entry-footnote__label">温柔提示</div>
          {descriptor.footnote}
        </section> : null}
      </div>
    </div>
  );
}
