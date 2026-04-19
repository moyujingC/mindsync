import type { HealthState } from "../models/console";

const labelMap: Record<HealthState, string> = {
  healthy: "正常",
  degraded: "异常观察",
  risk: "越界风险",
  idle: "暂无数据",
};

export function StatusPill({ status }: { status: HealthState }) {
  return <span className={`pill pill-${status}`}>{labelMap[status]}</span>;
}
