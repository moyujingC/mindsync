import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { TaskCategory, TaskTemplateInput } from "../models/controlPlane";
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
  const [form, setForm] = useState<TaskTemplateInput>(emptyForm);
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
      setFeedback(editingId ? "任务模板已更新。" : "任务模板已新增。");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "任务保存失败。");
    }
  }

  async function handleDelete(id: string) {
    setFeedback(null);
    setError(null);

    try {
      await deleteTaskTemplate(id);
      setVersion((current) => current + 1);
      setFeedback("自定义任务已删除。");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "任务删除失败。");
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Task Library</span>
          <h1>任务决定模型怎么用，不是反过来先让用户猜路由</h1>
          <p>
            先把常用工具任务和业务任务收成模板，再给每个任务绑定一个默认模型。模型切换先在控制台内完成，对新记录直接生效。
          </p>
        </div>
      </section>

      <Section title="任务模板" description="先提供内置任务，再允许你按自己的应用方向补充自定义任务。">
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
              <div className="table-card embedded">
                <table>
                  <thead>
                    <tr>
                      <th>任务</th>
                      <th>分类</th>
                      <th>默认模型</th>
                      <th>切换说明</th>
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
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => {
                              setEditingId(task.id);
                              setForm({
                                id: task.id,
                                name: task.name,
                                category: task.category,
                                description: task.description,
                                defaultModelEntryId: task.defaultModelEntryId,
                                switchNote: task.switchNote,
                              });
                            }}
                          >
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
                        <th>切换说明</th>
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
                              <button
                                type="button"
                                className="action-button"
                                onClick={() => {
                                  setEditingId(task.id);
                                  setForm({
                                    id: task.id,
                                    name: task.name,
                                    category: task.category,
                                    description: task.description,
                                    defaultModelEntryId: task.defaultModelEntryId,
                                    switchNote: task.switchNote,
                                  });
                                }}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="action-button danger"
                                onClick={() => handleDelete(task.id)}
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

      <Section title={editingId ? "编辑任务模板" : "新增任务模板"} description="任务默认绑定一个主模型，切换模型先在控制台内完成。">
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
          <label className="field">
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
            {feedback ? <span className="supporting-text">{feedback}</span> : null}
            {error ? <span className="error-inline">{error}</span> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}
