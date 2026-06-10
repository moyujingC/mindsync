import type { ChangeEvent, RefObject } from "react";
import {
  Activity,
  ClipboardCopy,
  History,
  Image as ImageIcon,
  Lock,
  Pencil,
  Replace,
  RotateCcw,
  Unlock,
} from "lucide-react";
import { Btn, COLORS, FoggyArt, Tag } from "./ui-kit";
import type { CardPlan } from "../content-planning";
import type {
  GeneratedImageItem,
  WorkbenchStatusMessage,
  WorkbenchTaskState,
} from "../workspace";
import { formatScopeLabel } from "./use-workbench-controller";

type KnowledgeCardStatus = {
  edited?: boolean;
  replaced?: boolean;
  regenerated?: boolean;
  needsRegeneration?: boolean;
  finalized?: boolean;
  updatedAt: string;
};

type StatusBadge = {
  label: string;
  tone: "blue" | "warm" | "success";
};

export function ResultRow({
  label,
  size,
  count,
}: {
  label: string;
  size: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: COLORS.textMid, fontSize: 12.5 }}>
        {label} <span style={{ color: COLORS.textFaint }}>· {count}</span>
      </span>
      <span style={{ color: COLORS.textFaint, fontSize: 11 }}>{size}</span>
    </div>
  );
}

export function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: COLORS.textFaint,
        fontSize: 10.5,
        letterSpacing: "0.14em",
      }}
    >
      {children}
    </div>
  );
}

