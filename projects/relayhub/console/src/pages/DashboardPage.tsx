import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { getGovernanceOverview } from "../services/controlPlane";

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const version = searchParams.get("mock") === "error" ? "error" : "ready";
  const dashboard = useAsyncResource(() => {
    if (version === "error") {
      return Promise.reject(new Error("RelayHub mock dashboard error"));
    }

    return getGovernanceOverview();
  }, [version]);

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>首页先回答三件事：模型激活了没有、任务绑好了没有、运行记录够不够判断</h1>
          <p>
            旧的环境总览和 provider 治理叙事已经降级。当前首页只服务最小闭环，不再假装你已经拥有完整治理后台。
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button-link" to="/models">
            打开模型库
          </Link>
          <Link className="button-link secondary" to="/tasks">
            进入任务库
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
          <Section title="当前闭环进度" description="先判断模型、任务和记录三件事是否已经连起来。">
            <div className="metrics-grid">
              <article className="metric-tile">
                <span>模型条目</span>
                <strong>{dashboard.data.totalEntries}</strong>
              </article>
              <article className="metric-tile">
                <span>已激活模型</span>
                <strong>{dashboard.data.activeEntries}</strong>
              </article>
              <article className="metric-tile">
                <span>待测试模型</span>
                <strong>{dashboard.data.configuredPendingTest}</strong>
              </article>
              <article className="metric-tile">
                <span>任务总数</span>
                <strong>{dashboard.data.totalTasks}</strong>
              </article>
              <article className="metric-tile">
                <span>已绑定任务</span>
                <strong>{dashboard.data.tasksBound}</strong>
              </article>
              <article className="metric-tile">
                <span>运行记录</span>
                <strong>{dashboard.data.recentRunsCount}</strong>
              </article>
            </div>
          </Section>

          <Section title="收口提示" description="当前首页只给下一步动作，不再讲完整治理哲学。">
            <div className="card-grid card-grid-3">
              {dashboard.data.highlights.map((item) => (
                <article key={item} className="data-card">
                  <span className="mini-label">当前重点</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="下一步入口" description="首页直接把主路径入口放出来。">
            <div className="card-grid card-grid-3">
              <Link className="data-card interactive-card" to="/models">
                <span className="mini-label">第一步</span>
                <h4>添加模型并激活</h4>
                <p>先去模型库补 API Key，然后手动测试连接。</p>
              </Link>
              <Link className="data-card interactive-card" to="/tasks">
                <span className="mini-label">第二步</span>
                <h4>给任务绑定模型</h4>
                <p>把通用工具和业务任务收成模板，再确定默认模型。</p>
              </Link>
              <Link className="data-card interactive-card" to="/runs">
                <span className="mini-label">第三步</span>
                <h4>录入运行记录</h4>
                <p>先积累最小样本，再看哪个模型更适合继续用。</p>
              </Link>
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}
