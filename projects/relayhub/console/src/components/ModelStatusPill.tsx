import type { ModelEntryStatus } from "../models/controlPlane";

const labelMap: Record<ModelEntryStatus, string> = {
  "preset-unconfigured": "预置未激活",
  "configured-pending-test": "待测试",
  active: "已激活",
  "test-failed": "测试失败",
  disabled: "已停用",
};

export function ModelStatusPill({ status }: { status: ModelEntryStatus }) {
  return <span className={`pill pill-model-${status}`}>{labelMap[status]}</span>;
}
