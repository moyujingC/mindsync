import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, Coins, Check } from "lucide-react";
import dunhuangPattern from "figma:asset/176d69efc81b256182be2c6f62c7d48ce8cbe05b.png";
import { NavigationBar } from "./NavigationBar";

/* ─── Floating golden particles ─── */
function FloatingParticles() {
  const particles = [
    { x: "15%", y: "18%", size: 3, delay: 0, duration: 7 },
    { x: "82%", y: "12%", size: 3, delay: 1.2, duration: 8 },
    { x: "70%", y: "60%", size: 4, delay: 0.6, duration: 7.5 },
    { x: "20%", y: "75%", size: 2, delay: 2.0, duration: 9 },
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
            boxShadow: `0 0 ${p.size * 3}px rgba(212,160,84,0.35)`,
          }}
          animate={{
            y: [0, -16, 6, -12, 0],
            opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
            scale: [1, 1.2, 0.95, 1.15, 1],
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

export function ConfirmPaymentPage() {
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState<"idle" | "ok" | "error">("idle");

  const basePrice = 9.9;
  const finalPrice = couponState === "ok" ? 0 : basePrice;

  const handleRedeem = () => {
    if (!coupon.trim()) return;
    if (coupon.trim().toUpperCase() === "MVP_LITE") {
      setCouponState("ok");
    } else {
      setCouponState("error");
    }
  };

  const includes = [
    "重点描述这次画面最突出的状态与气氛",
    "阅读简短，适合先快速看清这次解读",
    "适合快速进入；之后想深入，可在 Lite 基础上升级 Pro",
  ];

  return (
    <div
      className="size-full flex justify-center"
      style={{ backgroundColor: "#141E38" }}
    >
      <div
        className="w-full flex flex-col relative overflow-hidden"
        style={{
          maxWidth: "480px",
          height: "100%",
          fontFamily: "'Noto Sans SC', sans-serif",
          background:
            "linear-gradient(180deg, #0F1B33 0%, #1A2844 30%, #1E2D4D 60%, #1A2844 100%)",
        }}
      >
        {/* Dunhuang pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${dunhuangPattern})`,
            backgroundSize: "300px",
            backgroundRepeat: "repeat",
            opacity: 0.03,
          }}
        />
        {/* Ambient glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-40px",
            right: "-50px",
            width: "240px",
            height: "220px",
            background:
              "radial-gradient(ellipse at 40% 50%, rgba(200,120,80,0.1) 0%, transparent 60%)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "20%",
            left: "-60px",
            width: "200px",
            height: "260px",
            background:
              "radial-gradient(ellipse, rgba(212,160,84,0.07) 0%, transparent 60%)",
            borderRadius: "50%",
          }}
        />
        <FloatingParticles />

        <div className="relative z-10">
          <NavigationBar title="待支付" />
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto relative"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="px-6 pt-4 pb-10">
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#E8DCC8",
                  letterSpacing: "0.08em",
                  lineHeight: 1.5,
                }}
              >
                确认支付 Lite 解读
              </h1>
              <p
                className="mt-2"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "13px",
                  color: "rgba(232,220,200,0.6)",
                  lineHeight: 1.75,
                }}
              >
                支付完成后，会进入 Lite 解读生成流程。
              </p>
              <p
                className="mt-1"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "12px",
                  color: "rgba(212,160,84,0.7)",
                  lineHeight: 1.7,
                }}
              >
                这一步会先用刚才选的 Lite 版本，支付之后无法再改动。
              </p>
            </motion.div>

            {/* Selected meta badges */}
            <motion.div
              className="flex gap-2 mt-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(212,160,84,0.1)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.25)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "11px",
                    color: "rgba(232,220,200,0.55)",
                    letterSpacing: "0.06em",
                  }}
                >
                  当前议题
                </span>
                <Coins size={12} color="#D4A054" strokeWidth={1.8} />
                <span
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "12px",
                    color: "#D4A054",
                    letterSpacing: "0.06em",
                  }}
                >
                  财富关系
                </span>
              </div>
            </motion.div>

            {/* Main cream card */}
            <motion.div
              className="mt-6 rounded-2xl p-5 relative overflow-hidden"
              style={{
                backgroundColor: "#F0E6D6",
                boxShadow:
                  "0 6px 28px rgba(15, 27, 51, 0.4), 0 0 40px rgba(212,160,84,0.08)",
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {/* Soft decorative glows on cream */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: "-25px",
                  right: "-20px",
                  width: "120px",
                  height: "120px",
                  background:
                    "radial-gradient(circle, rgba(212,160,84,0.1) 0%, transparent 60%)",
                  borderRadius: "50%",
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  bottom: "-20px",
                  left: "-20px",
                  width: "100px",
                  height: "100px",
                  background:
                    "radial-gradient(circle, rgba(200,120,80,0.06) 0%, transparent 60%)",
                  borderRadius: "50%",
                }}
              />

              {/* Header: version + price */}
              <div className="flex items-center justify-between gap-4 relative">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(212,160,84,0.22), rgba(200,120,80,0.12))",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "rgba(212,160,84,0.35)",
                    }}
                  >
                    <Sparkles size={18} color="#C87850" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col" style={{ gap: "2px" }}>
                    <span
                      style={{
                        fontFamily: "'Noto Sans SC', sans-serif",
                        fontSize: "11px",
                        color: "#8A7C6C",
                        letterSpacing: "0.12em",
                        lineHeight: 1,
                      }}
                    >
                      解读版本
                    </span>
                    <span
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: "22px",
                        fontWeight: 600,
                        color: "#4A3D30",
                        letterSpacing: "0.04em",
                        lineHeight: 1.1,
                      }}
                    >
                      Lite
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end" style={{ gap: "2px" }}>
                  <div
                    className="flex items-baseline"
                    style={{ lineHeight: 1.1 }}
                  >
                    <span
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: "26px",
                        fontWeight: 600,
                        color: couponState === "ok" ? "#C87850" : "#4A3D30",
                        letterSpacing: "0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {finalPrice.toFixed(1)}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Noto Sans SC', sans-serif",
                        fontSize: "12px",
                        color: "#8A7C6C",
                        marginLeft: "3px",
                      }}
                    >
                      元
                    </span>
                  </div>
                  {couponState === "ok" && (
                    <span
                      style={{
                        fontFamily: "'Noto Sans SC', sans-serif",
                        fontSize: "11px",
                        color: "#A99584",
                        textDecoration: "line-through",
                      }}
                    >
                      {basePrice.toFixed(1)} 元
                    </span>
                  )}
                </div>
              </div>

              

              {/* Coupon input */}
              <div className="mt-5 relative">
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "12px",
                    color: "#8A7C6C",
                    letterSpacing: "0.04em",
                  }}
                >
                  优惠券 / 兑换码
                </label>
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      if (couponState !== "idle") setCouponState("idle");
                    }}
                    placeholder=""
                    className="flex-1 px-3 py-2 rounded-lg outline-none"
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: "13px",
                      color: "#4A3D30",
                      background: "rgba(255,255,255,0.5)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor:
                        couponState === "error"
                          ? "rgba(200,80,80,0.5)"
                          : couponState === "ok"
                            ? "rgba(200,120,80,0.5)"
                            : "rgba(200,120,80,0.2)",
                      letterSpacing: "0.04em",
                    }}
                  />
                  <button
                    onClick={handleRedeem}
                    className="px-4 rounded-lg"
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: "13px",
                      color: "#C87850",
                      background: "rgba(212,160,84,0.12)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "rgba(200,120,80,0.35)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    兑换
                  </button>
                </div>
                {couponState !== "idle" && (
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: "11.5px",
                      color: couponState === "error" ? "#B95050" : "#C87850",
                      lineHeight: 1.7,
                    }}
                  >
                    {couponState === "error"
                      ? "兑换码无效，请检查后重试。"
                      : "兑换成功，本次 Lite 解读已免费。"}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div
                className="my-5 relative"
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(200,120,80,0.25), transparent)",
                }}
              />

              {/* Includes list */}
              <div className="relative">
                <span
                  className="block mb-3"
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontSize: "12px",
                    color: "#8A7C6C",
                    letterSpacing: "0.08em",
                  }}
                >
                  本次 Lite 解读会包含
                </span>
                <ul className="flex flex-col gap-2.5">
                  {includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(212,160,84,0.18)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: "rgba(200,120,80,0.35)",
                        }}
                      >
                        <Check size={9} color="#C87850" strokeWidth={3} />
                      </span>
                      <span
                        style={{
                          fontFamily: "'Noto Sans SC', sans-serif",
                          fontSize: "13px",
                          color: "#5E5046",
                          lineHeight: 1.7,
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA inside card */}
              <motion.button
                className="w-full mt-6 relative overflow-hidden rounded-full flex items-center justify-center"
                style={{
                  height: "50px",
                  background:
                    "linear-gradient(135deg, #9B4030 0%, #C87850 30%, #D4A054 60%, #C87850 85%, #9B4030 100%)",
                  boxShadow:
                    "0 4px 18px rgba(155,64,48,0.3), 0 0 30px rgba(212,160,84,0.15)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/loading")}
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
                    letterSpacing: "0.2em",
                    color: "#F5EFE2",
                  }}
                >
                  确认支付
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
