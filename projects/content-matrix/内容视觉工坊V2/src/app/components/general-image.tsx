import { useState } from "react";
import {
  Sparkles,
  Download,
  RefreshCw,
  FolderPlus,
  Plus,
  X,
  ChevronDown,
  Wand2,
  ArrowUpRight,
} from "lucide-react";
import { Btn, COLORS, FoggyArt, Tag, Divider } from "./ui-kit";
import { IMAGE_PURPOSES } from "../image-presets";
import {
  useWorkspace,
  type GenerationRecord,
} from "../workspace";

const STYLES = [
  { name: "蓝雾静读", hue: 0, variant: "mountain" },
  { name: "留白水墨", hue: 5, variant: "leaf" },
  { name: "暖灰晨间", hue: 1, variant: "circle" },
  { name: "薄雾林间", hue: 2, variant: "wave" },
  { name: "极简几何", hue: 3, variant: "grid" },
  { name: "柔光胶片", hue: 4, variant: "abstract" },
];

const RESULTS = [
  { hue: 0, variant: "mountain" },
  { hue: 0, variant: "wave" },
  { hue: 5, variant: "leaf" },
  { hue: 1, variant: "circle" },
];

export function GeneralImage() {
  const { currentArticle, setLatestGeneration, setActiveTab } = useWorkspace();
  const [purposeKey, setPurposeKey] = useState("xhs_card");
  const [presetKey, setPresetKey] = useState("xhs-1280");
  const [count, setCount] = useState(4);
  const [style, setStyle] = useState("蓝雾静读");
  const [prompt, setPrompt] = useState(
    "一座静山，雾色笼罩山脊，远处一盏暖灯。低饱和雾蓝主色，留白克制，单点光源，安静、疗愈。"
  );
  const [negativePrompt, setNegativePrompt] = useState(
    "高饱和、霓虹、HDR、卡通、文字"
  );
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(1706);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedRecord, setGeneratedRecord] = useState<GenerationRecord | null>(null);

  const purpose = IMAGE_PURPOSES.find((p) => p.k === purposeKey)!;
  const preset =
    purpose.presets.find((p) => p.k === presetKey) ?? purpose.presets[0];
  const shownImages = generatedRecord?.images ?? [];

  function resetPresetSize(nextPreset = preset) {
    setWidth(nextPreset.w);
    setHeight(nextPreset.h);
  }

  async function handleGenerateImages() {
    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleTitle: currentArticle.title,
          prompt,
          negativePrompt,
          width,
          height,
          count,
          purposeKey,
          purposeLabel: purpose.label,
          presetKey: preset.k,
          presetLabel: preset.label,
          styleName: style,
        }),
      });

      const payload = (await response.json()) as
        | GenerationRecord
        | { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.message || payload.error || "图片生成失败");
      }

      const record = payload as GenerationRecord;
      setGeneratedRecord(record);
      setLatestGeneration(record);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "图片生成失败");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-[340px_320px_1fr] h-full overflow-hidden">
      {/* LEFT — prompt */}
      <aside
        className="overflow-y-auto px-6 py-6 border-r"
        style={{ borderColor: COLORS.border, background: COLORS.pageBg }}
      >
        <div
          style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}
        >
          PROMPT
        </div>
        <div className="mt-1 mb-3" style={{ color: COLORS.text }}>
          提示词
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="w-full px-3 py-3 rounded-md outline-none resize-none"
          style={{
            height: 160,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text,
            fontSize: 13,
            lineHeight: 1.7,
          }}
        />
        <div
          className="mt-1 flex items-center justify-between"
          style={{ color: COLORS.textFaint, fontSize: 11 }}
        >
          <span>{prompt.length} / 500</span>
          <button className="flex items-center gap-1" style={{ color: COLORS.blue }}>
            <Wand2 size={11} strokeWidth={1.6} />
            优化提示词
          </button>
        </div>

        <div className="mt-4">
          <div
            className="mb-1.5"
            style={{ color: COLORS.textMid, fontSize: 12.5 }}
          >
            负面提示词
          </div>
          <input
            value={negativePrompt}
            onChange={(event) => setNegativePrompt(event.target.value)}
            className="w-full px-3 rounded-md outline-none"
            style={{
              height: 36,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textMid,
              fontSize: 12.5,
            }}
          />
        </div>

        <Divider />
        <div className="my-5" />

        <div
          style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}
        >
          OUTPUT
        </div>
        <div className="mt-1 mb-3" style={{ color: COLORS.text }}>
          尺寸与数量
        </div>

        {/* 1) Purpose */}
        <div
          className="mb-1.5"
          style={{ color: COLORS.textMid, fontSize: 12.5 }}
        >
          用途
        </div>
        <div className="relative mb-3">
          <select
            value={purposeKey}
            onChange={(e) => {
              const k = e.target.value;
              setPurposeKey(k);
              const next = IMAGE_PURPOSES.find((p) => p.k === k);
              if (next) {
                setPresetKey(next.presets[0].k);
                resetPresetSize(next.presets[0]);
              }
            }}
            className="w-full appearance-none px-3 pr-8 rounded-md outline-none"
            style={{
              height: 34,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.text,
              fontSize: 12.5,
            }}
          >
            {IMAGE_PURPOSES.map((p) => (
              <option key={p.k} value={p.k}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            strokeWidth={1.6}
            color={COLORS.textMuted}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>

        {/* 2) Presets — readable "用途 · 比例 · 尺寸" */}
        <div
          className="mb-1.5 flex items-center justify-between"
          style={{ color: COLORS.textMid, fontSize: 12.5 }}
        >
          <span>尺寸预设</span>
          <span style={{ color: COLORS.textFaint, fontSize: 11 }}>
            {purpose.presets.length} 个备选
          </span>
        </div>
        <div
          className="rounded-md overflow-hidden"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {purpose.presets.map((p, i, arr) => {
            const active = p.k === presetKey;
            const isDefault = i === 0;
            return (
              <button
                key={p.k}
                onClick={() => {
                  setPresetKey(p.k);
                  resetPresetSize(p);
                }}
                className="w-full flex items-center gap-2.5 px-3.5"
                style={{
                  height: 36,
                  borderBottom:
                    i === arr.length - 1
                      ? "none"
                      : `1px solid ${COLORS.borderSoft}`,
                  background: active ? "rgba(91,110,132,0.06)" : "transparent",
                }}
              >
                <span
                  className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    border: `1.4px solid ${
                      active ? COLORS.blueDeep : COLORS.textFaint
                    }`,
                  }}
                >
                  {active && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: COLORS.blueDeep }}
                    />
                  )}
                </span>
                <span
                  style={{
                    color: active ? COLORS.text : COLORS.textMid,
                    fontSize: 12.5,
                  }}
                  className="flex-1 text-left truncate"
                >
                  {p.label}
                </span>
                {isDefault && (
                  <Tag tone="muted">默认</Tag>
                )}
              </button>
            );
          })}
        </div>
        {purpose.hint && (
          <div
            className="mt-2 flex items-start gap-1.5"
            style={{ color: COLORS.textFaint, fontSize: 11, lineHeight: 1.6 }}
          >
            <Wand2
              size={11}
              strokeWidth={1.6}
              color={COLORS.blue}
              className="mt-0.5 shrink-0"
            />
            <span>{purpose.hint}</span>
          </div>
        )}

        {/* 3) Width / Height — auto-filled, editable */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <div
              className="mb-1"
              style={{ color: COLORS.textFaint, fontSize: 11 }}
            >
              宽
            </div>
            <input
              value={width}
              onChange={(event) => setWidth(Math.max(1, Number(event.target.value) || preset.w))}
              className="w-full px-3 rounded-md outline-none"
              style={{
                height: 32,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                fontSize: 12.5,
                fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace',
              }}
            />
          </div>
          <div>
            <div
              className="mb-1"
              style={{ color: COLORS.textFaint, fontSize: 11 }}
            >
              高
            </div>
            <input
              value={height}
              onChange={(event) => setHeight(Math.max(1, Number(event.target.value) || preset.h))}
              className="w-full px-3 rounded-md outline-none"
              style={{
                height: 32,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                fontSize: 12.5,
                fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace',
              }}
            />
          </div>
        </div>
        <div
          className="mt-1.5 flex items-center justify-between"
          style={{ color: COLORS.textFaint, fontSize: 11 }}
        >
          <span>比例 {preset.aspect} · 已自动填入</span>
          <button
            onClick={() => resetPresetSize()}
            style={{ color: COLORS.textMuted }}
          >
            恢复默认
          </button>
        </div>

        <div
          className="mt-5 mb-2"
          style={{ color: COLORS.textMid, fontSize: 12.5 }}
        >
          输出数量
        </div>
        <div
          className="flex items-center justify-between rounded-md px-2"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            height: 36,
          }}
        >
          <button
            onClick={() => setCount(Math.max(1, count - 1))}
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: COLORS.textMid }}
          >
            <X size={12} strokeWidth={1.6} className="rotate-45" />
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 4, 6, 9].map((n) => {
              const active = n === count;
              return (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className="w-7 h-6 rounded text-xs flex items-center justify-center"
                  style={{
                    background: active ? COLORS.blueDeep : "transparent",
                    color: active ? "#F5F7FA" : COLORS.textMid,
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCount(Math.min(9, count + 1))}
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: COLORS.textMid }}
          >
            <Plus size={13} strokeWidth={1.6} />
          </button>
        </div>

        <div className="mt-8">
          <Btn
            variant="primary"
            size="lg"
            block
            onClick={handleGenerateImages}
            disabled={isGenerating}
          >
            <Sparkles size={15} strokeWidth={1.6} />
            {isGenerating ? "生成中..." : "生成图片"}
          </Btn>
          <div
            className="mt-2.5 text-center"
            style={{ color: COLORS.textFaint, fontSize: 11 }}
          >
            预计 ≈ 24 秒 · 消耗 {count} 张额度
          </div>
          {errorMessage && (
            <div
              className="mt-3 rounded-md px-3 py-2"
              style={{
                background: "#FAF2EE",
                border: `1px solid #E8D8CF`,
                color: "#8A5A46",
                fontSize: 11.5,
                lineHeight: 1.6,
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>
      </aside>

      {/* MIDDLE — style + reference */}
      <section
        className="overflow-y-auto px-5 py-6 border-r"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}
      >
        <div
          style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}
        >
          STYLE
        </div>
        <div className="mt-1 mb-3" style={{ color: COLORS.text }}>
          风格选择
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {STYLES.map((s) => {
            const active = style === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setStyle(s.name)}
                className="rounded-md overflow-hidden text-left transition-all"
                style={{
                  border: `1.5px solid ${active ? COLORS.blueDeep : COLORS.border}`,
                  background: COLORS.surfaceAlt,
                }}
              >
                <FoggyArt
                  hue={s.hue}
                  variant={s.variant as any}
                  style={{ aspectRatio: "16/10" }}
                />
                <div
                  className="px-2.5 py-2 flex items-center justify-between"
                >
                  <span style={{ color: COLORS.text, fontSize: 12.5 }}>
                    {s.name}
                  </span>
                  {active && (
                    <span
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: COLORS.blueDeep }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#FBFAF7" }}
                      />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Divider />
        <div className="my-5" />

        <div
          style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}
        >
          REFERENCE
        </div>
        <div className="mt-1 mb-3 flex items-center justify-between">
          <span style={{ color: COLORS.text }}>参考图</span>
          <span style={{ color: COLORS.textFaint, fontSize: 11 }}>
            最多 3 张
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <FoggyArt
            hue={0}
            variant="mountain"
            style={{ aspectRatio: "1/1", borderRadius: 6 }}
          />
          <FoggyArt
            hue={2}
            variant="leaf"
            style={{ aspectRatio: "1/1", borderRadius: 6 }}
          />
          <button
            className="aspect-square rounded-md flex flex-col items-center justify-center gap-1"
            style={{
              border: `1.5px dashed ${COLORS.blueSoft}`,
              color: COLORS.blueDeep,
              background: COLORS.surfaceAlt,
            }}
          >
            <Plus size={16} strokeWidth={1.6} />
            <span style={{ fontSize: 11 }}>添加</span>
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div
            className="flex items-center justify-between"
            style={{ color: COLORS.textMid, fontSize: 12 }}
          >
            <span>风格强度</span>
            <span style={{ color: COLORS.text }}>0.65</span>
          </div>
          <div
            className="rounded-full"
            style={{
              height: 4,
              background: COLORS.borderSoft,
              position: "relative",
            }}
          >
            <div
              className="rounded-full"
              style={{
                height: "100%",
                width: "65%",
                background: COLORS.blueDeep,
              }}
            />
            <span
              className="absolute -top-1.5 rounded-full"
              style={{
                left: "63%",
                width: 14,
                height: 14,
                background: "#FBFAF7",
                border: `1.5px solid ${COLORS.blueDeep}`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span style={{ color: COLORS.textMid, fontSize: 12 }}>构图保留</span>
            <button
              className="flex items-center gap-1 px-2 rounded"
              style={{
                background: COLORS.borderSoft,
                color: COLORS.textMid,
                fontSize: 11.5,
                height: 24,
              }}
            >
              中等 <ChevronDown size={11} strokeWidth={1.6} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: COLORS.textMid, fontSize: 12 }}>色彩跟随</span>
            <button
              className="flex items-center gap-1 px-2 rounded"
              style={{
                background: COLORS.borderSoft,
                color: COLORS.textMid,
                fontSize: 11.5,
                height: 24,
              }}
            >
              强 <ChevronDown size={11} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT — results */}
      <section className="overflow-y-auto px-10 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div
              style={{
                color: COLORS.textFaint,
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              RESULTS
            </div>
            <div className="mt-1" style={{ color: COLORS.text, fontSize: 17 }}>
              出图结果
            </div>
            <div
              className="mt-0.5 flex items-center gap-2"
              style={{ color: COLORS.textFaint, fontSize: 12 }}
            >
              <Tag tone="muted">{preset.aspect}</Tag>
              <span>·</span>
              <span>{preset.label}</span>
              <span>·</span>
              <span>{style}</span>
              <span>·</span>
              <span>{count} 张</span>
            </div>
            {generatedRecord && (
              <div
                className="mt-1.5"
                style={{ color: COLORS.textFaint, fontSize: 11.5 }}
              >
                最近一次生成已回流到工作台结果区
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Btn
              variant="ghost"
              size="sm"
              onClick={handleGenerateImages}
              disabled={isGenerating}
            >
              <RefreshCw size={13} strokeWidth={1.6} />
              全部重生成
            </Btn>
            <Btn variant="secondary" size="sm">
              <Download size={13} strokeWidth={1.6} />
              全部下载
            </Btn>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {(shownImages.length > 0 ? shownImages : RESULTS).map((item, i) => (
            <div
              key={"id" in item ? item.id : i}
              className="rounded-lg overflow-hidden"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              {"imageUrl" in item ? (
                <img
                  src={item.imageUrl}
                  alt={`${generatedRecord?.title || currentArticle.title} ${i + 1}`}
                  style={{
                    aspectRatio: `${width} / ${height}`,
                    width: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <FoggyArt
                  hue={item.hue}
                  variant={item.variant as any}
                  style={{ aspectRatio: `${width} / ${height}` }}
                />
              )}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}
              >
                <div>
                  <div style={{ color: COLORS.text, fontSize: 12.5 }}>
                    出图 {i + 1}
                  </div>
                  <div style={{ color: COLORS.textFaint, fontSize: 11 }}>
                    {"id" in item ? item.id.slice(-8) : `89${i}24f`} · {width}×{height}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ color: COLORS.textMid }}
                    title="单张重生成"
                  >
                    <RefreshCw size={13} strokeWidth={1.6} />
                  </button>
                  <button
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ color: COLORS.textMid }}
                    title="下载"
                  >
                    <Download size={13} strokeWidth={1.6} />
                  </button>
                  <button
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ color: COLORS.textMid }}
                    title="加入素材库"
                  >
                    <FolderPlus size={13} strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-8 rounded-lg p-5 flex items-center gap-4"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            className="w-10 h-10 rounded flex items-center justify-center"
            style={{ background: COLORS.blueTint, color: COLORS.blueDeep }}
          >
            <Sparkles size={16} strokeWidth={1.6} />
          </div>
          <div className="flex-1">
            <div style={{ color: COLORS.text, fontSize: 13.5 }}>
              {generatedRecord ? "主链路已接通" : "想要继续微调？"}
            </div>
            <div
              style={{ color: COLORS.textFaint, fontSize: 12, marginTop: 2 }}
            >
              {generatedRecord
                ? "这次生成结果已经写入工作台，你可以回去继续封面、配图和排版流转。"
                : "基于已选图片可微调构图、光线与配色。"}
            </div>
          </div>
          <Btn
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab(generatedRecord ? "workbench" : "image")}
          >
            {generatedRecord ? (
              <>
                回到工作台
                <ArrowUpRight size={12} strokeWidth={1.6} />
              </>
            ) : (
              "进入微调"
            )}
          </Btn>
        </div>
      </section>
    </div>
  );
}
