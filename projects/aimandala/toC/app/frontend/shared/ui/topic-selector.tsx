import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type SharedTopicIconNode = [
  "path" | "circle" | "rect",
  Record<string, string>,
];

export interface SharedTopicSelectorOption {
  value: string;
  label: string;
  subLabel: string;
  icon: SharedTopicIconNode[];
}

const ICON_CHECK: SharedTopicIconNode[] = [
  ["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }],
];
const ICON_COINS: SharedTopicIconNode[] = [
  ["circle", { cx: "8", cy: "8", r: "6", key: "3yglwk" }],
  ["path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18", key: "t5s6rm" }],
  ["path", { d: "M7 6h1v4", key: "1obek4" }],
  ["path", { d: "m16.71 13.88.7.71-2.82 2.82", key: "1rbuyh" }],
];
const ICON_HEART: SharedTopicIconNode[] = [
  [
    "path",
    {
      d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
      key: "c3ymky",
    },
  ],
];
const ICON_USER: SharedTopicIconNode[] = [
  ["path", { d: "M18 21a6 6 0 0 0-12 0", key: "u1" }],
  ["circle", { cx: "12", cy: "8", r: "4", key: "u2" }],
];
const ICON_USERS: SharedTopicIconNode[] = [
  ["path", { d: "M16 21a4 4 0 0 0-8 0", key: "us1" }],
  ["circle", { cx: "12", cy: "9", r: "3", key: "us2" }],
  ["path", { d: "M22 21a4 4 0 0 0-3-3.87", key: "us3" }],
  ["path", { d: "M2 21a4 4 0 0 1 3-3.87", key: "us4" }],
];
const ICON_BABY: SharedTopicIconNode[] = [
  ["path", { d: "M9 12h6", key: "b1" }],
  ["path", { d: "M10 16h4", key: "b2" }],
  ["circle", { cx: "12", cy: "10", r: "5", key: "b3" }],
  ["path", { d: "M10 4.5c.8-1 2.2-1.5 3.5-1", key: "b4" }],
];
const ICON_USERS_ROUND: SharedTopicIconNode[] = [
  ["path", { d: "M2 21a8 8 0 0 1 12 0", key: "ur1" }],
  ["circle", { cx: "8", cy: "8", r: "4", key: "ur2" }],
  ["path", { d: "M14 21a6 6 0 0 1 8 0", key: "ur3" }],
  ["circle", { cx: "18", cy: "9", r: "3", key: "ur4" }],
];
const ICON_BRIEFCASE: SharedTopicIconNode[] = [
  ["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", key: "jecpp" }],
  [
    "rect",
    { width: "20", height: "14", x: "2", y: "6", rx: "2", key: "i6l2r4" },
  ],
];
const ICON_ACTIVITY: SharedTopicIconNode[] = [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse",
    },
  ],
];

export const sharedTopicSelectorOptions: SharedTopicSelectorOption[] = [
  { value: "wealth", label: "财富", subLabel: "关系", icon: ICON_COINS },
  {
    value: "intimate_relationship",
    label: "亲密",
    subLabel: "关系",
    icon: ICON_HEART,
  },
  {
    value: "mother_relationship",
    label: "母亲",
    subLabel: "关系",
    icon: ICON_USER,
  },
  {
    value: "father_relationship",
    label: "父亲",
    subLabel: "关系",
    icon: ICON_USERS,
  },
  {
    value: "parent_child_relationship",
    label: "亲子",
    subLabel: "关系",
    icon: ICON_BABY,
  },
  {
    value: "personal_growth",
    label: "人际",
    subLabel: "关系",
    icon: ICON_USERS_ROUND,
  },
  {
    value: "career_development",
    label: "事业",
    subLabel: "发展",
    icon: ICON_BRIEFCASE,
  },
  {
    value: "body_health",
    label: "身体",
    subLabel: "健康",
    icon: ICON_ACTIVITY,
  },
];

function LucideIcon({
  iconNode,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className,
  style,
}: {
  iconNode: SharedTopicIconNode[];
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
        return tag === "path" ? (
          <path key={key} {...rest} />
        ) : tag === "circle" ? (
          <circle key={key} {...rest} />
        ) : (
          <rect key={key} {...rest} />
        );
      })}
    </svg>
  );
}

export interface SharedTopicSelectorProps {
  prefix: string;
  options?: SharedTopicSelectorOption[];
  value?: string;
  title?: ReactNode;
  disabled?: boolean;
  onChange?: (nextValue: string) => void;
}

export function SharedTopicSelector({
  prefix,
  options = sharedTopicSelectorOptions,
  value,
  title,
  disabled = false,
  onChange,
}: SharedTopicSelectorProps) {
  const normalizedValue = options.some((option) => option.value === value)
    ? value
    : options[0]?.value;
  const [selected, setSelected] = useState(normalizedValue);
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

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    if (container.scrollWidth <= container.clientWidth) return;
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startScrollLeft = container.scrollLeft;
    dragStateRef.current.moved = false;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 10) {
      dragStateRef.current.moved = true;
    }
    container.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
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
    const selectedIndex = options.findIndex(
      (option) => option.value === selected,
    );
    if (selectedIndex >= 0) {
      const selectedButton = container.children[selectedIndex] as
        | HTMLElement
        | undefined;
      selectedButton?.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
  }, [options, selected]);

  return (
    <div className={prefix}>
      {title ? <p className={`${prefix}__title`}>{title}</p> : null}

      <div
        ref={scrollRef}
        className={`am-scrollbar-hide ${prefix}__scroll`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        {options.map((option) => {
          const isSelected = selected === option.value;
          const isAll = option.value === "all";
          return (
            <button
              key={option.value}
              type="button"
              className={`${prefix}__card${isSelected ? " is-active" : ""}${isAll ? " is-all" : ""}`}
              onClick={(event) => {
                if (disabled || suppressNextClickRef.current) {
                  event.preventDefault();
                  return;
                }
                setSelected(option.value);
                onChange?.(option.value);
              }}
              disabled={disabled}
            >
              {isSelected ? <div className={`${prefix}__glow`} /> : null}
              {isSelected ? (
                <div className={`${prefix}__check`}>
                  <LucideIcon iconNode={ICON_CHECK} size={10} strokeWidth={3} />
                </div>
              ) : null}
              <span className={`${prefix}__icon`}>
                <LucideIcon
                  iconNode={option.icon}
                  size={22}
                  strokeWidth={1.5}
                />
              </span>
              <span className={`${prefix}__label`}>{option.label}</span>
              <span className={`${prefix}__sub`}>{option.subLabel}</span>
            </button>
          );
        })}
      </div>

      <div className={`${prefix}__dots`}>
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <div
              key={`dot-${option.value}`}
              className={`${prefix}__dot${isSelected ? " is-active" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}
