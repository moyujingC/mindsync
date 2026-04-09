# To C MVP Fixture Validation

这份文件用于回答两个问题：

1. 当前 `To C MVP` 固定样本怎么检查一致性
2. 后续如果补真实图片或截图，应该落到哪里

## 1. 当前最小校验

执行命令：

```bash
python3 /Users/xinran/Downloads/dev/mindsync/projects/aimandala/scripts/validate_fixtures.py
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

## 2. 当前已固化的样本

- `toc-mvp-sample-a-lite-general`
- `toc-mvp-sample-b-lite-to-pro-career`
- `toc-mvp-sample-c-existing-reuse`

## 3. 下一步补真实资产时的规则

- 真实脱敏图片建议放到 `fixtures/toc-mvp/assets/`
- 截图建议放到 `fixtures/toc-mvp/evidence/`
- descriptor 中的 `asset_ref` 应补成具体文件路径或证据路径
- 不要把 `toC/app/backend/data/uploads/` 下的运行时文件直接搬进 fixture

## 4. 当前边界

这套校验现在只保证“样本描述资产一致”，还不负责：

- 真正请求后端并跑完 Lite / Pro 链路
- 比对截图或 Markdown 内容
- 自动判定 AI 生成内容质量

这些属于下一轮可以继续叠加的验证层。
