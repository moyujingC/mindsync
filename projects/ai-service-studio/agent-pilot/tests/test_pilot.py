import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PILOT = Path(__file__).resolve().parents[1] / "bin" / "pilot.py"
SPEC = importlib.util.spec_from_file_location("pilot", PILOT)
pilot = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(pilot)


class PilotPolicyTests(unittest.TestCase):
    def test_research_task_is_read_only(self):
        result = pilot.classify({"id": "r1", "title": "整理公开内容的需求信号", "category": "research"})
        self.assertEqual(result["classification"], "research")
        self.assertFalse(result["approval_required"])

    def test_external_write_is_proposal_only(self):
        result = pilot.classify({"id": "w1", "title": "发送一条沟通邀请", "category": "service_follow_up"})
        self.assertEqual(result["classification"], "proposal_only")
        self.assertTrue(result["approval_required"])

    def test_sensitive_value_is_not_echoed(self):
        secret = "sk_this_should_not_appear_123456"
        result = pilot.classify({"id": "s1", "title": f"处理 {secret}"})
        rendered = json.dumps(result, ensure_ascii=False)
        self.assertEqual(result["classification"], "blocked_sensitive_data")
        self.assertNotIn(secret, rendered)

    def test_missing_title_requires_clarification(self):
        result = pilot.classify({"id": "m1", "context": "需要处理"})
        self.assertEqual(result["classification"], "needs_clarification")

    def test_write_is_disabled_by_default(self):
        command = [sys.executable, str(PILOT), "write", "--approved", "--confirm"]
        completed = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertEqual(completed.returncode, 2)
        self.assertIn("飞书适配器未启用", completed.stderr)

    def test_route_works_without_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "result.json"
            completed = subprocess.run(
                [sys.executable, str(PILOT), "route", "--output", str(output)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            result = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(result["mode"], "offline_simulation")
            self.assertEqual(len(result["results"]), 3)

    def test_gateway_without_key_falls_back_to_policy(self):
        config = {
            "mode": "gateway_test",
            "hermes_gateway": {
                "enabled": True,
                "base_url": "http://127.0.0.1:8642",
                "api_key_env": "NONEXISTENT_PILOT_GATEWAY_KEY",
            },
        }
        result, status = pilot.hermes_route({"id": "g1", "title": "整理公开资料", "category": "research"}, config)
        self.assertIsNone(result)
        self.assertIn("deterministic_policy_used", status)


if __name__ == "__main__":
    unittest.main()
