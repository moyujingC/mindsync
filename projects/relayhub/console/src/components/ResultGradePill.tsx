import type { RunResultGrade } from "../models/controlPlane";

const classMap: Record<RunResultGrade, string> = {
  "优秀": "pill-grade-excellent",
  "可用": "pill-grade-usable",
  "一般": "pill-grade-fair",
  "失败": "pill-grade-failed",
};

export function ResultGradePill({ grade }: { grade: RunResultGrade }) {
  return <span className={`pill ${classMap[grade]}`}>{grade}</span>;
}
