import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ReportShell,
  ReportTopBar,
  ReportHeader,
  CreamContentArea,
  CreamCard,
  ReportModule,
  FollowupInline,
  FollowupProvider,
  BottomActions,
  FooterBranding,
  dunhuangPattern,
} from "./report/shared";

/* ─── Mock Pro report data ─── */
const REPORT = {
  title: "冰封的太阳",
  date: "2026年3月8日",
  // 一眼总结 / 深层主线(压缩为 2-3 行摘要)
  mainline:
    "这幅画的深层主线，是一场关于「被看见」的拉扯——你既渴望释放炽热的自我，又用秩序把它牢牢冻结。太阳被冰封，不是因为没有热，而是热被层层保护了起来。",
  // 深度解读模块
  deepReads: [
    {
      key: "color",
      label: "色彩语言",
      content:
        "浓烈的暖色集中在中心，冷色与留白被推向外圈——这是一种「热在内、冷在外」的能量分布。你把最真实、最有温度的部分藏在最里层，只让外界看到克制和秩序。",
    },
    {
      key: "shape",
      label: "形状结构",
      content:
        "规整的几何边框包裹着自由生长的中心图案。框架代表你为自己设定的「应该」，而中心的生命力，是你真正想要的「想要」。两者长期并存，构成了内在的张力。",
    },
    {
      key: "space",
      label: "空间留白",
      content:
        "外圈大面积的冷色留白，是你与他人之间的安全距离。它保护了你，也在不经意间，把想要靠近你的人挡在了门外。",
    },
  ],
  // 三圈能量
  rings: [
    {
      key: "inner",
      label: "内在",
      color: "#C25B56",
      content:
        "核心是充沛而炽热的，你对生活有强烈的热情与创造欲，但这股能量目前更多向内燃烧，缺少安全的出口。",
    },
    {
      key: "relation",
      label: "关系",
      color: "#D4883E",
      content:
        "你在关系中习惯做给予的一方，用照顾换取连接。你给得多、要得少，长期下来容易感到「我懂别人，却没人真的懂我」。",
    },
    {
      key: "outer",
      label: "外在",
      color: "#4A7FB5",
      content:
        "对外你呈现出可靠、有条理的形象，边界清晰甚至略显疏离。这层外壳让你被信任，却也让真实的脆弱难以流动出来。",
    },
  ],
  // 模式形成原因
  origin:
    "这套「热在内、冷在外」的模式，往往形成于一段需要你「懂事、稳定、不添麻烦」的早期经历。当展现真实情绪没有得到温柔回应时，你学会了把热情收进秩序里——它曾经保护过你，只是如今，它也开始限制你。",
  // 调节建议
  adjustments: [
    {
      key: "a1",
      label: "松动边界",
      content:
        "练习在安全的关系里，做一次小小的「示弱」——说出一个你平时会自己扛下的需要，观察对方的回应。",
    },
    {
      key: "a2",
      label: "向外释放",
      content:
        "为内在的热找一个出口：一项不追求结果的创造性活动（涂鸦、写字、唱歌），让能量有处可去。",
    },
    {
      key: "a3",
      label: "接住自己",
      content:
        "当「完美化」防御又启动时，试着对自己说一句：「不完美也没关系，我已经做得足够好了。」",
    },
  ],
};

/* ─── Deep read accordion-style block ─── */
function DeepReadBlock({
  label,
  content,
  index,
}: {
  label: string;
  content: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(245,239,226,0.8) 100%)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(138,124,108,0.12)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "3px",
          background: "linear-gradient(180deg, #C8A066, #C8A06688)",
        }}
      />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "12px",
              fontWeight: 600,
              color: "#C87850",
              letterSpacing: "0.06em",
            }}
          >
            0{index + 1}
          </span>
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
    </motion.div>
  );
}

/* ─── Three rings of energy ─── */
function EnergyRings({
  rings,
}: {
  rings: { key: string; label: string; color: string; content: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Concentric ring visual */}
      <div className="flex justify-center mb-1">
        <div className="relative" style={{ width: "120px", height: "120px" }}>
          {rings.map((r, i) => {
            const inset = i * 18;
            return (
              <div
                key={r.key}
                className="absolute rounded-full flex items-start justify-center"
                style={{
                  inset: `${inset}px`,
                  borderWidth: "2px",
                  borderStyle: "solid",
                  borderColor: r.color,
                  opacity: 0.85,
                }}
              />
            );
          })}
          {/* center dot */}
          <div
            className="absolute rounded-full"
            style={{
              inset: "52px",
              background:
                "radial-gradient(circle, #C25B56 0%, #C25B5688 100%)",
            }}
          />
        </div>
      </div>

      {rings.map((r, i) => (
        <motion.div
          key={r.key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 * i }}
          className="rounded-xl px-4 py-3 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(245,239,226,0.8) 100%)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(138,124,108,0.12)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: r.color,
              }}
            />
            <span
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#4A3D30",
                letterSpacing: "0.08em",
              }}
            >
              {r.label}
            </span>
          </div>
          <p
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "12.5px",
              color: "#5E5046",
              lineHeight: 1.8,
            }}
          >
            {r.content}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/* ========== PRO REPORT PAGE ========== */
