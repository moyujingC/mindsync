import type { WechatLayoutThemeAsset } from "../types";

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
  headingFontSize: number;
  paragraphSpacing: number;
  sectionSpacing: number;
  imageRadius: number;
  quoteRadius: number;
  quoteBorderWidth: number;
  ctaRadius: number;
  captionAlign: "left" | "center";
}

export function buildWechatLayoutTheme(theme?: WechatLayoutThemeAsset): WechatLayoutTheme {
  if (theme) {
    return {
      shellBg: theme.shellBg,
      phoneBg: mix(theme.shellBg, "#ffffff", 0.84),
      articleBg: theme.articleBg,
      titleColor: theme.titleColor,
      headingColor: theme.headingColor,
      bodyColor: theme.bodyColor,
      mutedColor: theme.mutedColor,
      quoteBg: theme.quoteBg,
      quoteBorder: theme.quoteBorder,
      ctaBg: theme.ctaBg,
      ctaText: theme.ctaText,
      figureBg: theme.figureBg,
      placeholderBg: theme.placeholderBg,
      placeholderBorder: theme.placeholderBorder,
      headingFontSize: theme.headingFontSize,
      paragraphSpacing: theme.paragraphSpacing,
      sectionSpacing: theme.sectionSpacing,
      imageRadius: theme.imageRadius,
      quoteRadius: theme.quoteRadius,
      quoteBorderWidth: theme.quoteBorderWidth,
      ctaRadius: theme.ctaRadius,
      captionAlign: theme.captionAlign,
    };
  }

  return {
    shellBg: "rgb(244, 240, 232)",
    phoneBg: "rgb(252, 250, 246)",
    articleBg: "#ffffff",
    titleColor: "rgb(35, 35, 35)",
    headingColor: "#222222",
    bodyColor: "rgb(49, 49, 49)",
    mutedColor: "rgb(134, 128, 116)",
    quoteBg: "rgb(246, 242, 232)",
    quoteBorder: "#222222",
    ctaBg: "#222222",
    ctaText: "#ffffff",
    figureBg: "rgb(237, 231, 220)",
    placeholderBg: "rgb(250, 246, 238)",
    placeholderBorder: "rgb(212, 202, 184)",
    headingFontSize: 22,
    paragraphSpacing: 18,
    sectionSpacing: 28,
    imageRadius: 8,
    quoteRadius: 10,
    quoteBorderWidth: 4,
    ctaRadius: 999,
    captionAlign: "center",
  };
}

function mix(colorA: string, colorB: string, weightA: number) {
  const a = parseColor(colorA);
  const b = parseColor(colorB);
  const weightB = 1 - weightA;
  const r = Math.round(a.r * weightA + b.r * weightB);
  const g = Math.round(a.g * weightA + b.g * weightB);
  const bl = Math.round(a.b * weightA + b.b * weightB);
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseColor(color: string) {
  if (color.startsWith("rgb")) {
    const parts = color.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
    return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0 };
  }

  const normalized = color.replace("#", "");
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
