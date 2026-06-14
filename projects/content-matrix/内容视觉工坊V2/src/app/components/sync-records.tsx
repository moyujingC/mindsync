import { useState } from "react";
import {
  Sparkles,
  FileType,
  ClipboardPaste,
  Copy,
  ImageIcon,
  Filter,
  ChevronDown,
} from "lucide-react";
import { COLORS, Tag, Btn, FoggyArt, Divider } from "./ui-kit";

type Kind = "generate" | "style" | "sync";

const RECORDS: {
  id: string;
  date: string;
  time: string;
  kind: Kind;
  title: string;
  desc: string;
  tags: string[];
  images?: { hue: number; variant: any }[];
}[] = [
  {
    id: "T-2406-091",
    date: "今天",
    time: "14:32",
    kind: "generate",
    title: "专注不是用力，而是放弃 · 全套生成",
    desc: "知识卡 4 · 金句卡 1 · 封面 3 · 配图 3",
    tags: ["蓝雾静读", "公众号", "知识卡片"],
    images: [
      { hue: 0, variant: "mountain" },
      { hue: 0, variant: "wave" },
      { hue: 5, variant: "leaf" },
      { hue: 1, variant: "circle" },
    ],
  },
  {
    id: "S-2406-018",
    date: "今天",
    time: "11:08",
    kind: "style",
    title: "保存样式：蓝雾静读版",
    desc: "来源：富文本样本 · 公众号编辑器 · 12 段 / 3 标题",
    tags: ["排版样式", "默认基准"],
  },
  {
    id: "Y-2406-007",
    date: "今天",
    time: "10:42",
    kind: "sync",
    title: "复制至公众号 · 雾里晨读",
    desc: "粘贴至公众号编辑器 · 排版完整 · 已校验颜色与行高",
    tags: ["公众号", "复制"],
  },
  {
    id: "T-2406-090",
    date: "昨天",
    time: "21:14",
    kind: "generate",
    title: "通用出图 · 静山系列",
    desc: "提示词：一座静山，远处一盏暖灯…… · 6 张",
    tags: ["通用出图", "蓝雾静读"],
    images: [
      { hue: 0, variant: "mountain" },
      { hue: 2, variant: "leaf" },
      { hue: 1, variant: "circle" },
    ],
  },
  {
    id: "S-2406-017",
    date: "昨天",
    time: "16:55",
    kind: "style",
    title: "新建图片风格：薄雾林间",
    desc: "色板 4 · 适用：正文配图、金句卡",
    tags: ["图片风格"],
  },
  {
    id: "Y-2406-006",
    date: "06 / 02",
    time: "09:30",
    kind: "sync",
    title: "导入富文本样本：暖灰晨间版",
    desc: "来源：飞书文档 · 已抓取颜色 / 字号 / 行高",
    tags: ["排版样式"],
  },
  {
    id: "T-2406-088",
    date: "06 / 01",
    time: "20:12",
    kind: "generate",
    title: "金句卡批量生成 · 三月笔记",
    desc: "12 条金句 · 方形 + 竖版混合",
    tags: ["金句卡", "暖灰晨间"],
    images: [
      { hue: 1, variant: "circle" },
      { hue: 4, variant: "abstract" },
      { hue: 0, variant: "wave" },
    ],
  },
];

const KIND_META: Record<
  Kind,
  { label: string; icon: any; tone: "blue" | "warm" | "success" }
> = {
  generate: { label: "生成", icon: Sparkles, tone: "blue" },
  style: { label: "样式", icon: FileType, tone: "warm" },
  sync: { label: "同步", icon: Copy, tone: "success" },
};

