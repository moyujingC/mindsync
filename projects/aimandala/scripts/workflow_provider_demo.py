#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
工作流（状态机） × Provider（模型适配层）协作演示

    运行方式：  python3 workflow_provider_demo.py
    依赖：      无（不需要任何 API Key，用的是可编排的假模型）

这个文件回答一个问题：
    工作流和 Provider 到底怎么分工、怎么咬合在一起。

一句话分工：
    Provider 管「电话没打通」——超时、限流、5xx、连接中断、偶发解析失败 → 重试。
    工作流   管「打通了但说错话」——内容不合格 → 走失败边，带着新输入回到某个状态。

判据（写代码时就照这个分）：
    同样的请求原样再发一次，结果会不会变好？
        会   → Provider 重试（故障是随机的，重来一次可能就通了）
        不会 → 工作流的失败边（同一个模型 + 同一句 prompt + 同一张图，
                               重来一次还是同一套错话，只是多花一份钱）

跑起来之后你会看到 7 个场景的状态迁移轨迹，每个场景对应一种失败类型。
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


# ============================================================================
# 0. 领域数据结构
# ============================================================================
# 这一层全是「事实」，没有任何模型参与。记住一条：
# 圆心和半径是【人确认过的输入】，不是模型的输出 —— 所以永远不需要去断言它。


@dataclass
class Ring:
    """人确认过的圈。cx / cy / r 已归一化到 0–1。"""

    index: int
    cx: float
    cy: float
    r: float


@dataclass
class Observation:
    """模型观察到的一条画面事实。带 obs_id，供后面的证据引用做锚点。"""

    obs_id: str
    ring: int
    color: str
    shape: str
    # 这条观察是不是落在「标记线 / 模板线」上。
    # 真值由程序按几何算出来；模型经常把标记线当成画面内容，所以要有这个字段来抓它。
    on_marker_line: bool = False


@dataclass
class Checks:
    """
    validate() 的输出 —— 纯代码算出来的，不调任何模型。

    这是整个设计里最关键的一个对象：
    失败边能不能建起来，全看这个函数写不写得出来；
    而它写不写得出来，又取决于模型输出是不是结构化的（见文件末尾的「闭环」注释）。
    """

    marker_line_as_evidence: bool = False  # 标记线被当成画面证据
    missing_ring: Optional[int] = None  # 漏检了哪一圈
    color_conflict: bool = False  # 程序算出来的颜色和模型说的不一致
    redline_hit: bool = False  # 命中越界表达（诊断、病名等）
    bad_evidence_id: bool = False  # 引用了不存在的证据 ID

    def any_failed(self) -> bool:
        return any(
            [
                self.marker_line_as_evidence,
                self.missing_ring is not None,
                self.color_conflict,
                self.redline_hit,
                self.bad_evidence_id,
            ]
        )

    def describe(self) -> str:
        if self.marker_line_as_evidence:
            return "标记线被当成画面证据"
        if self.missing_ring is not None:
            return f"漏检了第 {self.missing_ring} 圈"
        if self.color_conflict:
            return "程序与模型的颜色判断冲突"
        if self.redline_hit:
            return "命中越界表达"
        if self.bad_evidence_id:
            return "引用了不存在的证据 ID"
        return ""


# ============================================================================
# 1. Provider 层 —— 只管「电话有没有打通」
# ============================================================================
#
# Provider 的职责边界（非常重要，越界就会出事）：
#   ✅ 它管：超时、429 限流、5xx、连接中断、偶发的非法 JSON。→ 重试。
#   ❌ 它不管：模型说错了内容、漏了东西、引用了假 ID。
#      它根本不知道「什么是对的」，也没有能力判断。
#
# Provider 只有两个出口：成功 / 最终失败。
# 它不知道别的节点存在，也跳不到别的节点 —— 那些是工作流的活。


class TransientError(Exception):
    """
    瞬时故障：同样的请求再发一次，有可能就通了。

    注意这是「调用层」的故障，跟这次任务的内容无关。
    只有这一类错误会触发 Provider 的重试。
    """


