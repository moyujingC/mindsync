import { useEffect, useRef, useState } from 'react';
import ArtSlot from './ArtSlot';
import Eyebrow from './Eyebrow';
import Price from './Price';
import type { Course } from './App';

export type CourseDetailData = {
  label: string;
  subtitle: string;
  tags: string[];
  stickyPrice: string;
  freeNote: string;
  coverSlot: string;
  ctaSlot: string;
  ctaTitle: string;
  outcomes: { title: string; text?: string }[];
  pains: string[];
  painNote: string;
  learning: string[];
  curriculumTitle: string;
  chapters: { title: string; lessons: string[]; formats: string[]; free?: boolean }[];
  studentNote: string;
  faq: [string, string][];
};

/* 每门课一份详情数据，键为 courses 数组里的 id；课程名与价格读自 courses */
export const courseDetails: Record<string, CourseDetailData> = {
  'self-healing-intro': {
    label: '自我疗愈入门课',
    subtitle: '陪你把“难受的时候怎么办”这件事学会',
    tags: ['16 节课', '前 3 节免费', '按自己节奏走'],
    stickyPrice: '早鸟 ¥69',
    freeNote: '不需要先付费，走完前三节再决定',
    coverSlot: 'cover-self-v4.png',
    ctaSlot: 'cover-emotion-v4.png',
    ctaTitle: '你的画里，有你还没说出口的话。',
    outcomes: [
      { title: '随时可用的静心能力', text: '呼吸和身体练习，难受时能先安顿下来' },
      { title: '一张“状态 → 工具”自我疗愈地图', text: '六种状态各归其位' },
      { title: '四次曼陀罗带练的画作 + 一份自己的练习记录' },
    ],
    pains: ['晚上躺下，脑子还在放电影', '为一件事反复纠结出不来', '身体绷得紧紧的', '累到什么都不想做'],
    painNote: '这些困扰不是你有问题，是它们一直没被好好安顿过。',
    learning: ['不赶时间，没有固定上课点；每个练习 5 分钟和 15 分钟两个版本', '不要求静坐，大多从 5 分钟开始，状态不同、做法也不同', '前 3 节是完整体验：弄清楚自我疗愈是什么、边界在哪，然后真的带你做一遍呼吸练习'],
    curriculumTitle: '16 节课，我们会这样慢慢走',
    chapters: [
      { title: '认识自我疗愈', lessons: ['你为什么来到这里', '自我疗愈能解决什么', '静心的三个误解'], formats: ['观看', '观看', '练习'], free: true },
      { title: '静心：安顿自己的基础能力', lessons: ['让静心成为日常', '身体比头脑诚实', '与身体对话', '初心与初学者心态'], formats: ['观看', '练习', '练习', '观看'] },
      { title: '你的自我疗愈地图', lessons: ['地图总览', '书写与呼吸', '冥想与舞动', '艺术疗愈与曼陀罗'], formats: ['观看', '练习', '练习', '观看'] },
      { title: '曼陀罗带练', lessons: ['第一次画曼陀罗', '四种涂色动作', '清理、疗愈、显化', '综合深练'], formats: ['练习', '练习', '练习', '练习'] },
      { title: '带着地图继续走', lessons: ['整理你的练习记录'], formats: ['练习'] },
    ],
    studentNote: '第一批学员还在学习中，走完这一程后，我们会把真实的感受放在这里。',
    faq: [
      ['我试过冥想，没坚持下来，这次会不一样吗？', '没坚持下来，不代表你不适合，可能只是那个方式不适合你。这门课里的练习不要求静坐，大多从 5 分钟开始，而且状态不同、做法也不同。第二章会陪你找到一种能留在日常里的方式——能留下来的，才是你的。'],
      ['这门课真的能帮到我吗？', '这门课做的是日常状态里的自我照顾：让你难受的时候有办法安顿自己。它做不到替代专业帮助，我们也不想夸大它。如果你的困扰已经持续很久、影响了生活，先去找专业的人聊聊，那是对的，这门课可以以后再说。'],
      ['完全没有接触过疗愈，跟得上吗？', '可以。课程从「你为什么来到这里」讲起，不预设任何背景。前 3 节免费，慢慢走——合不合适，你的身体会知道。'],
      ['免费的前 3 节，能体验到什么？', '一段完整的体验：弄清楚自我疗愈是什么、边界在哪里，然后跟着完成第一次呼吸练习。不是几页介绍，是真的带你做一遍。'],
      ['平时很忙，怕抽不出时间？', '课程不赶时间，没有固定的上课点。每个练习都有 5 分钟和 15 分钟两个版本，按当天的状态选。忙的时候做短的，有心情的时候做长的，都可以。'],
      ['曼陀罗部分，需要会画画吗？', '不需要。曼陀罗在这里是一面镜子，不是一张考卷。带练会从下笔开始一步一步陪你，画成什么样都对。过程中你对自己的观察，比画面本身重要。'],
    ],
  },
};

