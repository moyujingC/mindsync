from __future__ import annotations

from app.core.mandala_interpretation_agent.contracts import ReportFollowupContext
from app.core.mandala_interpretation_agent.report_followup_context import (
    ReportFollowupContextStore,
    build_report_section_map,
)


def test_report_followup_context_store_round_trips_single_report_context(tmp_path):
    sections = build_report_section_map("# 报告标题\n\n开头。\n\n## 三圈观察\n内圈较稳。")
    context = ReportFollowupContext(
        report_id="report-1",
        report_mode="lite",
        final_report_md="# 报告标题\n\n开头。",
        report_sections=sections,
        recent_followup_turns=[{"role": "user", "content": "这段是什么意思？"}],
    )
    store = ReportFollowupContextStore(root_dir=tmp_path)

    path = store.write(context)
    restored = store.read("report-1")

    assert path.exists()
    assert restored is not None
    assert restored.report_id == "report-1"
    assert restored.report_sections[0].title == "报告标题"
    assert restored.recent_followup_turns[0]["role"] == "user"


def test_report_followup_context_store_preserves_persona_metadata(tmp_path):
    context = ReportFollowupContext(
        report_id="report-1",
        report_mode="lite",
        final_report_md="# 报告标题\n\n开头。",
    )
    store = ReportFollowupContextStore(root_dir=tmp_path)

    store.write(context)
    restored = store.read("report-1")

    assert restored is not None
    assert restored.persona.persona_id == "manman"
    assert restored.persona.display_name == "曼曼"


def test_report_followup_context_store_sanitizes_report_id(tmp_path):
    store = ReportFollowupContextStore(root_dir=tmp_path)
    context = ReportFollowupContext(report_id="../report-1", report_mode="lite")

    path = store.write(context)

    assert path.parent.parent == tmp_path
    assert ".." not in str(path.relative_to(tmp_path))
