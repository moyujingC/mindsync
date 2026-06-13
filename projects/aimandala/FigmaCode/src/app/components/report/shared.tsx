import {
  ReactNode,
  useState,
  useId,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Share2, Download, RotateCcw, Check, MessageCircleQuestion, ArrowUp, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import combLogoFlat from "figma:asset/dd21b372c423cb06578216b853db653316e94fcc.png";
import dunhuangPattern from "figma:asset/176d69efc81b256182be2c6f62c7d48ce8cbe05b.png";

export { combLogoFlat, dunhuangPattern };

/* ─── Floating particles ─── */
export function FloatingParticlesSubtle() {
  const particles = [
    { x: "10%", y: "15%", size: 2.5, delay: 0, duration: 8 },
    { x: "82%", y: "10%", size: 2, delay: 1.5, duration: 7 },
    { x: "70%", y: "55%", size: 3, delay: 0.8, duration: 9 },
    { x: "20%", y: "45%", size: 2, delay: 2.5, duration: 7.5 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background:
              "radial-gradient(circle, rgba(212,160,84,0.6) 0%, rgba(212,160,84,0) 70%)",
            boxShadow: `0 0 ${p.size * 2}px rgba(212,160,84,0.3)`,
          }}
          animate={{
            y: [0, -12, 3, -8, 0],
            x: [0, 5, -3, 6, 0],
            opacity: [0.2, 0.6, 0.35, 0.7, 0.2],
            scale: [1, 1.15, 0.9, 1.1, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

/* ─── Top Navigation ─── */
export function ReportTopBar({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 relative z-10"
      style={{
        background:
          "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "rgba(212,160,84,0.15)",
      }}
    >
      <button
        className="p-1 transition-colors"
        style={{ color: "rgba(232,220,200,0.5)" }}
        onClick={onBack}
      >
        <ArrowLeft size={22} />
      </button>

      <div className="flex items-center gap-2">
        <img
          src={combLogoFlat}
          alt="一镜一梳"
          style={{ width: "22px", height: "22px", objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "#D4A054",
          }}
        >
          {title}
        </span>
      </div>

      <button
        className="p-1 transition-colors"
        style={{ color: "rgba(232,220,200,0.5)" }}
      >
        <Share2 size={20} />
      </button>
    </div>
  );
}

/* ─── Mandala thumbnail with version badge ─── */
export function ReportHeader({
  title,
  date,
  version,
}: {
  title: string;
  date: string;
  version: "Lite" | "Pro";
}) {
  const isPro = version === "Pro";

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1A2844 0%, #1E2D4D 50%, #223358 80%, #2A3D65 100%)",
      }}
    >
      {/* Dunhuang texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${dunhuangPattern})`,
          backgroundSize: "300px",
          backgroundRepeat: "repeat",
          opacity: 0.02,
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          height: "150px",
          background:
            "radial-gradient(ellipse, rgba(212,160,84,0.1) 0%, transparent 60%)",
          borderRadius: "50%",
        }}
      />

      <FloatingParticlesSubtle />

      <div className="flex flex-col items-center px-6 pt-8 pb-10 relative">
        {/* Artwork thumbnail */}
        <div className="relative mb-4">
          {/* Gold ring glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: "-6px",
              background: isPro
                ? "conic-gradient(from 0deg, rgba(212,160,84,0.45), rgba(200,120,80,0.25), rgba(212,160,84,0.45))"
                : "conic-gradient(from 0deg, rgba(212,160,84,0.3), rgba(200,120,80,0.15), rgba(212,160,84,0.3))",
              filter: "blur(4px)",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Gold border ring */}
          <div
            className="w-[100px] h-[100px] rounded-full relative overflow-hidden"
            style={{
              borderWidth: isPro ? "3px" : "2.5px",
              borderStyle: "solid",
              borderColor: "#C8A066",
              boxShadow:
                "0 0 20px rgba(200,160,102,0.2), inset 0 0 20px rgba(200,160,102,0.1)",
            }}
          >
            {/* Placeholder mandala art */}
            <div
              className="w-full h-full"
              style={{
                background:
                  "conic-gradient(from 0deg, #C25B56, #D4883E, #C8A066, #5B8C5A, #4A7FB5, #8B6AAE, #C25B56)",
                opacity: 0.85,
              }}
            >
              <div
                className="absolute inset-3 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, #F5EFE2 30%, transparent 70%)",
                }}
              />
              <div
                className="absolute inset-6 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 90deg, #D4883E88, #5B8C5A88, #4A7FB588, #D4883E88)",
                }}
              />
              <div
                className="absolute inset-9 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, #F5EFE2 40%, #C8A06666 100%)",
                }}
              />
            </div>
          </div>

          {/* Version badge */}
          <div
            className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full"
            style={{
              background: isPro
                ? "linear-gradient(135deg, #9B4030 0%, #C87850 50%, #D4A054 100%)"
                : "linear-gradient(135deg, #1E2D4D 0%, #253860 100%)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: isPro
                ? "rgba(212,160,84,0.5)"
                : "rgba(212,160,84,0.3)",
              fontSize: "10px",
              fontWeight: 600,
              color: isPro ? "#F5EFE2" : "#D4A054",
              letterSpacing: "0.05em",
            }}
          >
            {version}版
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "22px",
            fontWeight: 600,
            color: "#E8DCC8",
            letterSpacing: "0.15em",
            lineHeight: 1.4,
          }}
        >
          {title}
        </h1>

        {/* Date + version line */}
        <div className="flex items-center gap-2 mt-2">
          <span
            style={{
              fontSize: "12px",
              color: "rgba(232,220,200,0.4)",
            }}
          >
            {date}生成
          </span>
          <span
            style={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "rgba(212,160,84,0.4)",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "rgba(212,160,84,0.6)",
              letterSpacing: "0.06em",
            }}
          >
            {isPro ? "深度解读" : "初步解读"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Cream content wrapper (card overlapping dark header) ─── */
export function CreamContentArea({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative px-5 pb-8 overflow-hidden"
      style={{
        backgroundColor: "#F0E6D6",
        borderRadius: "24px 24px 0 0",
        marginTop: "-16px",
        boxShadow: "0 -4px 24px rgba(26,40,68,0.15)",
        paddingTop: "24px",
      }}
    >
      {/* SVG noise texture overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.03 }}
      >
        <filter id="reportNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#reportNoise)" />
      </svg>

      {children}
    </div>
  );
}

/* ─── Light cream card (jade-like) ─── */
export function CreamCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl relative overflow-hidden ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(245,239,226,0.8) 100%)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(138,124,108,0.12)",
        padding: "20px",
      }}
    >
      {/* Jade-like subtle texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(158,170,155,0.08) 0%, transparent 50%)",
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/* ─── Card section title with accent bar ─── */
export function CardTitle({
  text,
  color = "#9EAA9B",
}: {
  text: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-1 h-5 rounded-full"
        style={{
          background: `linear-gradient(180deg, ${color}, ${color}88)`,
        }}
      />
      <span
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "15px",
          fontWeight: 600,
          color: "#4A3D30",
          letterSpacing: "0.08em",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ─── Section divider title (icon + serif + line) ─── */
export function SectionDivider({
  icon,
  text,
  color = "#C87850",
}: {
  icon: ReactNode;
  text: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <span
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "#4A3D30",
          letterSpacing: "0.06em",
        }}
      >
        {text}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(90deg, ${color}33 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}

/* ─── Unified report module shell (template-rendered look) ─── */
export function ReportModule({
  index,
  title,
  meta,
  accent = "#C87850",
  className,
  children,
}: {
  index: string;
  title: string;
  meta?: string;
  accent?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`mb-6 ${className ?? ""}`}>
      {/* Module header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{
            minWidth: "22px",
            height: "22px",
            paddingLeft: "5px",
            paddingRight: "5px",
            borderRadius: "6px",
            background: `${accent}1A`,
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: `${accent}40`,
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "11px",
            fontWeight: 600,
            color: accent,
            letterSpacing: "0.02em",
          }}
        >
          {index}
        </span>
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "15px",
            fontWeight: 600,
            color: "#4A3D30",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(90deg, ${accent}33 0%, transparent 100%)`,
          }}
        />
        {meta && (
          <span
            className="flex-shrink-0"
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "11px",
              color: "#A89C8E",
              letterSpacing: "0.04em",
            }}
          >
            {meta}
          </span>
        )}
      </div>

      {children}
    </section>
  );
}

const CANNED_ANSWER =
  "这是基于本段报告为你展开的补充回答：可以从一个很小、当下就能做的动作开始，让这段觉察慢慢落到日常里。";

/* ─── Small "追问" pill button (collapsed entry) ─── */
function AskPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 transition-colors"
      style={{
        height: "30px",
        paddingLeft: "12px",
        paddingRight: "12px",
        borderRadius: "15px",
        background: "rgba(212,160,84,0.1)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(200,160,102,0.5)",
      }}
    >
      <MessageCircleQuestion
        size={13}
        color="rgba(196,120,80,0.85)"
        strokeWidth={2}
      />
      <span
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          color: "#8A6E3C",
          letterSpacing: "0.05em",
        }}
      >
        追问
      </span>
    </button>
  );
}

/* ─── Follow-up input row (sits at panel bottom) ─── */
function AskInput({
  value,
  onChange,
  onSend,
  loading = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: "rgba(255,255,255,0.7)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(200,160,102,0.35)",
        borderRadius: "20px",
        paddingLeft: "14px",
        paddingRight: "5px",
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
        placeholder="请输入你想追问的问题"
        disabled={loading}
        style={{
          flex: 1,
          height: "38px",
          background: "transparent",
          border: "none",
          outline: "none",
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "13px",
          color: "#4A3D30",
        }}
      />
      <button
        onClick={onSend}
        disabled={loading}
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: loading
            ? "rgba(200,160,102,0.4)"
            : "linear-gradient(135deg, #C87850 0%, #D4A054 100%)",
          boxShadow: loading ? "none" : "0 1px 4px rgba(200,120,80,0.3)",
        }}
      >
        {loading ? (
          <motion.span
            className="flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={15} color="#F5EFE2" strokeWidth={2.5} />
          </motion.span>
        ) : (
          <ArrowUp size={15} color="#F5EFE2" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

/* ─── User question bubble (right) ─── */
function QuestionBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-2">
      <div
        style={{
          maxWidth: "82%",
          background: "rgba(212,160,84,0.18)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "rgba(200,160,102,0.4)",
          borderRadius: "13px 13px 3px 13px",
          paddingTop: "7px",
          paddingBottom: "7px",
          paddingLeft: "12px",
          paddingRight: "12px",
        }}
      >
        <span
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "12.5px",
            color: "#5E4B33",
            lineHeight: 1.6,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

/* ─── AI answer — "补充解读" (small white note, unlike report cards) ─── */
function AnswerCard({ text }: { text: string }) {
  return (
    <div
      className="relative overflow-hidden mb-3"
      style={{
        background: "rgba(255,255,255,0.9)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(200,160,102,0.3)",
        borderRadius: "10px",
        paddingLeft: "13px",
        paddingRight: "13px",
        paddingTop: "10px",
        paddingBottom: "11px",
      }}
    >
      {/* Gold hairline */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "2px",
          background: "linear-gradient(180deg, #D4A054, #C8A06655)",
        }}
      />
      <div className="flex items-center gap-1 mb-1.5">
        <Sparkles size={11} color="#C87850" strokeWidth={2} />
        <span
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "10.5px",
            fontWeight: 600,
            color: "#C87850",
            letterSpacing: "0.06em",
          }}
        >
          补充解读
        </span>
      </div>
      <p
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "12px",
          color: "#5E5046",
          lineHeight: 1.8,
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ─── "思考中" indicator ─── */
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-3 pl-0.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "rgba(196,120,80,0.7)",
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "12px",
          color: "rgba(122,110,96,0.9)",
          letterSpacing: "0.04em",
        }}
      >
        正在基于本段报告思考…
      </span>
    </div>
  );
}

