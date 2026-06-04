import { useState } from "react";

interface SliderControlProps {
  label: string;
  defaultValue?: number;
  disabled?: boolean;
  value?: number;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
}

export function SliderControl({
  label,
  defaultValue = 50,
  disabled = false,
  value: controlledValue,
  onChange,
  min = 0,
  max = 100,
}: SliderControlProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (isControlled && onChange) {
      onChange(v);
    } else {
      setInternalValue(v);
    }
  };

  return (
    <div className={`flex items-center gap-3 px-6 ${disabled ? "opacity-30" : ""}`}>
      <span
        className="whitespace-nowrap min-w-[56px]"
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "12px",
          color: "rgba(232, 220, 200, 0.45)",
        }}
      >
        {label}
      </span>
      <div className="flex-1 relative h-5 flex items-center">
        <div
          className="w-full h-[4px] rounded-full"
          style={{
            background: "linear-gradient(90deg, rgba(212,160,84,0.1), rgba(200,120,80,0.08))",
          }}
        />
        {!disabled && (
          <>
            <div
              className="absolute h-[4px] rounded-full left-0"
              style={{
                width: `${value}%`,
                background: "linear-gradient(90deg, #C87850, #D4A054)",
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={handleChange}
              className="absolute w-full h-5 opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute w-5 h-5 rounded-full pointer-events-none"
              style={{
                left: `calc(${value}% - 10px)`,
                background: `
                  radial-gradient(ellipse at 38% 32%, rgba(255,253,245,0.95) 0%, transparent 45%),
                  radial-gradient(ellipse at 60% 68%, rgba(190,170,140,0.35) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, #F5F0E6 0%, #E8DCC8 50%, #D8CBAE 100%)
                `,
                borderWidth: "1.5px",
                borderStyle: "solid",
                borderColor: "rgba(212,160,84,0.5)",
                boxShadow:
                  "0 2px 6px rgba(80,50,20,0.35), 0 1px 2px rgba(80,50,20,0.25), inset 0 1px 2px rgba(255,250,235,0.7), inset 0 -1px 1px rgba(180,150,110,0.25)",
              }}
            />
          </>
        )}
      </div>
      <span
        className="min-w-[32px] text-right"
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "12px",
          color: "rgba(232, 220, 200, 0.4)",
        }}
      >
        {disabled ? "--" : `${value}%`}
      </span>
    </div>
  );
}