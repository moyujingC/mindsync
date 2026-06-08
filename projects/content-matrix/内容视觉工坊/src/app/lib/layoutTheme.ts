import type { WechatLayoutThemeAsset } from "../types";

export interface WechatLayoutTheme {
  variant: "classic" | "blueMist" | "blueMistCalm";
  shellBg: string;
  phoneBg: string;
  articleBg: string;
  titleColor: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  quoteBg: string;
  quoteBorder: string;
  quoteTextColor: string;
  quoteFontSize: number;
  quoteLineHeight: number;
  quoteLetterSpacing: number;
  quoteAlign: "left" | "justify" | "center";
  quoteWeight: number;
  quotePaddingTop: number;
  quotePaddingRight: number;
  quotePaddingBottom: number;
  quotePaddingLeft: number;
  quoteMarginTop: number;
  quoteMarginBottom: number;
  ctaBg: string;
  ctaText: string;
  figureBg: string;
  placeholderBg: string;
  placeholderBorder: string;
  titleFontSize: number;
  headingFontSize: number;
  headingLineHeight: number;
  headingLetterSpacing: number;
  headingMarginTop: number;
  headingMarginBottom: number;
  headingPaddingLeft: number;
  headingBorderLeftWidth: number;
  subheadingFontSize: number;
  subheadingLineHeight: number;
  subheadingLetterSpacing: number;
  subheadingMarginTop: number;
  subheadingMarginBottom: number;
  subheadingPaddingLeft: number;
  subheadingBorderLeftWidth: number;
  bodyFontSize: number;
  bodyLineHeight: number;
  bodyLetterSpacing: number;
  bodyAlign: "left" | "justify" | "center";
  bodyPaddingTop: number;
  bodyPaddingBottom: number;
  strongColor: string;
  strongWeight: number;
  unorderedListFontSize: number;
  unorderedListLineHeight: number;
  unorderedListLetterSpacing: number;
  unorderedListAlign: "left" | "justify" | "center";
  unorderedListMarkerColor: string;
  unorderedListMarker: "solid-circle" | "square" | "hollow-circle";
  unorderedListIndentLeft: number;
  unorderedListPaddingTop: number;
  unorderedListPaddingBottom: number;
  orderedListFontSize: number;
  orderedListLineHeight: number;
  orderedListLetterSpacing: number;
  orderedListAlign: "left" | "justify" | "center";
  orderedListMarkerColor: string;
  orderedListMarkerWeight: number;
  orderedListMarkerType: "number" | "greek" | "roman-lower" | "roman-upper" | "latin-lower" | "latin-upper";
  orderedListIndentLeft: number;
  orderedListPaddingTop: number;
  orderedListPaddingBottom: number;
  articlePaddingX: number;
  paragraphSpacing: number;
  sectionSpacing: number;
  imageRadius: number;
  quoteRadius: number;
  quoteBorderWidth: number;
  ctaRadius: number;
  captionAlign: "left" | "center";
  ctaTitle: string;
  ctaButtonText: string;
  coverBottomSpacing: number;
  inlineImageSpacing: number;
  quoteSpacing: number;
}

