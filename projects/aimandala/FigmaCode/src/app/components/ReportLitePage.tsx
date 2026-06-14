import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import {
  ReportShell,
  ReportTopBar,
  ReportHeader,
  CreamContentArea,
  CreamCard,
  ReportModule,
  BottomActions,
  FooterBranding,
  dunhuangPattern,
} from "./report/shared";

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
        "你渴望被看见和认可，同时又害怕暴露真实的自己。画中明亮的中心与压抑的外圈形成对比，揭示出你在“展现自我”和“保护自我”之间反复拉扯的核心矛盾。",
    },
    {
      key: "pattern",
      icon: "🔄",
      label: "你的模式",
      color: "#4A7FB5",
      content:
        "你习惯性地在关系中成为照顾者——倾听、共情、给予。但你很少允许别人走进你的内心。这种“付出型”模式让你获得安全感，也让你持续感到疲惫和不被理解。",
    },
    {
      key: "defense",
      icon: "🛡️",
      label: "你的防御",
      color: "#8B6AAE",
      content:
        "当感到威胁时，你会启动“完美化”防御——确保一切都在掌控中，用忙碌和效率来回避内心的不安。你的秩序感是一座精致的盾牌，保护着深处那个害怕犯错的孩子。",
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
      "这周尝试一次“不完美的展现”：发朋友圈时，不P图、不斟酌文案，直接发一张随手拍。",
    observe:
      "观察：世界崩塌了吗？还是其实没人注意到“不完美”？你内心的感受是什么？",
  },
};

/* Pro 会多提供的内容点 */
const PRO_DEEPER = [
  "关系模式：这些线索背后，是怎样的相处与连接方式",
  "能量卡点：你目前的停滞，具体卡在了哪一环",
  "三圈能量：内在-关系-外在的深层互动地图",
  "模式形成的原因：这一切是如何一步步长出来的",
  "调节方向：可以从哪里开始，温和地松动它",
];

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
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(245,239,226,0.8) 100%)",
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

/* ─── Pro deeper-point row ─── */
function DeeperPoint({ text, index }: { text: string; index: number }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "rgba(212,160,84,0.15)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "rgba(212,160,84,0.3)",
          marginTop: "1px",
        }}
      >
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "10px",
            fontWeight: 600,
            color: "#D4A054",
          }}
        >
          {index + 1}
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "13px",
          color: "rgba(232,220,200,0.82)",
          lineHeight: 1.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ========== LITE REPORT PAGE ========== */
export function ReportLitePage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ReportShell>
      <ReportTopBar title="解读报告(Lite版)" onBack={() => navigate("/upload")} />

      {/* ─── Scrollable Content ─── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <ReportHeader
          title={REPORT.title}
          date={REPORT.date}
          version="Lite"
        />

        <CreamContentArea>
          {/* ─── 模块 01 · 整体印象 ─── */}
          <ReportModule index="01" title="整体印象" accent="#9EAA9B">
            <CreamCard>
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
            </CreamCard>
          </ReportModule>

          {/* ─── 模块 02 · 六个核心看见 ─── */}
          <ReportModule
            index="02"
            title="六个核心看见"
            meta="6 项"
            accent="#C87850"
          >
            <div className="flex flex-col gap-3">
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
          </ReportModule>

          {/* ─── 模块 03 · 一个小实验 ─── */}
          <ReportModule index="03" title="一个小实验" accent="#D4A054">
            <div
              className="rounded-2xl relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #223358 100%)",
                padding: "20px",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(212,160,84,0.12)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${dunhuangPattern})`,
                  backgroundSize: "200px",
                  backgroundRepeat: "repeat",
                  opacity: 0.03,
                }}
              />
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

              <div className="flex items-start gap-2 mb-2 relative">
                <span style={{ fontSize: "15px", lineHeight: 1.6 }}>🔬</span>
                <p
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "13px",
                    color: "rgba(232,220,200,0.85)",
                    lineHeight: 1.85,
                  }}
                >
                  {REPORT.experiment.action}
                </p>
              </div>
              <p
                className="relative"
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
            </div>
          </ReportModule>

          {/* ─── Lite → Pro 递进升级区 ─── */}
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
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${dunhuangPattern})`,
                backgroundSize: "250px",
                backgroundRepeat: "repeat",
                opacity: 0.03,
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "220px",
                height: "110px",
                background:
                  "radial-gradient(ellipse, rgba(212,160,84,0.12) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />

            <div className="px-5 pt-6 pb-6 relative">
              {/* Lite ●━━● Pro 递进指示 */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(232,220,200,0.08)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "rgba(232,220,200,0.15)",
                    fontSize: "11px",
                    color: "rgba(232,220,200,0.7)",
                    letterSpacing: "0.05em",
                  }}
                >
                  Lite 已完成
                </span>
                <div className="flex items-center gap-1">
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "rgba(232,220,200,0.5)",
                    }}
                  />
                  <ArrowRight size={13} color="rgba(212,160,84,0.7)" />
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#D4A054",
                    }}
                  />
                </div>
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(212,160,84,0.12)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "rgba(212,160,84,0.35)",
                    fontSize: "11px",
                    color: "#D4A054",
                    letterSpacing: "0.05em",
                  }}
                >
                  Pro 深度版
                </span>
              </div>

              {/* Title */}
              <div className="text-center mb-2.5">
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#E8DCC8",
                    letterSpacing: "0.1em",
                    lineHeight: 1.5,
                  }}
                >
                  继续看见更深的一层
                </span>
              </div>

              {/* Description */}
              <p
                className="text-center mb-5"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "12.5px",
                  color: "rgba(232,220,200,0.6)",
                  lineHeight: 1.85,
                  paddingLeft: "8px",
                  paddingRight: "8px",
                }}
              >
                Lite
                已经帮你看见本次画作的核心线索。若你想继续理解这些线索背后的关系模式、能量卡点与调节方向，可以升级到
                Pro 深度解读。
              </p>

              {/* Deeper points */}
              <div
                className="rounded-xl px-4 py-3 mb-5"
                style={{
                  background: "rgba(0,0,0,0.12)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.12)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "11px",
                    color: "rgba(212,160,84,0.7)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Pro 会在 Lite 的基础上，继续为你展开：
                </span>
                <div className="mt-2 flex flex-col gap-0.5">
                  {PRO_DEEPER.map((t, i) => (
                    <DeeperPoint key={i} text={t} index={i} />
                  ))}
                </div>
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
                onClick={() => navigate("/select-plan")}
              >
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
                <span className="relative">升级到 Pro</span>
              </button>

              {/* Price + subtext (price present but not the focus) */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(232,220,200,0.4)",
                  }}
                >
                  升级后可继续追问 / 继续梳理
                </span>
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "rgba(212,160,84,0.35)",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(212,160,84,0.55)",
                  }}
                >
                  +¥29
                </span>
              </div>
            </div>
          </motion.div>

          <BottomActions
            saved={saved}
            onSave={handleSave}
            onReupload={() => navigate("/upload")}
          />

          <FooterBranding />
        </CreamContentArea>
      </div>
    </ReportShell>
  );
}