class Provider:
    """
    模型适配层的骨架。

    对外只暴露一个 call()，内部做四件事：
      1. 重试    —— 只对 TransientError，指数退避
      2. 超时    —— 由具体子类/客户端实现（这里用假模型模拟）
      3. 记账    —— 记录调用次数、重试次数、耗时，方便事后看成本
      4. 可替换  —— 上层只依赖这个接口，换 Kimi / DeepSeek / 假模型都不用改工作流
    """

    def __init__(self, max_retries: int = 3, base_delay: float = 0.02) -> None:
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.stats: Dict[str, float] = {"calls": 0, "retries": 0, "elapsed": 0.0}

    def call(self, payload: str) -> str:
        """
        发一次请求。返回模型给出的原始文本。

        关键点：这个方法【只负责把话带回来】，不做任何语义判断。
        哪怕模型说的是错的，只要电话打通了，它就原样返回 ——
        判断对错是工作流的 validate() 的事。
        """
        last_error: Optional[TransientError] = None

        for attempt in range(1, self.max_retries + 1):
            started = time.time()
            try:
                raw = self._send(payload)
                self.stats["calls"] += 1
                self.stats["elapsed"] += time.time() - started
                return raw
            except TransientError as exc:
                last_error = exc
                self.stats["retries"] += 1
                if attempt >= self.max_retries:
                    break
                # 指数退避：第 1 次等 0.02s，第 2 次等 0.04s……
                time.sleep(self.base_delay * (2 ** (attempt - 1)))
                print(f"      [Provider] 第 {attempt} 次调用失败（{exc}），准备重试")

        # 重试全部用尽 —— 这里抛出的是「调用层最终失败」，
        # 工作流收到后决定：是降级、是换路径，还是交给人。
        raise TransientError(f"重试 {self.max_retries} 次后仍然失败：{last_error}")

    def _send(self, payload: str) -> str:  # pragma: no cover - 由子类实现
        raise NotImplementedError


class FakeVisionProvider(Provider):
    """
    假视觉模型 —— 用「剧本」控制它每一次被调用时做什么。

    这样做的目的：让每一种失败都能稳定复现。
    真实模型你没法让它稳定地超时，假模型可以每次都超时。
    这就是「失败路径可复现」，也是为什么测试要用假 Provider。

    script 里每个元素表示一次调用的行为：
        "ok"                 正常返回
        "ok_but_marker_line" 返回正常，但把标记线当成了画面证据
        "ok_but_missing_r2"  返回正常，但漏了第 2 圈
        "ok_but_color_wrong" 返回正常，但颜色说错（与程序统计冲突）
        "ok_but_redline"     返回正常，但说了越界的话
        "timeout" / "429"    调用层故障，会触发 Provider 重试
    """

    def __init__(self, script: List[str], **kwargs) -> None:
        super().__init__(**kwargs)
        self.script = script
        self.cursor = 0

    def _send(self, payload: str) -> str:
        behavior = self.script[min(self.cursor, len(self.script) - 1)]
        self.cursor += 1

        # ---- 调用层故障：这些才归 Provider 管 ----
        if behavior == "timeout":
            raise TransientError("timeout")
        if behavior == "429":
            raise TransientError("429 rate limited")
        if behavior == "503":
            raise TransientError("503 service unavailable")

        # ---- 调用成功，但内容可能有问题：这些归工作流管 ----
        rings = [1, 2, 3]
        if behavior == "ok_but_missing_r2":
            rings = [1, 3]
        if behavior == "ok_but_marker_line":
            rings = [1, 2, 3, 99]  # 99 表示落在标记线上的那条（伪 ring）

        observations = [
            {
                "obs_id": f"o{idx}",
                "ring": ring,
                # 第 2 圈故意说成「红」，而程序统计出来是「橙」—— 制造冲突
                "color": "红" if (behavior == "ok_but_color_wrong" and ring == 2) else "橙",
                "shape": "花瓣",
                "on_marker_line": ring == 99,
            }
            for idx, ring in enumerate(rings, start=1)
        ]

        note = "整体疏密均匀。"
        if behavior == "ok_but_redline":
            note = "画面显示来访者可能有抑郁倾向。"  # 越界：诊断性表达

        return json.dumps({"observations": observations, "note": note}, ensure_ascii=False)


# ============================================================================
# 2. 程序侧事实层 —— 确定性最高的一层，零 LLM
# ============================================================================


def program_color_stats(image_id: str) -> Dict[int, str]:
    """
    用程序（真实实现里是 OpenCV）统计每圈主色。

    这一层没有模型参与，同样的图永远得到同样的结果。
    它是「事实锚点」：模型说的任何颜色，都要跟这里对一下。
    """
    # 演示用：写死一个结果。真实实现里是颜色量化 + 面积占比统计。
    return {1: "橙", 2: "橙", 3: "橙"}


REDLINE_WORDS = ["抑郁", "焦虑症", "诊断", "患病"]  # 真实实现里来自 referral-redlines.md


# ============================================================================
# 3. validate() —— 失败的判定器，纯代码，不调模型
# ============================================================================


