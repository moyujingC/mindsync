import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ChevronDown,
  Upload,
  ScanSearch,
  FileText,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import combLogoFlat from "figma:asset/dd21b372c423cb06578216b853db653316e94fcc.png";
import combLogoJade from "../../imports/logo-niwu-hero.png";
import dunhuangPattern from "figma:asset/176d69efc81b256182be2c6f62c7d48ce8cbe05b.png";

/* ─── Floating golden particles ─── */
function FloatingParticles() {
  const particles = [
    { x: "12%", y: "18%", size: 4, delay: 0, duration: 6 },
    { x: "78%", y: "12%", size: 3, delay: 1.2, duration: 7 },
    { x: "25%", y: "65%", size: 5, delay: 0.5, duration: 8 },
    { x: "85%", y: "55%", size: 3, delay: 2.0, duration: 6.5 },
    { x: "50%", y: "30%", size: 4, delay: 1.8, duration: 7.5 },
    { x: "65%", y: "75%", size: 3, delay: 0.8, duration: 6.8 },
    { x: "35%", y: "45%", size: 2, delay: 3.0, duration: 8.5 },
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
            y: [0, -20, 5, -15, 0],
            x: [0, 8, -5, 10, 0],
            opacity: [0.3, 0.8, 0.5, 0.9, 0.3],
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

/* ─── FAQ Accordion Item ─── */
function FAQItem({
  question,
  shortAnswer,
  children,
  defaultOpen = false,
}: {
  question: string;
  shortAnswer: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="relative rounded-2xl mb-3 overflow-hidden"
      style={{
        background: open
          ? "linear-gradient(135deg, rgba(200,120,80,0.06) 0%, rgba(212,160,84,0.04) 100%)"
          : "rgba(138,124,108,0.06)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: open ? "rgba(200,120,80,0.2)" : "rgba(138,124,108,0.12)",
        transition: "border-color 0.3s, background 0.3s",
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "3px",
          background: open
            ? "linear-gradient(180deg, #C87850, #D4A054)"
            : "transparent",
          transition: "background 0.3s",
          borderRadius: "2px 0 0 2px",
        }}
      />

      <button
        className="w-full text-left px-5 py-4"
        onClick={() => setOpen(!open)}
        style={{ background: "none" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#4A3D30",
                lineHeight: 1.5,
                display: "block",
              }}
            >
              {question}
            </span>
            {!open && (
              <span
                className="mt-1 block truncate"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "12px",
                  color: "#8A7C6C",
                  lineHeight: 1.5,
                }}
              >
                {shortAnswer}
              </span>
            )}
          </div>
          <span
            className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: open
                ? "linear-gradient(135deg, #C87850, #D4A054)"
                : "rgba(138,124,108,0.12)",
              transition: "all 0.3s",
            }}
          >
            {open ? (
              <Minus size={13} color="#F5EFE2" />
            ) : (
              <Plus size={13} color="#8A7C6C" />
            )}
          </span>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <div
          className="px-5 pb-5"
          style={{
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            borderTopColor: "rgba(200,120,80,0.1)",
            paddingTop: "12px",
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── FAQ rich text helpers ─── */
function FAQPara({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Noto Sans SC', sans-serif",
        fontSize: "13px",
        color: "#5E5046",
        lineHeight: 1.8,
      }}
    >
      {children}
    </p>
  );
}

function FAQBullets({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "#C87850", opacity: 0.7 }}
          />
          <span
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "12.5px",
              color: "#5E5046",
              lineHeight: 1.75,
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FAQSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-3 mb-1"
      style={{
        fontFamily: "'Noto Sans SC', sans-serif",
        fontSize: "12px",
        fontWeight: 600,
        color: "#C87850",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </p>
  );
}

function FAQNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-3 px-3 py-2 rounded-xl"
      style={{
        background: "rgba(200,120,80,0.06)",
        borderLeftWidth: "2px",
        borderLeftStyle: "solid",
        borderLeftColor: "rgba(200,120,80,0.3)",
      }}
    >
      <p
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "11.5px",
          color: "#8A7C6C",
          lineHeight: 1.7,
        }}
      >
        {children}
      </p>
    </div>
  );
}

