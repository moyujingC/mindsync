import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { EvalTab } from "../models/console";
import { getEvalOverview } from "../services/consoleData";

const tabs: Array<{ id: EvalTab; label: string }> = [
  { id: "scoreboard", label: "Scoreboard" },
  { id: "comparisons", label: "Comparisons" },
  { id: "recommendations", label: "Recommendations" },
  { id: "reports", label: "Reports" },
];

export function EvalPage() {
  const { tab } = useParams();
  const [searchParams] = useSearchParams();
  const forceError = searchParams.get("mock") === "error";
  const activeTab = (tab as EvalTab | undefined) ?? "scoreboard";
  const isValidTab = tabs.some((item) => item.id === activeTab);
  const evaluation = useAsyncResource(
    () => getEvalOverview({ forceError }),
    [forceError],
  );

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Eval</span>
          <h1>评测是一级模块，不附属于 provider 详情页</h1>
          <p>
            这里独立承接评分板、比较结果、推荐结论和报告 feed，让 RelayHub 不止是一个普通网关后台。
          </p>
        </div>
      </section>

      <Section title="Eval 子页" description="四个子页都以静态内容承接，不隐藏在别的模块里。">
        <div className="tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              className={`tab${activeTab === tab.id ? " is-active" : ""}`}
              to={`/eval/${tab.id}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {evaluation.status === "loading" ? (
          <EmptyState title="正在加载 Eval 数据" description="正在加载页面数据。" />
        ) : null}
        {evaluation.status === "error" ? (
          <EmptyState
            title="Eval 数据加载失败"
            description={evaluation.error ?? "请稍后重试。"}
          />
        ) : null}
        {evaluation.status === "success" && evaluation.data && !isValidTab ? (
          <EmptyState
            title="Eval 子页不存在"
            description="请使用 Scoreboard / Comparisons / Recommendations / Reports 中的有效深链。"
          />
        ) : null}

        {evaluation.status === "success" && evaluation.data && isValidTab && activeTab === "scoreboard" ? (
          <div className="stack">
            <div className="data-card">
              <span className="mini-label">编码代理任务</span>
              <div className="table-card embedded">
                <table>
                  <thead>
                    <tr>
                      <th>任务类型</th>
                      <th>模型 / provider</th>
                      <th>质量</th>
                      <th>稳定性</th>
                      <th>成本效率</th>
                      <th>结论</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluation.data.scoreboard.coding.map((row) => (
                      <tr key={`${row.task}-${row.contender}`}>
                        <td>{row.task}</td>
                        <td>{row.contender}</td>
                        <td>{row.quality}</td>
                        <td>{row.stability}</td>
                        <td>{row.efficiency}</td>
                        <td>{row.conclusion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="data-card">
              <span className="mini-label">心理疗愈业务任务</span>
              <div className="table-card embedded">
                <table>
                  <thead>
                    <tr>
                      <th>任务类型</th>
                      <th>模型 / provider</th>
                      <th>质量</th>
                      <th>稳定性</th>
                      <th>成本效率</th>
                      <th>结论</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluation.data.scoreboard.therapy.map((row) => (
                      <tr key={`${row.task}-${row.contender}`}>
                        <td>{row.task}</td>
                        <td>{row.contender}</td>
                        <td>{row.quality}</td>
                        <td>{row.stability}</td>
                        <td>{row.efficiency}</td>
                        <td>{row.conclusion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {evaluation.status === "success" && evaluation.data && isValidTab && activeTab === "comparisons" ? (
          <div className="card-grid card-grid-3">
            {evaluation.data.comparisons.map((comparison) => (
              <article key={comparison.title} className="data-card">
                <span className="mini-label">{comparison.task}</span>
                <h4>{comparison.title}</h4>
                <p>{comparison.difference}</p>
                <p className="supporting-text">{comparison.recommendation}</p>
              </article>
            ))}
          </div>
        ) : null}

        {evaluation.status === "success" && evaluation.data && isValidTab && activeTab === "recommendations" ? (
          <div className="card-grid card-grid-2">
            {evaluation.data.recommendations.map((item) => (
              <article key={item.headline} className="data-card">
                <span className="mini-label">{item.category}</span>
                <h4>{item.headline}</h4>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        ) : null}

        {evaluation.status === "success" && evaluation.data && isValidTab && activeTab === "reports" ? (
          <div className="card-grid card-grid-2">
            {evaluation.data.reports.map((report) =>
              report.status === "暂无数据" ? (
                <EmptyState
                  key={report.name}
                  title={report.name}
                  description={report.note}
                />
              ) : (
                <article key={report.name} className="data-card">
                  <span className="mini-label">{report.period}</span>
                  <h4>{report.name}</h4>
                  <p>{report.note}</p>
                  <p className="supporting-text">状态：{report.status}</p>
                </article>
              ),
            )}
          </div>
        ) : null}
      </Section>
    </div>
  );
}
