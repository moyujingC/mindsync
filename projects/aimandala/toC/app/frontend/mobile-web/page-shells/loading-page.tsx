import { useEffect, useMemo, useState } from "react";

import loadingMeditationVideo from "../assets/3.2 耐心等候（冥想）.mp4";
import loadingMeditationPoster from "../assets/loading-meditation.webp";
import brandPattern from "../assets/pattern.webp";
import { SharedAppTopBar } from "../../shared/ui/app-top-bar";
import type { MandalaFlowState } from "../../shared/types";

export interface MobileWebLoadingPageProps {
  state: MandalaFlowState;
  isPro?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onLeaveLater?: () => void;
}

const tips = [
  "木生火，火生土，土生金，金生水，水生木。",
  "内圈代表自我，中圈代表关系，外圈代表环境。",
  "颜色与五行常见映射：绿木、红火、黄土、白金、蓝水。",
  "曼陀罗源自梵语，意为「圆」，象征宇宙的完整。",
  "绘画时的直觉选择，常常最能反映内心真实状态。",
];

const liteStages = [
  "接收画作与议题...",
  "识别画面结构...",
  "提炼主要视觉线索...",
  "连接议题知识库...",
  "润色文字表达...",
  "解读完成！",
];

const proStages = [
  "接收画作与议题...",
  "识别画面结构...",
  "生成 Lite 基础线索...",
  "展开 Pro 深度分析...",
  "整理完整解读与问答上下文...",
  "解读完成！",
];

interface LoadingUiState {
  stages: string[];
  progress: number;
  currentStageIndex: number;
  currentMessage: string;
  estimatedTime: string;
  versionDescription: string;
  speedNote: string;
}

