# Aimandala Paperclip Automation 启动策略修复交付记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-14-paperclip-automation-启动策略修复交付记录.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-paperclip-automation-启动策略修复验证记录.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付内容

1. 远端 `paperclip-automation.service` 已从“启动即 build”切换为“启动不 build”
2. 远端 `paperclip-automation` 已恢复可用，`3100` 重新对外监听
3. `paperclip-automation.service.example` 与 `README.md` 已同步到新的启动策略
4. 节点持久化目录 `/data/paperclip` 的 owner 已修正为 `ubuntu:ubuntu`

## 2. 当前结果

截至本轮：

- `paperclip-automation` 已能通过 `systemctl start` 正常拉起
- Paperclip API 健康检查返回 `200`
- 面板侧插件扩展查询不再因为网络级 fetch 失败而报错
- 后续重启不会再默认被 Docker build 长时间阻塞

## 3. 运维约定

后续如需更新镜像或 Dockerfile，统一按下面顺序执行：

```bash
set -a
. /etc/default/paperclip-automation
set +a

docker compose -f docker-compose.paperclip.yml build
docker compose -f docker-compose.paperclip.yml up -d
```

日常启动与停止继续使用：

```bash
sudo systemctl start paperclip-automation
sudo systemctl stop paperclip-automation
```

## 4. 当前残留风险

1. 远端机器网络较慢，镜像现场构建仍可能耗时较长
2. 若未来改用其他运维用户，需要同步更新 `USER_UID` / `USER_GID` 与 `/data/paperclip` owner
3. 当前仍使用本地 build，而不是预构建镜像分发
