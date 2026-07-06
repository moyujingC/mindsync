import { Mail, Github, BookOpen, Download, ExternalLink } from "lucide-react";
import { Reveal } from "./Reveal";
import { Mandala } from "./Mandala";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const contacts = [
  { icon: Mail, label: "邮箱", value: "alinecui@qq.com", href: "mailto:alinecui@qq.com" },
  { icon: Github, label: "GitHub", value: "github.com/MindSyncHub", href: "https://github.com/MindSyncHub" },
  { icon: ExternalLink, label: "小红书", value: "墨予镜", href: "https://xhslink.com/m/7VPwpjmF501" },
];

const opportunityFocus = ["AI 产品从 0 到 1", "业务流程 AI 化 / Agent 工作流", "AI + 高信任服务场景解决方案"];

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
          <div className="max-w-3xl mx-auto text-center mb-14" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            <p className="text-[#F9F7F3]/78 leading-[1.9]" style={{ fontSize: "1rem" }}>
              如果你的团队正在推进这些方向，欢迎联系我。
            </p>
            <div className="grid md:grid-cols-3 gap-3 mt-6">
              {opportunityFocus.map((item) => (
                <div key={item} className="border-y border-[#C9A57A]/25 py-3 px-4">
                  <p className="text-[#F9F7F3]/88 leading-[1.7]" style={{ fontSize: "0.92rem" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[#F9F7F3]/68 leading-[1.8]" style={{ fontSize: "0.92rem" }}>
              首选邮箱沟通：
              <a href="mailto:alinecui@qq.com" className="text-[#C9A57A] hover:text-[#F9F7F3] transition-colors">
                alinecui@qq.com
              </a>
            </p>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-14">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noreferrer" : undefined}
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
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="group flex flex-col items-center text-center p-8 bg-white/[0.04] border border-[#F9F7F3]/10 hover:border-[#C9A57A]/60 hover:bg-white/[0.07] transition-all duration-500"
                >
                  <BookOpen className="w-6 h-6 text-[#C9A57A] mb-4 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
                  <div
                    className="text-xs tracking-[0.3em] text-[#C9A57A] mb-2"
                    style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                  >
                    公众号
                  </div>
                  <div
                    className="text-[#F9F7F3]/85 group-hover:text-[#C9A57A] transition-colors"
                    style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.9rem" }}
                  >
                    墨予镜
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="border-[#C9A57A]/35 bg-[#F9F7F3] text-[#2C3E50] sm:max-w-sm">
                <DialogTitle
                  className="text-center text-[#2C3E50]"
                  style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 500 }}
                >
                  微信公众号：墨予镜
                </DialogTitle>
                <DialogDescription
                  className="text-center text-[#2C3E50]/68"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                >
                  微信扫码关注，或在微信内搜索「墨予镜」。
                </DialogDescription>
                <div className="mx-auto mt-2 w-full max-w-[258px] overflow-hidden border border-[#2C3E50]/10 bg-white p-3">
                  <img
                    src="/moyujing-wechat-qrcode.jpg"
                    alt="微信公众号墨予镜二维码"
                    className="block h-auto w-full"
                    width={258}
                    height={258}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <div className="text-center">
            <a
              href="/cui-xing-resume.pdf"
              download="崔兴-AI产品经理版简历.pdf"
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
