export function Footer() {
  return (
    <footer className="bg-[#2C3E50] py-10">
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div
          className="text-[#F9F7F3]/60 tracking-[0.2em]"
          style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem" }}
        >
          技术筑基 · 人文为核 · AI 赋能
        </div>
        <div
          className="text-[#F9F7F3]/40 tracking-wider"
          style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.78rem" }}
        >
          © 2026 Personal Narrative. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
