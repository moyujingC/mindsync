import { useMemo, useState } from "react";
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

export function RunsPage() {
  const [version, setVersion] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("task-claude-code");
  const [form, setForm] = useState<TaskRunRecordInput>(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overview = useAsyncResource(() => getGovernanceOverview(), [version]);
  const runs = useAsyncResource(() => listTaskRunRecords(), [version]);
  const tasks = useAsyncResource(() => listTaskTemplates(), [version]);
  const models = useAsyncResource(() => listActiveModelEntries(), [version]);
  const selectedStats = useAsyncResource(() => getTaskStats(selectedTaskId), [selectedTaskId, version]);

  const taskOptions = useMemo(() => tasks.data ?? [], [tasks.data]);
  const modelOptions = useMemo(() => models.data ?? [], [models.data]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      await recordTaskRun(form);
      setVersion((current) => current + 1);
      setFeedback("运行记录已新增，统计已刷新。");
      setForm({ ...emptyForm });
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "运行记录保存失败。");
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Run Records</span>
          <h1>基础统计先从人工运行记录开始，不等外部自动接入</h1>
          <p>
            下一阶段只回答“哪个任务最近用过哪些模型、结果更好的是谁、切换频率高不高”。这是一层帮助选型的最小观察面，不是正式评测系统。
          </p>
        </div>
      </section>

      <Section title="治理概览" description="先看模型激活、任务绑定和最近运行记录是否已经形成闭环。">
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

      <Section title="新增运行记录" description="先用控制台录入最小结果，再形成任务维度的比较数据。">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>任务</span>
            <select
              value={form.taskId}
              onChange={(event) => setForm((current) => ({ ...current, taskId: event.target.value }))}
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
          <label className="field">
            <span>成本（元）</span>
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
            <span>耗时（ms）</span>
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
            <span>结果摘要</span>
            <textarea
              rows={3}
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              placeholder="说明这次运行的结果是否好用，以及它适不适合继续做默认模型。"
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
            {feedback ? <span className="supporting-text">{feedback}</span> : null}
            {error ? <span className="error-inline">{error}</span> : null}
          </div>
        </form>
      </Section>

      <Section title="任务统计" description="统计只基于任务运行记录，不依赖外部程序自动回传。">
        <div className="tabs">
          {taskOptions.map((task) => (
            <button
              key={task.id}
              type="button"
              className={`tab${selectedTaskId === task.id ? " is-active" : ""}`}
              onClick={() => setSelectedTaskId(task.id)}
            >
              {task.name}
            </button>
          ))}
        </div>

        {selectedStats.status === "loading" ? (
          <EmptyState title="正在加载任务统计" description="正在汇总该任务下的模型对比结果。" />
        ) : null}
        {selectedStats.status === "not-found" ? (
          <EmptyState title="没有找到对应任务" description="请从任务库重新绑定模型后再查看。" />
        ) : null}
        {selectedStats.status === "success" && selectedStats.data ? (
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

      <Section title="最近运行记录" description="先看最新样本，不急着做自动 benchmark。">
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
