import { BookOpen, Lock } from "lucide-react";
import { useNavigate } from "react-router";

/* 敦煌卷草纹 SVG — 细密忍冬纹样，左右对称，水平平铺 */
const SCROLL_VINE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='20' viewBox='0 0 160 20' fill='none'%3E%3Cpath d='M0 10 C4 4, 10 2, 16 6 C22 10, 18 16, 24 14 C30 12, 28 4, 34 6 C40 8, 36 14, 42 12 C48 10, 44 4, 50 6 C56 8, 52 14, 58 12 C64 10, 60 4, 66 6 C72 8, 68 14, 74 12 C80 10, 76 4, 82 6 C88 8, 84 14, 90 12 C96 10, 92 4, 98 6 C104 8, 100 14, 106 12 C112 10, 108 4, 114 6 C120 8, 116 14, 122 12 C128 10, 124 4, 130 6 C136 8, 132 14, 138 12 C144 10, 140 4, 146 6 C152 8, 148 14, 154 12 C158 10, 156 8, 160 10' stroke='rgba(200,160,84,0.18)' stroke-width='0.8' fill='none'/%3E%3Cpath d='M0 10 C4 16, 10 18, 16 14 C22 10, 18 4, 24 6 C30 8, 28 16, 34 14 C40 12, 36 6, 42 8 C48 10, 44 16, 50 14 C56 12, 52 6, 58 8 C64 10, 60 16, 66 14 C72 12, 68 6, 74 8 C80 10, 76 16, 82 14 C88 12, 84 6, 90 8 C96 10, 92 16, 98 14 C104 12, 100 6, 106 8 C112 10, 108 16, 114 14 C120 12, 116 6, 122 8 C128 10, 124 16, 130 14 C136 12, 132 6, 138 8 C144 10, 140 16, 146 14 C152 12, 148 6, 154 8 C158 10, 156 12, 160 10' stroke='rgba(200,120,80,0.12)' stroke-width='0.6' fill='none'/%3E%3Ccircle cx='16' cy='10' r='1.2' fill='rgba(200,160,84,0.15)'/%3E%3Ccircle cx='50' cy='10' r='1' fill='rgba(200,120,80,0.12)'/%3E%3Ccircle cx='82' cy='10' r='1.2' fill='rgba(200,160,84,0.15)'/%3E%3Ccircle cx='114' cy='10' r='1' fill='rgba(200,120,80,0.12)'/%3E%3Ccircle cx='146' cy='10' r='1.2' fill='rgba(200,160,84,0.15)'/%3E%3C/svg%3E")`;

export function BottomPanel() {
  const navigate = useNavigate();

  return (
    <div
      className="px-6 pt-2.5 pb-3 relative overflow-hidden"
      style={{
        backgroundColor: "#F0E6D6",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: "rgba(200, 120, 80, 0.1)",
      }}
    >
      {/* 卷草纹装饰带 — 底部 */}
      
      {/* 卷草纹装饰带 — 顶部分隔线 */}
      <div
        className="absolute left-0 right-0 top-0 pointer-events-none"
        style={{
          height: "14px",
          backgroundImage: SCROLL_VINE_SVG,
          backgroundRepeat: "repeat-x",
          backgroundSize: "120px 14px",
          backgroundPosition: "center top",
          opacity: 0.5,
          transform: "scaleY(-1)",
        }}
      />

      {/* CTA Button - Dunhuang terracotta-gold gradient */}
      <button
        className="w-full flex items-center justify-center gap-2 rounded-full transition-all duration-200 active:scale-[0.98] relative overflow-hidden"
        style={{
          height: "50px",
          background: "linear-gradient(135deg, #9B4030 0%, #C87850 30%, #D4A054 60%, #C87850 85%, #9B4030 100%)",
          boxShadow:
            "0 4px 18px rgba(155, 64, 48, 0.3), 0 1px 3px rgba(0,0,0,0.1)",
        }}
        onClick={() => navigate("/loading")}
      >
        {/* Gold shimmer accent */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "-8px",
            transform: "translateX(-50%)",
            width: "140px",
            height: "36px",
            background: "radial-gradient(ellipse, rgba(232,220,200,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        {/* Highlight */}
        <div
          className="absolute"
          style={{
            left: "20%",
            top: "2px",
            width: "60%",
            height: "45%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <BookOpen size={18} color="#F5EFE2" />
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "16px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "#F5EFE2",
          }}
        >
          开始解读
        </span>
      </button>

      <div className="flex items-start justify-center gap-1.5 mt-2">
        <Lock size={11} color="#9B7A5A" className="mt-0.5 flex-shrink-0" />
        <p
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "11px",
            color: "#9B7A5A",
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          上传即表示您同意{" "}
          <span style={{ color: "#C87850", textDecoration: "underline" }}>
            隐私政策
          </span>
          ，画作将被加密存储并仅用于解读
        </p>
      </div>
    </div>
  );
}