/* ─── Price Comparison Modal ─── */
function PriceCompare({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const rows: { feature: string; lite: string; pro: string }[] = [
    { feature: "图像解读", lite: "✓", pro: "✓" },
    { feature: "状态线索", lite: "✓", pro: "✓" },
    { feature: "结构分析", lite: "简要", pro: "完整" },
    { feature: "关系模式", lite: "—", pro: "✓" },
    { feature: "追问引导", lite: "简要", pro: "深入" },
    { feature: "整合建议", lite: "—", pro: "✓" },
    { feature: "报告完整度", lite: "轻量", pro: "完整" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mt-4 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(26,40,68,0.6)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgba(212,160,84,0.2)",
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: "rgba(212,160,84,0.15)",
        }}
      >
        <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "13px", color: "#D4A054" }}>
          解读内容
        </span>
        <button onClick={onClose} style={{ color: "rgba(232,220,200,0.5)", fontSize: "13px", fontFamily: "'Noto Sans SC', sans-serif" }}>
          收起
        </button>
      </div>
      <table className="w-full" style={{ fontSize: "12px", fontFamily: "'Noto Sans SC', sans-serif" }}>
        <thead>
          <tr style={{ borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "rgba(212,160,84,0.1)" }}>
            <th className="text-left px-4 py-2" style={{ color: "rgba(232,220,200,0.5)", fontWeight: 400 }}>功能</th>
            <th className="text-center px-2 py-2" style={{ color: "rgba(232,220,200,0.5)", fontWeight: 400 }}>Lite</th>
            <th className="text-center px-2 py-2" style={{ color: "#D4A054", fontWeight: 400 }}>Pro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.feature} style={{ borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "rgba(212,160,84,0.06)" }}>
              <td className="px-4 py-2" style={{ color: "rgba(232,220,200,0.7)" }}>{r.feature}</td>
              <td className="text-center px-2 py-2" style={{ color: r.lite === "\u2014" ? "rgba(232,220,200,0.25)" : "#9EAA9B" }}>{r.lite}</td>
              <td className="text-center px-2 py-2" style={{ color: r.pro === "\u2014" ? "rgba(232,220,200,0.25)" : "#D4A054" }}>{r.pro}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

/* ─── Step Card ─── */
function StepCard({
  num,
  title,
  desc,
}: {
  num: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      {/* Number badge */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(200,120,80,0.12), rgba(212,160,84,0.08))",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "rgba(200,120,80,0.2)",
        }}
      >
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "13px", fontWeight: 600, color: "#C87850" }}>
          {num}
        </span>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "15px",
            fontWeight: 600,
            color: "#4A3D30",
            lineHeight: 1.5,
            display: "block",
          }}
        >
          {title}
        </span>
        <span
          className="mt-1 block"
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "13px",
            color: "#8A7C6C",
            lineHeight: 1.6,
          }}
        >
          {desc}
        </span>
      </div>
    </div>
  );
}

