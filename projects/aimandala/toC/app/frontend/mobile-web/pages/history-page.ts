import { getGenerationPresentation } from "../../shared/core";
import type { InterpretationRecordResponse } from "../../shared/types";

export interface HistoryPageItemDescriptor {
  interpretationId: string;
  theme: string;
  title: string;
  subtitle: string;
  canOpenReport: boolean;
  statusLabel: string;
  statusDetail: string;
}

export interface HistoryPageDescriptor {
  pageId: "history-page";
  title: string;
  subtitle: string;
  items: HistoryPageItemDescriptor[];
  summary: {
    total: number;
    ready: number;
    pending: number;
  };
}

function formatHistoryCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function createHistoryPageDescriptor(
  records: InterpretationRecordResponse[],
): HistoryPageDescriptor {
  const ready = records.filter((record) => getGenerationPresentation(record).isReady).length;

  return {
    pageId: "history-page",
    title: "历史解读",
    subtitle: "查看当前用户已经生成的 To C 记录。",
    summary: {
      total: records.length,
      ready,
      pending: records.length - ready,
    },
    items: records.map((record) => {
      const presentation = getGenerationPresentation(record);

      return {
        interpretationId: record.interpretation_id,
        theme: record.theme,
        title: `${record.theme} 主题解读`,
        subtitle: `创建于 ${formatHistoryCreatedAt(record.created_at)}`,
        canOpenReport: presentation.isReady,
        statusLabel: presentation.statusLabel,
        statusDetail: presentation.statusDetail,
      };
    }),
  };
}
