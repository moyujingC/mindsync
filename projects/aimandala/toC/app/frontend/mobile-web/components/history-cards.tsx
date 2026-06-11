import {
  SharedHistoryFilterTabs,
  SharedHistoryLimitTabs,
  SharedHistoryRecordsList,
  SharedHistorySummaryRow,
  SharedHistoryThemeTabs,
  type SharedHistoryFilterId,
} from "../../shared/ui";
import type { HistoryPageDescriptor } from "../pages";
import type { SharedHistoryRecordItem } from "../../shared/ui/types";

export type HistoryFilterId = SharedHistoryFilterId | "review";

type IconNode = [tag: "path" | "circle" | "rect", attrs: Record<string, string>][];

const THEME_GLYPH_MAP: Record<string, string> = {
  intimate_relationship: "♡",
  wealth: "☆",
  personal_growth: "✧",
  parent_child_relationship: "◇",
  father_relationship: "♢",
  mother_relationship: "◌",
  career_development: "✦",
  body_health: "✺",
};

const ICON_EYE: IconNode = [
  ["path", { d: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z", key: "e1" }],
  ["circle", { cx: "12", cy: "12", r: "2.8", key: "e2" }],
];

const ICON_LOADER: IconNode = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "l1" }]];
const ICON_ARROW: IconNode = [
  ["path", { d: "M5 12h13", key: "a1" }],
  ["path", { d: "m13 5 7 7-7 7", key: "a2" }],
];

function LucideIcon({
  iconNode,
  size = 24,
  strokeWidth = 2,
  className,
}: {
  iconNode: IconNode;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconNode.map(([tag, attrs]) => {
        const { key, ...rest } = attrs;
        return tag === "path"
          ? <path key={key} {...rest} />
          : tag === "circle"
            ? <circle key={key} {...rest} />
            : <rect key={key} {...rest} />;
      })}
    </svg>
  );
}

export interface HistoryRecordCardProps {
  item: SharedHistoryRecordItem;
  imageUrl?: string;
  variant?: "featured" | "default";
  thumbIndex?: number;
  statusLabelOverride?: string;
  actionLabelOverride?: string;
  isBusy?: boolean;
  disabled?: boolean;
  onOpenRecord?: (interpretationId: string) => void;
}

function renderTrackState(item: SharedHistoryRecordItem) {
  const hasLite = item.availableReportTypes.includes("lite");
  const hasPro = item.availableReportTypes.includes("pro");

  return {
    liteOn: hasLite,
    proOn: hasPro && item.recordReady,
    proGenerating: hasPro && !item.recordReady && item.focusReportType === "pro",
  };
}

