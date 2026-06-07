import type { StyleAsset } from "../types";

export interface WechatLayoutTheme {
  shellBg: string;
  phoneBg: string;
  articleBg: string;
  titleColor: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  quoteBg: string;
  quoteBorder: string;
  ctaBg: string;
  ctaText: string;
  figureBg: string;
  placeholderBg: string;
  placeholderBorder: string;
}

export function buildWechatLayoutTheme(style?: StyleAsset): WechatLayoutTheme {
  const palette = style?.palette ?? ["#f3ecdb", "#1f3a36", "#b86b3a", "#8a8270"];
  const [base, strong, accent, muted] = palette;

  return {
    shellBg: mix(base, "#e8e3d6", 0.68),
    phoneBg: mix(base, "#ffffff", 0.86),
    articleBg: "#ffffff",
    titleColor: mix(strong, "#111111", 0.72),
    headingColor: strong,
    bodyColor: mix(strong, "#2a2a2a", 0.42),
    mutedColor: mix(muted, "#777777", 0.58),
    quoteBg: mix(base, "#f6f2e8", 0.78),
    quoteBorder: strong,
    ctaBg: strong,
    ctaText: "#ffffff",
    figureBg: mix(base, "#ece6d6", 0.74),
    placeholderBg: mix(base, "#faf6ee", 0.8),
    placeholderBorder: mix(muted, "#d8cfbd", 0.62),
  };
}

function mix(hexA: string, hexB: string, weightA: number) {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const weightB = 1 - weightA;
  const r = Math.round(a.r * weightA + b.r * weightB);
  const g = Math.round(a.g * weightA + b.g * weightB);
  const bl = Math.round(a.b * weightA + b.b * weightB);
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseHex(hex: string) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;
  const value = Number.parseInt(full, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}