/* ========== LANDING PAGE ========== */
export function LandingPage() {
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const el = document.getElementById("landing-scroll");
    if (!el) return;
    const handler = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const goUpload = () => navigate("/upload");

  const faqData = [
    {
      q: "曼陀罗解读是什么？",
      short: "AI分析你的曼陀罗绘画，解读颜色、形状背后的潜意识信息",
      content: (
        <>
          <FAQPara>
            曼陀罗解读是一种结合传统五行理论与现代AI技术的画像分析方法。你只需上传自己画的曼陀罗（圆形对称图案），AI会识别其中的颜色分布、何结构、三圈布局，生成关于你情绪状态、人际关系、内在需求的心理洞察报告。
          </FAQPara>
          <FAQNote>解读不替代专业心理咨询，但可以作为自我探索的辅助工具。</FAQNote>
        </>
      ),
    },
    {
      q: "需要准备什么样的画作？",
      short: "手绘的圆形图案即可，没有绘画基础要求",
      content: (
        <>
          <FAQBullets
            items={[
              <><strong style={{ color: "#4A3D30" }}>形式：</strong>手绘的圆形对称图案，可以是彩色或黑白</>,
              <><strong style={{ color: "#4A3D30" }}>工具：</strong>彩铅、水彩、马克笔、数字绘画均可</>,
              <><strong style={{ color: "#4A3D30" }}>大小：</strong>建议直径不小于10cm，方便AI识别细节</>,
              <><strong style={{ color: "#4A3D30" }}>内容：</strong>没有固定要求，跟随直觉绘制即可</>,
            ]}
          />
          <FAQSubtitle>📸 拍摄建议</FAQSubtitle>
          <FAQBullets
            items={["在自然光下拍摄", "画面完整、不裁剪", "避免阴影和反光"]}
          />
        </>
      ),
    },
    {
      q: "解读结果准确吗？",
      short: "基于五行理论和AI分析，作为自我探索的参考",
      content: (
        <>
          <FAQPara>我们的解读系统基于多维度分析体系：</FAQPara>
          <FAQBullets
            items={[
              <><strong style={{ color: "#4A3D30" }}>传统五行理论：</strong>颜色与五行（木火土金水）的对应关系</>,
              <><strong style={{ color: "#4A3D30" }}>心理学研究：</strong>色彩心理学、投射理论</>,
              <><strong style={{ color: "#4A3D30" }}>AI视觉识别：</strong>分析颜色分布、形状特征、三圈结构</>,
            ]}
          />
          <FAQSubtitle>关于准确率</FAQSubtitle>
          <FAQBullets
            items={[
              "颜色识别和五行映射准确率较高",
              "心理状态解读是概率性参考，而非确定性诊断",
              "解读结果需结合你自己的感受来理解",
            ]}
          />
          <FAQNote>
            ⚠️ 本解读仅供参考，不能替代专业医疗或心理咨询。如有严重心理困扰，请及时寻求专业帮助。
          </FAQNote>
        </>
      ),
    },
    {
      q: "我的隐私如何保护？",
      short: "画作加密存储，仅用于生成解读报告，不会用于其他用途",
      content: (
        <>
          <FAQBullets
            items={[
              <><strong style={{ color: "#4A3D30" }}>加密存储：</strong>上传的画作使用加密传输和储</>,
              <><strong style={{ color: "#4A3D30" }}>仅用于解读：</strong>画作不会用于AI训练或其他商业用途</>,
              <><strong style={{ color: "#4A3D30" }}>自动删除：</strong>报告生成后，画作将在7天内自动删除</>,
              <><strong style={{ color: "#4A3D30" }}>分享：</strong>我们不会将你的画解读结果分享给第三方</>,
            ]}
          />
          <FAQNote>你可以在「隐私政策」页面查看完整条款。</FAQNote>
        </>
      ),
    },
    {
      q: "\u5982\u4f55\u4f7f\u7528\u4f18\u60e0\u5238\uff1f",
      short: "\u5728\u652f\u4ed8\u9875\u9762\u8f93\u5165\u4f18\u60e0\u5238\u7801\u5373\u53ef\u81ea\u52a8\u6298\u6263",
      content: (
        <>
          <FAQPara>
            在支付页面输入优惠券码即可自动折扣。优惠券仅限单次使用，不可叠加。如遇到问题，请通过页面底部的联系方式求助。
          </FAQPara>
        </>
      ),
    },
  ];

  return (
    <div
      className="size-full flex justify-center"
      style={{ backgroundColor: "#141E38" }}
    >
      <div
        className="w-full flex flex-col relative"
        style={{
          maxWidth: "480px",
          height: "100%",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        <div
          id="landing-scroll"
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "none", scrollBehavior: "smooth" }}
        >
          {/* ===== SECTION 1: HERO ===== */}
          <div
            className="relative overflow-hidden flex flex-col items-center"
            style={{
              minHeight: "100vh",
              background:
                "linear-gradient(180deg, #0F1B33 0%, #1A2844 25%, #1E2D4D 50%, #223358 75%, #1A2844 100%)",
            }}
          >
            {/* History entry - top right */}
            <motion.button
              className="absolute z-20 flex items-center gap-1.5"
              style={{ top: "16px", right: "16px", background: "none" }}
              onClick={() => navigate("/history")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <FileText size={14} color="rgba(232,220,200,0.55)" />
              <span
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13px",
                  color: "rgba(232,220,200,0.55)",
                  letterSpacing: "0.04em",
                }}
              >
                历史解读
              </span>
            </motion.button>

            {/* Dunhuang pattern overlay - subtle */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${dunhuangPattern})`,
                backgroundSize: "300px",
                backgroundRepeat: "repeat",
                opacity: 0.03,
              }}
            />

            {/* Ambient glow - top right */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-40px",
                right: "-60px",
                width: "260px",
                height: "240px",
                background:
                  "radial-gradient(ellipse at 40% 50%, rgba(200,120,80,0.1) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />
            {/* Ambient glow - left */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "30%",
                left: "-50px",
                width: "200px",
                height: "280px",
                background:
                  "radial-gradient(ellipse, rgba(212,160,84,0.07) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />
            {/* Ambient glow - bottom center */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: "10%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "300px",
                height: "200px",
                background:
                  "radial-gradient(ellipse, rgba(158,170,155,0.06) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />

            <FloatingParticles />

            {/* Geometric mandala ring behind logo */}
            <div className="relative mt-[18vh] mb-6">
              {/* Outer glow ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-30px",
                  background:
                    "conic-gradient(from 0deg, rgba(212,160,84,0.15), rgba(200,120,80,0.08), rgba(122,142,168,0.1), rgba(212,160,84,0.15))",
                  filter: "blur(12px)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              {/* Geometric ring - thin lines */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-18px",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.2)",
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-12px",
                  borderWidth: "1px",
                  borderStyle: "dashed",
                  borderColor: "rgba(200,120,80,0.15)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              />

              {/* Pulsing glow behind the logo */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-5px",
                  background:
                    "radial-gradient(circle, rgba(212,160,84,0.15) 0%, transparent 70%)",
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Logo image */}
              <motion.img
                src={combLogoJade}
                alt="一镜一梳"
                className="relative z-10"
                style={{
                  width: "220px",
                  height: "220px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 24px rgba(212,160,84,0.25))",
                }}
              />
            </div>

            {/* Text content */}
            <motion.div
              className="flex flex-col items-center px-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "#E8DCC8",
                  letterSpacing: "0.15em",
                  lineHeight: 1.4,
                }}
              >
                画出你的潜意识
              </h1>
              <p
                className="mt-2"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "14px",
                  color: "rgba(232,220,200,0.65)",
                  letterSpacing: "0.06em",
                }}
              >
                AI解读曼陀罗画作 · 探索内心世界
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "12px",
                  color: "rgba(212,160,84,0.9)",
                  letterSpacing: "0.06em",
                }}
              >
                来自东方的五行智慧
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.button
              className="mt-8 relative overflow-hidden rounded-full flex items-center justify-center"
              style={{
                width: "220px",
                height: "50px",
                background:
                  "linear-gradient(135deg, #9B4030 0%, #C87850 30%, #D4A054 60%, #C87850 85%, #9B4030 100%)",
                boxShadow:
                  "0 4px 24px rgba(155,64,48,0.35), 0 0 40px rgba(212,160,84,0.15)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={goUpload}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {/* Silk highlight */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: "20%",
                  top: "2px",
                  width: "60%",
                  height: "45%",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "16px",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  color: "#F5EFE2",
                }}
              >
                开始体验
              </span>
            </motion.button>

            {/* Scroll down indicator */}
            <motion.div
              className="absolute flex flex-col items-center"
              style={{ bottom: "28px" }}
              animate={{ opacity: scrollY > 50 ? 0 : 1 }}
            >
              <span
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "11px",
                  color: "rgba(232,220,200,0.35)",
                  letterSpacing: "0.08em",
                }}
              >
                滑动了解详情
              </span>
              <motion.div
                className="mt-1"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown size={18} color="rgba(232,220,200,0.3)" />
              </motion.div>
            </motion.div>
          </div>

          {/* ===== SECTION 2: THREE STEPS ===== */}
          <div
            className="relative px-6 pt-10 pb-10 overflow-hidden"
            style={{
              backgroundColor: "#F0E6D6",
              borderRadius: "24px 24px 0 0",
              marginTop: "-20px",
            }}
          >
            {/* Section decorative glows */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-10px",
                right: "30px",
                width: "80px",
                height: "80px",
                background:
                  "radial-gradient(circle, rgba(212,160,84,0.06) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />

            <h2
              className="text-center"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#4A3D30",
                letterSpacing: "0.1em",
              }}
            >
              这次解读会这样发生
            </h2>

            <div className="flex flex-col gap-5 mt-8 relative">
              <StepCard
                num={1}
                title="放入你的画"
                desc="拍清整幅作品，先把它放进圆盘里。"
              />
              <StepCard
                num={2}
                title="看见三圈结构"
                desc="确认画面的中心、关系场和外在边界。"
              />
              <StepCard
                num={3}
                title="选择阅读深度"
                desc="先轻轻照见，或继续往里梳理。"
              />
              <StepCard
                num={4}
                title="带走报告"
                desc="这份解读会留下来，方便你之后回看。"
              />
            </div>
          </div>

          {/* ===== SECTION 3: PRICING ===== */}
          <div
            className="px-6 pt-10 pb-10 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)",
            }}
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

            <h2
              className="text-center relative"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#E8DCC8",
                letterSpacing: "0.1em",
              }}
            >
              先照见，再决定是否深入
            </h2>

            <div className="flex gap-3 mt-8 relative">
              {/* Lite Card */}
              <div
                className="flex-1 rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(158,170,155,0.12) 0%, rgba(158,170,155,0.06) 100%)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(158,170,155,0.25)",
                }}
              >
                {/* Jade texture hint */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 30%, rgba(158,170,155,0.08) 0%, transparent 60%)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#9EAA9B",
                    letterSpacing: "0.04em",
                  }}
                >
                  一镜 Lite
                </span>
                <p
                  className="mt-3"
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "12px",
                    color: "rgba(232,220,200,0.5)",
                    lineHeight: 1.7,
                  }}
                >
                  先获得一份轻量解读，看见此刻最明显的状态线索。
                </p>
                <div className="mt-4">
                  <span
                    className="inline-block px-3 py-1 rounded-full"
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#9EAA9B",
                      background: "rgba(158,170,155,0.1)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "rgba(158,170,155,0.2)",
                    }}
                  >
                    9.9 元
                  </span>
                </div>
              </div>

              {/* Pro Card */}
              <div
                className="flex-1 rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(212,160,84,0.12) 0%, rgba(200,120,80,0.08) 100%)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.3)",
                }}
              >
                {/* Gold accent */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "-10px",
                    right: "-10px",
                    width: "60px",
                    height: "60px",
                    background:
                      "radial-gradient(circle, rgba(212,160,84,0.12) 0%, transparent 60%)",
                    borderRadius: "50%",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#D4A054",
                    letterSpacing: "0.04em",
                  }}
                >
                  一梳 Pro
                </span>
                <p
                  className="mt-3"
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "12px",
                    color: "rgba(232,220,200,0.5)",
                    lineHeight: 1.7,
                  }}
                >
                  在 Lite 基础上继续深入，解锁完整报告，有疑惑还可以追问。
                </p>
                <div className="mt-4">
                  <span
                    className="inline-block px-3 py-1 rounded-full"
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#D4A054",
                      background: "rgba(212,160,84,0.1)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "rgba(212,160,84,0.2)",
                    }}
                  >
                    再付 29 元升级
                  </span>
                </div>
              </div>
            </div>

            {/* Compare link */}
            <button
              className="flex items-center justify-center gap-1 mt-5 mx-auto"
              onClick={() => setCompareOpen(!compareOpen)}
              style={{ background: "none" }}
            >
              <span
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13px",
                  color: "rgba(232,220,200,0.5)",
                }}
              >
                {compareOpen ? "收起对比" : "查看 Lite / Pro 差异"}
              </span>
              <ChevronRight
                size={14}
                color="rgba(232,220,200,0.4)"
                style={{
                  transform: compareOpen ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                }}
              />
            </button>

            <PriceCompare open={compareOpen} onClose={() => setCompareOpen(false)} />
          </div>

          {/* ===== SECTION 4: FAQ ===== */}
          <div
            className="px-6 pt-10 pb-8 relative overflow-hidden"
            style={{ backgroundColor: "#F0E6D6" }}
          >
            <div
              className="absolute pointer-events-none"
              style={{
                top: "20px",
                left: "-20px",
                width: "80px",
                height: "80px",
                background:
                  "radial-gradient(circle, rgba(200,120,80,0.04) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />

            <h2
              className="text-center"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#4A3D30",
                letterSpacing: "0.1em",
              }}
            >
              如果你还想先确认几个问题
            </h2>

            <div className="mt-6">
              {faqData.map((item, idx) => (
                <FAQItem
                  key={item.q}
                  question={item.q}
                  shortAnswer={item.short}
                  defaultOpen={idx === 0}
                >
                  {item.content}
                </FAQItem>
              ))}
            </div>
          </div>

          {/* ===== SECTION 5: FOOTER CTA ===== */}
          <div
            className="px-6 pt-12 pb-10 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #1A2844 0%, #1E2D4D 50%, #0F1B33 100%)",
            }}
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

            {/* Warm glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "200px",
                height: "120px",
                background:
                  "radial-gradient(ellipse, rgba(212,160,84,0.08) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />

            <h2
              className="text-center relative"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "22px",
                fontWeight: 600,
                color: "#E8DCC8",
                letterSpacing: "0.1em",
                lineHeight: 1.5,
              }}
            >
              准备好把这幅画交给它了吗？
            </h2>

            <div className="flex justify-center mt-8">
              <motion.button
                className="relative overflow-hidden rounded-full flex items-center justify-center"
                style={{
                  width: "240px",
                  height: "52px",
                  background:
                    "linear-gradient(135deg, #9B4030 0%, #C87850 30%, #D4A054 60%, #C87850 85%, #9B4030 100%)",
                  boxShadow:
                    "0 4px 24px rgba(155,64,48,0.35), 0 0 40px rgba(212,160,84,0.15)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={goUpload}
              >
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: "20%",
                    top: "2px",
                    width: "60%",
                    height: "45%",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
                    borderRadius: "50%",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    color: "#F5EFE2",
                  }}
                >
                  开始上传画作
                </span>
              </motion.button>
            </div>

            {/* Footer */}
            <div
              className="mt-12 pt-6 flex flex-col items-center gap-4"
              style={{
                borderTopWidth: "1px",
                borderTopStyle: "solid",
                borderTopColor: "rgba(212,160,84,0.1)",
              }}
            >
              {/* Logo + name */}
              <div className="flex items-center gap-2">
                <img
                  src={combLogoFlat}
                  alt="一镜一梳"
                  style={{ width: "28px", height: "28px", objectFit: "contain" }}
                />
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#D4A054",
                    letterSpacing: "0.1em",
                  }}
                >
                  一镜一梳
                </span>
              </div>

              {/* Links */}
              <div className="flex gap-6">
                {["隐私政策", "用户协议"].map((link) => (
                  <button
                    key={link}
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: "12px",
                      color: "rgba(232,220,200,0.4)",
                      background: "none",
                    }}
                  >
                    {link}
                  </button>
                ))}
              </div>

              <p
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "11px",
                  color: "rgba(232,220,200,0.25)",
                }}
              >
                &copy; 2026 一镜一梳 All Rights Reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}