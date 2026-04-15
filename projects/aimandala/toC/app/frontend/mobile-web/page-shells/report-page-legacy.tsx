import { useMemo, useState } from "react";

import logoNiwu from "../assets/logo-niwu.webp";
import brandPattern from "../assets/pattern.webp";
import {
  getLiteStructuredReport,
  hasProReportAccess,
  resolveSelfUnderstandingReportCta,
} from "../../shared/core";
import type { MandalaFlowState } from "../../shared/types";
import type { MobileWebRouteId } from "../routes";
import type { MobileWebUploadDraft } from "../state";

type LooseStructuredReport = Record<string, unknown>;

type StoryPart = {
  key: string;
  title: string;
  subtitle: string;
  content: string;
};

type AwarenessItem = {
  day: number;
  title: string;
  content: string;
};

type HealingExperiment = {
  title: string;
  content: string;
};

type LegacyReportData = {
  title: string;
  date: string;
  impression: string;
  visualElements?: string;
  emotionPortrait?: string;
  story: StoryPart[];
  themeScene?: string;
  themeImpact?: string;
  themeAwareness?: string;
  awareness: AwarenessItem[];
  proTeaser?: string;
  healingExperiment?: HealingExperiment | null;
};

const DEFAULT_REPORT: LegacyReportData = {
  title: "花芯里的太阳与潮汐",
  date: "2026年4月6日",
  impression:
    "这幅曼陀罗像一朵在暖风中轻轻颤动的花，中心橙红的小太阳带着温暖的召唤力，向外晕开黄绿、粉紫的温柔波纹，最外层的蓝线像轻轻起伏的呼吸，让人感到一种既渴望靠近又想保留空间的张力。",
  visualElements:
    "色彩上，中心暖橙如小太阳，向外晕出黄绿的活泼、粉紫的柔和，最外圈蓝线带着渐变的清凉感。结构是放射对称的，像花朵瓣片有序舒展，中圈的黄绿、粉紫区域色彩浓重，充满生机；外圈蓝线区域相对稀疏，带着冷静的呼吸感。",
  emotionPortrait:
    "整体氛围是温暖中带着一丝小心翼翼的试探，像春天里想绽放又怕风雨的花。内圈是热烈的渴望，中圈是关系里的雀跃与柔软，外圈则像一层轻轻的保护罩。",
  story: [
    {
      key: "base",
      title: "你的底色",
      subtitle: "你是谁？",
      content: "你像画中心的小太阳，内核里带着温暖的真诚，渴望把光和热分享给在意的人。你内心深处渴望被看见的真诚，希望热情能被温柔接住。",
    },
    {
      key: "conflict",
      title: "你的矛盾",
      subtitle: "你的内在冲突",
      content: "当热情靠近时，你又会突然感到清凉的警惕，像摸到一块冰般想后退。两股力量在你心里拉扯：一股想紧紧拥抱，一股想保留角落。",
    },
    {
      key: "pattern",
      title: "你的模式",
      subtitle: "这个冲突如何重复上演？",
      content: "这种拉扯让你常常上演靠近、后退、再靠近的小剧场。你明明很期待关系推进，却又会在临门一脚时突然退回安全位置。",
    },
  ],
  themeScene: "当对方想深度绑定时，你会突然犹豫回避，心里反复确认自己是否真的准备好被看见。",
  themeImpact: "对方容易感受到你的忽冷忽热，而你也会因此怀疑自己的热情是否值得被表达。",
  themeAwareness: "下次想后退时，先停 10 秒问自己：我害怕的是对方的拒绝，还是我自己的热情？",
  awareness: [
    {
      day: 1,
      title: "倾听身体的悄悄话",
      content: "情绪波动时，把注意力轻轻放回身体，找出最先发出紧绷信号的部位，承认它正在提醒你。",
    },
    {
      day: 2,
      title: "给情绪一个名字",
      content: "当拉扯感出现时，把期待、恐惧、委屈这些感受写下来。被命名的情绪，会比被忽略的情绪柔软。",
    },
    {
      day: 3,
      title: "观察你的自动模式",
      content: "留意重要关系里的自动反应：转移话题、刷手机、突然安静。觉察本身，就是改变的开始。",
    },
  ],
  proTeaser:
    "你的画里，还藏着更深的线索：这种模式的童年根源、它在日常生活中的反复表现，以及一份专属于你的 21 天转变方案。",
  healingExperiment: {
    title: "画一朵情绪曼陀罗",
    content:
      "准备一张白纸和喜欢的笔，先在中央画一个小圆，给此刻心里最强烈的情绪一个颜色。然后从中心向外，让线条和颜色自由生长。最后对这幅画说：谢谢你，让我看见自己的害怕和渴望。",
  },
};

