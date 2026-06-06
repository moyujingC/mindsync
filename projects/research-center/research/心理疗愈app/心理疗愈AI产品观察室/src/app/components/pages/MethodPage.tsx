import { Container, Reading, SectionLabel } from '../shared';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const methodImg = 'https://images.unsplash.com/photo-1654542645651-5196f4931cd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1400&q=80';

const items = [
  {
    n: '01',
    t: '场景',
    desc: '产品被打开的真实场景是什么？夜里失眠的独处、午休的喘息间隙，还是临床诊室里医生与病人之间？场景决定了一切设计取舍。',
    qs: ['用户在什么时间、什么情绪状态下打开它？', '在没有它之前，这个场景如何被处理？', '它是替代了一段空白，还是挤占了另一种行为？'],
  },
  {
    n: '02',
    t: '关系',
    desc: 'AI 与用户之间被设计成什么关系：朋友、教练、笔记本、医生、镜子，还是别的？关系预期与产品能力是否匹配，决定了用户失望的烈度。',
    qs: ['产品的称呼、语气、节奏在暗示哪一种关系？', '这段关系是对等的、上位的还是工具性的？', '边界感是否在交互层面被持续维护？'],
  },
  {
    n: '03',
    t: '输入',
    desc: '用户向产品提供什么：短文字、长日记、语音、生理信号、问卷分数，还是被动行为数据？输入门槛与回报曲线，决定了留存。',
    qs: ['输入形态是否降低了书写门槛？', '输入越多，用户得到的回报曲线长什么样？', '输入数据的所有权与可携带性是否被尊重？'],
  },
  {
    n: '04',
    t: '干预',
    desc: '产品具体做了什么：提问、命名情绪、给出框架、布置练习，还是只是陪着？每一种干预背后都对应着可识别的心理学方法论。',
    qs: ['它引用了哪些可被识别的方法或疗法？', '这些方法在产品里被翻译成了什么具体动作？', '用户能否调节干预的强度与节奏？'],
  },
  {
    n: '05',
    t: '记忆',
    desc: '产品记得用户多少？记忆被用作个性化的燃料，还是被压缩成可被用户阅读的洞察？记忆的可见度与可控度，是一条尚未被解决的产品命题。',
    qs: ['记忆是黑箱还是可见、可编辑、可删除？', '长程记忆是否真的带来体验跃迁，还是只是数据沉淀？', '记忆是否会被用于训练、推荐或商业化？'],
  },
  {
    n: '06',
    t: '边界',
    desc: 'AI 主动做什么、明确不做什么。在自伤、危机、儿童青少年、临床判断等高风险情境下，产品的默认行为是什么？一个稳定的边界比一个聪明的回答更值钱。',
    qs: ['哪些事 AI 拒绝、降级或转介？', '边界是否被显式告知用户？', '边界在压力情境下是否稳定？'],
  },
  {
    n: '07',
    t: '商业',
    desc: '它向谁收钱：2C 订阅、2B SaaS、B2B2C，还是机构合同？商业激励与心理伦理之间，是否存在结构性张力？',
    qs: ['付费的是谁？为什么付费？', '商业激励是否会扭曲产品的关怀质量？', '可持续性来自规模、专业护城河，还是合规壁垒？'],
  },
];

const techItems = [
  {
    t: '输入 / 输出模态',
    desc: '看产品处理文字、语音、图片、日记、量表、临床会话还是行为数据，以及输出对话、报告、行动计划、临床记录或风险提醒。',
  },
  {
    t: '模型策略',
    desc: '区分通用 LLM 封装、垂直模型、微调模型、多模型协同和工作流系统。没有官方证据时，不写具体模型供应商。',
  },
  {
    t: '上下文与记忆',
    desc: '看产品只记当前会话，还是有跨会话长期记忆；记忆是否可见、可编辑、可删除。',
  },
  {
    t: '知识与 RAG',
    desc: 'RAG 是检索增强生成。心理产品里的重点不是回答更长，而是解释能否回到知识库、用户资料或本次输入证据。',
  },
  {
    t: '编排与工作流',
    desc: '看 AI 是自由聊天，还是先分类、再检索、再生成、再安全审查，并在不同风险等级下切换流程。',
  },
  {
    t: '安全护栏',
    desc: '看自伤、他伤、危机、未成年人、医疗诊断等场景是否被识别，触发后是拒答、降级、转介还是人工介入。',
  },
  {
    t: '数据、安全与合规',
    desc: '看加密、删除、导出、训练用途、HIPAA、SOC2、GDPR、企业数据隔离和临床审计，不替产品做合规背书。',
  },
  {
    t: '评估与可观测性',
    desc: '看产品如何评估回答质量、安全性、危机识别、过度建议、依赖风险、错误解释和长期效果。',
  },
];

