import { MobileWebAppShell } from "../app-shell";
import { createHistoryPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import { HistoryRecordCard, type HistoryFilterId } from "../components/history-cards";
import { SharedAppTopBar, SharedTopicSelector, type SharedTopicSelectorOption } from "../../shared/ui";
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
  {
    value: "father_relationship",
    label: "父亲",
    subLabel: "关系",
    icon: [["path", { d: "M16 21a4 4 0 0 0-8 0", key: "us1" }], ["circle", { cx: "12", cy: "9", r: "3", key: "us2" }], ["path", { d: "M22 21a4 4 0 0 0-3-3.87", key: "us3" }], ["path", { d: "M2 21a4 4 0 0 1 3-3.87", key: "us4" }]],
  },
  {
    value: "mother_relationship",
    label: "母亲",
    subLabel: "关系",
    icon: [["path", { d: "M18 21a6 6 0 0 0-12 0", key: "u1" }], ["circle", { cx: "12", cy: "8", r: "4", key: "u2" }]],
  },
  {
    value: "intimate_relationship",
    label: "亲密",
    subLabel: "关系",
    icon: [["path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z", key: "c3ymky" }]],
  },
  {
    value: "parent_child_relationship",
    label: "亲子",
    subLabel: "关系",
    icon: [["path", { d: "M9 12h6", key: "b1" }], ["path", { d: "M10 16h4", key: "b2" }], ["circle", { cx: "12", cy: "10", r: "5", key: "b3" }], ["path", { d: "M10 4.5c.8-1 2.2-1.5 3.5-1", key: "b4" }]],
  },
  {
    value: "wealth_career_group",
    label: "财富",
    subLabel: "事业",
    icon: [["circle", { cx: "8", cy: "8", r: "6", key: "3yglwk" }], ["path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18", key: "t5s6rm" }], ["path", { d: "M7 6h1v4", key: "1obek4" }], ["path", { d: "m16.71 13.88.7.71-2.82 2.82", key: "1rbuyh" }]],
  },
  {
    value: "body_health",
    label: "身体",
    subLabel: "健康",
    icon: [["path", { d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2", key: "169zse" }]],
  },
  {
    value: "personal_growth",
    label: "个人",
    subLabel: "成长",
    icon: [["path", { d: "M2 21a8 8 0 0 1 12 0", key: "ur1" }], ["circle", { cx: "8", cy: "8", r: "4", key: "ur2" }], ["path", { d: "M14 21a6 6 0 0 1 8 0", key: "ur3" }], ["circle", { cx: "18", cy: "9", r: "3", key: "ur4" }]],
  },
] as const;

const limitOptions = [
  { kind: "meta", label: "最近几月" },
  { kind: "meta", label: "自定义范围" },
  { value: 10, label: "1 个月" },
  { value: 20, label: "3 个月" },
  { value: 50, label: "6 个月" },
  { value: 100, label: "12 个月" },
] as const;

const statusOptions: Array<{ id: HistoryFilterId; label: string }> = [
  { id: "all", label: "全部" },
  { id: "ready", label: "可查看" },
  { id: "review", label: "待查看" },
  { id: "pending", label: "生成中" },
];

function matchesHistoryThemeFilter(itemTheme: string, activeTheme?: string) {
  if (!activeTheme) {
    return true;
  }

  if (activeTheme === "wealth_career_group") {
    return itemTheme === "wealth" || itemTheme === "wealth_career" || itemTheme === "career_development";
  }

  return itemTheme === activeTheme;
}

function getHistoryThemeValue(activeTheme?: string) {
  if (activeTheme === "wealth" || activeTheme === "wealth_career" || activeTheme === "career_development") {
    return "wealth_career_group";
  }

  return activeTheme ?? "all";
}

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
    const matchesTheme = matchesHistoryThemeFilter(item.theme, activeTheme);
    if (!matchesTheme) {
      return false;
    }

    switch (activeFilter) {
      case "ready":
        return item.recordReady;
      case "review":
        return pendingItems.some((pendingItem) => pendingItem.interpretationId === item.interpretationId);
      case "pending":
        return !item.recordReady;
      case "all":
      default:
        return true;
    }
  });
  const filteredSessions = Array.from(
    filteredItems.reduce((map, item) => {
      const key = `${item.themeLabel}__${item.subtitle}`;
      const existing = map.get(key);
      if (!existing || (existing.focusReportType === "lite" && item.focusReportType === "pro")) {
        map.set(key, item);
      }
      return map;
    }, new Map<string, typeof descriptor.items[number]>()),
  ).map(([, item]) => item);

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

        <div className="mw-history-separator" aria-hidden="true">
          <span />
        </div>

        <section className="mw-history-all">
          <h2>全部历史记录</h2>

          <div className="mw-history-summary">
            <article className="mw-history-summary__card mw-history-summary__card--ready">
              <strong>{descriptor.summary.ready}</strong>
              <span>可查看</span>
            </article>
            <article className="mw-history-summary__card">
              <strong>{descriptor.summary.pending}</strong>
              <span>生成中</span>
            </article>
          </div>

          <div className="mw-history-separator mw-history-separator--compact" aria-hidden="true">
            <span />
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
              value={getHistoryThemeValue(activeTheme)}
              disabled={filterBusy}
              onChange={(nextValue) => onThemeChange?.(nextValue === "all" ? undefined : nextValue)}
            />
          </section>

          <section className="mw-history-filter-block">
            <h3>时间范围</h3>
            <div className="mw-history-pill-row mw-history-pill-row--limit">
              {limitOptions.map((option) => (
                <button
                  key={"value" in option ? option.value : option.label}
                  type="button"
                  className={`mw-history-pill mw-history-pill--limit${"value" in option && activeLimit === option.value ? " is-active" : ""}`}
                  onClick={() => {
                    if ("value" in option) {
                      onLimitChange?.(option.value);
                    }
                  }}
                  disabled={filterBusy}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {filteredSessions.length ? (
            <div className="mw-history-record-list mw-history-record-list--all">
              {filteredSessions.map((item, index) => {
                const imageUrl = getRecordImage(item.interpretationId);
                const isBusy = actionBusy && activeRecordId === item.interpretationId;
                const isPendingPreviewItem = pendingItems.some((pendingItem) => pendingItem.interpretationId === item.interpretationId);

                return (
                  <HistoryRecordCard
                    key={item.interpretationId}
                    item={item}
                    imageUrl={imageUrl}
                    variant="default"
                    thumbIndex={index}
                    actionLabelOverride={
                      item.focusReportType === "lite" &&
                      item.recordReady &&
                      item.availableReportTypes.length === 1 &&
                      !isPendingPreviewItem
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

          <div className="mw-history-footer-action">
            <button
              type="button"
              className="mw-history-footer-action__button"
              onClick={onBackToUpload}
              disabled={filterBusy || actionBusy}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              <span>返回上传页</span>
            </button>
          </div>
        </section>
      </div>
    </MobileWebAppShell>
  );
}
