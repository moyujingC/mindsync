import { useNavigate } from "react-router";
import { ArrowLeft, FileText } from "lucide-react";
import combLogoFlat from "figma:asset/dd21b372c423cb06578216b853db653316e94fcc.png";

export function ReportPlaceholder() {
  const navigate = useNavigate();

  return (
    <div
      className="size-full flex justify-center"
      style={{ backgroundColor: "#141E38" }}
    >
      <div
        className="w-full flex flex-col relative"
        style={{
          maxWidth: "480px",
          height: "100%",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        {/* Nav */}
        <div
          className="flex items-center px-4 py-3"
          style={{
            background:
              "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)",
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: "rgba(212,160,84,0.15)",
          }}
        >
          <button
            className="p-1"
            style={{ color: "rgba(232,220,200,0.5)" }}
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <img
              src={combLogoFlat}
              alt=""
              style={{ width: "20px", height: "20px", objectFit: "contain" }}
            />
            <span
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#D4A054",
              }}
            >
              解读报告
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-8"
          style={{
            background:
              "linear-gradient(180deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: "rgba(212,160,84,0.1)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "rgba(212,160,84,0.2)",
            }}
          >
            <FileText size={28} color="#D4A054" strokeWidth={1.5} />
          </div>

          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#E8DCC8",
              letterSpacing: "0.1em",
            }}
          >
            报告页面待设计
          </h2>
          <p
            className="mt-2 text-center"
            style={{
              fontSize: "14px",
              color: "rgba(232,220,200,0.5)",
              lineHeight: 1.6,
            }}
          >
            解读报告结果页将在后续迭代中完成
          </p>

          <button
            className="mt-8 px-8 py-3 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #9B4030 0%, #C87850 30%, #D4A054 60%, #C87850 85%, #9B4030 100%)",
              color: "#F5EFE2",
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.1em",
            }}
            onClick={() => navigate("/")}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
