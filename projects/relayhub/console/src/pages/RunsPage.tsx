import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ResultGradePill } from "../components/ResultGradePill";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { RunResultGrade, TaskRunRecordInput } from "../models/controlPlane";
import {
  getGovernanceOverview,
  getTaskStats,
  listActiveModelEntries,
  listTaskRunRecords,
  listTaskTemplates,
  recordTaskRun,
} from "../services/controlPlane";

const RESULT_GRADE_OPTIONS: RunResultGrade[] = ["优秀", "可用", "一般", "失败"];

const emptyForm: TaskRunRecordInput = {
  taskId: "",
  modelEntryId: "",
  summary: "",
  resultGrade: "可用",
  costCny: null,
  latencyMs: null,
  note: "",
};

function resolvePreferredTaskId(
  tasks: Array<{ id: string }> | undefined,
  runs: Array<{ taskId: string }> | undefined,
) {
  if (!tasks || tasks.length === 0) {
    return "";
  }

  const mostRecentTaskId = runs?.[0]?.taskId;
  if (mostRecentTaskId && tasks.some((task) => task.id === mostRecentTaskId)) {
    return mostRecentTaskId;
  }

  return tasks[0]!.id;
}

export function RunsPage() {
  const [version, setVersion] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const [form, setForm] = useState<TaskRunRecordInput>({ ...emptyForm });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overview = useAsyncResource(() => getGovernanceOverview(), [version]);
  const runs = useAsyncResource(() => listTaskRunRecords(), [version]);
  const tasks = useAsyncResource(() => listTaskTemplates(), [version]);
  const models = useAsyncResource(() => listActiveModelEntries(), [version]);
  const selectedStats = useAsyncResource(
    () => (selectedTaskId ? getTaskStats(selectedTaskId) : Promise.resolve(null)),
    [selectedTaskId, version],
  );

  const taskOptions = useMemo(() => tasks.data ?? [], [tasks.data]);
  const modelOptions = useMemo(() => models.data ?? [], [models.data]);
  const selectedTask = useMemo(
    () => taskOptions.find((task) => task.id === form.taskId) ?? null,
    [form.taskId, taskOptions],
  );
  const selectedTaskDefaultModel = useMemo(
    () =>
      modelOptions.find((model) => model.id === selectedTask?.defaultModelEntryId) ?? null,
    [modelOptions, selectedTask?.defaultModelEntryId],
  );
  const selectedModel = useMemo(
    () => modelOptions.find((model) => model.id === form.modelEntryId) ?? null,
    [form.modelEntryId, modelOptions],
  );
  const isUsingTaskDefaultModel =
    selectedTaskDefaultModel !== null && form.modelEntryId === selectedTaskDefaultModel.id;

  useEffect(() => {
    if (hasManualSelection) {
      return;
    }

    const preferredTaskId = resolvePreferredTaskId(taskOptions, runs.data ?? undefined);
    if (preferredTaskId && preferredTaskId !== selectedTaskId) {
      const preferredTask = taskOptions.find((task) => task.id === preferredTaskId) ?? null;
      const preferredDefaultModel =
        modelOptions.find((model) => model.id === preferredTask?.defaultModelEntryId) ?? null;
      setSelectedTaskId(preferredTaskId);
      setForm((current) => ({
        ...current,
        taskId: preferredTaskId,
        modelEntryId: preferredDefaultModel?.id ?? "",
      }));
    }
  }, [hasManualSelection, modelOptions, runs.data, selectedTaskId, taskOptions]);

  function handleTaskChange(taskId: string) {
    const nextTask = taskOptions.find((task) => task.id === taskId) ?? null;
    const nextDefaultModel =
      modelOptions.find((model) => model.id === nextTask?.defaultModelEntryId) ?? null;

    setSelectedTaskId(taskId);
    setHasManualSelection(true);
    setForm((current) => ({
      ...current,
      taskId,
      modelEntryId: nextDefaultModel?.id ?? "",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    const missing: string[] = [];
    if (!form.taskId) {
      missing.push("任务");
    }
    if (!form.modelEntryId) {
      missing.push("模型");
    }
    if (!form.summary.trim()) {
      missing.push("结果摘要");
    }

    if (missing.length > 0) {
      setError(`请先补全必填项：${missing.join("、")}。`);
      return;
    }

    try {
      await recordTaskRun({
        ...form,
        summary: form.summary.trim(),
      });
      const submittedTaskId = form.taskId;
      const submittedModelId = form.modelEntryId;
      const submittedTask = taskOptions.find((task) => task.id === submittedTaskId) ?? null;
      const submittedDefaultModelId = submittedTask?.defaultModelEntryId ?? null;
      const usedTemporaryModel =
        submittedDefaultModelId === null || submittedModelId !== submittedDefaultModelId;
      setVersion((current) => current + 1);
      setSelectedTaskId(submittedTaskId);
      setHasManualSelection(true);
      setFeedback(
        usedTemporaryModel
          ? "运行记录已保存，任务统计已刷新。这次记录使用的是临时选择模型，不会自动改动任务默认模型。"
          : "运行记录已保存，任务统计已刷新。",
      );
      setForm((current) => ({
        ...current,
        taskId: submittedTaskId,
        modelEntryId: submittedDefaultModelId ?? submittedModelId,
        summary: "",
        costCny: null,
        latencyMs: null,
        note: "",
      }));
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "运行记录保存失败。");
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Run Records</span>
          <h1>先把一次次真实使用记下来，再谈模型比较</h1>
          <p>
            当前统计只基于控制台里的运行记录。先用最小表单把任务、模型和结果摘要记下来，再用这些记录看哪个模型更适合继续用。
          </p>
        </div>
      </section>

      <Section title="治理概览" description="先确认模型激活、任务绑定和运行记录是否已经形成最小闭环。">
        {overview.status === "loading" ? (
          <EmptyState title="正在加载治理概览" description="正在读取模型、任务与运行记录摘要。" />
        ) : null}
        {overview.status === "error" ? (
          <EmptyState title="治理概览加载失败" description={overview.error ?? "请稍后重试。"} />
        ) : null}
        {overview.status === "success" && overview.data ? (
          <>
            <div className="metrics-grid">
              <article className="metric-tile">
                <span>模型条目</span>
                <strong>{overview.data.totalEntries}</strong>
              </article>
              <article className="metric-tile">
                <span>已激活模型</span>
                <strong>{overview.data.activeEntries}</strong>
              </article>
              <article className="metric-tile">
                <span>待测试模型</span>
                <strong>{overview.data.configuredPendingTest}</strong>
              </article>
              <article className="metric-tile">
                <span>已绑定任务</span>
                <strong>{overview.data.tasksBound}</strong>
              </article>
              <article className="metric-tile">
                <span>任务总数</span>
                <strong>{overview.data.totalTasks}</strong>
              </article>
              <article className="metric-tile">
                <span>运行记录</span>
                <strong>{overview.data.recentRunsCount}</strong>
              </article>
            </div>
            <div className="card-grid card-grid-2">
              {overview.data.highlights.map((item) => (
                <article key={item} className="data-card">
                  <span className="mini-label">收口提示</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </Section>

      <Section title="新增运行记录" description="当前优先服务“任务已绑定模型后，顺手记一次真实结果”，不让用户自己猜下一步。">
        <article className="data-card">
          <span className="mini-label">当前任务记录上下文</span>
          {selectedTask ? (
            <>
              <h4>{selectedTask.name}</h4>
              {selectedTaskDefaultModel ? (
                <>
                  <p>当前任务默认模型：{selectedTaskDefaultModel.name}</p>
                  <p className="supporting-text">
                    {isUsingTaskDefaultModel
                      ? "这次会按当前默认模型开始记录。"
                      : `当前任务默认模型仍是 ${selectedTaskDefaultModel.name}，你这次记录用的是 ${selectedModel?.name ?? "临时选择模型"}。`}
                  </p>
                </>
              ) : (
                <>
                  <p>当前任务尚未绑定默认模型。</p>
                  <p className="supporting-text">
                    先去任务库绑定默认模型，或这次临时手动选择一个已激活模型。
                  </p>
                </>
              )}
            </>
          ) : (
            <p>先选一个任务，再开始记录这次真实使用结果。</p>
          )}
        </article>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>任务</span>
            <select
              aria-label="任务"
              value={form.taskId}
              onChange={(event) =>
                handleTaskChange(event.target.value)
              }
            >
              <option value="">请选择任务</option>
              {taskOptions.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>模型</span>
            <select
              aria-label="模型"
              value={form.modelEntryId}
              onChange={(event) =>
                setForm((current) => ({ ...current, modelEntryId: event.target.value }))
              }
            >
              <option value="">请选择模型</option>
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>结果等级</span>
            <select
              value={form.resultGrade}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  resultGrade: event.target.value as RunResultGrade,
                }))
              }
            >
              {RESULT_GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide">
            <span>结果摘要</span>
            <textarea
              aria-label="结果摘要"
              rows={3}
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              placeholder="说明这次运行的结果是否好用，以及它适不适合继续做默认模型。"
            />
          </label>
          <label className="field">
            <span>可选成本（元）</span>
            <input
              type="number"
              step="0.01"
              value={form.costCny ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  costCny: event.target.value === "" ? null : Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="field">
            <span>可选耗时（ms）</span>
            <input
              type="number"
              value={form.latencyMs ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  latencyMs: event.target.value === "" ? null : Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="field field-wide">
            <span>备注</span>
            <textarea
              rows={2}
              value={form.note ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="例如：复杂任务需要更高质量模型；该条只作为摘要候选。"
            />
          </label>
          <div className="form-actions field-wide">
            <button type="submit" className="button-link">
              记录一次运行
            </button>
            {feedback ? <span className="supporting-text feedback-inline">{feedback}</span> : null}
            {error ? <span className="error-inline">{error}</span> : null}
          </div>
        </form>
      </Section>

      <Section title="任务统计" description="优先打开最近有记录的任务；提交新记录后，会自动切到对应任务。">
        <div className="tabs">
          {taskOptions.map((task) => (
            <button
              key={task.id}
              type="button"
              className={`tab${selectedTaskId === task.id ? " is-active" : ""}`}
              onClick={() => {
                setSelectedTaskId(task.id);
                setHasManualSelection(true);
              }}
            >
              {task.name}
            </button>
          ))}
        </div>

        {selectedTaskId === "" ? (
          <EmptyState title="当前还没有可展示的任务统计" description="先去任务库创建任务，或先录入一条运行记录。" />
        ) : null}
        {selectedTaskId !== "" && selectedStats.status === "loading" ? (
          <EmptyState title="正在加载任务统计" description="正在汇总该任务下的模型对比结果。" />
        ) : null}
        {selectedTaskId !== "" && selectedStats.status === "not-found" ? (
          <EmptyState title="没有找到对应任务" description="请从任务库重新绑定模型后再查看。" />
        ) : null}
        {selectedTaskId !== "" && selectedStats.status === "success" && selectedStats.data ? (
          <div className="stack">
            <article className="data-card">
              <span className="mini-label">{selectedStats.data.taskName}</span>
              <h4>{selectedStats.data.bestModelSummary}</h4>
              <p>
                当前共有 {selectedStats.data.totalRuns} 条记录，涉及 {selectedStats.data.activeModels} 个模型。
              </p>
            </article>
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>记录数</th>
                    <th>优秀</th>
                    <th>可用</th>
                    <th>一般</th>
                    <th>失败</th>
                    <th>切换次数</th>
                    <th>平均成本</th>
                    <th>平均耗时</th>
                    <th>最近使用</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStats.data.modelStats.map((item) => (
                    <tr key={item.modelEntryId}>
                      <td>{item.modelEntryName}</td>
                      <td>{item.runs}</td>
                      <td>{item.excellent}</td>
                      <td>{item.usable}</td>
                      <td>{item.fair}</td>
                      <td>{item.failed}</td>
                      <td>{item.switchCount}</td>
                      <td>{item.averageCostCny === null ? "暂无" : `¥${item.averageCostCny}`}</td>
                      <td>{item.averageLatencyMs === null ? "暂无" : `${item.averageLatencyMs} ms`}</td>
                      <td>{item.lastUsedAt ?? "暂无"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="最近运行记录" description="先看最近样本，不在这一轮扩自动 benchmark 或外部自动采集。">
        {runs.status === "loading" ? (
          <EmptyState title="正在加载运行记录" description="正在读取最近样本。" />
        ) : null}
        {runs.status === "error" ? (
          <EmptyState title="运行记录加载失败" description={runs.error ?? "请稍后重试。"} />
        ) : null}
        {runs.status === "success" && runs.data ? (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>任务</th>
                  <th>模型</th>
                  <th>结果</th>
                  <th>摘要</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {runs.data.map((run) => (
                  <tr key={run.id}>
                    <td>{run.ranAt}</td>
                    <td>{run.taskName}</td>
                    <td>{run.modelEntryName}</td>
                    <td>
                      <ResultGradePill grade={run.resultGrade} />
                    </td>
                    <td>{run.summary}</td>
                    <td>{run.note || "暂无"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Section>
    </div>
  );
}