export function HistoryRecordCard({
  item,
  imageUrl,
  variant = "default",
  thumbIndex = 0,
  statusLabelOverride,
  actionLabelOverride,
  isBusy = false,
  disabled = false,
  onOpenRecord,
}: HistoryRecordCardProps) {
  const progressPercent = Number.parseInt(item.progressLabel.replace(/\D/g, ""), 10);
  const isFeatured = variant === "featured";
  const isPending = !item.recordReady;
  const thumbClassName = isFeatured
    ? `mw-history-record__thumb mw-history-record__thumb--featured mw-history-record__thumb--featured-${thumbIndex % 5}${!item.recordReady ? " mw-history-record__thumb--featured-pending" : ""}`
    : `mw-history-record__thumb mw-history-record__thumb--${thumbIndex % 4}`;
  const iconGlyph = THEME_GLYPH_MAP[item.theme] ?? "✧";
  const ctaLabel = isBusy
    ? "打开中..."
    : actionLabelOverride ?? (item.focusReportType === "pro"
      ? (item.recordReady ? "查看 Pro" : "查看进度")
      : "查看 Lite");
  const reportLabel = item.focusReportType === "pro" ? "Pro 完整解读" : "Lite 初步解读";
  const statusSummary = isPending
    ? isFeatured
      ? `${reportLabel} · 生成中`
      : `${reportLabel} · 生成中`
    : !isFeatured && actionLabelOverride === "升级 Pro"
      ? `${reportLabel} · 可升级 Pro`
    : `${reportLabel} · 已可查看`;
  const badgeLabel = isBusy
    ? "打开中..."
    : statusLabelOverride ?? ctaLabel;
  const trackState = renderTrackState(item);

  if (isFeatured) {
    return (
      <article className={`mw-history-record mw-history-record--featured mw-history-record--${item.statusTone}`}>
        <div
          className={thumbClassName}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        />
        <div className="mw-history-record__featured-body">
          <div className="mw-history-record__featured-header">
            <span className="mw-history-record__icon mw-history-record__icon--featured" aria-hidden="true">{iconGlyph}</span>
            <h3>{item.themeLabel}</h3>
          </div>

          <div className="mw-history-record__featured-meta">
            <span className="mw-history-clock" aria-hidden="true" />
            <span>{item.subtitle.replace("创建于 ", "")}</span>
          </div>

          <div className="mw-history-record__featured-status">
            <span className={`mw-history-record__featured-dot${isPending ? " is-pending" : " is-ready"}`} aria-hidden="true">
              {isPending ? (
                <LucideIcon iconNode={ICON_LOADER} size={11} strokeWidth={1.9} className="am-lucide-spin" />
              ) : null}
            </span>
            <div className="mw-history-record__featured-copy">
              <div className="mw-history-record__featured-status-row">
                <p className="mw-history-record__status-line mw-history-record__status-line--featured">{statusSummary}</p>
                {isPending ? (
                  <span className="mw-history-record__featured-progress-number">
                    {Number.isNaN(progressPercent) ? item.progressLabel : `${progressPercent}%`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mw-history-record__featured-actions">
            <button
              type="button"
              className="mw-history-record__featured-cta"
              onClick={() => onOpenRecord?.(item.interpretationId)}
              disabled={disabled}
            >
              <span>{badgeLabel}</span>
              <span className="mw-history-record__featured-cta-icon" aria-hidden="true">
                <LucideIcon iconNode={ICON_ARROW} size={12} strokeWidth={1.9} />
              </span>
            </button>
          </div>
        </div>

        {isPending ? (
          <div className="mw-history-record__featured-progressbar">
            <i style={{ width: `${Number.isNaN(progressPercent) ? 40 : Math.max(8, progressPercent)}%` }} />
          </div>
        ) : null}
      </article>
    );
  }

  if (!isFeatured) {
    return (
      <article className={`mw-history-record mw-history-record--default mw-history-record--${item.statusTone}`}>
        <div
          className={thumbClassName}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        />
        <div className="mw-history-record__body mw-history-record__body--default">
          <div className="mw-history-record__header-row">
            <div className="mw-history-record__title-row mw-history-record__title-row--default">
              <h3>{item.themeLabel}</h3>
            </div>
            <span className="mw-history-record__time">{item.subtitle.replace("创建于 ", "")}</span>
          </div>

          <div className="mw-history-record__status-row">
            <div className="mw-history-record__version-track" aria-hidden="true">
              <span className={`mw-history-record__track-dot${trackState.liteOn ? " is-on is-lite" : ""}`} />
              <span className={`mw-history-record__track-line${trackState.proOn || trackState.proGenerating ? " is-on" : ""}`} />
              <span
                className={`mw-history-record__track-dot${
                  trackState.proOn ? " is-on is-pro" : trackState.proGenerating ? " is-generating is-pro" : ""
                }`}
              />
            </div>
            <p className="mw-history-record__status-line mw-history-record__status-line--default">{statusSummary}</p>
          </div>
        </div>

        <button
          type="button"
          className="mw-history-record__cta-inline"
          onClick={() => onOpenRecord?.(item.interpretationId)}
          disabled={disabled}
        >
          <span className="mw-history-record__cta-inline-label">{badgeLabel}</span>
          <span className="mw-history-record__cta-inline-icon" aria-hidden="true">
            <LucideIcon iconNode={ICON_ARROW} size={13} strokeWidth={1.9} />
          </span>
        </button>
      </article>
    );
  }

  return null;
}

export interface HistorySummaryRowProps {
  summary: HistoryPageDescriptor["summary"];
}

export function HistorySummaryRow({
  summary,
}: HistorySummaryRowProps) {
  return <SharedHistorySummaryRow summary={summary} />;
}

export interface HistoryFilterTabsProps {
  activeFilter: HistoryFilterId;
  onChange?: (filter: HistoryFilterId) => void;
  disabled?: boolean;
}

export function HistoryFilterTabs({
  activeFilter,
  onChange,
  disabled = false,
}: HistoryFilterTabsProps) {
  return <SharedHistoryFilterTabs activeFilter={activeFilter} onChange={onChange} disabled={disabled} />;
}

export interface HistoryThemeTabsProps {
  activeTheme?: string;
  themes: string[];
  onChange?: (theme?: string) => void;
  disabled?: boolean;
}

export function HistoryThemeTabs({
  activeTheme,
  themes,
  onChange,
  disabled = false,
}: HistoryThemeTabsProps) {
  return <SharedHistoryThemeTabs activeTheme={activeTheme} themes={themes} onChange={onChange} disabled={disabled} />;
}

export interface HistoryLimitTabsProps {
  activeLimit?: number;
  onChange?: (limit: number) => void;
  disabled?: boolean;
}

export function HistoryLimitTabs({
  activeLimit = 20,
  onChange,
  disabled = false,
}: HistoryLimitTabsProps) {
  return <SharedHistoryLimitTabs activeLimit={activeLimit} onChange={onChange} disabled={disabled} />;
}

export interface HistoryRecordsListProps {
  descriptor: HistoryPageDescriptor;
  activeFilter: HistoryFilterId;
  activeTheme?: string;
  onOpenRecord?: (interpretationId: string) => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
  activeRecordId?: string | null;
}

export function HistoryRecordsList({
  descriptor,
  activeFilter,
  activeTheme,
  onOpenRecord,
  actionDisabled = false,
  actionBusy = false,
  activeRecordId = null,
}: HistoryRecordsListProps) {
  return (
    <SharedHistoryRecordsList
      items={descriptor.items}
      activeFilter={activeFilter}
      activeTheme={activeTheme}
      onOpenRecord={onOpenRecord}
      actionDisabled={actionDisabled}
      actionBusy={actionBusy}
      activeRecordId={activeRecordId}
    />
  );
}
