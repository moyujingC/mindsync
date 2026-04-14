# Aimandala Paperclip Automation 启动策略修复验证记录

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-paperclip-automation-启动策略修复验证记录.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/paperclip-automation/README.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 验证对象

本次验证对象为 `automation` 节点上 Paperclip 的真实启动策略修复。

## 2. 验收口径

1. `paperclip-automation.service` 启动时不再触发 Docker build
2. Paperclip 容器能够稳定监听 `3100`
3. `/api/health` 返回 `200`
4. 带 board token 访问 `/api/plugins/ui-contributions` 返回 `200`
5. 持久化目录权限不再导致 `/paperclip/instances/default/.env` 读取失败

## 3. 执行记录

远端执行与验证：

```bash
sudo systemctl stop paperclip-automation
sudo systemctl cat paperclip-automation
sudo chown -R ubuntu:ubuntu /data/paperclip
sudo systemctl start paperclip-automation
sudo docker ps
sudo ss -ltnp | grep 3100
curl http://127.0.0.1:3100/api/health
```

补充验证：

- 使用 board token 请求 `http://vm-0-11-opencloudos.tail176582.ts.net:3100/api/plugins/ui-contributions`

## 4. 结果

- systemd `ExecStart` 已切换为 `docker compose -f docker-compose.paperclip.yml up -d`
- `paperclip-automation-paperclip-1` 已正常运行并映射 `0.0.0.0:3100->3100/tcp`
- `/api/health` 返回 `200`，`status=ok`
- 带 token 请求 `/api/plugins/ui-contributions` 返回 `200`
- `/data/paperclip/instances/default/.env` 已修正为 `ubuntu:ubuntu 600`

## 5. 当前风险

1. 镜像更新仍依赖人工单独执行 `docker compose build`
2. 若后续再次以 `root` 写入 `/data/paperclip`，仍可能重新引入权限漂移
3. 远端节点对 Debian 源拉取速度较慢，现场 build 仍可能耗时较长
