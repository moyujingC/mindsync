import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { worksLinks } from "../worksLinks";

type NavItem =
  | { type: "anchor"; hash: string; label: string }
  | { type: "dropdown"; key: "roles" | "works"; label: string; hash: string };

const roleLinks = [
  { hash: "#role-ai-product-manager", label: "AI 产品经理" },
  { hash: "#role-ai-transformation-consultant", label: "AI 转型咨询顾问" },
  { hash: "#role-fde-ai-solution-engineer", label: "FDE / AI 解决方案工程师" },
];

const items: NavItem[] = [
  { type: "anchor", hash: "#story", label: "职业故事" },
  { type: "dropdown", key: "roles", hash: "#roles", label: "适配岗位" },
  { type: "dropdown", key: "works", hash: "#works", label: "作品集" },
  { type: "anchor", hash: "#abilities", label: "能力" },
  { type: "anchor", hash: "#contact", label: "联系我" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState<"roles" | "works" | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<"roles" | "works" | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const homeHref = (hash: string) => (isHome ? hash : "/");

  const scrollToRole = (hash: string) => {
    const scroll = () => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (!isHome) {
      navigate("/");
      window.setTimeout(scroll, 120);
      return;
    }

    scroll();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-[#F9F7F3]/75 border-b border-[#8B5A2B]/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif tracking-widest text-[#2C3E50] hover:text-[#8B5A2B] transition-colors"
          style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.05rem" }}
        >
          墨予镜
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          {items.map((item) => {
            if (item.type === "anchor") {
              return (
                <a
                  key={item.hash}
                  href={homeHref(item.hash)}
                  className="relative text-sm text-[#2C3E50]/80 hover:text-[#8B5A2B] transition-colors duration-300 group"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#8B5A2B] transition-all duration-300 group-hover:w-full" />
                </a>
              );
            }
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setDesktopDropdown(item.key)}
                onMouseLeave={() => setDesktopDropdown(null)}
              >
                <a
                  href={homeHref(item.hash)}
                  aria-expanded={desktopDropdown === item.key}
                  onClick={(event) => {
                    event.preventDefault();
                    setDesktopDropdown(desktopDropdown === item.key ? null : item.key);
                  }}
                  onFocus={() => setDesktopDropdown(item.key)}
                  className="relative text-sm text-[#2C3E50]/80 hover:text-[#8B5A2B] transition-colors duration-300 group inline-flex items-center"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                >
                  {item.label}
                  <span className="ml-1 text-[0.65rem] opacity-60">▾</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#8B5A2B] transition-all duration-300 group-hover:w-full" />
                </a>
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 ${
                    desktopDropdown === item.key
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-1"
                  }`}
                >
                  <div className="min-w-[240px] bg-[#F9F7F3]/95 backdrop-blur-md border border-[#8B5A2B]/15 shadow-[0_20px_50px_-25px_rgba(44,62,80,0.3)] py-2">
                    {item.key === "roles"
                      ? roleLinks.map((link) => (
                          <button
                            key={link.hash}
                            onClick={() => {
                              setDesktopDropdown(null);
                              scrollToRole(link.hash);
                            }}
                            className="block w-full text-left px-5 py-2.5 text-sm text-[#2C3E50]/85 hover:text-[#8B5A2B] hover:bg-[#8B5A2B]/5 transition-colors tracking-wider"
                            style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                          >
                            <span className="text-[#8B5A2B] mr-2">·</span>
                            {link.label}
                          </button>
                        ))
                      : worksLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setDesktopDropdown(null)}
                            className="block px-5 py-2.5 text-sm text-[#2C3E50]/85 hover:text-[#8B5A2B] hover:bg-[#8B5A2B]/5 transition-colors tracking-wider"
                            style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                          >
                            <span className="text-[#8B5A2B] mr-2">·</span>
                            {link.label}
                          </Link>
                        ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
        <button
          aria-label="menu"
          className="md:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5"
          onClick={() => setOpen(!open)}
        >
          <span className={`block w-5 h-px bg-[#2C3E50] transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`block w-5 h-px bg-[#2C3E50] transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-[#2C3E50] transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-[#F9F7F3]/95 backdrop-blur border-t border-[#8B5A2B]/10">
          <div className="px-6 py-4 flex flex-col gap-3">
            {items.map((item) => {
              if (item.type === "anchor") {
                return (
                  <a
                    key={item.hash}
                    href={homeHref(item.hash)}
                    onClick={() => setOpen(false)}
                    className="text-[#2C3E50] hover:text-[#8B5A2B] transition-colors py-1"
                    style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setMobileDropdown(mobileDropdown === item.key ? null : item.key)}
                    className="w-full flex items-center justify-between text-[#2C3E50] hover:text-[#8B5A2B] transition-colors py-1"
                    style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                  >
                    {item.label}
                    <span className={`text-xs transition-transform ${mobileDropdown === item.key ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {mobileDropdown === item.key && (
                    <div className="mt-2 pl-4 border-l border-[#8B5A2B]/20 flex flex-col gap-2">
                      {item.key === "roles"
                        ? roleLinks.map((link) => (
                            <button
                              key={link.hash}
                              onClick={() => {
                                setOpen(false);
                                scrollToRole(link.hash);
                              }}
                              className="text-left text-sm text-[#2C3E50]/80 hover:text-[#8B5A2B] transition-colors py-1"
                              style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                            >
                              {link.label}
                            </button>
                          ))
                        : worksLinks.map((link) => (
                            <Link
                              key={link.to}
                              to={link.to}
                              onClick={() => setOpen(false)}
                              className="text-sm text-[#2C3E50]/80 hover:text-[#8B5A2B] transition-colors py-1"
                              style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                            >
                              {link.label}
                            </Link>
                          ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