export default function CourseDetail({ course, detail, onBack }: { course: Course; detail: CourseDetailData; onBack: () => void }) {
  const intro = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setSticky(!entry.isIntersecting && entry.boundingClientRect.bottom < 0));
    if (intro.current) observer.observe(intro.current);
    return () => observer.disconnect();
  }, []);
  const startTrial = () => dialog.current?.showModal();
  const pills = <div className="pill-row">{detail.tags.map(tag => <span key={tag}>{tag}</span>)}</div>;
  return <div className="detail-page">
    <section className="block block--dark detail-intro" ref={intro} aria-labelledby="detail-title">
      <div className="wrap">
        <div className="detail-nav"><button className="back-button" onClick={onBack} aria-label="返回课程首页">←</button><span className="detail-cover-label">{detail.label}</span></div>
        <div className="detail-hero">
          <div className="detail-info">
            <Eyebrow en="COURSE" zh={detail.label}/>
            <h1 className="t-display" id="detail-title">{course.name}</h1>
            <p className="detail-subtitle">{detail.subtitle}</p>
            {pills}
            <Price course={course}/>
            <button className="button primary detail-full-button" onClick={startTrial}>免费体验前 3 节 <span aria-hidden="true">→</span></button>
            <p className="detail-free-note">{detail.freeNote}</p>
          </div>
          <ArtSlot file={detail.coverSlot} ratio="4 / 3" className="detail-art"/>
        </div>
      </div>
    </section>

    <section className="block block--light">
      <div className="wrap detail-pair">
        <div><Eyebrow en="OUTCOMES" zh="带走的不只是知识"/><h2 className="t-h2">课程结束的时候，你会留下这些</h2>
          <div className="outcome-list">{detail.outcomes.map((item, index) => <article className="outcome-card" key={item.title}><span className="outcome-num">{String(index + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</div></article>)}</div>
        </div>
        <div className="pain-panel"><Eyebrow en="IF YOU" zh="或许是你"/><h2 className="t-h2">如果你最近常常这样</h2><ul className="pain-list">{detail.pains.map(text => <li key={text}>{text}</li>)}</ul><p className="pain-note">{detail.painNote}</p></div>
      </div>
    </section>

    <section className="block block--gold">
      <div className="wrap"><header className="block-head"><Eyebrow en="EXPERIENCE" zh="学习方式"/><h2 className="t-h2">学起来，是什么感觉</h2></header>
        <div className="learning-grid">{detail.learning.map(text => <p key={text}><span className="learning-dot"/>{text}</p>)}</div>
      </div>
    </section>

    <section className="block block--dark" aria-labelledby="curriculum-title">
      <div className="wrap curriculum-layout">
        <div className="curriculum-main"><Eyebrow en="CURRICULUM" zh="循着自己的节奏"/><h2 className="t-h2" id="curriculum-title">{detail.curriculumTitle}</h2>
          <div className="chapter-list">{detail.chapters.map((chapter, index) => <details className="chapter" key={chapter.title} open={index === 0}><summary><span className="chapter-num">{String(index + 1).padStart(2, '0')}</span><span className="chapter-title">{chapter.title}<small>{chapter.lessons.length} 节{chapter.free && <span className="free-tag">免费</span>}</small></span><span className="accordion-arrow" aria-hidden="true"/></summary><ul className="lesson-list">{chapter.lessons.map((lesson, lessonIndex) => <li key={lesson}><span>{lesson}</span><span className="lesson-format">{chapter.formats[lessonIndex]}</span></li>)}</ul></details>)}</div>
        </div>
        <aside className="buy-card" aria-label="购买课程">
          <Eyebrow en="ENROLL" zh="报名"/>
          <Price course={course}/>
          <button className="button primary" onClick={startTrial}>免费体验前 3 节 <span aria-hidden="true">→</span></button>
          {pills}
        </aside>
      </div>
    </section>

    <section className="block block--light">
      <div className="wrap faq-layout">
        <div><Eyebrow en="VOICES" zh="学员"/><h2 className="t-h2">学员的感受</h2><div className="student-placeholder"><p>{detail.studentNote}</p></div></div>
        <div><Eyebrow en="FAQ" zh="常见问题"/><h2 className="t-h2">你可能想问</h2><div className="faq-list">{detail.faq.map(([question, answer]) => <details className="faq-item" key={question}><summary><span>{question}</span><span className="faq-toggle" aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></div>
      </div>
    </section>

    <section className="block block--dark detail-cta">
      <div className="wrap split split--reverse">
        <ArtSlot file={detail.ctaSlot} ratio="1 / 1" className="cta-art"/>
        <div className="split-copy"><Eyebrow en="BEGIN" zh="开始"/><h2 className="t-h2">{detail.ctaTitle}</h2><button className="button primary" onClick={startTrial}>免费体验前 3 节 <span aria-hidden="true">→</span></button><div className="detail-cta-signature">一镜一梳 · 照见即疗愈</div></div>
      </div>
    </section>
    {sticky && <aside className="detail-sticky" aria-label="开始体验课程"><span><strong>{detail.stickyPrice}</strong><span className="sticky-divider"> · </span><small>前 3 节免费</small></span><button className="button primary" onClick={startTrial}>开始体验</button></aside>}
    <dialog ref={dialog} className="trial-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><button className="dialog-close" aria-label="关闭" onClick={() => dialog.current?.close()}>×</button><Eyebrow en="TRIAL" zh={detail.label}/><h2 className="t-h3">免费体验前 3 节</h2><p>{detail.freeNote}。</p><div className="connection-note">体验课程入口暂未接入，本页不收取费用。正式课程链接接入后，可从这里开始学习。</div><button className="button primary" onClick={() => dialog.current?.close()}>返回课程详情</button></dialog>
  </div>;
}
