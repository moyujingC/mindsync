import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { worksLinks } from "../worksLinks";

type NavItem =
  | { type: "anchor"; hash: string; label: string }
  | { type: "dropdown"; label: string; hash: string };

const items: NavItem[] = [
  { type: "anchor", hash: "#story", label: "职业故事" },
  { type: "dropdown", hash: "#works", label: "作品集" },
  { type: "anchor", hash: "#abilities", label: "能力" },
  { type: "anchor", hash: "#contact", label: "联系我" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [worksOpen, setWorksOpen] = useState(false);
  const [mobileWorksOpen, setMobileWorksOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const homeHref = (hash: string) => (isHome ? hash : "/");

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
                onMouseEnter={() => setWorksOpen(true)}
                onMouseLeave={() => setWorksOpen(false)}
              >
                <a
                  href={homeHref(item.hash)}
                  className="relative text-sm text-[#2C3E50]/80 hover:text-[#8B5A2B] transition-colors duration-300 group inline-flex items-center"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                >
                  {item.label}
                  <span className="ml-1 text-[0.65rem] opacity-60">▾</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#8B5A2B] transition-all duration-300 group-hover:w-full" />
                </a>
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 ${
                    worksOpen
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-1"
                  }`}
                >
                  <div className="min-w-[220px] bg-[#F9F7F3]/95 backdrop-blur-md border border-[#8B5A2B]/15 shadow-[0_20px_50px_-25px_rgba(44,62,80,0.3)] py-2">
                    {worksLinks.map((w) => (
                      <Link
                        key={w.to}
                        to={w.to}
                        className="block px-5 py-2.5 text-sm text-[#2C3E50]/85 hover:text-[#8B5A2B] hover:bg-[#8B5A2B]/5 transition-colors tracking-wider"
                        style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                      >
                        <span className="text-[#8B5A2B] mr-2">·</span>
                        {w.label}
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
                    onClick={() => setMobileWorksOpen(!mobileWorksOpen)}
                    className="w-full flex items-center justify-between text-[#2C3E50] hover:text-[#8B5A2B] transition-colors py-1"
                    style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                  >
                    {item.label}
                    <span className={`text-xs transition-transform ${mobileWorksOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {mobileWorksOpen && (
                    <div className="mt-2 pl-4 border-l border-[#8B5A2B]/20 flex flex-col gap-2">
                      {worksLinks.map((w) => (
                        <Link
                          key={w.to}
                          to={w.to}
                          onClick={() => setOpen(false)}
                          className="text-sm text-[#2C3E50]/80 hover:text-[#8B5A2B] transition-colors py-1"
                          style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                        >
                          {w.label}
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
