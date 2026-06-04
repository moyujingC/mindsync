import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export function NavigationBar({ title = "\u4e00\u955c\u4e00\u68b3" }: { title?: string }) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center px-4 py-3 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)",
        borderBottom: "1px solid rgba(212, 160, 84, 0.15)",
      }}
    >
      {/* Subtle ornamental glow */}
      <div
        className="absolute"
        style={{
          right: "30px",
          top: "-8px",
          width: "60px",
          height: "50px",
          background: "radial-gradient(ellipse, rgba(212,160,84,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "100px",
          top: "8px",
          width: "30px",
          height: "28px",
          background: "radial-gradient(circle, rgba(200,120,80,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <button className="p-1 transition-colors" style={{ color: "rgba(232, 220, 200, 0.5)" }} onClick={() => navigate("/")}>
        <ArrowLeft size={22} />
      </button>
      <h1
        className="ml-3 tracking-wider"
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "18px",
          fontWeight: 600,
          letterSpacing: "0.15em",
          color: "#D4A054",
        }}
      >
        {title}
      </h1>
    </div>
  );
}