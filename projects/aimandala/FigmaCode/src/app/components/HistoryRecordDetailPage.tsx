import { useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Clock,
  Check,
  Eye,
  Loader2,
  Lock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import dunhuangPattern from "figma:asset/176d69efc81b256182be2c6f62c7d48ce8cbe05b.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const MANDALA_IMG =
  "https://images.unsplash.com/photo-1741166237257-d694c313def0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5kYWxhJTIwYXJ0JTIwY29sb3JmdWwlMjBzeW1tZXRyaWNhbHxlbnwxfHx8fDE3NzY0MjgwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Demo state ─── */
type ProState = "not-upgraded" | "generating" | "viewable";

interface DemoRecord {
  theme: string;
  createdAt: string;
  liteReady: boolean;
  liteViewed: boolean;
  proState: ProState;
  proProgress?: number;
  proRequestedAt?: string;
  proReadyAt?: string;
}

const buildDemo = (state: ProState): DemoRecord => {
  const base: DemoRecord = {
    theme: "亲密关系",
    createdAt: "2026/06/08 09:30",
    liteReady: true,
    liteViewed: true,
    proState: state,
  };
  if (state === "generating") {
    return {
      ...base,
      proProgress: 62,
      proRequestedAt: "2026/06/08 10:12",
    };
  }
  if (state === "viewable") {
    return {
      ...base,
      proRequestedAt: "2026/06/08 10:12",
      proReadyAt: "2026/06/08 10:34",
    };
  }
  return base;
};

/* ─── Tokens ─── */
const GOLD = "#D4A054";
const GOLD_SOFT = "rgba(212,160,84,0.55)";
const GOLD_DIM = "rgba(212,160,84,0.18)";
const JADE = "#A8C4A0";
const JADE_DIM = "rgba(168,196,160,0.22)";
const TEXT = "#EDE4D4";
const TEXT_MUTED = "rgba(232,220,200,0.6)";
const TEXT_FAINT = "rgba(232,220,200,0.4)";

/* ─── Small parts ─── */
const StatusPill = ({
  tone,
  icon,
  label,
}: {
  tone: "jade" | "gold" | "muted";
  icon: React.ReactNode;
  label: string;
}) => {
  const map = {
    jade: { color: JADE, bg: "rgba(168,196,160,0.12)", border: JADE_DIM },
    gold: { color: GOLD, bg: "rgba(212,160,84,0.12)", border: GOLD_DIM },
    muted: {
      color: TEXT_MUTED,
      bg: "rgba(232,220,200,0.05)",
      border: "rgba(232,220,200,0.12)",
    },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: map.bg,
        border: `1px solid ${map.border}`,
        color: map.color,
        fontSize: "11px",
        letterSpacing: "0.08em",
      }}
    >
      {icon}
      {label}
    </span>
  );
};

const MiniTrack = ({ proState }: { proState: ProState }) => {
  const proActive = proState !== "not-upgraded";
  const proColor =
    proState === "viewable" ? GOLD : proState === "generating" ? GOLD_SOFT : TEXT_FAINT;
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{
        fontFamily: "'Noto Serif SC', serif",
        fontSize: "12px",
        letterSpacing: "0.12em",
      }}
    >
      <span style={{ color: JADE }}>Lite</span>
      <motion.span
        style={{
          color: proActive ? proColor : TEXT_FAINT,
          fontSize: "13px",
          lineHeight: 1,
        }}
        animate={
          proState === "generating"
            ? { opacity: [0.5, 1, 0.5] }
            : undefined
        }
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        →
      </motion.span>
      <span style={{ color: proColor }}>Pro</span>
    </div>
  );
};