def validate(
    observations: List[Observation],
    note: str,
    rings: List[Ring],
    program_colors: Dict[int, str],
) -> Checks:
    """
    把模型输出和程序事实对撞，得出「哪儿不合格」。

    这是纯函数：同样的输入永远同样的输出，可以单元测试，跑一万次不花钱。
    没有它，失败边就没有触发条件，整张图会塌回「调一次模型，祈祷它对」。
    """
    checks = Checks()

    # ① 标记线被当成画面证据 —— 直接问几何事实，不需要模型
    if any(obs.on_marker_line for obs in observations):
        checks.marker_line_as_evidence = True

    # ② 漏检：程序知道有 3 圈，模型只说了 2 圈
    seen_rings = {obs.ring for obs in observations if obs.ring != 99}
    for ring in rings:
        if ring.index not in seen_rings:
            checks.missing_ring = ring.index
            break

    # ③ 颜色冲突：程序算橙，模型说红 —— 两条证据不一致，不能让模型自己消解
    for obs in observations:
        expected = program_colors.get(obs.ring)
        if expected and obs.color != expected:
            checks.color_conflict = True
            break

    # ④ 越界表达：命中红线词
    if any(word in note for word in REDLINE_WORDS):
        checks.redline_hit = True

    # ⑤ 证据 ID 不存在（演示：obs_id 必须以 o 开头且非空）
    if any((not obs.obs_id) or (not obs.obs_id.startswith("o")) for obs in observations):
        checks.bad_evidence_id = True

    return checks


# ============================================================================
# 4. 工作流 —— 显式状态机
# ============================================================================
#
# 判据：是不是真的状态机，看两样东西
#   1. 有没有一个显式的「当前状态」变量（下面这个 self.state）
#   2. 转移是不是集中在同一个地方（下面这个 step()）
# 如果状态散落在一串 if/else 的函数调用里，图就只活在文档里，改一处漏三处。


class State(str, Enum):
    OBSERVE = "OBSERVE"  # 调视觉模型
    VALIDATE = "VALIDATE"  # 纯代码校验
    REGENERATE = "REGENERATE"  # 回退边：带着新输入重跑
    MERGE = "MERGE"  # 换策略：只补问漏掉的那一圈
    DEGRADE = "DEGRADE"  # 拦截 + 降级输出（不重跑）
    CLAIMS = "CLAIMS"  # 生成主张
    REPORT = "REPORT"  # 出报告底稿
    NEEDS_HUMAN = "NEEDS_HUMAN"  # 交给人
    FAILED = "FAILED"


class InterpretationWorkflow:
    def __init__(self, provider: Provider, rings: List[Ring], max_loops: int = 6) -> None:
        self.provider = provider
        self.rings = rings
        self.max_loops = max_loops  # 守卫：所有回退边都必须有终止条件

        self.state = State.OBSERVE
        self.trace: List[str] = []
        self.observations: List[Observation] = []
        self.note = ""
        self.regen_count = 0
        self.program_colors = program_color_stats("d191")

    # ---- 主循环：一次迭代 = 一次状态转移 ----
    def run(self) -> State:
        while True:
            self.trace.append(self.state.value)
            self.step()

            # 终态：出报告、交给人、或者彻底失败
            if self.state in (State.REPORT, State.NEEDS_HUMAN, State.FAILED):
                self.trace.append(self.state.value)
                break

            # 守卫：回退边没有终止条件就会变成死循环。
            # 到上限一律交给人 —— 默认停下来，而不是默认继续。
            if len(self.trace) > self.max_loops:
                self.state = State.NEEDS_HUMAN
                self.trace.append("GUARD:超过回退上限")
                self.trace.append(State.NEEDS_HUMAN.value)
                break

        return self.state

    # ---- 转移表：所有「下一步去哪」都写在这里 ----
    def step(self) -> None:
        if self.state == State.OBSERVE:
            self._observe()
        elif self.state == State.VALIDATE:
            self._validate()
        elif self.state == State.REGENERATE:
            self._regenerate()
        elif self.state == State.MERGE:
            self._merge()
        elif self.state == State.DEGRADE:
            self._degrade()
        elif self.state == State.CLAIMS:
            self._claims()
        else:  # pragma: no cover
            raise RuntimeError(f"未知状态：{self.state}")

    # ---- 各状态的处理 ----

    def _observe(self) -> None:
        """调一次模型。注意：这里不判断对错，只负责把结果拿回来。"""
        try:
            # prompt 里带上「合法 ring 清单」和「上次被剔除的证据」——
            # 这就是失败边和简单重跑的区别：输入变了。
            constraint = json.dumps(
                {"valid_rings": [r.index for r in self.rings]}, ensure_ascii=False
            )
            raw = self.provider.call(f"请观察这三圈。约束：{constraint}")
        except TransientError as exc:
            # 调用层彻底失败 → 不是重跑，是交给人（或者换路径、降级）
            print(f"      [Workflow] 调用层最终失败：{exc}")
            self.state = State.FAILED
            return

        payload = json.loads(raw)
        self.observations = [
            Observation(
                obs_id=item["obs_id"],
                ring=item["ring"],
                color=item["color"],
                shape=item["shape"],
                on_marker_line=item.get("on_marker_line", False),
            )
            for item in payload["observations"]
        ]
        self.note = payload.get("note", "")
        self.state = State.VALIDATE

    def _validate(self) -> None:
        """校验 —— 这里是五条失败边的分岔口。"""
        checks = validate(self.observations, self.note, self.rings, self.program_colors)

        if not checks.any_failed():
            print("      [Workflow] 校验通过")
            self.state = State.CLAIMS
            return

        print(f"      [Workflow] 校验失败：{checks.describe()}")

        # ↓↓↓ 失败边：每一个分支跳到一个【不同的状态】，而不是重跑同一个请求 ↓↓↓
        if checks.marker_line_as_evidence:
            # 先把错的证据剔掉 —— 回退时输入已经不一样了
            self.observations = [o for o in self.observations if not o.on_marker_line]
            self.state = State.REGENERATE
        elif checks.missing_ring is not None:
            self.state = State.MERGE
        elif checks.color_conflict:
            # 冲突不自动消解 —— 模型不能自己决定谁对
            self.state = State.NEEDS_HUMAN
        elif checks.redline_hit:
            self.state = State.DEGRADE
        elif checks.bad_evidence_id:
            self.state = State.REGENERATE

    def _regenerate(self) -> None:
        """
        回退边：带着新输入再跑一次。

        注意和「Provider 重试」的区别：
          Provider 重试 = 同一份 payload，原样再发（对内容错误无效）
          这里          = payload 变了（少了错误证据 / 多了 ID 清单），结果分布变了
        """
        self.regen_count += 1
        if self.regen_count > 2:  # 回退也要有上限，否则死循环
            print("      [Workflow] 回退已达上限，交给人")
            self.state = State.NEEDS_HUMAN
            return
        print(f"      [Workflow] 回退重跑（第 {self.regen_count} 次，输入已变化）")
        self.state = State.OBSERVE

    def _merge(self) -> None:
        """换策略：不整图重问，只把漏掉的那一圈单独裁出来问一次。"""
        print("      [Workflow] 换策略：单独补问漏掉的那一圈")
        self.state = State.OBSERVE

    def _degrade(self) -> None:
        """
        拦截 + 降级，明确【不重跑】。

        越界表达是模型的倾向，不是失误 —— 重跑它还会冒出来。
        所以这里只做替换，把内容降级成转介话术。
        """
        print("      [Workflow] 命中红线，降级为转介话术（不重跑）")
        self.note = "本部分建议转由专业人士评估。"
        self.state = State.CLAIMS

    def _claims(self) -> None:
        """生成主张。简化演示：只保留能被程序事实支撑的部分。"""
        self.state = State.REPORT


