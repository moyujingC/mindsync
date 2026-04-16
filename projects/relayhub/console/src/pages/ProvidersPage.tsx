import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { StatusPill } from "../components/StatusPill";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { HealthFilter, ProviderKind, TransparencyState } from "../models/console";
import { getProvider, listProviders } from "../services/consoleData";

const PROVIDER_KIND_OPTIONS = ["全部", "第三方中转", "国产模型", "免费国外 API"] as const;
const PROVIDER_ENVIRONMENT_OPTIONS = ["全部", "开发版", "心理疗愈生产版", "评测版"] as const;
const PROVIDER_HEALTH_OPTIONS = ["全部", "healthy", "degraded", "risk", "idle"] as const;
const PROVIDER_TRANSPARENCY_OPTIONS = ["全部", "完整", "部分缺失", "暂无"] as const;

function readQueryValue<T extends readonly string[]>(
  raw: string | null,
  options: T,
): T[number] {
  return options.includes((raw ?? "全部") as T[number]) ? ((raw ?? "全部") as T[number]) : "全部";
}

function applyQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: string,
) {
  if (value === "全部") {
    searchParams.delete(key);
    return;
  }

  searchParams.set(key, value);
}

export function ProvidersPage() {
  const { providerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const forceError = searchParams.get("mock") === "error";
  const selectedId = providerId ?? "xinghe-relay-a";
  const typeFilter = readQueryValue(searchParams.get("kind"), PROVIDER_KIND_OPTIONS) as ProviderKind | "全部";
  const environmentFilter = readQueryValue(
    searchParams.get("environment"),
    PROVIDER_ENVIRONMENT_OPTIONS,
  );
  const healthFilter = readQueryValue(searchParams.get("health"), PROVIDER_HEALTH_OPTIONS) as HealthFilter;
  const transparencyFilter = readQueryValue(
    searchParams.get("transparency"),
    PROVIDER_TRANSPARENCY_OPTIONS,
  ) as TransparencyState | "全部";

  const updateFilter = (key: "kind" | "environment" | "health" | "transparency", value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    applyQueryValue(nextSearchParams, key, value);
    setSearchParams(nextSearchParams);
  };

  const providerDetailSearch = useMemo(() => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("mock");
    const queryString = nextSearchParams.toString();
    return queryString.length > 0 ? `?${queryString}` : "";
  }, [searchParams]);

  const filters = useMemo(
    () => ({
      kind: typeFilter,
      environment: environmentFilter,
      health: healthFilter,
      transparency: transparencyFilter,
    }),
    [environmentFilter, healthFilter, transparencyFilter, typeFilter],
  );
  const filteredProviders = useAsyncResource(
    () => listProviders(filters, { forceError }),
    [filters, forceError],
  );
  const selectedProvider = useAsyncResource(
    () => getProvider(providerId ?? selectedId, { forceError }),
    [forceError, providerId, selectedId],
  );

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
              onClick={() => updateFilter("kind", item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {PROVIDER_ENVIRONMENT_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip${environmentFilter === item ? " is-active" : ""}`}
              onClick={() => updateFilter("environment", item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {PROVIDER_HEALTH_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip${healthFilter === item ? " is-active" : ""}`}
              onClick={() => updateFilter("health", item)}
            >
              {item === "全部" ? item : `状态:${item}`}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {PROVIDER_TRANSPARENCY_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip${transparencyFilter === item ? " is-active" : ""}`}
              onClick={() => updateFilter("transparency", item)}
            >
              {item === "全部" ? item : `透明度:${item}`}
            </button>
          ))}
        </div>
      </Section>

      <Section title="provider 列表" description="核心字段与当前适用建议必须直接可见。">
        {filteredProviders.status === "loading" ? (
          <EmptyState title="正在加载 provider 列表" description="只读 mock API 正在返回 provider 数据。" />
        ) : null}
        {filteredProviders.status === "error" ? (
          <EmptyState
            title="provider 列表加载失败"
            description={filteredProviders.error ?? "请检查 mock API。"}
          />
        ) : null}
        {filteredProviders.status === "empty" ? (
          <EmptyState
            title="当前筛选下没有 provider"
            description="空态保留出来，避免在没有数据时硬造列表。"
          />
        ) : null}
        {filteredProviders.status === "success" && filteredProviders.data ? (
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
                {filteredProviders.data.map((provider) => (
                  <tr
                    key={provider.id}
                    className={provider.id === selectedId ? "row-selected" : ""}
                  >
                    <td>
                      <Link to={`/providers/${provider.id}${providerDetailSearch}`}>{provider.name}</Link>
                    </td>
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
        ) : null}
      </Section>

      <Section title="provider 详情" description="四块结构：基本信息、支持模型、24 小时指标、当前适用建议。">
        {selectedProvider.status === "loading" ? (
          <EmptyState title="正在加载 provider 详情" description="只读 mock API 正在返回 provider 详情。" />
        ) : null}
        {selectedProvider.status === "error" ? (
          <EmptyState
            title="provider 详情加载失败"
            description={selectedProvider.error ?? "请稍后重试 mock API。"}
          />
        ) : null}
        {selectedProvider.status === "not-found" ? (
          <EmptyState
            title="没有找到对应 provider"
            description="请检查 provider ID，或从列表重新进入。"
          />
        ) : null}
        {selectedProvider.status === "success" && selectedProvider.data ? (
          <div className="stack">
            <div className="card-grid card-grid-2">
              <article className="data-card">
                <span className="mini-label">基本信息</span>
                <div className="data-card-top">
                  <h4>{selectedProvider.data.name}</h4>
                  <StatusPill status={selectedProvider.data.health} />
                </div>
                <p>{selectedProvider.data.description}</p>
                <p className="supporting-text">
                  {selectedProvider.data.kind} · {selectedProvider.data.availableEnvironments.join(" / ")}
                </p>
              </article>
              <article className="data-card">
                <span className="mini-label">当前适用建议</span>
                <h4>{selectedProvider.data.recommendation}</h4>
                <p>{selectedProvider.data.recommendationNote}</p>
              </article>
            </div>

            <article className="data-card">
              <span className="mini-label">支持模型</span>
              <div className="card-grid card-grid-2">
                {selectedProvider.data.models.map((model) => (
                  <div key={model.name} className="sub-card">
                    <strong>{model.name}</strong>
                    <p>{model.useCase}</p>
                  </div>
                ))}
              </div>
            </article>

            {selectedProvider.data.metrics ? (
              <article className="data-card">
                <span className="mini-label">最近 24 小时运行指标</span>
                <div className="metrics-grid">
                  <article className="metric-tile">
                    <span>请求量</span>
                    <strong>{selectedProvider.data.metrics.requests}</strong>
                  </article>
                  <article className="metric-tile">
                    <span>平均延迟</span>
                    <strong>{selectedProvider.data.metrics.avgLatency} ms</strong>
                  </article>
                  <article className="metric-tile">
                    <span>P95 延迟</span>
                    <strong>{selectedProvider.data.metrics.p95Latency} ms</strong>
                  </article>
                  <article className="metric-tile">
                    <span>错误率</span>
                    <strong>{selectedProvider.data.metrics.errorRate}%</strong>
                  </article>
                  <article className="metric-tile">
                    <span>usage 透明度</span>
                    <strong>{selectedProvider.data.transparency}</strong>
                  </article>
                  <article className="metric-tile">
                    <span>估算成本</span>
                    <strong>¥{selectedProvider.data.metrics.cost}</strong>
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
        ) : null}
      </Section>
    </div>
  );
}
