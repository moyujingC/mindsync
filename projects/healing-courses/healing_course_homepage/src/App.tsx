import { useEffect, useRef, useState } from 'react';
import ArtSlot from './ArtSlot';
import Eyebrow from './Eyebrow';
import Price from './Price';
import CourseDetail, { courseDetails } from './CourseDetail';

export type Course = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  status: 'live' | 'coming';
  imageSlot?: string;
  /* 以下为可选展示字段，仅在售课程主推卡使用 */
  kicker?: string;
  priceTag?: string;
  highlights?: string[];
};

export const courses: Course[] = [
  {
    id: 'self-healing-intro', status: 'live', imageSlot: 'cover-self-v4.png',
    name: '安顿内心，开启自愈之旅',
    tagline: '一门自我疗愈入门课——先学会静心，再拿到一张“状态 → 工具”自我疗愈地图，最后跟着四次曼陀罗带练走完整闭环。',
    price: '¥69', priceTag: '早鸟价', priceNote: '10 月 13 日起恢复 ¥99',
    kicker: '第一门课 · 给想好好照顾自己的你',
    highlights: [
      '16 节课，五个章节，按自己的节奏走，没有固定上课点',
      '六种当下状态（脑子转不停 / 陷在一件事里 / 浑身发紧 / 提不起劲 / 心里堵 / 说不清哪里不对），对应书写、呼吸、冥想、舞动、曼陀罗五条路径',
      '每个练习 5 分钟和 15 分钟两个版本，忙时做短的，有心情做长的',
      '前 3 节免费，合不合适，你的身体会知道',
    ],
  },
  { id: 'topic-wealth', status: 'coming', name: '议题系列课 · 首发：财富', tagline: '单议题深挖：从一幅画，看见你和金钱的关系', price: '¥129 起' },
  { id: 'schools-map', status: 'coming', name: '流派梳理课', tagline: '想转型疗愈师，但流派太多不知道学哪个？一门课帮你做选型决策', price: '¥250' },
  { id: 'healer-0-1', status: 'coming', name: '疗愈师从 0 到 1 转型课', tagline: '入行路径：概念、方向、小技术', price: '¥350' },
  { id: 'reading-salon', status: 'coming', name: '曼陀罗解读 + 沙龙', tagline: '第一门能接单的技能课', price: '¥650' },
  { id: 'reading-advanced', status: 'coming', name: '解读进阶 · 个案方向', tagline: '重交付，排期待定', price: '¥1200+' },
];

function CourseCard({ course, layout, onOpen, onTrial }: { course: Course; layout: 'feature' | 'grid'; onOpen?: () => void; onTrial: () => void }) {
  const live = course.status === 'live';
  return <article className={`course-card course-card--${live ? layout : 'coming'}`} id={course.id}>
    {course.imageSlot && <ArtSlot file={course.imageSlot} ratio="3 / 2" tone="light" className="course-art"/>}
    <div className="course-body">
      {live ? course.kicker && <div className="course-meta"><span className="tiny-dot"/> {course.kicker}</div> : <div className="course-meta-row"><span className="coming-tag">即将上线</span></div>}
      <h3 className={live ? 't-h3' : undefined}>{course.name}</h3>
      <p className="course-summary">{course.tagline}</p>
      {live && course.highlights && <ul className="course-points">{course.highlights.map(item => <li key={item}>{item}</li>)}</ul>}
      {live ? <div className="course-foot"><Price course={course}/><div className="course-actions"><button className="button primary" onClick={onTrial}>免费体验前 3 节 <span aria-hidden="true">↗</span></button>{onOpen && <button className="button secondary" onClick={onOpen}>查看课程详情 →</button>}</div></div> : <span className="upcoming-price">{course.price}</span>}
    </div>
  </article>;
}

