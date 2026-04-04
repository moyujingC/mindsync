import { useEffect, useMemo, useState } from "react";

import { MobileWebApp } from "./app";
import { createPreviewAppProps } from "./fixtures";
import {
  openMobileWebUpgradeEntry,
  pollMobileWebReportUntilReady,
  refreshMobileWebReport,
  runMobileWebLiteFlow,
} from "./controller";
import { MobileWebRuntime } from "./runtime";
import type { MobileWebRouteInput } from "./router-plan";
import type { MobileWebRouteId } from "./routes";
import {
  getDraftUploadImageResponse,
  mergeMobileWebUploadDraft,
  toMobileWebUploadAssetRef,
  toStartCreatePayload,
  type MobileWebUploadDraft,
} from "./state";
import type { HistoryFilterId } from "./components/history-cards";
import type {
  DetectCirclesResponse,
  InterpretationListQuery,
  InterpretationRecordResponse,
  MandalaFlowState,
  UploadImageResponse,
} from "../shared/types";
import { detectCircles, getInterpretationList, uploadImage } from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";

const defaultDraft: MobileWebUploadDraft = {
  imagePath: "/tmp/example-mandala.png",
  theme: "general",
  paintingIntention: "",
  paintingFeeling: "",
};

const routeOptions: Array<{ label: string; value: MobileWebRouteId }> = [
  { label: "上传", value: "upload" },
  { label: "加载", value: "loading" },
  { label: "报告", value: "report" },
  { label: "历史", value: "history" },
  { label: "Pro 引导", value: "upgrade" },
];

const previewPollingIntervalMs = 1500;
const previewPollingMaxAttempts = 8;

async function ensureUploadedImagePath(
  draft: MobileWebUploadDraft,
  onResolved: (uploaded: UploadImageResponse) => void,
): Promise<UploadImageResponse> {
  const existingUpload = getDraftUploadImageResponse(draft);
  if (existingUpload) {
    return existingUpload;
  }

  if (draft.browserFile) {
    const uploaded = await uploadImage(draft.browserFile);
    onResolved(uploaded);
    return uploaded;
  }

  const fallbackUpload = {
    success: true,
    image_path: draft.imagePath,
    storage_backend: "path",
    storage_key: draft.imagePath,
    original_filename: draft.imagePath.split("/").pop() || draft.imagePath,
    content_type: null,
    size_bytes: 0,
    image_url: null,
  };
  onResolved(fallbackUpload);
  return fallbackUpload;
}

function createInput(
  route: MobileWebRouteId,
  draft: MobileWebUploadDraft,
  interpretationId: string,
  userId: string,
  historyQuery: InterpretationListQuery,
): MobileWebRouteInput {
  switch (route) {
    case "upload":
      return {
        route,
        params: {
          draft,
          userId,
        },
      };

    case "loading":
      return {
        route,
        params: {
          draft,
          userId,
        },
      };

    case "report":
    case "upgrade":
      return {
        route,
        params: {
          interpretationId,
          uploadDraft: draft,
        },
      };

    case "history":
      return {
        route,
        params: {
          userId,
          uploadDraft: draft,
          historyQuery,
        },
      };
  }
}

