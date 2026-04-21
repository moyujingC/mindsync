import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ModelStatusPill } from "../components/ModelStatusPill";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type {
  ModelCatalogResponse,
  ModelEntry,
  ModelEntryInput,
  ModelEntryKind,
} from "../models/controlPlane";
import {
  deleteModelEntry,
  getModelCatalog,
  listModelEntries,
  saveModelEntry,
  testModelEntryConnection,
} from "../services/controlPlane";

const KIND_OPTIONS: Array<{ value: ModelEntryKind; label: string }> = [
  { value: "coding-plan", label: "Coding Plan" },
  { value: "domestic-model", label: "国产模型" },
  { value: "relay-api", label: "中转 API" },
];

const emptyForm: ModelEntryInput = {
  name: "",
  providerLabel: "",
  kind: "coding-plan",
  baseUrl: "",
  modelId: "",
  purchaseUrl: "",
  apiKey: "",
};

export function ModelLibraryPage() {
  const [version, setVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModelEntryInput>({ ...emptyForm });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [catalogData, setCatalogData] = useState<ModelCatalogResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const dataResource = useAsyncResource(() => listModelEntries(), [version]);

  const sortedEntries = useMemo(() => {
    if (!dataResource.data) {
      return [];
    }

    return [...dataResource.data].sort(compareEntriesForGuidance);
  }, [dataResource.data]);

  const presetEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.source === "preset"),
    [sortedEntries],
  );
  const priorityPresetEntries = useMemo(
    () =>
      presetEntries.filter(
        (entry) =>
          entry.presetPriority === "recommended-first" || entry.presetPriority === "recommended",
      ),
    [presetEntries],
  );
  const otherPresetEntries = useMemo(
    () => presetEntries.filter((entry) => entry.presetPriority === "optional"),
    [presetEntries],
  );
  const customEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.source === "custom"),
    [sortedEntries],
  );
  const activeEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.status === "active"),
    [sortedEntries],
  );
  const pendingEntries = useMemo(
    () =>
      sortedEntries.filter(
        (entry) => entry.status === "configured-pending-test" || entry.status === "preset-unconfigured",
      ),
    [sortedEntries],
  );
  const missingApiKeyEntries = useMemo(
    () => sortedEntries.filter((entry) => !entry.hasStoredApiKey && entry.status !== "disabled"),
    [sortedEntries],
  );
  const failedEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.status === "test-failed"),
    [sortedEntries],
  );
  const recommendedUnactivatedEntries = useMemo(
    () =>
      priorityPresetEntries.filter(
        (entry) => entry.status !== "active" && entry.status !== "disabled",
      ),
    [priorityPresetEntries],
  );
  const editingEntry = useMemo(
    () => sortedEntries.find((entry) => entry.id === editingId) ?? null,
    [editingId, sortedEntries],
  );
  const isPresetEditing = editingEntry?.source === "preset";
  const isRelayPresetEditing =
    editingEntry?.source === "preset" &&
    editingEntry.kind === "relay-api" &&
    editingEntry.catalogFamily === "openai-compatible";

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setCatalogData(null);
    setCatalogLoading(false);
  }

  function openEdit(entry: ModelEntry) {
    setEditingId(entry.id);
    setForm({
      id: entry.id,
      name: entry.name,
      providerLabel: entry.providerLabel,
      kind: entry.kind,
      baseUrl: entry.baseUrl,
      modelId: entry.modelId,
      purchaseUrl: entry.purchaseUrl ?? "",
      apiKey: "",
    });
    setSubmitMessage(null);
    setSubmitError(null);
    setCopyMessage(null);
    setCopyError(null);
    setCatalogData(null);
    setCatalogLoading(false);
  }

  async function handleCopyBaseUrl(entry: ModelEntry) {
    setCopyMessage(null);
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(entry.baseUrl);
      setCopyMessage("入口地址已复制，可去外部工具粘贴使用。");
    } catch {
      setCopyError("入口地址复制失败，请手动复制。");
    }
  }

  async function handleFetchCatalog() {
    if (!editingEntry) {
      return;
    }

    setSubmitMessage(null);
    setSubmitError(null);
    setCatalogLoading(true);

    try {
      const nextCatalog = await getModelCatalog(editingEntry.id);
      setCatalogData(nextCatalog);
      const currentModelInCatalog = nextCatalog.items.some((item) => item.id === form.modelId);
      if (!currentModelInCatalog && nextCatalog.items[0]) {
        setForm((current) => ({ ...current, modelId: nextCatalog.items[0]!.id }));
      }
      setSubmitMessage("已获取上游可用模型，可从列表中切换当前模型。");
    } catch (error) {
      setCatalogData(null);
      setSubmitError(error instanceof Error ? error.message : "获取可用模型失败。");
    } finally {
      setCatalogLoading(false);
    }
  }

  function validateForm() {
    const missing: string[] = [];

    if (!form.name.trim()) {
      missing.push("名称");
    }
    if (!form.providerLabel.trim()) {
      missing.push("Provider");
    }
    if (!form.baseUrl.trim()) {
      missing.push("Base URL");
    }
    if (!form.modelId.trim()) {
      missing.push("模型标识");
    }

    return missing;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    const missing = validateForm();
    if (missing.length > 0) {
      setSubmitError(`请先补全必填项：${missing.join("、")}。`);
      return;
    }

    try {
      await saveModelEntry({
        ...form,
        id: editingId ?? undefined,
      });
      setVersion((current) => current + 1);
      setSubmitMessage(
        editingId
          ? isRelayPresetEditing && catalogData
            ? "当前模型已更新，下一步请测试连接确认该入口当前模型是否可用。"
            : "配置已保存，但模型还未激活。下一步请测试连接确认是否可用。"
          : "模型已保存，下一步请补齐 API Key 并测试连接完成激活。",
      );
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "模型保存失败。");
    }
  }

  async function handleTest(entry: ModelEntry) {
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const updated = await testModelEntryConnection(entry.id);
      setVersion((current) => current + 1);
      if (updated.status === "active") {
        setSubmitMessage(
          `“${entry.name}”已激活。下一步可去任务库绑定默认模型；这个入口现在也可在外部工具中复用 Base URL + Key。${describeRecommendedTasks(updated)}`,
        );
      } else {
        setSubmitError(`“${entry.name}”测试失败：${updated.lastTestMessage}`);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "连接测试失败。");
    }
  }

  async function handleDelete(entry: ModelEntry) {
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      await deleteModelEntry(entry.id);
      setVersion((current) => current + 1);
      if (editingId === entry.id) {
        resetForm();
      }
      setSubmitMessage(
        entry.source === "preset"
          ? `已停用“${entry.name}”，需要时可重新配置并测试连接。`
          : `已删除“${entry.name}”自定义模型。`,
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "模型删除失败。");
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Model Library</span>
          <h1>先接入一个可复用入口，再决定入口内当前用哪个模型</h1>
          <p>
            模型库当前先服务“入口接入”。无论是国产官方 API 还是第三方中转，都先把 URL、Key 和测试连接收口到这里；之后任务和运行记录只复用这些入口，不再让你到处重复填配置。
          </p>
        </div>
      </section>

      <Section
        title="第一次接入可以按这 5 步走"
        description="先把入口接进来，再谈任务绑定和后续切换，不需要第一次就理解整套治理逻辑。"
      >
        <div className="card-grid card-grid-3">
          <article className="data-card">
            <span className="mini-label">1</span>
            <h4>1. 先选一个预置入口</h4>
            <p>优先从已经配好 URL、默认模型标识和购买入口的预置条目开始。</p>
          </article>
          <article className="data-card">
            <span className="mini-label">2</span>
            <h4>2. 去购买 / 开通，拿到 API Key</h4>
            <p>如果还没有 Key，先从预置条目的购买 / 开通链接进去处理。</p>
          </article>
          <article className="data-card">
            <span className="mini-label">3</span>
            <h4>3. 回来只补 API Key</h4>
            <p>预置入口的 URL 和默认模型标识已经配好，不需要你再手填一次。</p>
          </article>
          <article className="data-card">
            <span className="mini-label">4</span>
            <h4>4. 保存后手动测试连接</h4>
            <p>保存配置不等于激活成功，必须显式点击“测试连接”。</p>
          </article>
          <article className="data-card">
            <span className="mini-label">5</span>
            <h4>5. 激活后去任务库绑定</h4>
            <p>入口激活后，就可以在任务库里把它绑定成默认模型入口。</p>
          </article>
        </div>
      </Section>

      <Section
        title="模型条目总览"
        description="先分清哪些模型已经能绑定任务，哪些模型更值得优先激活，避免第一次进入时还要自己猜。"
      >
        {dataResource.status === "loading" ? (
          <EmptyState title="正在加载模型库" description="正在读取模型条目和当前激活状态。" />
        ) : null}
        {dataResource.status === "error" ? (
          <EmptyState title="模型库加载失败" description={dataResource.error ?? "请稍后重试。"} />
        ) : null}
        {dataResource.status === "success" ? (
          <div className="card-grid card-grid-3">
            <article className="data-card">
              <span className="mini-label">当前可直接绑定</span>
              <h4>{activeEntries.length} 个模型已可用</h4>
              <p>这些模型已经通过测试连接，可以直接作为任务默认模型。</p>
            </article>
            <article className="data-card">
              <span className="mini-label">推荐先激活</span>
              <h4>{recommendedUnactivatedEntries.length} 个候选值得优先处理</h4>
              <p>这些预置条目已经给出适合任务和首选理由，适合先完成一条可用链路。</p>
            </article>
            <article className="data-card">
              <span className="mini-label">待补密钥 / 待修正</span>
              <h4>{missingApiKeyEntries.length} 个模型还缺 API Key</h4>
              <p>
                {pendingEntries.length} 个模型待补配置或待测试，{failedEntries.length} 个模型最近测试失败。
              </p>
            </article>
          </div>
        ) : null}
      </Section>

      <Section
        title="优先激活候选"
        description="这些预置入口已经给好 URL、模型标识和购买入口，目标是让你少填一次配置。"
      >
        {dataResource.status === "success" ? (
          <EntriesTable
            entries={priorityPresetEntries}
            onEdit={openEdit}
            onTest={handleTest}
            onDelete={handleDelete}
            onCopyBaseUrl={handleCopyBaseUrl}
          />
        ) : null}
      </Section>

      <Section
        title="更多预置模型"
        description="这些也是可直接接入的入口，只是当前优先级更低，先作为备用候选。"
      >
        {dataResource.status === "success" && otherPresetEntries.length === 0 ? (
          <EmptyState title="当前没有更多预置模型" description="首轮候选已经收敛在上面的优先激活区。" />
        ) : null}
        {dataResource.status === "success" && otherPresetEntries.length > 0 ? (
          <EntriesTable
            entries={otherPresetEntries}
            onEdit={openEdit}
            onTest={handleTest}
            onDelete={handleDelete}
            onCopyBaseUrl={handleCopyBaseUrl}
          />
        ) : null}
      </Section>

      <Section
        title="我的模型"
        description="这里放你自己新增的中转 API 或官方入口；自定义入口保持完整可编辑。"
      >
        {dataResource.status === "success" && customEntries.length === 0 ? (
          <EmptyState title="还没有自定义模型" description="可以先添加你正在使用的中转 API 或自有模型入口。" />
        ) : null}
        {dataResource.status === "success" && customEntries.length > 0 ? (
          <EntriesTable
            entries={customEntries}
            onEdit={openEdit}
            onTest={handleTest}
            onDelete={handleDelete}
            onCopyBaseUrl={handleCopyBaseUrl}
          />
        ) : null}
      </Section>

      <Section
        title={editingId ? "编辑模式" : "新增模式"}
        description={
          editingId
            ? isPresetEditing
              ? isRelayPresetEditing
                ? "当前在编辑系统预置中转入口。URL 和类型已锁定；若默认模型不确定，先获取可用模型列表，再保存并测试连接。"
                : "当前在编辑系统预置入口。URL、模型标识和类型已锁定，只需要补 Key、保存并测试连接。"
              : "当前在编辑自定义入口。保存后不会自动激活，仍需要显式测试连接。"
            : "新增后不会自动探测上游，必须显式点击“测试连接”才会变成可用入口。"
        }
      >
        {isPresetEditing ? (
          <article className="data-card">
            <span className="mini-label">预置入口锁定</span>
            <p>
              {isRelayPresetEditing
                ? "URL 已经配好；当前先补 API Key。若默认模型不确定，先获取可用模型列表，再切当前模型。保存后还不算激活，仍需要显式点击“测试连接”。"
                : "URL 和默认模型标识已经配好；当前只需要补 API Key。保存后还不算激活，仍需要显式点击“测试连接”。"}
            </p>
          </article>
        ) : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>名称</span>
            <input
              aria-label="名称"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：PPChat 中转"
            />
          </label>
          <label className="field">
            <span>Provider</span>
            <input
              aria-label="Provider"
              value={form.providerLabel}
              onChange={(event) =>
                setForm((current) => ({ ...current, providerLabel: event.target.value }))
              }
              placeholder="例如：code.ppchat.vip"
            />
          </label>
          <label className="field">
            <span>类型</span>
            <select
              value={form.kind}
              disabled={isPresetEditing}
              onChange={(event) =>
                setForm((current) => ({ ...current, kind: event.target.value as ModelEntryKind }))
              }
            >
              {KIND_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Base URL</span>
            <input
              aria-label="Base URL"
              value={form.baseUrl}
              disabled={isPresetEditing}
              onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
              placeholder="https://example.com/v1"
            />
            {isPresetEditing ? (
              <button
                type="button"
                className="button-link secondary"
                onClick={() => editingEntry ? handleCopyBaseUrl(editingEntry) : null}
              >
                复制 Base URL
              </button>
            ) : null}
          </label>
          {isRelayPresetEditing ? (
            <div className="field">
              <span>当前模型标识</span>
              <div className="supporting-text">{form.modelId || "尚未选择"}</div>
              <button
                type="button"
                className="button-link secondary"
                onClick={handleFetchCatalog}
                disabled={catalogLoading}
              >
                {catalogLoading ? "获取中..." : "获取可用模型"}
              </button>
              {!catalogData ? (
                <span className="supporting-text">先获取可用模型，再切当前模型。</span>
              ) : null}
            </div>
          ) : (
            <label className="field">
              <span>模型标识</span>
              <input
                aria-label="模型标识"
                value={form.modelId}
                disabled={isPresetEditing}
                onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))}
                placeholder="gpt-5 / deepseek-chat / qwen-max"
              />
            </label>
          )}
          {isRelayPresetEditing && catalogData ? (
            <label className="field">
              <span>可用模型列表</span>
              <select
                aria-label="可用模型列表"
                value={form.modelId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, modelId: event.target.value }))
                }
              >
                {catalogData.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <span className="supporting-text">拉取时间：{catalogData.fetchedAt}</span>
            </label>
          ) : null}
          <label className="field">
            <span>充值或购买链接</span>
            <input
              value={form.purchaseUrl ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, purchaseUrl: event.target.value }))
              }
              placeholder="可选"
            />
          </label>
          <label className="field field-wide">
            <span>API Key</span>
            <input
              aria-label="API Key"
              value={form.apiKey ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
              placeholder={editingId ? "留空则保留原有密钥" : "保存后由服务端脱敏存储"}
            />
            <span className="supporting-text">这里填写的是你从对应平台拿回来的 API Key；它只在服务端脱敏保存，不会进入前端构建产物。</span>
          </label>
          {form.purchaseUrl ? (
            <div className="field field-wide">
              <span>购买 / 充值入口</span>
              <a className="button-link secondary" href={form.purchaseUrl} target="_blank" rel="noreferrer">
                还没有 Key？先去开通 / 充值
              </a>
            </div>
          ) : null}
          <div className="form-actions field-wide">
            <button type="submit" className="button-link">
              {editingId ? "保存配置" : "新增模型"}
            </button>
            <button type="button" className="button-link secondary" onClick={resetForm}>
              清空表单
            </button>
            {submitMessage ? <span className="supporting-text feedback-inline">{submitMessage}</span> : null}
            {submitError ? <span className="error-inline">{submitError}</span> : null}
            {copyMessage ? <span className="supporting-text feedback-inline">{copyMessage}</span> : null}
            {copyError ? <span className="error-inline">{copyError}</span> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}

function EntriesTable({
  entries,
  onEdit,
  onTest,
  onDelete,
  onCopyBaseUrl,
}: {
  entries: ModelEntry[];
  onEdit: (entry: ModelEntry) => void;
  onTest: (entry: ModelEntry) => void;
  onDelete: (entry: ModelEntry) => void;
  onCopyBaseUrl: (entry: ModelEntry) => void;
}) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>类型</th>
            <th>Provider</th>
            <th>入口配置</th>
            <th>状态</th>
            <th>适合任务</th>
            <th>首选理由</th>
            <th>密钥</th>
            <th>最近测试</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <strong>{entry.name}</strong>
                <div className="supporting-text">{entry.statusNote}</div>
                <div className="supporting-text">下一步：{describeNextAction(entry)}</div>
                {entry.activationHint ? (
                  <div className="supporting-text">激活提示：{entry.activationHint}</div>
                ) : null}
                {entry.purchaseUrl ? (
                  <div className="supporting-text">
                    <a href={entry.purchaseUrl} target="_blank" rel="noreferrer">
                      去购买 / 充值
                    </a>
                  </div>
                ) : null}
              </td>
              <td>{KIND_OPTIONS.find((item) => item.value === entry.kind)?.label ?? entry.kind}</td>
              <td>{entry.providerLabel}</td>
              <td>
                <div>{entry.baseUrl}</div>
                <div className="supporting-text">入口内默认模型：{entry.modelId}</div>
                <button type="button" className="action-button" onClick={() => onCopyBaseUrl(entry)}>
                  复制 Base URL
                </button>
              </td>
              <td>
                <ModelStatusPill status={entry.status} />
                {entry.costTier ? <div className="supporting-text">成本：{entry.costTier}</div> : null}
              </td>
              <td>
                <div>{describeRecommendedTasks(entry)}</div>
                {entry.capabilityTags.length > 0 ? (
                  <div className="supporting-text">{entry.capabilityTags.join(" / ")}</div>
                ) : null}
              </td>
              <td>
                {entry.selectionReason ?? "当前没有额外首选理由。"}
              </td>
              <td>{entry.maskedApiKey ?? "未保存"}</td>
              <td>{entry.lastTestedAt ?? "尚未测试"}</td>
              <td>
                <div className="inline-actions">
                  <button type="button" className="action-button" onClick={() => onEdit(entry)}>
                    编辑
                  </button>
                  <button type="button" className="action-button" onClick={() => onTest(entry)}>
                    测试连接
                  </button>
                  <button
                    type="button"
                    className="action-button danger"
                    onClick={() => onDelete(entry)}
                  >
                    {entry.source === "preset" ? "停用" : "删除"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function compareEntriesForGuidance(left: ModelEntry, right: ModelEntry) {
  const leftRank = entrySortRank(left);
  const rightRank = entrySortRank(right);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return left.name.localeCompare(right.name, "zh-CN");
}

function entrySortRank(entry: ModelEntry) {
  if (entry.source === "custom") {
    return 50;
  }
  if (entry.presetPriority === "recommended-first" && entry.status !== "active") {
    return entry.status === "configured-pending-test" ? 20 : 10;
  }
  if (entry.presetPriority === "recommended" && entry.status !== "active") {
    return entry.status === "configured-pending-test" ? 25 : 15;
  }
  if (entry.status === "active") {
    return 30;
  }
  if (entry.presetPriority === "optional") {
    return 40;
  }
  return 45;
}

function describeNextAction(entry: ModelEntry) {
  if (entry.status === "active") {
    return "可以去任务库绑定默认模型。";
  }
  if (entry.lastTestResult === "missing-api-key") {
    return "先补 API Key，再重新测试连接。";
  }
  if (entry.lastTestResult === "invalid-base-url") {
    return "先修正 Base URL，再重新测试连接。";
  }
  if (entry.lastTestResult === "upstream-unreachable") {
    return "检查上游可达性，或稍后重试测试连接。";
  }
  if (!entry.hasStoredApiKey) {
    return "先补 API Key，再测试连接。";
  }
  if (entry.status === "disabled") {
    return "需要时可重新编辑并测试连接。";
  }
  return "保存配置后，显式执行测试连接完成激活。";
}

function describeRecommendedTasks(entry: ModelEntry) {
  const taskNames = entry.recommendedTaskIds.map(readableTaskName);
  if (taskNames.length > 0) {
    return `适合先绑定：${taskNames.join("、")}。`;
  }

  if (entry.recommendedTaskCategories.length > 0) {
    return `适合任务：${entry.recommendedTaskCategories.join("、")}。`;
  }

  return "适合任务：当前未指定。";
}

function readableTaskName(taskId: string) {
  const taskNames: Record<string, string> = {
    "task-claude-code": "Claude Code Web Coding",
    "task-codex-repo": "Codex Repo Coding",
    "task-therapy-dialogue": "心理疗愈对话",
    "task-therapy-summary": "心理疗愈摘要",
  };

  return taskNames[taskId] ?? taskId;
}