function HomePage({ onOpenCourse, hasDetail }: { onOpenCourse: (id: string) => void; hasDetail: (id: string) => boolean }) {
  const live = courses.filter(course => course.status === 'live');
  const coming = courses.filter(course => course.status === 'coming');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const handle = (event: MouseEvent) => { if (event.target === dialog.current) dialog.current?.close(); }; const element = dialog.current; element?.addEventListener('click', handle); return () => element?.removeEventListener('click', handle); }, []);
  return <>
    <header className="brand-bar"><div className="wrap bar-inner"><a className="wordmark" href="#top" aria-label="一镜一梳首页">一镜一梳<span className="brand-seal" aria-hidden="true">照见</span></a><a className="entry-link" href="#first-course">进入课程 <span aria-hidden="true">↗</span></a></div></header>
    <main id="top">
      <section className="block block--light">
        <div className="wrap hero">
          <div className="hero-copy">
            <Eyebrow en="MANDALA" zh="曼陀罗 · 自我疗愈"/>
            <h1 className="t-display">把疗愈，做成<br/>普通人能上手的课</h1>
            <p className="lead">不用会画画，不需要心理学背景。<br/>难受的时候有办法安顿自己——这件事可以学会。</p>
            <div className="hero-actions"><a className="button primary" href="#first-course">看看第一门课 <span aria-hidden="true">↓</span></a><span className="quiet-caption">从照见自己开始，不必急着改变。</span></div>
          </div>
          <ArtSlot file="hero-v4-light.png" ratio="4 / 3" tone="light" className="hero-art"/>
        </div>
      </section>

      <section className="block block--dark" id="first-course" aria-labelledby="featured-title">
        <div className="wrap">
          <header className="block-head"><Eyebrow en="COURSE" zh="课程"/><h2 className="t-h2" id="featured-title">从这里，迈出第一步</h2></header>
          <div className={live.length === 1 ? 'live-feature' : 'card-grid'}>{live.map(course => <CourseCard key={course.id} course={course} layout={live.length === 1 ? 'feature' : 'grid'} onTrial={() => dialog.current?.showModal()} onOpen={hasDetail(course.id) ? () => onOpenCourse(course.id) : undefined}/>)}</div>
        </div>
      </section>

      {coming.length > 0 && <section className="block block--light" id="upcoming" aria-labelledby="upcoming-title">
        <div className="wrap">
          <header className="block-head"><Eyebrow en="UPCOMING" zh="慢慢来，也是一种抵达"/><h2 className="t-h2" id="upcoming-title">这条路，可以慢慢走深</h2></header>
          <div className="card-grid">{coming.map(course => <CourseCard key={course.id} course={course} layout="grid" onTrial={() => dialog.current?.showModal()}/>)}</div>
        </div>
      </section>}

      <section className="block block--dark" id="story" aria-labelledby="story-title">
        <div className="wrap split">
          <div className="split-copy"><Eyebrow en="OUR STORY" zh="一镜一梳是谁"/><h2 className="t-h2" id="story-title">一个走过自我疗愈这条路的人，<br/>把所学做成你能跟着做的课</h2><p>创始人在 9 年高强度工作后转向曼陀罗艺术疗愈，完成 100+ 小时系统训练。这门课不讲玄学、不灌鸡汤，只给你日常状态里用得上的方法。</p></div>
          <ArtSlot file="brand-story-v4.png" ratio="3 / 2"/>
        </div>
      </section>

      <section className="block block--light" aria-labelledby="trust-title">
        <div className="wrap">
          <header className="block-head"><Eyebrow en="PROMISE" zh="坦诚"/><h2 className="t-h2" id="trust-title">开始之前，你可以放心</h2></header>
          <div className="trust-grid">{[['不教画画', '曼陀罗在这里是一面镜子，不是一张考卷；画成什么样都对'], ['按状态选课', '不是一套练到底，不同状态用不同路径'], ['坦诚说明', '课程是日常状态的自我照顾，不替代医疗和专业心理服务；持续的情绪困扰请优先寻求专业帮助']].map(([title, text], index) => <article className="trust-card" key={title}><span className="trust-num">{String(index + 1).padStart(2, '0')}</span><h3 className="t-h3">{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>
    </main>
    <footer className="footer">
      <div className="wrap footer-grid">
        <div><a href="#top" className="wordmark">一镜一梳<span className="brand-seal" aria-hidden="true">照见</span></a><p className="footer-motto">一镜一梳 · 照见即疗愈</p><p className="footer-note">曼陀罗绘画疗愈</p></div>
        <nav aria-label="课程导航"><div className="footer-label">COURSES · 课程</div>{live.map(course => <a key={course.id} href={`#${course.id}`}>{course.name}</a>)}<a href="#upcoming">即将上线</a><a href="#story">一镜一梳是谁</a></nav>
        <div><div className="footer-label">CONTACT · 联系</div><p>courses.jingshu.cc</p><p className="footer-note">备案信息 · 待接入</p></div>
      </div>
    </footer>
    <dialog ref={dialog} className="trial-dialog"><button className="dialog-close" aria-label="关闭" onClick={() => dialog.current?.close()}>×</button><Eyebrow en="TRIAL" zh="先体验，再决定"/><h2 className="t-h3">免费体验前 3 节</h2><p>不用会画画，不需要心理学背景。合不合适，你的身体会知道。</p><div className="connection-note">体验课程入口暂未接入，本页不收取费用。正式课程链接接入后，可从这里开始学习。</div><button className="button primary" onClick={() => dialog.current?.close()}>回到课程首页</button></dialog>
  </>;
}

export default function App() {
  const [courseId, setCourseId] = useState<string | null>(null);
  const navigate = (next: string | null) => { setCourseId(next); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const course = courses.find(item => item.id === courseId);
  const detail = courseId ? courseDetails[courseId] : undefined;
  return course && detail ? <CourseDetail course={course} detail={detail} onBack={() => navigate(null)}/> : <HomePage onOpenCourse={navigate} hasDetail={id => id in courseDetails}/>;
}