/* ─── Folded summary bar ─── */
function FoldedBar({
  count,
  onExpand,
}: {
  count: number;
  onExpand: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      className="w-full flex items-center justify-between transition-colors"
      style={{
        background: "rgba(212,160,84,0.07)",
        borderWidth: "1px",
        borderStyle: "dashed",
        borderColor: "rgba(200,160,102,0.4)",
        borderRadius: "10px",
        paddingLeft: "14px",
        paddingRight: "12px",
        paddingTop: "9px",
        paddingBottom: "9px",
      }}
    >
      <span className="flex items-center gap-1.5">
        <MessageCircleQuestion
          size={13}
          color="rgba(196,120,80,0.7)"
          strokeWidth={2}
        />
        <span
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "12px",
            color: "#7A6E50",
            letterSpacing: "0.04em",
          }}
        >
          已追问 {count} 次，展开查看
        </span>
      </span>
      <ChevronDown size={14} color="rgba(196,120,80,0.7)" strokeWidth={2} />
    </button>
  );
}

type Round = { q: string; a: string };

/* ─── Follow-up index context (light global "本报告有 N 条追问") ─── */
type FollowupCtx = {
  register: (id: string, count: number) => void;
  unregister: (id: string) => void;
  hidden: boolean;
};
const FollowupContext = createContext<FollowupCtx | null>(null);