export function MethodPage() {
  return (
    <main>
      <section className="pt-16 pb-10" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <div className="grid md:grid-cols-12 gap-10 items-end">
            <div className="md:col-span-7">
              <SectionLabel>RESEARCH METHOD · 方法论</SectionLabel>
              <h1 className="mt-4 mb-5" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>7 把尺子：<br />我们怎么拆解一款 AI 心理产品</h1>
              <p className="m-0 max-w-[600px]" style={{ color: 'var(--ink-secondary)' }}>
                这一套问题清单是观察室的工作流。每一款进入产品地图的样本，都会被同一组问题问一遍——这让我们的判断有迹可循、可被你反驳。
              </p>
            </div>
            <div className="md:col-span-5">
              <div className="hairline rounded-md overflow-hidden aspect-[5/4]">
                <ImageWithFallback src={methodImg} alt="研究笔记本与温柔自然光"
                  className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="space-y-12 max-w-[920px] mx-auto">
            {items.map(it => (
              <div key={it.n} className="grid md:grid-cols-12 gap-8 hairline-t pt-10 first:pt-0 first:border-t-0">
                <div className="md:col-span-3">
                  <div className="font-mono text-[12px] tracking-widest mb-2" style={{ color: 'var(--accent-green)' }}>METHOD {it.n}</div>
                  <h2 className="m-0">{it.t}</h2>
                </div>
                <div className="md:col-span-9">
                  <p className="m-0 mb-5" style={{ color: 'var(--ink-primary)' }}>{it.desc}</p>
                  <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
                    <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--ink-tertiary)' }}>核心提问</div>
                    <ul className="m-0 p-0 list-none space-y-2">
                      {it.qs.map((q, i) => (
                        <li key={i} className="flex gap-3 text-[14px]" style={{ color: 'var(--ink-primary)' }}>
                          <span style={{ color: 'var(--accent-green)' }}>·</span>{q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 hairline-t" style={{ background: 'var(--bg-paper)' }}>
        <Container>
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-4">
              <SectionLabel>TECHNICAL METHOD · 技术架构</SectionLabel>
              <h2 className="mt-4 mb-4">再用 8 个问题看它怎么被做出来</h2>
              <p className="m-0" style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
                产品 7 维回答用户体验，技术 8 维回答实现路径。所有技术判断都会区分官方确认、可信公开来源、功能推断和待核验内容。
              </p>
            </div>
            <div className="md:col-span-8">
              <div className="grid sm:grid-cols-2 gap-4">
                {techItems.map((item, i) => (
                  <div key={item.t} className="hairline rounded-md p-5" style={{ background: 'var(--bg-soft)' }}>
                    <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: 'var(--accent-blue)' }}>
                      TECH {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="m-0 mb-2" style={{ fontSize: '1rem' }}>{item.t}</h3>
                    <p className="m-0 text-[14px]" style={{ color: 'var(--ink-secondary)', lineHeight: 1.75 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 hairline-t" style={{ background: 'var(--bg-cool)' }}>
        <Container>
          <Reading>
            <SectionLabel>置信度的标定方式</SectionLabel>
            <h2 className="mt-4 mb-5">为什么每张卡片都标注"置信度"</h2>
            <p>我们不假装自己拥有完整信息。每一款产品我们都会清晰告知：观察室目前掌握的信息边界。</p>
            <ul>
              <li><strong>高：</strong>有官网、深度试用、创始人访谈或独立第三方资料作为交叉来源。</li>
              <li><strong>中：</strong>有官网与试用，但缺少长期使用数据或公开访谈。</li>
              <li><strong>低：</strong>主要基于官网与公开报道，没有亲自上手。</li>
              <li><strong>待核验：</strong>线索来源单一，尚未独立核验，谨慎阅读。</li>
            </ul>
          </Reading>
        </Container>
      </section>
    </main>
  );
}
