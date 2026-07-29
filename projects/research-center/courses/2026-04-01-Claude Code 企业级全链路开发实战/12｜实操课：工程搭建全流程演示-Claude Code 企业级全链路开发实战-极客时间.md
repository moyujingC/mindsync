<video src="https://media001.geekbang.org/1044552538bf71f1bfef5107e0c90402/6dc3cf1abc444b46a56f5bd4d05f3cf5-965153a2b9bbe5f6c940c02e86242632-sd.m3u8" controls="">Sorry, your browser doesn't support embedded videos.</video>

00:00 / 00:00

1.0x

- 3.0x
- 2.5x
- 2.0x
- 1.5x
- 1.25x
- 1.0x
- 0.75x
- 0.5x

网页全屏

全屏

00:00

### 场景一：Maven 多模块骨架搭建

目标：从空目录到 Maven 多模块结构就绪，mvn compile 能通过。

#### 第一步：确认 CLAUDE.md 已就绪

指令：

查看当前 CLAUDE.md，确认项目结构和模块划分部分是否清晰

如果有遗漏或不清晰的地方告诉我。

要点：

工程初始化开始前，先让 Claude Code 读一遍 CLAUDE.md，确认它理解了约束

这一步不让它做任何事，只是确认“认知对齐”

Claude Code 的反馈能帮你发现 CLAUDE.md 里的模糊表述

#### 第二步：生成父 pom 和子模块结构

指令：

按照 CLAUDE.md 中定义的项目结构，创建 Hify 的 Maven 多模块工程骨架。

父 pom 声明所有子模块，dependencyManagement 统一管理版本。

只创建 pom 文件和目录结构，不需要任何 Java 代码。

要点：

“只创建 pom 和目录结构，不需要 Java 代码”是关键约束，不说会生成一堆不需要的代码

拿到输出后检查三件事：模块声明和目录是否对应、依赖关系是否正确、版本管理是否统一

展示 review 过程：对照 CLAUDE.md 里的模块列表，逐一核对 \<modules> 声明

#### 第三步：验收

mvn compile

看到 BUILD SUCCESS，Maven 骨架完成。有报错直接贴给 Claude Code，带上完整错误信息。

### 场景二：hify-common 公共基础设施

目标：五个子任务串行完成，每个任务做完编译验证，最后全部就绪。

#### 子任务一：Result 和 PageResult

指令：

在 hify-common 中创建统一响应类 Result\<T> 和分页响应类 PageResult\<T>。

Result 包含 code、message、data，提供 ok() 和 fail() 静态方法。

PageResult 继承 Result，额外包含 total、page、size。

放在 com.hify.common.web 包下。

要点：

这是最简单的子任务，Claude Code 基本不会出错

展示 review：字段名和 CLAUDE.md 定义的接口规范一致吗？

#### 子任务二：ErrorCode 和 BizException

指令：

在 hify-common 中创建错误码枚举 ErrorCode 和业务异常类 BizException。

ErrorCode 包含 PARAM\_ERROR、UNAUTHORIZED、NOT\_FOUND、INTERNAL\_ERROR 等常用错误码。

BizException 持有 ErrorCode，支持自定义 message 覆盖。

放在 com.hify.common.exception 包下。

#### 子任务三：GlobalExceptionHandler

指令：

在 hify-common 中创建全局异常处理器 GlobalExceptionHandler（@RestControllerAdvice）。

捕获 BizException 返回对应 ErrorCode，

捕获 MethodArgumentNotValidException 返回 PARAM\_ERROR 和具体校验信息，

兜底捕获 Exception 返回 INTERNAL\_ERROR。

所有响应必须使用 Result.fail() + ErrorCode 枚举，禁止硬编码错误码。

要点：

演示 SDD 闭环：展示 Claude Code 第一版在兜底 catch 里硬编码了 code: 500, message: "系统繁忙" 的问题

让它改成 Result.fail(ErrorCode.INTERNAL\_ERROR)

同步在 CLAUDE.md 补一条：“异常处理必须使用 ErrorCode 枚举，禁止硬编码错误码”

这就是规范迭代的实际过程，不是一次性写完的

#### 子任务四和五：MyBatis-Plus + Redis 配置

