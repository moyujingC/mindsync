"""
分层数据存储层

管理解读记录的分层存储，支持Lite生成和Pro升级
"""

import errno
import json
import threading
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

from .data_models import (
    InterpretationRecord,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
    StageProcessPackage,
    UpgradeHistory,
    GenerationStatus,
)


class UnsupportedInterpretationSchemaError(ValueError):
    """Raised when a stored interpretation uses an unsupported schema version."""


class InterpretationStore:
    """
    解读记录存储管理器

    管理分层数据的存储、检索和升级
    """

    # 数据保留期限（天）- 所有数据保留10年用于研究分析
    RAW_DATA_RETENTION_DAYS = 365 * 10
    FINAL_DATA_RETENTION_DAYS = 365 * 10  # layer_2和layer_4保留10年
    SUPPORTED_SCHEMA_VERSION = "v2.1"
    ATOMIC_WRITE_RETRIES = 1
    RETRYABLE_WRITE_ERRNOS = {errno.ENOENT, errno.EINVAL}
    _shared_io_locks: Dict[str, threading.RLock] = {}
    _shared_io_locks_guard = threading.Lock()

    def __init__(self, storage_dir: str = None):
        """
        初始化存储管理器

        Args:
            storage_dir: 存储目录，默认为项目根目录下的data/interpretations
        """
        if storage_dir is None:
            project_root = Path(__file__).parent.parent.parent.parent
            storage_dir = project_root / "data" / "interpretations"

        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # 内存缓存（用于活跃会话）
        self._cache: Dict[str, InterpretationRecord] = {}
        self._io_lock = self._get_shared_io_lock(self.storage_dir)

    @classmethod
    def _get_shared_io_lock(cls, storage_dir: Path) -> threading.RLock:
        """Share the same I/O lock across store instances targeting one directory."""

        key = str(storage_dir.expanduser().resolve())
        with cls._shared_io_locks_guard:
            existing = cls._shared_io_locks.get(key)
            if existing is not None:
                return existing
            lock = threading.RLock()
            cls._shared_io_locks[key] = lock
            return lock

    def _get_file_path(self, interpretation_id: str) -> Path:
        """获取记录文件路径"""
        return self.storage_dir / f"{interpretation_id}.json"

    def save(self, record: InterpretationRecord) -> None:
        """
        保存解读记录

        Args:
            record: 解读记录对象
        """
        # 更新缓存
        self._cache[record.interpretation_id] = record

        # 持久化到文件
        file_path = self._get_file_path(record.interpretation_id)
        self._write_json_file(file_path, record.to_dict())

    def load(self, interpretation_id: str) -> Optional[InterpretationRecord]:
        """
        加载解读记录

        Args:
            interpretation_id: 解读记录ID

        Returns:
            InterpretationRecord或None
        """
        # 先查缓存
        if interpretation_id in self._cache:
            return self._cache[interpretation_id]

        # 从文件加载
        file_path = self._get_file_path(interpretation_id)
        if not file_path.exists():
            return None

        try:
            data = self._read_json_file(file_path)

            record = self._dict_to_record(data)
            self._cache[interpretation_id] = record
            return record

        except Exception as e:
            print(f"加载解读记录失败: {e}")
            if isinstance(e, UnsupportedInterpretationSchemaError):
                raise
            return None

    def _dict_to_record(self, data: Dict) -> InterpretationRecord:
        """将字典转换为InterpretationRecord对象"""
        self._assert_supported_schema(data)
        record = InterpretationRecord(
            interpretation_id=data.get("interpretation_id", ""),
            schema_version=data.get("schema_version", ""),
            user_id=data.get("user_id", ""),
            image_hash=data.get("image_hash", ""),
            theme=data.get("theme", "general"),
            created_at=data.get("created_at", ""),
            image_url=data.get("image_url"),
            image_storage_backend=data.get("image_storage_backend"),
            image_storage_key=data.get("image_storage_key"),
            image_local_path=data.get("image_local_path"),
            image_local_expires_at=data.get("image_local_expires_at"),
            painting_intention=data.get("painting_intention"),
            painting_feeling=data.get("painting_feeling"),
            three_circles=data.get("three_circles"),
            three_circles_auto_detect=data.get("three_circles_auto_detect"),
            three_circles_user_adjusted=data.get("three_circles_user_adjusted", False),
            three_circles_adjust_history=data.get("three_circles_adjust_history", []),
            version_purchased=data.get("version_purchased", []),
            status=data.get("status", GenerationStatus.PENDING),
        )

        # Load the current stage-based process package first. Legacy layer fields
        # may still exist in archived records but are not the formal report input.
        if data.get("stage_process_package"):
            stage_data = data["stage_process_package"]
            record.stage_process_package = StageProcessPackage(
                payload=stage_data.get("payload", {})
                if isinstance(stage_data, dict)
                else {},
                created_at=stage_data.get("created_at", "")
                if isinstance(stage_data, dict)
                else "",
            )

        if data.get("layer_1_lite_draft"):
            record.layer_1_lite_draft = self._dict_to_layer1(data["layer_1_lite_draft"])

        if data.get("layer_2_lite_final"):
            record.layer_2_lite_final = self._dict_to_layer2(data["layer_2_lite_final"])

        if data.get("layer_3_pro_draft"):
            record.layer_3_pro_draft = self._dict_to_layer3(data["layer_3_pro_draft"])

        if data.get("layer_4_pro_final"):
            record.layer_4_pro_final = self._dict_to_layer4(data["layer_4_pro_final"])

        # 加载升级历史
        for history_data in data.get("upgrade_history", []):
            record.upgrade_history.append(
                UpgradeHistory(
                    from_version=history_data.get("from", ""),
                    to_version=history_data.get("to", ""),
                    price_diff=history_data.get("price_diff", 0.0),
                    at=history_data.get("at", ""),
                )
            )

        return record

    def _dict_to_layer1(self, data: Dict) -> Layer1LiteDraft:
        """字典转Layer1LiteDraft"""
        from .data_models import SixInsights

        layer = Layer1LiteDraft(
            description=data.get("description", ""),
            prompt_preview=data.get("prompt_preview", ""),
            title=data.get("title", ""),
            overall_impression=data.get("overall_impression", ""),
            visual_elements=data.get("visual_elements", ""),
            emotion_portrait=data.get("emotion_portrait", ""),
            pro_teaser=data.get("pro_teaser", ""),
            narrative_plan=data.get("narrative_plan", {}),
            experiment=data.get("experiment", {}),
            created_at=data.get("created_at", ""),
        )

        # 6个洞察
        si_data = data.get("six_insights", {})
        layer.six_insights = SixInsights(
            base=si_data.get("base", {}),
            contradiction=si_data.get("contradiction", {}),
            pattern=si_data.get("pattern", {}),
            defense=si_data.get("defense", {}),
            block=si_data.get("block", {}),
            light=si_data.get("light", {}),
        )

        story_data = data.get("story", {}) if isinstance(data.get("story"), dict) else {}
        for key in ("base", "contradiction", "pattern", "defense", "block", "light"):
            node = getattr(layer.story, key)
            value = story_data.get(key, {})
            if isinstance(value, dict):
                node.content = value.get("content", "")
                node.connector = value.get("connector")

        theme_data = (
            data.get("theme_insights", {})
            if isinstance(data.get("theme_insights"), dict)
            else {}
        )
        layer.theme_insights.scene = theme_data.get("scene", "")
        layer.theme_insights.impact = theme_data.get("impact", "")
        layer.theme_insights.awareness = theme_data.get("awareness", "")

        return layer

    def _dict_to_layer2(self, data: Dict) -> Layer2LiteFinal:
        """字典转Layer2LiteFinal"""
        return Layer2LiteFinal(
            description=data.get("description", ""),
            version=data.get("version", "1.6"),
            title=data.get("title", ""),
            overall_impression=data.get("overall_impression", ""),
            visual_elements_rendered=data.get("visual_elements_rendered", ""),
            emotion_portrait_rendered=data.get("emotion_portrait_rendered", ""),
            six_insights_rendered=data.get("six_insights_rendered", {}),
            experiment_rendered=data.get("experiment_rendered", ""),
            full_report_markdown=data.get("full_report_markdown", ""),
            created_at=data.get("created_at", ""),
        )

    def _dict_to_layer3(self, data: Dict) -> Layer3ProDraft:
        """字典转Layer3ProDraft"""
        return Layer3ProDraft(
            description=data.get("description", ""),
            prompt_preview=data.get("prompt_preview", ""),
            first_impression=data.get("first_impression", ""),
            core_insight_table=data.get("core_insight_table", {}),
            three_circles_detailed=data.get("three_circles_detailed", {}),
            micro_analysis_detailed=data.get("micro_analysis_detailed", {}),
            imbalance_confirmed=data.get("imbalance_confirmed", {}),
            root_cause=data.get("root_cause", {}),
            healing_suggestions=data.get("healing_suggestions", []),
            narrative_plan=data.get("narrative_plan", {}),
            created_at=data.get("created_at", ""),
        )

    def _dict_to_layer4(self, data: Dict) -> Layer4ProFinal:
        """字典转Layer4ProFinal"""
        return Layer4ProFinal(
            description=data.get("description", ""),
            full_report_markdown=data.get("full_report_markdown", ""),
            ai_qa_context=data.get("ai_qa_context", ""),
            created_at=data.get("created_at", ""),
        )

    def create_record(
        self, user_id: str, image_hash: str, theme: str = "general"
    ) -> InterpretationRecord:
        """
        创建新的解读记录

        Args:
            user_id: 用户ID
            image_hash: 图像哈希
            theme: 主题

        Returns:
            新的解读记录
        """
        record = InterpretationRecord(
            user_id=user_id,
            image_hash=image_hash,
            theme=theme,
            status=GenerationStatus.PENDING,
        )
        self.save(record)
        return record

    def upgrade_to_pro(
        self, interpretation_id: str, price_diff: float = 39.1
    ) -> Optional[InterpretationRecord]:
        """
        升级解读记录到Pro版本

        Args:
            interpretation_id: 解读记录ID
            price_diff: 差价

        Returns:
            更新后的记录或None
        """
        record = self.load(interpretation_id)
        if not record:
            return None

        if not record.can_upgrade_to_pro():
            raise ValueError("该记录无法升级到Pro版本")

        # 更新购买状态
        record.version_purchased.append("pro")

        # 记录升级历史
        record.upgrade_history.append(
            UpgradeHistory(
                from_version="lite",
                to_version="pro",
                price_diff=price_diff,
            )
        )

        self.save(record)
        return record

    def get_user_records(
        self, user_id: str, limit: Optional[int] = 10
    ) -> List[InterpretationRecord]:
        """
        获取用户的解读记录列表

        Args:
            user_id: 用户ID
            limit: 返回数量限制，None 表示不截断

        Returns:
            解读记录列表
        """
        records_by_id: Dict[str, InterpretationRecord] = {}

        for record in self._cache.values():
            if record.user_id == user_id:
                records_by_id[record.interpretation_id] = record

        for file_path in self.storage_dir.glob("*.json"):
            try:
                data = self._read_json_file(file_path, strict_schema=False)
                if not self._is_supported_schema(data):
                    continue

                if data.get("user_id") != user_id:
                    continue

                interpretation_id = data.get("interpretation_id", "")
                if interpretation_id in records_by_id:
                    continue

                record = self._dict_to_record(data)
                records_by_id[record.interpretation_id] = record

            except Exception:
                continue

        records = list(records_by_id.values())

        # 按创建时间排序，最新的在前
        records.sort(key=lambda r: r.created_at, reverse=True)
        if limit is None:
            return records
        return records[:limit]

    def cleanup_expired_data(self) -> int:
        """
        清理过期的草稿数据

        Returns:
            清理的记录数
        """
        cutoff_date = datetime.now() - timedelta(days=self.RAW_DATA_RETENTION_DAYS)
        cleaned_count = 0

        for file_path in self.storage_dir.glob("*.json"):
            try:
                data = self._read_json_file(file_path, strict_schema=False)
                if not self._is_supported_schema(data):
                    continue

                created_at = datetime.fromisoformat(data.get("created_at", ""))

                # 如果记录已过期且没有购买Pro，清理原始数据
                if created_at < cutoff_date and "pro" not in data.get(
                    "version_purchased", []
                ):
                    # 保留报告结构但清空 Lite 草稿详细内容。
                    if data.get("layer_1_lite_draft"):
                        data["layer_1_lite_draft"] = {"description": "数据已过期清理"}

                    self._write_json_file(file_path, data)

                    cleaned_count += 1

            except Exception:
                continue

        return cleaned_count

    def find_existing_interpretation(
        self, image_hash: str, user_id: str, theme: str
    ) -> Optional[InterpretationRecord]:
        """
        查找是否已有同一用户、同一作品的解读记录（无时间限制）

        用于弹窗提醒用户是否要重新解读

        Args:
            image_hash: 图像哈希
            user_id: 用户ID
            theme: 主题

        Returns:
            已有的解读记录或None
        """
        for file_path in self.storage_dir.glob("*.json"):
            try:
                data = self._read_json_file(file_path, strict_schema=False)
                if not self._is_supported_schema(data):
                    continue

                if (
                    data.get("image_hash") == image_hash
                    and data.get("user_id") == user_id
                    and data.get("theme") == theme
                    and data.get("stage_process_package")
                ):
                    return self._dict_to_record(data)

            except Exception:
                continue

        return None

    def _write_json_file(self, file_path: Path, payload: Dict) -> None:
        """Atomically persist JSON records to avoid partial reads during upgrades."""

        with self._io_lock:
            attempts_remaining = self.ATOMIC_WRITE_RETRIES + 1
            last_error: Optional[OSError] = None

            while attempts_remaining > 0:
                attempts_remaining -= 1
                temp_path = file_path.with_name(f"{file_path.name}.{uuid4().hex}.tmp")
                try:
                    try:
                        file_path.parent.mkdir(parents=True, exist_ok=True)
                    except FileExistsError:
                        if not file_path.parent.is_dir():
                            raise

                    with open(temp_path, "w", encoding="utf-8") as f:
                        json.dump(payload, f, ensure_ascii=False, indent=2)
                    temp_path.replace(file_path)
                    return
                except OSError as error:
                    last_error = error
                    try:
                        temp_path.unlink(missing_ok=True)
                    except OSError:
                        pass

                    if error.errno not in self.RETRYABLE_WRITE_ERRNOS:
                        raise
                    if attempts_remaining <= 0:
                        raise

            if last_error is not None:
                raise last_error

    def find_existing_record(
        self, image_hash: str, user_id: str, theme: str
    ) -> Optional[InterpretationRecord]:
        """Find any existing record for the same user/image/theme tuple."""

        for file_path in self.storage_dir.glob("*.json"):
            try:
                data = self._read_json_file(file_path, strict_schema=False)
                if not self._is_supported_schema(data):
                    continue

                if (
                    data.get("image_hash") == image_hash
                    and data.get("user_id") == user_id
                    and data.get("theme") == theme
                ):
                    return self._dict_to_record(data)

            except Exception:
                continue

        return None

    def check_cache_reuse(
        self,
        image_hash: str,
        user_id: str,
        theme: str,
        max_age_hours: Optional[int] = 24,
    ) -> Optional[InterpretationRecord]:
        """
        检查是否可以复用缓存的 stage 过程包

        Args:
            image_hash: 图像哈希
            user_id: 用户ID
            theme: 主题
            max_age_hours: 最大缓存时间（小时）。None 表示无时间限制

        Returns:
            可复用的记录或None
        """
        for file_path in self.storage_dir.glob("*.json"):
            try:
                data = self._read_json_file(file_path, strict_schema=False)
                if not self._is_supported_schema(data):
                    continue

                if (
                    data.get("image_hash") != image_hash
                    or data.get("user_id") != user_id
                    or data.get("theme") != theme
                    or not data.get("stage_process_package")
                ):
                    continue

                if max_age_hours is not None:
                    cutoff_date = datetime.now() - timedelta(hours=max_age_hours)
                    created_at = datetime.fromisoformat(data.get("created_at", ""))
                    if created_at < cutoff_date:
                        continue

                return self._dict_to_record(data)

            except Exception:
                continue

        return None

    def _read_json_file(
        self,
        file_path: Path,
        *,
        strict_schema: bool = True,
    ) -> Dict:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if strict_schema:
            self._assert_supported_schema(data)
        return data

    def _assert_supported_schema(self, data: Dict) -> None:
        if self._is_supported_schema(data):
            return
        schema_version = data.get("schema_version") or "legacy"
        raise UnsupportedInterpretationSchemaError(
            f"unsupported interpretation schema: {schema_version}; only {self.SUPPORTED_SCHEMA_VERSION} is supported"
        )

    def _is_supported_schema(self, data: Dict) -> bool:
        return data.get("schema_version") == self.SUPPORTED_SCHEMA_VERSION
