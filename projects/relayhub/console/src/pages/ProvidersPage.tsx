import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { StatusPill } from "../components/StatusPill";
import { providers, type ProviderKind, type TransparencyState } from "../fixtures/data";

type HealthFilter = "全部" | "healthy" | "degraded" | "risk" | "idle";

function matchesFilter<T extends string>(value: T, current: T | "全部") {
  return current === "全部" || current === value;
}

export function ProvidersPage() {
  const [selectedId, setSelectedId] = useState(providers[0].id);
  const [typeFilter, setTypeFilter] = useState<ProviderKind | "全部">("全部");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("全部");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("全部");
  const [transparencyFilter, setTransparencyFilter] = useState<TransparencyState | "全部">("全部");

  const environmentOptions = ["全部", "开发版", "心理疗愈生产版", "评测版"];
  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const matchesEnvironment =
        environmentFilter === "全部" ||
        provider.availableEnvironments.includes(environmentFilter);

      return (
        matchesFilter(provider.kind, typeFilter) &&
        matchesEnvironment &&
        matchesFilter(provider.health, healthFilter) &&
        matchesFilter(provider.transparency, transparencyFilter)
      );
    });
  }, [environmentFilter, healthFilter, transparencyFilter, typeFilter]);

  const selectedProvider =
    filteredProviders.find((provider) => provider.id === selectedId) ?? filteredProviders[0] ?? null;

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Providers</span>
          <h1>按上游治理看 provider，而不是按模型商店看 provider</h1>
          <p>
            页面重点是健康度、透明度、可用环境和当前适用建议，而不是引导进入真实配置编辑。
          </p>
        </div>
      </section>

      <Section title="筛选条件" description="覆盖类型、环境、健康状态与透明度四个视角。">
        <div className="filter-row">
          {(["全部", "第三方中转", "国产模型", "免费国外 API"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip${typeFilter === item ? " is-active" : ""}`}
              onClick={() => setTypeFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {environmentOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip${environmentFilter === item ? " is-active" : ""}`}
              onClick={() => setEnvironmentFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {(["全部", "healthy", "degraded", "risk", "idle"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip${healthFilter === item ? " is-active" : ""}`}
              onClick={() => setHealthFilter(item)}
            >
              {item === "全部" ? item : `状态:${item}`}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {(["全部", "完整", "部分缺失", "暂无"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip${transparencyFilter === item ? " is-active" : ""}`}
              onClick={() => setTransparencyFilter(item)}
            >
              {item === "全部" ? item : `透明度:${item}`}
            </button>
          ))}
        </div>
      </Section>

      <Section title="provider 列表" description="核心字段与当前适用建议必须直接可见。">
        {filteredProviders.length > 0 ? (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类型</th>
                  <th>可用环境</th>
                  <th>健康状态</th>
                  <th>透明度</th>
                  <th>错误率</th>
                  <th>P95 延迟</th>
                  <th>当前适用建议</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((provider) => (
                  <tr
                    key={provider.id}
                    className={provider.id === selectedId ? "row-selected" : ""}
                    onClick={() => setSelectedId(provider.id)}
                  >
                    <td>{provider.name}</td>
                    <td>{provider.kind}</td>
                    <td>{provider.availableEnvironments.join(" / ")}</td>
                    <td>
                      <StatusPill status={provider.health} />
                    </td>
                    <td>{provider.transparency}</td>
                    <td>{provider.errorRate}%</td>
                    <td>{provider.p95Latency === 0 ? "暂无" : `${provider.p95Latency} ms`}</td>
                    <td>{provider.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="当前筛选下没有 provider"
            description="空态保留出来，避免在没有数据时硬造列表。"
          />
        )}
      </Section>

      <Section title="provider 详情" description="四块结构：基本信息、支持模型、24 小时指标、当前适用建议。">
        {selectedProvider ? (
          <div className="stack">
            <div className="card-grid card-grid-2">
              <article className="data-card">
                <span className="mini-label">基本信息</span>
                <div className="data-card-top">
                  <h4>{selectedProvider.name}</h4>
                  <StatusPill status={selectedProvider.health} />
                </div>
                <p>{selectedProvider.description}</p>
                <p className="supporting-text">
                  {selectedProvider.kind} · {selectedProvider.availableEnvironments.join(" / ")}
                </p>
              </article>
              <article className="data-card">
                <span className="mini-label">当前适用建议</span>
                <h4>{selectedProvider.recommendation}</h4>
                <p>{selectedProvider.recommendationNote}</p>
              </article>
            </div>

            <article className="data-card">
              <span className="mini-label">支持模型</span>
              <div className="card-grid card-grid-2">
                {selectedProvider.models.map((model) => (
                  <div key={model.name} className="sub-card">
                    <strong>{model.name}</strong>
                    <p>{model.useCase}</p>
                  </div>
                ))}
              </div>
            </article>

            {selectedProvider.metrics ? (
              <article className="data-card">
                <span className="mini-label">最近 24 小时运行指标</span>
                <div className="metrics-grid">
                  <article className="metric-tile">
                    <span>请求量</span>
                    <strong>{selectedProvider.metrics.requests}</strong>
                  </article>
                  <article className="metric-tile">
                    <span>平均延迟</span>
                    <strong>{selectedProvider.metrics.avgLatency} ms</strong>
                  </article>
                  <article className="metric-tile">
                    <span>P95 延迟</span>
                    <strong>{selectedProvider.metrics.p95Latency} ms</strong>
                  </article>
                  <article className="metric-tile">
                    <span>错误率</span>
                    <strong>{selectedProvider.metrics.errorRate}%</strong>
                  </article>
                  <article className="metric-tile">
                    <span>usage 透明度</span>
                    <strong>{selectedProvider.transparency}</strong>
                  </article>
                  <article className="metric-tile">
                    <span>估算成本</span>
                    <strong>¥{selectedProvider.metrics.cost}</strong>
                  </article>
                </div>
              </article>
            ) : (
              <EmptyState
                title="当前没有 24 小时样本"
                description="保留无数据状态，不把试验 provider 伪装成已有结论。"
              />
            )}
          </div>
        ) : (
          <EmptyState
            title="没有可展示的 provider 详情"
            description="先调整筛选条件，再查看详情骨架。"
          />
        )}
      </Section>
    </div>
  );
}
