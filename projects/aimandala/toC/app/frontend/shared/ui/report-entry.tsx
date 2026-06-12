import { useState, type CSSProperties } from "react";

import { SharedAppTopBar } from "./app-top-bar";

export type SharedReportEntryAvailability = "available";

type SharedReportEntryPatternStyle = CSSProperties;

export interface SharedReportEntryCardDescriptor {
  id: string;
  title: string;
  description: string;
  bulletsTitle?: string;
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

type RedeemResult =
  | {
      state: "success";
      message: string;
      discountLabel: string;
      payableLabel: string;
    }
  | {
      state: "error" | "empty";
      message: string;
    };

function formatCurrencyAmount(amount: number): string {
  return Number.isInteger(amount) ? `${amount}` : amount.toFixed(1);
}

function parsePriceAmount(priceLabel: string): number | null {
  const match = priceLabel.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function resolveReportEntryRedeemResult({
  cardId,
  code,
  priceLabel,
}: {
  cardId: string;
  code: string;
  priceLabel: string;
}): RedeemResult {
  const normalizedCode = code.trim().toUpperCase().replace(/-/g, "_");
  if (!normalizedCode) {
    return { state: "empty", message: "请先输入优惠券或兑换码。" };
  }

  const expectedCode = cardId === "pro" ? "MVP_PRO" : "MVP_LITE";
  if (normalizedCode !== expectedCode) {
    return {
      state: "error",
      message: "兑换失败：兑换码无效或不适用于当前解读版本。",
    };
  }

  const priceAmount = parsePriceAmount(priceLabel) ?? 0;
  const discountLabel = `${formatCurrencyAmount(priceAmount)} 元`;
  return {
    state: "success",
    message: "兑换成功：MVP 体验券已应用。",
    discountLabel,
    payableLabel: "0 元",
  };
}

function EntryArrowGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m13 7 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.2 6.2h7.2c1 0 1.8.8 1.8 1.8v7.4c0 1-.8 1.8-1.8 1.8H8.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 6.2c-1.3 0-2.3 1-2.3 2.3s1 2.3 2.3 2.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 17.2c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 6.2c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 17.2c1.3 0 2.3-1 2.3-2.3s-1-2.3-2.3-2.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.3 9.2h3.4M10.3 12h3.8M10.3 14.8h2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  bulletsTitle,
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
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);

  const handleRedeem = () => {
    setRedeemResult(resolveReportEntryRedeemResult({
      cardId: id,
      code: redeemCode ?? "",
      priceLabel,
    }));
  };

  const handleRedeemCodeChange = (value: string) => {
    if (redeemResult) {
      setRedeemResult(null);
    }
    onRedeemCodeChange?.(value);
  };
  const priceMatch = priceLabel.match(/^(.+?)\s*(元)$/);
  const redeemState = redeemResult?.state ?? "idle";

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
        {redeemResult ? (
          <p className={`am-report-entry-redeem__hint am-report-entry-redeem__hint--${redeemState}`}>
            <span>{redeemResult.message}</span>
            {redeemResult.state === "success" ? (
              <span className="am-report-entry-redeem__summary">
                已优惠 {redeemResult.discountLabel}，当前应付 {redeemResult.payableLabel}
              </span>
            ) : null}
          </p>
        ) : null}
      </section>

      <div className="am-report-entry-card__bullets">
        <div className="am-report-entry-card__bullets-title">{bulletsTitle ?? "这次解读会包含"}</div>
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
        <SharedAppTopBar title={descriptor.statusLabel} onBack={onBack} />
        <div className="am-report-entry-hero__content">
          <h2 className="am-report-entry-hero__title">{descriptor.title}</h2>
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
