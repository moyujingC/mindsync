import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from "react";

import brandPattern from "../assets/pattern.webp";
import type { MobileWebUploadDraft } from "../state";
import type { DetectCirclesResponse } from "../../shared/types";

export interface MobileWebUploadPageProps {
  draft: MobileWebUploadDraft;
  detection?: DetectCirclesResponse | null;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onContinue?: () => void;
  onBack?: () => void;
}

type ThemeItem = {
  value: string;
  label: string;
  subLabel: string;
  icon: IconNode[];
};

const DEFAULT_INNER_RADIUS = 0.35;
const DEFAULT_MIDDLE_RADIUS = 0.65;

function NavBackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.5 6.5L9 12L14.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="8" width="12" height="9" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8.5L10.2 6.8C10.6 6.2 11.2 5.9 11.9 5.9H12.1C12.8 5.9 13.4 6.2 13.8 6.8L15 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12.5" r="2.3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

type IconNode = ["path" | "circle" | "rect", Record<string, string>];

const ICON_CHECK: IconNode[] = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
const ICON_STAR: IconNode[] = [["path", { d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z", key: "r04s7s" }]];
const ICON_USER: IconNode[] = [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }],
];
const ICON_USERS: IconNode[] = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }],
];
const ICON_BABY: IconNode[] = [
  ["path", { d: "M9 12h.01", key: "157uk2" }],
  ["path", { d: "M15 12h.01", key: "1k8ypt" }],
  ["path", { d: "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5", key: "1u7htd" }],
  [
    "path",
    {
      d: "M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1",
      key: "5yv0yz",
    },
  ],
];
const ICON_COINS: IconNode[] = [
  ["circle", { cx: "8", cy: "8", r: "6", key: "3yglwk" }],
  ["path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18", key: "t5s6rm" }],
  ["path", { d: "M7 6h1v4", key: "1obek4" }],
  ["path", { d: "m16.71 13.88.7.71-2.82 2.82", key: "1rbuyh" }],
];
const ICON_HEART_PULSE: IconNode[] = [
  [
    "path",
    {
      d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
      key: "c3ymky",
    },
  ],
  ["path", { d: "M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27", key: "1uw2ng" }],
];
const ICON_SPROUT: IconNode[] = [
  ["path", { d: "M7 20h10", key: "e6iznv" }],
  ["path", { d: "M10 20c5.5-2.5.8-6.4 3-10", key: "161w41" }],
  [
    "path",
    {
      d: "M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z",
      key: "9gtqwd",
    },
  ],
  [
    "path",
    {
      d: "M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z",
      key: "bkxnd2",
    },
  ],
];
const ICON_BOOK_OPEN: IconNode[] = [
  ["path", { d: "M12 7v14", key: "1akyts" }],
  [
    "path",
    {
      d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      key: "ruj8y",
    },
  ],
];
const ICON_LOCK: IconNode[] = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }],
];
const ICON_LOADER: IconNode[] = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]];
const ICON_PENCIL: IconNode[] = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu",
    },
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }],
];

function LucideIcon({
  iconNode,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className,
  style,
}: {
  iconNode: IconNode[];
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {iconNode.map(([tag, attrs]) => {
        const { key, ...rest } = attrs;
        return tag === "path" || tag === "circle" || tag === "rect"
          ? (tag === "path"
            ? <path key={key} {...rest} />
            : tag === "circle"
              ? <circle key={key} {...rest} />
              : <rect key={key} {...rest} />
          )
          : null;
      })}
    </svg>
  );
}

const themes: ThemeItem[] = [
  { value: "wealth", label: "财富", subLabel: "议题", icon: ICON_COINS },
];

