# Editing Rounds

## 1. Reader And Purpose Calibration

Goal:

- identify the real reader
- detect whether the draft is drifting toward `同行文`

Use prompt:

```text
先不要改文案。

请先判断这篇文章更像是写给：
1. 同行
2. 泛读者
3. 准客户

然后指出：
- 哪些段落更像在对同行说话
- 哪些段落真正对准了读者的问题
- 如果目标是普通公众号读者，最该删掉或改写的 3 处是什么

不要重写全文，只做判断。
```

## 2. Structure Review

Goal:

- speed up entry
- cut repetition
- tighten the main line

Use prompt:

```text
不要润色。
只从公众号成品编辑的角度看这篇文章，帮我做结构审稿：

- 开头哪里进入太慢
- 哪几段重复了
- 哪几段应该提前
- 哪几段应该删掉
- 哪个位置最适合提前抛出核心观点

输出格式：
1. 建议保留的主线
2. 建议删除的段落
3. 建议调整顺序的段落
4. 一个更适合公众号的结构顺序
```

## 3. Expression De-noising

Goal:

- remove explanation voice
- remove peer-facing voice
- remove report voice

Use prompt:

```text
不要补内容，不要拔高，不要扩写。
只做表达降噪。

请帮我找出这篇里：
- 最像 AI 写法的句子
- 最像给同行看的句子
- 最空、最抽象、最不接地的句子
- 最像防御型表达的句子，例如先虚构误解再否定的“不是 A，也不是 B，而是 C”“不在于 A，也不在于 B”
- 可以删掉但不影响主线的句子

然后把它们改成：
- 更像人在说话
- 更短
- 更具体
- 更适合公众号读者往下读
- 优先正面给出判断，少用先否定再重构的防御型句式

原则：
- 不增加新观点
- 不增加新案例
- 只减噪、压缩、改口气
```

## 4. Style Calibration

Goal:

- make the draft sound like a version the author would actually publish

Use prompt:

```text
下面是我的写作风格卡，请只按这个风格改写，不要擅自发挥：

- 直接
- 具体
- 少废话
- 少空泛判断词
- 不写给同行炫技
- 不追求面面俱到
- 更像拆问题，不像讲大道理
- 让读者尽快知道我到底想说什么

请基于这张风格卡，把这篇文章改成更像我会发出去的版本。
只改表达，不改核心结构和观点。
```

## 5. Pre-publish Check

Goal:

- do a final light check before publishing

Use prompt:

```text
把这篇文章当公众号待发稿，做最后一轮成品检查。

只回答：
- 标题是否合适
- 开头前 3 段是否能留住读者
- 哪个小标题最像报告，不像文章
- 哪 3 句最该再压短
- 哪一段读起来最像同行文章
- 哪一句最像防御型表达，应该改成正面判断
- 结尾是否自然

不要整篇重写，只给最小修改建议。
```
