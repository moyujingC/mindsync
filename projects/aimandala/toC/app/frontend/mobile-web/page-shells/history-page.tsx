import { MobileWebAppShell } from "../app-shell";
import { createHistoryPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import { HistoryRecordCard, type HistoryFilterId } from "../components/history-cards";
import { SharedAppTopBar, SharedTopicSelector, sharedTopicSelectorOptions, type SharedTopicSelectorOption } from "../../shared/ui";
import type { InterpretationListQuery, InterpretationRecordResponse } from "../../shared/types";

const historyThemeOptions: SharedTopicSelectorOption[] = [
  {
    value: "all",
    label: "不限",
    subLabel: "议题",
    icon: [
      ["circle", { cx: "12", cy: "12", r: "7", key: "all-1" }],
      ["path", { d: "M7.5 12h9", key: "all-2" }],
    ],
  },
  ...sharedTopicSelectorOptions,
] as const;

const limitOptions = [
  { value: 10, label: "1 个月" },
  { value: 20, label: "3 个月" },
  { value: 50, label: "6 个月" },
  { value: 100, label: "12 个月" },
] as const;

const statusOptions: Array<{ id: HistoryFilterId; label: string }> = [
  { id: "all", label: "全部" },
  { id: "ready", label: "可查看" },
  { id: "pending", label: "生成中" },
];

export interface MobileWebHistoryPageProps {
  records: InterpretationRecordResponse[];
  historyQuery?: InterpretationListQuery;
  activeFilter?: HistoryFilterId;
  filterBusy?: boolean;
  historyStatusLabel?: string;
  historyStatusDetail?: string;
  historyStatusTone?: "preview" | "runtime";
  historyRefreshHint?: string;
  actionBusy?: boolean;
  activeRecordId?: string | null;
  refreshBusy?: boolean;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onBackToUpload?: () => void;
  onFilterChange?: (filter: HistoryFilterId) => void;
  onThemeChange?: (theme?: string) => void;
  onLimitChange?: (limit: number) => void;
  onRefresh?: () => void;
  onOpenRecord?: (interpretationId: string) => void;
}

export function MobileWebHistoryPage({
  records,
  historyQuery,
  activeFilter = "all",
  filterBusy = false,
  actionBusy = false,
  activeRecordId = null,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onBackToUpload,
  onFilterChange,
  onThemeChange,
  onLimitChange,
  onOpenRecord,
}: MobileWebHistoryPageProps) {
  const descriptor = createHistoryPageDescriptor(records);
  const activeTheme = historyQuery?.theme;
  const activeLimit = historyQuery?.limit ?? 20;
  const pendingItems = descriptor.items.slice(0, 5);
  const filteredItems = descriptor.items.filter((item) => {
    const matchesTheme = !activeTheme || item.theme === activeTheme;
    if (!matchesTheme) {
      return false;
    }

    switch (activeFilter) {
      case "ready":
        return item.recordReady;
      case "pending":
        return !item.recordReady;
      case "all":
      default:
        return true;
    }
  });

  const getRecordImage = (interpretationId: string) => {
    const record = records.find((candidate) => candidate.interpretation_id === interpretationId);
    return record?.image_url ?? undefined;
  };

  return (
    <MobileWebAppShell
      route={mobileWebRoutes.find((route) => route.id === "history") ?? mobileWebRoutes[0]}
      className="mw-history-shell"
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
      hideHeader
    >
      <div className="mw-history-page">
        <SharedAppTopBar
          title={descriptor.title}
          backLabel="返回上传页"
          onBack={onBackToUpload}
          className="mw-history-topbar"
          style={{ ["--am-app-topbar-bleed" as string]: "0px" }}
        />

        <section className="mw-history-intro">
          <div className="mw-history-intro__halo mw-history-intro__halo--top" aria-hidden="true" />
          <div className="mw-history-intro__halo mw-history-intro__halo--bottom" aria-hidden="true" />
          <div className="mw-history-intro__content">
            <div className="mw-history-intro__sky" />
            <div className="mw-history-intro__moon" />
            <span className="mw-history-intro__cloud mw-history-intro__cloud--one" aria-hidden="true" />
            <span className="mw-history-intro__cloud mw-history-intro__cloud--two" aria-hidden="true" />
            <span className="mw-history-intro__cloud mw-history-intro__cloud--three" aria-hidden="true" />
            <span className="mw-history-intro__star mw-history-intro__star--one" aria-hidden="true" />
            <span className="mw-history-intro__star mw-history-intro__star--two" aria-hidden="true" />
            <span className="mw-history-intro__star mw-history-intro__star--three" aria-hidden="true" />
            <span className="mw-history-intro__star mw-history-intro__star--four" aria-hidden="true" />
            <span className="mw-history-intro__star mw-history-intro__star--five" aria-hidden="true" />
            <span className="mw-history-intro__crane mw-history-intro__crane--one" aria-hidden="true" />
            <span className="mw-history-intro__crane mw-history-intro__crane--two" aria-hidden="true" />
            <span className="mw-history-intro__mountain mw-history-intro__mountain--back-right" aria-hidden="true" />
            <span className="mw-history-intro__mountain mw-history-intro__mountain--back-left" aria-hidden="true" />
            <span className="mw-history-intro__mountain mw-history-intro__mountain--mid" aria-hidden="true" />
            <span className="mw-history-intro__mountain mw-history-intro__mountain--edge" aria-hidden="true" />
            <span className="mw-history-intro__lotus" aria-hidden="true" />
            <h2>查看已生成的解读记录</h2>
            <p>{descriptor.subtitle}</p>
          </div>
          <span className="mw-history-intro__glow-line" aria-hidden="true" />
        </section>

        <section className="mw-history-featured">
          <h2>待查看的解读</h2>
          <p>这里会优先显示还在生成中，或刚生成完成、还没来得及查看的报告。</p>
          {pendingItems.length ? (
            <div className="mw-history-record-list">
              {pendingItems.map((item, index) => {
                const imageUrl = getRecordImage(item.interpretationId);
                const isBusy = actionBusy && activeRecordId === item.interpretationId;

                return (
                  <HistoryRecordCard
                    key={`pending-${item.interpretationId}`}
                    item={item}
                    imageUrl={imageUrl}
                    variant="featured"
                    thumbIndex={index}
                    isBusy={isBusy}
                    disabled={filterBusy || actionBusy}
                    onOpenRecord={onOpenRecord}
                  />
                );
              })}
            </div>
          ) : (
            <p className="mw-history-featured__empty">当前没有生成中的解读。</p>
          )}
        </section>

        <section className="mw-history-all">
          <div className="mw-history-all__header">
            <h2>全部历史记录</h2>
            <div className="mw-history-all__summary">
              <article className="mw-history-all__summary-pill mw-history-all__summary-pill--ready">
                <strong>{descriptor.summary.ready}</strong>
                <span>可查看</span>
              </article>
              <article className="mw-history-all__summary-pill mw-history-all__summary-pill--pending">
                <strong>{descriptor.summary.pending}</strong>
                <span>生成中</span>
              </article>
            </div>
          </div>

          <section className="mw-history-filter-block">
            <h3>状态</h3>
            <div className="mw-history-pill-row mw-history-pill-row--status">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`mw-history-pill mw-history-pill--status${activeFilter === option.id ? " is-active" : ""}`}
                  onClick={() => onFilterChange?.(option.id)}
                  disabled={filterBusy}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="mw-history-filter-block">
            <h3>议题</h3>
            <SharedTopicSelector
              prefix="mw-history-theme"
              options={historyThemeOptions}
              value={activeTheme ?? "all"}
              disabled={filterBusy}
              onChange={(nextValue) => onThemeChange?.(nextValue === "all" ? undefined : nextValue)}
            />
          </section>

          <section className="mw-history-filter-block">
            <h3>时间范围</h3>
            <div className="mw-history-pill-row mw-history-pill-row--limit">
              {limitOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`mw-history-pill mw-history-pill--limit${activeLimit === option.value ? " is-active" : ""}`}
                  onClick={() => onLimitChange?.(option.value)}
                  disabled={filterBusy}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {filteredItems.length ? (
            <div className="mw-history-record-list mw-history-record-list--all">
              {filteredItems.map((item, index) => {
                const imageUrl = getRecordImage(item.interpretationId);
                const isBusy = actionBusy && activeRecordId === item.interpretationId;

                return (
                  <HistoryRecordCard
                    key={item.interpretationId}
                    item={item}
                    imageUrl={imageUrl}
                    variant="default"
                    thumbIndex={index}
                    actionLabelOverride={
                      item.focusReportType === "lite" && item.recordReady && item.availableReportTypes.length === 1
                        ? "升级 Pro"
                        : undefined
                    }
                    isBusy={isBusy}
                    disabled={filterBusy || actionBusy}
                    onOpenRecord={onOpenRecord}
                  />
                );
              })}
            </div>
          ) : (
            <section className="mw-history-empty">
              <p>当前筛选条件下没有记录</p>
              <button
                type="button"
                className="mw-secondary-button"
                onClick={onBackToUpload}
              >
                返回上传页
              </button>
            </section>
          )}
        </section>
      </div>
    </MobileWebAppShell>
  );
}