function extractSection(content: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    const regex = new RegExp(`#{1,4}\\s*${pattern}[^\\n]*\\n\\n?([\\s\\S]*?)(?=\\n#{1,4}|\\n\\d+\\.|$)`, "i");
    const match = content.match(regex);
    if (match) return match[1].trim();
  }
  return null;
}

function extractStory(markdown: string): StoryPart[] {
  const storyParts = [
    { key: "base", title: "你的底色", subtitle: "你是谁？", patterns: ["【起】.*底色", "你的底色"] },
    { key: "conflict", title: "你的矛盾", subtitle: "你的内在冲突", patterns: ["【承】.*矛盾", "你的矛盾"] },
    { key: "pattern", title: "你的模式", subtitle: "这个冲突如何重复上演？", patterns: ["【转】.*模式", "你的模式"] },
    { key: "defense", title: "你的防御", subtitle: "你用什么保护自己？", patterns: ["【转】.*防御", "你的防御"] },
    { key: "stuck", title: "你的卡点", subtitle: "这一切把你困在哪里？", patterns: ["【合】.*卡点", "你的卡点"] },
    { key: "light", title: "你的光", subtitle: "故事的出口在哪里？", patterns: ["【升】.*光", "你的光"] },
  ];

  return storyParts
    .map((part) => {
      let contentText = "";
      for (const pattern of part.patterns) {
        const regex = new RegExp(`#{1,4}\\s*${pattern}[^\\n]*\\n\\n?([\\s\\S]*?)(?=\\n#{1,4}|\\n\\d+\\.|$)`, "i");
        const match = markdown.match(regex);
        if (match) {
          contentText = match[1].trim();
          break;
        }
      }
      return {
        key: part.key,
        title: part.title,
        subtitle: part.subtitle,
        content: contentText,
      };
    })
    .filter((item) => item.content);
}

function extractAwareness(content: string): AwarenessItem[] {
  const awarenessList: AwarenessItem[] = [];
  const day1Regex = /#{1,4}\s*🌿\s*第一天[:：]([^\n]+)\n\n?([\s\S]*?)(?=\n#{1,4}\s*🌸|$)/i;
  const day2Regex = /#{1,4}\s*🌸\s*第二天[:：]([^\n]+)\n\n?([\s\S]*?)(?=\n#{1,4}\s*✨|$)/i;
  const day3Regex = /#{1,4}\s*✨\s*第三天[:：]([^\n]+)\n\n?([\s\S]*?)(?=\n#{1,4}|$)/i;

  const day1 = content.match(day1Regex);
  const day2 = content.match(day2Regex);
  const day3 = content.match(day3Regex);

  if (day1) awarenessList.push({ day: 1, title: day1[1].trim(), content: day1[2].trim() });
  if (day2) awarenessList.push({ day: 2, title: day2[1].trim(), content: day2[2].trim() });
  if (day3) awarenessList.push({ day: 3, title: day3[1].trim(), content: day3[2].trim() });

  return awarenessList;
}

function extractHealingExperiment(content: string): HealingExperiment | null {
  const regex = /🎨\s*\*\*曼曼的疗愈仪式[:：]([^*]+)\*\*\n\n?([\s\S]*?)(?=\n\n---|$)/i;
  const match = content.match(regex);
  if (!match) return null;
  return {
    title: match[1].trim(),
    content: match[2].trim(),
  };
}

function extractTitle(title: string | null | undefined): string | null {
  if (!title || typeof title !== "string") {
    return null;
  }

  if (title.includes("：")) {
    return title.split("：").slice(1).join("：").trim();
  }

  return title.replace(/一镜[·\s]*/g, "").trim() || null;
}

