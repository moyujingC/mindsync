import { Mail, Github, BookOpen, Download } from "lucide-react";
import { Reveal } from "./Reveal";
import { Mandala } from "./Mandala";

const contacts = [
  { icon: Mail, label: "邮箱", value: "alinecui@qq.com", href: "mailto:alinecui@qq.com" },
  { icon: Github, label: "GitHub", value: "github.com/MindSyncHub", href: "https://github.com/MindSyncHub" },
  { icon: BookOpen, label: "公众号", value: "@墨予镜", href: "#" },
];

export function Contact() {
  return (
    <section id="contact" className="relative py-28 md:py-36 bg-[#2C3E50] overflow-hidden">
      <Mandala className="absolute -bottom-40 -left-40 w-[600px] h-[600px] pointer-events-none" opacity={0.08} />
      <Mandala className="absolute -top-40 -right-40 w-[500px] h-[500px] pointer-events-none" opacity={0.05} />
      <div className="relative max-w-4xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="text-center mb-14">
            <div className="text-xs tracking-[0.5em] text-[#C9A57A] mb-4" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              C H A P T E R &nbsp; 0 4
            </div>
            <h2
              className="text-[#F9F7F3]"
              style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 500 }}
            >
              联系我
            </h2>
            <div className="w-12 h-px bg-[#C9A57A] mx-auto mt-6" />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p
            className="max-w-2xl mx-auto text-center text-[#F9F7F3]/75 leading-[2.1] mb-14"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem" }}
          >
            期待交流 AI 产品从 0 到 1、业务流程 AI 化 / Agent 工作流落地、AI + 高信任服务场景的产品与解决方案机会。
            <br className="hidden md:inline" />
            建议优先通过邮箱联系我，我会尽快回复。
          </p>
        </Reveal>

        <Reveal delay={220}>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6 mb-14">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="group flex flex-col items-center text-center p-8 bg-white/[0.04] border border-[#F9F7F3]/10 hover:border-[#C9A57A]/60 hover:bg-white/[0.07] transition-all duration-500"
              >
                <c.icon className="w-6 h-6 text-[#C9A57A] mb-4 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
                <div
                  className="text-xs tracking-[0.3em] text-[#C9A57A] mb-2"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                >
                  {c.label}
                </div>
                <div
                  className="text-[#F9F7F3]/85 group-hover:text-[#C9A57A] transition-colors break-all"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.9rem" }}
                >
                  {c.value}
                </div>
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={320}>
          <div className="text-center">
            <a
              href="#"
              download
              className="group inline-flex items-center px-9 py-3.5 bg-[#8B5A2B] text-[#F9F7F3] tracking-[0.25em] hover:bg-[#C9A57A] hover:text-[#2C3E50] transition-all duration-500"
              style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.875rem" }}
            >
              <Download className="w-4 h-4 mr-3" strokeWidth={1.5} />
              下载我的简历
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