指令展示 Claude Code 生成的配置类，重点说明：

MyBatis-Plus 的自动填充处理器

Redis 的 Jackson 序列化配置

两个配置都是高频模板，Claude Code 质量很高，基本不需要改。

### 场景三：业务模块空壳与启动验证

目标：搭完所有业务模块空壳，Spring Boot 能启动，健康检查返回 200。

#### 第一步：业务模块 package 结构

指令：

为 hify-provider、hify-agent、hify-chat、hify-mcp、hify-knowledge、hify-workflow

创建标准的 package 结构。

按 CLAUDE.md 代码组织规范，每个模块包含 web/api/domain/infra 四个包，

每个包里创建一个空的占位类（在类上加注释说明这个包的职责）。

不需要任何业务代码。

#### 第二步：Spring Boot 启动类和配置文件

指令：

在 hify-app 中创建 Spring Boot 启动类 HifyApplication。

@SpringBootApplication + @MapperScan("com.hify.\*\*.mapper")。

创建 application.yml，配置数据库、Redis、MyBatis-Plus、端口 8080。

数据库连接信息用 localhost 本地开发配置。

要点：

展示 @MapperScan 扫描路径的重要性，不加这个所有 Mapper 都注入不了

演示 08 讲里的那个报错场景：启动时 mvn spring-boot:run 失败，命令用错了

正确命令是 mvn spring-boot:run -pl hify-app

#### 第三步：健康检查接口 + 验收

指令：

在 hify-app 中创建 HealthController，

路径 GET /api/v1/health，返回 Result.ok("Hify is running")。

mvn spring-boot:run -pl hify-app

curl http://localhost:8080/api/v1/health

期望输出：

{"code": 200, "message": "success", "data": "Hify is running"}

### 场景四：前端工程搭建与前后端联通

目标：Vue 工程搭好，axios 封装完成，调健康检查接口能看到绿色“后端已连接”。

#### 第一步：Vue 工程骨架

指令：

初始化 Hify 前端项目 hify-web。

技术栈：Vue 3 + TypeScript + Vite + Element Plus。

Vite 代理：/api 请求转发到 localhost:8080。

目录结构按 CLAUDE.md 中定义的前端结构来。

要点：

展示 Vite 代理配置，解释为什么开发阶段不需要 Nginx

目录结构 review：src/api、src/views、src/components、src/utils、src/composables

#### 第二步：axios 统一请求层

指令：

在 hify-web/src/utils/ 下创建 request.ts，封装 axios 实例。

baseURL 设为 /api。

响应拦截器：code === 200 直接返回 data 字段（自动解包），

非 200 用 ElMessage.error 提示 message 并 reject。

导出 get、post、put、del 四个方法。

要点：

重点说明自动解包的价值：业务代码不需要每次写.data

展示和后端 Result 格式的对应关系

这是前后端规范对齐的体现，一份 CLAUDE.md，两端都在遵守

#### 第三步：路由、页面空壳、前后端联通

指令：

配置 Vue Router，创建三个路由和对应空壳页面：

模型管理（/providers）、Agent 管理（/agents）、对话（/chat）。

App.vue：左侧 Element Plus 菜单栏，右侧 router-view。

然后改造 ProviderList.vue 调健康检查接口，展示联通效果。

### 场景五：UI 设计与基础组件封装

目标：从灰蒙蒙的 Element Plus 默认样式，变成有品牌感的界面；前端基础组件一条指令生成。

#### 第一步：设计系统生成

指令：

Hify 是一个 AI Agent 开发平台，面向技术团队内部使用，用户是开发者。

管理后台为主——大量表格、表单、配置页，加一个对话页。

风格：浅底 + 科技感点缀。主色蓝紫系，辅色青色，

侧边栏深色底，按钮和关键元素用亮色。

参考 Linear、Supabase 的视觉风格——干净但不无聊。

帮我设计一套 CSS 变量设计系统：主色/背景色阶/文字色阶/圆角/阴影/过渡动效。

要点：

展示指令的结构：产品定位 → 用户群体 → 风格方向 → 具体参考

拿到 CSS 变量后快速 review：颜色搭配、对比度、整体调性