function parseExperimentText(experiment: unknown): HealingExperiment | null {
  if (typeof experiment !== "string" || !experiment.trim()) {
    return null;
  }

  const titleMatch = experiment.match(/\*\*曼曼的疗愈仪式[：:]([^*]+)\*\*/);
  if (titleMatch) {
    return {
      title: titleMatch[1].trim(),
      content: experiment.replace(/\*\*曼曼的疗愈仪式[：:][^*]+\*\*\n*/, "").trim(),
    };
  }

  return {
    title: "曼曼的疗愈仪式",
    content: experiment.trim(),
  };
}

function getStructuredRecord(state: MandalaFlowState): LooseStructuredReport | null {
  if (!state.report?.structured || typeof state.report.structured !== "object") {
    return null;
  }

  return state.report.structured as LooseStructuredReport;
}

function toStructuredStory(structured: LooseStructuredReport | null): StoryPart[] {
  if (!structured) {
    return [];
  }

  const story = structured.story;
  if (!story || typeof story !== "object") {
    return [];
  }

  const storyRecord = story as Record<string, unknown>;
  const definitions = [
    { key: "base", title: "你的底色", subtitle: "你是谁？", source: "base" },
    { key: "conflict", title: "你的矛盾", subtitle: "你的内在冲突", source: "contradiction" },
    { key: "pattern", title: "你的模式", subtitle: "这个冲突如何重复上演？", source: "pattern" },
    { key: "defense", title: "你的防御", subtitle: "你用什么保护自己？", source: "defense" },
    { key: "stuck", title: "你的卡点", subtitle: "这一切把你困在哪里？", source: "block" },
    { key: "light", title: "你的光", subtitle: "故事的出口在哪里？", source: "light" },
  ];

  return definitions
    .map((definition) => {
      const section = storyRecord[definition.source];
      const content =
        section && typeof section === "object" && typeof (section as Record<string, unknown>).content === "string"
          ? ((section as Record<string, unknown>).content as string).trim()
          : "";

      return {
        key: definition.key,
        title: definition.title,
        subtitle: definition.subtitle,
        content,
      };
    })
    .filter((item) => item.content);
}

function toStructuredAwareness(structured: LooseStructuredReport | null): AwarenessItem[] {
  if (!structured || !Array.isArray(structured.three_awareness)) {
    return [];
  }

  return structured.three_awareness
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const content = typeof record.content === "string" ? record.content.trim() : "";
      const day = typeof record.day === "number" ? record.day : index + 1;

      if (!title || !content) {
        return null;
      }

      return { day, title, content };
    })
    .filter((item): item is AwarenessItem => Boolean(item));
}

