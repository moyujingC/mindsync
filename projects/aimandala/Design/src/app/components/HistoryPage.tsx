import { useState, useCallback, forwardRef, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  Loader2,
  Upload,
  Star,
  User,
  Baby,
  Coins,
  HeartPulse,
  Sprout,
  Users,
  Check,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import dunhuangPattern from "figma:asset/176d69efc81b256182be2c6f62c7d48ce8cbe05b.png";

/* ─── Types ─── */
type RecordStatus = "viewable" | "generating";
type ReportType = "Lite" | "Pro";
type ThemeKey =
  | "\u5168\u9762\u770b\u770b"
  | "\u7236\u4eb2\u5173\u7cfb"
  | "\u6bcd\u4eb2\u5173\u7cfb"
  | "\u4eb2\u5bc6\u5173\u7cfb"
  | "\u4eb2\u5b50\u5173\u7cfb"
  | "\u8d22\u5bcc\u4e8b\u4e1a"
  | "\u8eab\u4f53\u5065\u5eb7"
  | "\u4e2a\u4eba\u6210\u957f";

interface HistoryRecord {
  id: string;
  theme: ThemeKey;
  createdAt: string;
  reportType: ReportType;
  status: RecordStatus;
  statusNote: string;
  viewed: boolean;
  progress?: number; // 0-100, only for generating status
  mandalaImage: string; // 曼陀罗画作缩略图
}

/* ─── Mock data ─── */
const MOCK_RECORDS: HistoryRecord[] = [
  {
    id: "r1",
    theme: "\u4eb2\u5bc6\u5173\u7cfb",
    createdAt: "04/17 09:30",
    reportType: "Pro",
    status: "viewable",
    statusNote: "",
    viewed: false,
    mandalaImage: "https://images.unsplash.com/photo-1741166237257-d694c313def0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5kYWxhJTIwYXJ0JTIwY29sb3JmdWwlMjBzeW1tZXRyaWNhbHxlbnwxfHx8fDE3NzY0MjgwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "r1b",
    theme: "\u4eb2\u5bc6\u5173\u7cfb",
    createdAt: "04/17 09:30",
    reportType: "Lite",
    status: "viewable",
    statusNote: "",
    viewed: false,
    mandalaImage: "https://images.unsplash.com/photo-1741166237257-d694c313def0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5kYWxhJTIwYXJ0JTIwY29sb3JmdWwlMjBzeW1tZXRyaWNhbHxlbnwxfHx8fDE3NzY0MjgwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "r2",
    theme: "\u8d22\u5bcc\u4e8b\u4e1a",
    createdAt: "04/16 14:22",
    reportType: "Lite",
    status: "viewable",
    statusNote: "",
    viewed: false,
    mandalaImage: "https://images.unsplash.com/photo-1623492962519-ac982cffae56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWJldGFuJTIwbWFuZGFsYSUyMHRyYWRpdGlvbmFsJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzc2NDI4MDc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "r3",
    theme: "\u4e2a\u4eba\u6210\u957f",
    createdAt: "04/15 20:10",
    reportType: "Pro",
    status: "generating",
    statusNote: "",
    viewed: false,
    progress: 45,
    mandalaImage: "https://images.unsplash.com/photo-1773037317299-c9cf9b28c5d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5kYWxhJTIwbWVkaXRhdGlvbiUyMGNpcmN1bGFyJTIwcGF0dGVybnxlbnwxfHx8fDE3NzY0MjgwNzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "r4",
    theme: "\u6bcd\u4eb2\u5173\u7cfb",
    createdAt: "04/14 11:05",
    reportType: "Lite",
    status: "viewable",
    statusNote: "",
    viewed: true,
    mandalaImage: "https://images.unsplash.com/photo-1776058825001-7ca51338f738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWNyZWQlMjBnZW9tZXRyeSUyMG1hbmRhbGElMjBzcGlyaXR1YWx8ZW58MXx8fHwxNzc2NDI4MDc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "r5",
    theme: "\u5168\u9762\u770b\u770b",
    createdAt: "04/12 08:45",
    reportType: "Pro",
    status: "viewable",
    statusNote: "",
    viewed: true,
    mandalaImage: "https://images.unsplash.com/photo-1664403489326-0591c36be436?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5kYWxhJTIwYXJ0JTIwaW50cmljYXRlJTIwZGV0YWlsZWR8ZW58MXx8fHwxNzc2NDI4MDc2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

/* ─── Status filter pills ─── */
type StatusFilter = "all" | "viewable" | "unviewed" | "generating";
type TimeFilterMode = "recent" | "custom";
type RecentMonths = 1 | 3 | 6 | 12;

/* ─── Theme options (matches Upload ThemeSelector) ─── */
const THEME_OPTIONS: {
  id: ThemeKey;
  icon: LucideIcon;
  label: string;
  sub: string;
}[] = [
  { id: "\u5168\u9762\u770b\u770b", icon: Star, label: "\u5168\u9762", sub: "\u770b\u770b" },
  { id: "\u7236\u4eb2\u5173\u7cfb", icon: User, label: "\u7236\u4eb2", sub: "\u5173\u7cfb" },
  { id: "\u6bcd\u4eb2\u5173\u7cfb", icon: User, label: "\u6bcd\u4eb2", sub: "\u5173\u7cfb" },
  { id: "\u4eb2\u5bc6\u5173\u7cfb", icon: Users, label: "\u4eb2\u5bc6", sub: "\u5173\u7cfb" },
  { id: "\u4eb2\u5b50\u5173\u7cfb", icon: Baby, label: "\u4eb2\u5b50", sub: "\u5173\u7cfb" },
  { id: "\u8d22\u5bcc\u4e8b\u4e1a", icon: Coins, label: "\u8d22\u5bcc", sub: "\u4e8b\u4e1a" },
  { id: "\u8eab\u4f53\u5065\u5eb7", icon: HeartPulse, label: "\u8eab\u4f53", sub: "\u5065\u5eb7" },
  { id: "\u4e2a\u4eba\u6210\u957f", icon: Sprout, label: "\u4e2a\u4eba", sub: "\u6210\u957f" },
];

/* ─── Helper: theme colors ─── */
function themeColors(theme: ThemeKey) {
  const map: Record<
    ThemeKey,
    { accent: string; glow: string; bg: string; icon: string }
  > = {
    "\u5168\u9762\u770b\u770b": {
      accent: "rgba(200,160,100,0.85)",
      glow: "rgba(200,160,100,0.18)",
      bg: "linear-gradient(145deg, rgba(200,160,100,0.08) 0%, transparent 60%)",
      icon: "\u25ce",
    },
    "\u7236\u4eb2\u5173\u7cfb": {
      accent: "rgba(160,140,110,0.85)",
      glow: "rgba(160,140,110,0.18)",
      bg: "linear-gradient(145deg, rgba(160,140,110,0.08) 0%, transparent 60%)",
      icon: "\u2662",
    },
    "\u6bcd\u4eb2\u5173\u7cfb": {
      accent: "rgba(190,140,120,0.85)",
      glow: "rgba(190,140,120,0.18)",
      bg: "linear-gradient(145deg, rgba(190,140,120,0.08) 0%, transparent 60%)",
      icon: "\u2740",
    },
    "\u4eb2\u5bc6\u5173\u7cfb": {
      accent: "rgba(200,120,80,0.85)",
      glow: "rgba(200,120,80,0.18)",
      bg: "linear-gradient(145deg, rgba(200,120,80,0.08) 0%, transparent 60%)",
      icon: "\u2661",
    },
    "\u4eb2\u5b50\u5173\u7cfb": {
      accent: "rgba(190,155,110,0.85)",
      glow: "rgba(190,155,110,0.15)",
      bg: "linear-gradient(145deg, rgba(190,155,110,0.08) 0%, transparent 60%)",
      icon: "\u25c7",
    },
    "\u8d22\u5bcc\u4e8b\u4e1a": {
      accent: "rgba(212,170,84,0.85)",
      glow: "rgba(212,170,84,0.18)",
      bg: "linear-gradient(145deg, rgba(212,170,84,0.08) 0%, transparent 60%)",
      icon: "\u2606",
    },
    "\u8eab\u4f53\u5065\u5eb7": {
      accent: "rgba(158,170,155,0.9)",
      glow: "rgba(158,170,155,0.15)",
      bg: "linear-gradient(145deg, rgba(158,170,155,0.08) 0%, transparent 60%)",
      icon: "\u25cb",
    },
    "\u4e2a\u4eba\u6210\u957f": {
      accent: "rgba(170,155,190,0.85)",
      glow: "rgba(170,155,190,0.15)",
      bg: "linear-gradient(145deg, rgba(170,155,190,0.08) 0%, transparent 60%)",
      icon: "\u2727",
    },
  };
  return map[theme] || map["\u5168\u9762\u770b\u770b"];
}

/* ─── SVG noise filter ─── */
function NoiseFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <filter id="historyNoise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
  );
}

/* ─── Floating golden particles (from LandingPage) ─── */
function FloatingParticles() {
  const particles = [
    { x: "8%", y: "15%", size: 3, delay: 0, duration: 7 },
    { x: "82%", y: "10%", size: 2.5, delay: 1.5, duration: 8 },
    { x: "20%", y: "55%", size: 4, delay: 0.8, duration: 6.5 },
    { x: "90%", y: "45%", size: 2, delay: 2.2, duration: 7.5 },
    { x: "55%", y: "25%", size: 3, delay: 1.0, duration: 8.5 },
    { x: "70%", y: "70%", size: 2.5, delay: 0.3, duration: 6.8 },
    { x: "35%", y: "85%", size: 3, delay: 2.8, duration: 7.2 },
    { x: "15%", y: "40%", size: 2, delay: 3.5, duration: 9 },
    { x: "65%", y: "90%", size: 3.5, delay: 1.8, duration: 6 },
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
              "radial-gradient(circle, rgba(212,160,84,0.8) 0%, rgba(212,160,84,0) 70%)",
            boxShadow: `0 0 ${p.size * 3}px rgba(212,160,84,0.4)`,
          }}
          animate={{
            y: [0, -18, 6, -12, 0],
            x: [0, 6, -4, 8, 0],
            opacity: [0.2, 0.7, 0.4, 0.8, 0.2],
            scale: [1, 1.3, 0.9, 1.2, 1],
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

/* ─── Twinkling stars ─── */
function TwinklingStars() {
  const stars = [
    { x: "10%", y: "8%", size: 1.5, delay: 0 },
    { x: "30%", y: "5%", size: 1, delay: 1.2 },
    { x: "60%", y: "12%", size: 1.5, delay: 0.5 },
    { x: "85%", y: "7%", size: 1, delay: 2.0 },
    { x: "45%", y: "18%", size: 1.2, delay: 0.8 },
    { x: "75%", y: "22%", size: 1, delay: 1.5 },
    { x: "18%", y: "28%", size: 1.5, delay: 3.0 },
    { x: "92%", y: "30%", size: 1, delay: 0.3 },
    { x: "5%", y: "35%", size: 1.2, delay: 2.5 },
    { x: "50%", y: "40%", size: 1, delay: 1.8 },
    { x: "38%", y: "55%", size: 1.5, delay: 0.7 },
    { x: "72%", y: "60%", size: 1, delay: 2.3 },
    { x: "25%", y: "72%", size: 1.2, delay: 1.1 },
    { x: "88%", y: "78%", size: 1, delay: 3.2 },
    { x: "55%", y: "85%", size: 1.5, delay: 0.4 },
  ];

  return (
    <>
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            background: "rgba(232,220,200,0.9)",
          }}
          animate={{
            opacity: [0.1, 0.6, 0.15, 0.5, 0.1],
            scale: [1, 1.4, 1, 1.3, 1],
          }}
          transition={{
            duration: 4 + i * 0.3,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

/* ─── Decorative Separator ─── */
function GoldSeparator() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div
        className="flex-1"
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(212,160,84,0.25), transparent)",
        }}
      />
      <motion.div
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,160,84,0.6) 0%, rgba(200,120,80,0.3) 100%)",
          boxShadow: "0 0 10px rgba(212,160,84,0.35)",
        }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="flex-1"
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(212,160,84,0.25), transparent)",
        }}
      />
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: RecordStatus }) {
  const isViewable = status === "viewable";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
      style={{
        fontSize: "11px",
        fontFamily: "'Noto Sans SC', sans-serif",
        fontWeight: 500,
        color: isViewable ? "#A8C4A0" : "#E0B46A",
        background: isViewable
          ? "rgba(158,170,155,0.15)"
          : "rgba(212,160,84,0.12)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isViewable
          ? "rgba(158,170,155,0.3)"
          : "rgba(212,160,84,0.25)",
        backdropFilter: "blur(8px)",
      }}
    >
      {isViewable ? (
        "\u53ef\u67e5\u770b"
      ) : (
        <>
          <Loader2
            size={10}
            className="animate-spin"
            style={{ color: "#E0B46A" }}
          />
          {"\u751f\u6210\u4e2d"}
        </>
      )}
    </span>
  );
}