export function KnowledgeCardResults({
  plannedCards,
  knowledgeSizeLabel,
  knowledgeAspectRatio,
  knowledgeImagesByCard,
  lockedKnowledgeCardIndexes,
  knowledgeCardStatuses,
  knowledgeCardHistories,
  regeneratingCardIndex,
  replaceCardInputRef,
  onReplaceInputChange,
  onToggleLock,
  onFinalize,
  onEdit,
  onRegenerate,
  onReplace,
  onRollback,
  onPreview,
}: {
  plannedCards: CardPlan[];
  knowledgeSizeLabel: string;
  knowledgeAspectRatio: string;
  knowledgeImagesByCard: Map<number, GeneratedImageItem>;
  lockedKnowledgeCardIndexes: number[];
  knowledgeCardStatuses: Record<string, KnowledgeCardStatus | undefined>;
  knowledgeCardHistories: Record<string, Array<unknown> | undefined>;
  regeneratingCardIndex: number | null;
  replaceCardInputRef: RefObject<HTMLInputElement | null>;
  onReplaceInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleLock: (cardIndex: number) => void;
  onFinalize: (cardIndex: number) => void;
  onEdit: (cardIndex: number) => void;
  onRegenerate: (cardIndex: number) => void;
  onReplace: (cardIndex: number) => void;
  onRollback: (cardIndex: number) => void;
  onPreview: (imageUrl: string, alt: string) => void;
}) {
  return (
    <div className="mt-2">
      <ResultRow
        label="小红书知识卡片"
        size={knowledgeSizeLabel}
        count={plannedCards.length}
      />
      <div className="grid grid-cols-4 gap-3 mt-2.5">
        <input
          ref={replaceCardInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onReplaceInputChange}
        />
        {plannedCards.map((card, index) => {
          const linkedImage = knowledgeImagesByCard.get(card.index);
          const locked = lockedKnowledgeCardIndexes.includes(card.index);
          const historyCount = knowledgeCardHistories[String(card.index)]?.length || 0;
          const statusBadges = buildStatusBadges(
            knowledgeCardStatuses[String(card.index)],
            locked
          );

          if (linkedImage) {
            return (
              <KnowledgeCardImageTile
                key={linkedImage.id}
                image={linkedImage}
                cardIndex={card.index}
                tileIndex={index}
                locked={locked}
                statusBadges={statusBadges}
                regenerating={regeneratingCardIndex === card.index}
                historyCount={historyCount}
                aspectRatio={knowledgeAspectRatio}
                onToggleLock={onToggleLock}
                onFinalize={onFinalize}
                onRegenerate={onRegenerate}
                onReplace={onReplace}
                onRollback={onRollback}
                onPreview={onPreview}
              />
            );
          }

          return (
            <KnowledgeCardDraftTile
              key={`${card.index}-${card.title}`}
              card={card}
              totalCards={plannedCards.length}
              tileIndex={index}
              locked={locked}
              statusBadges={statusBadges}
              historyCount={historyCount}
              aspectRatio={knowledgeAspectRatio}
              onToggleLock={onToggleLock}
              onFinalize={onFinalize}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onReplace={onReplace}
              onRollback={onRollback}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ControlTowerSidebar({
  currentArticleTitle,
  taskState,
  statusState,
  outputSummaries,
  latestGenerationTime,
  latestLogText,
  onOpenWechat,
}: {
  currentArticleTitle: string;
  taskState: WorkbenchTaskState;
  statusState: WorkbenchStatusMessage | null;
  outputSummaries: {
    knowledge: { label: string; modeText: string | null; valueText: string };
    quote: { label: string; modeText: string | null; valueText: string };
    cover: { label: string; modeText: string | null; valueText: string };
    inline: { label: string; modeText: string | null; valueText: string };
  };
  latestGenerationTime: string;
  latestLogText: string;
  onOpenWechat: () => void;
}) {
  return (
    <aside
      className="overflow-y-auto px-5 py-6 border-l flex flex-col"
      style={{ borderColor: COLORS.border, background: COLORS.surface }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          color: COLORS.textFaint,
          fontSize: 11,
          letterSpacing: "0.12em",
        }}
      >
        <span>CONTROL · 当前任务</span>
        <span
          className="flex items-center gap-1.5 px-1.5 rounded"
          style={{
            color: COLORS.blueDeep,
            background: "rgba(91,110,132,0.1)",
            fontSize: 10.5,
            height: 18,
            letterSpacing: "0.04em",
          }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: COLORS.blueDeep }}
          />
          LIVE
        </span>
      </div>

      <div
        className="mt-3 rounded-md overflow-hidden"
        style={{
          border: `1px solid ${COLORS.border}`,
          background: COLORS.surfaceAlt,
        }}
      >
        <div className="px-3.5 pt-3 pb-2.5">
          <div style={{ color: COLORS.text, fontSize: 13.5, lineHeight: 1.4 }}>
            {currentArticleTitle}
          </div>
          <div
            className="mt-1 flex items-center justify-between"
            style={{ color: COLORS.textFaint, fontSize: 11 }}
          >
            <span>{toDisplayPhase(taskState.phase)}</span>
            <span style={{ color: statusState?.level === "error" ? "#8A5A46" : COLORS.blueDeep }}>
              {taskState.totalTasks > 0
                ? `${taskState.completedTasks} / ${taskState.totalTasks}`
                : "—"}
            </span>
          </div>
        </div>
        <div
          style={{
            height: 3,
            background: "rgba(91,110,132,0.12)",
          }}
        >
          <div
            style={{
              height: "100%",
              width:
                taskState.totalTasks > 0
                  ? `${Math.max(
                      8,
                      Math.min(100, (taskState.completedTasks / taskState.totalTasks) * 100)
                    )}%`
                  : "8%",
              background: statusState?.level === "error" ? "#C4876E" : COLORS.blueDeep,
            }}
          />
        </div>
        <div
          className="px-3.5 py-1.5 flex items-center justify-between"
          style={{
            background: COLORS.pageBg,
            color: COLORS.textFaint,
            fontSize: 10.5,
            letterSpacing: "0.04em",
          }}
        >
          <span>{taskState.currentStepLabel || "等待任务"}</span>
          <span>
            {taskState.totalTasks > 0
              ? `${taskState.completedTasks} / ${taskState.totalTasks}`
              : "本轮暂无队列"}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <SmallLabel>本次输出</SmallLabel>
        <div
          className="mt-2 rounded-md"
          style={{
            background: COLORS.pageBg,
            border: `1px solid ${COLORS.borderSoft}`,
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.95,
          }}
        >
          {[
            outputSummaries.knowledge,
            outputSummaries.quote,
            outputSummaries.cover,
            outputSummaries.inline,
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <span
                className="flex items-baseline gap-1.5"
                style={{ color: COLORS.textMid }}
              >
                <span>{item.label}</span>
                {item.modeText ? (
                  <span style={{ color: COLORS.textFaint, fontSize: 10.5 }}>{item.modeText}</span>
                ) : null}
              </span>
              <span style={{ color: COLORS.text }} className="text-right">
                {item.valueText}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SmallLabel>当前挂载排版</SmallLabel>
        <div
          className="mt-2 rounded-md flex items-center gap-3 px-3 py-2.5"
          style={{
            background: COLORS.pageBg,
            border: `1px solid ${COLORS.borderSoft}`,
          }}
        >
          <FoggyArt
            hue={0}
            variant="grid"
            style={{ width: 28, height: 28, borderRadius: 5 }}
          />
          <div className="flex-1 min-w-0">
            <div
              className="flex items-center gap-1.5"
              style={{ color: COLORS.text, fontSize: 12.5 }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: COLORS.success }} />
              蓝雾静读版
            </div>
            <div style={{ color: COLORS.textFaint, fontSize: 10.5 }}>15 / 1.85 · #3F4754</div>
          </div>
          <button style={{ color: COLORS.textMuted, fontSize: 11 }} className="hover:underline">
            切换
          </button>
        </div>
      </div>

      <div className="mt-5">
        <Btn variant="primary" size="lg" block onClick={onOpenWechat}>
          <ClipboardCopy size={13} strokeWidth={1.6} />
          复制到公众号
        </Btn>
      </div>

      <div className="mt-auto pt-5">
        <SmallLabel>{taskState.lastError ? "最近失败点" : "最近一次动作"}</SmallLabel>
        <div
          className="mt-2 rounded px-3 py-2 flex items-center gap-2"
          style={{
            background: COLORS.pageBg,
            border: `1px solid ${COLORS.borderSoft}`,
            fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace',
            fontSize: 10.5,
          }}
        >
          <Activity
            size={11}
            strokeWidth={1.6}
            color={taskState.lastError ? "#C4876E" : COLORS.blue}
          />
          <span style={{ color: COLORS.textFaint }}>{latestGenerationTime}</span>
          <span style={{ color: COLORS.textMid }} className="truncate">
            {taskState.lastError
              ? `${formatScopeLabel(taskState.lastError.scope)} · ${taskState.lastError.text}`
              : latestLogText}
          </span>
        </div>
      </div>
    </aside>
  );
}

function toDisplayPhase(phase: WorkbenchTaskState["phase"]) {
  if (phase === "planning") return "拆解中";
  if (phase === "generating") return "出图中";
  if (phase === "completed") return "完成";
  if (phase === "failed") return "失败";
  return "待开始";
}

function buildStatusBadges(status: KnowledgeCardStatus | undefined, locked: boolean): StatusBadge[] {
  return [
    status?.finalized ? { label: "已定稿", tone: "success" as const } : null,
    status?.needsRegeneration ? { label: "需重生成", tone: "blue" as const } : null,
    status?.edited ? { label: "已编辑", tone: "warm" as const } : null,
    status?.replaced ? { label: "已替换", tone: "success" as const } : null,
    status?.regenerated ? { label: "已重生", tone: "blue" as const } : null,
    locked ? { label: "已锁定", tone: "warm" as const } : null,
  ].filter(Boolean) as StatusBadge[];
}

function KnowledgeCardImageTile({
  image,
  cardIndex,
  tileIndex,
  locked,
  statusBadges,
  regenerating,
  historyCount,
  aspectRatio,
  onToggleLock,
  onFinalize,
  onRegenerate,
  onReplace,
  onRollback,
  onPreview,
}: {
  image: GeneratedImageItem;
  cardIndex: number;
  tileIndex: number;
  locked: boolean;
  statusBadges: StatusBadge[];
  regenerating: boolean;
  historyCount: number;
  aspectRatio: string;
  onToggleLock: (cardIndex: number) => void;
  onFinalize: (cardIndex: number) => void;
  onRegenerate: (cardIndex: number) => void;
  onReplace: (cardIndex: number) => void;
  onRollback: (cardIndex: number) => void;
  onPreview: (imageUrl: string, alt: string) => void;
}) {
  return (
    <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${COLORS.borderSoft}` }}>
      <div className="relative">
        <img
          src={image.imageUrl}
          alt={`知识卡片 ${tileIndex + 1}`}
          onClick={() => onPreview(image.imageUrl, `知识卡片 ${tileIndex + 1}`)}
          style={{
            width: "100%",
            aspectRatio,
            objectFit: "cover",
            cursor: "zoom-in",
          }}
        />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            <Tag tone={locked ? "warm" : "blue"}>{locked ? "已锁定" : "已生成"}</Tag>
            {statusBadges
              .filter((badge) => badge.label !== "已锁定")
              .map((badge) => (
                <Tag key={badge.label} tone={badge.tone}>
                  {badge.label}
                </Tag>
              ))}
          </div>
          <div className="flex items-center gap-1">
            <IconActionButton
              title={locked ? "解锁卡片" : "锁定卡片"}
              icon={locked ? <Unlock size={12} strokeWidth={1.6} /> : <Lock size={12} strokeWidth={1.6} />}
              color={locked ? COLORS.warning : COLORS.textMid}
              onClick={() => onToggleLock(cardIndex)}
            />
            <IconActionButton
              title="设为定稿"
              icon={<ClipboardCopy size={12} strokeWidth={1.6} />}
              color={COLORS.success}
              onClick={() => onFinalize(cardIndex)}
            />
            <IconActionButton
              title="单张重生成"
              icon={<RotateCcw size={12} strokeWidth={1.6} />}
              disabled={regenerating}
              opacity={regenerating ? 0.55 : 1}
              onClick={() => onRegenerate(cardIndex)}
            />
            <IconActionButton
              title="替换为本地图片"
              icon={<Replace size={12} strokeWidth={1.6} />}
              onClick={() => onReplace(cardIndex)}
            />
            <IconActionButton
              title="回退上一版"
              icon={<History size={12} strokeWidth={1.6} />}
              disabled={historyCount === 0}
              opacity={historyCount === 0 ? 0.4 : 1}
              onClick={() => onRollback(cardIndex)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeCardDraftTile({
  card,
  totalCards,
  tileIndex,
  locked,
  statusBadges,
  historyCount,
  aspectRatio,
  onToggleLock,
  onFinalize,
  onEdit,
  onRegenerate,
  onReplace,
  onRollback,
}: {
  card: CardPlan;
  totalCards: number;
  tileIndex: number;
  locked: boolean;
  statusBadges: StatusBadge[];
  historyCount: number;
  aspectRatio: string;
  onToggleLock: (cardIndex: number) => void;
  onFinalize: (cardIndex: number) => void;
  onEdit: (cardIndex: number) => void;
  onRegenerate: (cardIndex: number) => void;
  onReplace: (cardIndex: number) => void;
  onRollback: (cardIndex: number) => void;
}) {
  const useBlueTheme = tileIndex % 2 === 0;

  return (
    <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${COLORS.borderSoft}` }}>
      <div
        className="p-3 flex flex-col justify-between"
        style={{
          aspectRatio,
          background: useBlueTheme
            ? "linear-gradient(160deg,#EEF2F6 0%,#D6DEE7 100%)"
            : "linear-gradient(160deg,#F1ECE3 0%,#DACFBE 100%)",
        }}
      >
        <div
          style={{
            color: useBlueTheme ? COLORS.blueDeep : "#7A6F5A",
            fontSize: 10,
            letterSpacing: "0.18em",
          }}
        >
          {String(card.index).padStart(2, "0")} / {String(totalCards).padStart(2, "0")}
        </div>
        <div
          style={{
            color: useBlueTheme ? "#2B3645" : "#3D3328",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            color: useBlueTheme ? "#566477" : "#6A5F4E",
            fontSize: 10.5,
            lineHeight: 1.45,
            marginTop: 6,
          }}
        >
          {card.summary}
        </div>
        {statusBadges.length > 0 ? (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            {statusBadges.map((badge) => (
              <Tag key={badge.label} tone={badge.tone}>
                {badge.label}
              </Tag>
            ))}
          </div>
        ) : null}
        {historyCount > 0 ? (
          <div className="mt-2" style={{ color: COLORS.textFaint, fontSize: 10.5 }}>
            可回退 {historyCount} 版
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => onToggleLock(card.index)}
            className="flex items-center gap-1"
            style={{ color: locked ? COLORS.warning : COLORS.textMuted, fontSize: 10.5 }}
          >
            {locked ? <Unlock size={11} strokeWidth={1.6} /> : <Lock size={11} strokeWidth={1.6} />}
            {locked ? "已锁定" : "锁定"}
          </button>
          <div className="flex items-center gap-2">
            <TextActionButton
              icon={<ClipboardCopy size={11} strokeWidth={1.6} />}
              onClick={() => onFinalize(card.index)}
            >
              定稿
            </TextActionButton>
            <TextActionButton icon={<Pencil size={11} strokeWidth={1.6} />} onClick={() => onEdit(card.index)}>
              编辑
            </TextActionButton>
            <TextActionButton
              icon={<RotateCcw size={11} strokeWidth={1.6} />}
              onClick={() => onRegenerate(card.index)}
            >
              重生成
            </TextActionButton>
            <TextActionButton icon={<Replace size={11} strokeWidth={1.6} />} onClick={() => onReplace(card.index)}>
              替换
            </TextActionButton>
            <TextActionButton
              icon={<History size={11} strokeWidth={1.6} />}
              disabled={historyCount === 0}
              opacity={historyCount === 0 ? 0.45 : 1}
              onClick={() => onRollback(card.index)}
            >
              回退
            </TextActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconActionButton({
  title,
  icon,
  color = COLORS.textMid,
  disabled,
  opacity = 1,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  color?: string;
  disabled?: boolean;
  opacity?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded flex items-center justify-center"
      style={{
        background: "rgba(251,250,247,0.88)",
        border: `1px solid ${COLORS.borderSoft}`,
        color,
        opacity,
      }}
      title={title}
    >
      {icon}
    </button>
  );
}

function TextActionButton({
  icon,
  children,
  disabled,
  opacity = 1,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  opacity?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1"
      style={{ color: COLORS.textMuted, fontSize: 10.5, opacity }}
    >
      {icon}
      {children}
    </button>
  );
}
