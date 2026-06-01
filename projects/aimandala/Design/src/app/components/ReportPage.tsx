import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Share2,
  Download,
  RotateCcw,
  Check,
  Sparkles,
} from "lucide-react";
import combLogoFlat from "figma:asset/dd21b372c423cb06578216b853db653316e94fcc.png";
import dunhuangPattern from "figma:asset/176d69efc81b256182be2c6f62c7d48ce8cbe05b.png";

/* ─── Mock report data ─── */
const REPORT = {
  title: "冰封的太阳",
  date: "2026年3月8日",
  impression:
    "这是一幅充满生命力的画作，像春日里急切绽放的花朵，带着想要被世界看见的渴望。色彩浓烈却排列有序，暗示着一个在严格框架中燃烧着热情的灵魂。",
  insights: [
    {
      key: "base",
      icon: "🎨",
      label: "你的底色",
      color: "#5B8C5A",
      content:
        "你的本质是温暖而敏感的，像春天的泥土——看似沉默，内部却孕育着无数种子。你拥有强大的共情能力和细腻的感知力，能捕捉到他人忽略的微妙情绪变化。",
    },
    {
      key: "conflict",
      icon: "⚡",
      label: "你的矛盾",
      color: "#D4883E",
      content:
        "你渴望被看见和认可，同时又害怕暴露真实的自己。画中明亮的中心与压抑的外圈形成对比，揭示出你在\u201c展现自我\u201d和\u201c保护自我\u201d之间反复拉扯的核心矛盾。",
    },
    {
      key: "pattern",
      icon: "🔄",
      label: "你的模式",
      color: "#4A7FB5",
      content:
        "你习惯性地在关系中成为照顾者——倾听、共情、给予。但你很少允许别人走进你的内心。这种\u201c付出型\u201d模式让你获得安全感，也让你持续感到疲惫和不被理解。",
    },
    {
      key: "defense",
      icon: "🛡️",
      label: "你的防御",
      color: "#8B6AAE",
      content:
        "当感到威胁时，你会启动\u201c完美化\u201d防御——确保一切都在掌控中，用忙碌和效率来回避内心的不安。你的秩序感是一座精致的盾牌，保护着深处那个害怕犯错的孩子。",
    },
    {
      key: "stuck",
      icon: "💫",
      label: "你的卡点",
      color: "#C25B56",
      content:
        "你目前感到一种说不清的停滞感——明明很努力，却好像原地打转。这种卡顿的核心在于：你一直在向外寻求答案，却忽略了内心那个微小但清晰的声音。",
    },
    {
      key: "light",
      icon: "✨",
      label: "你的光",
      color: "#C8A066",
      content:
        "画作中隐藏着一股温柔而坚定的力量——你拥有罕见的自愈能力和创造力。当你允许自己不完美、允许自己休息时，你的光会自然绽放，照亮自己，也温暖他人。",
    },
  ],
  experiment: {
    action:
      "这周尝试一次\u201c不完美的展现\u201d：发朋友圈时，不P图、不斟酌文案，直接发一张随手拍。",
    observe:
      "观察：世界崩塌了吗？还是其实没人注意到\u201c不完美\u201d？你内心的感受是什么？",
  },
};

/* ─── Floating particles ─── */
function FloatingParticlesSubtle() {
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

/* ─── Insight card ─── */
function InsightCard({
  icon,
  label,
  color,
  content,
  index,
  isLast,
}: {
  icon: string;
  label: string;
  color: string;
  content: string;
  index: number;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 * index }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: isLast
          ? "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(245,239,226,0.8) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(245,239,226,0.8) 100%)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isLast
          ? "rgba(200,160,102,0.25)"
          : "rgba(138,124,108,0.12)",
      }}
    >
      {/* Left color bar */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "3px",
          background: `linear-gradient(180deg, ${color}, ${color}88)`,
          borderRadius: "2px 0 0 2px",
        }}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: "16px" }}>{icon}</span>
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#4A3D30",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "13px",
            color: "#5E5046",
            lineHeight: 1.85,
          }}
        >
          {content}
        </p>
      </div>

      {/* Special glow for "你的光" */}
      {isLast && (
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: "80px",
            height: "80px",
            background:
              "radial-gradient(circle at 80% 20%, rgba(200,160,102,0.12) 0%, transparent 60%)",
          }}
        />
      )}
    </motion.div>
  );
}