/* ─── Type Badge ─── */
function TypeBadge({ type }: { type: ReportType }) {
  const isLite = type === "Lite";
  const isPro = type === "Pro";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full"
      style={{
        fontSize: "10px",
        fontFamily: "'Noto Sans SC', sans-serif",
        fontWeight: 500,
        letterSpacing: "0.04em",
        color: isPro
          ? "#E0B46A"
          : isLite
            ? "#A8C4A0"
            : "rgba(232,220,200,0.65)",
        background: isPro
          ? "rgba(212,160,84,0.1)"
          : isLite
            ? "rgba(158,170,155,0.1)"
            : "rgba(138,124,108,0.1)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isPro
          ? "rgba(212,160,84,0.2)"
          : isLite
            ? "rgba(158,170,155,0.22)"
            : "rgba(138,124,108,0.15)",
      }}
    >
      {type}
    </span>
  );
}

/* ─── Status Indicator (right side of card) ─── */
function StatusIndicator({ record }: { record: HistoryRecord }) {
  const isGenerating = record.status === "generating";
  const isUnviewed = record.status === "viewable" && !record.viewed;

  if (isGenerating) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
        style={{
          fontSize: "10px",
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 600,
          color: "#E0B46A",
          background: "rgba(212,160,84,0.12)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "rgba(212,160,84,0.25)",
          letterSpacing: "0.04em",
        }}
      >
        <Loader2 size={10} className="animate-spin" style={{ color: "#E0B46A" }} />
        {"\u751f\u6210\u4e2d"}
      </span>
    );
  }

  if (isUnviewed) {
    return (
      <motion.span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
        style={{
          fontSize: "10px",
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 600,
          color: "#E0B46A",
          background: "rgba(212,160,84,0.12)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "rgba(212,160,84,0.25)",
          letterSpacing: "0.04em",
        }}
        animate={{
          borderColor: [
            "rgba(212,160,84,0.25)",
            "rgba(212,160,84,0.5)",
            "rgba(212,160,84,0.25)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Eye size={10} style={{ color: "#E0B46A" }} />
        {"\u5f85\u67e5\u770b"}
      </motion.span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
      style={{
        fontSize: "10px",
        fontFamily: "'Noto Sans SC', sans-serif",
        fontWeight: 500,
        color: "#A8C4A0",
        background: "rgba(158,170,155,0.12)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(158,170,155,0.25)",
        letterSpacing: "0.04em",
      }}
    >
      <Check size={10} style={{ color: "#A8C4A0" }} />
      {"\u53ef\u67e5\u770b"}
    </span>
  );
}

/* ─── Record Card (horizontal with left thumbnail) ─── */
const RecordCard = forwardRef<
  HTMLButtonElement,
  {
    record: HistoryRecord;
    index: number;
    onOpen: (r: HistoryRecord) => void;
  }
>(function RecordCard({ record, index, onOpen }, ref) {
  const tc = themeColors(record.theme);
  return (
    <motion.button
      ref={ref}
      className="w-full rounded-2xl overflow-hidden relative text-left cursor-pointer flex"
      style={{
        background:
          "linear-gradient(160deg, rgba(22,35,60,0.85) 0%, rgba(28,42,72,0.65) 50%, rgba(22,35,60,0.75) 100%)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(212,160,84,0.15)",
        boxShadow: `0 2px 20px ${tc.glow}, 0 0 40px rgba(17,26,48,0.5)`,
        height: "100px",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(record)}
    >
      {/* Mandala Thumbnail - Left */}
      <div className="relative flex-shrink-0" style={{ width: "100px", height: "100px" }}>
        <img
          src={record.mandalaImage}
          alt={`${record.theme}\u66fc\u9640\u7f57`}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 50%, rgba(22,35,60,0.6) 100%)",
          }}
        />
      </div>

      {/* Info - Right */}
      <div className="flex-1 flex flex-col justify-center px-3.5 py-2.5 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ fontSize: "14px", lineHeight: 1, color: "#D4A054" }}>
            {tc.icon}
          </span>
          <h3
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#EDE4D4",
              letterSpacing: "0.04em",
            }}
          >
            {record.theme}
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center gap-1"
            style={{
              fontSize: "11px",
              fontFamily: "'Noto Sans SC', sans-serif",
              color: "rgba(232,220,200,0.6)",
            }}
          >
            <Clock size={10} />
            {record.createdAt}
          </span>
          <TypeBadge type={record.reportType} />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center pr-3 flex-shrink-0">
        <StatusIndicator record={record} />
      </div>
    </motion.button>
  );
});
RecordCard.displayName = "RecordCard";

