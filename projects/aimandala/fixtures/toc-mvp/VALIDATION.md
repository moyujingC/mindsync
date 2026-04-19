# To C MVP Fixture Validation

这份文件用于回答两个问题：

1. 当前 `To C MVP` 固定样本怎么检查一致性
2. 当前已入库的脱敏图片资产如何和正式固定样本体系配合

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
- `asset_ref.asset_path`
- `asset_ref.evidence_path`
- `input.image_path`

当前不会检查：

- evidence 正文里的人工摘录是否足以放行
- 图片内容本身是否满足业务语义，只检查文件存在性与字段治理

Golden 审阅资产另由 Batch F 导出入口生成：

```bash
python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-001 --version lite
python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version pro
python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version lite
```

## 2. 当前已固化的样本

当前正式固定样本是：

- `toc-mvp-fixture-001`
- `toc-mvp-fixture-002`
- `toc-mvp-fixture-003`
- `toc-mvp-fixture-004`

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
- 当前默认使用前 4 张，其余 5 张作为损坏或不可用时的顺延替换池。

## 3. 当前规则

- 真实脱敏图片统一放到 `fixtures/toc-mvp/assets/`
- 截图或人工验收记录统一放到 `fixtures/toc-mvp/evidence/`
- descriptor 中的 `asset_ref` 应使用 repo-relative 路径
- 不要把 `toC/app/backend/data/uploads/` 下的运行时文件直接搬进 fixture
- 旧 `sample-*` descriptor 已退出当前正式入口；Git 历史承担追溯职责

## 4. 当前边界

这套最小校验现在只保证“样本描述资产一致”，还不负责：

- 真正请求后端并跑完 Lite / Pro 链路
- 比对截图或 Markdown 内容
- 自动判定 AI 生成内容质量

完整报告快照、debug trace 和人工审阅结论由 `fixtures/toc-mvp/golden/` 承接。

当前首批 golden 审阅结论：

- `toc-mvp-fixture-001 / lite`: `pass_with_drift`
- `toc-mvp-fixture-002 / pro`: `fail`
- `toc-mvp-fixture-002 / lite`: `fail`

这表示 golden 闭环已建立，但内容偏差仍需进入后续 Batch G 修复。

## 5. 当前已脚本化的样本复查

- `toc-mvp-fixture-003`

执行命令：

```bash
python3 $REPO_ROOT/projects/aimandala/scripts/verify_fixture_003_existing_reuse.py
```

当前验证目标：

- 第二次 create 返回 `existing=true`
- 第二次返回的 `interpretation_id` 与第一次一致
