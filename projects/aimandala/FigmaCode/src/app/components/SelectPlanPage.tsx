import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Check, Sparkles, Eye, Layers } from "lucide-react";
import { NavigationBar } from "./NavigationBar";

/* ─── SVG noise filter (陶土 texture) ─── */
function NoiseFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <filter id="selectNoise">
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

/* ─── Plan Card ─── */
function PlanCard({
  title,
  desc,
  price,
  points,
  accent,
  glow,
  borderColor,
  bgGradient,
  icon,
  delay,
  onSelect,
}: {
  title: string;
  desc: string;
  price: string;
  points: string[];
  accent: string;
  glow: string;
  borderColor: string;
  bgGradient: string;
  icon: React.ReactNode;
  delay: number;
  onSelect: () => void;
}) {
  return (
    <motion.div
      className="flex-1 rounded-2xl overflow-hidden relative flex flex-col"
      style={{
        background: bgGradient,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor,
        minWidth: 0,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-3 right-3"
        style={{
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          borderRadius: "0 0 2px 2px",
        }}
      />

      {/* Corner glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-25px",
          right: "-15px",
          width: "90px",
          height: "90px",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          borderRadius: "50%",
        }}
      />

      <div className="relative px-4 pt-5 pb-4 flex flex-col flex-1">
        {/* Icon + Title */}
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${glow}, transparent)`,
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: accent,
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#EDE4D4",
              letterSpacing: "0.06em",
            }}
          >
            {title}
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "13px",
            fontFamily: "'Noto Sans SC', sans-serif",
            color: "rgba(232,220,200,0.55)",
            lineHeight: 1.7,
            marginBottom: "12px",
          }}
        >
          {desc}
        </p>

        {/* Points */}
        <div className="flex flex-col gap-1.5 mb-4 flex-1">
          {points.map((pt) => (
            <div key={pt} className="flex items-start gap-1.5">
              <Check
                size={12}
                style={{ color: accent, marginTop: "3px", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  color: "rgba(232,220,200,0.45)",
                  lineHeight: 1.6,
                }}
              >
                {pt}
              </span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="mb-3 flex items-baseline gap-1">
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "#EDE4D4",
              letterSpacing: "0.02em",
            }}
          >
            {price}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontFamily: "'Noto Sans SC', sans-serif",
              color: "rgba(232,220,200,0.4)",
            }}
          >
            {"\u5143"}
          </span>
        </div>

        {/* CTA */}
        <button
          className="w-full flex items-center justify-center rounded-full relative overflow-hidden transition-all active:scale-[0.97]"
          style={{
            height: "40px",
            background: `linear-gradient(135deg, ${accent.replace("0.85", "0.7")}, ${accent})`,
            boxShadow: `0 3px 14px ${glow}`,
          }}
          onClick={onSelect}
        >
          {/* Highlight */}
          <div
            className="absolute"
            style={{
              left: "20%",
              top: "1px",
              width: "60%",
              height: "45%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#F5EFE2",
              letterSpacing: "0.08em",
              position: "relative",
              zIndex: 1,
            }}
          >
            {"\u9009\u62e9 "}
            {title}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/* ========== SELECT PLAN PAGE ========== */
export function SelectPlanPage() {
  const navigate = useNavigate();
  const currentTheme = "\u5173\u7cfb";

  return (
    <div
      className="size-full flex justify-center"
      style={{ backgroundColor: "#111A30" }}
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
        {/* ─── Global ambient warm glows ─── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "80px",
            left: "-30px",
            width: "160px",
            height: "160px",
            background:
              "radial-gradient(ellipse, rgba(200,120,80,0.07) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "250px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background:
              "radial-gradient(ellipse, rgba(212,160,84,0.05) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "120px",
            left: "30%",
            width: "140px",
            height: "140px",
            background:
              "radial-gradient(ellipse, rgba(158,170,155,0.04) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Clay noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            filter: "url(#selectNoise)",
            opacity: 0.025,
            mixBlendMode: "overlay",
          }}
        />

        {/* ─── Header ─── */}
        <NavigationBar title={"\u4e00\u955c\u4e00\u68b3"} />

        {/* ─── Scrollable content ─── */}
        <div
          className="flex-1 overflow-y-auto relative"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="relative px-5 pt-6 pb-10">
            {/* ─── Status badge ─── */}
            <motion.div
              className="flex justify-center mb-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#A8C4A0",
                  background: "rgba(158,170,155,0.12)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(158,170,155,0.25)",
                }}
              >
                <Check size={11} />
                {"\u4f5c\u54c1\u8bc6\u522b\u5b8c\u6210"}
              </span>
            </motion.div>

            {/* ─── Main Title ─── */}
            <motion.div
              className="text-center mb-2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#EDE4D4",
                  letterSpacing: "0.06em",
                  lineHeight: 1.5,
                }}
              >
                {"\u8fd9\u6b21\u4f60\u60f3\u7528\u54ea\u79cd\u65b9\u5f0f\u5f00\u59cb\u89e3\u8bfb\uff1f"}
              </h1>
            </motion.div>

            {/* ─── Subtitle ─── */}
            <motion.p
              className="text-center mb-3"
              style={{
                fontSize: "13px",
                color: "rgba(232,220,200,0.45)",
                lineHeight: 1.6,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {"Lite \u66f4\u8f7b\u3001\u66f4\u5feb\uff1bPro \u66f4\u5b8c\u6574\u3001\u66f4\u6df1\u5165\u3002"}
            </motion.p>

            {/* ─── Current theme tag ─── */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "rgba(212,160,84,0.7)",
                  background: "rgba(212,160,84,0.06)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.15)",
                }}
              >
                {"\u5f53\u524d\u4e3b\u9898\uff1a"}
                {currentTheme}
              </span>
            </motion.div>

            {/* ─── Gold separator ─── */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex-1"
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,160,84,0.2), transparent)",
                }}
              />
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(212,160,84,0.5) 0%, rgba(200,120,80,0.3) 100%)",
                  boxShadow: "0 0 6px rgba(212,160,84,0.25)",
                }}
              />
              <div
                className="flex-1"
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,160,84,0.2), transparent)",
                }}
              />
            </div>

            {/* ─── Two cards side by side ─── */}
            <div className="flex gap-3">
              <PlanCard
                title="Lite"
                desc={"\u5148\u8f7b\u4e00\u70b9\u5730\u770b\u6e05\u8fd9\u6b21\u7684\u72b6\u6001\u3002"}
                price="9.9"
                points={[
                  "\u66f4\u8f7b",
                  "\u66f4\u5feb",
                  "\u5148\u770b\u89c1\u8fd9\u4e00\u6b21\u6700\u660e\u663e\u7684\u72b6\u6001\u4e3b\u7ebf",
                ]}
                accent="rgba(158,170,155,0.85)"
                glow="rgba(158,170,155,0.12)"
                borderColor="rgba(158,170,155,0.2)"
                bgGradient="linear-gradient(165deg, rgba(22,35,58,0.9) 0%, rgba(30,45,70,0.65) 50%, rgba(22,35,58,0.8) 100%)"
                icon={<Eye size={15} color="rgba(158,170,155,0.8)" />}
                delay={0.3}
                onSelect={() => navigate("/loading")}
              />
              <PlanCard
                title="Pro"
                desc={"\u66f4\u5b8c\u6574\u5730\u770b\u61c2\u8fd9\u6b21\u753b\u5728\u8868\u8fbe\u4ec0\u4e48\u3002"}
                price="39"
                points={[
                  "\u66f4\u5b8c\u6574",
                  "\u66f4\u6df1\u5165",
                  "\u7ee7\u7eed\u7406\u89e3\u5173\u7cfb\u3001\u6a21\u5f0f\u4e0e\u7275\u52a8",
                ]}
                accent="rgba(212,160,84,0.85)"
                glow="rgba(212,160,84,0.12)"
                borderColor="rgba(212,160,84,0.2)"
                bgGradient="linear-gradient(165deg, rgba(25,38,62,0.9) 0%, rgba(35,48,75,0.65) 50%, rgba(25,38,62,0.8) 100%)"
                icon={<Layers size={15} color="rgba(212,160,84,0.8)" />}
                delay={0.4}
                onSelect={() => navigate("/loading")}
              />
            </div>

            {/* ─── Bottom hint ─── */}
            <motion.p
              className="text-center mt-8"
              style={{
                fontSize: "11px",
                color: "rgba(232,220,200,0.3)",
                lineHeight: 1.6,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {"\u4f60\u9009\u7684\u662f\u8fd9\u4e00\u6b21\u66f4\u9002\u5408\u81ea\u5df1\u7684\u9605\u8bfb\u6df1\u5ea6\u3002"}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
