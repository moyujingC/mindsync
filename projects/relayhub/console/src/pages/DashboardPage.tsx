import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { StatusPill } from "../components/StatusPill";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { getDashboardOverview } from "../services/consoleData";

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const forceError = searchParams.get("mock") === "error";
  const dashboard = useAsyncResource(
    () => getDashboardOverview({ forceError }),
    [forceError],
  );

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>先看环境，再看 provider，最后看建议是否值得执行</h1>
          <p>
            首页优先回答哪些环境在跑、当前最重要的建议是什么，以及哪里已经出现越界风险或透明度问题。
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button-link" to="/environments">
            查看环境枢纽
          </Link>
          <Link className="button-link secondary" to="/eval">
            打开 Eval 一级模块
          </Link>
        </div>
      </section>

      {dashboard.status === "loading" ? (
        <EmptyState title="正在加载首页概览" description="正在加载页面数据。" />
      ) : null}

      {dashboard.status === "error" ? (
        <EmptyState
          title="首页数据加载失败"
          description={dashboard.error ?? "请稍后重试。"}
        />
      ) : null}

      {dashboard.status === "success" && dashboard.data ? (
        <>
          <Section
            title="环境总览"
            description="控制台首页先展示环境，而不是先展示 provider 列表。"
          >
            <div className="card-grid card-grid-3">
              {dashboard.data.environments.map((environment) => (
                <Link
                  key={environment.id}
                  className="data-card interactive-card"
                  to={`/environments/${environment.id}/overview`}
                >
                  <div className="data-card-top">
                    <div>
                      <span className="mini-label">{environment.mode}</span>
                      <h4>{environment.name}</h4>
                    </div>
                    <StatusPill status={environment.status} />
                  </div>
                  <p>{environment.providerScope}</p>
                  <dl className="metric-list">
                    <div>
                      <dt>provider 数</dt>
                      <dd>{environment.providerCount}</dd>
                    </div>
                    <div>
                      <dt>24h 请求量</dt>
                      <dd>{formatNumber(environment.requests24h)}</dd>
                    </div>
                    <div>
                      <dt>成功率</dt>
                      <dd>{environment.successRate}%</dd>
                    </div>
                  </dl>
                  <p className="supporting-text">{environment.recentStatus}</p>
                </Link>
              ))}
            </div>
          </Section>

          <Section
            title="决策摘要"
            description="直接给结论，而不是只堆指标。"
          >
            <div className="card-grid card-grid-2">
              {dashboard.data.decisions.map((decision) => (
                <article key={decision.title} className="data-card">
                  <span className="mini-label">{decision.type}</span>
                  <h4>{decision.title}</h4>
                  <strong className="headline">{decision.target}</strong>
                  <p>{decision.reason}</p>
                  <p className="supporting-text">更新时间：{decision.updatedAt}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="风险提示" description="优先暴露越界风险与观测缺口。">
            <div className="card-grid card-grid-3">
              {dashboard.data.risks.map((risk) => (
                <article key={risk.title} className="data-card">
                  <div className="data-card-top">
                    <span className="mini-label">{risk.environment}</span>
                    <span className="pill pill-risk">{risk.level}</span>
                  </div>
                  <h4>{risk.title}</h4>
                  <p>{risk.note}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="运行指标摘要" description="这里只承担观测摘要，不替代 Usage 模块。">
            <div className="metrics-grid">
              <article className="metric-tile">
                <span>总请求数</span>
                <strong>{formatNumber(dashboard.data.metrics.requests)}</strong>
              </article>
              <article className="metric-tile">
                <span>总 token</span>
                <strong>{formatNumber(dashboard.data.metrics.tokens)}</strong>
              </article>
              <article className="metric-tile">
                <span>平均延迟</span>
                <strong>{dashboard.data.metrics.avgLatency} ms</strong>
              </article>
              <article className="metric-tile">
                <span>P95 延迟</span>
                <strong>{dashboard.data.metrics.p95Latency} ms</strong>
              </article>
              <article className="metric-tile">
                <span>错误率</span>
                <strong>{dashboard.data.metrics.errorRate}%</strong>
              </article>
              <article className="metric-tile">
                <span>估算成本</span>
                <strong>¥{formatNumber(dashboard.data.metrics.cost)}</strong>
              </article>
            </div>
          </Section>

          <Section title="最近运行记录" description="run 记录独立存在，不躲在日志系统里。">
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Run 名称</th>
                    <th>类型</th>
                    <th>环境</th>
                    <th>状态</th>
                    <th>运行时间</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.data.recentRuns.map((run) => (
                    <tr key={run.id}>
                      <td>{run.name}</td>
                      <td>{run.type}</td>
                      <td>{run.environment}</td>
                      <td>
                        <StatusPill status={run.status} />
                      </td>
                      <td>{run.startedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}