/* ─── Pro step card ─── */
const ProStepCard = ({
  proState,
  progress,
  onUpgrade,
  onView,
}: {
  proState: ProState;
  progress?: number;
  onUpgrade: () => void;
  onView: () => void;
}) => {
  const isGold = proState !== "not-upgraded";
  const borderColor = isGold ? GOLD_DIM : "rgba(232,220,200,0.1)";
  const glow = isGold ? "0 4px 30px rgba(212,160,84,0.1)" : "none";

  return (
    <div
      className="rounded-2xl px-5 py-5 relative overflow-hidden"
      style={{
        background: isGold
          ? "linear-gradient(160deg, rgba(30,40,65,0.85) 0%, rgba(20,30,50,0.7) 100%)"
          : "linear-gradient(160deg, rgba(22,30,48,0.6) 0%, rgba(18,26,42,0.5) 100%)",
        border: `1px solid ${borderColor}`,
        boxShadow: glow,
      }}
    >
      {isGold && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: -30,
            right: -20,
            width: 140,
            height: 100,
            background:
              "radial-gradient(ellipse, rgba(212,160,84,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
      )}

      <div className="flex items-start justify-between relative">
        <div>
          <div
            style={{
              fontSize: "10px",
              color: GOLD_SOFT,
              letterSpacing: "0.25em",
            }}
          >
            STEP · 02
          </div>
          <div
            className="mt-1"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "17px",
              color: isGold ? GOLD : TEXT_MUTED,
              letterSpacing: "0.1em",
            }}
          >
            Pro {"深入解读"}
          </div>
        </div>
        {proState === "not-upgraded" && (
          <StatusPill tone="muted" icon={<Lock size={11} />} label="未升级" />
        )}
        {proState === "generating" && (
          <StatusPill
            tone="gold"
            icon={<Loader2 size={11} className="animate-spin" />}
            label="生成中"
          />
        )}
        {proState === "viewable" && (
          <StatusPill tone="gold" icon={<Sparkles size={11} />} label="已可查看" />
        )}
      </div>

      {/* Body */}
      <div className="relative mt-3" style={{ fontSize: "13px", color: TEXT_MUTED, lineHeight: 1.7 }}>
        {proState === "not-upgraded" &&
          "在 Lite 的基础上继续深入梳理。升级后可继续追问、继续对话。"}
        {proState === "generating" &&
          "深度解读正在生成，大约需要几分钟。"}
        {proState === "viewable" &&
          "深度解读已生成完成，包含梳理、象征解读与追问能力。"}
      </div>

      {/* Progress */}
      {proState === "generating" && (
        <div className="mt-4 relative">
          <div
            className="rounded-full overflow-hidden"
            style={{
              height: 4,
              background: "rgba(232,220,200,0.08)",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${GOLD_SOFT} 0%, ${GOLD} 100%)`,
                boxShadow: `0 0 8px ${GOLD_DIM}`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress ?? 0}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div
            className="mt-2 flex justify-between"
            style={{ fontSize: "11px", color: TEXT_FAINT, letterSpacing: "0.08em" }}
          >
            <span>{"预计还需 2-3 分钟"}</span>
            <span style={{ color: GOLD_SOFT }}>{progress ?? 0}%</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="relative mt-5">
        {proState === "not-upgraded" && (
          <button
            onClick={onUpgrade}
            className="w-full rounded-full flex items-center justify-center gap-2 py-3"
            style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, #E0B46A 100%)`,
              color: "#1A1208",
              fontFamily: "'Noto Serif SC', serif",
              letterSpacing: "0.18em",
              fontSize: "14px",
              boxShadow: `0 4px 20px ${GOLD_DIM}`,
            }}
          >
            {"升级到 Pro"}
            <ChevronRight size={16} />
          </button>
        )}
        {proState === "generating" && (
          <button
            onClick={onView}
            className="w-full rounded-full flex items-center justify-center gap-2 py-3"
            style={{
              background: "rgba(212,160,84,0.12)",
              border: `1px solid ${GOLD_SOFT}`,
              color: GOLD,
              fontFamily: "'Noto Serif SC', serif",
              letterSpacing: "0.18em",
              fontSize: "14px",
              boxShadow: `0 2px 14px ${GOLD_DIM}`,
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            {"查看进度"}
          </button>
        )}
        {proState === "viewable" && (
          <button
            onClick={onView}
            className="w-full rounded-full flex items-center justify-center gap-2 py-3"
            style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, #E0B46A 100%)`,
              color: "#1A1208",
              fontFamily: "'Noto Serif SC', serif",
              letterSpacing: "0.18em",
              fontSize: "14px",
              boxShadow: `0 4px 20px ${GOLD_DIM}`,
            }}
          >
            {"查看 Pro"}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Timeline ─── */
interface TimelineItem {
  label: string;
  time?: string;
  state: "done" | "active" | "future";
}

const Timeline = ({ items }: { items: TimelineItem[] }) => (
  <div className="relative">
    {items.map((it, i) => {
      const last = i === items.length - 1;
      const dotColor =
        it.state === "done" ? JADE : it.state === "active" ? GOLD : TEXT_FAINT;
      return (
        <div key={i} className="flex gap-3 relative">
          <div className="flex flex-col items-center" style={{ width: 16 }}>
            <motion.span
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                background: it.state === "future" ? "transparent" : dotColor,
                border:
                  it.state === "future"
                    ? `1px dashed ${TEXT_FAINT}`
                    : "none",
                boxShadow:
                  it.state !== "future"
                    ? `0 0 8px ${
                        it.state === "done" ? JADE_DIM : GOLD_DIM
                      }`
                    : undefined,
                marginTop: 6,
              }}
              animate={
                it.state === "active"
                  ? { opacity: [0.5, 1, 0.5] }
                  : undefined
              }
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            {!last && (
              <span
                style={{
                  width: 1,
                  flex: 1,
                  minHeight: 28,
                  marginTop: 4,
                  background:
                    it.state === "future"
                      ? "transparent"
                      : "rgba(232,220,200,0.12)",
                  backgroundImage:
                    it.state === "future"
                      ? "repeating-linear-gradient(180deg, rgba(232,220,200,0.18) 0 3px, transparent 3px 7px)"
                      : undefined,
                }}
              />
            )}
          </div>
          <div className="pb-5 flex-1">
            <div
              style={{
                fontSize: "13px",
                color: it.state === "future" ? TEXT_FAINT : TEXT,
                letterSpacing: "0.05em",
              }}
            >
              {it.label}
            </div>
            {it.time && (
              <div
                className="mt-0.5"
                style={{
                  fontSize: "11px",
                  color: TEXT_FAINT,
                  letterSpacing: "0.08em",
                }}
              >
                {it.time}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

/* ─── Page ─── */
export const HistoryRecordDetailPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const pathSeg = location.pathname.split("/").pop();
  const fromPath: ProState | undefined =
    pathSeg === "not-upgraded" || pathSeg === "generating" || pathSeg === "viewable"
      ? pathSeg
      : undefined;
  const stateParam = (fromPath ?? params.get("state") ?? "generating") as ProState;
  const record = useMemo(() => buildDemo(stateParam), [stateParam]);

  const overallStatus =
    record.proState === "viewable"
      ? { tone: "gold" as const, label: "Pro 已可查看", icon: <Sparkles size={11} /> }
      : record.proState === "generating"
      ? {
          tone: "gold" as const,
          label: "Pro 生成中",
          icon: <Loader2 size={11} className="animate-spin" />,
        }
      : {
          tone: "jade" as const,
          label: "Lite 已可查看",
          icon: <Check size={11} />,
        };

  const timeline: TimelineItem[] = [
    {
      label: "Lite 初步解读已生成",
      time: record.createdAt,
      state: "done",
    },
    ...(record.proRequestedAt
      ? [
          {
            label: "你选择继续，升级到 Pro",
            time: record.proRequestedAt,
            state: "done" as const,
          },
        ]
      : []),
    record.proState === "viewable"
      ? {
          label: "Pro 深入解读已为你完成",
          time: record.proReadyAt,
          state: "done" as const,
        }
      : record.proState === "generating"
      ? {
          label: "Pro 深入解读正在生成",
          state: "active" as const,
        }
      : {
          label: "正在等待你决定是否升级到 Pro",
          state: "future" as const,
        },
  ];

  return (
    <div
      className="size-full flex justify-center"
      style={{
        background:
          "linear-gradient(180deg, #0E1628 0%, #152038 40%, #111A30 100%)",
      }}
    >
      <div
        className="w-full flex flex-col relative overflow-hidden"
        style={{
          maxWidth: "480px",
          height: "100%",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        {/* Ambient glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -60,
            left: -80,
            width: 320,
            height: 320,
            background:
              "radial-gradient(ellipse at center, rgba(200,160,100,0.08) 0%, rgba(200,160,100,0.03) 40%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: 280,
            right: -100,
            width: 350,
            height: 350,
            background:
              "radial-gradient(ellipse, rgba(212,160,84,0.06) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -60,
            left: "20%",
            width: 280,
            height: 200,
            background:
              "radial-gradient(ellipse, rgba(168,196,160,0.05) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Top bar */}
        <div
          className="flex items-center px-4 py-3 relative flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(14,22,40,0.95) 0%, rgba(21,32,56,0.9) 50%, rgba(14,22,40,0.95) 100%)",
            borderBottom: `1px solid ${GOLD_DIM}`,
          }}
        >
          <button
            className="p-1"
            style={{ color: "rgba(232,220,200,0.55)" }}
            onClick={() => navigate("/history")}
          >
            <ArrowLeft size={22} />
          </button>
          <span
            className="ml-3"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              color: GOLD,
            }}
          >
            {"解读详情"}
          </span>
        </div>

        {/* Scroll */}
        <div
          className="flex-1 overflow-y-auto relative"
          style={{ scrollbarWidth: "none" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${dunhuangPattern})`,
              backgroundSize: "300px",
              backgroundRepeat: "repeat",
              opacity: 0.02,
            }}
          />

          <div className="relative px-5 pt-6 pb-12 space-y-6">
            {/* ── Summary card ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl px-5 py-5 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, rgba(20,32,55,0.9) 0%, rgba(30,45,70,0.5) 40%, rgba(18,28,48,0.8) 100%)",
                border: `1px solid ${GOLD_DIM}`,
                boxShadow:
                  "0 4px 30px rgba(212,160,84,0.08), 0 0 60px rgba(17,26,48,0.5)",
              }}
            >
              <div
                className="absolute pointer-events-none"
                style={{
                  top: -40,
                  right: -30,
                  width: 180,
                  height: 140,
                  background:
                    "radial-gradient(ellipse, rgba(212,160,84,0.12) 0%, rgba(212,160,84,0.04) 50%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              <div className="relative">
                {/* Top row: mandala + theme + time */}
                <div className="flex items-center gap-4">
                  <div
                    className="relative flex-shrink-0 overflow-hidden"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      border: `1px solid ${GOLD_DIM}`,
                      boxShadow: `0 0 18px ${GOLD_DIM}`,
                    }}
                  >
                    <ImageWithFallback
                      src={MANDALA_IMG}
                      alt={record.theme}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 20%, rgba(212,160,84,0.15) 0%, transparent 60%)",
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      style={{
                        fontSize: "10px",
                        color: GOLD_SOFT,
                        letterSpacing: "0.3em",
                      }}
                    >
                      {"本次议题"}
                    </div>
                    <div
                      className="mt-1"
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: "22px",
                        color: TEXT,
                        letterSpacing: "0.14em",
                      }}
                    >
                      {record.theme}
                    </div>
                    <div
                      className="mt-1.5 flex items-center gap-1.5"
                      style={{
                        color: TEXT_FAINT,
                        fontSize: "11px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <Clock size={11} />
                      {record.createdAt}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className="my-4"
                  style={{ height: 1, background: "rgba(212,160,84,0.12)" }}
                />

                {/* Status + progress row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: TEXT_FAINT,
                        letterSpacing: "0.2em",
                      }}
                    >
                      {"当前状态"}
                    </div>
                    <div className="mt-2">
                      <StatusPill
                        tone={overallStatus.tone}
                        icon={overallStatus.icon}
                        label={overallStatus.label}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      style={{
                        fontSize: "10px",
                        color: TEXT_FAINT,
                        letterSpacing: "0.2em",
                      }}
                    >
                      {"版本进度"}
                    </div>
                    <div className="mt-2.5">
                      <MiniTrack proState={record.proState} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Version stepper ── */}
            <div>
              <div
                className="flex items-center gap-2 mb-3 px-1"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "13px",
                  color: GOLD_SOFT,
                  letterSpacing: "0.25em",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 1,
                    background: GOLD_DIM,
                    display: "inline-block",
                  }}
                />
                {"解读进度"}
              </div>

              {/* Lite card */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl px-5 py-4 relative overflow-hidden"
                style={{
                  background:
                    record.proState === "viewable"
                      ? "linear-gradient(160deg, rgba(22,32,30,0.5) 0%, rgba(18,26,28,0.4) 100%)"
                      : "linear-gradient(160deg, rgba(28,42,40,0.7) 0%, rgba(20,32,30,0.5) 100%)",
                  border:
                    record.proState === "viewable"
                      ? "1px solid rgba(168,196,160,0.12)"
                      : `1px solid ${JADE_DIM}`,
                  boxShadow:
                    record.proState === "viewable"
                      ? "none"
                      : "0 4px 24px rgba(168,196,160,0.06)",
                }}
              >
                {record.proState !== "viewable" && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: -30,
                      left: -20,
                      width: 120,
                      height: 90,
                      background:
                        "radial-gradient(ellipse, rgba(168,196,160,0.1) 0%, transparent 70%)",
                      borderRadius: "50%",
                    }}
                  />
                )}
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(168,196,160,0.7)",
                        letterSpacing: "0.25em",
                      }}
                    >
                      STEP · 01
                    </div>
                    <div
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: "16px",
                        color:
                          record.proState === "viewable"
                            ? "rgba(168,196,160,0.75)"
                            : JADE,
                        letterSpacing: "0.1em",
                      }}
                    >
                      Lite {"初步解读"}
                    </div>
                  </div>
                  <StatusPill
                    tone="jade"
                    icon={<Check size={11} />}
                    label="已可查看"
                  />
                </div>
                {record.proState !== "viewable" && (
                  <div
                    className="relative mt-3"
                    style={{
                      fontSize: "13px",
                      color: TEXT_MUTED,
                      lineHeight: 1.7,
                    }}
                  >
                    {"这是本次解读的第一步，帮你快速看见画面中的初步象征与线索。"}
                  </div>
                )}
                <div className="relative mt-4">
                  {record.proState === "viewable" ? (
                    <button
                      onClick={() => navigate("/report")}
                      className="inline-flex items-center gap-1.5"
                      style={{
                        color: "rgba(168,196,160,0.85)",
                        fontFamily: "'Noto Serif SC', serif",
                        letterSpacing: "0.15em",
                        fontSize: "13px",
                      }}
                    >
                      <Eye size={13} />
                      {"查看 Lite"}
                      <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/report")}
                      className="w-full rounded-full flex items-center justify-center gap-2 py-3"
                      style={{
                        background: "rgba(168,196,160,0.1)",
                        border: `1px solid ${JADE_DIM}`,
                        color: JADE,
                        fontFamily: "'Noto Serif SC', serif",
                        letterSpacing: "0.18em",
                        fontSize: "14px",
                      }}
                    >
                      <Eye size={14} />
                      {"查看 Lite"}
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Connector */}
              <div className="flex justify-center" style={{ height: 28 }}>
                <div
                  style={{
                    width: 1,
                    height: "100%",
                    background:
                      record.proState === "not-upgraded"
                        ? "transparent"
                        : `linear-gradient(180deg, ${JADE_DIM} 0%, ${GOLD_DIM} 100%)`,
                    backgroundImage:
                      record.proState === "not-upgraded"
                        ? "repeating-linear-gradient(180deg, rgba(232,220,200,0.25) 0 4px, transparent 4px 8px)"
                        : undefined,
                  }}
                />
              </div>

              {/* Pro card */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ProStepCard
                  proState={record.proState}
                  progress={record.proProgress}
                  onUpgrade={() => navigate("/select-plan")}
                  onView={() => navigate("/report")}
                />
              </motion.div>
            </div>

            {/* ── Timeline ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-2xl px-5 py-5 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, rgba(22,30,48,0.4) 0%, rgba(18,26,42,0.3) 100%)",
                border: "1px solid rgba(232,220,200,0.06)",
              }}
            >
              <div className="mb-1">
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "14px",
                    color: TEXT_MUTED,
                    letterSpacing: "0.18em",
                  }}
                >
                  {"这次解读的过程"}
                </div>
                <div
                  className="mt-1 mb-4"
                  style={{
                    fontSize: "11px",
                    color: TEXT_FAINT,
                    letterSpacing: "0.05em",
                  }}
                >
                  {"我们一起走到这里"}
                </div>
              </div>
              <Timeline items={timeline} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryRecordDetailPage;
