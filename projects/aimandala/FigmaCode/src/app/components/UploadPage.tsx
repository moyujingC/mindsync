import { NavigationBar } from "./NavigationBar";
import { UploadRing } from "./UploadRing";
import { SliderControl } from "./SliderControl";
import { ThemeSelector } from "./ThemeSelector";
import { TextInputField } from "./TextInputField";
import { BottomPanel } from "./BottomPanel";
import { useState } from "react";
import { RotateCcw, Eye } from "lucide-react";

export function UploadPage() {
  const [innerRadius, setInnerRadius] = useState(35);
  const [outerRadius, setOuterRadius] = useState(60);

  const GAP = 5;

  const handleInnerChange = (v: number) => {
    const clamped = Math.min(v, outerRadius - GAP);
    setInnerRadius(Math.max(0, clamped));
  };

  const handleOuterChange = (v: number) => {
    const clamped = Math.max(v, innerRadius + GAP);
    setOuterRadius(Math.min(100, clamped));
  };

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
        <NavigationBar title={"\u4e0a\u4f20\u66fc\u9640\u7f57\u753b\u4f5c"} />

        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div
            className="px-4 pb-4 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #1A2844 0%, #1E2D4D 20%, #223358 40%, #253860 60%, #1E2D4D 80%, #1A2844 100%)",
            }}
          >
            <div
              className="absolute"
              style={{
                top: "-10px",
                right: "-30px",
                width: "180px",
                height: "160px",
                background:
                  "radial-gradient(ellipse at 40% 50%, rgba(200,120,80,0.08) 0%, rgba(200,120,80,0.03) 45%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "80px",
                left: "-40px",
                width: "140px",
                height: "180px",
                background:
                  "radial-gradient(ellipse, rgba(212,160,84,0.06) 0%, transparent 60%)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "90px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "220px",
                height: "220px",
                background:
                  "radial-gradient(circle, rgba(212,160,84,0.05) 0%, rgba(200,120,80,0.03) 40%, transparent 65%)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "22px",
                right: "50px",
                width: "6px",
                height: "6px",
                background: "rgba(212,160,84,0.3)",
                borderRadius: "50%",
                boxShadow: "0 0 8px rgba(212,160,84,0.2)",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "70px",
                left: "28px",
                width: "4px",
                height: "4px",
                background: "rgba(200,120,80,0.25)",
                borderRadius: "50%",
                boxShadow: "0 0 6px rgba(200,120,80,0.15)",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: "90px",
                right: "32px",
                width: "5px",
                height: "5px",
                background: "rgba(232,220,200,0.2)",
                borderRadius: "50%",
                boxShadow: "0 0 6px rgba(232,220,200,0.1)",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "50px",
                right: "110px",
                width: "4px",
                height: "4px",
                background: "rgba(122,142,168,0.25)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />

            <UploadRing />

            {/* Action buttons below ring */}
            <div className="flex justify-center gap-3 mt-1 mb-2">
              <button
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(138,124,108,0.08)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.18)",
                  fontSize: "12px",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontWeight: 500,
                  color: "rgba(232,220,200,0.6)",
                }}
              >
                <RotateCcw size={13} />
                {"\u91cd\u65b0\u6821\u51c6\u753b\u4f5c"}
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(138,124,108,0.08)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(212,160,84,0.18)",
                  fontSize: "12px",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontWeight: 500,
                  color: "rgba(232,220,200,0.6)",
                }}
              >
                <Eye size={13} />
                {"\u6309\u4f4f\u67e5\u770b\u539f\u56fe"}
              </button>
            </div>

            <div className="flex flex-col gap-4" style={{ marginTop: "8px" }}>
              <SliderControl
                label={"\u5185\u4e2d\u5708\u5206\u754c\u7ebf"}
                value={innerRadius}
                onChange={handleInnerChange}
                min={0}
                max={outerRadius - GAP}
              />
              <SliderControl
                label={"\u4e2d\u5916\u5708\u5206\u754c\u7ebf"}
                value={outerRadius}
                onChange={handleOuterChange}
                min={innerRadius + GAP}
                max={100}
              />
            </div>

            <p
              className="text-center mt-3 px-4"
              style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                fontSize: "12px",
                color: "rgba(232, 220, 200, 0.35)",
                marginTop: "9px",
                marginBottom: "4px",
              }}
            >
              跟随你的直觉，调节三圈范围
            </p>
          </div>

          <div
            className="relative px-6 pt-6 overflow-hidden"
            style={{
              backgroundColor: "#F0E6D6",
              borderRadius: "24px 24px 0 0",
              marginTop: "-16px",
              boxShadow: "0 -4px 24px rgba(26,40,68,0.15)",
              paddingBottom: "24px",
            }}
          >
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-15px",
                right: "20px",
                width: "80px",
                height: "80px",
                background:
                  "radial-gradient(circle, rgba(212,160,84,0.06) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: "40px",
                left: "-15px",
                width: "70px",
                height: "70px",
                background:
                  "radial-gradient(circle, rgba(200,120,80,0.04) 0%, transparent 60%)",
                borderRadius: "50%",
              }}
            />

            <ThemeSelector />

            <div className="flex flex-col gap-3 mt-5">
              <TextInputField placeholder="记录绘画前设定的意图" />
              <TextInputField placeholder="记录绘画时的感受" />
            </div>

            <div className="mt-5">
              <BottomPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