演示把 CSS 变量写入 src/styles/variables.css 的过程

#### 第二步：侧边栏改造演示

展示改造前后的对比，重点说明：

深色侧边栏 + 浅色内容区的层次感

选中态的左侧竖线设计

Hify 品牌名的渐变文字效果

#### 第三步：前端基础组件一条指令生成

指令：

在 hify-web 中创建以下前端公共组件（src/components/）：

1\. HifyTable.vue：通用列表表格，props 接收 columns 配置和 api 方法，

内部管理 loading 和分页，暴露 refresh() 方法。

2\. HifyFormDialog.vue：通用表单弹窗，v-model 控制显示，

open(data?) 方法区分新增/编辑模式，提交触发 submit 事件。

3\. useConfirm.ts：删除确认 composable，接收确认文案和 API 方法，

一行代码完成确认→调接口→成功提示。

4\. useRequest.ts：请求状态管理，返回 { data, loading, error, execute }。

5\. notify.ts：统一通知封装，notifySuccess/notifyError/notifyWarning。

所有组件 Vue 3 Composition API + TypeScript，泛型支持不同数据类型。

要点：

演示生成后的组件代码，说明每个组件解决什么问题

重点展示 HifyTable 的 API 设计：传入 columns 配置和 API 方法，不需要在每个页面重复写分页逻辑

说明为什么一条指令生成五个组件：后端工程师不需要在前端组件细节上花时间，AI 做初稿，你验收好不好用

#### 第四步：UI 打磨来回调的演示

用 ProviderList mock 页面演示三轮打磨：

第一轮：

ProviderList 的表格行高太高，改成 52px。

操作列的编辑和删除按钮间距太小，加 8px margin-left。

第二轮：

状态列的禁用标签用灰色，不要用红色。

禁用是正常状态，不是错误，不应该用 danger 色。

第三轮：

整体看一下 ProviderList：

1\. 分页器居右对齐，上方加细分割线

2\. 新增按钮加 Plus 图标

3\. 操作列改成 text 类型按钮：编辑蓝色、删除红色

要点：

演示“哪里不对 + 应该怎样”的描述句式

强调不需要知道 CSS 属性名，只需要能说清楚你的判断

展示三轮之后页面的变化

## 总结

回顾这节实操课展示的五个场景，有几个核心动作值得你记住。

认知对齐先于执行。每个大任务开始前，先让 Claude Code 读一遍 CLAUDE.md，确认它理解了约束。这一步不做任何代码，只是对齐认知，但能帮你在执行阶段少走弯路。

报错信息要完整。启动失败、编译报错，把完整错误日志给它，而不只是最后一行报错。上下文越完整，它的修复准确率越高。两三轮还没解决，停下来自己看一眼，往往问题没你想的复杂。

SDD 闭环是日常。GlobalExceptionHandler 里硬编码错误码这个问题，发现了、改了、同步更新 CLAUDE.md，这就是 SDD 闭环在日常开发里的样子。不是什么宏大的流程，就是每次 Claude Code 跑偏时随手堵住同类问题的口子。

UI 打磨要敢说。看出来哪里不对，直接说：间距太大、颜色不对、弹窗太宽。Claude Code 负责把你的判断翻译成代码，你不需要会写 CSS，但你需要有判断力。每一轮打磨都在训练这个判断力。

到这里，工程搭建篇完整结束。你手上现在有：前后端都能跑的工程骨架、三档就绪的后端基础组件、有品牌感的前端界面、一套可复用的前端公共组件。从下一讲开始，正式进入业务功能开发，第一讲是模型提供商管理。

期待你与我分享自己的体验。如果今天的课程让你有所收获，也欢迎转发给有需要的朋友，邀请他来一起学习，我们下节课再见！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-04-15给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

我的真实体验和看法

1\. 任务拆解到什么粒度才合适？

2\. Claude Code 报错了，怎么处理最高效？

3\. 前端 UI 打磨，怎么说才能让 Claude Code 改到位？

屏录演示

场景一：Maven 多模块骨架搭建

场景二：hify-common 公共基础设施

场景三：业务模块空壳与启动验证

场景四：前端工程搭建与前后端联通

场景五：UI 设计与基础组件封装

总结