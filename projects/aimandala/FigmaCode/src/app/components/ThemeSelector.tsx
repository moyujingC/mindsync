import { useState, useRef } from "react";
import { Check, User, Baby, Coins, HeartPulse, Users, Heart, UsersRound, Briefcase } from "lucide-react";

import type { LucideIcon } from "lucide-react";

const themes: { id: string; icon: LucideIcon; label: string; sub: string }[] = [
  { id: "wealth", icon: Coins, label: "财富", sub: "关系" },
  { id: "intimate", icon: Heart, label: "亲密", sub: "关系" },
  { id: "mother", icon: User, label: "母亲", sub: "关系" },
  { id: "father", icon: Users, label: "父亲", sub: "关系" },
  { id: "child", icon: Baby, label: "亲子", sub: "关系" },
  { id: "social", icon: UsersRound, label: "人际", sub: "关系" },
  { id: "career", icon: Briefcase, label: "事业", sub: "发展" },
  { id: "health", icon: HeartPulse, label: "身体", sub: "健康" },
];

export function ThemeSelector() {
  const [selected, setSelected] = useState("wealth");
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <p
        className="mb-3 px-1"
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          color: "#3D2E1E",
        }}
      >
        选择解读议题 <span style={{ color: "#C87850" }}>*</span>
      </p>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {themes.map((theme) => {
          const isSelected = selected === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setSelected(theme.id)}
              className="flex-shrink-0 flex flex-col items-center justify-center rounded-lg transition-all duration-200 relative overflow-hidden"
              style={{
                width: "72px",
                height: "80px",
                backgroundColor: isSelected ? "transparent" : "#EDE6D8",
                background: isSelected
                  ? "linear-gradient(135deg, #1E2D4D 0%, #253860 40%, #2A4070 70%, #1E2D4D 100%)"
                  : undefined,
                border: isSelected ? "1px solid rgba(212,160,84,0.4)" : "1px solid rgba(200,120,80,0.15)",
                boxShadow: isSelected
                  ? "0 4px 14px rgba(26, 40, 68, 0.35)"
                  : "none",
              }}
            >
              {/* Warm glow on selected */}
              {isSelected && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 70% 20%, rgba(212,160,84,0.2) 0%, transparent 50%)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {isSelected && (
                <div
                  className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(212,160,84,0.5)" }}
                >
                  <Check size={10} color="#1E2D4D" strokeWidth={3} />
                </div>
              )}
              <span className="mb-1 relative z-10">
                <theme.icon
                  size={22}
                  color={isSelected ? "#D4A054" : "#9B6840"}
                  strokeWidth={1.5}
                />
              </span>
              <span
                className="relative z-10"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "14px",
                  color: isSelected ? "#E8DCC8" : "#3D2E1E",
                  lineHeight: 1.3,
                }}
              >
                {theme.label}
              </span>
              <span
                className="relative z-10"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "14px",
                  color: isSelected ? "rgba(212,160,84,0.7)" : "#9B7A5A",
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
      <div className="flex justify-center gap-1.5 mt-1">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="rounded-full transition-all"
            style={{
              width: selected === theme.id ? "16px" : "6px",
              height: "6px",
              backgroundColor:
                selected === theme.id ? "#D4A054" : "rgba(200,120,80,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