# ============================================================================
# 5. 七个场景 —— 跑起来看轨迹
# ============================================================================

RINGS = [Ring(1, 0.5, 0.5, 0.2), Ring(2, 0.5, 0.5, 0.45), Ring(3, 0.5, 0.5, 0.8)]


def run_scenario(title: str, script: List[str]) -> None:
    print(f"\n{'=' * 68}")
    print(f"场景：{title}")
    print("=" * 68)
    provider = FakeVisionProvider(script)
    wf = InterpretationWorkflow(provider, RINGS)
    final_state = wf.run()
    print(f"  轨迹： {' → '.join(wf.trace)}")
    print(f"  终态： {final_state.value}")
    print(f"  调用： {int(provider.stats['calls'])} 次，重试 {int(provider.stats['retries'])} 次")


def main() -> None:
    # ① 一切正常
    run_scenario("一切正常", ["ok"])

    # ② 调用层故障：第一次超时，Provider 自动重试 —— 工作流完全不知道发生过重试
    run_scenario("第一次超时（Provider 内部重试，工作流无感）", ["timeout", "ok"])

    # ③ 调用层彻底失败：三次都超时 → 交给工作流，工作流决定交人
    run_scenario("连续超时（Provider 重试耗尽）", ["timeout"])

    # ④ 语义失败：标记线被当证据 → 剔除后回退重跑（输入已变）
    run_scenario("标记线被当成证据 → 回退边", ["ok_but_marker_line", "ok"])

    # ⑤ 语义失败：漏圈 → 换策略，只补问那一圈
    run_scenario("漏检第 2 圈 → 换策略", ["ok_but_missing_r2", "ok"])

    # ⑥ 语义失败：颜色冲突 → 不自动消解，交人
    run_scenario("颜色冲突 → 交给人", ["ok_but_color_wrong"])

    # ⑦ 语义失败：越界表达 → 拦截降级，不重跑
    run_scenario("越界表达 → 拦截降级", ["ok_but_redline"])

    print(f"\n{'=' * 68}")
    print("闭环：结构化输出 → 才写得出 validate() → 才有失败边")
    print("      → 失败边带着【新输入】回退 → 系统才真的有容错，而不是靠重跑撞运气")
    print("=" * 68)


if __name__ == "__main__":
    main()
