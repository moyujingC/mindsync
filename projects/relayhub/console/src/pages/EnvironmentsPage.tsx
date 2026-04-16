import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { StatusPill } from "../components/StatusPill";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { EnvironmentTab } from "../models/console";
import { getEnvironment, listEnvironments } from "../services/consoleData";

const tabs: Array<{ id: EnvironmentTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "providers", label: "Providers" },
  { id: "routes", label: "Routes" },
  { id: "usage", label: "Usage" },
  { id: "policies", label: "Policies" },
  { id: "runs", label: "Recent Runs" },
];

export function EnvironmentsPage() {
  const { environmentId, tab } = useParams();
  const [searchParams] = useSearchParams();
  const forceError = searchParams.get("mock") === "error";
  const activeTab = (tab as EnvironmentTab | undefined) ?? "overview";
  const isValidTab = tabs.some((item) => item.id === activeTab);

  const environmentsResource = useAsyncResource(
    () => listEnvironments({ forceError }),
    [forceError],
  );
  const selectedEnvironment = useAsyncResource(
    () => getEnvironment(environmentId ?? "dev-relay", { forceError }),
    [environmentId, forceError],
  );
  const environment = selectedEnvironment.data;

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Environments</span>
          <h1>环境是导航枢纽，不是 provider 的附属筛选条件</h1>
          <p>
            先按开发版、生产版、评测版理解系统，再进入 provider、路由、usage 和 policy。
          </p>
        </div>
      </section>

      <Section title="环境卡列表" description="默认展示 3 类环境，表达它们各自的职责边界。">
        {environmentsResource.status === "loading" ? (
          <EmptyState title="正在加载环境列表" description="只读 mock API 正在返回环境清单。" />
        ) : null}
        {environmentsResource.status === "error" ? (
          <EmptyState
            title="环境列表加载失败"
            description={environmentsResource.error ?? "请检查 mock API 状态。"}
          />
        ) : null}
        {environmentsResource.status === "success" && environmentsResource.data ? (
          <div className="card-grid card-grid-3">
            {environmentsResource.data.map((environment) => (
              <Link
                key={environment.id}
                className={`data-card interactive-card${
                  environment.id === selectedEnvironment.data?.id ? " is-selected" : ""
                }`}
                to={`/environments/${environment.id}/${activeTab}`}
              >
                <div className="data-card-top">
                  <div>
                    <span className="mini-label">{environment.mode}</span>
                    <h4>{environment.name}</h4>
                  </div>
                  <StatusPill status={environment.status} />
                </div>
                <p>{environment.purpose}</p>
                <p className="supporting-text">{environment.providerScope}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </Section>

      {selectedEnvironment.status === "loading" ? (
        <EmptyState title="正在加载环境详情" description="只读 mock API 正在返回环境详情。" />
      ) : null}
      {selectedEnvironment.status === "error" ? (
        <EmptyState
          title="环境详情加载失败"
          description={selectedEnvironment.error ?? "请稍后重试 mock API。"}
        />
      ) : null}
      {selectedEnvironment.status === "not-found" ? (
        <EmptyState
          title="没有找到对应环境"
          description="请检查环境 ID 是否正确，或从环境卡列表重新进入。"
        />
      ) : null}
      {selectedEnvironment.status === "success" && selectedEnvironment.data && !isValidTab ? (
        <EmptyState
          title="环境子页不存在"
          description="请使用 Overview / Providers / Routes / Usage / Policies / Recent Runs 中的有效深链。"
        />
      ) : null}
      {selectedEnvironment.status === "success" && environment && isValidTab ? (
        <Section
          title={environment.name}
          description={environment.targetNote}
          actions={<StatusPill status={environment.status} />}
        >
          <div className="detail-header">
            <div className="detail-summary">
              <p>{environment.purpose}</p>
              <p className="supporting-text">{environment.providerScope}</p>
            </div>
            <div className="inline-metrics">
              <span>{environment.providerCount} 个 provider</span>
              <span>{environment.requests24h} 次请求 / 24h</span>
              <span>{environment.successRate}% 成功率</span>
            </div>
          </div>

          <div className="tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                className={`tab${activeTab === tab.id ? " is-active" : ""}`}
                to={`/environments/${environment.id}/${tab.id}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {activeTab === "overview" ? (
            <div className="card-grid card-grid-2">
              <article className="data-card">
                <span className="mini-label">当前目标</span>
                <h4>环境定位</h4>
                <p>{environment.targetNote}</p>
              </article>
              <article className="data-card">
                <span className="mini-label">当前推荐</span>
                <h4>推荐摘要</h4>
                <p>{environment.recommendation}</p>
              </article>
            </div>
          ) : null}

          {activeTab === "providers" ? (
            <div className="data-card">
              <span className="mini-label">provider 范围</span>
              <h4>当前允许范围</h4>
              <p>{environment.providerScope}</p>
            </div>
          ) : null}

          {activeTab === "routes" ? (
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>任务类型</th>
                    <th>模型</th>
                    <th>Provider</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {environment.routes.map((route) => (
                    <tr key={`${route.taskType}-${route.provider}`}>
                      <td>{route.taskType}</td>
                      <td>{route.model}</td>
                      <td>{route.provider}</td>
                      <td>{route.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "usage" ? (
            <div className="metrics-grid">
              <article className="metric-tile">
                <span>请求量</span>
                <strong>{environment.metrics.requests}</strong>
              </article>
              <article className="metric-tile">
                <span>总 token</span>
                <strong>{environment.metrics.tokens}</strong>
              </article>
              <article className="metric-tile">
                <span>平均延迟</span>
                <strong>{environment.metrics.avgLatency} ms</strong>
              </article>
              <article className="metric-tile">
                <span>P95 延迟</span>
                <strong>{environment.metrics.p95Latency} ms</strong>
              </article>
              <article className="metric-tile">
                <span>错误率</span>
                <strong>{environment.metrics.errorRate}%</strong>
              </article>
              <article className="metric-tile">
                <span>估算成本</span>
                <strong>¥{environment.metrics.cost}</strong>
              </article>
            </div>
          ) : null}

          {activeTab === "policies" ? (
            <div className="card-grid card-grid-3">
              {environment.policySummary.map((item) => (
                <article key={item} className="data-card">
                  <span className="mini-label">边界说明</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          ) : null}

          {activeTab === "runs" ? (
            environment.runs.length > 0 ? (
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Run 名称</th>
                      <th>类型</th>
                      <th>状态</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {environment.runs.map((run) => (
                      <tr key={run.id}>
                        <td>{run.name}</td>
                        <td>{run.type}</td>
                        <td>
                          <StatusPill status={run.status} />
                        </td>
                        <td>{run.startedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="当前还没有可展示的运行记录"
                description="生产版先强调边界和风险，不虚构 benchmark 或报告结果。"
              />
            )
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
