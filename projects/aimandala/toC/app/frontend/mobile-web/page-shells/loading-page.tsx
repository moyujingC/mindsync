import { useEffect, useMemo, useState } from "react";

import loadingMeditation from "../assets/loading-meditation.webp";
import logoNiwu from "../assets/logo-niwu.webp";
import brandPattern from "../assets/pattern.webp";
import type { MandalaFlowState } from "../../shared/types";

export interface MobileWebLoadingPageProps {
  state: MandalaFlowState;
  isPro?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

const tips = [
  "木生火，火生土，土生金，金生水，水生木。",
  "内圈代表自我，中圈代表关系，外圈代表环境。",
  "颜色与五行常见映射：绿木、红火、黄土、白金、蓝水。",
  "曼陀罗源自梵语，意为「圆」，象征宇宙的完整。",
  "绘画时的直觉选择，常常最能反映内心真实状态。",
];

const stages = ["准备中...", "识别画面结构...", "AI 分析画面能量...", "构建解读框架...", "润色文字表达...", "解读完成！"];

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

function LoadingBackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.5 6.5L9 12L14.5 17.5" stroke="rgba(232,220,200,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7L17 17" stroke="rgba(232,220,200,0.86)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 7L7 17" stroke="rgba(232,220,200,0.86)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LoadingDoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17L4 12" stroke="#48BB78" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingWaitingIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="rgba(113,128,150,0.5)" strokeWidth="1.8" />
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
      <path d="M9.5 18.5H14.5" stroke="#C87850" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 21H14" stroke="#C87850" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.7 15.3C7.33 14.3 6.5 12.68 6.5 10.92C6.5 7.93 8.96 5.5 12 5.5C15.04 5.5 17.5 7.93 17.5 10.92C17.5 12.68 16.67 14.3 15.3 15.3C14.74 15.71 14.4 16.33 14.4 17V17.5H9.6V17C9.6 16.33 9.26 15.71 8.7 15.3Z" stroke="#C87850" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileWebLoadingPage({
  state,
  isPro = false,
  onBack,
  onClose,
}: MobileWebLoadingPageProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % tips.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const progress = Math.max(
    5,
    Math.min(100, state.status?.generation_progress ?? state.interpretation?.generation_progress ?? 64),
  );

  const currentStageIndex = useMemo(() => {
    if (progress >= 100) return 5;
    if (progress >= 75) return 4;
    if (progress >= 45) return 3;
    if (progress >= 25) return 2;
    if (progress >= 10) return 1;
    return 0;
  }, [progress]);

  const currentMessage =
    state.status?.generation_stage === "report_ready"
      ? "解读完成，即将跳转..."
      : stages[currentStageIndex];
  const versionTitle = isPro ? "Pro 版完整解读" : "Lite 版基础解读";
  const versionDescription = isPro
    ? "Pro 版包含三圈能量分析、失衡诊断与报告内 AI 问答。"
    : "Lite 版先展示核心线索，Pro 版会补上更完整的成因与建议。";
  const estimatedTime = isPro ? "预计约 2 分钟" : "预计约 90 秒";
  const estimatedSeconds = Math.max(0, (isPro ? 120 : 90) - Math.floor((progress / 100) * (isPro ? 120 : 90)));

  return (
    <div className="am-page am-loading-page">
      <div className="am-loading-topbar">
        <button type="button" className="am-icon-button" onClick={onBack} aria-label="返回上传页">
          <LoadingBackIcon />
        </button>
        <div className="am-loading-brand">
          <img src={logoNiwu} alt="一镜一梳" />
          <span>一镜一梳</span>
        </div>
        <button type="button" className="am-icon-button" onClick={onClose} aria-label="关闭">
          <LoadingCloseIcon />
        </button>
      </div>

      <div className="am-loading-body">
        <div className="am-pattern-overlay" style={{ backgroundImage: `url(${brandPattern})` }} />
        <div className="am-ambient-glow am-ambient-glow--right" />
        <div className="am-ambient-glow am-ambient-glow--left" />
        <div className="am-loading-topbar__ornament" aria-hidden="true" />
        <FloatingParticlesSmall />

        <div className="am-loading-visual-ring">
          <div className="am-loading-visual-ring__outer" />
          <img src={loadingMeditation} alt="曼曼冥想中" className="am-loading-video am-loading-video--image" />
        </div>

        <div className="am-loading-copy">
          <div className={`am-loading-version am-loading-version--${isPro ? "pro" : "lite"}`}>
            <LoadingVersionIcon isPro={isPro} />
            <span>{versionTitle}</span>
          </div>
          <h1>正在解读中...</h1>
          <p>{versionDescription}</p>
          <div className="am-loading-copy__eta">{estimatedTime}</div>
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
            {isPro
              ? "Pro版完整解读需要约2分钟，包含三圈能量与失衡诊断"
              : "Lite版基础解读约需90秒，Pro版可查看更完整的成因与调节建议"}
          </div>
        </div>

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
