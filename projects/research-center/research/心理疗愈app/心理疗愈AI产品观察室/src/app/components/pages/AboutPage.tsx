import { Container, Reading, SectionLabel, CTAButton } from '../shared';

export function AboutPage() {
  return (
    <main>
      <section className="pt-16 pb-10" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <Reading>
            <SectionLabel>ABOUT · 关于观察室</SectionLabel>
            <h1 className="mt-4 mb-5" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.4rem)' }}>一份个人研究项目：45 篇拆解，17 个产品，7 个赛道。</h1>
            <p className="m-0" style={{ color: 'var(--ink-secondary)', fontSize: '1.05rem', lineHeight: 1.9 }}>
              过去这段时间，我陆续整理了 45 篇 AI 心理疗愈产品的原始拆解文档。把重复、近似与停更的样本合并去重之后，剩下 17 个值得长期跟踪的产品、7 个我自己定义的赛道，以及 4 个用来打底的重点样本。
            </p>
            <p className="m-0 mt-4" style={{ color: 'var(--ink-secondary)', fontSize: '1.05rem', lineHeight: 1.9 }}>
              这是一份带创业视角的观察笔记：我关心 AI 在心理领域真实可做的事、做得通的商业模式，以及那些"听上去很美但需要继续核验"的部分。所有判断都尽量标注资料的可核验程度——置信度不是产品好坏评分。
            </p>
          </Reading>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <Reading className="prose-cn">
            <h2>我们写给谁</h2>
            <p>AI 产品创业者、产品经理、设计师，以及把心理学带进产品的研究者；正在认真做事的心理咨询师、疗愈师、教练；以及对 AI 心理健康产品保持深度兴趣的、克制的用户。</p>
            <h2>我们的取舍</h2>
            <ul>
              <li>不做产品排名，不做榜单营销，不接受厂商付费收录。</li>
              <li>每一段评价都标注来源与置信度，便于读者反驳与扩展。</li>
              <li>低频更新——内容沉淀比内容产能更重要。</li>
              <li>克制、安静、可信，是这个项目长期不变的语气。</li>
            </ul>
            <h2>编辑原则</h2>
            <blockquote>把"边界"写在产品语言、研究语言与读者关系里——这是我们对自己的最低要求。</blockquote>
            <p>我们尤其警惕两类内容：把"陪伴"写成"治疗"，把"AI 工具"写成"心理咨询师"。如果你在文中发现任何这类滑动，请直接来信指出。</p>
            <h2>联系</h2>
            <p>邮箱：<a href="mailto:hello@psy-ai-observatory.example">hello@psy-ai-observatory.example</a>（示例邮箱）<br />
            想推荐产品、纠错或合作研究，欢迎来信。我们读每一封。</p>
          </Reading>

          <div className="mt-12 flex gap-3 justify-center">
            <CTAButton to={{ name: 'method' }} variant="ghost">研究方法</CTAButton>
            <CTAButton to={{ name: 'disclaimer' }} variant="ghost">免责声明</CTAButton>
          </div>
        </Container>
      </section>
    </main>
  );
}
