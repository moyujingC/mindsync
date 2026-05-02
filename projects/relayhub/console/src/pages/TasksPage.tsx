import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type {
  ModelEntry,
  TaskCategory,
  TaskTemplate,
  TaskTemplateInput,
} from "../models/controlPlane";
import {
  listModelEntries,
  deleteTaskTemplate,
  listActiveModelEntries,
  listTaskTemplates,
  saveTaskTemplate,
  testModelEntryConnection,
  verifyClaudeCodeRelay,
} from "../services/controlPlane";

const CATEGORY_OPTIONS: TaskCategory[] = ["通用工具", "业务任务"];

const emptyForm: TaskTemplateInput = {
  name: "",
  category: "通用工具",
  description: "",
  defaultModelEntryId: null,
  switchNote: "",
};

export function TasksPage() {
  const [version, setVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskTemplateInput>({ ...emptyForm });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowSavingTaskId, setRowSavingTaskId] = useState<string | null>(null);
  const [rowDrafts, setRowDrafts] = useState<Record<string, string>>({});
  const [relayVerificationMessage, setRelayVerificationMessage] = useState<string | null>(null);
  const [relayVerificationError, setRelayVerificationError] = useState<string | null>(null);
  const [isVerifyingRelay, setIsVerifyingRelay] = useState(false);
  const [testingModelEntryId, setTestingModelEntryId] = useState<string | null>(null);
  const [claudeSwitchFeedback, setClaudeSwitchFeedback] = useState<string | null>(null);
  const [claudeSwitchError, setClaudeSwitchError] = useState<string | null>(null);

  const tasks = useAsyncResource(() => listTaskTemplates(), [version]);
  const activeModels = useAsyncResource(() => listActiveModelEntries(), [version]);
  const modelEntries = useAsyncResource(() => listModelEntries(), [version]);

  const builtInTasks = useMemo(
    () => tasks.data?.filter((item) => item.builtIn) ?? [],
    [tasks.data],
  );
  const customTasks = useMemo(
    () => tasks.data?.filter((item) => !item.builtIn) ?? [],
    [tasks.data],
  );
  const hasActiveModels = (activeModels.data?.length ?? 0) > 0;
  const claudeCodeTask = useMemo(
    () => tasks.data?.find((item) => item.id === "task-claude-code") ?? null,
    [tasks.data],
  );
  const claudeRelayCandidates = useMemo(
    () =>
      modelEntries.data?.filter((item) =>
        item.id === "preset-ppchat-relay" || item.id === "preset-aitechflux-relay",
      ) ?? [],
    [modelEntries.data],
  );

  function resolveDraftValue(task: TaskTemplate) {
    const draftValue = rowDrafts[task.id];
    if (draftValue !== undefined) {
      return draftValue;
    }
    return task.defaultModelEntryId ?? "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      await saveTaskTemplate({
        ...form,
        id: editingId ?? undefined,
      });
      setVersion((current) => current + 1);
      setEditingId(null);
      setForm({ ...emptyForm });
      setFeedback(editingId ? "任务更新已保存。入口内默认模型绑定已按当前选择刷新。" : "任务已新增。下一步可以开始录入这个任务的运行记录。");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "任务保存失败。");
    }
  }

  async function handleDelete(task: TaskTemplate) {
    setFeedback(null);
    setError(null);

    try {
      await deleteTaskTemplate(task.id);
      setVersion((current) => current + 1);
      setFeedback(`已删除“${task.name}”任务。`);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "任务删除失败。");
    }
  }

  function openEdit(task: TaskTemplate) {
    setEditingId(task.id);
    setForm({
      id: task.id,
      name: task.name,
      category: task.category,
      description: task.description,
      defaultModelEntryId: task.defaultModelEntryId,
      switchNote: task.switchNote,
    });
    setFeedback(null);
    setError(null);
  }

  async function handleQuickSwitch(task: TaskTemplate, nextModelEntryId: string | null) {
    if (task.defaultModelEntryId === nextModelEntryId) {
      return;
    }

    setFeedback(null);
    setError(null);
    setClaudeSwitchFeedback(null);
    setClaudeSwitchError(null);
    setRowSavingTaskId(task.id);

    try {
      await saveTaskTemplate({
        id: task.id,
        name: task.name,
        category: task.category,
        description: task.description,
        defaultModelEntryId: nextModelEntryId,
        switchNote: task.switchNote,
      });
      setVersion((current) => current + 1);
      setRowDrafts((current) => ({
        ...current,
        [task.id]: nextModelEntryId ?? "",
      }));
      setFeedback(
        `“${task.name}”的入口内默认模型已切换。新的绑定会对后续使用和后续新运行记录生效。`,
      );
      if (task.id === "task-claude-code") {
        const nextModelName =
          modelEntries.data?.find((item) => item.id === nextModelEntryId)?.name ?? "未命名入口";
        setClaudeSwitchFeedback(`Claude Code 已切换到 ${nextModelName}。后续请求会跟随这个入口。`);
      }
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "默认模型切换失败。");
      if (task.id === "task-claude-code") {
        setClaudeSwitchError(currentError instanceof Error ? currentError.message : "Claude Code 当前模型切换失败。");
      }
      setRowDrafts((current) => ({
        ...current,
        [task.id]: task.defaultModelEntryId ?? "",
      }));
    } finally {
      setRowSavingTaskId(null);
    }
  }

  async function handleVerifyClaudeCodeRelay() {
    setRelayVerificationMessage(null);
    setRelayVerificationError(null);
    setClaudeSwitchFeedback(null);
    setClaudeSwitchError(null);
    setIsVerifyingRelay(true);

    try {
      const result = await verifyClaudeCodeRelay();
      setRelayVerificationMessage(`Claude Code 真链路验证成功：${result}`);
    } catch (currentError) {
      setRelayVerificationError(
        currentError instanceof Error ? currentError.message : "Claude Code 真链路验证失败。",
      );
    } finally {
      setIsVerifyingRelay(false);
    }
  }

  async function handleTestClaudeRelayCandidate(entryId: string) {
    setFeedback(null);
    setError(null);
    setRelayVerificationMessage(null);
    setRelayVerificationError(null);
    setClaudeSwitchFeedback(null);
    setClaudeSwitchError(null);
    setTestingModelEntryId(entryId);

    try {
      const result = await testModelEntryConnection(entryId);
      setVersion((current) => current + 1);
      setClaudeSwitchFeedback(`${result.name} 测试完成，当前状态：${result.status}。`);
    } catch (currentError) {
      setClaudeSwitchError(currentError instanceof Error ? currentError.message : "入口测试失败。");
    } finally {
      setTestingModelEntryId(null);
    }
  }

  function renderClaudeRelayCandidate(entry: ModelEntry) {
    const isBound = claudeCodeTask?.defaultModelEntryId === entry.id;
    const isActive = entry.status === "active";
    const isSwitching = rowSavingTaskId === claudeCodeTask?.id;

    return (
      <article key={entry.id} className="data-card">
        <span className="mini-label">{entry.name}</span>
        <p>当前状态：{entry.status}</p>
        <p className="supporting-text">
          {isBound ? "当前 Claude Code 正在使用这个入口。" : "当前 Claude Code 没有绑定到这个入口。"}
        </p>
        {entry.lastTestMessage ? <p className="supporting-text">最近结果：{entry.lastTestMessage}</p> : null}
        <div className="inline-actions">
          <button
            type="button"
            className="button-link secondary"
            onClick={() => handleTestClaudeRelayCandidate(entry.id)}
            disabled={testingModelEntryId === entry.id}
          >
            {testingModelEntryId === entry.id ? "正在测试入口..." : `测试 ${entry.name}`}
          </button>
          <button
            type="button"
            className="button-link"
            onClick={() => claudeCodeTask && handleQuickSwitch(claudeCodeTask, entry.id)}
            disabled={isSwitching || isBound || !isActive}
          >
            {isBound ? "当前已绑定" : `切换到 ${entry.name}`}
          </button>
        </div>
        {!isActive ? (
          <p className="supporting-text">这个入口还不是 active，先点“测试入口”再切换会更稳。</p>
        ) : null}
      </article>
    );
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Task Library</span>
          <h1>先把每个任务当前默认走哪个入口内模型说清楚，需要换时直接在这里切</h1>
          <p>
            外部工具复用的是已经接好的入口，任务库当前主要负责决定“这个任务默认走哪个入口内模型”。需要换模型时，直接在这里切，不要求你重新改 URL 和 Key。
          </p>
        </div>
      </section>

      {!hasActiveModels && (activeModels.status === "success" || activeModels.status === "empty") ? (
        <Section title="当前还没有可绑定的已激活模型" description="任务可以先建，但如果没有可用模型，下一步会断在绑定这里。">
          <EmptyState title="先回模型库完成激活" description="先回模型库完成激活，再回来绑定任务。" />
        </Section>
      ) : null}

      {claudeCodeTask ? (
        <Section
          title="Claude Code 当前模型"
          description="如果你现在的目标是让本地 Claude Code 跟着 RelayHub 切模型，优先改这里。它直接对应 task-claude-code 的当前绑定。"
        >
          <article className="data-card">
            <span className="mini-label">Claude Code 快速切换</span>
            <p>
              当前绑定：{claudeCodeTask.defaultModelEntryName ?? "尚未绑定"}
            </p>
            <p className="supporting-text">
              Claude Code 后续请求会自动跟随这个任务绑定，不需要你在 Claude Code 里再改 URL。
            </p>
            {claudeRelayCandidates.length > 0 ? (
              <div className="stack">
                <p className="supporting-text">
                  当前推荐直接在这里切 `PPChat` 和 `AITechFlux`，不用先去模型库再回任务库。
                </p>
                {claudeRelayCandidates.map((entry) => renderClaudeRelayCandidate(entry))}
              </div>
            ) : null}
            {hasActiveModels ? (
              <div className="inline-actions">
                <select
                  aria-label="Claude Code 当前模型"
                  value={resolveDraftValue(claudeCodeTask)}
                  onChange={(event) =>
                    setRowDrafts((current) => ({
                      ...current,
                      [claudeCodeTask.id]: event.target.value,
                    }))
                  }
                  disabled={rowSavingTaskId === claudeCodeTask.id}
                >
                  <option value="">暂不绑定</option>
                  {activeModels.data?.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button-link"
                  onClick={() =>
                    handleQuickSwitch(claudeCodeTask, resolveDraftValue(claudeCodeTask) || null)
                  }
                  disabled={
                    rowSavingTaskId === claudeCodeTask.id ||
                    resolveDraftValue(claudeCodeTask) === (claudeCodeTask.defaultModelEntryId ?? "")
                  }
                >
                  切换 Claude Code 当前模型
                </button>
              </div>
            ) : (
              <EmptyState title="还没有可切换的已激活模型" description="先去模型库激活一个可用入口，再回来切 Claude Code 当前模型。" />
            )}
            <div className="inline-actions">
              <button
                type="button"
                className="button-link secondary"
                onClick={handleVerifyClaudeCodeRelay}
                disabled={isVerifyingRelay || !claudeCodeTask.defaultModelEntryId}
              >
                验证 Claude Code 当前模型
              </button>
            </div>
            {relayVerificationMessage ? (
              <p className="supporting-text">{relayVerificationMessage}</p>
            ) : null}
            {relayVerificationError ? <p className="error-inline">{relayVerificationError}</p> : null}
            {claudeSwitchFeedback ? <p className="supporting-text">{claudeSwitchFeedback}</p> : null}
            {claudeSwitchError ? <p className="error-inline">{claudeSwitchError}</p> : null}
          </article>
        </Section>
      ) : null}

      <Section title="任务模板" description="保留“内置任务 / 自定义任务”分区，但当前重点是直接绑定或切换入口内默认模型。">
        {tasks.status === "loading" ? (
          <EmptyState title="正在加载任务库" description="正在读取任务模板和入口内默认模型绑定。" />
        ) : null}
        {tasks.status === "error" ? (
          <EmptyState title="任务库加载失败" description={tasks.error ?? "请稍后重试。"} />
        ) : null}
        {tasks.status === "success" ? (
          <div className="stack">
            <article className="data-card">
              <span className="mini-label">系统内置任务</span>
              <p className="supporting-text">这些任务先代表当前的通用工具和核心业务方向，优先在这里完成入口内默认模型切换。</p>
              <TaskTable
                tasks={builtInTasks}
                hasActiveModels={hasActiveModels}
                activeModels={activeModels.data ?? []}
                rowSavingTaskId={rowSavingTaskId}
                resolveDraftValue={resolveDraftValue}
                onDraftChange={(taskId, value) =>
                  setRowDrafts((current) => ({ ...current, [taskId]: value }))
                }
                onQuickSwitch={handleQuickSwitch}
                onEdit={openEdit}
              />
            </article>

            <article className="data-card">
              <span className="mini-label">自定义任务</span>
              {customTasks.length === 0 ? (
                <EmptyState title="还没有自定义任务" description="可以先按你的应用方向补一批任务模板。" />
              ) : (
                <TaskTable
                  tasks={customTasks}
                  hasActiveModels={hasActiveModels}
                  activeModels={activeModels.data ?? []}
                  rowSavingTaskId={rowSavingTaskId}
                  resolveDraftValue={resolveDraftValue}
                  onDraftChange={(taskId, value) =>
                    setRowDrafts((current) => ({ ...current, [taskId]: value }))
                  }
                  onQuickSwitch={handleQuickSwitch}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              )}
            </article>
          </div>
        ) : null}
      </Section>

      <Section
        title={editingId ? "编辑任务" : "新增任务"}
        description="任务模板先服务入口内默认模型绑定，不在这里扩写复杂路由哲学。"
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>任务名称</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：心理疗愈 App - 陪伴对话"
            />
          </label>
          <label className="field">
            <span>分类</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value as TaskCategory }))
              }
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide">
            <span>入口内默认模型</span>
            <select
              value={form.defaultModelEntryId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  defaultModelEntryId: event.target.value || null,
                }))
              }
            >
              <option value="">暂不绑定</option>
              {activeModels.data?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide">
            <span>任务说明</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              placeholder="说明这个任务为什么存在，以及主要关注什么。"
            />
          </label>
          <label className="field field-wide">
            <span>模型切换说明</span>
            <textarea
              value={form.switchNote}
              onChange={(event) =>
                setForm((current) => ({ ...current, switchNote: event.target.value }))
              }
              rows={3}
              placeholder="例如：结果不稳定时切回高质量模型；本轮切换只对新运行记录生效。"
            />
          </label>
          <div className="form-actions field-wide">
            <button type="submit" className="button-link">
              {editingId ? "保存更新" : "新增任务"}
            </button>
            <button
              type="button"
              className="button-link secondary"
              onClick={() => {
                setEditingId(null);
                setForm({ ...emptyForm });
              }}
            >
              清空表单
            </button>
            {feedback ? <span className="supporting-text feedback-inline">{feedback}</span> : null}
            {error ? <span className="error-inline">{error}</span> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}

function TaskTable({
  tasks,
  hasActiveModels,
  activeModels,
  rowSavingTaskId,
  resolveDraftValue,
  onDraftChange,
  onQuickSwitch,
  onEdit,
  onDelete,
}: {
  tasks: TaskTemplate[];
  hasActiveModels: boolean;
  activeModels: ModelEntry[];
  rowSavingTaskId: string | null;
  resolveDraftValue: (task: TaskTemplate) => string;
  onDraftChange: (taskId: string, value: string) => void;
  onQuickSwitch: (task: TaskTemplate, nextModelEntryId: string | null) => Promise<void>;
  onEdit: (task: TaskTemplate) => void;
  onDelete?: (task: TaskTemplate) => Promise<void>;
}) {
  return (
    <div className="table-card embedded">
      <table>
        <thead>
          <tr>
            <th>任务</th>
            <th>分类</th>
            <th>当前入口内默认模型</th>
            <th>推荐候选</th>
            <th>快速切换</th>
            <th>切换提示</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const draftValue = resolveDraftValue(task);
            const isSaving = rowSavingTaskId === task.id;
            const nextModelEntryId = draftValue || null;
            const recommendedModels = resolveRecommendedModels(task, activeModels);
            const draftEntry = nextModelEntryId
              ? activeModels.find((model) => model.id === nextModelEntryId) ?? null
              : null;
            const codexBindingBlocked =
              task.id === "task-codex-repo" &&
              draftEntry !== null &&
              (!draftEntry.capabilities.responses.ok || !draftEntry.capabilities.responses.streamOk);
            const currentBindingIsRecommended =
              task.defaultModelEntryId === null ||
              recommendedModels.some((model) => model.id === task.defaultModelEntryId);

            return (
              <tr key={task.id}>
                <td>
                  <strong>{task.name}</strong>
                  <div className="supporting-text">{task.description}</div>
                </td>
                <td>{task.category}</td>
                <td>{task.defaultModelEntryName ?? "尚未绑定"}</td>
                <td>
                  {hasActiveModels ? (
                    <div>
                      <div>{recommendedModels.map((model) => model.name).join("、")}</div>
                      <div className="supporting-text">
                        {task.defaultModelEntryId === null
                          ? "推荐先从这些已激活模型里绑定。"
                          : currentBindingIsRecommended
                            ? "当前绑定已在推荐候选内。"
                            : "当前可继续使用，也可切到更匹配候选。"}
                      </div>
                    </div>
                  ) : (
                    <span className="supporting-text">先回模型库激活，推荐候选才会出现。</span>
                  )}
                </td>
                <td>
                  {hasActiveModels ? (
                    <div className="inline-actions">
                      <select
                        aria-label={`${task.name}-快速切换默认模型`}
                        value={draftValue}
                        onChange={(event) => onDraftChange(task.id, event.target.value)}
                        disabled={isSaving}
                      >
                        <option value="">暂不绑定</option>
                        {activeModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="action-button"
                        onClick={() => onQuickSwitch(task, nextModelEntryId)}
                        disabled={
                          isSaving ||
                          draftValue === (task.defaultModelEntryId ?? "") ||
                          codexBindingBlocked
                        }
                      >
                        {task.defaultModelEntryId ? "切换入口内默认模型" : "绑定入口内默认模型"}
                      </button>
                      {codexBindingBlocked ? (
                        <span className="error-inline">当前入口尚未通过 Responses 流式探测，不可绑定给 Codex Repo Coding。</span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="supporting-text">先回模型库激活可用模型</span>
                  )}
                </td>
                <td>
                  {task.switchNote || "切换后仅对后续使用和后续新运行记录生效，不影响入口配置。"}
                  {task.id === "task-codex-repo" ? (
                    <div className="supporting-text">Codex 主链路只接受通过 Responses 流式探测的入口。</div>
                  ) : null}
                </td>
                <td>
                  <div className="inline-actions">
                    <button type="button" className="action-button" onClick={() => onEdit(task)}>
                      编辑
                    </button>
                    {onDelete ? (
                      <button
                        type="button"
                        className="action-button danger"
                        onClick={() => onDelete(task)}
                      >
                        删除
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function resolveRecommendedModels(task: TaskTemplate, activeModels: ModelEntry[]) {
  const exactMatches = activeModels.filter((model) => model.recommendedTaskIds.includes(task.id));
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  const categoryMatches = activeModels.filter((model) =>
    model.recommendedTaskCategories.includes(task.category),
  );
  if (categoryMatches.length > 0) {
    return categoryMatches;
  }

  return activeModels;
}
