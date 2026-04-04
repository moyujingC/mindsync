import { useMemo, useState } from "react";

import { MobileWebApp } from "./app";
import { createPreviewAppProps, createPreviewDetectionFixture } from "./fixtures";
import { runMobileWebLiteFlow } from "./controller";
import { MobileWebRuntime } from "./runtime";
import type { MobileWebRouteInput } from "./router-plan";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";
import { toStartCreatePayload } from "./state";
import type { DetectCirclesResponse, MandalaFlowState } from "../shared/types";
import { detectCircles } from "../shared/api";

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

function createInput(
  route: MobileWebRouteId,
  draft: MobileWebUploadDraft,
  interpretationId: string,
  userId: string,
): MobileWebRouteInput {
  switch (route) {
    case "upload":
      return {
        route,
        params: {
          draft,
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
        },
      };

    case "history":
      return {
        route,
        params: {
          userId,
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

  const input = useMemo(
    () => createInput(route, draft, interpretationId, userId),
    [draft, interpretationId, route, userId],
  );
  const previewProps = useMemo(
    () => createPreviewAppProps(route, draft, previewDetection, previewFlowState),
    [draft, previewDetection, previewFlowState, route],
  );

  function handlePreviewPrimaryAction() {
    if (route === "loading") {
      setRoute("report");
      return;
    }

    if (route === "report" || route === "upgrade") {
      setRoute("history");
    }
  }

  function handlePreviewSecondaryAction() {
    if (route === "loading" || route === "report" || route === "upgrade") {
      setPreviewFlowState(null);
      setRoute("upload");
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
                    setDraft((current) => ({
                      ...current,
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
              environmentLabel="当前为本地预览模式"
              environmentDetail="页面里的 loading、report、history 仍以占位数据为主；上传页的三圈检测可切到真实接口触发。"
              environmentTone="preview"
              onUploadDraftChange={(patch) => {
                setDraft((current) => ({
                  ...current,
                  ...patch,
                }));
                if (patch.imagePath !== undefined) {
                  setPreviewDetection(null);
                  setPreviewDetectError(null);
                  setPreviewFlowState(null);
                }
              }}
              onUploadContinue={async () => {
                setPreviewFlowState(null);
                setRoute("loading");
                if (draft.imagePath.startsWith("browser-file:")) {
                  return;
                }

                try {
                  const result = await runMobileWebLiteFlow(
                    toStartCreatePayload(
                      {
                        ...draft,
                        innerRadius: previewDetection?.inner_radius,
                        middleRadius: previewDetection?.middle_radius,
                      },
                      userId,
                    ),
                  );
                  setPreviewFlowState(result.state);
                  setRoute("report");
                } catch {
                  // runMobileWebLiteFlow already normalizes most failures into state,
                  // so this is a last-resort fallback for unexpected exceptions.
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
                  const shouldUseFixture = draft.imagePath.startsWith("browser-file:");
                  const detection = shouldUseFixture
                    ? createPreviewDetectionFixture()
                    : await detectCircles({
                        image_path: draft.imagePath,
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
              onHistoryBackToUpload={() => {
                setRoute("upload");
              }}
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