/* ─── Pro feature list item ─── */
function ProFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(212,160,84,0.15)" }}
      >
        <Check size={10} color="#D4A054" strokeWidth={3} />
      </div>
      <span
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "13px",
          color: "rgba(232,220,200,0.8)",
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ========== REPORT PAGE ========== */
export function ReportPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
        {/* ─── Top Navigation ─── */}
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
            onClick={() => navigate("/upload")}
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
              解读报告(Lite版)
            </span>
          </div>

          <button
            className="p-1 transition-colors"
            style={{ color: "rgba(232,220,200,0.5)" }}
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* ─── Scrollable Content ─── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {/* ─── Report Header (dark section) ─── */}
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
                    background:
                      "conic-gradient(from 0deg, rgba(212,160,84,0.3), rgba(200,120,80,0.15), rgba(212,160,84,0.3))",
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
                    borderWidth: "2.5px",
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

                {/* Lite badge */}
                <div
                  className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #1E2D4D 0%, #253860 100%)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "rgba(212,160,84,0.3)",
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#D4A054",
                    letterSpacing: "0.05em",
                  }}
                >
                  Lite版
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
                {REPORT.title}
              </h1>

              {/* Date */}
              <span
                className="mt-2"
                style={{
                  fontSize: "12px",
                  color: "rgba(232,220,200,0.4)",
                }}
              >
                {REPORT.date}生成
              </span>
            </div>

          </div>

          {/* ─── Cream Content Area (card overlapping dark section) ─── */}
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
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }}>
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

            {/* ─── 整体印象 Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl relative overflow-hidden mb-6"
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

              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(180deg, #9EAA9B, #9EAA9B88)",
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
                  整体印象
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13.5px",
                  color: "#5E5046",
                  lineHeight: 1.9,
                }}
              >
                {REPORT.impression}
              </p>
            </motion.div>

            {/* ─── Section Title: 6个核心看见 ─── */}
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} color="#C87850" strokeWidth={2} />
              <span
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#4A3D30",
                  letterSpacing: "0.06em",
                }}
              >
                六个核心看见
              </span>
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(200,120,80,0.2) 0%, transparent 100%)",
                }}
              />
            </div>

            {/* ─── 6 Insight Cards ─── */}
            <div className="flex flex-col gap-3 mb-6">
              {REPORT.insights.map((insight, i) => (
                <InsightCard
                  key={insight.key}
                  icon={insight.icon}
                  label={insight.label}
                  color={insight.color}
                  content={insight.content}
                  index={i}
                  isLast={i === REPORT.insights.length - 1}
                />
              ))}
            </div>

            {/* ─── 一个小实验 ─── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="rounded-2xl relative overflow-hidden mb-6"
              style={{
                background:
                  "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #223358 100%)",
                padding: "20px",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(212,160,84,0.12)",
              }}
            >
              {/* Dunhuang pattern background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${dunhuangPattern})`,
                  backgroundSize: "200px",
                  backgroundRepeat: "repeat",
                  opacity: 0.03,
                }}
              />

              {/* Glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: "-10px",
                  right: "-10px",
                  width: "100px",
                  height: "80px",
                  background:
                    "radial-gradient(ellipse, rgba(212,160,84,0.1) 0%, transparent 60%)",
                  borderRadius: "50%",
                }}
              />

              <div className="flex items-center gap-2 mb-3 relative">
                <span style={{ fontSize: "16px" }}>🔬</span>
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#E8DCC8",
                    letterSpacing: "0.08em",
                  }}
                >
                  一个小实验
                </span>
              </div>

              <p
                className="relative"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13px",
                  color: "rgba(232,220,200,0.85)",
                  lineHeight: 1.85,
                }}
              >
                {REPORT.experiment.action}
              </p>
              <p
                className="mt-2 relative"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13px",
                  color: "rgba(232,220,200,0.65)",
                  lineHeight: 1.85,
                }}
              >
                {REPORT.experiment.observe}
              </p>

              <div
                className="mt-4 pt-3 relative"
                style={{
                  borderTopWidth: "1px",
                  borderTopStyle: "solid",
                  borderTopColor: "rgba(212,160,84,0.1)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "11px",
                    color: "rgba(212,160,84,0.5)",
                    letterSpacing: "0.05em",
                  }}
                >
                  ✦ 今天就可以尝试
                </span>
              </div>
            </motion.div>

            {/* ─── Pro Upgrade Section ─── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="rounded-2xl relative overflow-hidden mb-6"
              style={{
                background:
                  "linear-gradient(135deg, #1A2844 0%, #1E2D4D 40%, #253860 100%)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(212,160,84,0.2)",
              }}
            >
              {/* Dunhuang texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${dunhuangPattern})`,
                  backgroundSize: "250px",
                  backgroundRepeat: "repeat",
                  opacity: 0.03,
                }}
              />

              {/* Top ambient glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: "-20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "200px",
                  height: "100px",
                  background:
                    "radial-gradient(ellipse, rgba(212,160,84,0.12) 0%, transparent 60%)",
                  borderRadius: "50%",
                }}
              />

              <div className="px-5 pt-5 pb-6 relative">
                {/* Title */}
                <div className="text-center mb-5">
                  <span
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#E8DCC8",
                      letterSpacing: "0.1em",
                      lineHeight: 1.6,
                    }}
                  >
                    你的画里，还藏着这些答案
                  </span>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex-1 h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(212,160,84,0.2) 50%, transparent 100%)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: "rgba(212,160,84,0.5)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    PRO 深度版
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(212,160,84,0.2) 50%, transparent 100%)",
                    }}
                  />
                </div>

                {/* Feature list */}
                <div className="flex flex-col gap-0.5 mb-5">
                  <ProFeature text="画面深度解读：每一个颜色、形状背后的潜意识信息" />
                  <ProFeature text="能量失衡的具体诊断：你的卡点属于哪种类型" />
                  <ProFeature text="三圈能量的微观分析：内在-关系-外在的深层互动" />
                  <ProFeature text="这个模式为何形成：能量的根源与演变" />
                  <ProFeature text="针对性的调节建议：如何平衡你的能量状态" />
                </div>

                {/* Price */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "rgba(232,220,200,0.6)",
                      }}
                    >
                      Pro深度版
                    </span>
                    <span
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#D4A054",
                      }}
                    >
                      ¥39
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "rgba(232,220,200,0.35)",
                      textDecoration: "line-through",
                    }}
                  >
                    原价¥99
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(200,120,80,0.2)",
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#C87850",
                      letterSpacing: "0.04em",
                    }}
                  >
                    限时特惠
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  className="w-full py-3.5 rounded-full relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #9B4030 0%, #C87850 25%, #D4A054 50%, #C8A066 75%, #D4A054 100%)",
                    color: "#F5EFE2",
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    letterSpacing: "0.15em",
                    boxShadow:
                      "0 4px 16px rgba(200,120,80,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  {/* Silk highlight */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: 0,
                      left: "20%",
                      right: "20%",
                      height: "50%",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)",
                      borderRadius: "0 0 50% 50%",
                    }}
                  />
                  <span className="relative">解锁完整版</span>
                </button>

                {/* Subtext */}
                <p
                  className="text-center mt-3"
                  style={{
                    fontSize: "11px",
                    color: "rgba(232,220,200,0.35)",
                  }}
                >
                  已解锁 Lite 版，升级可享完整分析
                </p>
              </div>
            </motion.div>

            {/* ─── Bottom Actions ─── */}
            <div className="flex gap-3 mb-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-colors"
                style={{
                  background: saved ? "rgba(91,140,90,0.1)" : "rgba(255,255,255,0.7)",
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
                onClick={handleSave}
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
                onClick={() => navigate("/upload")}
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

            {/* Footer branding */}
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
          </div>
        </div>
      </div>
    </div>
  );
}