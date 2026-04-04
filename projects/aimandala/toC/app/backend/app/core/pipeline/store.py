"""
分层数据存储层

管理解读记录的分层存储，支持Lite生成和Pro升级
"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from pathlib import Path

from .data_models import (
    InterpretationRecord,
    Layer0Raw,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
    UpgradeHistory,
    GenerationStatus,
)


class InterpretationStore:
    """
    解读记录存储管理器

    管理分层数据的存储、检索和升级
    """

    # 数据保留期限（天）- 所有数据保留10年用于研究分析
    RAW_DATA_RETENTION_DAYS = 365 * 10  # layer_0和layer_1保留10年
    FINAL_DATA_RETENTION_DAYS = 365 * 10  # layer_2和layer_4保留10年

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
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(record.to_dict(), f, ensure_ascii=False, indent=2)

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
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            record = self._dict_to_record(data)
            self._cache[interpretation_id] = record
            return record

        except Exception as e:
            print(f"加载解读记录失败: {e}")
            return None

    def _dict_to_record(self, data: Dict) -> InterpretationRecord:
        """将字典转换为InterpretationRecord对象"""
        record = InterpretationRecord(
            interpretation_id=data.get("interpretation_id", ""),
            user_id=data.get("user_id", ""),
            image_hash=data.get("image_hash", ""),
            theme=data.get("theme", "general"),
            created_at=data.get("created_at", ""),
            painting_intention=data.get("painting_intention"),
            painting_feeling=data.get("painting_feeling"),
            three_circles=data.get("three_circles"),
            three_circles_auto_detect=data.get("three_circles_auto_detect"),
            three_circles_user_adjusted=data.get("three_circles_user_adjusted", False),
            three_circles_adjust_history=data.get("three_circles_adjust_history", []),
            version_purchased=data.get("version_purchased", []),
            status=data.get("status", GenerationStatus.PENDING),
        )

        # 加载五层数据
        if data.get("layer_0_raw"):
            record.layer_0_raw = self._dict_to_layer0(data["layer_0_raw"])

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

    def _dict_to_layer0(self, data: Dict) -> Layer0Raw:
        """字典转Layer0Raw"""
        from .data_models import FiveElementsData, ThreeCirclesData, MicroAnalysisData

        layer = Layer0Raw(
            description=data.get("description", ""),
            imbalance_candidates=data.get("imbalance_candidates", []),
            color_analysis=data.get("color_analysis", {}),
            created_at=data.get("created_at", ""),
        )

        # 五行数据
        fe_data = data.get("five_elements", {})
        layer.five_elements = FiveElementsData(
            wood=fe_data.get("wood", {}),
            fire=fe_data.get("fire", {}),
            earth=fe_data.get("earth", {}),
            metal=fe_data.get("metal", {}),
            water=fe_data.get("water", {}),
        )

        # 三圈数据
        tc_data = data.get("three_circles", {})
        layer.three_circles = ThreeCirclesData(
            inner=tc_data.get("inner", {}),
            middle=tc_data.get("middle", {}),
            outer=tc_data.get("outer", {}),
        )

        # 微观关系
        ma_data = data.get("micro_analysis", {})
        layer.micro_analysis = MicroAnalysisData(
            adjacent=ma_data.get("adjacent", []),
            wrap=ma_data.get("wrap", []),
        )

        return layer

    def _dict_to_layer1(self, data: Dict) -> Layer1LiteDraft:
        """字典转Layer1LiteDraft"""
        from .data_models import SixInsights

        layer = Layer1LiteDraft(
            description=data.get("description", ""),
            title=data.get("title", ""),
            overall_impression=data.get("overall_impression", ""),
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

        return layer

    def _dict_to_layer2(self, data: Dict) -> Layer2LiteFinal:
        """字典转Layer2LiteFinal"""
        return Layer2LiteFinal(
            description=data.get("description", ""),
            title=data.get("title", ""),
            overall_impression=data.get("overall_impression", ""),
            six_insights_rendered=data.get("six_insights_rendered", {}),
            experiment_rendered=data.get("experiment_rendered", ""),
            full_report_markdown=data.get("full_report_markdown", ""),
            created_at=data.get("created_at", ""),
        )

    def _dict_to_layer3(self, data: Dict) -> Layer3ProDraft:
        """字典转Layer3ProDraft"""
        return Layer3ProDraft(
            description=data.get("description", ""),
            first_impression=data.get("first_impression", ""),
            core_insight_table=data.get("core_insight_table", {}),
            three_circles_detailed=data.get("three_circles_detailed", {}),
            micro_analysis_detailed=data.get("micro_analysis_detailed", {}),
            imbalance_confirmed=data.get("imbalance_confirmed", {}),
            root_cause=data.get("root_cause", {}),
            healing_suggestions=data.get("healing_suggestions", []),
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
        records = []

        for file_path in self.storage_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if data.get("user_id") == user_id:
                    record = self._dict_to_record(data)
                    records.append(record)

            except Exception:
                continue

        # 按创建时间排序，最新的在前
        records.sort(key=lambda r: r.created_at, reverse=True)
        if limit is None:
            return records
        return records[:limit]

    def cleanup_expired_data(self) -> int:
        """
        清理过期的原始数据（layer_0和layer_1）

        Returns:
            清理的记录数
        """
        cutoff_date = datetime.now() - timedelta(days=self.RAW_DATA_RETENTION_DAYS)
        cleaned_count = 0

        for file_path in self.storage_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                created_at = datetime.fromisoformat(data.get("created_at", ""))

                # 如果记录已过期且没有购买Pro，清理原始数据
                if created_at < cutoff_date and "pro" not in data.get(
                    "version_purchased", []
                ):
                    # 保留分层结构但清空layer_0和layer_1的详细内容
                    if data.get("layer_0_raw"):
                        data["layer_0_raw"] = {"description": "数据已过期清理"}
                    if data.get("layer_1_lite_draft"):
                        data["layer_1_lite_draft"] = {"description": "数据已过期清理"}

                    with open(file_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)

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
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if (
                    data.get("image_hash") == image_hash
                    and data.get("user_id") == user_id
                    and data.get("theme") == theme
                    and data.get("layer_0_raw")
                ):
                    return self._dict_to_record(data)

            except Exception:
                continue

        return None

    def find_existing_record(
        self, image_hash: str, user_id: str, theme: str
    ) -> Optional[InterpretationRecord]:
        """Find any existing record for the same user/image/theme tuple."""

        for file_path in self.storage_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

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
        检查是否可以复用缓存的layer_0数据

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
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if (
                    data.get("image_hash") != image_hash
                    or data.get("user_id") != user_id
                    or data.get("theme") != theme
                    or not data.get("layer_0_raw")
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
