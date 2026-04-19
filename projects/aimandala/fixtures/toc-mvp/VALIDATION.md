# To C MVP Fixture Validation

这份文件用于回答两个问题：

1. 当前 `To C MVP` 固定样本怎么检查一致性
2. 当前已入库的脱敏图片资产如何和旧样本体系并存

## 1. 当前最小校验

执行命令：

```bash
python3 $REPO_ROOT/projects/aimandala/scripts/validate_fixtures.py
```

当前会检查：

- `fixtures/manifest.yaml` 是否存在且有条目
- 每个 fixture descriptor 是否存在
- manifest 里的 `id / path / kind` 是否和 descriptor 一致
- descriptor 是否具备最小字段：
  - `status`
  - `owner`
  - `scope`
  - `theme`
  - `fixture_type`
  - `coverage`
  - `expected_observations`
  - `review_entrypoints`
  - `asset_ref.kind`

当前不会检查：

- `asset_ref.asset_path` 与 `asset_ref.evidence_path` 是否已经全部切到新的 `toc-mvp-fixture-001~004`
- 证据文件里的内容是否足以放行

## 2. 当前已固化的样本

- 旧 descriptor / manifest 体系仍是：
  - `toc-mvp-sample-a-lite-general`
  - `toc-mvp-sample-b-lite-to-pro-career`
  - `toc-mvp-sample-c-existing-reuse`
  - `toc-mvp-sample-d-intimate-fallback`
  - `toc-mvp-sample-e-warning-general`

当前已正式入库的脱敏图片资产池：

- 默认正式候选：
  - `fixtures/toc-mvp/assets/IMG_5057.jpeg`
  - `fixtures/toc-mvp/assets/IMG_5060.jpeg`
  - `fixtures/toc-mvp/assets/IMG_5062.jpeg`
  - `fixtures/toc-mvp/assets/IMG_5063.jpeg`
- 顺延替换池：
  - `fixtures/toc-mvp/assets/IMG_5065.jpeg`
  - `fixtures/toc-mvp/assets/IMG_5067.jpeg`
  - `fixtures/toc-mvp/assets/IMG_5075.jpeg`
  - `fixtures/toc-mvp/assets/IMG_5079.jpeg`
  - `fixtures/toc-mvp/assets/IMG_5081.jpeg`

说明：

- 这 9 张图片现在已经是正式纳管资产。
- 下一轮切换到 `toc-mvp-fixture-001~004` 时，默认使用前 4 张，其余 5 张作为损坏或不可用时的顺延替换池。

## 3. 下一步补真实资产时的规则

- 真实脱敏图片统一放到 `fixtures/toc-mvp/assets/`
- 截图建议放到 `fixtures/toc-mvp/evidence/`
- descriptor 中的 `asset_ref` 应补成具体文件路径或证据路径
- 不要把 `toC/app/backend/data/uploads/` 下的运行时文件直接搬进 fixture
- 本次不改 `fixtures/manifest.yaml`，也不重做旧 `sample-*` descriptor；这些属于后续样本重建批次

## 4. 当前边界

这套校验现在只保证“样本描述资产一致”，还不负责：

- 真正请求后端并跑完 Lite / Pro 链路
- 比对截图或 Markdown 内容
- 自动判定 AI 生成内容质量

这些属于下一轮可以继续叠加的验证层。

## 5. 当前已脚本化的样本复查

- `toc-mvp-sample-c-existing-reuse`

执行命令：

```bash
python3 $REPO_ROOT/projects/aimandala/scripts/verify_sample_c_existing_reuse.py
```

当前验证目标：

- 第二次 create 返回 `existing=true`
- 第二次返回的 `interpretation_id` 与第一次一致
