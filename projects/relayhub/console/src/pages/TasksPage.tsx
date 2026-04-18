import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { TaskCategory, TaskTemplate, TaskTemplateInput } from "../models/controlPlane";
import {
  deleteTaskTemplate,
  listActiveModelEntries,
  listTaskTemplates,
  saveTaskTemplate,
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

  const tasks = useAsyncResource(() => listTaskTemplates(), [version]);
  const activeModels = useAsyncResource(() => listActiveModelEntries(), [version]);

  const builtInTasks = useMemo(
    () => tasks.data?.filter((item) => item.builtIn) ?? [],
    [tasks.data],
  );
  const customTasks = useMemo(
    () => tasks.data?.filter((item) => !item.builtIn) ?? [],
    [tasks.data],
  );
  const hasActiveModels = (activeModels.data?.length ?? 0) > 0;

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
      setFeedback(editingId ? "任务更新已保存。默认模型绑定已按当前选择刷新。" : "任务已新增。下一步可以开始录入这个任务的运行记录。");
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

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Task Library</span>
          <h1>先绑定默认模型，再开始积累可比较的任务记录</h1>
          <p>
            任务库当前只做一件事：把“这个任务默认用哪个模型”说清楚。先完成绑定，再去运行记录里积累可比较样本。
          </p>
        </div>
      </section>

      {!hasActiveModels && (activeModels.status === "success" || activeModels.status === "empty") ? (
        <Section title="当前还没有可绑定的已激活模型" description="任务可以先建，但如果没有可用模型，下一步会断在绑定这里。">
          <EmptyState title="先回模型库完成激活" description="先回模型库完成激活，再回来绑定任务。" />
        </Section>
      ) : null}

      <Section title="任务模板" description="保留“内置任务 / 自定义任务”分区，但当前重点是确认默认模型是否已经绑好。">
        {tasks.status === "loading" ? (
          <EmptyState title="正在加载任务库" description="正在读取任务模板和默认模型绑定。" />
        ) : null}
        {tasks.status === "error" ? (
          <EmptyState title="任务库加载失败" description={tasks.error ?? "请稍后重试。"} />
        ) : null}
        {tasks.status === "success" ? (
          <div className="stack">
            <article className="data-card">
              <span className="mini-label">系统内置任务</span>
              <p className="supporting-text">这些任务先代表当前的通用工具和核心业务方向。</p>
              <div className="table-card embedded">
                <table>
                  <thead>
                    <tr>
                      <th>任务</th>
                      <th>分类</th>
                      <th>默认模型</th>
                      <th>模型切换说明</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {builtInTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.name}</strong>
                          <div className="supporting-text">{task.description}</div>
                        </td>
                        <td>{task.category}</td>
                        <td>{task.defaultModelEntryName ?? "尚未绑定"}</td>
                        <td>{task.switchNote}</td>
                        <td>
                          <button type="button" className="action-button" onClick={() => openEdit(task)}>
                            编辑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="data-card">
              <span className="mini-label">自定义任务</span>
              {customTasks.length === 0 ? (
                <EmptyState title="还没有自定义任务" description="可以先按你的应用方向补一批任务模板。" />
              ) : (
                <div className="table-card embedded">
                  <table>
                    <thead>
                      <tr>
                        <th>任务</th>
                        <th>分类</th>
                        <th>默认模型</th>
                        <th>模型切换说明</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customTasks.map((task) => (
                        <tr key={task.id}>
                          <td>
                            <strong>{task.name}</strong>
                            <div className="supporting-text">{task.description}</div>
                          </td>
                          <td>{task.category}</td>
                          <td>{task.defaultModelEntryName ?? "尚未绑定"}</td>
                          <td>{task.switchNote}</td>
                          <td>
                            <div className="inline-actions">
                              <button type="button" className="action-button" onClick={() => openEdit(task)}>
                                编辑
                              </button>
                              <button
                                type="button"
                                className="action-button danger"
                                onClick={() => handleDelete(task)}
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </div>
        ) : null}
      </Section>

      <Section
        title={editingId ? "编辑任务" : "新增任务"}
        description="任务模板先服务默认模型绑定，不在这里扩写复杂路由哲学。"
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
            <span>默认模型</span>
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