function FollowupIndexBar({
  total,
  hidden,
  onToggle,
}: {
  total: number;
  hidden: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between mb-5"
      style={{
        background: "transparent",
        borderBottomWidth: "1px",
        borderBottomStyle: "dashed",
        borderBottomColor: "rgba(200,160,102,0.3)",
        paddingBottom: "8px",
      }}
    >
      <span className="flex items-center gap-1.5">
        <MessageCircleQuestion
          size={12}
          color="rgba(196,120,80,0.65)"
          strokeWidth={2}
        />
        <span
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "11.5px",
            color: "rgba(122,110,96,0.85)",
            letterSpacing: "0.04em",
          }}
        >
          本报告有 {total} 条追问
        </span>
      </span>
      <span
        className="flex items-center gap-0.5"
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "11.5px",
          color: "#8A6E3C",
        }}
      >
        {hidden ? "展开" : "收起"}
        {hidden ? (
          <ChevronDown size={13} color="rgba(196,120,80,0.6)" strokeWidth={2} />
        ) : (
          <ChevronUp size={13} color="rgba(196,120,80,0.6)" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}

export function FollowupProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hidden, setHidden] = useState(false);

  const register = useCallback((id: string, count: number) => {
    setCounts((prev) =>
      prev[id] === count ? prev : { ...prev, [id]: count },
    );
  }, []);
  const unregister = useCallback((id: string) => {
    setCounts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <FollowupContext.Provider value={{ register, unregister, hidden }}>
      {total > 0 && (
        <FollowupIndexBar
          total={total}
          hidden={hidden}
          onToggle={() => setHidden((h) => !h)}
        />
      )}
      {children}
    </FollowupContext.Provider>
  );
}

