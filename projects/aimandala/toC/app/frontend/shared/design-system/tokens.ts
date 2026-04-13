export const aimandalaDesignTokens = {
  color: {
    inkStrong: "#2f2215",
    inkMuted: "#6c5d4d",
    surfaceBase: "rgba(255, 248, 240, 0.92)",
    surfaceAccent: "rgba(255, 243, 220, 0.95)",
    surfaceDebug: "rgba(246, 240, 233, 0.98)",
    borderSoft: "rgba(122, 97, 74, 0.18)",
    borderAccent: "rgba(179, 115, 63, 0.28)",
    success: "#2e7d61",
    warning: "#b06a2b",
    danger: "#8d4337",
  },
  radius: {
    card: 28,
    chip: 999,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
} as const;

export type AimandalaDesignTokens = typeof aimandalaDesignTokens;
