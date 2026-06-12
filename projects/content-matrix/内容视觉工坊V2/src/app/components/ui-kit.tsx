import { ReactNode, ButtonHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export const COLORS = {
  pageBg: "#F2F0EB",
  surface: "#FBFAF7",
  surfaceAlt: "#FFFFFF",
  border: "#E5E2DA",
  borderSoft: "#ECEAE3",
  text: "#2E3340",
  textMid: "#5C626E",
  textMuted: "#8A8F99",
  textFaint: "#A0A4AD",
  blue: "#5B6E84",
  blueDeep: "#475567",
  blueMid: "#8FA3B8",
  blueSoft: "#B8C4D2",
  blueTint: "#E9EEF3",
  warmTint: "#F4EFE8",
  success: "#7A9A82",
  warning: "#C9A86A",
};

export function Panel({
  children,
  className = "",
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        padding: padded ? 20 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
  right,
}: {
  children: ReactNode;
  hint?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <span style={{ color: COLORS.text, letterSpacing: "0.02em" }}>
          {children}
        </span>
        {hint && (
          <span style={{ color: COLORS.textFaint, fontSize: 12 }}>{hint}</span>
        )}
      </div>
      {right}
    </div>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  block?: boolean;
}

export function Btn({
  variant = "secondary",
  size = "md",
  block,
  className = "",
  style,
  children,
  ...rest
}: BtnProps) {
  // Tighter, more mature button system. Primary fills, secondary outlines,
  // ghost is text. Same radius, same vertical rhythm, weights graded.
  const heights = { sm: 28, md: 34, lg: 40 };
  const px = { sm: 10, md: 14, lg: 18 };
  const fontSizes = { sm: 12.5, md: 13.5, lg: 14 };
  const radius = 6;

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "#3F4E62",
      color: "#F4F6F9",
      border: "1px solid #3F4E62",
      fontWeight: 500,
      letterSpacing: "0.02em",
    },
    secondary: {
      background: COLORS.surface,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      fontWeight: 450 as any,
      letterSpacing: "0.01em",
    },
    ghost: {
      background: "transparent",
      color: COLORS.textMid,
      border: "1px solid transparent",
      fontWeight: 450 as any,
      letterSpacing: "0.01em",
    },
    subtle: {
      background: "rgba(91,110,132,0.08)",
      color: COLORS.blueDeep,
      border: `1px solid transparent`,
      fontWeight: 450 as any,
      letterSpacing: "0.01em",
    },
  };

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors ${className}`}
      style={{
        height: heights[size],
        paddingLeft: px[size],
        paddingRight: px[size],
        width: block ? "100%" : undefined,
        fontSize: fontSizes[size],
        borderRadius: radius,
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Select({
  label,
  value,
  hint,
}: {
  label?: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      {label && (
        <div
          className="mb-1.5"
          style={{ color: COLORS.textMid, fontSize: 13 }}
        >
          {label}
        </div>
      )}
      <button
        className="w-full flex items-center justify-between px-3 rounded-md"
        style={{
          height: 36,
          background: COLORS.surfaceAlt,
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          fontSize: 13,
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: COLORS.blueMid }}
          />
          {value}
          {hint && (
            <span style={{ color: COLORS.textFaint, fontSize: 12 }}>
              · {hint}
            </span>
          )}
        </span>
        <ChevronDown size={14} strokeWidth={1.6} color={COLORS.textMuted} />
      </button>
    </div>
  );
}

export function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between py-2.5"
    >
      <div className="text-left">
        <div style={{ color: COLORS.text, fontSize: 13 }}>{label}</div>
        {desc && (
          <div
            style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}
          >
            {desc}
          </div>
        )}
      </div>
      <span
        className="relative rounded-full transition-colors"
        style={{
          width: 32,
          height: 18,
          background: checked ? COLORS.blue : "#D6D3CC",
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-all"
          style={{
            width: 14,
            height: 14,
            left: checked ? 16 : 2,
            background: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        />
      </span>
    </button>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "warm" | "success" | "muted";
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: COLORS.borderSoft, fg: COLORS.textMid },
    blue: { bg: COLORS.blueTint, fg: COLORS.blueDeep },
    warm: { bg: COLORS.warmTint, fg: "#8B6F44" },
    success: { bg: "#E5EDE6", fg: "#4F6B57" },
    muted: { bg: "transparent", fg: COLORS.textFaint },
  };
  const s = tones[tone];
  return (
    <span
      className="inline-flex items-center px-2 rounded"
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        height: 20,
        letterSpacing: "0.02em",
        border: tone === "muted" ? `1px solid ${COLORS.border}` : "none",
      }}
    >
      {children}
    </span>
  );
}

export function Divider({ vertical = false }: { vertical?: boolean }) {
  if (vertical)
    return (
      <div style={{ width: 1, background: COLORS.borderSoft }} className="h-full" />
    );
  return (
    <div style={{ height: 1, background: COLORS.borderSoft }} className="w-full" />
  );
}

// Decorative SVG "image" placeholder — soft foggy abstract gradient
export function FoggyArt({
  hue = 0,
  className = "",
  style,
  variant = "abstract",
  label,
}: {
  hue?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: "abstract" | "mountain" | "circle" | "leaf" | "wave" | "grid";
  label?: string;
}) {
  const palettes = [
    ["#C8D2DD", "#8FA3B8", "#5B6E84"],
    ["#DCD4C7", "#B5A992", "#7A6F5A"],
    ["#CFD9D2", "#94AA9C", "#5C7368"],
    ["#D4CDD8", "#A095AC", "#6B5F77"],
    ["#D9CFC2", "#B59B7C", "#7A5E42"],
    ["#C4CDD6", "#7E8C9C", "#4D5A6B"],
  ];
  const p = palettes[hue % palettes.length];

  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{
        background: `linear-gradient(160deg, ${p[0]} 0%, ${p[1]} 60%, ${p[2]} 100%)`,
        ...style,
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
      >
        {variant === "mountain" && (
          <>
            <path
              d="M0 150 L60 90 L100 130 L140 70 L200 140 L200 200 L0 200 Z"
              fill={p[2]}
              opacity="0.55"
            />
            <path
              d="M0 170 L40 130 L90 160 L130 110 L200 170 L200 200 L0 200 Z"
              fill={p[2]}
              opacity="0.85"
            />
            <circle cx="155" cy="55" r="14" fill="#F5EFE3" opacity="0.7" />
          </>
        )}
        {variant === "circle" && (
          <>
            <circle cx="100" cy="100" r="55" fill={p[0]} opacity="0.45" />
            <circle cx="100" cy="100" r="38" stroke="#F5EFE3" strokeWidth="0.6" fill="none" opacity="0.7" />
            <circle cx="100" cy="100" r="22" fill="#F5EFE3" opacity="0.35" />
          </>
        )}
        {variant === "leaf" && (
          <>
            <path
              d="M40 160 Q60 80 160 60 Q140 150 40 160 Z"
              fill={p[2]}
              opacity="0.5"
            />
            <path d="M50 155 Q90 110 150 70" stroke="#F5EFE3" strokeWidth="0.8" fill="none" opacity="0.6" />
          </>
        )}
        {variant === "wave" && (
          <>
            <path d="M0 110 Q50 90 100 110 T200 110 L200 200 L0 200 Z" fill={p[2]} opacity="0.5" />
            <path d="M0 130 Q50 115 100 130 T200 130 L200 200 L0 200 Z" fill={p[2]} opacity="0.7" />
          </>
        )}
        {variant === "grid" && (
          <g stroke="#F5EFE3" strokeWidth="0.4" opacity="0.5">
            {[30, 60, 90, 120, 150, 180].map((v) => (
              <line key={"h" + v} x1="0" y1={v} x2="200" y2={v} />
            ))}
            {[30, 60, 90, 120, 150, 180].map((v) => (
              <line key={"v" + v} x1={v} y1="0" x2={v} y2="200" />
            ))}
          </g>
        )}
        {variant === "abstract" && (
          <>
            <circle cx="60" cy="70" r="50" fill={p[0]} opacity="0.55" />
            <circle cx="150" cy="140" r="60" fill={p[2]} opacity="0.4" />
          </>
        )}
      </svg>
      {label && (
        <div
          className="absolute bottom-2 left-3"
          style={{ color: "#F5EFE3", fontSize: 11, letterSpacing: "0.06em" }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