function UploadSlider({
  label,
  value,
  min,
  max,
  tone,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  tone: "gold" | "copper";
  onChange: (nextValue: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <label className={`am-upload-slider am-upload-slider--${tone}`}>
      <span className="am-upload-slider__label">{label}</span>
      <div className="am-upload-slider__track-wrap">
        <div className="am-upload-slider__track" />
        <div className="am-upload-slider__fill" style={{ width: `${percentage}%` }} />
        <div className="am-upload-slider__thumb" style={{ left: `calc(${percentage}% - 11px)` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <strong>{value}%</strong>
    </label>
  );
}

const MAX_TEXT_LENGTH = 300;

function buildBackgroundModel(data: Uint8ClampedArray, width: number, height: number) {
  const borderThickness = Math.max(8, Math.floor(Math.min(width, height) * 0.06));
  let borderRed = 0;
  let borderGreen = 0;
  let borderBlue = 0;
  let borderCount = 0;
  let borderVariance = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isBorder =
        x < borderThickness ||
        x >= width - borderThickness ||
        y < borderThickness ||
        y >= height - borderThickness;
      if (!isBorder) continue;

      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 10) continue;

      borderRed += data[index];
      borderGreen += data[index + 1];
      borderBlue += data[index + 2];
      borderCount += 1;
    }
  }

  const red = borderCount > 0 ? borderRed / borderCount : 245;
  const green = borderCount > 0 ? borderGreen / borderCount : 245;
  const blue = borderCount > 0 ? borderBlue / borderCount : 245;

  if (borderCount > 0) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const isBorder =
          x < borderThickness ||
          x >= width - borderThickness ||
          y < borderThickness ||
          y >= height - borderThickness;
        if (!isBorder) continue;

        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha < 10) continue;

        const deltaRed = data[index] - red;
        const deltaGreen = data[index + 1] - green;
        const deltaBlue = data[index + 2] - blue;
        borderVariance += deltaRed * deltaRed + deltaGreen * deltaGreen + deltaBlue * deltaBlue;
      }
    }
  }

  const borderStd = borderCount > 0 ? Math.sqrt(borderVariance / borderCount) : 20;
  const adaptiveDistance = Math.max(22, Math.min(68, borderStd * 1.8));

  return { red, green, blue, adaptiveDistance };
}

function isForegroundPixel(
  red: number,
  green: number,
  blue: number,
  alpha: number,
  background: { red: number; green: number; blue: number; adaptiveDistance: number },
) {
  const luma = 0.299 * red + 0.587 * green + 0.114 * blue;
  const rgbMax = Math.max(red, green, blue);
  const rgbMin = Math.min(red, green, blue);
  const saturation = rgbMax === 0 ? 0 : ((rgbMax - rgbMin) / rgbMax) * 255;
  const deltaRed = red - background.red;
  const deltaGreen = green - background.green;
  const deltaBlue = blue - background.blue;
  const backgroundDistance = Math.sqrt(
    deltaRed * deltaRed + deltaGreen * deltaGreen + deltaBlue * deltaBlue,
  );

  const isBackground =
    alpha < 10 ||
    (luma > 236 && saturation < 36) ||
    (luma > 200 && saturation < 26 && backgroundDistance < background.adaptiveDistance + 8) ||
    (backgroundDistance < background.adaptiveDistance && saturation < 42 && luma > 140);

  return !isBackground;
}

function TextInputField({
  placeholder,
  value: controlledValue,
  onChange,
}: {
  placeholder: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}) {
  const [internalValue, setInternalValue] = useState("");
  const [focused, setFocused] = useState(false);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const setValue = (nextValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(nextValue);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (event.target.value.length <= MAX_TEXT_LENGTH) {
      setValue(event.target.value);
      onChange?.(event);
    }
  };

  return (
    <div className={`am-upload-text-input${focused ? " is-focused" : ""}`}>
      {focused ? (
        <textarea
          autoFocus
          value={value}
          onChange={handleChange}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          maxLength={MAX_TEXT_LENGTH}
          className="am-upload-text-input__control am-upload-text-input__control--textarea"
        />
      ) : (
        <input
          type="text"
          value={value}
          readOnly
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="am-upload-text-input__control"
        />
      )}

      {focused ? (
        <span className="am-upload-text-input__count">
          {value.length}/{MAX_TEXT_LENGTH}字
        </span>
      ) : (
        <LucideIcon
          iconNode={ICON_PENCIL}
          size={16}
          strokeWidth={2}
          className="am-upload-text-input__icon"
        />
      )}
    </div>
  );
}

function ThemeSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (nextValue: string) => void;
}) {
  const normalizedValue = value === "wealth" ? value : themes[0].value;
  const [selected, setSelected] = useState(normalizedValue);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    if (normalizedValue !== selected) {
      setSelected(normalizedValue);
    }
  }, [normalizedValue, selected]);

  const updatePagination = () => {
    const container = scrollRef.current;
    if (!container) return;
    const viewportWidth = Math.max(container.clientWidth, 1);
    const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
    const nextPageCount = Math.max(1, Math.ceil(container.scrollWidth / viewportWidth));
    const nextDotIndex =
      nextPageCount <= 1 || maxScrollLeft <= 0
        ? 0
        : Math.round((container.scrollLeft / maxScrollLeft) * (nextPageCount - 1));
    setPageCount(nextPageCount);
    setActiveDotIndex(Math.max(0, Math.min(nextPageCount - 1, nextDotIndex)));
  };

  useEffect(() => {
    updatePagination();
    const onResize = () => updatePagination();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    updatePagination();
  }, [themes.length]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    if (container.scrollWidth <= container.clientWidth) return;
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startScrollLeft = container.scrollLeft;
    dragStateRef.current.moved = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 10) {
      dragStateRef.current.moved = true;
    }
    container.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    suppressNextClickRef.current = dragStateRef.current.moved;
    dragStateRef.current.pointerId = -1;
    window.setTimeout(() => {
      suppressNextClickRef.current = false;
    }, 120);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const selectedIndex = themes.findIndex((theme) => theme.value === selected);
    if (selectedIndex >= 0) {
      const selectedButton = container.children[selectedIndex] as HTMLElement | undefined;
      selectedButton?.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
    updatePagination();
  }, [selected]);

  return (
    <div className="am-theme-selector">
      <p className="am-theme-selector__title">
        当前解读主题 <span className="am-theme-selector__required">*</span>
      </p>

      <div
        ref={scrollRef}
        className="am-scrollbar-hide am-theme-selector__scroll"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onScroll={updatePagination}
      >
        {themes.map((theme) => {
          const isSelected = selected === theme.value;
          return (
            <button
              key={theme.value}
              type="button"
              className={`am-theme-selector__card${isSelected ? " is-active" : ""}`}
              onClick={(event) => {
                if (suppressNextClickRef.current) {
                  event.preventDefault();
                  return;
                }
                setSelected(theme.value);
                onChange?.(theme.value);
              }}
            >
              {isSelected ? <div className="am-theme-selector__glow" /> : null}

              {isSelected ? (
                <div className="am-theme-selector__check">
                  <LucideIcon iconNode={ICON_CHECK} size={10} strokeWidth={3} />
                </div>
              ) : null}

              <span className="am-theme-selector__icon">
                <LucideIcon
                  iconNode={theme.icon}
                  size={22}
                  strokeWidth={1.5}
                />
              </span>
              <span className="am-theme-selector__label">
                {theme.label}
              </span>
              <span className="am-theme-selector__sub">
                {theme.subLabel}
              </span>
            </button>
          );
        })}
      </div>

      <div className="am-theme-selector__dots">
        {Array.from({ length: pageCount }).map((_, index) => {
          const isSelected = activeDotIndex === index;
          return (
            <div
              key={`dot-${index}`}
              className={`am-theme-selector__dot${isSelected ? " is-active" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function BottomPanel({
  canContinue,
  isUploading,
  onContinue,
  onPrivacy,
}: {
  canContinue: boolean;
  isUploading: boolean;
  onContinue?: () => void;
  onPrivacy?: () => void;
}) {
  return (
    <div className="am-upload-bottom-panel">
      <button
        type="button"
        className="am-upload-bottom-cta"
        onClick={() => {
          if (!canContinue || isUploading) return;
          onContinue?.();
        }}
        disabled={!canContinue || isUploading}
      >
        {isUploading ? (
          <>
            <LucideIcon
              iconNode={ICON_LOADER}
              size={18}
              className="am-lucide-spin"
            />
            <span className="am-upload-bottom-cta__label">
              上传中...
            </span>
          </>
        ) : (
          <>
            <LucideIcon iconNode={ICON_BOOK_OPEN} size={18} />
            <span className="am-upload-bottom-cta__label">
              开始解读
            </span>
          </>
        )}
      </button>

      <div className="am-upload-bottom-panel__privacy">
        <LucideIcon iconNode={ICON_LOCK} size={11} className="am-upload-bottom-panel__lock" />
        <p className="am-upload-bottom-panel__copy">
          上传即表示您同意{" "}
          <button
            type="button"
            className="am-upload-bottom-panel__link"
            onClick={onPrivacy}
          >
            隐私政策
          </button>
          ，画作将被加密存储并仅用于解读
        </p>
      </div>
    </div>
  );
}

export function MobileWebUploadPage({
  draft,
  detection = null,
  environmentLabel,
  environmentDetail,
  environmentTone = "preview",
  onDraftChange,
  onContinue,
  onBack,
}: MobileWebUploadPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [previewImageScale, setPreviewImageScale] = useState(1);
  const [previewImageOffset, setPreviewImageOffset] = useState({ x: 0, y: 0 });
  const [guideImageScale, setGuideImageScale] = useState(1);
  const [guideImageOffset, setGuideImageOffset] = useState({ x: 0, y: 0 });
  const [isDraggingGuideImage, setIsDraggingGuideImage] = useState(false);
  const guideDragRef = useRef<{ x: number; y: number; baseX: number; baseY: number } | null>(null);
  const guideDiscRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!draft.browserFile) {
      setLocalPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(draft.browserFile);
    setLocalPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [draft.browserFile]);

  const previewSrc = localPreview || (draft.imagePath && !draft.imagePath.startsWith("/tmp/") ? draft.imagePath : null);
  const innerRadius = Math.round((draft.innerRadius ?? detection?.inner_radius ?? DEFAULT_INNER_RADIUS) * 100);
  const middleRadius = Math.round((draft.middleRadius ?? detection?.middle_radius ?? DEFAULT_MIDDLE_RADIUS) * 100);
  const canContinue = Boolean(draft.imagePath);

  const discStyle = {
    ["--am-upload-inner" as string]: `${innerRadius}%`,
    ["--am-upload-middle" as string]: `${middleRadius}%`,
  } as CSSProperties;
  const uploadPatternStyle = {
    ["--am-pattern-image" as string]: `url(${brandPattern})`,
  } as CSSProperties;

  useEffect(() => {
    if (!isGuideOpen) return;
    setGuideImageScale(previewImageScale);
    setGuideImageOffset(previewImageOffset);
    setIsDraggingGuideImage(false);
  }, [isGuideOpen, previewImageOffset, previewImageScale, previewSrc]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleSelectedFile = (file: File) => {
    onDraftChange?.({
      imagePath: file.name,
      browserFile: file,
      uploadAsset: null,
      innerRadius: DEFAULT_INNER_RADIUS,
      middleRadius: DEFAULT_MIDDLE_RADIUS,
    });
    setPreviewImageScale(1);
    setPreviewImageOffset({ x: 0, y: 0 });
    setIsDragOver(false);
    setIsGuideOpen(true);
  };

  const handleDiscClick = () => {
    openFileDialog();
  };

  const clampGuideScale = (value: number) => Math.max(0.3, Math.min(2.2, value));

  const applyGuideScale = (nextScale: number) => {
    const clamped = clampGuideScale(nextScale);
    if (guideImageScale <= 0) {
      setGuideImageScale(clamped);
      return;
    }
    const ratio = clamped / guideImageScale;
    setGuideImageScale(clamped);
    setGuideImageOffset((current) => ({
      x: current.x * ratio,
      y: current.y * ratio,
    }));
  };

  const handleGuidePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    event.preventDefault();
    guideDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      baseX: guideImageOffset.x,
      baseY: guideImageOffset.y,
    };
    setIsDraggingGuideImage(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGuidePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!guideDragRef.current) return;
    const deltaX = event.clientX - guideDragRef.current.x;
    const deltaY = event.clientY - guideDragRef.current.y;
    setGuideImageOffset({
      x: guideDragRef.current.baseX + deltaX,
      y: guideDragRef.current.baseY + deltaY,
    });
  };

  const handleGuidePointerEnd = (event: React.PointerEvent<HTMLImageElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    guideDragRef.current = null;
    setIsDraggingGuideImage(false);
  };

  const handleGuideWheel = (event: React.WheelEvent<HTMLImageElement>) => {
    event.preventDefault();
    const nextScale = guideImageScale + (event.deltaY < 0 ? 0.03 : -0.03);
    applyGuideScale(nextScale);
  };

  const exportGuideAdjustedFile = async (): Promise<File | null> => {
    const sourceFile = draft.browserFile;
    if (!sourceFile || !previewSrc) return null;

    const imageElement = await new Promise<HTMLImageElement | null>((resolve) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => resolve(null);
      nextImage.src = previewSrc;
    });
    if (!imageElement) return null;

    const outputSize = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputSize, outputSize);

    const baseContainScale = Math.min(
      outputSize / imageElement.naturalWidth,
      outputSize / imageElement.naturalHeight,
    );
    const drawWidth = imageElement.naturalWidth * baseContainScale * guideImageScale;
    const drawHeight = imageElement.naturalHeight * baseContainScale * guideImageScale;
    const guideSize = guideDiscRef.current?.getBoundingClientRect().width ?? 360;
    const scaleRatio = outputSize / Math.max(guideSize, 1);
    const drawX = outputSize / 2 - drawWidth / 2 + guideImageOffset.x * scaleRatio;
    const drawY = outputSize / 2 - drawHeight / 2 + guideImageOffset.y * scaleRatio;

    context.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);

    const getRoundnessEnhancedCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
      const size = source.width;
      const sourceContext = source.getContext("2d");
      if (!sourceContext) return source;
      const sourceImageData = sourceContext.getImageData(0, 0, size, size);
      const { data, width, height } = sourceImageData;
      const background = buildBackgroundModel(data, width, height);

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const alpha = data[index + 3];
          const isForeground = isForegroundPixel(red, green, blue, alpha, background);
          if (!isForeground) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      if (maxX < minX || maxY < minY) return source;

      const centerX = size / 2;
      const centerY = size / 2;
      const leftExtent = Math.max(1, centerX - minX);
      const rightExtent = Math.max(1, maxX - centerX);
      const topExtent = Math.max(1, centerY - minY);
      const bottomExtent = Math.max(1, maxY - centerY);

      const horizontalDiff = Math.abs(leftExtent - rightExtent);
      const verticalDiff = Math.abs(topExtent - bottomExtent);
      const diffThreshold = size * 0.015;
      if (horizontalDiff < diffThreshold && verticalDiff < diffThreshold) return source;

      const edgePadding = size * 0.03;
      const maxExtent = size / 2 - edgePadding;
      const targetX = Math.min(maxExtent, Math.max(leftExtent, rightExtent));
      const targetY = Math.min(maxExtent, Math.max(topExtent, bottomExtent));

      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
      const leftScale = clamp(targetX / leftExtent, 1, 1.2);
      const rightScale = clamp(targetX / rightExtent, 1, 1.2);
      const topScale = clamp(targetY / topExtent, 1, 1.2);
      const bottomScale = clamp(targetY / bottomExtent, 1, 1.2);

      const enhancedCanvas = document.createElement("canvas");
      enhancedCanvas.width = size;
      enhancedCanvas.height = size;
      const enhancedContext = enhancedCanvas.getContext("2d");
      if (!enhancedContext) return source;
      const output = enhancedContext.createImageData(size, size);
      const outputData = output.data;

      for (let index = 0; index < outputData.length; index += 4) {
        outputData[index] = 255;
        outputData[index + 1] = 255;
        outputData[index + 2] = 255;
        outputData[index + 3] = 255;
      }

      for (let y = 0; y < size; y += 1) {
        const deltaY = y - centerY;
        const sourceYScale = deltaY >= 0 ? bottomScale : topScale;
        const sourceY = centerY + deltaY / sourceYScale;
        const sourceYIndex = Math.round(sourceY);
        if (sourceYIndex < 0 || sourceYIndex >= size) continue;

        for (let x = 0; x < size; x += 1) {
          const deltaX = x - centerX;
          const sourceXScale = deltaX >= 0 ? rightScale : leftScale;
          const sourceX = centerX + deltaX / sourceXScale;
          const sourceXIndex = Math.round(sourceX);
          if (sourceXIndex < 0 || sourceXIndex >= size) continue;

          const sourceIndex = (sourceYIndex * size + sourceXIndex) * 4;
          const targetIndex = (y * size + x) * 4;
          outputData[targetIndex] = data[sourceIndex];
          outputData[targetIndex + 1] = data[sourceIndex + 1];
          outputData[targetIndex + 2] = data[sourceIndex + 2];
          outputData[targetIndex + 3] = data[sourceIndex + 3];
        }
      }

      enhancedContext.putImageData(output, 0, 0);
      return enhancedCanvas;
    };

    const normalizeForegroundToDisc = (source: HTMLCanvasElement): HTMLCanvasElement => {
      const size = source.width;
      const sourceContext = source.getContext("2d");
      if (!sourceContext) return source;
      const { data, width, height } = sourceContext.getImageData(0, 0, size, size);
      const background = buildBackgroundModel(data, width, height);

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const alpha = data[index + 3];
          const isForeground = isForegroundPixel(red, green, blue, alpha, background);
          if (!isForeground) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      if (maxX < minX || maxY < minY) return source;
      const foregroundCenterX = (minX + maxX) / 2;
      const foregroundCenterY = (minY + maxY) / 2;

      let maxRadius = 1;
      for (let y = minY; y <= maxY; y += 2) {
        for (let x = minX; x <= maxX; x += 2) {
          const index = (y * width + x) * 4;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const alpha = data[index + 3];
          const isForeground = isForegroundPixel(red, green, blue, alpha, background);
          if (!isForeground) continue;
          const dx = x - foregroundCenterX;
          const dy = y - foregroundCenterY;
          const radius = Math.sqrt(dx * dx + dy * dy);
          if (radius > maxRadius) maxRadius = radius;
        }
      }

      const targetCenterX = size / 2;
      const targetCenterY = size / 2;
      // 以上半径最长的方向为基准，让归一化后的主体更贴近圆盘边界，
      // 但仍保留极小安全边距避免最终显示时切边。
      const targetRadius = size * 0.502;
      const scale = Math.max(1, Math.min(1.8, targetRadius / maxRadius));

      const normalizedCanvas = document.createElement("canvas");
      normalizedCanvas.width = size;
      normalizedCanvas.height = size;
      const normalizedContext = normalizedCanvas.getContext("2d");
      if (!normalizedContext) return source;
      normalizedContext.fillStyle = "#ffffff";
      normalizedContext.fillRect(0, 0, size, size);
      normalizedContext.save();
      normalizedContext.translate(targetCenterX, targetCenterY);
      normalizedContext.scale(scale, scale);
      normalizedContext.translate(-foregroundCenterX, -foregroundCenterY);
      normalizedContext.drawImage(source, 0, 0);
      normalizedContext.restore();
      return normalizedCanvas;
    };

    const finalCanvas = normalizeForegroundToDisc(getRoundnessEnhancedCanvas(canvas));

    const blob = await new Promise<Blob | null>((resolve) => {
      finalCanvas.toBlob((nextBlob) => resolve(nextBlob), sourceFile.type || "image/jpeg", 0.95);
    });
    if (!blob) return null;

    const dotIndex = sourceFile.name.lastIndexOf(".");
    const baseName = dotIndex > 0 ? sourceFile.name.slice(0, dotIndex) : sourceFile.name;
    const extension = dotIndex > 0 ? sourceFile.name.slice(dotIndex) : ".jpg";

    return new File([blob], `${baseName}_guide_adjusted${extension}`, {
      type: blob.type || sourceFile.type || "image/jpeg",
      lastModified: Date.now(),
    });
  };

  return (
    <div className="am-page am-upload-page">
      <div className="am-upload-hero" style={uploadPatternStyle}>
        <div className="am-pattern-overlay" />

        <div className="am-upload-topbar">
          <button type="button" className="am-upload-back" onClick={onBack} aria-label="返回首页">
            <NavBackIcon />
          </button>
          <div className="am-upload-brandmark">
            <span>一镜一梳</span>
          </div>
          {environmentLabel ? (
            <div className={`am-dev-pill am-dev-pill--${environmentTone} am-dev-pill--upload`}>
              <strong>{environmentLabel}</strong>
              <span>{environmentDetail}</span>
            </div>
          ) : (
            <div className="am-upload-topbar__spacer" aria-hidden="true" />
          )}
        </div>

        <div className="am-upload-preview-zone">
          <div className="am-upload-disc-shell">
            <div className="am-upload-disc-shell__halo" />
            <div className="am-upload-disc-shell__rim" />
            <div className="am-upload-disc-shell__spark am-upload-disc-shell__spark--top" />
            <div className="am-upload-disc-shell__spark am-upload-disc-shell__spark--right" />
            <div className="am-upload-disc-shell__spark am-upload-disc-shell__spark--bottom" />
            <div className="am-upload-disc-shell__spark am-upload-disc-shell__spark--left" />
            <div
              className={`am-upload-disc${isDragOver ? " is-dragover" : ""}${previewSrc ? " has-image" : ""}`}
              style={discStyle}
              role="button"
              tabIndex={0}
              aria-label="上传画作"
              onClick={handleDiscClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleDiscClick();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  return;
                }
                setIsDragOver(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (!file) {
                  setIsDragOver(false);
                  return;
                }
                handleSelectedFile(file);
              }}
            >
              <div className="am-upload-disc__surface" />
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="曼陀罗预览"
                  className="am-upload-disc__image"
                  style={{
                    transform: `translate(${previewImageOffset.x}px, ${previewImageOffset.y}px) scale(${previewImageScale})`,
                  }}
                />
              ) : null}
              {!previewSrc ? (
                <button
                  type="button"
                  className="am-upload-disc__placeholder"
                  onClick={(event) => {
                    event.stopPropagation();
                    openFileDialog();
                  }}
                >
                  <span className="am-upload-disc__placeholder-icon"><UploadGlyph /></span>
                  <span className="am-upload-disc__placeholder-text">{isDragOver ? "释放以上传" : "点击上传"}</span>
                </button>
              ) : null}
              {previewSrc ? (
                <>
                  <div className="am-upload-disc__hover-mask" aria-hidden="true">
                    <div className="am-upload-disc__hover-copy">
                      <span className="am-upload-disc__placeholder-icon am-upload-disc__placeholder-icon--hover"><UploadGlyph /></span>
                      <span className="am-upload-disc__hover-text">点击更换图片</span>
                    </div>
                  </div>
                  <div className="am-upload-disc__rings" aria-hidden="true">
                    <span className="am-upload-disc__ring am-upload-disc__ring--inner" />
                    <span className="am-upload-disc__ring am-upload-disc__ring--middle" />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="am-hidden-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              handleSelectedFile(file);
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div className="am-upload-sliders">
          <UploadSlider
            label="内中圈分界线"
            value={innerRadius}
            min={10}
            max={82}
            tone="gold"
            onChange={(nextInner) => {
              const inner = Math.min(nextInner, middleRadius - 8);
              const nextMiddle = Math.max(inner + 8, middleRadius);
              onDraftChange?.({ innerRadius: inner / 100, middleRadius: nextMiddle / 100 });
            }}
          />
          <UploadSlider
            label="中外圈分界线"
            value={middleRadius}
            min={18}
            max={90}
            tone="copper"
            onChange={(nextMiddle) => {
              const middle = Math.max(nextMiddle, innerRadius + 8);
              const nextInner = Math.min(innerRadius, middle - 8);
              onDraftChange?.({ innerRadius: nextInner / 100, middleRadius: middle / 100 });
            }}
          />
        </div>

        <p className="am-upload-guidance">跟随你的直觉，调节三圈范围</p>
      </div>

      <div className="am-upload-bottom-sheet">
        <section className="am-upload-form-surface">
          <ThemeSelector
            value={draft.theme}
            onChange={(nextValue) => onDraftChange?.({ theme: nextValue })}
          />

          <div className="am-upload-form-stack">
            <TextInputField
              placeholder="记录绘画前设定的意图"
              value={draft.paintingIntention}
              onChange={(event) => onDraftChange?.({ paintingIntention: event.target.value })}
            />
            <TextInputField
              placeholder="记录绘画时的感受"
              value={draft.paintingFeeling}
              onChange={(event) => onDraftChange?.({ paintingFeeling: event.target.value })}
            />
          </div>

          <div className="am-upload-spacer" />
          <BottomPanel
            canContinue={canContinue}
            isUploading={false}
            onContinue={onContinue}
          />
        </section>
      </div>

      {isGuideOpen && previewSrc ? (
        <div className="am-upload-guide-overlay" role="dialog" aria-modal="true" aria-label="画作校准">
          <div className="am-upload-guide-copy">
            <p>第一步：拖动画作到画面中心</p>
            <p>第二步：调整画作到适合大小</p>
          </div>

          <div className="am-upload-guide-stage">
            <div ref={guideDiscRef} className="am-upload-guide-disc">
              <img
                src={previewSrc}
                alt="校准中的曼陀罗画作"
                className="am-upload-guide-disc__image"
                style={{
                  transform: `translate(${guideImageOffset.x}px, ${guideImageOffset.y}px) scale(${guideImageScale})`,
                  cursor: isDraggingGuideImage ? "grabbing" : "grab",
                }}
                draggable={false}
                onPointerDown={handleGuidePointerDown}
                onPointerMove={handleGuidePointerMove}
                onPointerUp={handleGuidePointerEnd}
                onPointerCancel={handleGuidePointerEnd}
                onPointerLeave={handleGuidePointerEnd}
                onWheel={handleGuideWheel}
              />
            </div>
            <div className="am-upload-guide-disc__rim" aria-hidden="true" />
            <div className="am-upload-guide-disc__cross" aria-hidden="true">
              <span />
              <span />
            </div>
          </div>

          <div className="am-upload-guide-zoom">
            <button
              type="button"
              className="am-upload-guide-zoom__button"
              onClick={() => applyGuideScale(guideImageScale - 0.02)}
            >
              -
            </button>
            <span className="am-upload-guide-zoom__value">{Math.round(guideImageScale * 100)}%</span>
            <button
              type="button"
              className="am-upload-guide-zoom__button"
              onClick={() => applyGuideScale(guideImageScale + 0.02)}
            >
              +
            </button>
            <button
              type="button"
              className="am-upload-guide-zoom__button am-upload-guide-zoom__button--reset"
              onClick={() => {
                setGuideImageScale(1);
                setGuideImageOffset({ x: 0, y: 0 });
              }}
            >
              重置
            </button>
          </div>

          <div className="am-upload-guide-actions">
            <button
              type="button"
              className="am-upload-guide-action am-upload-guide-action--secondary"
              onClick={() => {
                setIsGuideOpen(false);
                openFileDialog();
              }}
            >
              返回
            </button>
            <button
              type="button"
              className="am-upload-guide-action am-upload-guide-action--primary"
              onClick={async () => {
                const adjustedFile = await exportGuideAdjustedFile();
                if (adjustedFile) {
                  setPreviewImageScale(1);
                  setPreviewImageOffset({ x: 0, y: 0 });
                  onDraftChange?.({
                    imagePath: adjustedFile.name,
                    browserFile: adjustedFile,
                    uploadAsset: null,
                  });
                } else {
                  setPreviewImageScale(guideImageScale);
                  setPreviewImageOffset(guideImageOffset);
                }
                setIsGuideOpen(false);
              }}
            >
              下一步
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
