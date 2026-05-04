import { useMemo, useState } from "react";

import logoNiwu from "../assets/logo-niwu.webp";
import brandPattern from "../assets/pattern.webp";
import {
  hasProReportAccess,
  resolveSelfUnderstandingReportCta,
} from "../../shared/core";
import type { MandalaFlowState } from "../../shared/types";
import type { MobileWebRouteId } from "../routes";
import type { MobileWebUploadDraft } from "../state";
import type { CSSProperties } from "react";

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
  const looseStructured = getStructuredRecord(state);
  const markdown = typeof state.report?.report === "string" ? state.report.report : "";
  const structuredStory = toStructuredStory(looseStructured);
  const structuredAwareness = toStructuredAwareness(looseStructured);
  const themeInsights =
    looseStructured?.theme_insights && typeof looseStructured.theme_insights === "object"
      ? (looseStructured.theme_insights as Record<string, unknown>)
      : null;
  const structuredExperiment = parseExperimentText(looseStructured?.experiment);
  const base = { ...DEFAULT_REPORT };

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
  return <span className="am-legacy-report-inline-icon">{children}</span>;
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
  const previewStyle = {
    "--am-legacy-preview-size": `${outer}px`,
    "--am-legacy-middle-size": `${middleSize}px`,
    "--am-legacy-inner-size": `${innerSize}px`,
  } as CSSProperties;

  return (
    <div className="am-legacy-mandala-preview" style={previewStyle}>
      <div className="am-legacy-mandala-preview__glow" />
      <div className="am-legacy-mandala-preview__image-wrap">
        <img src={imagePath} alt="当前曼陀罗" className="am-legacy-mandala-preview__image" />
      </div>
      <div className="am-legacy-mandala-preview__ring am-legacy-mandala-preview__ring--middle" />
      <div className="am-legacy-mandala-preview__ring am-legacy-mandala-preview__ring--inner" />
      <div className="am-legacy-mandala-preview__badge">当前画作</div>
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
  const structured = null;
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
  const patternStyle = {
    "--am-legacy-pattern-image": `url(${brandPattern})`,
  } as CSSProperties;

  if (state.step === "error" && state.lastError) {
    return (
      <div className="am-legacy-report-error">
        <div className="am-legacy-report-error__card">
          <div className="am-legacy-report-error__mark">!</div>
          <h2 className="am-legacy-report-error__title">报告暂时没有顺利打开</h2>
          <p className="am-legacy-report-error__message">{state.lastError}</p>
          <button type="button" onClick={onSecondaryAction} className="am-legacy-report-button am-legacy-report-button--error">返回上传页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="am-legacy-report-page" style={patternStyle}>
      <div className="am-legacy-report-topbar">
        <button type="button" onClick={onSecondaryAction} className="am-legacy-report-icon-button">
          <LegacyTopIcon path="M14.5 6.5L9 12L14.5 17.5" />
        </button>
        <div className="am-legacy-report-brand">
          <img src={logoNiwu} alt="一镜一梳" className="am-legacy-report-brand__logo" />
          <span className="am-legacy-report-brand__label">Lite版基础解读</span>
        </div>
        <button type="button" className="am-legacy-report-icon-button">
          <LegacyTopIcon path="M15 8.5A3.5 3.5 0 1 1 8.8 10.7L4.5 13.2M15.2 13.3L19.5 10.8M13.5 15.3L16.8 17.2" />
        </button>
      </div>

      <div className="am-legacy-report-hero">
        <div className="am-legacy-report-pattern" />
        <div className="am-legacy-report-hero__inner">
          <div className="am-legacy-report-hero__glow" />
          <div className="am-legacy-report-hero__content">
            <h1 className="am-legacy-report-title">{displayReport.title}</h1>
            <span className="am-legacy-report-date">{displayReport.date}</span>
            <LegacyMandalaPreview imagePath={previewImage} innerRadius={innerRadius} middleRadius={middleRadius} />
          </div>
        </div>
      </div>

      <div className="am-legacy-report-body">
        <div className="am-legacy-report-body__texture" />

        <div className="am-legacy-report-stack">
          <div className="am-legacy-report-card am-legacy-report-card--impression">
            <div className="am-legacy-report-heading">
              <div className="am-legacy-report-accent" />
              <span className="am-legacy-report-heading__title am-legacy-report-heading__title--tracked">整体印象</span>
            </div>
            <p className="am-legacy-report-body-text">{displayReport.impression}</p>
          </div>

          {displayReport.visualElements ? (
            <div className="am-legacy-report-card">
              <div className="am-legacy-report-heading">
                <div className="am-legacy-report-accent am-legacy-report-accent--visual" />
                <span className="am-legacy-report-heading__title">画面元素分析</span>
              </div>
              <p className="am-legacy-report-body-text">{displayReport.visualElements}</p>
            </div>
          ) : null}

          {displayReport.emotionPortrait ? (
            <div className="am-legacy-report-card am-legacy-report-card--emotion">
              <div className="am-legacy-report-heading">
                <div className="am-legacy-report-accent am-legacy-report-accent--emotion" />
                <span className="am-legacy-report-heading__title">情绪画像</span>
              </div>
              <p className="am-legacy-report-body-text">{displayReport.emotionPortrait}</p>
            </div>
          ) : null}

          {displayReport.story.length > 0 ? (
            <>
              <div className="am-legacy-report-story-heading">
                <LegacyIcon>✦</LegacyIcon>
                <span className="am-legacy-report-heading__title">你的心灵画像故事</span>
                <div className="am-legacy-report-story-rule" />
              </div>
              <div className="am-legacy-report-story-list">
                {displayReport.story.map((part) => (
                  <div key={part.key} className="am-legacy-report-story-card">
                    <div className="am-legacy-report-story-card__head">
                      <span className="am-legacy-report-story-card__title">{part.title}</span>
                      <span className="am-legacy-report-story-card__subtitle">{part.subtitle}</span>
                    </div>
                    <p className="am-legacy-report-body-text">{part.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {(displayReport.themeScene || displayReport.themeImpact || displayReport.themeAwareness) ? (
            <div className="am-legacy-report-card am-legacy-report-card--theme">
              <div className="am-legacy-report-heading am-legacy-report-heading--theme">
                <div className="am-legacy-report-accent am-legacy-report-accent--theme" />
                <span className="am-legacy-report-heading__title">具体表现</span>
              </div>
              {displayReport.themeScene ? <div className="am-legacy-report-theme-item"><p className="am-legacy-report-theme-item__label">典型场景</p><p className="am-legacy-report-body-text am-legacy-report-body-text--compact">{displayReport.themeScene}</p></div> : null}
              {displayReport.themeImpact ? <div className="am-legacy-report-theme-item"><p className="am-legacy-report-theme-item__label">具体影响</p><p className="am-legacy-report-body-text am-legacy-report-body-text--compact">{displayReport.themeImpact}</p></div> : null}
              {displayReport.themeAwareness ? <div className="am-legacy-report-theme-item"><p className="am-legacy-report-theme-item__label">觉察点</p><p className="am-legacy-report-body-text am-legacy-report-body-text--compact">{displayReport.themeAwareness}</p></div> : null}
            </div>
          ) : null}

          {displayReport.awareness.length > 0 ? (
            <>
              <div className="am-legacy-report-story-heading">
                <div className="am-legacy-report-accent am-legacy-report-accent--awareness" />
                <span className="am-legacy-report-heading__title">三个日常小觉察</span>
              </div>
              <div className="am-legacy-report-awareness-list">
                {displayReport.awareness.map((item) => (
                  <div key={item.day} className="am-legacy-report-awareness-card">
                    <div className="am-legacy-report-awareness-card__head">
                      <span className="am-legacy-report-awareness-card__icon">{item.day === 1 ? "🌿" : item.day === 2 ? "🌸" : "✨"}</span>
                      <span className="am-legacy-report-awareness-card__title">第{item.day}天：{item.title}</span>
                    </div>
                    <p className="am-legacy-report-body-text am-legacy-report-body-text--compact">{item.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {displayReport.proTeaser ? (
            <div className="am-legacy-report-card am-legacy-report-card--teaser">
              <p className="am-legacy-report-teaser__title">给你的一个小预告</p>
              <p className="am-legacy-report-body-text am-legacy-report-body-text--compact">{displayReport.proTeaser}</p>
            </div>
          ) : null}

          {displayReport.healingExperiment ? (
            <div className="am-legacy-report-card am-legacy-report-card--ritual">
              <div className="am-legacy-report-heading">
                <LegacyIcon>🎨</LegacyIcon>
                <span className="am-legacy-report-heading__title am-legacy-report-heading__title--ritual">曼曼的疗愈仪式：{displayReport.healingExperiment.title}</span>
              </div>
              <p className="am-legacy-report-body-text am-legacy-report-body-text--ritual">{displayReport.healingExperiment.content}</p>
            </div>
          ) : null}

          <div className="am-legacy-report-cta-card">
            <div className="am-legacy-report-pattern am-legacy-report-pattern--cta" />
            <div className="am-legacy-report-cta-card__inner">
              <div className="am-legacy-report-cta-card__title-wrap">
                <span className="am-legacy-report-cta-card__title">{resultCta.legacyCardTitle}</span>
              </div>
              <div className="am-legacy-report-cta-card__bullets">
                {resultCta.legacyBulletPoints.map((item) => (
                  <div key={item} className="am-legacy-report-cta-card__bullet">
                    <span className="am-legacy-report-cta-card__bullet-icon">✦</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={onPrimaryAction}
                disabled={primaryCtaDisabled}
                className={`am-legacy-report-button am-legacy-report-button--cta${primaryCtaDisabled ? " is-disabled" : ""}${isUpgrade ? " is-upgrade" : ""}`}
              >
                {isUpgrade ? "当前正在查看 Pro 版解读" : resultCta.primaryLabel}
              </button>
              <div className="am-legacy-report-cta-card__caption">
                <span>{resultCta.legacyCaption}</span>
              </div>
            </div>
          </div>

          <div className="am-legacy-report-bottom-actions">
            <button
              type="button"
              onClick={() => {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 1800);
              }}
              className={`am-legacy-report-button am-legacy-report-button--save${saved ? " is-saved" : ""}`}
            >
              <LegacyIcon>{saved ? "✓" : "↓"}</LegacyIcon>
              <span>{saved ? "已保存到相册" : "保存报告"}</span>
            </button>
            <button type="button" onClick={onSecondaryAction} className="am-legacy-report-button am-legacy-report-button--secondary">
              <LegacyIcon>↻</LegacyIcon>
              <span>再画一幅</span>
            </button>
          </div>

          <div className="am-legacy-report-card am-legacy-report-card--disclaimer">
            <div className="am-legacy-report-disclaimer">
              <LegacyIcon>i</LegacyIcon>
              <p className="am-legacy-report-disclaimer__text">本解读基于AI分析，仅供参考。如遇心理困扰，建议寻求专业心理咨询师帮助。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