function hasReadyReport(state: MandalaFlowState, isPro: boolean): boolean {
  const reportText =
    typeof state.report?.report === "string" ? state.report.report.trim() : "";

  if (isPro) {
    return state.report?.version === "pro" && reportText.length > 0;
  }

  return (
    state.step === "liteReady" ||
    state.status?.report_ready === true ||
    (state.report?.version === "lite" && reportText.length > 0)
  );
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function resolveLoadingUiState(
  state: MandalaFlowState,
  isPro: boolean,
): LoadingUiState {
  const stages = isPro ? proStages : liteStages;
  const generationStage =
    state.status?.generation_stage ?? state.interpretation?.generation_stage ?? null;
  const rawProgress =
    state.status?.generation_progress ?? state.interpretation?.generation_progress ?? null;
  const detectionReady = Boolean(state.detection);
  const ready = hasReadyReport(state, isPro);

  if (ready) {
    return {
      stages,
      progress: 100,
      currentStageIndex: stages.length - 1,
      currentMessage: "解读完成，即将跳转...",
      estimatedTime: isPro ? "预计约 2 分钟" : "预计约 60-90 秒",
      versionDescription: isPro
        ? "Pro 版包含三圈能量分析、失衡诊断与报告内 AI 问答。"
        : "Lite 版会先整理核心线索与总体印象。",
      speedNote: isPro
        ? "Pro 版会在 Lite 基础上继续生成三圈能量、失衡诊断与问答上下文"
        : "Lite 版先呈现关键线索与总体印象，帮助你快速进入这次解读",
    };
  }

  if (isPro) {
    if (state.step === "proReady") {
      return {
        stages,
        progress: 82,
        currentStageIndex: 4,
        currentMessage: "正在整理 Pro 完整解读与问答上下文...",
        estimatedTime: "预计约 2 分钟",
        versionDescription: "Pro 版包含三圈能量分析、失衡诊断与报告内 AI 问答。",
        speedNote: "Lite 核心结果已经完成，当前正在补充更深层的能量结构与解释。",
      };
    }

    if (state.step === "liteReady") {
      return {
        stages,
        progress: 64,
        currentStageIndex: 3,
        currentMessage: "Lite 已完成，正在进入 Pro 深度分析...",
        estimatedTime: "预计约 2 分钟",
        versionDescription: "Pro 版包含三圈能量分析、失衡诊断与报告内 AI 问答。",
        speedNote: "基础线索已经准备好，接下来会展开更完整的深层解读。",
      };
    }

    if (generationStage === "generating" || state.step === "liteGenerating") {
      return {
        stages,
        progress: clampProgress(rawProgress == null ? 42 : Math.max(36, Math.min(58, rawProgress))),
        currentStageIndex: 2,
        currentMessage: "正在生成基础线索，随后展开 Pro 深度分析...",
        estimatedTime: "预计约 2 分钟",
        versionDescription: "Pro 版包含三圈能量分析、失衡诊断与报告内 AI 问答。",
        speedNote: "深度版会先完成基础骨架，再继续生成更深入的结构判断。",
      };
    }

    if (generationStage === "detecting" || detectionReady) {
      return {
        stages,
        progress: 18,
        currentStageIndex: 1,
        currentMessage: "识别画面结构与三圈能量...",
        estimatedTime: "预计约 2 分钟",
        versionDescription: "Pro 版包含三圈能量分析、失衡诊断与报告内 AI 问答。",
        speedNote: "正在确认三圈结构，为后续深度解读建立基础。",
      };
    }

    return {
      stages,
      progress: 8,
      currentStageIndex: 0,
      currentMessage: "准备解读任务...",
      estimatedTime: "预计约 2 分钟",
      versionDescription: "Pro 版包含三圈能量分析、失衡诊断与报告内 AI 问答。",
      speedNote: "正在接收画作与议题信息。",
    };
  }

  if (generationStage === "generating" || state.step === "liteGenerating") {
    const progress = clampProgress(rawProgress == null ? 38 : Math.max(28, Math.min(92, rawProgress)));
    if (progress >= 70) {
      return {
        stages,
        progress,
        currentStageIndex: 4,
        currentMessage: "润色文字表达...",
        estimatedTime: "预计约 60-90 秒",
        versionDescription: "Lite 版会先整理核心线索与总体印象。",
        speedNote: "核心结构已经完成，正在把线索整理成可阅读的报告文本。",
      };
    }

    if (progress >= 50) {
      return {
        stages,
        progress,
        currentStageIndex: 3,
        currentMessage: "连接议题知识库...",
        estimatedTime: "预计约 60-90 秒",
        versionDescription: "Lite 版会先整理核心线索与总体印象。",
        speedNote: "正在把画面信息与你选择的解读议题连接起来。",
      };
    }

    return {
      stages,
      progress,
      currentStageIndex: 2,
      currentMessage: "提炼主要视觉线索...",
      estimatedTime: "预计约 60-90 秒",
      versionDescription: "Lite 版会先整理核心线索与总体印象。",
      speedNote: "系统正在总结这幅画最关键的视觉与情绪线索。",
    };
  }

  if (generationStage === "detecting" || detectionReady) {
    return {
      stages,
      progress: 18,
      currentStageIndex: 1,
      currentMessage: "识别画面结构与三圈能量...",
      estimatedTime: "预计约 60-90 秒",
      versionDescription: "Lite 版会先整理核心线索与总体印象。",
      speedNote: "正在确认三圈结构，为后续解读建立基础。",
    };
  }

  return {
    stages,
    progress: 8,
    currentStageIndex: 0,
    currentMessage: "准备解读任务...",
    estimatedTime: "预计约 60-90 秒",
    versionDescription: "Lite 版会先整理核心线索与总体印象。",
    speedNote: "正在接收画作与议题信息。",
  };
}

function FloatingParticlesSmall() {
  const particles = [
    { left: "14%", top: "14%", size: 3, delay: "0s", duration: "7s" },
    { left: "82%", top: "12%", size: 2, delay: "1.5s", duration: "6.2s" },
    { left: "76%", top: "54%", size: 3, delay: "0.8s", duration: "8s" },
    { left: "22%", top: "50%", size: 2, delay: "2.3s", duration: "7.4s" },
    { left: "56%", top: "32%", size: 2.5, delay: "1.1s", duration: "6.8s" },
  ];

  return (
    <>
      {particles.map((particle, index) => (
        <span
          key={index}
          className="am-floating-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </>
  );
}

function LoadingCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LoadingDoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingWaitingIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LoadingVersionIcon({ isPro }: { isPro: boolean }) {
  if (isPro) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3.5L14.4 8.36L19.77 9.14L15.88 12.94L16.8 18.29L12 15.77L7.2 18.29L8.12 12.94L4.23 9.14L9.6 8.36L12 3.5Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 18.5H14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 21H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.7 15.3C7.33 14.3 6.5 12.68 6.5 10.92C6.5 7.93 8.96 5.5 12 5.5C15.04 5.5 17.5 7.93 17.5 10.92C17.5 12.68 16.67 14.3 15.3 15.3C14.74 15.71 14.4 16.33 14.4 17V17.5H9.6V17C9.6 16.33 9.26 15.71 8.7 15.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingTipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 18.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 21H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.7 15.3C7.33 14.3 6.5 12.68 6.5 10.92C6.5 7.93 8.96 5.5 12 5.5C15.04 5.5 17.5 7.93 17.5 10.92C17.5 12.68 16.67 14.3 15.3 15.3C14.74 15.71 14.4 16.33 14.4 17V17.5H9.6V17C9.6 16.33 9.26 15.71 8.7 15.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileWebLoadingPage({
  state,
  isPro = false,
  onBack,
  onClose,
  onLeaveLater,
}: MobileWebLoadingPageProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const loadingPatternStyle = {
    ["--am-pattern-image" as string]: `url(${brandPattern})`,
  } as React.CSSProperties;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % tips.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const loadingUi = useMemo(() => resolveLoadingUiState(state, isPro), [state, isPro]);
  const { currentMessage, currentStageIndex, progress, stages, speedNote } = loadingUi;
  const versionTitle = isPro ? "Pro 版完整解读" : "Lite 版基础解读";
  const showLeaveLater = false;
  const estimatedSeconds = Math.max(
    0,
    (isPro ? 120 : 90) - Math.floor((progress / 100) * (isPro ? 120 : 90)),
  );

  return (
    <div className="am-page am-loading-page">
      <SharedAppTopBar
        title="一镜一梳"
        backLabel="返回上传页"
        onBack={onBack}
        trailing={(
          <button type="button" className="am-icon-button" onClick={onClose} aria-label="关闭">
            <LoadingCloseIcon />
          </button>
        )}
      />

      <div className="am-loading-body" style={loadingPatternStyle}>
        <div className="am-pattern-overlay am-loading-surface-pattern" />
        <div className="am-ambient-glow am-ambient-glow--right" />
        <div className="am-ambient-glow am-ambient-glow--left" />
        <div className="am-loading-topbar__ornament" aria-hidden="true" />
        <FloatingParticlesSmall />

        <div className="am-loading-visual-ring">
          <div className="am-loading-visual-ring__outer" />
          <video
            className="am-loading-video am-loading-video--media"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={loadingMeditationPoster}
            aria-label="曼曼冥想中"
          >
            <source src={loadingMeditationVideo} type="video/mp4" />
          </video>
        </div>

        <div className="am-loading-copy">
          <div className={`am-loading-version am-loading-version--${isPro ? "pro" : "lite"}`}>
            <LoadingVersionIcon isPro={isPro} />
            <span>{versionTitle}</span>
          </div>
          <h1>正在解读中...</h1>
        </div>

        <div className="am-loading-progress-card">
          <div className="am-loading-progress-value">
            <span>{Math.round(progress)}</span>
            <small>%</small>
          </div>
          <div className="am-loading-progress-track">
            <div className="am-loading-progress-fill" style={{ width: `${progress}%` }} />
            <div className="am-loading-progress-shimmer" style={{ left: `calc(${Math.max(0, Math.min(progress, 100))}% - 20px)` }} />
          </div>
          <div className="am-loading-progress-text">{currentMessage}</div>
          {progress < 100 && estimatedSeconds > 0 ? (
            <div className="am-loading-progress-note">预计还需约 {Math.ceil(estimatedSeconds / 10) * 10} 秒</div>
          ) : (
            <div className="am-loading-progress-note">即将完成，请稍候</div>
          )}
          <div className={`am-loading-speed-note am-loading-speed-note--${isPro ? "pro" : "lite"}`}>
            {speedNote}
          </div>
        </div>

        {showLeaveLater ? (
          <div className="am-loading-action-card">
            <div className="am-loading-action-card__copy">
              <strong>不用一直停留在这里</strong>
              <p>当前版本会在本页同步等待报告返回。你也可以先返回上传页调整输入后重新生成。</p>
            </div>
            <button
              type="button"
              className="am-loading-action-button"
              onClick={onLeaveLater}
            >
              返回上传页
            </button>
          </div>
        ) : null}

        <div className="am-loading-log-card">
          <div className="am-loading-log-title">正在分析：</div>
          <div className="am-loading-log-list">
            {stages.map((item, index) => {
              const status = index < currentStageIndex ? "done" : index === currentStageIndex ? "active" : "waiting";
              return (
                <div key={item} className={`am-loading-log-item is-${status}`}>
                  <span className="am-loading-log-dot" aria-hidden="true">
                    {status === "done" ? <LoadingDoneIcon /> : status === "waiting" ? <LoadingWaitingIcon /> : <span className="am-loading-log-dot__pulse" />}
                  </span>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </div>

        {state.lastError ? (
          <div className="am-loading-error-card" role="alert">
            <div className="am-loading-error-card__title">解读出现异常</div>
            <p>{state.lastError}</p>
          </div>
        ) : null}

        <div className="am-loading-tip-card">
          <div className="am-loading-tip-head">
            <LoadingTipIcon />
            <div className="am-loading-tip-title">五行小知识</div>
          </div>
          <p>{tips[tipIndex]}</p>
          <div className="am-loading-tip-dots">
            {tips.map((_, index) => (
              <span key={index} className={index === tipIndex ? "is-active" : ""} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
