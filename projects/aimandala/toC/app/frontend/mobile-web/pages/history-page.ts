import type { InterpretationRecordResponse } from "../../shared/types";

export interface HistoryPageItemDescriptor {
  interpretationId: string;
  title: string;
  subtitle: string;
  canOpenReport: boolean;
}

export interface HistoryPageDescriptor {
  pageId: "history-page";
  title: string;
  subtitle: string;
  items: HistoryPageItemDescriptor[];
}

export function createHistoryPageDescriptor(
  records: InterpretationRecordResponse[],
): HistoryPageDescriptor {
  return {
    pageId: "history-page",
    title: "历史解读",
    subtitle: "查看当前用户已经生成的 To C 记录。",
    items: records.map((record) => ({
      interpretationId: record.interpretation_id,
      title: `${record.theme} / ${record.status}`,
      subtitle: `创建时间：${record.created_at}`,
      canOpenReport: record.generation_progress >= 100,
    })),
  };
}