function parseLegacyReport(state: MandalaFlowState): LegacyReportData {
  const structured = getLiteStructuredReport(state.report);
  const looseStructured = getStructuredRecord(state);
  const markdown = typeof state.report?.report === "string" ? state.report.report : "";
  const structuredStory = toStructuredStory(looseStructured);
  const structuredAwareness = toStructuredAwareness(looseStructured);
  const themeInsights =
    looseStructured?.theme_insights && typeof looseStructured.theme_insights === "object"
      ? (looseStructured.theme_insights as Record<string, unknown>)
      : null;
  const structuredExperiment = parseExperimentText(looseStructured?.experiment);
  const base = structured
    ? {
        ...DEFAULT_REPORT,
        title: extractTitle(structured.title) || DEFAULT_REPORT.title,
        impression: structured.overall_impression || DEFAULT_REPORT.impression,
        visualElements: structured.visual_elements_rendered || DEFAULT_REPORT.visualElements,
        emotionPortrait: structured.emotion_portrait_rendered || DEFAULT_REPORT.emotionPortrait,
        proTeaser: structured.pro_teaser || DEFAULT_REPORT.proTeaser,
      }
    : { ...DEFAULT_REPORT };

  if (!markdown) {
    return {
      ...base,
      title: extractTitle(state.report?.title) || base.title,
      date: new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
      story: structuredStory.length ? structuredStory : base.story,
      themeScene:
        (typeof themeInsights?.scene === "string" ? themeInsights.scene : null) || base.themeScene,
      themeImpact:
        (typeof themeInsights?.impact === "string" ? themeInsights.impact : null) || base.themeImpact,
      themeAwareness:
        (typeof themeInsights?.awareness === "string" ? themeInsights.awareness : null) || base.themeAwareness,
      awareness: structuredAwareness.length ? structuredAwareness : base.awareness,
      healingExperiment: structuredExperiment || base.healingExperiment,
    };
  }

  return {
    title: extractTitle(state.report?.title) || base.title,
    date: new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
    impression: extractSection(markdown, ["整体印象"]) || base.impression,
    visualElements: extractSection(markdown, ["画面元素分析", "3\\.\\s*画面元素分析"]) || base.visualElements,
    emotionPortrait: extractSection(markdown, ["情绪画像", "4\\.\\s*情绪画像"]) || base.emotionPortrait,
    story: extractStory(markdown).length ? extractStory(markdown) : structuredStory.length ? structuredStory : base.story,
    themeScene:
      extractSection(markdown, ["典型场景"]) ||
      (typeof themeInsights?.scene === "string" ? themeInsights.scene : null) ||
      base.themeScene,
    themeImpact:
      extractSection(markdown, ["具体影响"]) ||
      (typeof themeInsights?.impact === "string" ? themeInsights.impact : null) ||
      base.themeImpact,
    themeAwareness:
      extractSection(markdown, ["觉察点"]) ||
      (typeof themeInsights?.awareness === "string" ? themeInsights.awareness : null) ||
      base.themeAwareness,
    awareness: extractAwareness(markdown).length ? extractAwareness(markdown) : structuredAwareness.length ? structuredAwareness : base.awareness,
    proTeaser: extractSection(markdown, ["给你的一个小预告", "8\\.\\s*给你的一个小预告"]) || base.proTeaser,
    healingExperiment: extractHealingExperiment(markdown) || structuredExperiment || base.healingExperiment,
  };
}

function LegacyIcon({ children }: { children: string }) {
  return <span style={{ fontSize: 16, lineHeight: 1 }}>{children}</span>;
}

function LegacyTopIcon({ path }: { path: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LegacyMandalaPreview({ imagePath, innerRadius = 0.3, middleRadius = 0.68 }: { imagePath?: string | null; innerRadius?: number; middleRadius?: number }) {
  if (!imagePath) return null;

  const outer = 148;
  const middleSize = Math.max(outer * middleRadius, 18);
  const innerSize = Math.max(outer * innerRadius, 12);
  return (
    <div style={{ position: "relative", width: outer, height: outer, marginTop: 14, marginBottom: -24 }}>
      <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: "conic-gradient(from 0deg, rgba(212,160,84,0.26), rgba(200,120,80,0.14), rgba(212,160,84,0.26))", filter: "blur(5px)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", border: "2.5px solid #C8A066", boxShadow: "0 0 20px rgba(200,160,102,0.22), inset 0 0 18px rgba(200,160,102,0.08)" }}>
        <img src={imagePath} alt="当前曼陀罗" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", width: middleSize, height: middleSize, top: "50%", left: "50%", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1.6px solid rgba(255,208,0,0.96)", boxShadow: "0 0 8px rgba(255,208,0,0.55)" }} />
      <div style={{ position: "absolute", width: innerSize, height: innerSize, top: "50%", left: "50%", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1.6px solid rgba(0,255,208,0.96)", boxShadow: "0 0 8px rgba(0,255,208,0.55)" }} />
      <div style={{ position: "absolute", right: -6, bottom: -4, padding: "2px 8px", borderRadius: 999, background: "linear-gradient(135deg, #1E2D4D 0%, #253860 100%)", border: "1px solid rgba(212,160,84,0.3)", fontSize: 10, fontWeight: 500, color: "#D4A054", letterSpacing: "0.05em" }}>当前画作</div>
    </div>
  );
}

export interface MobileWebLegacyReportPageProps {
  route?: MobileWebRouteId;
  state: MandalaFlowState;
  uploadDraft?: MobileWebUploadDraft;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryDisabled?: boolean;
}

