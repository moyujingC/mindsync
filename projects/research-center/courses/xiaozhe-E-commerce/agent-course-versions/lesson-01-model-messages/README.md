> 状态：reference
> 版本：0.1.0
> source_of_truth：自动补齐

# 第 01 课代码：Message 输入输出｜本地模型调用

这一版代码只验证一件事：小哲电商客服 Agent 能在本地终端把一组 `messages` 交给模型，并从模型响应里取出 `assistant message`。

它不是 Web 服务，也不提供 `/chat` 接口。

## 和下一节的区别

| 课次 | 做什么 | 不做什么 |
|---|---|---|
| 第 01 课 | 在本地运行一次模型调用，理解 `system`、`user`、`assistant` message 怎么进出模型。 | 不提供接口，不接页面，不处理会话请求。 |
| 下一节 | 把已经跑通的模型调用包成 Agent 后端服务，让外部系统能通过 HTTP 调用。 | 不重新讲 message 基础。 |

## 核心文件

```text
lesson-01-model-messages/
  main.py
```

## 模块划分

- `main.py`：本课故意保持为本地脚本，只拆出 `load_course_env`、`build_messages`、`call_chat_model` 和 `extract_assistant_message` 这几个函数。
- 这一课还没有 `api/`、`agents/` 或 `models/` 包，因为目标是先看清模型消息进出；第 02 课才把它升级成可被外部调用的后端服务。

## 模型配置

这一课读取统一课程配置：

```text
code/agent-course-versions/course.env
```

也可以通过环境变量指定其他配置文件：

```bash
AGENT_COURSE_ENV=/path/to/course.env python main.py
```

配置示例可以参考：

```text
code/agent-course-versions/course.env.example
```

## 本地运行

```bash
cd code/agent-course-versions/lesson-01-model-messages
python main.py
```

如果没有配置有效的 `AGENT_OPENAI_API_KEY`，脚本会明确提示模型调用未完成，不会伪造一段固定回复。

## 发布包说明

本目录只保留运行当前课所需的代码、场景材料和说明。请按课程正文里的场景和发布包根目录下的 `docs/运行手册.md` 启动当前版本，并用调试后台、curl 或课程给出的业务问题观察响应结构。
