import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { StatusPill } from "../components/StatusPill";
import { environments } from "../fixtures/data";

type EnvironmentTab = "overview" | "providers" | "routes" | "usage" | "policies" | "runs";

const tabs: Array<{ id: EnvironmentTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "providers", label: "Providers" },
  { id: "routes", label: "Routes" },
  { id: "usage", label: "Usage" },
  { id: "policies", label: "Policies" },
  { id: "runs", label: "Recent Runs" },
];

export function EnvironmentsPage() {
  const { environmentId } = useParams();
  const [activeTab, setActiveTab] = useState<EnvironmentTab>("overview");

  const selectedEnvironment = useMemo(() => {
    return (
      environments.find((environment) => environment.id === environmentId) ?? environments[0]
    );
  }, [environmentId]);

  const relatedProviders = useMemo(() => {
    return selectedEnvironment.providerScope;
  }, [selectedEnvironment.providerScope]);

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
        <div className="card-grid card-grid-3">
          {environments.map((environment) => (
            <Link
              key={environment.id}
              className={`data-card interactive-card${
                environment.id === selectedEnvironment.id ? " is-selected" : ""
              }`}
              to={`/environments/${environment.id}`}
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
      </Section>

      <Section
        title={selectedEnvironment.name}
        description={selectedEnvironment.targetNote}
        actions={<StatusPill status={selectedEnvironment.status} />}
      >
        <div className="detail-header">
          <div className="detail-summary">
            <p>{selectedEnvironment.purpose}</p>
            <p className="supporting-text">{relatedProviders}</p>
          </div>
          <div className="inline-metrics">
            <span>{selectedEnvironment.providerCount} 个 provider</span>
            <span>{selectedEnvironment.requests24h} 次请求 / 24h</span>
            <span>{selectedEnvironment.successRate}% 成功率</span>
          </div>
        </div>

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="card-grid card-grid-2">
            <article className="data-card">
              <span className="mini-label">当前目标</span>
              <h4>环境定位</h4>
              <p>{selectedEnvironment.targetNote}</p>
            </article>
            <article className="data-card">
              <span className="mini-label">当前推荐</span>
              <h4>推荐摘要</h4>
              <p>{selectedEnvironment.recommendation}</p>
            </article>
          </div>
        ) : null}

        {activeTab === "providers" ? (
          <div className="data-card">
            <span className="mini-label">provider 范围</span>
            <h4>当前允许范围</h4>
            <p>{selectedEnvironment.providerScope}</p>
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
                {selectedEnvironment.routes.map((route) => (
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
              <strong>{selectedEnvironment.metrics.requests}</strong>
            </article>
            <article className="metric-tile">
              <span>总 token</span>
              <strong>{selectedEnvironment.metrics.tokens}</strong>
            </article>
            <article className="metric-tile">
              <span>平均延迟</span>
              <strong>{selectedEnvironment.metrics.avgLatency} ms</strong>
            </article>
            <article className="metric-tile">
              <span>P95 延迟</span>
              <strong>{selectedEnvironment.metrics.p95Latency} ms</strong>
            </article>
            <article className="metric-tile">
              <span>错误率</span>
              <strong>{selectedEnvironment.metrics.errorRate}%</strong>
            </article>
            <article className="metric-tile">
              <span>估算成本</span>
              <strong>¥{selectedEnvironment.metrics.cost}</strong>
            </article>
          </div>
        ) : null}

        {activeTab === "policies" ? (
          <div className="card-grid card-grid-3">
            {selectedEnvironment.policySummary.map((item) => (
              <article key={item} className="data-card">
                <span className="mini-label">边界说明</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === "runs" ? (
          selectedEnvironment.runs.length > 0 ? (
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
                  {selectedEnvironment.runs.map((run) => (
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
    </div>
  );
}