export function MobileWebLegacyReportPage({
  state,
  uploadDraft,
  onPrimaryAction,
  onSecondaryAction,
  primaryDisabled = false,
}: MobileWebLegacyReportPageProps) {
  const [saved, setSaved] = useState(false);
  const displayReport = useMemo(() => parseLegacyReport(state), [state]);
  const structured = getLiteStructuredReport(state.report);
  const resultCta = resolveSelfUnderstandingReportCta({
    theme: uploadDraft?.theme,
    canUpgrade: Boolean(state.report?.can_upgrade || state.status?.can_upgrade),
    hasProAccess: hasProReportAccess(state),
    structured,
  });
  const previewImage = uploadDraft?.imagePath ?? state.selectedImage?.imagePath ?? null;
  const innerRadius = state.status?.three_circles?.inner_radius ?? state.interpretation?.three_circles?.inner_radius ?? 0.3;
  const middleRadius = state.status?.three_circles?.middle_radius ?? state.interpretation?.three_circles?.middle_radius ?? 0.68;
  const isUpgrade = state.report?.version === "pro" || state.step === "proReady";
  const primaryCtaDisabled = primaryDisabled || isUpgrade;

  if (state.step === "error" && state.lastError) {
    return (
      <div style={{ minHeight: "100%", backgroundColor: "#F5EFE2", fontFamily: "'Noto Sans SC', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360, borderRadius: 20, padding: 24, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(195,91,86,0.18)", boxShadow: "0 12px 30px rgba(26,40,68,0.08)", textAlign: "center" }}>
          <div style={{ fontSize: 28, lineHeight: 1, color: "#C25B56", marginBottom: 12 }}>!</div>
          <h2 style={{ margin: 0, fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "#4A3D30" }}>报告暂时没有顺利打开</h2>
          <p style={{ margin: "12px 0 20px", fontSize: 14, color: "#7A6A5A", lineHeight: 1.8 }}>{state.lastError}</p>
          <button type="button" onClick={onSecondaryAction} style={{ width: "100%", minHeight: 46, borderRadius: 12, border: 0, background: "linear-gradient(135deg, #9B4030 0%, #C87850 50%, #D4A054 100%)", color: "#F5EFE2", fontSize: 14 }}>返回上传页</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#F5EFE2", fontFamily: "'Noto Sans SC', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)", borderBottom: "1px solid rgba(212,160,84,0.15)" }}>
        <button type="button" onClick={onSecondaryAction} style={{ padding: 4, background: "transparent", border: 0, color: "rgba(232,220,200,0.5)" }}>
          <LegacyTopIcon path="M14.5 6.5L9 12L14.5 17.5" />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={logoNiwu} alt="一镜一梳" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, letterSpacing: "0.12em", color: "#D4A054" }}>Lite版基础解读</span>
        </div>
        <button type="button" style={{ padding: 4, background: "transparent", border: 0, color: "rgba(232,220,200,0.5)" }}>
          <LegacyTopIcon path="M15 8.5A3.5 3.5 0 1 1 8.8 10.7L4.5 13.2M15.2 13.3L19.5 10.8M13.5 15.3L16.8 17.2" />
        </button>
      </div>

      <div style={{ background: "linear-gradient(180deg, #1A2844 0%, #1E2D4D 50%, #223358 80%, #2A3D65 100%)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${brandPattern})`, backgroundSize: 300, backgroundRepeat: "repeat", opacity: 0.02 }} />
        <div style={{ position: "relative", padding: "32px 24px 0" }}>
          <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 200, height: 150, background: "radial-gradient(ellipse, rgba(212,160,84,0.1) 0%, transparent 60%)", borderRadius: "50%" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <h1 style={{ margin: 0, textAlign: "center", fontFamily: "'Noto Serif SC', serif", fontSize: 22, fontWeight: 600, color: "#E8DCC8", letterSpacing: "0.15em", lineHeight: 1.4 }}>{displayReport.title}</h1>
            <span style={{ marginTop: 8, fontSize: 12, color: "rgba(232,220,200,0.5)", letterSpacing: "0.1em" }}>{displayReport.date}</span>
            <LegacyMandalaPreview imagePath={previewImage} innerRadius={innerRadius} middleRadius={middleRadius} />
          </div>
        </div>
      </div>

      <div style={{ position: "relative", marginTop: -4, padding: "0 20px 24px", background: "linear-gradient(180deg, #F5EFE2 0%, #FAF8F5 100%)", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, background: "radial-gradient(circle at 20% 20%, rgba(158,170,155,0.3), transparent 30%)" }} />

        <div style={{ paddingTop: 24, display: "grid", gap: 18, position: "relative" }}>
          <div style={{ borderRadius: 18, padding: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(245,239,226,0.8) 100%)", border: "1px solid rgba(138,124,108,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 4, height: 20, borderRadius: 999, background: "linear-gradient(180deg, #9EAA9B, #9EAA9B88)" }} />
              <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#4A3D30", letterSpacing: "0.08em" }}>整体印象</span>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "#5E5046", lineHeight: 1.9 }}>{displayReport.impression}</p>
          </div>

          {displayReport.visualElements ? (
            <div style={{ borderRadius: 18, padding: 20, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(138,124,108,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 20, borderRadius: 999, background: "linear-gradient(180deg, #7A8EA8, #7A8EA888)" }} />
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#4A3D30" }}>画面元素分析</span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "#5E5046", lineHeight: 1.9 }}>{displayReport.visualElements}</p>
            </div>
          ) : null}

          {displayReport.emotionPortrait ? (
            <div style={{ borderRadius: 18, padding: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(245,239,226,0.9) 100%)", border: "1px solid rgba(200,120,80,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 20, borderRadius: 999, background: "linear-gradient(180deg, #C87850, #D4A054)" }} />
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#4A3D30" }}>情绪画像</span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "#5E5046", lineHeight: 1.9 }}>{displayReport.emotionPortrait}</p>
            </div>
          ) : null}

          {displayReport.story.length > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LegacyIcon>✦</LegacyIcon>
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#4A3D30" }}>你的心灵画像故事</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(200,120,80,0.2) 0%, transparent 100%)" }} />
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {displayReport.story.map((part) => (
                  <div key={part.key} style={{ borderRadius: 18, padding: 20, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(138,124,108,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#C87850" }}>{part.title}</span>
                      <span style={{ fontSize: 12, color: "#8A7C6C" }}>{part.subtitle}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: "#5E5046", lineHeight: 1.9 }}>{part.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {(displayReport.themeScene || displayReport.themeImpact || displayReport.themeAwareness) ? (
            <div style={{ borderRadius: 18, padding: 20, background: "rgba(250,248,245,0.9)", border: "1px solid rgba(138,124,108,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 4, height: 20, borderRadius: 999, background: "linear-gradient(180deg, #9B7CB6, #9B7CB688)" }} />
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#4A3D30" }}>具体表现</span>
              </div>
              {displayReport.themeScene ? <div style={{ marginBottom: 14 }}><p style={{ margin: "0 0 4px", fontSize: 13, color: "#8A7C6C" }}>典型场景</p><p style={{ margin: 0, fontSize: 14, color: "#5E5046", lineHeight: 1.8 }}>{displayReport.themeScene}</p></div> : null}
              {displayReport.themeImpact ? <div style={{ marginBottom: 14 }}><p style={{ margin: "0 0 4px", fontSize: 13, color: "#8A7C6C" }}>具体影响</p><p style={{ margin: 0, fontSize: 14, color: "#5E5046", lineHeight: 1.8 }}>{displayReport.themeImpact}</p></div> : null}
              {displayReport.themeAwareness ? <div><p style={{ margin: "0 0 4px", fontSize: 13, color: "#8A7C6C" }}>觉察点</p><p style={{ margin: 0, fontSize: 14, color: "#5E5046", lineHeight: 1.8 }}>{displayReport.themeAwareness}</p></div> : null}
            </div>
          ) : null}

          {displayReport.awareness.length > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 20, borderRadius: 999, background: "linear-gradient(180deg, #5A9B6E, #5A9B6E88)" }} />
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#4A3D30" }}>三个日常小觉察</span>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {displayReport.awareness.map((item) => (
                  <div key={item.day} style={{ borderRadius: 14, padding: 16, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(90,155,110,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>{item.day === 1 ? "🌿" : item.day === 2 ? "🌸" : "✨"}</span>
                      <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, fontWeight: 600, color: "#5A9B6E" }}>第{item.day}天：{item.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#5E5046", lineHeight: 1.8 }}>{item.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {displayReport.proTeaser ? (
            <div style={{ borderRadius: 18, padding: 20, background: "linear-gradient(135deg, rgba(212,160,84,0.1) 0%, rgba(200,120,80,0.05) 100%)", border: "1px solid rgba(212,160,84,0.2)" }}>
              <p style={{ margin: "0 0 8px", fontFamily: "'Noto Serif SC', serif", fontSize: 14, fontWeight: 600, color: "#C87850" }}>给你的一个小预告</p>
              <p style={{ margin: 0, fontSize: 13, color: "#5E5046", lineHeight: 1.8 }}>{displayReport.proTeaser}</p>
            </div>
          ) : null}

          {displayReport.healingExperiment ? (
            <div style={{ borderRadius: 18, padding: 20, background: "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #223358 100%)", border: "1px solid rgba(212,160,84,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <LegacyIcon>🎨</LegacyIcon>
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#E8DCC8" }}>曼曼的疗愈仪式：{displayReport.healingExperiment.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(232,220,200,0.9)", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{displayReport.healingExperiment.content}</p>
            </div>
          ) : null}

          <div style={{ borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, #1A2844 0%, #1E2D4D 40%, #253860 100%)", border: "1px solid rgba(212,160,84,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${brandPattern})`, backgroundSize: 250, backgroundRepeat: "repeat", opacity: 0.03 }} />
            <div style={{ position: "relative", padding: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, color: "#E8DCC8", letterSpacing: "0.1em", lineHeight: 1.6 }}>{resultCta.legacyCardTitle}</span>
              </div>
              <div style={{ display: "grid", gap: 10, marginBottom: 18, fontSize: 13, color: "rgba(232,220,200,0.85)", lineHeight: 1.7 }}>
                {resultCta.legacyBulletPoints.map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: "#D4A054", minWidth: 20 }}>✦</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={onPrimaryAction} disabled={primaryCtaDisabled} style={{ width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid rgba(212,160,84,0.4)", background: primaryCtaDisabled ? "rgba(232,220,200,0.08)" : "linear-gradient(135deg, rgba(212,160,84,0.25) 0%, rgba(200,120,80,0.2) 100%)", color: primaryCtaDisabled ? "rgba(232,220,200,0.45)" : "#E8DCC8", fontSize: 14, letterSpacing: "0.05em", cursor: primaryCtaDisabled ? "default" : "pointer" }}>
                {isUpgrade ? "当前正在查看 Pro 版解读" : resultCta.primaryLabel}
              </button>
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(212,160,84,0.6)", letterSpacing: "0.03em" }}>{resultCta.legacyCaption}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 1800);
              }}
              style={{ width: "100%", minHeight: 50, borderRadius: 12, border: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #9B4030 0%, #C87850 50%, #D4A054 100%)", color: "#F5EFE2", fontSize: 15, boxShadow: "0 4px 15px rgba(155,64,48,0.3)" }}
            >
              <LegacyIcon>{saved ? "✓" : "↓"}</LegacyIcon>
              <span>{saved ? "已保存到相册" : "保存报告"}</span>
            </button>
            <button type="button" onClick={onSecondaryAction} style={{ width: "100%", minHeight: 46, borderRadius: 12, border: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(138,124,108,0.1)", color: "#8A7C6C", fontSize: 14 }}>
              <LegacyIcon>↻</LegacyIcon>
              <span>再画一幅</span>
            </button>
          </div>

          <div style={{ borderRadius: 12, padding: 16, background: "rgba(90,123,155,0.08)", border: "1px solid rgba(90,123,155,0.15)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <LegacyIcon>i</LegacyIcon>
              <p style={{ margin: 0, fontSize: 12, color: "#5A7B9B", lineHeight: 1.7 }}>本解读基于AI分析，仅供参考。如遇心理困扰，建议寻求专业心理咨询师帮助。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