export function ReportProPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ReportShell>
      <ReportTopBar title="解读报告(Pro版)" onBack={() => navigate("/history")} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <ReportHeader title={REPORT.title} date={REPORT.date} version="Pro" />

        <CreamContentArea>
          <FollowupProvider>
          {/* ─── 模块 01 · 深层主线(压缩摘要) ─── */}
          <ReportModule index="01" title="深层主线" accent="#D4A054">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #223358 100%)",
                padding: "18px 20px",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(212,160,84,0.18)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${dunhuangPattern})`,
                  backgroundSize: "220px",
                  backgroundRepeat: "repeat",
                  opacity: 0.03,
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  top: "-15px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "200px",
                  height: "90px",
                  background:
                    "radial-gradient(ellipse, rgba(212,160,84,0.12) 0%, transparent 60%)",
                  borderRadius: "50%",
                }}
              />
              <p
                className="relative"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "14px",
                  color: "rgba(232,220,200,0.9)",
                  lineHeight: 1.95,
                  letterSpacing: "0.02em",
                }}
              >
                {REPORT.mainline}
              </p>
              <span
                className="inline-block mt-3 relative"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "11px",
                  color: "rgba(212,160,84,0.55)",
                  letterSpacing: "0.05em",
                }}
              >
                ↓ 下方展开完整深度解读
              </span>
            </motion.div>
          </ReportModule>

          {/* 追问 · 深层主线后(默认收起) */}
          <FollowupInline initialMode="collapsed" />

          {/* ─── 模块 02 · 深度解读 ─── */}
          <ReportModule
            index="02"
            title="深度解读"
            meta={`${REPORT.deepReads.length} 项`}
            accent="#C87850"
          >
            <div className="flex flex-col gap-3">
              {REPORT.deepReads.map((d, i) => (
                <DeepReadBlock
                  key={d.key}
                  label={d.label}
                  content={d.content}
                  index={i}
                />
              ))}
            </div>
          </ReportModule>

          {/* 追问 · 深度解读后(展开输入态) */}
          <FollowupInline initialMode="open" />

          {/* ─── 模块 03 · 三圈能量 ─── */}
          <ReportModule
            index="03"
            title="三圈能量"
            meta="内在 / 关系 / 外在"
            accent="#4A7FB5"
          >
            <EnergyRings rings={REPORT.rings} />
          </ReportModule>

          {/* 追问 · 三圈能量后(思考中态，面板展开) */}
          <FollowupInline
            initialMode="open"
            pendingQuestion="哪一圈最适合我先调整？"
          />

          {/* ─── 模块 04 · 模式形成原因 ─── */}
          <ReportModule index="04" title="模式形成的原因" accent="#8B6AAE">
            <CreamCard>
              <p
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13.5px",
                  color: "#5E5046",
                  lineHeight: 1.9,
                }}
              >
                {REPORT.origin}
              </p>
            </CreamCard>
          </ReportModule>

          {/* 追问 · 模式形成原因后(已回答多轮，历史折叠) */}
          <FollowupInline
            initialMode="open"
            seedRounds={[
              {
                q: "这个模式是从什么时候开始的？",
                a: "它往往在你需要“懂事、稳定”的早期阶段就悄悄成形，并在一次次被验证后变得越来越自动。",
              },
              {
                q: "它现在还在保护我吗？",
                a: "一部分仍在保护你，但同样的机制在今天也开始限制你与他人的真实靠近。",
              },
              {
                q: "我能改变它吗？",
                a: "可以，但不是推翻它，而是一点点给它松绑，让你多一种新的应对方式。",
              },
            ]}
          />

          {/* ─── 模块 05 · 调节建议 ─── */}
          <ReportModule
            index="05"
            title="调节建议"
            meta={`${REPORT.adjustments.length} 项`}
            accent="#5B8C5A"
          >
            <div className="flex flex-col gap-3">
            {REPORT.adjustments.map((a, i) => (
              <motion.div
                key={a.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="rounded-xl px-4 py-3.5 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(91,140,90,0.08) 0%, rgba(245,239,226,0.6) 100%)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(91,140,90,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: "14px" }}>🌿</span>
                  <span
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#3F5C3E",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {a.label}
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
                  {a.content}
                </p>
              </motion.div>
            ))}
            </div>
          </ReportModule>

          {/* 追问 · 调节建议后(已回答且可折叠) */}
          <FollowupInline
            initialMode="open"
            seedRounds={[
              {
                q: "这周我可以先做一个什么小练习？",
                a: "可以先从一次很小的示弱开始：在安全的关系里，说出一个你平时会自己扛下的需要。重点不是立刻改变关系，而是让你的真实感受有一次被看见的机会。",
              },
            ]}
          />
          </FollowupProvider>

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