export function buildWechatLayoutTheme(theme?: WechatLayoutThemeAsset): WechatLayoutTheme {
  if (theme) {
    return {
      shellBg: theme.shellBg,
      variant: theme.name.includes("蓝雾静读")
        ? "blueMistCalm"
        : theme.name.includes("蓝雾留白")
          ? "blueMist"
          : "classic",
      phoneBg: mix(theme.shellBg, "#ffffff", 0.84),
      articleBg: theme.articleBg,
      titleColor: theme.titleColor,
      headingColor: theme.headingColor,
      bodyColor: theme.bodyColor,
      mutedColor: theme.mutedColor,
      quoteBg: theme.quoteBg,
      quoteBorder: theme.quoteBorder,
      quoteTextColor: theme.quoteTextColor,
      quoteFontSize: theme.quoteFontSize,
      quoteLineHeight: theme.quoteLineHeight,
      quoteLetterSpacing: theme.quoteLetterSpacing,
      quoteAlign: theme.quoteAlign,
      quoteWeight: theme.quoteWeight,
      quotePaddingTop: theme.quotePaddingTop,
      quotePaddingRight: theme.quotePaddingRight,
      quotePaddingBottom: theme.quotePaddingBottom,
      quotePaddingLeft: theme.quotePaddingLeft,
      quoteMarginTop: theme.quoteMarginTop,
      quoteMarginBottom: theme.quoteMarginBottom,
      ctaBg: theme.ctaBg,
      ctaText: theme.ctaText,
      figureBg: theme.figureBg,
      placeholderBg: theme.placeholderBg,
      placeholderBorder: theme.placeholderBorder,
      titleFontSize: theme.titleFontSize,
      headingFontSize: theme.headingFontSize,
      headingLineHeight: theme.headingLineHeight,
      headingLetterSpacing: theme.headingLetterSpacing,
      headingMarginTop: theme.headingMarginTop,
      headingMarginBottom: theme.headingMarginBottom,
      headingPaddingLeft: theme.headingPaddingLeft,
      headingBorderLeftWidth: theme.headingBorderLeftWidth,
      subheadingFontSize: theme.subheadingFontSize,
      subheadingLineHeight: theme.subheadingLineHeight,
      subheadingLetterSpacing: theme.subheadingLetterSpacing,
      subheadingMarginTop: theme.subheadingMarginTop,
      subheadingMarginBottom: theme.subheadingMarginBottom,
      subheadingPaddingLeft: theme.subheadingPaddingLeft,
      subheadingBorderLeftWidth: theme.subheadingBorderLeftWidth,
      bodyFontSize: theme.bodyFontSize,
      bodyLineHeight: theme.bodyLineHeight,
      bodyLetterSpacing: theme.bodyLetterSpacing,
      bodyAlign: theme.bodyAlign,
      bodyPaddingTop: theme.bodyPaddingTop,
      bodyPaddingBottom: theme.bodyPaddingBottom,
      strongColor: theme.strongColor,
      strongWeight: theme.strongWeight,
      unorderedListFontSize: theme.unorderedListFontSize,
      unorderedListLineHeight: theme.unorderedListLineHeight,
      unorderedListLetterSpacing: theme.unorderedListLetterSpacing,
      unorderedListAlign: theme.unorderedListAlign,
      unorderedListMarkerColor: theme.unorderedListMarkerColor,
      unorderedListMarker: theme.unorderedListMarker,
      unorderedListIndentLeft: theme.unorderedListIndentLeft,
      unorderedListPaddingTop: theme.unorderedListPaddingTop,
      unorderedListPaddingBottom: theme.unorderedListPaddingBottom,
      orderedListFontSize: theme.orderedListFontSize,
      orderedListLineHeight: theme.orderedListLineHeight,
      orderedListLetterSpacing: theme.orderedListLetterSpacing,
      orderedListAlign: theme.orderedListAlign,
      orderedListMarkerColor: theme.orderedListMarkerColor,
      orderedListMarkerWeight: theme.orderedListMarkerWeight,
      orderedListMarkerType: theme.orderedListMarkerType,
      orderedListIndentLeft: theme.orderedListIndentLeft,
      orderedListPaddingTop: theme.orderedListPaddingTop,
      orderedListPaddingBottom: theme.orderedListPaddingBottom,
      articlePaddingX: theme.articlePaddingX,
      paragraphSpacing: theme.paragraphSpacing,
      sectionSpacing: theme.sectionSpacing,
      imageRadius: theme.imageRadius,
      quoteRadius: theme.quoteRadius,
      quoteBorderWidth: theme.quoteBorderWidth,
      ctaRadius: theme.ctaRadius,
      captionAlign: theme.captionAlign,
      ctaTitle: theme.ctaTitle,
      ctaButtonText: theme.ctaButtonText,
      coverBottomSpacing: theme.coverBottomSpacing,
      inlineImageSpacing: theme.inlineImageSpacing,
      quoteSpacing: theme.quoteSpacing,
    };
  }

  return {
    shellBg: "rgb(244, 240, 232)",
    variant: "classic",
    phoneBg: "rgb(252, 250, 246)",
    articleBg: "#ffffff",
    titleColor: "rgb(35, 35, 35)",
    headingColor: "#222222",
    bodyColor: "rgb(49, 49, 49)",
    mutedColor: "rgb(134, 128, 116)",
    quoteBg: "rgb(246, 242, 232)",
    quoteBorder: "#222222",
    quoteTextColor: "rgb(102, 102, 102)",
    quoteFontSize: 16,
    quoteLineHeight: 1.8,
    quoteLetterSpacing: 0,
    quoteAlign: "left",
    quoteWeight: 400,
    quotePaddingTop: 20,
    quotePaddingRight: 10,
    quotePaddingBottom: 10,
    quotePaddingLeft: 20,
    quoteMarginTop: 20,
    quoteMarginBottom: 20,
    ctaBg: "#222222",
    ctaText: "#ffffff",
    figureBg: "rgb(237, 231, 220)",
    placeholderBg: "rgb(250, 246, 238)",
    placeholderBorder: "rgb(212, 202, 184)",
    titleFontSize: 24,
    headingFontSize: 22,
    headingLineHeight: 1.6,
    headingLetterSpacing: 0,
    headingMarginTop: 30,
    headingMarginBottom: 15,
    headingPaddingLeft: 10,
    headingBorderLeftWidth: 4,
    subheadingFontSize: 18,
    subheadingLineHeight: 1.8,
    subheadingLetterSpacing: 0,
    subheadingMarginTop: 30,
    subheadingMarginBottom: 15,
    subheadingPaddingLeft: 10,
    subheadingBorderLeftWidth: 4,
    bodyFontSize: 17,
    bodyLineHeight: 2,
    bodyLetterSpacing: 0,
    bodyAlign: "justify",
    bodyPaddingTop: 8,
    bodyPaddingBottom: 8,
    strongColor: "rgb(51, 51, 51)",
    strongWeight: 600,
    unorderedListFontSize: 16,
    unorderedListLineHeight: 1.8,
    unorderedListLetterSpacing: 0,
    unorderedListAlign: "left",
    unorderedListMarkerColor: "rgb(1, 1, 1)",
    unorderedListMarker: "hollow-circle",
    unorderedListIndentLeft: 25,
    unorderedListPaddingTop: 8,
    unorderedListPaddingBottom: 8,
    orderedListFontSize: 16,
    orderedListLineHeight: 1.8,
    orderedListLetterSpacing: 0,
    orderedListAlign: "left",
    orderedListMarkerColor: "rgb(1, 1, 1)",
    orderedListMarkerWeight: 400,
    orderedListMarkerType: "latin-lower",
    orderedListIndentLeft: 25,
    orderedListPaddingTop: 8,
    orderedListPaddingBottom: 8,
    articlePaddingX: 30,
    paragraphSpacing: 18,
    sectionSpacing: 28,
    imageRadius: 8,
    quoteRadius: 10,
    quoteBorderWidth: 4,
    ctaRadius: 999,
    captionAlign: "center",
    ctaTitle: "如果这段文字让你停了一下，欢迎留言告诉我",
    ctaButtonText: "点亮「在看」 · 分享给同样在思考的人",
    coverBottomSpacing: 20,
    inlineImageSpacing: 28,
    quoteSpacing: 18,
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