/* ─── Paragraph-level follow-up control with panel + fold (AI-师傅 style) ─── */
export function FollowupInline({
  initialMode = "collapsed",
  pendingQuestion,
  seedRounds = [],
}: {
  initialMode?: "collapsed" | "open" | "folded";
  pendingQuestion?: string;
  seedRounds?: Round[];
}) {
  const ctx = useContext(FollowupContext);
  const id = useId();
  const [mode, setMode] = useState<"collapsed" | "open" | "folded">(
    initialMode,
  );
  const [rounds, setRounds] = useState<Round[]>(seedRounds);
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(
    pendingQuestion ?? null,
  );

  // Report round count up to the index bar
  useEffect(() => {
    ctx?.register(id, rounds.length);
  }, [ctx, id, rounds.length]);
  useEffect(() => () => ctx?.unregister(id), [ctx, id]);

  const handleSend = () => {
    const q = draft.trim();
    if (!q || pending) return;
    setDraft("");
    setPending(q);
    setTimeout(() => {
      setRounds((prev) => [...prev, { q, a: CANNED_ANSWER }]);
      setPending(null);
    }, 1600);
  };

  const handleCollapse = () => {
    setMode(rounds.length > 0 ? "folded" : "collapsed");
  };

  // Globally hidden via the top index bar — keep records, hide the UI
  if (ctx?.hidden) return null;

  return (
    <div className="-mt-3 mb-6">
      {/* Collapsed: only the small pill, right-aligned */}
      {mode === "collapsed" && (
        <div className="flex justify-end">
          <AskPill onClick={() => setMode("open")} />
        </div>
      )}

      {/* Folded: light summary bar */}
      {mode === "folded" && (
        <FoldedBar count={rounds.length} onExpand={() => setMode("open")} />
      )}

      {/* Open: the distinct warm follow-up panel */}
      {mode === "open" && (
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(212,160,84,0.12) 0%, rgba(200,120,80,0.07) 100%)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(200,160,102,0.4)",
            borderRadius: "14px",
            paddingLeft: "14px",
            paddingRight: "14px",
            paddingTop: "12px",
            paddingBottom: "13px",
            boxShadow: "0 1px 5px rgba(200,120,80,0.08)",
          }}
        >
          {/* Left gold hairline */}
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: "2px",
              background: "linear-gradient(180deg, #D4A054, #C8783255)",
            }}
          />

          {/* Panel header */}
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5">
              <MessageCircleQuestion
                size={12}
                color="rgba(212,160,84,0.95)"
                strokeWidth={2}
              />
              <span
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "#8A6E3C",
                  letterSpacing: "0.08em",
                }}
              >
                追问记录
                {rounds.length > 0 && ` · ${rounds.length}`}
              </span>
            </span>

            <button
              onClick={handleCollapse}
              className="flex items-center gap-0.5"
              style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                fontSize: "11.5px",
                color: "rgba(122,110,96,0.85)",
              }}
            >
              收起
              <ChevronUp
                size={13}
                color="rgba(122,110,96,0.7)"
                strokeWidth={2}
              />
            </button>
          </div>

          {/* History fold (older rounds) — only when >= 2 rounds */}
          {rounds.length >= 2 && (
            <>
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full flex items-center justify-between mb-2.5"
                style={{
                  background: "rgba(255,255,255,0.35)",
                  borderWidth: "1px",
                  borderStyle: "dashed",
                  borderColor: "rgba(200,160,102,0.4)",
                  borderRadius: "8px",
                  paddingLeft: "11px",
                  paddingRight: "10px",
                  paddingTop: "7px",
                  paddingBottom: "7px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "11.5px",
                    color: "#7A6E50",
                    letterSpacing: "0.03em",
                  }}
                >
                  {historyOpen
                    ? "收起历史问答"
                    : `已追问 ${rounds.length} 次，展开全部`}
                </span>
                {historyOpen ? (
                  <ChevronUp
                    size={13}
                    color="rgba(196,120,80,0.7)"
                    strokeWidth={2}
                  />
                ) : (
                  <ChevronDown
                    size={13}
                    color="rgba(196,120,80,0.7)"
                    strokeWidth={2}
                  />
                )}
              </button>

              {/* Older rounds, hidden until expanded */}
              {historyOpen &&
                rounds.slice(0, -1).map((r, i) => (
                  <div key={i}>
                    <QuestionBubble text={r.q} />
                    <AnswerCard text={r.a} />
                  </div>
                ))}
            </>
          )}

          {/* Latest completed round (always shown) */}
          {rounds.length > 0 && (
            <div>
              <QuestionBubble text={rounds[rounds.length - 1].q} />
              <AnswerCard text={rounds[rounds.length - 1].a} />
            </div>
          )}

          {/* Pending (thinking) round */}
          {pending && (
            <>
              <QuestionBubble text={pending} />
              <ThinkingIndicator />
            </>
          )}

          {/* Input row always at the panel bottom */}
          <AskInput
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            loading={!!pending}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Body paragraph ─── */
export function BodyText({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <p
      style={{
        fontFamily: "'Noto Sans SC', sans-serif",
        fontSize: "13.5px",
        color: muted ? "#7A6E60" : "#5E5046",
        lineHeight: 1.9,
      }}
    >
      {children}
    </p>
  );
}

