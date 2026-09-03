<audio title="04｜插件树：声明式配置、isolate 与 HMR" src="https://res001.geekbang.org/media/tts_audio/20260901/tts-16061-25-1012178/ld/ld.m3u8"></audio>

你好，我是张嘉熙。

前三讲，我们看着一棵树慢慢长成：根由 new Context() 造出（顺带也造出根 fiber），此后每调一次 ctx.plugin() 就长出一个节点，这棵树我们称之为插件树，也就是这一讲的主角。

第一讲，它怎么长：ctx.plugin() 挂上可拆卸的枝条，ctx.effect() 声明可撤销的副作用。第二讲，树上怎么协作：inject 声明依赖，服务一上线就自动激活。第三讲，节点之间怎么通信：事件在 ctx 上传播，五种派发方式各有分工。

机制都认识了，可现实中通常大量插件并存：谁挂在哪一层、各自带什么参数、怎么按租户分组——这些装配的活儿全交给代码一行行写死，就成了又长又机械的流水线：加个插件要改代码，换个参数要改代码，多一个租户还是要改代码。

真实的 Cordis 世界不这么干。打开任何一个 Cordis 应用的目录，你几乎找不到手写的装配代码，取而代之的是一份 cordis.yml：哪些插件要挂、挂在哪一层、各自带什么配置、谁和谁隔离、谁拦截谁，全都写在这一份 YAML 里。你只需要描述“树应该长成什么样”，框架负责把它变成实物——这就是所谓声明式配置（cordis.yml + Loader），与前三讲那种“一步步指挥框架干活”的命令式写法正好相对。前三讲我们用纯代码一步步看清底层，这一讲我们将重点转向 Cordis 的声明式 YAML 配置。

那么问题来了：一份 YAML，怎么就能长成一棵运行时插件树？我们先从一份最小的配置开始，把链路完整跑通。

## 从配置树到插件树

先跑起来：最小配置，最小插件

先不搞复杂。我们把 cordis.yml 改成最小版——只有一个条目：

\- id: logger

name: './plugins/logger.ts'

config:

level: info

跟着我一步步把它扩充，最终版见本讲末尾。

这里我们先分清这一讲会出现的两棵树：

配置树：写在 YAML 里的配置，它是图纸

插件树：等配置跑起来长成的那棵，它是实物

我们再看看这份配置对应的加载逻辑：建根、挂 Loader、把 include 当配置树第一根枝条挂上去，三步就位。

import { Context } from '@deepseek-ai/cordis'

import { fileURLToPath, pathToFileURL } from 'node:url'

import Loader from '@deepseek-ai/cordis-plugin-loader'

const baseUrl = pathToFileURL(fileURLToPath(new URL('.', import.meta.url))).href

const ctx = new Context()

ctx.baseUrl = baseUrl

await ctx.plugin(Loader, { baseUrl, enableLogs: true })

await ctx.loader.create({

name: '@deepseek-ai/cordis-plugin-include',

config: { path: './cordis.yml' },

})

await new Promise((resolve) => setTimeout(resolve, 300))

输出只有一行：

\[logger\] 启动（level=info）

就这一行，但整条链路已经走完了：YAML 里的一行条目 → 一个 Entry（配置树节点）→ 一次 registry.plugin() 调用 → 一个 Fiber（运行节点）→ 插件 apply() 跑起来 → 打印。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/69/fb/694b81cabed4c17d0185e78b6ea9b9fb.png)

loader 还会把这个 Entry 记在 fiber 上（fiber.entry），让图纸和实物永远对得上账——后面讲组的时候，你还会用到它。

config 的安检：schema

config 就是 YAML 里 config: 块的内容，看起来是“原样传进来”。但 Cordis 允许插件在调用 apply 之前先给它过一道安检：声明一张 schema，校验类型、补齐默认值。给 logger 加一张 schema：

import { Context } from '@deepseek-ai/cordis'

import z from '@deepseek-ai/schemastery'

export const name = 'logger'

