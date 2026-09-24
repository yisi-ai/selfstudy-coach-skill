# 前端命令

Skill 操作版本 0.4.0 起提供 `window.studyWeb.execute(request)`。Skill 的 `scripts/command.js` 是独立的页面求值函数：读取文件全文，将它作为浏览器工具的函数代码，并通过工具的结构化参数传入 `{ origin, request }`。origin 使用用户实际页面的完整来源，包括协议与端口；全流程保持同一浏览器存储。

`scripts/command.js` 在网页运行，不是可直接运行的终端 CLI。另有可直接执行的 `scripts/study-bridge.mjs`，用于问卷、测验和题库检索，见 [本机连接](local-connection.md)，适用于具备用户本机终端和交互网页展示能力的桌面 Agent。Windows 和 macOS 使用相同 JavaScript；直接页面自动化取决于宿主能否在真实页面执行脚本，本机连接则由网页主动接收并回传数据。只具备云端 shell/文件权限不等于能控制用户网页。不得另开用户不可见的隔离浏览器来制造成功结果。

## 调用

先按 SKILL.md 判断宿主。网页版 AI 和只有云端工具的宿主直接使用 [指导与提醒链接](browser-handoff.md#网页版指导与提醒链接)，不执行下列页面命令或本机 CLI。自动路径只作用于用户实际作答的网页，云端浏览器和云端终端不能替代它。

`quiz.import` 只接受知识题集 `gaga.quiz`，创建中等难度作答并打开第一题。问卷使用独立 `questionnaire.import`，参数为 `{ questionnaire }`，格式为 `gaga.questionnaire`；导入后直接打开第一题，无需点击开始。它只保存当前问卷及回答的临时缓存，新问卷替换当前缓存，不进入题集库、备份、成绩或历史，没有难度、计时或标准答案。知识测验可传 mode 指定 easy、medium 或 hard；quiz.start 开始或继续已有题集，保留未完成进度和截止时间。

在用户实际答题页面打开本站 `/app/import` 后，先查询 `help` 并静默核对版本；`help` 已返回版本时无需再调用 `version`。同版本不汇报检查结果。下例表示传给脚本的参数，`origin` 替换为实际来源，`quiz` 替换为题集对象或完整 JSON 文本：

```json
{
  "origin": "https://www.aiskillonline.com",
  "request": {
    "command": "quiz.import",
    "requestId": "lesson-20260923-1",
    "args": { "quiz": {} }
  }
}
```

优先通过宿主工具的结构化参数传值。如果求值工具的 `args` 只接受元素句柄，或工具只接受函数文本，使用 JSON 序列化生成参数字面量，再构造「执行脚本函数并传入参数」的包装函数；不要直接拼接未经序列化的题集文本，也不要让题集内容成为代码。可以直接调用 `window.studyWeb.execute`，但此时返回值仅确认业务执行结果；配套脚本另外等待实际作答区或准备区，最多等待 10 秒，返回 `data.pageState`。

例如在 Agent 侧读取 `command.js` 为 `scriptSource`、准备好参数对象 `options` 后，构造 `function` 字段：`"async () => await (" + scriptSource.trim() + ")(" + JSON.stringify(options) + ")"`，再交给 CDP 的页面求值工具，并指定已确认的目标 `pageId`。终端只用于读取文件或生成函数文本；实际执行必须发生在目标网页中。CDP 返回的 `pageState` 仅适用于该 target，不代表宿主侧边栏也有题集，见 [CDP 页面选择](browser-handoff.md#使用-cdp--chrome-devtools-时)。

| command                | args                                            | 结果                                                                                                                                                     |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `help`                 | 省略                                            | 当前命令清单、参数、Skill 操作版本与命令协议版本                                                                                                         |
| `version`              | 省略                                            | `skillOperationVersion`、`protocolVersion`（旧 webVersion 为兼容别名）                                                                                   |
| `quiz.import`          | `{ quiz, mode? }`，同时提供 `requestId`         | 保存知识题集和初始作答，直接打开第一题；mode 可选 easy、medium、hard，默认 medium；返回 `quizId`、`title`、`questionCount`、`url`、`navigationRequested` |
| `questionnaire.import` | `{ questionnaire }`，同时提供 `requestId`       | 替换当前问卷缓存并打开第一题；返回 `questionnaireId`、`title`、`questionCount`、`url`、`navigationRequested`                                             |
| `questionnaire.read`   | `{ questionnaireId?: string }`                  | 当前问卷及选择，没有缓存时为 null；指定 ID 不匹配时报错                                                                                                  |
| `questionnaire.open`   | `{ questionnaireId }`                           | 打开当前问卷，完成后显示其回答，不重置                                                                                                                   |
| `quiz.list`            | `{ practice?: boolean }`                        | 当前浏览器题集 ID、标题、题数、作答次数                                                                                                                  |
| `quiz.open`            | `{ quizId, practice?: boolean }`                | 打开当前浏览器已有题集；不开始、不重置进度                                                                                                               |
| `snapshot.read`        | `{ practice?: boolean, skillVersion?: string }` | 题集备份和顶层独立 questionnaire 缓存，不修改原存档                                                                                                      |

0.4.17 增加以下命令，同样可从页面求值或本机连接调用：

| command           | args                                              | 结果                                                    |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `quiz.start`      | `{ quizId, mode?, practice? }`，requestId 必填    | 开始一轮或继续未完成进度，不清空答案，不延长时间        |
| `quiz.search`     | `{ query?, offset?, limit?, practice? }`          | 按标题、说明搜索题集，返回分页概要                      |
| `question.search` | `{ query?, quizId?, offset?, limit?, practice? }` | 按题干、选项、解析、题集名检索，返回 ID、题号和命中摘要 |
| `question.read`   | `{ quizId, questionId, practice? }`               | 单题完整内容及历史记录中的选择                          |
| `quiz.attempts`   | `{ quizId, practice? }`                           | 作答 ID、难度、时间与完成状态，已完成记录附成绩         |
| `quiz.result`     | `{ quizId, attemptId?, practice? }`               | 指定或最新一轮的已完成结果、题目与实际选择              |

搜索 query 是最长 200 字符的关键词，大小写及全半角规范化，空白分词后全部匹配；不是语义搜索。offset 为非负整数，limit 为 1–50，默认 20，返回 total/items/nextOffset。限定不存在的题集报 QUIZ_NOT_FOUND；同名题或重复题目 ID 仍须以 quizId＋questionId 区分。

quiz.result 默认最新一轮；若未完成则报 QUIZ_NOT_COMPLETED，不自动回退旧成绩。quiz.start 指定了与未完成作答不同的模式时报 QUIZ_MODE_CONFLICT。直接求值的写入重试只在页面生命周期内有效；本机连接另有跨刷新回执和中断保护，见 [连接说明](local-connection.md)。

成功格式：`{ ok: true, command, data }`。失败格式：`{ ok: false, command, error: { code, message, path? } }`。按 [更新指引](version-update.md) 静默比较版本，仅需要更新 Skill 时提示；只有命令不存在或实际执行失败才改用备用方式。

`quiz.import`、`quiz.start`、`questionnaire.import` 为写命令，每次新的独立操作使用新的 `requestId`（非空，最多 128 字符）。同一网页生命周期内，相同 ID 和参数的重试/并发调用共享结果，不重复创建题集或作答；同 ID 更改参数返回 `REQUEST_ID_CONFLICT`。保存题集和初始作答使用同一次存档提交。直接页面求值失败后可修正并重试；刷新后不保留其去重记录，须先用 `quiz.list` / `quiz.attempts` 或 `questionnaire.read` 核对真实数据，再用 `quiz.open` / `questionnaire.open` 恢复页面。本机连接的写入回执跨刷新保留，重试规则以 [连接说明](local-connection.md) 为准。

## 结果与恢复

- `pageState: "ready"`：实际 URL 与准备区吻合，但尚未进入答题；旧版 Web 或 `quiz.open` 尚无未完成记录时可能返回此状态。优先用 `quiz.start` 开始，也可按 [浏览器步骤](browser.md) 由 Agent 点击开始，知识测验默认中等；独立问卷没有准备页；确认作答区后再交接。
- `pageState: "running"`：新知识测验或问卷已进入第一题，或已恢复未完成作答；交给用户选答案，已有记录保持原模式和进度，不重新开始。
- `pageState: "completed"`：当前问卷或测验已提交，实际页面展示其回答或成绩；保持回答，不重新导入。
- `pageState: "pending"`：命令成功，但尚未观察到目标页；在同一浏览器上下文使用返回的真实 URL 继续打开/检查，不重复导入，不声称可以开始作答。`navigationRequested: false` 同样表示已保存但导航未发出。
- `QUIZ_NOT_FOUND`：当前页面的题库没有这个 ID；常见于把外部 Chrome 的题集链接放进侧边栏。在实际答题页面按 [跨浏览器恢复](browser-handoff.md#保持同一份题库) 使用原 JSON 导入，不伪造 ID 或写入 localStorage。
- `QUESTIONNAIRE_NOT_FOUND`：当前问卷不存在、ID 不匹配或已被新问卷替换；先在用户实际页面核验，不能去题库或历史查找。
- `COMMAND_BRIDGE_UNAVAILABLE`：脚本等待初始化后仍没有命令入口，可能是旧版或错误页面；检查实际地址及版本，再使用按钮或手动流程。
- `WRONG_ORIGIN`：当前浏览器页面与传入的 origin 不同，先确认实际答题页面。
- 题集格式错误：根据 `error.code`、`message`、`path` 修正；不伪造成功地址。

## 网页版 AI 与手动交接

网页版 AI 直接采用 [指导与提醒链接](browser-handoff.md#网页版指导与提醒链接)。只有桌面 Agent 的终端明确运行在用户电脑上时，才优先使用 [本机连接](local-connection.md)；云端代码执行不具备该能力。

提供完整题集 JSON 和 `/app/import#guide=import`，让用户复制粘贴；网页会按真实状态提示粘贴、校验、确认、开始。知识测验复盘提供 `/app/library#guide=export`；问卷提交后提示用户告知 AI，无法读取时请用户把回答页的实际选择复制回会话。

也可指定单个区域：`#guide=paste`、`check`、`confirm`、`start`、`export`，应配合对应页面。未知值会被忽略；参数只选择内置操作指引，不执行 JavaScript，也不写入题库。目标区域清晰显示，其他区域覆盖浅色半透明遮罩；遮罩只作视觉提示，不阻止选择难度等页面操作。用户可以关闭浮动指引；系统开启减少动态效果时边框保持静态。

这些命令的题集处理都在浏览器本地执行，不新增服务器数据接口；网页和路由资源仍可能正常加载。普通导入网址中的 `#guide` 只选择引导；本机连接还使用随机令牌绑定页面，不在链接中携带整份题集或问卷。