export function MobileWebBrowserShell() {
  const [route, setRoute] = useState<MobileWebRouteId>("upload");
  const [draft, setDraft] = useState<MobileWebUploadDraft>(defaultDraft);
  const [interpretationId, setInterpretationId] = useState("demo-interpretation-id");
  const [userId, setUserId] = useState("demo-user-id");
  const [previewMode, setPreviewMode] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [previewDetection, setPreviewDetection] =
    useState<DetectCirclesResponse | null>(null);
  const [previewDetecting, setPreviewDetecting] = useState(false);
  const [previewDetectError, setPreviewDetectError] = useState<string | null>(null);
  const [previewFlowState, setPreviewFlowState] =
    useState<MandalaFlowState | null>(null);
  const [previewFlowRunning, setPreviewFlowRunning] = useState(false);
  const [previewHistoryRecords, setPreviewHistoryRecords] =
    useState<InterpretationRecordResponse[] | null>(null);
  const [previewHistoryQuery, setPreviewHistoryQuery] =
    useState<InterpretationListQuery>({ filter: "all", limit: 20 });
  const [previewHistoryStatusLabel, setPreviewHistoryStatusLabel] =
    useState<string | null>(null);
  const [previewHistoryStatusDetail, setPreviewHistoryStatusDetail] =
    useState<string | null>(null);
  const [previewHistoryStatusTone, setPreviewHistoryStatusTone] =
    useState<"preview" | "runtime">("preview");
  const [previewHistoryOpeningId, setPreviewHistoryOpeningId] =
    useState<string | null>(null);

  const input = useMemo(
    () => createInput(route, draft, interpretationId, userId, {
      filter: (previewHistoryQuery.filter as HistoryFilterId | undefined) ?? "all",
      limit: previewHistoryQuery.limit ?? 20,
      theme: previewHistoryQuery.theme,
    }),
    [draft, interpretationId, previewHistoryQuery.filter, previewHistoryQuery.limit, previewHistoryQuery.theme, route, userId],
  );
  const previewProps = useMemo(
    () =>
      createPreviewAppProps(
        route,
        draft,
        previewDetection,
        previewFlowState,
        previewHistoryRecords,
      ),
    [draft, previewDetection, previewFlowState, previewHistoryRecords, route],
  );

  async function refreshPreviewHistory(nextQuery: InterpretationListQuery) {
    if (draft.browserFile && !draft.uploadAsset) {
      setPreviewHistoryStatusLabel("当前显示占位历史记录");
      setPreviewHistoryStatusDetail("当前浏览器文件还没完成上传换路径，因此历史页先不请求真实接口。");
      setPreviewHistoryStatusTone("preview");
      setPreviewHistoryRecords(null);
      return;
    }

    try {
      const records = await getInterpretationList(userId, nextQuery);
      setPreviewHistoryRecords(records);
      setPreviewHistoryStatusLabel("当前显示真实历史记录");
      setPreviewHistoryStatusDetail("历史页已按当前查询条件重新请求真实记录。");
      setPreviewHistoryStatusTone("runtime");
    } catch (error) {
      setPreviewHistoryRecords(null);
      setPreviewHistoryStatusLabel("历史记录已回退到占位数据");
      setPreviewHistoryStatusDetail(
        `真实历史拉取失败：${error instanceof Error ? error.message : "unknown error"}`,
      );
      setPreviewHistoryStatusTone("preview");
    }
  }

  useEffect(() => {
    if (!previewMode || route !== "loading") {
      return;
    }

    const currentInterpretationId =
      previewFlowState?.interpretation?.interpretation_id;
    if (!currentInterpretationId) {
      return;
    }

    let cancelled = false;

    setPreviewFlowRunning(true);
    void pollMobileWebReportUntilReady(
      currentInterpretationId,
      previewFlowState,
      {
        intervalMs: previewPollingIntervalMs,
        maxAttempts: previewPollingMaxAttempts,
        onTick: (snapshot) => {
          if (!cancelled) {
            setPreviewFlowState(snapshot.state);
          }
        },
      },
    )
      .then(async (snapshot) => {
        if (cancelled) {
          return;
        }

        setPreviewFlowState(snapshot.state);

        if (snapshot.state.step !== "liteGenerating") {
          try {
            const records = await getInterpretationList(userId, {
              filter: previewHistoryQuery.filter as HistoryFilterId | undefined,
              limit: previewHistoryQuery.limit,
              theme: previewHistoryQuery.theme,
            });
            if (!cancelled) {
              setPreviewHistoryRecords(records);
              setPreviewHistoryStatusLabel("当前显示真实历史记录");
              setPreviewHistoryStatusDetail("自动轮询完成后，真实 Lite 结果已尝试同步回历史列表。");
              setPreviewHistoryStatusTone("runtime");
            }
          } catch {
            if (!cancelled) {
              setPreviewHistoryRecords(null);
              setPreviewHistoryStatusLabel("历史记录暂时回退到占位数据");
              setPreviewHistoryStatusDetail("Lite 结果已刷新完成，但历史列表拉取失败，因此仍显示 fixture。");
              setPreviewHistoryStatusTone("preview");
            }
          }

          if (!cancelled) {
            setRoute("report");
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewFlowRunning(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [previewFlowState?.interpretation?.interpretation_id, previewMode, route, userId]);

  async function handlePreviewPrimaryAction() {
    if (route === "loading") {
      if (previewFlowRunning) {
        return;
      }
      const interpretationId = previewFlowState?.interpretation?.interpretation_id;
      if (interpretationId) {
        setPreviewFlowRunning(true);
        try {
          const refreshed = await refreshMobileWebReport(
            interpretationId,
            previewFlowState,
          );
          setPreviewFlowState(refreshed.state);
          if (refreshed.state.step !== "liteGenerating") {
            setRoute("report");
          }
        } finally {
          setPreviewFlowRunning(false);
        }
        return;
      }
      setRoute("report");
      return;
    }

    if (route === "report" || route === "upgrade") {
      if (previewFlowState?.step === "error") {
        const interpretationId = previewFlowState.interpretation?.interpretation_id;
        if (interpretationId) {
          setPreviewFlowRunning(true);
          try {
            const refreshed = await refreshMobileWebReport(
              interpretationId,
              previewFlowState,
            );
            setPreviewFlowState(refreshed.state);
            if (refreshed.state.step === "liteGenerating") {
              setRoute("loading");
            }
          } finally {
            setPreviewFlowRunning(false);
          }
          return;
        }

        setPreviewFlowState(null);
        setRoute("upload");
        return;
      }

      const interpretationId = previewFlowState?.interpretation?.interpretation_id;
      const canOpenUpgrade = Boolean(
        route === "report" &&
        interpretationId &&
        (previewFlowState?.report?.can_upgrade || previewFlowState?.status?.can_upgrade)
      );

      if (canOpenUpgrade && interpretationId) {
        setPreviewFlowRunning(true);
        try {
          const upgraded = await openMobileWebUpgradeEntry(
            interpretationId,
            previewFlowState ?? initialMandalaFlowState,
          );
          setPreviewFlowState(upgraded.state);
          setRoute("upgrade");
        } finally {
          setPreviewFlowRunning(false);
        }
        return;
      }

      setRoute("history");
      if (!draft.browserFile || draft.uploadAsset) {
        void refreshPreviewHistory(previewHistoryQuery);
      } else {
        setPreviewHistoryStatusLabel("当前显示占位历史记录");
        setPreviewHistoryStatusDetail("当前浏览器文件还没完成上传换路径，因此历史页先不请求真实接口。");
        setPreviewHistoryStatusTone("preview");
      }
    }
  }

  function handlePreviewSecondaryAction() {
    if (route === "loading" || route === "report" || route === "upgrade") {
    setPreviewFlowState(null);
    setPreviewHistoryRecords(null);
    setPreviewHistoryQuery({ filter: "all", limit: 20 });
    setPreviewHistoryStatusLabel(null);
    setPreviewHistoryStatusDetail(null);
    setPreviewHistoryOpeningId(null);
    setRoute("upload");
  }
  }

  async function handlePreviewOpenHistoryRecord(
    interpretationId: string,
    canOpenReport: boolean,
  ) {
    if (previewFlowRunning) {
      return;
    }

    setPreviewFlowRunning(true);
    setPreviewHistoryOpeningId(interpretationId);
    try {
      const refreshed = await refreshMobileWebReport(
        interpretationId,
        initialMandalaFlowState,
      );
      setPreviewFlowState(refreshed.state);
      setInterpretationId(interpretationId);
      setRoute(
        canOpenReport || refreshed.state.step !== "liteGenerating"
          ? "report"
          : "loading",
      );
    } finally {
      setPreviewHistoryOpeningId(null);
      setPreviewFlowRunning(false);
    }
  }

  return (
    <div className="browser-shell">
      <section className="browser-shell__viewport">
        <div className="browser-shell__devbar">
          <div className="browser-shell__devbar-copy">
            <p className="eyebrow">一镜一梳 To C</p>
            <strong>mobile-web dev shell</strong>
            <span className="muted">
              开发辅助层，正式产品界面只看手机画面。
            </span>
          </div>

          <button
            type="button"
            className="browser-shell__toggle"
            onClick={() => {
              setControlsOpen((current) => !current);
            }}
          >
            {controlsOpen ? "收起开发控制" : "展开开发控制"}
          </button>
        </div>

        {controlsOpen ? (
          <aside className="browser-shell__panel browser-shell__panel--inline">
            <div className="browser-shell__panel-header">
              <h2>开发控制台</h2>
              <p className="muted">
                这里只用于本地预览和联调，不属于正式 mobile-web 页面。
              </p>
            </div>

            <div className="browser-shell__controls">
              <label className="field field--checkbox">
                <input
                  type="checkbox"
                  checked={previewMode}
                  onChange={(event) => {
                    setPreviewMode(event.target.checked);
                  }}
                />
                <span>使用本地预览模式（不请求后端）</span>
              </label>

              <label className="field">
                <span>路由</span>
                <select
                  value={route}
                  onChange={(event) => {
                    setRoute(event.target.value as MobileWebRouteId);
                  }}
                >
                  {routeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>图片路径</span>
                <input
                  value={draft.imagePath}
                  onChange={(event) => {
                    setDraft((current) => mergeMobileWebUploadDraft(current, {
                      imagePath: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>主题</span>
                <input
                  value={draft.theme}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      theme: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>创作意图</span>
                <textarea
                  rows={3}
                  value={draft.paintingIntention}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      paintingIntention: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>创作感受</span>
                <textarea
                  rows={3}
                  value={draft.paintingFeeling}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      paintingFeeling: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>interpretationId</span>
                <input
                  value={interpretationId}
                  onChange={(event) => {
                    setInterpretationId(event.target.value);
                  }}
                />
              </label>

              <label className="field">
                <span>userId</span>
                <input
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                  }}
                />
              </label>
            </div>
          </aside>
        ) : null}

        <div className="browser-shell__phone">
          {previewMode ? (
            <MobileWebApp
              {...previewProps}
              uploadDraft={draft}
              uploadDetection={previewDetection}
              uploadDetecting={previewDetecting}
              uploadDetectError={previewDetectError}
              activeHistoryFilter={(previewHistoryQuery.filter as HistoryFilterId | undefined) ?? "all"}
              historyQuery={previewHistoryQuery}
              historyActionBusy={previewFlowRunning && route === "history"}
              activeHistoryRecordId={previewHistoryOpeningId}
              historyStatusLabel={previewHistoryStatusLabel ?? undefined}
              historyStatusDetail={previewHistoryStatusDetail ?? undefined}
              historyStatusTone={previewHistoryStatusTone}
              environmentLabel="当前为本地预览模式"
              environmentDetail={
                previewFlowRunning
                  ? "当前正在尝试刷新或执行真实 Lite 主路径，请先等待 create/status/report 链路返回。"
                  : "页面里的 loading、report、history 仍以占位数据为主；上传页的三圈检测可切到真实接口触发。"
              }
              environmentTone="preview"
              onUploadDraftChange={(patch) => {
                setDraft((current) => mergeMobileWebUploadDraft(current, patch));
                if (patch.imagePath !== undefined) {
                  setPreviewDetection(null);
                  setPreviewDetectError(null);
                  setPreviewFlowState(null);
                  setPreviewHistoryRecords(null);
                  setPreviewHistoryQuery({ filter: "all", limit: 20 });
                  setPreviewHistoryStatusLabel(null);
                  setPreviewHistoryStatusDetail(null);
                }
              }}
              onUploadContinue={async () => {
                setPreviewFlowState(null);
                setRoute("loading");

                setPreviewFlowRunning(true);
                try {
                  const resolvedImagePath = await ensureUploadedImagePath(
                    draft,
                    (uploaded) => {
                      setDraft((current) => ({
                        ...current,
                        uploadAsset: toMobileWebUploadAssetRef(uploaded),
                      }));
                    },
                  );
                  const result = await runMobileWebLiteFlow(
                    toStartCreatePayload(
                      {
                        ...draft,
                        uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
                        innerRadius: previewDetection?.inner_radius,
                        middleRadius: previewDetection?.middle_radius,
                      },
                      userId,
                    ),
                  );
                  setPreviewFlowState(result.state);
                  if (result.state.step === "liteGenerating") {
                    setRoute("loading");
                    return;
                  }

                  try {
                    const records = await getInterpretationList(userId, {
                      filter: previewHistoryQuery.filter as HistoryFilterId | undefined,
                      limit: previewHistoryQuery.limit,
                      theme: previewHistoryQuery.theme,
                    });
                    setPreviewHistoryRecords(records);
                    setPreviewHistoryStatusLabel("当前显示真实历史记录");
                    setPreviewHistoryStatusDetail("刚完成的主路径结果已尝试回流到真实历史列表。");
                    setPreviewHistoryStatusTone("runtime");
                  } catch {
                    setPreviewHistoryRecords(null);
                    setPreviewHistoryStatusLabel("历史记录暂时回退到占位数据");
                    setPreviewHistoryStatusDetail("真实 Lite 主路径已执行，但历史列表拉取失败，因此仍显示 fixture。");
                    setPreviewHistoryStatusTone("preview");
                  }
                  setRoute("report");
                } catch {
                  // runMobileWebLiteFlow already normalizes most failures into state,
                  // so this is a last-resort fallback for unexpected exceptions.
                } finally {
                  setPreviewFlowRunning(false);
                }
              }}
              onUploadPreviewDetect={async () => {
                if (!draft.imagePath) {
                  setPreviewDetectError("请先选择一张画作，再触发三圈检测。");
                  return;
                }

                setPreviewDetecting(true);
                setPreviewDetectError(null);

                try {
                  const resolvedImagePath = await ensureUploadedImagePath(
                    draft,
                    (uploaded) => {
                      setDraft((current) => ({
                        ...current,
                        uploadAsset: toMobileWebUploadAssetRef(uploaded),
                      }));
                    },
                  );
                  const detection = await detectCircles({
                    image_path: resolvedImagePath.image_path,
                  });
                  setPreviewDetection(detection);
                } catch (error) {
                  setPreviewDetectError(
                    error instanceof Error ? error.message : "三圈检测失败",
                  );
                  setPreviewDetection(null);
                } finally {
                  setPreviewDetecting(false);
                }
              }}
              onReportPrimaryAction={handlePreviewPrimaryAction}
              onReportSecondaryAction={handlePreviewSecondaryAction}
              reportPrimaryDisabled={route === "loading" && previewFlowRunning}
              onHistoryBackToUpload={() => {
                setRoute("upload");
              }}
              onHistoryFilterChange={(filter) => {
                const nextQuery = {
                  ...previewHistoryQuery,
                  filter,
                };
                setPreviewHistoryQuery((current) => ({
                  ...current,
                  filter,
                }));
                if (route === "history") {
                  void refreshPreviewHistory(nextQuery);
                }
              }}
              onHistoryThemeChange={(theme) => {
                const nextQuery = {
                  ...previewHistoryQuery,
                  theme,
                };
                setPreviewHistoryQuery((current) => ({
                  ...current,
                  theme,
                }));
                if (route === "history") {
                  void refreshPreviewHistory(nextQuery);
                }
              }}
              onHistoryLimitChange={(limit) => {
                const nextQuery = {
                  ...previewHistoryQuery,
                  limit,
                };
                setPreviewHistoryQuery((current) => ({
                  ...current,
                  limit,
                }));
                if (route === "history") {
                  void refreshPreviewHistory(nextQuery);
                }
              }}
              onHistoryOpenRecord={handlePreviewOpenHistoryRecord}
            />
          ) : (
            <MobileWebRuntime
              input={input}
              loadingFallback={<div className="runtime-state">正在装配 mobile-web 路由...</div>}
              errorFallback={(message) => (
                <div className="runtime-state runtime-state--error">
                  <h2>路由装配失败</h2>
                  <p>{message}</p>
                </div>
              )}
            />
          )}
        </div>
      </section>
    </div>
  );
}