export interface Config {

level: string

targets: string\[\]

}

export const Config = z.object({

level: z.string().default('info'),

targets: z.array(String).default(\['world'\]),

})

export function apply(ctx: Context, config: Config) {

console.log(\`\[logger\] 启动（level=${config.level}）\`)

}

Cordis 会先校验、再调用 apply：校验通过才执行，未提供的字段由 schema 默认值补齐——所以 apply 收到的永远是一份完整、验证过的配置（比如 YAML 里只写 level: debug，targets 也会被默认值补上）。

反过来，在你已经给 logger 挂上这张 schema 的前提下，如果再把类型写错：

\- id: logger

name: './plugins/logger.ts'

config:

level: 123

Cordis 在加载时就抛 ValidationError，错误精确到字段（实测输出：invalid config: $.level expected string but got 123 (at level)），这个 fiber 随之进入 FAILED 状态。

两条设计原则

无硬编码可调参数：凡是不同部署可能取不同值的参数， 都该是配置字段 ——检验标准：这个值能在 cordis.yml 里改，而不用改代码重发布吗？

配置错误要响亮：需要严格校验时，用 schema 表达完备约束，让非法配置在加载时就失败（FAILED + 明确的 ValidationError），而不是静默出错。schema 不是强制项，但该用的时候要严格。

## id、disabled、!!js 与组

绝大多数应用的配置往往没那么简单。现在我们把 cordis.yml 扩充成下面这样：

\- id: logger

name: './plugins/logger.ts'

config:

level:!!js process.env.LOG\_LEVEL?? 'info'

\- id: shell

name: './plugins/shell.ts'

config:

provider: deepseek

model: deepseek-chat

\- id: tenant-a

name: '@deepseek-ai/cordis-plugin-group'

group: true

config:

\- id: a-chat

name: './plugins/chat.ts'

\- id: spare

name: './plugins/chat.ts'

disabled: true

这一讲要拆的四个新东西，分散在这份配置的不同条目上，我们逐个看。

id：条目的稳定身份。不写 id 也能挂载（loader 会随机生成一个），但写了才谈得上“对账”：全名按祖先前缀 + 自己的 id 拼，tenant-a 组里的 a-chat 全名是 tenant-a:a-chat。

disabled：留着配置，但暂不挂载。保留在配置里方便日后一键启用，运行时直接跳过。它还会“连坐”——组被 disabled，组内子条目即使自己没写也一并停用。但组条目自身永远 enabled：组的职责是“包含”，不能把自己关掉。

!!js：让配置变成程序。level:!!js process.env.LOG\_LEVEL?? 'info' 会被解析成一个 JS 表达式，在条目自己的上下文里惰性求值，环境变量、条件分支都能直接写进 YAML。要记清一个边界：!!js 只在 config 块和条目的 disabled 字段内生效；name、id、inject 这些元数据保持静态，写!!js 也只会被当成普通真值，不求值。

group：组是树干，也是插件。group: true 的条目挂载的是 @deepseek-ai/cordis-plugin-group 包里的 Group 插件，它的 config 装的就是子条目数组。

图纸与实物：两棵树对照。 现在树长高了，值得把两张图完整对照起来：

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/06/06/06bcd9838880958953705f751eaa9e06.png)

配置树（图纸·EntryTree）：

root: EntryGroup

├── logger: Entry

├── shell: Entry

├── tenant-a: Entry（组）

│ └── a-chat: Entry

└── spare: Entry（disabled）

fiber 树（实物·插件树）——除了少一个 spare，形状一模一样：

root fiber（uid=0）

├── logger: fiber

├── shell: fiber

├── tenant-a: fiber

│ └── a-chat: fiber

└──（spare 不挂载，差就差这一个）

每个 Entry ──registry.plugin()──▶ 一个 Fiber

（fiber.entry 让两者永远对得上账）

配置树的根是 EntryGroup、节点是 Entry（每条配置一个）；fiber 树的节点是 Fiber（一次运行实例）。

## isolate 与 intercept

现在来到这一讲最具魔法的部分。我们来设想一个真实需求：两个租户共用一棵树，但各自需要一个私有的 shell，租户 A 用 mock，租户 B 用 b-provider，互不干扰；租户 B 还要求把 shell 的 model 强制覆盖成 intercept-model。

要让每个租户“自成世界”、各配一个私有 shell，得靠 isolate；要让租户 B“篡改”shell 的配置，得靠 intercept。两者都写在配置里。这是这一讲 cordis.yml 的最终完整版：

\- id: logger

name: './plugins/logger.ts'

config:

level:!!js process.env.LOG\_LEVEL?? 'info'

\- id: shell

name: './plugins/shell.ts'

config:

provider: deepseek

model: deepseek-chat

\- id: tenant-a

name: '@deepseek-ai/cordis-plugin-group'

group: true

isolate:

shell: tenant-a

config:

\- id: a-shell

name: './plugins/shell.ts'

config:

provider: mock

model: mock-chat

\- id: a-chat

name: './plugins/chat.ts'

\- id: tenant-b

name: '@deepseek-ai/cordis-plugin-group'

group: true

isolate:

shell: tenant-b

intercept:

shell:

model: intercept-model

config:

\- id: b-shell

name: './plugins/shell.ts'

config:

provider: b-provider

model: b-model

\- id: b-chat

name: './plugins/chat.ts'

\- id: spare

name: './plugins/chat.ts'

disabled: true

跑一遍 npx tsx src/ch04/main.ts，输出：

\[logger\] 启动（level=info）

\[shell\] 实例就绪：provider=deepseek, model=deepseek-chat

\[shell\] 实例就绪：provider=mock, model=mock-chat

\[shell\] 实例就绪：provider=b-provider, model=b-model

\[chat\] 收到：\[b-provider/b-model\] 回复：你好（我看到 shell 配置：{"model":"intercept-model"}）

\[chat\] 收到：\[mock/mock-chat\] 回复：你好

两个 chat 的先后顺序因异步竞争每次可能不同，不影响结论。

同一份 shell.ts 代码，跑出了三个实例；两个 chat 各自注入自己组里的 shell；而且只有租户 B 的 chat 看到了被覆盖的 model。整棵插件树长这样：

root（new Context()）

├── logger → logger.ts（level=info）

├── shell → shell.ts（provider=deepseek）

├── tenant-a（组）→ isolate: shell: tenant-a

│ ├── a-shell → shell.ts（provider=mock）

│ └── a-chat → chat.ts（注入 shell）

├── tenant-b（组）→ isolate: shell: tenant-b + intercept: shell.model

│ ├── b-shell → shell.ts（provider=b-provider）

│ └── b-chat → chat.ts（注入 shell）

└── spare → chat.ts（disabled，保留但不挂载）

isolate：同名服务各住一间（底层换 symbol 键）。为什么需要它？服务名在 Cordis 里全局唯一，同名只能注册一次，直接往组里放第二个 shell 会当场报错（service "shell" has been registered）。

解法就一句：给服务名换一个 symbol 键。配置写作 isolate: { shell: tenant-a }，这个字符串叫 label，框架会把它换成不同的 symbol。标同一 label 的共享同一份实例，于是 a-chat 拿到组内 a-shell（mock），b-chat 拿到组内 b-shell（b-provider），谁也看不到根级那个 deepseek。反过来也一样：比如根级的 spare，一旦启用，没有 isolate 加持，看到的自然就是根级这个 deepseek，隔离是双向的。图纸还是那一份，实物却真的造出两份 shell。

intercept：合并一份配置视图。它和 isolate 分工明确：isolate 换实例，intercept 换配置。intercept 不动服务实例，只往服务解析出的配置上合并几个字段，看 b-chat 这行实测输出：

\[chat\] 收到：\[b-provider/b-model\] 回复：你好（我看到 shell 配置：{"model":"intercept-model"}）

chat() 返回的还是 \[b-provider/b-model\]，实例纹丝未动；但解析配置时，model 被 intercept 的值合并覆盖，provider 等没提到的字段原样保留。租户 B 两个都用：isolate 给它私有 shell，intercept 让它看到被改写的 model。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/71/00/71d1bcd86db6f482fee7655667c69200.png)

到这里，cordis.yml 里绝大部分字段你都见过了。给你一份“字典”，忘了随时回来查：

| 字段 | 含义 | 本讲例子 |
| --- | --- | --- |
| id | 条目的稳定标识，组内子条目的全名会带祖先前缀 | tenant-a、tenant-a:a-chat |
| name | 插件模块：相对路径或包名 | ./plugins/logger.ts、@deepseek-ai/cordis-plugin-group |
| config | 传给插件的配置对象（先过 schema 安检） | logger 的 level、shell 的 provider/model |
| group: true | 标记这是一个“组”条目，config 里是子条目数组；必须同时写 name: '@deepseek-ai/cordis-plugin-group'——“组”不是语法糖，它本身就是一个真实插件 | tenant-a / tenant-b |
| disabled | 保留条目不挂载（祖先连坐） | spare |
| isolate | 给同名服务换 symbol 键，各住一间：字符串 = 标同一 label 的共享一份，true = 条目私有 | shell: tenant-a、shell: tenant-b |
| intercept | 给服务合并一份配置视图（改“看到的配置”，不改实例） | 租户 B 的 shell: { model: intercept-model } |
| !!js | （YAML 标签，非条目字段）把值解析成 JS 表达式，惰性求值；仅 config 与 disabled 内有效 | level:!!js process.env.LOG\_LEVEL?? 'info' |

表外其实还有一个 inject 字段：它可在条目级追加插件依赖的服务（插件代码里 export const inject 的配置版），没就绪就停在 PENDING。这一讲的最终版配置没用到它，所以没列进表里——用法与第二讲的代码版一致。

## 热更新（HMR）

先会用：HMR 怎么配、怎么跑

树搭好了，配置也讲完了。开发或线上部署时最烦的就是改一行配置 / 代码，重启整个进程。HMR（Hot Module Replacement）就是干这个的：文件一变，只有相关的那块被替换，进程不重启。

hmr 插件要求进程带 --expose-internals 启动，所以我们构建了单独的一份 cordis-hmr.yml，业务部分用嵌套 include 复用 cordis.yml——一行内容都不用重复：

\- id: timer

name: '@deepseek-ai/cordis-plugin-timer'

\- id: hmr

name: '@deepseek-ai/cordis-plugin-hmr'

config:

root:

\- '.'

\- id: app

name: '@deepseek-ai/cordis-plugin-include'

config:

path: './cordis.yml'

注意最上面那个 timer：它不是可选的装饰，而是必须挂的——HMR 要用 timer 服务做防抖，少了它 HMR 就会一直卡在 PENDING，而且一声不响：树照挂、其他插件照跑，只是热更新永远不来。

于是入口和 main.ts 结构一致，还是建根、挂 Loader、挂 include 那三步，只有两处不同：config.path 换成 './cordis-hmr.yml'，末尾加一行 setInterval(() => {}, 1000) 保活（HMR 要盯着文件，进程退出就没人监视了）。

启动命令如下（它连 Node 版本一起钉住了）：

npx node@24

为什么强调 Node 版本？因为 HMR 要动 Node 内部的模块加载 API，各版本签名不同，版本不对会报错。第一次跑直接用上面这条命令就行。

启动后树照常挂载（还是那 6 行），然后就可以动手了。我们改两处试试：

改配置：把 cordis.yml 里 logger 的 level 从!!js process.env.LOG\_LEVEL?? 'info' 直接改成 debug 存盘。立刻看到 \[logger\] 启动（level=debug），而且只多了这一行：其他插件（三个 shell、两个 chat）的输出一行都不会重跑。

实测：存盘后终端只新增下面这一行，前后其余输出原封不动。

\[logger\] 启动（level=debug）

改代码：把 plugins/chat.ts 里的 \[chat\] 收到： 改成 \[chat\] 收到【改代码】： 存盘。这条链路清掉模块缓存、重新 import，让两个 chat 一起换成新代码（它们共用同一个插件），而 shell、logger 全程无感。

实测（Node 24.20.0；临时挂上 console logger 就能看到 HMR 自己的日志）：

\[D\] hmr change detected at plugins/chat.ts

\[I\] hmr reload plugin at plugins/chat.ts

\[chat\] 收到【改代码】：\[mock/mock-chat\] 回复：你好

\[chat\] 收到【改代码】：\[b-provider/b-model\] 回复：你好（我看到 shell 配置：{"model":"intercept-model"}）

这就是 HMR 的两条链路：一条改配置、一条改代码，目标都是不重启进程就让改动生效。两条路的机制其实是同一件事，旧实例干净卸载、新实例按依赖重新就绪（这正是第一讲的 effect 回收 + 第二讲的依赖编排）。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/1d/3a/1d2a17afbc1f3a9001d11c285d3f783a.jpg)

改 cordis.yml 时，include 靠 id 对账找出“哪个条目变了”，只重挂那一个：fiber.restart() 先停后走，停是回收它的全部 effect，走是用新配置重新 apply。所以没写 id 的条目，每次重读都会生成新随机 ID、被当成删旧加新，整棵子树重挂，精准热更新失效——写 id 是热更新能精确到单个插件的前提。

改插件代码则绕过配置树：清掉模块缓存、重新 import 拿到新代码，registry.plugin(新代码, 旧配置) 原地换新，配置原样保留。所以改代码是按模块换的——共用这份代码的所有实例一起换装；改配置是按条目换的——只重挂变了的那一个（如果是组，则连坐它的子树）。这正是上面两个实测的区别。

## 本讲小结

今天这一讲，我们补齐了基础篇的最后一块拼图——装配。

我们学会了用一份 cordis.yml 长出一棵树：id 认人、disabled 留枝、!!js 取活值、group 分组、isolate 分世界、intercept 叠配置；config 进 apply 之前先过 schema 安检；改完想立刻生效，就交给 HMR——改配置走 fiber.restart 先停后走，改代码走清缓存、重新 import 原地换装。

这背后真正的变化是：你不再完全用代码一行行安排树的形状，而是用配置声明“这棵树应该长成什么样”；让“谁挂在哪、带什么参数、和谁隔离”从代码里彻底搬出去。

而这一切换汤不换药，配置只是换了个说法，跑的还是前三讲那套 Context / Fiber / Effect / Service。

这，就是插件树的本质——用一份声明，让框架把整棵插件树给你长出来。

到这里，基础篇四讲的拼图拼完了：第一讲给了你时间上的可逆（插件可挂载，也能干净卸载），第二讲给了你空间上的协同，第三讲给了你通信，这一讲则回答了最后一个问题，这棵树该怎么装配。从“一步步指挥框架干活”到“只描述想要什么”，你已经走完了 Cordis 的运行机制；下一讲开始的核心篇，将在这套机制之上长出真正的 Agent 能力。

## 思考题

动手实操：给 cordis.yml 里的 tenant-a 组也加一段 intercept（就放在它已有的 isolate: 下面、config: 上面，字段写法照抄 tenant-b 那段），重新跑 main.ts，观察 a-chat 那行的输出有什么变化。再想一想：它注入的 shell 实例，还是原来那个 mock 吗？这个对比能帮你分清 isolate 和 intercept 各管哪一段。

小改动：把 spare 条目的 disabled: true 改成 false，重新跑 main.ts，看它这次是否启动、注入的是哪个 shell。再想一想：为什么它拿到的是这个实例，而不是租户组里那两个？

欢迎把你的运行结果分享出来。如果你觉得这节课对你有帮助，也欢迎分享给其他朋友，我们下节课再见！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-09-02给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

从配置树到插件树

id、disabled、!!js 与组

isolate 与 intercept

热更新（HMR）

本讲小结

思考题