/* ─── Bottom actions (save / re-upload) ─── */
export function BottomActions({
  saved,
  onSave,
  onReupload,
}: {
  saved: boolean;
  onSave: () => void;
  onReupload: () => void;
}) {
  return (
    <>
      <div className="flex gap-3 mb-3">
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-colors"
          style={{
            background: saved
              ? "rgba(91,140,90,0.1)"
              : "rgba(255,255,255,0.7)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: saved
              ? "rgba(91,140,90,0.3)"
              : "rgba(200,160,102,0.3)",
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: saved ? "#5B8C5A" : "#8A7C6C",
          }}
          onClick={onSave}
        >
          {saved ? (
            <>
              <Check size={16} />
              已保存
            </>
          ) : (
            <>
              <Download size={16} />
              保存报告
            </>
          )}
        </button>

        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full"
          style={{
            background: "rgba(255,255,255,0.7)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(200,160,102,0.3)",
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#8A7C6C",
          }}
          onClick={onReupload}
        >
          <RotateCcw size={16} />
          重新上传
        </button>
      </div>

      <p
        className="text-center"
        style={{
          fontSize: "11px",
          color: "#A89C8E",
          lineHeight: 1.5,
        }}
      >
        保存为图片，带二维码分享
      </p>
    </>
  );
}

/* ─── Footer branding ─── */
export function FooterBranding() {
  return (
    <div className="flex flex-col items-center mt-8 mb-4">
      <div
        className="w-12 h-px mb-3"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(138,124,108,0.2), transparent)",
        }}
      />
      <img
        src={combLogoFlat}
        alt="一镜一梳"
        style={{
          width: "24px",
          height: "24px",
          objectFit: "contain",
          opacity: 0.4,
        }}
      />
      <span
        className="mt-1.5"
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "11px",
          color: "#A89C8E",
          letterSpacing: "0.15em",
          opacity: 0.6,
        }}
      >
        一镜一梳
      </span>
    </div>
  );
}

/* ─── Page shell ─── */
export function ReportShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="size-full flex justify-center"
      style={{ backgroundColor: "#F5EFE2" }}
    >
      <div
        className="w-full flex flex-col relative"
        style={{
          maxWidth: "480px",
          height: "100%",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        {children}
      </div>
    </div>
  );
}
