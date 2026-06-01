import { useState, useRef } from "react";
import { Camera } from "lucide-react";

export function UploadRing() {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Dunhuang ornamental dot colors
  const dotColors = [
    { angle: 0, color: "rgba(212,160,84,0.6)" },      // gold (cardinal)
    { angle: 45, color: "rgba(200,120,80,0.45)" },     // terracotta
    { angle: 90, color: "rgba(212,160,84,0.6)" },      // gold (cardinal)
    { angle: 135, color: "rgba(232,220,200,0.4)" },    // cream
    { angle: 180, color: "rgba(212,160,84,0.6)" },     // gold (cardinal)
    { angle: 225, color: "rgba(200,120,80,0.45)" },    // terracotta
    { angle: 270, color: "rgba(212,160,84,0.6)" },     // gold (cardinal)
    { angle: 315, color: "rgba(232,220,200,0.4)" },    // cream
  ];

  return (
    <div className="flex justify-center pt-6 pb-3">
      <div
        className="relative w-[229px] h-[229px] rounded-full flex items-center justify-center cursor-pointer group"
        onClick={handleClick}
      >
        {/* Outermost warm glow */}
        <div
          className="absolute rounded-full transition-all duration-500 group-hover:scale-105"
          style={{
            inset: "-11.5px",
            background:
              "radial-gradient(circle, rgba(212,160,84,0.1) 20%, rgba(200,120,80,0.06) 45%, rgba(26,40,68,0.03) 65%, transparent 85%)",
            filter: "blur(8px)",
          }}
        />

        {/* Outer ornamental ring - Dunhuang palette conic gradient */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "-4px",
            background:
              "conic-gradient(from 0deg, #D4A054, #C87850, #9B4030, #C87850, #D4A054, #E8DCC8, #7A8EA8, #4A6080, #1E2D4D, #4A6080, #7A8EA8, #E8DCC8, #D4A054)",
            opacity: 0.5,
          }}
        />

        {/* Gold accent ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "-1px",
            border: "1.5px solid rgba(212, 160, 84, 0.4)",
          }}
        />

        {/* Main circle border */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            border: image
              ? "2px solid rgba(212, 160, 84, 0.6)"
              : "2px dashed rgba(212, 160, 84, 0.3)",
            boxShadow: "inset 0 0 30px rgba(212, 160, 84, 0.04)",
          }}
        />

        {/* Inner decorative ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "3px",
            border: "1px solid rgba(200, 120, 80, 0.15)",
          }}
        />

        {/* Ornamental dots - Dunhuang palette */}
        {dotColors.map(({ angle, color }) => (
          <div
            key={angle}
            className="absolute"
            style={{
              width: angle % 90 === 0 ? "6px" : "4px",
              height: angle % 90 === 0 ? "6px" : "4px",
              borderRadius: "50%",
              backgroundColor: color,
              top: `${50 - 50 * Math.cos((angle * Math.PI) / 180)}%`,
              left: `${50 + 50 * Math.sin((angle * Math.PI) / 180)}%`,
              transform: "translate(-50%, -50%)",
              boxShadow:
                angle % 90 === 0
                  ? `0 0 6px ${color}`
                  : `0 0 4px ${color}`,
            }}
          />
        ))}

        {image ? (
          <img
            src={image}
            alt="Uploaded mandala"
            className="w-full h-full rounded-full object-cover z-10"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center z-10">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(212,160,84,0.12), rgba(200,120,80,0.08))",
                border: "1px solid rgba(212, 160, 84, 0.2)",
              }}
            >
              <Camera size={21} color="#D4A054" strokeWidth={1.5} />
            </div>
            <div>
              <p
                className="mb-1"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "14px",
                  color: "#E8DCC8",
                }}
              >
                点击上传或拍照
              </p>

            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}