import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, X, Gift, Lightbulb, Check, Circle } from "lucide-react";
import combLogoFlat from "figma:asset/dd21b372c423cb06578216b853db653316e94fcc.png";
import combLogoJade from "figma:asset/ec938b461112a5f0c49ddeef01f72798c26e630b.png";
import dunhuangPattern from "figma:asset/176d69efc81b256182be2c6f62c7d48ce8cbe05b.png";

/* ─── Analysis stages ─── */
const STAGES = [
  { label: "正在提取图像...", start: 0, end: 20 },
  { label: "分析颜色分布...", start: 20, end: 50 },
  { label: "识别三圈结构...", start: 50, end: 80 },
  { label: "生成解读报告...", start: 80, end: 100 },
];

/* ─── Knowledge tips ─── */
const TIPS = [
  "木生火，火生土，土生金，金生水，水生木",
  "内圈代表自我，中圈代表关系，外圈代表环境",
  "颜色与五行：绿木、红火、黄土、白金、蓝水",
  "曼陀罗源自梵语，意为「圆」，象征宇宙的完整",
  "绘画时的直觉选择，往往最能反映内心真实状态",
];

/* ─── Floating particles (smaller, subtler) ─── */
function FloatingParticlesSmall() {
  const particles = [
    { x: "15%", y: "20%", size: 3, delay: 0, duration: 7 },
    { x: "80%", y: "15%", size: 2.5, delay: 1.5, duration: 6 },
    { x: "70%", y: "60%", size: 3, delay: 0.8, duration: 8 },
    { x: "25%", y: "50%", size: 2, delay: 2.5, duration: 7.5 },
    { x: "55%", y: "35%", size: 2.5, delay: 1.0, duration: 6.5 },
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
              "radial-gradient(circle, rgba(212,160,84,0.7) 0%, rgba(212,160,84,0) 70%)",
            boxShadow: `0 0 ${p.size * 2.5}px rgba(212,160,84,0.35)`,
          }}
          animate={{
            y: [0, -15, 4, -10, 0],
            x: [0, 6, -4, 8, 0],
            opacity: [0.2, 0.7, 0.4, 0.8, 0.2],
            scale: [1, 1.2, 0.9, 1.15, 1],
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

/* ─── Log item ─── */
function LogItem({
  label,
  status,
}: {
  label: string;
  status: "done" | "active" | "waiting";
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {status === "done" && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(72,187,120,0.15)",
          }}
        >
          <Check size={12} color="#48bb78" strokeWidth={2.5} />
        </div>
      )}
      {status === "active" && (
        <motion.div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(212,168,83,0.15)",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#D4A853",
            }}
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
      {status === "waiting" && (
        <div className="w-5 h-5 flex items-center justify-center">
          <Circle size={10} color="rgba(113,128,150,0.5)" strokeWidth={1.5} />
        </div>
      )}
      <span
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "13px",
          color:
            status === "done"
              ? "#48bb78"
              : status === "active"
              ? "#D4A853"
              : "rgba(113,128,150,0.5)",
          fontWeight: status === "active" ? 500 : 400,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ========== LOADING PAGE ========== */
export function LoadingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const startTimeRef = useRef(Date.now());
  const TOTAL_DURATION = 17000; // 17 seconds

  // Simulate progress
  useEffect(() => {
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const raw = Math.min((elapsed / TOTAL_DURATION) * 100, 100);

      // Easing: slow down towards end of each stage
      const eased = raw < 95 ? raw : 95 + (raw - 95) * 0.3;
      setProgress(Math.round(eased * 10) / 10);

      if (elapsed >= TOTAL_DURATION + 1500) {
        setProgress(100);
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Auto-navigate when complete
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        // Navigate to report page (placeholder: back to landing for now)
        navigate("/report");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [progress, navigate]);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get current active stage index
  const getStageStatus = useCallback(
    (stageIndex: number): "done" | "active" | "waiting" => {
      const stage = STAGES[stageIndex];
      if (progress >= stage.end) return "done";
      if (progress >= stage.start) return "active";
      return "waiting";
    },
    [progress]
  );

  // Current step text
  const currentStepText = (() => {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (progress >= STAGES[i].start) return STAGES[i].label;
    }
    return STAGES[0].label;
  })();

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
        {/* ─── Top Navigation ─── */}
        <div
          className="flex items-center justify-between px-4 py-3 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)",
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: "rgba(212,160,84,0.15)",
          }}
        >
          {/* Ornamental glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              right: "30px",
              top: "-8px",
              width: "60px",
              height: "50px",
              background:
                "radial-gradient(ellipse, rgba(212,160,84,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />

          <button
            className="p-1 transition-colors"
            style={{ color: "rgba(232,220,200,0.5)" }}
            onClick={() => navigate("/upload")}
          >
            <ArrowLeft size={22} />
          </button>

          {/* Center logo */}
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
              一镜一梳
            </span>
          </div>

          <button
            className="p-1 transition-colors"
            style={{ color: "rgba(232,220,200,0.4)" }}
            onClick={() => navigate("/")}
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Main Content ─── */}
        <div
          className="flex-1 overflow-y-auto relative"
          style={{
            scrollbarWidth: "none",
            background:
              "linear-gradient(180deg, #0F1B33 0%, #1A2844 30%, #1E2D4D 60%, #1A2844 100%)",
          }}
        >
          {/* Dunhuang texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${dunhuangPattern})`,
              backgroundSize: "300px",
              backgroundRepeat: "repeat",
              opacity: 0.02,
            }}
          />

          {/* Ambient glows */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-30px",
              right: "-40px",
              width: "200px",
              height: "180px",
              background:
                "radial-gradient(ellipse at 40% 50%, rgba(200,120,80,0.08) 0%, transparent 60%)",
              borderRadius: "50%",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: "25%",
              left: "-40px",
              width: "160px",
              height: "200px",
              background:
                "radial-gradient(ellipse, rgba(212,160,84,0.06) 0%, transparent 60%)",
              borderRadius: "50%",
            }}
          />

          <FloatingParticlesSmall />

          <div className="flex flex-col items-center px-6 pt-10 pb-8 relative">
            {/* ─── Logo Visual ─── */}
            <div className="relative mb-8">
              {/* Outer glow ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-24px",
                  background:
                    "conic-gradient(from 0deg, rgba(212,160,84,0.12), rgba(200,120,80,0.06), rgba(122,142,168,0.08), rgba(212,160,84,0.12))",
                  filter: "blur(10px)",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Thin geometric ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-14px",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.18)",
                }}
                animate={{ rotate: -360 }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Pulsing glow */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-4px",
                  background:
                    "radial-gradient(circle, rgba(212,160,84,0.12) 0%, transparent 70%)",
                }}
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Logo */}
              <motion.img
                src={combLogoJade}
                alt="一镜一梳"
                className="relative z-10"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "contain",
                  filter:
                    "drop-shadow(0 3px 18px rgba(212,160,84,0.2))",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            {/* ─── Status Text ─── */}
            <h1
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#E8DCC8",
                letterSpacing: "0.12em",
                lineHeight: 1.4,
              }}
            >
              正在解读中...
            </h1>
            <p
              className="mt-1.5"
              style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                fontSize: "14px",
                color: "rgba(232,220,200,0.55)",
                letterSpacing: "0.04em",
              }}
            >
              AI正在分析您的曼陀罗画作
            </p>

            {/* ─── Progress Section ─── */}
            <div className="w-full mt-8" style={{ maxWidth: "300px" }}>
              {/* Percentage */}
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "#D4A054",
                    lineHeight: 1,
                  }}
                >
                  {Math.round(progress)}
                </span>
                <span
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "14px",
                    color: "rgba(212,160,84,0.7)",
                  }}
                >
                  %
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  height: "6px",
                  borderRadius: "3px",
                  background: "rgba(232,220,200,0.1)",
                }}
              >
                {/* Filled portion */}
                <motion.div
                  className="absolute left-0 top-0 h-full"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    borderRadius: "3px",
                    background:
                      "linear-gradient(90deg, #9B4030, #C87850, #D4A054)",
                    transition: "width 0.3s ease-out",
                  }}
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute top-0 h-full pointer-events-none"
                  style={{
                    width: "40px",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    left: `${Math.min(progress, 100) - 5}%`,
                  }}
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Current step text */}
              <p
                className="mt-2.5 text-center"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13px",
                  color: "rgba(232,220,200,0.6)",
                }}
              >
                {progress >= 100 ? "分析完成，即将跳转..." : currentStepText}
              </p>
            </div>

            {/* ─── Analysis Log ─── */}
            <div
              className="w-full mt-6 px-4 py-3.5 rounded-2xl"
              style={{
                maxWidth: "300px",
                background: "rgba(26,40,68,0.5)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(212,160,84,0.1)",
              }}
            >
              <p
                className="mb-2"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "12px",
                  color: "rgba(232,220,200,0.35)",
                  letterSpacing: "0.04em",
                }}
              >
                正在分析：
              </p>
              {STAGES.map((stage, i) => (
                <LogItem
                  key={stage.label}
                  label={stage.label}
                  status={getStageStatus(i)}
                />
              ))}
            </div>

            {/* ─── Free Trial Indicator ─── */}
            

            {/* ─── Knowledge Card ─── */}
            <div
              className="w-full mt-8 rounded-2xl overflow-hidden relative"
              style={{
                maxWidth: "320px",
                background: "rgba(250,248,245,0.95)",
                padding: "16px",
              }}
            >
              {/* Subtle warm glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: "-8px",
                  right: "-8px",
                  width: "50px",
                  height: "50px",
                  background:
                    "radial-gradient(circle, rgba(212,160,84,0.08) 0%, transparent 60%)",
                  borderRadius: "50%",
                }}
              />

              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={15} color="#C87850" strokeWidth={1.8} />
                <span
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#4A3D30",
                  }}
                >
                  五行小知识
                </span>
              </div>

              <div style={{ minHeight: "40px", position: "relative" }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: "13px",
                      color: "#8A7C6C",
                      lineHeight: 1.7,
                    }}
                  >
                    {TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5 mt-3">
                {TIPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === tipIndex ? "16px" : "5px",
                      height: "5px",
                      borderRadius: "2.5px",
                      background:
                        i === tipIndex
                          ? "linear-gradient(90deg, #C87850, #D4A054)"
                          : "rgba(138,124,108,0.2)",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
