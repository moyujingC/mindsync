import { Container, Reading, SectionLabel } from '../shared';

export function DisclaimerPage() {
  return (
    <main>
      <section className="pt-16 pb-10" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <Reading>
            <SectionLabel>DISCLAIMER · 免责声明</SectionLabel>
            <h1 className="mt-4 mb-5" style={{ fontSize: 'clamp(1.7rem, 2.8vw, 2.2rem)' }}>请在阅读本站内容前，了解以下边界。</h1>
            <p className="m-0" style={{ color: 'var(--ink-secondary)', lineHeight: 1.9 }}>
              本站为研究与观察项目，所有内容仅代表观察室基于公开信息形成的独立判断，不构成任何形式的医疗、心理、法律或投资建议。
            </p>
            <div className="mt-6 hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
              <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: 'var(--ink-tertiary)' }}>OFFICIAL STATEMENT</div>
              <p className="m-0" style={{ color: 'var(--ink-primary)', lineHeight: 1.9 }}>
                本站内容仅用于产品研究、学习和评论，不构成医疗建议、心理咨询建议或投资建议。第三方产品名称、商标、截图和图片归各自权利方所有。本站不代表与这些产品存在合作、授权或背书关系。
              </p>
            </div>
          </Reading>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <Reading className="prose-cn">
            <h2>一、关于心理健康内容</h2>
            <p>本站对 AI 心理疗愈产品的拆解，不能替代任何持证心理咨询师、临床心理学家、精神科医生的专业服务。如果你正在经历显著的心理困扰或心理危机，请优先联系本地的专业心理援助资源。</p>
            <blockquote>
              如果你或你身边的人正处于自伤或自杀的危险中：<br />
              · 中国大陆：北京心理危机研究与干预中心 010-82951332；希望24热线 400-161-9995。<br />
              · 其他地区：请第一时间联系当地紧急服务或心理热线。
            </blockquote>

            <h2>二、关于产品评价</h2>
            <ul>
              <li>本站对产品的判断基于公开资料、官网信息、试用体验与第三方报道，并不能代替读者自身的实际使用与判断。</li>
              <li>所有评价均标注置信度。置信度"低"或"待核验"的内容，请读者尤其谨慎对待。</li>
              <li>产品形态、功能、定价可能随时变化。每条产品信息均注明访问日期；过期信息以厂商最新公告为准。</li>
            </ul>

            <h2>三、关于图片与版权</h2>
            <ul>
              <li>首页与方法论页的环境图为温柔风格的研究室插图，用于氛围呈现。</li>
              <li>产品卡片图片为产品官网 OG、官网截图或 App Store 截图，仅用于研究与评论目的，所有权归原厂商所有。</li>
              <li>每张第三方图片均标注来源；如有权利方反馈，我们会尽快移除或替换。</li>
            </ul>

            <h2>四、关于商业关系</h2>
            <p>本站不接受厂商付费收录、付费置顶或付费撰稿。如未来与任何机构发生商业关系，将在显著位置披露。</p>

            <h2>五、最后</h2>
            <p>本声明可能不定期更新。最新版本以本页内容为准。如对本声明有任何疑问，请通过我发布这篇内容的渠道留言或联系。</p>
          </Reading>
        </Container>
      </section>
    </main>
  );
}