export function SyncRecords() {
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const filtered =
    filter === "all" ? RECORDS : RECORDS.filter((r) => r.kind === filter);

  // group by date
  const groups = filtered.reduce<Record<string, typeof filtered>>(
    (acc, r) => ((acc[r.date] = acc[r.date] || []).push(r), acc),
    {}
  );

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-[1100px] mx-auto px-10 py-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div
              style={{
                color: COLORS.textFaint,
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              SYNC RECORDS
            </div>
            <div
              className="mt-1"
              style={{ color: COLORS.text, fontSize: 22, letterSpacing: "0.02em" }}
            >
              同步记录
            </div>
            <div
              className="mt-1.5"
              style={{ color: COLORS.textFaint, fontSize: 13 }}
            >
              生成、样式保存与同步动作的完整时间线，按日期组织。
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 rounded-md"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textMid,
                height: 34,
                fontSize: 12.5,
              }}
            >
              <Filter size={13} strokeWidth={1.6} />
              最近 30 天
              <ChevronDown size={12} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: "本月生成任务", v: "38", sub: "+6 vs 上月" },
            { label: "样式保存", v: "5", sub: "蓝雾静读 · 默认" },
            { label: "公众号同步", v: "21", sub: "复制 + 粘贴" },
            { label: "出图总数", v: "246", sub: "约 1.2 GB" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-md px-5 py-4"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ color: COLORS.textFaint, fontSize: 11.5 }}>
                {s.label}
              </div>
              <div
                className="mt-1.5"
                style={{ color: COLORS.text, fontSize: 22, letterSpacing: "0.02em" }}
              >
                {s.v}
              </div>
              <div
                className="mt-0.5"
                style={{ color: COLORS.textFaint, fontSize: 11 }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mt-8 flex items-center gap-1">
          {[
            { k: "all", l: "全部" },
            { k: "generate", l: "历史生成" },
            { k: "style", l: "保存样式" },
            { k: "sync", l: "同步动作" },
          ].map((t) => {
            const active = filter === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setFilter(t.k as any)}
                className="px-3.5 h-8 rounded-md transition-colors"
                style={{
                  color: active ? COLORS.text : COLORS.textMuted,
                  background: active ? COLORS.surface : "transparent",
                  border: `1px solid ${active ? COLORS.border : "transparent"}`,
                  fontSize: 13,
                }}
              >
                {t.l}
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="mt-6 space-y-8">
          {Object.entries(groups).map(([date, list]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ color: COLORS.text, fontSize: 13 }}>{date}</span>
                <span style={{ color: COLORS.textFaint, fontSize: 11 }}>
                  {list.length} 条记录
                </span>
                <div
                  className="flex-1"
                  style={{ height: 1, background: COLORS.borderSoft }}
                />
              </div>

              <div className="space-y-2">
                {list.map((r) => {
                  const meta = KIND_META[r.kind];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={r.id}
                      className="rounded-md flex items-stretch overflow-hidden"
                      style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {/* time */}
                      <div
                        className="w-20 flex flex-col items-center justify-center"
                        style={{
                          background: COLORS.borderSoft,
                          color: COLORS.textMid,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{r.time}</span>
                        <span style={{ fontSize: 10, color: COLORS.textFaint }}>
                          {r.id}
                        </span>
                      </div>

                      {/* body */}
                      <div className="flex-1 px-5 py-4 flex items-center gap-4">
                        <div
                          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            background:
                              meta.tone === "blue"
                                ? COLORS.blueTint
                                : meta.tone === "warm"
                                ? COLORS.warmTint
                                : "#E5EDE6",
                            color:
                              meta.tone === "blue"
                                ? COLORS.blueDeep
                                : meta.tone === "warm"
                                ? "#8B6F44"
                                : "#4F6B57",
                          }}
                        >
                          <Icon size={16} strokeWidth={1.6} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: COLORS.text, fontSize: 13.5 }}>
                              {r.title}
                            </span>
                            <Tag tone={meta.tone}>{meta.label}</Tag>
                          </div>
                          <div
                            className="mt-1"
                            style={{ color: COLORS.textMuted, fontSize: 12 }}
                          >
                            {r.desc}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {r.tags.map((t) => (
                              <Tag key={t} tone="neutral">
                                {t}
                              </Tag>
                            ))}
                          </div>
                        </div>

                        {r.images && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {r.images.slice(0, 4).map((im, i) => (
                              <FoggyArt
                                key={i}
                                hue={im.hue}
                                variant={im.variant}
                                style={{ width: 40, height: 50, borderRadius: 4 }}
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Btn variant="ghost" size="sm">
                            打开
                          </Btn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-10 mb-6 text-center"
          style={{ color: COLORS.textFaint, fontSize: 12 }}
        >
          —— 已展示最近 30 天，更早记录请使用筛选 ——
        </div>
      </div>
    </div>
  );
}