/* ─── Filter Pill ─── */
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="px-3 py-1 rounded-full transition-all"
      style={{
        fontSize: "12px",
        fontFamily: "'Noto Sans SC', sans-serif",
        fontWeight: 500,
        color: active ? "#EDE4D4" : "rgba(232,220,200,0.4)",
        background: active
          ? "linear-gradient(135deg, rgba(200,120,80,0.22), rgba(212,160,84,0.14))"
          : "rgba(138,124,108,0.06)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: active
          ? "rgba(200,120,80,0.4)"
          : "rgba(138,124,108,0.12)",
        boxShadow: active ? "0 0 12px rgba(212,160,84,0.1)" : "none",
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/* ─── Mandala Record Card ─── */
function MandalaRecordCard({
  record,
  index,
  onOpen,
}: {
  record: HistoryRecord;
  index: number;
  onOpen: (r: HistoryRecord) => void;
}) {
  const isGenerating = record.status === "generating";
  const [currentProgress, setCurrentProgress] = useState(
    record.progress || 0
  );

  // Simulate progress updates for generating records
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5;
        return Math.min(prev + increment, 95);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const tc = themeColors(record.theme);

  return (
    <motion.button
      className="w-full rounded-2xl overflow-hidden relative text-left cursor-pointer flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, rgba(22,35,60,0.85) 0%, rgba(28,42,72,0.65) 50%, rgba(22,35,60,0.75) 100%)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(212,160,84,0.15)",
        boxShadow: `0 2px 20px ${tc.glow}, 0 0 40px rgba(17,26,48,0.5)`,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !isGenerating && onOpen(record)}
      disabled={isGenerating}
    >
      {/* Horizontal layout: thumbnail left + info right */}
      <div className="flex" style={{ height: "100px" }}>
        {/* Mandala Thumbnail - Left */}
        <div className="relative flex-shrink-0" style={{ width: "100px", height: "100px" }}>
          <img
            src={record.mandalaImage}
            alt={`${record.theme}\u66fc\u9640\u7f57`}
            className="w-full h-full object-cover"
            style={{ opacity: isGenerating ? 0.5 : 1 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 50%, rgba(22,35,60,0.6) 100%)",
            }}
          />
          {/* Generating overlay on thumbnail */}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(14,22,40,0.4)" }}>
              
            </div>
          )}
        </div>

        {/* Info - Right */}
        <div className="flex-1 flex flex-col justify-center px-3.5 py-2.5 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: "14px", lineHeight: 1, color: "#D4A054" }}>
              {tc.icon}
            </span>
            <h3
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "15px",
                fontWeight: 600,
                color: "#EDE4D4",
                letterSpacing: "0.04em",
              }}
            >
              {record.theme}
            </h3>
          </div>
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className="flex items-center gap-1"
              style={{
                fontSize: "11px",
                fontFamily: "'Noto Sans SC', sans-serif",
                color: "rgba(232,220,200,0.6)",
              }}
            >
              <Clock size={10} />
              {record.createdAt}
            </span>
            <TypeBadge type={record.reportType} />
          </div>
          {isGenerating && (
            <span
              style={{
                fontSize: "11px",
                fontFamily: "'Noto Sans SC', sans-serif",
                fontWeight: 500,
                color: "#E0B46A",
              }}
            >
              {Math.round(currentProgress)}%
            </span>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center pr-3 flex-shrink-0">
          <StatusIndicator record={record} />
        </div>
      </div>

      {/* Progress bar (only for generating) */}
      {isGenerating && (
        <div className="px-3 pb-2.5">
          <div
            className="relative rounded-full overflow-hidden"
            style={{
              height: "4px",
              background: "rgba(22,35,60,0.8)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "rgba(212,160,84,0.15)",
            }}
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(212,160,84,0.6), rgba(200,120,80,0.7))",
                boxShadow: "0 0 8px rgba(212,160,84,0.4)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
}

/* ─── Pending Review Section ─── */
function PendingReviewSection({
  records,
  onOpen,
}: {
  records: HistoryRecord[];
  onOpen: (r: HistoryRecord) => void;
}) {
  // Filter: generating OR (viewable AND not viewed)
  const pendingRecords = records.filter(
    (r) => r.status === "generating" || (r.status === "viewable" && !r.viewed)
  );

  if (pendingRecords.length === 0) {
    return (
      <div className="mb-5">
        <p
          className="mb-3"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "15px",
            fontWeight: 600,
            color: "#D4A054",
            letterSpacing: "0.06em",
          }}
        >
          {"\u5f85\u67e5\u770b\u7684\u89e3\u8bfb"}
        </p>
        <p
          style={{
            fontSize: "12px",
            fontFamily: "'Noto Sans SC', sans-serif",
            color: "rgba(232,220,200,0.35)",
            lineHeight: 1.7,
          }}
        >
          {"\u5f53\u524d\u6ca1\u6709\u5f85\u67e5\u770b\u7684\u89e3\u8bfb"}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <p
        className="mb-1.5"
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "15px",
          fontWeight: 600,
          color: "#D4A054",
          letterSpacing: "0.06em",
        }}
      >
        {"\u5f85\u67e5\u770b\u7684\u89e3\u8bfb"}
      </p>
      <p
        className="mb-3"
        style={{
          fontSize: "11px",
          fontFamily: "'Noto Sans SC', sans-serif",
          color: "rgba(232,220,200,0.45)",
          lineHeight: 1.7,
        }}
      >
        {"\u8fd9\u91cc\u4f1a\u4f18\u5148\u663e\u793a\u8fd8\u5728\u751f\u6210\u4e2d\uff0c\u6216\u521a\u751f\u6210\u5b8c\u6210\u3001\u8fd8\u6ca1\u6765\u5f97\u53ca\u67e5\u770b\u7684\u62a5\u544a\u3002"}
      </p>
      <div className="flex flex-col gap-3">
        {pendingRecords.map((record, i) => (
          <MandalaRecordCard
            key={record.id}
            record={record}
            index={i}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

/* ========== HISTORY PAGE ========== */
export function HistoryPage() {
  const navigate = useNavigate();
  const [records] = useState<HistoryRecord[]>(MOCK_RECORDS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [themeFilter, setThemeFilter] = useState<string>("\u5168\u9762\u770b\u770b");
  const [timeMode, setTimeMode] = useState<TimeFilterMode>("recent");
  const [recentMonths, setRecentMonths] = useState<RecentMonths>(3);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = records
    .filter((r) => {
      if (statusFilter === "viewable") return r.status === "viewable";
      if (statusFilter === "unviewed") return r.status === "viewable" && !r.viewed;
      if (statusFilter === "generating") return r.status === "generating";
      return true;
    })
    .filter((r) => {
      if (themeFilter === "all") return true;
      return r.theme === themeFilter;
    })
    .filter((r) => {
      const rDate = new Date(r.date);
      if (timeMode === "recent") {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - recentMonths);
        return rDate >= cutoff;
      }
      if (timeMode === "custom") {
        if (startDate && rDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (rDate > end) return false;
        }
        return true;
      }
      return true;
    });

  const totalCount = records.length;
  const viewableCount = records.filter((r) => r.status === "viewable").length;
  const generatingCount = records.filter(
    (r) => r.status === "generating"
  ).length;

  const themes = Array.from(new Set(records.map((r) => r.theme)));

  const handleOpen = useCallback(
    (record: HistoryRecord) => {
      setTimeout(() => {
        navigate("/report");
      }, 300);
    },
    [navigate]
  );

  const isEmpty = records.length === 0;

  return (
    <div
      className="size-full flex justify-center"
      style={{
        background:
          "linear-gradient(180deg, #0E1628 0%, #152038 40%, #111A30 100%)",
      }}
    >
      <NoiseFilter />
      <div
        className="w-full flex flex-col relative overflow-hidden"
        style={{
          maxWidth: "480px",
          height: "100%",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        {/* ─── Atmospheric layers ─── */}

        {/* Deep warm ambient glow — top left (like moon glow in the photos) */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-60px",
            left: "-80px",
            width: "320px",
            height: "320px",
            background:
              "radial-gradient(ellipse at center, rgba(200,160,100,0.08) 0%, rgba(200,160,100,0.03) 40%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Warm golden glow — right side */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "200px",
            right: "-100px",
            width: "350px",
            height: "350px",
            background:
              "radial-gradient(ellipse, rgba(212,160,84,0.06) 0%, rgba(212,160,84,0.02) 45%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Jade-green ethereal glow — center-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "450px",
            left: "-40px",
            width: "250px",
            height: "250px",
            background:
              "radial-gradient(ellipse, rgba(158,170,155,0.05) 0%, transparent 65%)",
            borderRadius: "50%",
          }}
        />

        {/* Bottom warm haze */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-50px",
            left: "30%",
            width: "300px",
            height: "200px",
            background:
              "radial-gradient(ellipse, rgba(200,140,80,0.05) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Twinkling stars */}
        <TwinklingStars />

        {/* Floating golden particles */}
        <FloatingParticles />

        {/* Clay noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            filter: "url(#historyNoise)",
            opacity: 0.025,
            mixBlendMode: "overlay",
          }}
        />

        {/* ─── Header ─── */}
        <div
          className="flex items-center px-4 py-3 relative overflow-hidden flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(14,22,40,0.95) 0%, rgba(21,32,56,0.9) 50%, rgba(14,22,40,0.95) 100%)",
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: "rgba(212,160,84,0.15)",
          }}
        >
          {/* Header warm glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              right: "30px",
              top: "-15px",
              width: "100px",
              height: "60px",
              background:
                "radial-gradient(ellipse, rgba(212,160,84,0.12) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <button
            className="p-1"
            style={{ color: "rgba(232,220,200,0.55)" }}
            onClick={() => navigate("/")}
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
              color: "#D4A054",
            }}
          >
            {"\u5386\u53f2\u89e3\u8bfb"}
          </span>
        </div>

        {/* ─── Scrollable content ─── */}
        <div
          className="flex-1 overflow-y-auto relative"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Dunhuang pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${dunhuangPattern})`,
              backgroundSize: "300px",
              backgroundRepeat: "repeat",
              opacity: 0.02,
            }}
          />

          <div className="relative px-5 pt-6 pb-10">
            {/* ─── Page Hero ─── */}
            <motion.div
              className="rounded-2xl overflow-hidden relative mb-6"
              style={{
                background:
                  "linear-gradient(160deg, rgba(20,32,55,0.9) 0%, rgba(30,45,70,0.5) 40%, rgba(18,28,48,0.8) 100%)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(212,160,84,0.15)",
                boxShadow:
                  "0 4px 30px rgba(212,160,84,0.08), 0 0 60px rgba(17,26,48,0.5)",
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Luminous halo top-right */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: "-40px",
                  right: "-30px",
                  width: "180px",
                  height: "140px",
                  background:
                    "radial-gradient(ellipse, rgba(212,160,84,0.12) 0%, rgba(212,160,84,0.04) 50%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              {/* Warm glow bottom-left */}
              <div
                className="absolute pointer-events-none"
                style={{
                  bottom: "-25px",
                  left: "5%",
                  width: "140px",
                  height: "90px",
                  background:
                    "radial-gradient(ellipse, rgba(200,120,80,0.08) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              <div className="relative px-5 py-6 overflow-hidden">
                {/* Decorative crescent moon — larger, brighter */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "10px",
                    right: "18px",
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    boxShadow:
                      "inset -8px 3px 0 rgba(212,160,84,0.65), 0 0 40px rgba(212,160,84,0.35), 0 0 80px rgba(212,160,84,0.18), 0 0 120px rgba(212,160,84,0.08)",
                  }}
                />

                {/* Floating cloud wisps — more visible */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "14px",
                    left: "16px",
                    width: "70px",
                    height: "22px",
                    background:
                      "radial-gradient(ellipse, rgba(200,180,150,0.18) 0%, rgba(158,170,155,0.08) 50%, transparent 80%)",
                    borderRadius: "50%",
                    transform: "rotate(-8deg)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "28px",
                    left: "40px",
                    width: "55px",
                    height: "16px",
                    background:
                      "radial-gradient(ellipse, rgba(212,180,120,0.14) 0%, transparent 75%)",
                    borderRadius: "50%",
                    transform: "rotate(5deg)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "8px",
                    left: "55px",
                    width: "40px",
                    height: "14px",
                    background:
                      "radial-gradient(ellipse, rgba(200,180,150,0.1) 0%, transparent 75%)",
                    borderRadius: "50%",
                    transform: "rotate(-3deg)",
                  }}
                />

                {/* Stars — brighter, more of them */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "8px",
                    right: "68px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "rgba(232,220,200,0.7)",
                    boxShadow: "0 0 8px rgba(232,220,200,0.5)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "42px",
                    right: "62px",
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "rgba(212,160,84,0.6)",
                    boxShadow: "0 0 6px rgba(212,160,84,0.4)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "4px",
                    right: "44px",
                    width: "2.5px",
                    height: "2.5px",
                    borderRadius: "50%",
                    background: "rgba(232,220,200,0.55)",
                    boxShadow: "0 0 5px rgba(232,220,200,0.35)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "20px",
                    right: "78px",
                    width: "2px",
                    height: "2px",
                    borderRadius: "50%",
                    background: "rgba(232,220,200,0.45)",
                    boxShadow: "0 0 4px rgba(232,220,200,0.25)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "50px",
                    right: "45px",
                    width: "2px",
                    height: "2px",
                    borderRadius: "50%",
                    background: "rgba(212,160,84,0.4)",
                    boxShadow: "0 0 4px rgba(212,160,84,0.2)",
                  }}
                />

                {/* Flying crane silhouettes */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "22px",
                    right: "100px",
                    width: "18px",
                    height: "6px",
                    borderTopWidth: "1.5px",
                    borderTopStyle: "solid",
                    borderTopColor: "rgba(232,220,200,0.18)",
                    borderRadius: "50%",
                    transform: "rotate(-10deg)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "17px",
                    right: "122px",
                    width: "14px",
                    height: "5px",
                    borderTopWidth: "1px",
                    borderTopStyle: "solid",
                    borderTopColor: "rgba(232,220,200,0.12)",
                    borderRadius: "50%",
                    transform: "rotate(-15deg)",
                  }}
                />

                {/* Mountain back layer — tall, solid */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: "0",
                    right: "0",
                    width: "100%",
                    height: "55px",
                    background:
                      "linear-gradient(to top, rgba(6,10,20,1) 0%, rgba(10,16,30,0.7) 50%, transparent 100%)",
                    clipPath: "polygon(45% 100%, 50% 50%, 58% 68%, 65% 25%, 75% 52%, 82% 15%, 92% 40%, 100% 28%, 100% 100%)",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: "0",
                    left: "0",
                    width: "100%",
                    height: "50px",
                    background:
                      "linear-gradient(to top, rgba(6,10,20,1) 0%, rgba(10,16,30,0.65) 50%, transparent 100%)",
                    clipPath: "polygon(0% 100%, 0% 32%, 6% 48%, 14% 22%, 22% 42%, 32% 18%, 42% 48%, 50% 62%, 50% 100%)",
                  }}
                />
                {/* Mountain mid-layer */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: "0",
                    left: "0",
                    width: "100%",
                    height: "40px",
                    background:
                      "linear-gradient(to top, rgba(12,18,35,0.85) 0%, rgba(16,24,45,0.35) 65%, transparent 100%)",
                    clipPath: "polygon(0% 100%, 8% 58%, 20% 72%, 35% 42%, 50% 62%, 65% 38%, 78% 58%, 92% 45%, 100% 52%, 100% 100%)",
                  }}
                />
                {/* Mountain golden edge highlight */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: "0",
                    left: "0",
                    width: "100%",
                    height: "55px",
                    clipPath: "polygon(45% 100%, 50% 50%, 58% 68%, 65% 25%, 75% 52%, 82% 15%, 92% 40%, 100% 28%, 100% 28.5%, 92% 40.5%, 82% 15.5%, 75% 52.5%, 65% 25.5%, 58% 68.5%, 50% 50.5%, 45% 100%)",
                    background: "rgba(212,160,84,0.15)",
                  }}
                />

                {/* Lotus petal arc — bottom center */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: "4px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "50px",
                    height: "18px",
                    borderRadius: "50% 50% 0 0",
                    background:
                      "radial-gradient(ellipse at bottom, rgba(212,160,84,0.18) 0%, transparent 80%)",
                    boxShadow: "0 -3px 14px rgba(212,160,84,0.1)",
                  }}
                />

                <p
                  className="mt-2.5"
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#EDE4D4",
                    letterSpacing: "0.08em",
                    lineHeight: 1.4,
                  }}
                >
                  {"\u67e5\u770b\u5df2\u751f\u6210\u7684\u89e3\u8bfb\u8bb0\u5f55"}
                </p>
                <p
                  className="mt-2"
                  style={{
                    fontSize: "13px",
                    fontFamily: "'Noto Sans SC', sans-serif",
                    color: "rgba(232,220,200,0.45)",
                    lineHeight: 1.7,
                  }}
                >
                  {"\u8fd9\u91cc\u4fdd\u7559\u4f60\u5df2\u7ecf\u751f\u6210\u8fc7\u7684\u6240\u6709\u89e3\u8bfb\u8bb0\u5f55\uff0c\u65b9\u4fbf\u4f60\u968f\u65f6\u56de\u770b\u3002"}
                </p>
              </div>
              {/* Bottom glow line */}
              <div
                style={{
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,160,84,0.25) 30%, rgba(200,120,80,0.2) 70%, transparent)",
                }}
              />
            </motion.div>

            {isEmpty ? (
              /* ─── Empty state ─── */
              <div className="flex flex-col items-center py-16">
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-5 relative"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(200,120,80,0.1), rgba(212,160,84,0.06))",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "rgba(212,160,84,0.2)",
                    boxShadow:
                      "0 0 40px rgba(212,160,84,0.12), inset 0 0 20px rgba(212,160,84,0.05)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 40px rgba(212,160,84,0.12), inset 0 0 20px rgba(212,160,84,0.05)",
                      "0 0 50px rgba(212,160,84,0.18), inset 0 0 25px rgba(212,160,84,0.08)",
                      "0 0 40px rgba(212,160,84,0.12), inset 0 0 20px rgba(212,160,84,0.05)",
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <FileText size={28} color="rgba(212,160,84,0.5)" />
                </motion.div>
                <p
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "#EDE4D4",
                    letterSpacing: "0.06em",
                  }}
                >
                  {"\u4f60\u8fd8\u6ca1\u6709\u5386\u53f2\u89e3\u8bfb"}
                </p>
                <p
                  className="mt-2 text-center"
                  style={{
                    fontSize: "13px",
                    color: "rgba(232,220,200,0.45)",
                    lineHeight: 1.7,
                    maxWidth: "260px",
                  }}
                >
                  {"\u5b8c\u6210\u7b2c\u4e00\u6b21\u4e0a\u4f20\u540e\uff0c\u8fd9\u91cc\u4f1a\u4fdd\u7559\u4f60\u7684\u62a5\u544a\u8bb0\u5f55\u3002"}
                </p>
                <button
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full active:scale-[0.97]"
                  style={{
                    background:
                      "linear-gradient(135deg, #9B4030 0%, #C87850 30%, #D4A054 60%, #C87850 85%, #9B4030 100%)",
                    fontSize: "14px",
                    fontFamily: "'Noto Serif SC', serif",
                    fontWeight: 500,
                    color: "#F5EFE2",
                    letterSpacing: "0.08em",
                    boxShadow: "0 4px 20px rgba(200,120,80,0.25)",
                  }}
                  onClick={() => navigate("/upload")}
                >
                  <Upload size={15} />
                  {"\u53bb\u4e0a\u4f20\u753b\u4f5c"}
                </button>
              </div>
            ) : (
              <>
                {/* ─── Pending Review Section ─── */}
                <PendingReviewSection records={records} onOpen={handleOpen} />

                <GoldSeparator />

                {/* ─── All History Records Title ─── */}
                <p
                  className="mb-4"
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#D4A054",
                    letterSpacing: "0.06em",
                  }}
                >
                  {"\u5168\u90e8\u5386\u53f2\u8bb0\u5f55"}
                </p>

                {/* ─── Summary Cards ─── */}
                <div className="flex gap-2.5 mb-1">
                  {[
                    {
                      label: "\u53ef\u67e5\u770b",
                      value: viewableCount,
                      color: "#A8C4A0",
                      accent: "rgba(158,170,155,0.4)",
                      glow: "rgba(158,170,155,0.1)",
                      borderColor: "rgba(158,170,155,0.18)",
                    },
                    {
                      label: "\u751f\u6210\u4e2d",
                      value: generatingCount,
                      color: "#E0B46A",
                      accent: "rgba(212,160,84,0.35)",
                      glow: "rgba(212,160,84,0.12)",
                      borderColor: "rgba(212,160,84,0.18)",
                    },
                  ].map((s) => (
                    <motion.div
                      key={s.label}
                      className="flex-1 rounded-xl px-3 py-3 text-center relative overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(160deg, rgba(22,35,60,0.7) 0%, rgba(18,28,48,0.5) 100%)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderColor: s.borderColor,
                        boxShadow: `0 2px 16px ${s.glow}`,
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Top colored line */}
                      <div
                        className="absolute top-0 left-2 right-2"
                        style={{
                          height: "2px",
                          background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`,
                          borderRadius: "0 0 2px 2px",
                        }}
                      />
                      <p
                        style={{
                          fontFamily: "'Noto Serif SC', serif",
                          fontSize: "22px",
                          fontWeight: 600,
                          color: s.color,
                          lineHeight: 1.2,
                        }}
                      >
                        {s.value}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "rgba(232,220,200,0.4)",
                          marginTop: "4px",
                        }}
                      >
                        {s.label}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <GoldSeparator />

                {/* ─── Filters: status ─── */}
                <div className="mb-3">
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "11px",
                      color: "rgba(212,160,84,0.5)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {"\u72b6\u6001"}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(
                      [
                        ["all", "\u5168\u90e8"],
                        ["viewable", "\u53ef\u67e5\u770b"],
                        ["unviewed", "\u5f85\u67e5\u770b"],
                        ["generating", "\u751f\u6210\u4e2d"],
                      ] as [StatusFilter, string][]
                    ).map(([key, label]) => (
                      <FilterPill
                        key={key}
                        label={label}
                        active={statusFilter === key}
                        onClick={() => setStatusFilter(key)}
                      />
                    ))}
                  </div>
                </div>

                {/* ─── Filters: theme ─── */}
                <div className="mb-3">
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "11px",
                      color: "rgba(212,160,84,0.5)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {"\u4e3b\u9898"}
                  </p>
                  <div
                    className="flex gap-2.5 overflow-x-auto pb-3"
                    style={{
                      scrollbarWidth: "none",
                      WebkitOverflowScrolling: "touch",
                      overflowX: "auto",
                      touchAction: "pan-x",
                    }}
                  >
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = themeFilter === theme.id;
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          onClick={() =>
                            setThemeFilter(
                              themeFilter === theme.id ? "all" : theme.id
                            )
                          }
                          className="flex-shrink-0 flex flex-col items-center justify-center rounded-lg transition-all relative overflow-hidden"
                          style={{
                            width: "62px",
                            height: "72px",
                            background: isSelected
                              ? "linear-gradient(135deg, rgba(200,120,80,0.18) 0%, rgba(212,160,84,0.12) 50%, rgba(200,120,80,0.1) 100%)"
                              : "rgba(22,35,60,0.6)",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderColor: isSelected
                              ? "rgba(212,160,84,0.45)"
                              : "rgba(138,124,108,0.15)",
                            boxShadow: isSelected
                              ? "0 2px 16px rgba(212,160,84,0.15)"
                              : "none",
                          }}
                        >
                          {isSelected && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background:
                                  "radial-gradient(circle at 70% 20%, rgba(212,160,84,0.15) 0%, transparent 55%)",
                              }}
                            />
                          )}
                          {isSelected && (
                            <div
                              className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: "rgba(212,160,84,0.6)",
                              }}
                            >
                              <Check
                                size={8}
                                color="#1E2D4D"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                          <span className="mb-0.5 relative z-10">
                            <Icon
                              size={18}
                              color={
                                isSelected
                                  ? "#D4A054"
                                  : "rgba(232,220,200,0.4)"
                              }
                              strokeWidth={1.5}
                            />
                          </span>
                          <span
                            className="relative z-10"
                            style={{
                              fontFamily: "'Noto Sans SC', sans-serif",
                              fontSize: "12px",
                              color: isSelected
                                ? "#EDE4D4"
                                : "rgba(232,220,200,0.5)",
                              lineHeight: 1.3,
                            }}
                          >
                            {theme.label}
                          </span>
                          <span
                            className="relative z-10"
                            style={{
                              fontFamily: "'Noto Sans SC', sans-serif",
                              fontSize: "12px",
                              color: isSelected
                                ? "rgba(212,160,84,0.75)"
                                : "rgba(232,220,200,0.35)",
                              lineHeight: 1.3,
                            }}
                          >
                            {theme.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Pagination dots */}
                  <div className="flex justify-center gap-1 mt-1">
                    {THEME_OPTIONS.map((theme) => (
                      <div
                        key={theme.id}
                        className="rounded-full transition-all"
                        style={{
                          width:
                            themeFilter === theme.id ? "14px" : "5px",
                          height: "5px",
                          backgroundColor:
                            themeFilter === theme.id
                              ? "#D4A054"
                              : "rgba(212,160,84,0.15)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* ─── Filters: time range ─── */}
                <div className="mb-2">
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "11px",
                      color: "rgba(212,160,84,0.5)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {"\u65f6\u95f4\u8303\u56f4"}
                  </p>
                  {/* Mode toggle */}
                  <div className="flex gap-2 mb-2.5">
                    <FilterPill
                      label={"\u6700\u8fd1\u51e0\u6708"}
                      active={timeMode === "recent"}
                      onClick={() => setTimeMode("recent")}
                    />
                    <FilterPill
                      label={"\u81ea\u5b9a\u4e49\u8303\u56f4"}
                      active={timeMode === "custom"}
                      onClick={() => setTimeMode("custom")}
                    />
                  </div>
                  {timeMode === "recent" ? (
                    <div className="flex gap-2 flex-wrap">
                      {([1, 3, 6, 12] as RecentMonths[]).map((m) => (
                        <FilterPill
                          key={m}
                          label={`${m} \u4e2a\u6708`}
                          active={recentMonths === m}
                          onClick={() => setRecentMonths(m)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          fontSize: "11px",
                          fontFamily: "'Noto Sans SC', sans-serif",
                          background: "rgba(212,160,84,0.08)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: "rgba(212,160,84,0.2)",
                          borderRadius: "6px",
                          color: "#E0B46A",
                          padding: "4px 8px",
                          outline: "none",
                          flex: 1,
                          colorScheme: "dark",
                        }}
                      />
                      <span style={{ fontSize: "11px", color: "rgba(212,160,84,0.4)" }}>{"\u81f3"}</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                          fontSize: "11px",
                          fontFamily: "'Noto Sans SC', sans-serif",
                          background: "rgba(212,160,84,0.08)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: "rgba(212,160,84,0.2)",
                          borderRadius: "6px",
                          color: "#E0B46A",
                          padding: "4px 8px",
                          outline: "none",
                          flex: 1,
                          colorScheme: "dark",
                        }}
                      />
                    </div>
                  )}
                </div>

                <GoldSeparator />

                {/* ─── Record list ─── */}
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((r, i) => (
                      <RecordCard
                        key={r.id}
                        record={r}
                        index={i}
                        onOpen={handleOpen}
                      />
                    ))}
                  </AnimatePresence>

                  {filtered.length === 0 && (
                    <div className="py-10 text-center">
                      <p
                        style={{
                          fontSize: "13px",
                          color: "rgba(232,220,200,0.35)",
                        }}
                      >
                        {"\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u4e0b\u6ca1\u6709\u8bb0\u5f55"}
                      </p>
                    </div>
                  )}
                </div>

                {/* ─── Bottom action ─── */}
                <div className="mt-10 mb-2 flex justify-center">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full active:scale-[0.97]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(138,124,108,0.1), rgba(28,40,68,0.4))",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "rgba(138,124,108,0.18)",
                      fontSize: "13px",
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontWeight: 500,
                      color: "rgba(232,220,200,0.55)",
                    }}
                    onClick={() => navigate("/upload")}
                  >
                    <ArrowLeft size={14} />
                    {"\u8fd4\u56de\u4e0a\u4f20\u9875"}
                  </button>
                </div>

                {/* ─── Decorative bottom lotus hint ─── */}
                <div className="flex justify-center mt-6 mb-4">
                  <motion.div
                    style={{
                      width: "60px",
                      height: "30px",
                      background:
                        "radial-gradient(ellipse at bottom, rgba(212,160,84,0.08) 0%, transparent 80%)",
                      borderRadius: "50%",
                    }}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}