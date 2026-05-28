"""Registry for Aimandala topic report prompt packs."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


AIMANDALA_ROOT = Path(__file__).resolve().parents[6]
TOPIC_REPORT_PACKS_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "20-疗愈体系"
    / "10-议题层"
    / "30-主议题报告包"
)
APP_ADAPTATION_ROOT = (
    AIMANDALA_ROOT / "docs" / "疗愈体系知识库" / "30-应用适配" / "10-aimandala"
)
GENERATED_PROMPT_PACKS_ROOT = Path(__file__).with_name("generated_prompt_packs")


COMMON_APP_ADAPTATION_FILES = [
    "01-解读与个案沟通流程.md",
    "02-解读报告组织规范.md",
    "03-解读报告生成最小规则.md",
    "04-Lite-Pro报告分流与交付口径.md",
    "05-报告任务定义.md",
    "07-报告语言风格指南.md",
]


@dataclass(frozen=True)
class TopicPromptPackConfig:
    topic_key: str
    theme_aliases: tuple[str, ...]
    label: str
    pack_id: str
    source_dir_name: str
    report_template_file: str

    @property
    def source_root(self) -> Path:
        return TOPIC_REPORT_PACKS_ROOT / self.source_dir_name

    @property
    def app_adaptation_files(self) -> list[str]:
        return [
            *COMMON_APP_ADAPTATION_FILES[:5],
            self.report_template_file,
            COMMON_APP_ADAPTATION_FILES[-1],
        ]


TOPIC_PROMPT_PACK_CONFIGS = [
    TopicPromptPackConfig(
        topic_key="wealth-relationship",
        theme_aliases=("wealth", "wealth_career"),
        label="财富关系",
        pack_id="wealth-reasoning-v1.0.0",
        source_dir_name="10-财富关系",
        report_template_file="06-财富关系议题解读报告模板.md",
    ),
    TopicPromptPackConfig(
        topic_key="intimate-relationship",
        theme_aliases=("intimate_relationship",),
        label="亲密关系",
        pack_id="intimate-relationship-reasoning-v1.0.0",
        source_dir_name="20-亲密关系",
        report_template_file="06b-亲密关系议题解读报告模板.md",
    ),
    TopicPromptPackConfig(
        topic_key="father-relationship",
        theme_aliases=("father_relationship",),
        label="父亲关系",
        pack_id="father-relationship-reasoning-v1.0.0",
        source_dir_name="30-父亲关系",
        report_template_file="06c-父亲关系议题解读报告模板.md",
    ),
    TopicPromptPackConfig(
        topic_key="mother-relationship",
        theme_aliases=("mother_relationship",),
        label="母亲关系",
        pack_id="mother-relationship-reasoning-v1.0.0",
        source_dir_name="40-母亲关系",
        report_template_file="06d-母亲关系议题解读报告模板.md",
    ),
    TopicPromptPackConfig(
        topic_key="parent-child-relationship",
        theme_aliases=("parent_child_relationship",),
        label="亲子关系",
        pack_id="parent-child-relationship-reasoning-v1.0.0",
        source_dir_name="50-亲子关系",
        report_template_file="06e-亲子关系议题解读报告模板.md",
    ),
    TopicPromptPackConfig(
        topic_key="interpersonal-relationship",
        theme_aliases=("interpersonal_relationship", "general_relationship"),
        label="人际关系",
        pack_id="interpersonal-relationship-reasoning-v1.0.0",
        source_dir_name="60-人际关系",
        report_template_file="06f-人际关系议题解读报告模板.md",
    ),
    TopicPromptPackConfig(
        topic_key="career-development",
        theme_aliases=("career_development",),
        label="事业发展",
        pack_id="career-development-reasoning-v1.0.0",
        source_dir_name="70-事业发展",
        report_template_file="06g-事业发展议题解读报告模板.md",
    ),
    TopicPromptPackConfig(
        topic_key="health-body",
        theme_aliases=("health_body", "health_wellness"),
        label="健康身体",
        pack_id="health-body-reasoning-v1.0.0",
        source_dir_name="80-健康身体",
        report_template_file="06h-健康身体议题解读报告模板.md",
    ),
]

TOPIC_CONFIG_BY_KEY = {config.topic_key: config for config in TOPIC_PROMPT_PACK_CONFIGS}
TOPIC_CONFIG_BY_PACK_ID = {config.pack_id: config for config in TOPIC_PROMPT_PACK_CONFIGS}
TOPIC_CONFIG_BY_THEME = {
    alias: config
    for config in TOPIC_PROMPT_PACK_CONFIGS
    for alias in config.theme_aliases
}


def get_topic_config(topic_key: str) -> TopicPromptPackConfig:
    try:
        return TOPIC_CONFIG_BY_KEY[topic_key]
    except KeyError as exc:
        raise ValueError(f"unsupported topic prompt pack: {topic_key}") from exc


def get_topic_config_for_theme(theme: str) -> TopicPromptPackConfig:
    normalized = (theme or "").strip()
    if normalized in TOPIC_CONFIG_BY_THEME:
        return TOPIC_CONFIG_BY_THEME[normalized]
    if normalized in TOPIC_CONFIG_BY_KEY:
        return TOPIC_CONFIG_BY_KEY[normalized]
    return TOPIC_CONFIG_BY_KEY["wealth-relationship"]


def get_topic_config_for_pack_id(pack_id: str) -> TopicPromptPackConfig:
    try:
        return TOPIC_CONFIG_BY_PACK_ID[pack_id]
    except KeyError as exc:
        raise ValueError(f"unsupported topic prompt pack id: {pack_id}") from exc
