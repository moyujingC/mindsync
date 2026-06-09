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

export type HistoryFilterId = SharedHistoryFilterId;

type IconNode = [tag: "path" | "circle" | "rect", attrs: Record<string, string>][];

const ICON_EYE: IconNode = [
  ["path", { d: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z", key: "e1" }],
  ["circle", { cx: "12", cy: "12", r: "2.8", key: "e2" }],
];

const ICON_LOADER: IconNode = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "l1" }]];

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
  isBusy?: boolean;
  disabled?: boolean;
  onOpenRecord?: (interpretationId: string) => void;
}

export function HistoryRecordCard({
  item,
  imageUrl,
  variant = "default",
  thumbIndex = 0,
  statusLabelOverride,
  isBusy = false,
  disabled = false,
  onOpenRecord,
}: HistoryRecordCardProps) {
  const progressPercent = Number.parseInt(item.progressLabel.replace(/\D/g, ""), 10);
  const isFeatured = variant === "featured";
  const thumbClassName = isFeatured
    ? `mw-history-record__thumb mw-history-record__thumb--featured${!item.recordReady ? " mw-history-record__thumb--featured-pending" : ""}`
    : `mw-history-record__thumb mw-history-record__thumb--${thumbIndex % 4}`;
  const iconGlyph = item.recordReady ? "♡" : "✧";
  const statusLabel = isBusy
    ? "打开中..."
    : statusLabelOverride ?? (isFeatured ? (item.recordReady ? "待查看" : "生成中") : (item.recordReady ? "可查看" : "生成中"));

  return (
    <article
      className={`mw-history-record${isFeatured ? " mw-history-record--featured" : " mw-history-record--default"} mw-history-record--${item.statusTone}`}
    >
      <div
        className={thumbClassName}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      <div className="mw-history-record__body">
        <div className="mw-history-record__copy">
          <div className="mw-history-record__title-row">
            <span className="mw-history-record__icon" aria-hidden="true">{iconGlyph}</span>
            <h3>{item.themeLabel}</h3>
          </div>
          <div className="mw-history-record__meta">
            <span className="mw-history-clock" aria-hidden="true" />
            <span>{item.subtitle.replace("创建于 ", "")}</span>
            <strong className={`mw-history-version mw-history-version--${item.focusReportType}`}>
              {item.focusReportType === "pro" ? "Pro" : "Lite"}
            </strong>
          </div>
        </div>
        {!item.recordReady ? (
          <div className="mw-history-record__progress">
            <span>{Number.isNaN(progressPercent) ? item.progressLabel : `${progressPercent}%`}</span>
            <div>
              <i style={{ width: `${Number.isNaN(progressPercent) ? 40 : Math.max(8, progressPercent)}%` }} />
            </div>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className={`mw-history-status-pill${item.recordReady ? " mw-history-status-pill--ready" : " mw-history-status-pill--pending"}`}
        onClick={() => onOpenRecord?.(item.interpretationId)}
        disabled={disabled}
      >
        <span className="mw-history-status-pill__icon" aria-hidden="true">
          {item.recordReady ? (
            <LucideIcon iconNode={ICON_EYE} size={14} strokeWidth={1.9} />
          ) : (
            <LucideIcon iconNode={ICON_LOADER} size={14} strokeWidth={1.9} className="am-lucide-spin" />
          )}
        </span>
        <span className="mw-history-status-pill__label">{statusLabel}</span>
      </button>
    </article>
  );
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
