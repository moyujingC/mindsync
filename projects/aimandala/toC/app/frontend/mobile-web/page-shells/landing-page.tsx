import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import logoNiwu from "../assets/logo-niwu.webp";
import brandPattern from "../assets/pattern.webp";

export interface MobileWebLandingPageProps {
  onStart?: () => void;
  onOpenHistory?: () => void;
}

type FAQItemData = {
  question: string;
  shortAnswer: string;
  content: ReactNode;
};

function FloatingParticles() {
  const particles = [
    { left: "12%", top: "18%", size: 4, delay: "0s", duration: "6s" },
    { left: "78%", top: "12%", size: 3, delay: "1.2s", duration: "7s" },
    { left: "25%", top: "65%", size: 5, delay: "0.5s", duration: "8s" },
    { left: "85%", top: "55%", size: 3, delay: "2s", duration: "6.5s" },
    { left: "50%", top: "30%", size: 4, delay: "1.8s", duration: "7.5s" },
    { left: "65%", top: "75%", size: 3, delay: "0.8s", duration: "6.8s" },
    { left: "35%", top: "45%", size: 2, delay: "3s", duration: "8.5s" },
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

function IconUpload() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V6" stroke="#C87850" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 9.5L12 6L15.5 9.5" stroke="#C87850" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 18.5H18" stroke="#C87850" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconAnalyze() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="4" height="4" rx="1" stroke="#C87850" strokeWidth="1.6" />
      <rect x="15" y="5" width="4" height="4" rx="1" stroke="#C87850" strokeWidth="1.6" />
      <rect x="5" y="15" width="4" height="4" rx="1" stroke="#C87850" strokeWidth="1.6" />
      <circle cx="15.5" cy="15.5" r="3.5" stroke="#C87850" strokeWidth="1.6" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5.5H14L18 9.5V18a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 18V7A1.5 1.5 0 0 1 8.5 5.5Z" stroke="#C87850" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 5.5V9.5H18" stroke="#C87850" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 12H15" stroke="#C87850" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 15H15" stroke="#C87850" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StepCard({ num, icon, title, desc }: { num: number; icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="am-step-flow-card">
      <div className="am-step-flow-card__num">{num}</div>
      <div className="am-step-flow-card__icon">{icon}</div>
      <div className="am-step-flow-card__title">{title}</div>
      <div className="am-step-flow-card__desc">{desc}</div>
    </div>
  );
}

function FAQPara({ children }: { children: ReactNode }) {
  return <p className="am-faq-paragraph">{children}</p>;
}

function FAQSubtitle({ children }: { children: ReactNode }) {
  return <p className="am-faq-subtitle">{children}</p>;
}

function FAQBullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="am-faq-bullets">
      {items.map((item, index) => (
        <li key={index} className="am-faq-bullets__item">
          <span className="am-faq-bullets__dot" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FAQNote({ children }: { children: ReactNode }) {
  return (
    <div className="am-faq-note">
      <p>{children}</p>
    </div>
  );
}

function FAQItem({ item, defaultOpen = false }: { item: FAQItemData; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`am-faq-item${open ? " is-open" : ""}`}>
      <div className={`am-faq-item__accent${open ? " is-open" : ""}`} />
      <button type="button" className="am-faq-trigger" onClick={() => setOpen((value) => !value)}>
        <div className="am-faq-trigger__copy">
          <div className="am-faq-question">{item.question}</div>
          {!open ? <div className="am-faq-short">{item.shortAnswer}</div> : null}
        </div>
        <span className={`am-faq-toggle${open ? " is-open" : ""}`} aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      <div className={`am-faq-answer-wrap${open ? " is-open" : ""}`}>
        <div className="am-faq-answer">{item.content}</div>
      </div>
    </div>
  );
}

function PriceCompare({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const rows = [
    { feature: "AI 色彩解读", lite: true, pro: true },
    { feature: "结构分析", lite: true, pro: true },
    { feature: "基础情绪洞察", lite: true, pro: true },
    { feature: "深度心理分析", lite: false, pro: true },
    { feature: "进阶行动建议", lite: false, pro: true },
    { feature: "个性化深度报告", lite: false, pro: true },
    { feature: "历史记录存档", lite: false, pro: true },
  ];

  return (
    <div className="am-price-compare">
      <div className="am-price-compare__header">
        <span>功能对比</span>
        <button type="button" onClick={onClose}>
          收起
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>功能</th>
            <th>Lite</th>
            <th>Pro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature}>
              <td>{row.feature}</td>
              <td className="am-price-compare__lite">{row.lite ? "✓" : "—"}</td>
              <td className="am-price-compare__pro">{row.pro ? "✓" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const faqItems: FAQItemData[] = [
  {
    question: "曼陀罗解读是什么？",
    shortAnswer: "上传你的曼陀罗画作，获得一份关于情绪、关系与内在状态的探索性报告",
    content: (
      <>
        <FAQPara>
          曼陀罗解读是一种结合传统五行视角与现代 AI 图像分析的自我探索方式。你上传自己画的曼陀罗后，系统会识别颜色分布、几何结构与三圈布局，生成一份帮助你整理当下感受、关系状态与内在需求的阅读报告。
        </FAQPara>
        <FAQNote>它不替代专业心理咨询，更适合作为一次温和的自我觉察与整理。</FAQNote>
      </>
    ),
  },
  {
    question: "需要准备什么样的画作？",
    shortAnswer: "手绘的圆形作品即可，不需要绘画基础，也没有标准答案",
    content: (
      <>
        <FAQBullets
          items={[
            <><strong>形式：</strong>手绘的圆形图案即可，可以是彩色，也可以是黑白</>,
            <><strong>工具：</strong>彩铅、水彩、马克笔或数字绘画都可以</>,
            <><strong>大小：</strong>建议直径不小于 10cm，方便识别细节</>,
            <><strong>内容：</strong>不需要按模板画，跟着当下感觉去画就好</>,
          ]}
        />
        <FAQSubtitle>拍摄建议</FAQSubtitle>
        <FAQBullets items={["尽量在自然光下拍摄", "保持画面完整，不要裁切圆形边缘", "尽量避免阴影、反光和模糊"]} />
      </>
    ),
  },
  {
    question: "解读结果准确吗？",
    shortAnswer: "它更适合作为启发与参照，而不是对你状态的最终定论",
    content: (
      <>
        <FAQPara>解读会综合几个维度来生成，因此适合帮助你打开视角，而不是替你下结论：</FAQPara>
        <FAQBullets
          items={[
            <><strong>传统五行视角：</strong>观察颜色与五行之间的对应关系</>,
            <><strong>心理学参考：</strong>结合色彩心理学与投射式理解</>,
            <><strong>AI 视觉识别：</strong>分析颜色分布、形状特征与三圈结构</>,
          ]}
        />
        <FAQSubtitle>怎么理解“准确”</FAQSubtitle>
        <FAQBullets
          items={[
            "颜色识别和结构分析相对稳定",
            "对心理状态的理解是启发式阅读，不是医学或心理诊断",
            "最重要的是结合你此刻的真实感受一起阅读",
          ]}
        />
        <FAQNote>如有严重心理困扰，请及时寻求专业帮助。</FAQNote>
      </>
    ),
  },
  {
    question: "我的隐私如何保护？",
    shortAnswer: "你的画作只用于本次解读链路，不会被挪作无关用途",
    content: (
      <>
        <FAQBullets
          items={[
            <><strong>安全传输：</strong>上传画作会按当前产品链路进行安全传输</>,
            <><strong>用途限定：</strong>内容仅用于生成你的解读报告</>,
            <><strong>访问受限：</strong>默认只在你的解读流程与历史记录中可见</>,
            <><strong>规则补充：</strong>完整留存与删除策略会在正式政策页说明</>,
          ]}
        />
      </>
    ),
  },
  {
    question: "如何使用优惠券？",
    shortAnswer: "一镜 Lite 版固定 9.9 元，优惠券会通过活动或渠道发放",
    content: (
      <>
        <FAQSubtitle>优惠信息</FAQSubtitle>
        <FAQBullets items={["一镜 Lite 版当前固定为 9.9 元/次", "优惠券会通过活动页、合作渠道或社群发放"]} />
        <FAQSubtitle>版本方案</FAQSubtitle>
        <div className="am-faq-price-row">
          <div className="am-faq-price-card am-faq-price-card--lite">
            <p>一镜 Lite 版</p>
            <strong>
              9.9<span>元/次</span>
            </strong>
            <span>适合第一次体验，获得 5-6 个核心洞察</span>
          </div>
          <div className="am-faq-price-card am-faq-price-card--pro">
            <p>一梳 Pro 版</p>
            <strong>
              49<span>元/次</span>
            </strong>
            <span>适合继续深入，获得 20+ 条分析与调节建议</span>
          </div>
        </div>
      </>
    ),
  },
];

const heroRingStyle = {
  ["--am-hero-pattern" as string]: `url(${brandPattern})`,
} as CSSProperties;

export function MobileWebLandingPage({ onStart, onOpenHistory }: MobileWebLandingPageProps) {
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollCue(window.scrollY < 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="am-page am-landing-page">
      <section className="am-landing-hero" style={heroRingStyle}>
        <div className="am-pattern-overlay" style={{ backgroundImage: `url(${brandPattern})` }} />
        <div className="am-ambient-glow am-ambient-glow--right" />
        <div className="am-ambient-glow am-ambient-glow--left" />
        <div className="am-ambient-glow am-ambient-glow--bottom" />
        <FloatingParticles />

        <button type="button" className="am-history-pill" onClick={onOpenHistory}>
          历史解读
        </button>

        <div className="am-logo-ring">
          <div className="am-logo-ring__glow" />
          <div className="am-logo-ring__outer" />
          <div className="am-logo-ring__inner" />
          <div className="am-logo-ring__pulse" />
          <img src={logoNiwu} alt="一镜一梳" className="am-logo-image" />
        </div>

        <div className="am-hero-copy">
          <h1>画出你的潜意识</h1>
          <p className="am-hero-subtitle">AI 解读曼陀罗画作  ·  探索内心世界</p>
          <p className="am-hero-price">融合阴阳五行三才的东方解读视角</p>
        </div>

        <button type="button" className="am-primary-cta" onClick={onStart}>
          <span className="am-primary-cta__shine" aria-hidden="true" />
          <span className="am-primary-cta__label">开始体验</span>
        </button>

        <div className={`am-scroll-cue${showScrollCue ? "" : " is-hidden"}`}>
          <span>滑动了解详情</span>
          <i className="am-scroll-cue__arrow" aria-hidden="true">
            ↓
          </i>
        </div>
      </section>

      <section className="am-landing-section am-landing-section--steps">
        <div className="am-landing-section__glow am-landing-section__glow--steps" />
        <h2>三步开始解读</h2>
        <div className="am-step-flow">
          <div className="am-step-flow__line" aria-hidden="true" />
          <StepCard num={1} icon={<IconUpload />} title="上传画作" desc={"拍清整幅\n即可开始"} />
          <StepCard num={2} icon={<IconAnalyze />} title="AI识别" desc={"读取颜色\n与结构"} />
          <StepCard num={3} icon={<IconReport />} title="查看报告" desc={"先看 Lite\n再决定深入"} />
        </div>
      </section>

      <section className="am-landing-section am-landing-section--pricing">
        <div className="am-pattern-overlay" style={{ backgroundImage: `url(${brandPattern})` }} />
        <h2>先轻体验，再决定深入</h2>
        <div className="am-pricing-grid am-pricing-grid--landing">
          <article className="am-pricing-panel am-pricing-panel--lite">
            <p className="am-pricing-panel__eyebrow">一镜 Lite 版</p>
            <div className="am-pricing-panel__badge">体验版</div>
            <p className="am-pricing-panel__meta">价格 9.9 元/次</p>
            <p className="am-pricing-panel__desc">首次体验，5-6 个核心洞察</p>
          </article>
          <article className="am-pricing-panel am-pricing-panel--pro">
            <div className="am-pricing-panel__title-row">
              <p className="am-pricing-panel__eyebrow am-pricing-panel__eyebrow--pro">一梳 Pro 版</p>
              <span className="am-pricing-panel__tag">更深入</span>
            </div>
            <p className="am-pricing-panel__price">
              49<span>元/次</span>
            </p>
            <p className="am-pricing-panel__desc">继续深入，20+ 条分析与建议</p>
          </article>
        </div>
        <button type="button" className={`am-compare-toggle${compareOpen ? " is-open" : ""}`} onClick={() => setCompareOpen((value) => !value)}>
          <span>{compareOpen ? "收起版本对比" : "查看版本对比"}</span>
          <i aria-hidden="true">›</i>
        </button>
        <PriceCompare open={compareOpen} onClose={() => setCompareOpen(false)} />
      </section>

      <section className="am-landing-section am-landing-section--faq">
        <div className="am-landing-section__glow am-landing-section__glow--faq" />
        <h2>常见问题</h2>
        <div className="am-faq-list">
          {faqItems.map((item, index) => (
            <FAQItem key={item.question} item={item} defaultOpen={index === 0} />
          ))}
        </div>
      </section>

      <section className="am-landing-section am-landing-section--final">
        <div className="am-pattern-overlay" style={{ backgroundImage: `url(${brandPattern})` }} />
        <div className="am-landing-section__glow am-landing-section__glow--final" />
        <h2>准备好读读这幅画了吗？</h2>
        <button type="button" className="am-primary-cta am-primary-cta--compact" onClick={onStart}>
          <span className="am-primary-cta__shine" aria-hidden="true" />
          <span className="am-primary-cta__label">开始体验</span>
        </button>
        <div className="am-landing-footer-divider" />
        <div className="am-landing-footer-brand">
          <img src={logoNiwu} alt="一镜一梳" />
          <span>一镜一梳</span>
        </div>
        <div className="am-landing-footer-links">
          <button type="button">隐私政策</button>
          <button type="button">用户协议</button>
        </div>
        <p className="am-landing-footer-copy">© 2026 一镜一梳 All Rights Reserved</p>
      </section>
    </div>
  );
}
