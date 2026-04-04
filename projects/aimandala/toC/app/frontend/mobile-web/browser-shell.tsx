import { useMemo, useState } from "react";

import { MobileWebRuntime } from "./runtime";
import type { MobileWebRouteInput } from "./router-plan";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";

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

  const input = useMemo(
    () => createInput(route, draft, interpretationId, userId),
    [draft, interpretationId, route, userId],
  );

  return (
    <div className="browser-shell">
      <aside className="browser-shell__panel">
        <div className="browser-shell__panel-header">
          <p className="eyebrow">一镜一梳 To C</p>
          <h1>mobile-web 开发壳</h1>
          <p className="muted">
            这个宿主壳只负责把当前骨架接到浏览器运行时，方便后续继续长页面与交互。
          </p>
        </div>

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
      </aside>

      <section className="browser-shell__viewport">
        <div className="browser-shell__phone">
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
        </div>
      </section>
    </div>
  );
}
