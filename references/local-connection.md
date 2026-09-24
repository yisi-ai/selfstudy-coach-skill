# 学习本机连接

适用于电脑上安装、能在用户电脑运行 Node.js 22+ 并展示交互网页的 Agent。WorkBuddy 使用本连接与右栏预览；其他桌面 Agent 也优先使用它。网页版 AI 或只有云端终端的宿主直接按 [网页版指引](browser-handoff.md#网页版指导与提醒链接) 交付内容与带提醒的网址，不执行下列命令、不要求用户安装 Node。问卷、知识测验、题库检索和结果读取共用一次连接。无需 MCP 配置、CDP、独立 Chrome 或网站后端转发。网页来自配套外网服务器，题库逻辑仍在用户浏览器执行；云端容器的回环网址不能作为用户电脑入口。

`scripts/study-bridge.mjs` 是自包含 Node CLI；`scripts/command.js` 是网页求值函数。没有 `node` 命令时检查宿主自带运行时，不写死机器路径。旧 `questionnaire-bridge.mjs` 仅保留 0.4.16 问卷连接兼容，新会话统一用 study-bridge。

## 建立连接并打开网页

1. 新建请求 JSON 文件，知识题集使用下面的结构，`quiz` 替换为完整合法题集。问卷将命令改为 `questionnaire.import`，参数改为 `{ "questionnaire": 完整问卷 }`。每个新写入使用新的 requestId；重试保留原文件和 ID。

```json
{
  "command": "quiz.import",
  "requestId": "lesson-1",
  "args": { "quiz": {}, "mode": "medium" }
}
```

2. 启动连接。`--origin` 使用本次安装 Skill 的配套网站，不能自动在本地与线上之间回退。`--output` 必须是尚不存在的新目录，父目录已存在。只查询已有题库时省略 `--request`，不要生成或导入占位题集。

```bash
node "<Skill目录>/scripts/study-bridge.mjs" start --origin "https://www.aiskillonline.com" --output "<会话目录>/study-session" --request "<请求.json>" --locale zh-CN
```

返回 `directory`、`previewUrl`、`sessionId` 和 `responsesFile`。临时服务只监听本机 127.0.0.1 的随机端口，凭随机令牌连接，最多运行两小时。session.json 含连接令牌，留在本机，不作为附件公开。

3. 将**完整 previewUrl** 交给宿主预览工具；WorkBuddy 使用 present_files。入口嵌入真实 Web，不能把内部 `/app/quizzes/...` 或 `/app/questionnaires/...` 地址单独拿出来展示。后续命令沿用同一个 directory 与右栏，不为每道题或每份题集新建连接。
4. 运行 status，必要时在约 20 秒内有限重试。`connected: true` 表示最近收到网页回执；`active` 的 kind、id、title、questionCount 须与本次任务一致，交给用户作答还须 `pageState: running`。新导入 answeredCount 为 0。waiting、pending 和 present_files 打开成功都不表示已经可作答。版本从 skillOperationVersion 静默比较。

```bash
node "<Skill目录>/scripts/study-bridge.mjs" status "<directory>"
```

WorkBuddy 若要求 present_files 是最后一次工具调用，核验后再次打开**同一个 previewUrl** 即可；随后等待用户作答。重复打开恢复原页面，新打开的预览取得连接，旧预览停止接收命令。题库仍属于这个宿主的浏览器存储；不能读取另一 Chrome 或另一台设备的题库。

## 在同一连接调用命令

将请求写成 JSON 文件，然后执行：

```bash
node "<Skill目录>/scripts/study-bridge.mjs" call "<directory>" "<请求.json>"
```

结果沿用 `{ ok, command, data | error }`，附 `connection.sessionId/requestId/receivedAt/replayed/connected`。成功写入不等于页面已显示；导入和开始之后用 status 核验实际作答状态。完整命令与参数见 [前端命令](commands.md)，可先调用 help 发现当前网站能力。

| 用途               | command 与 args                                                                         |
| ------------------ | --------------------------------------------------------------------------------------- |
| 导入并开始知识测验 | `quiz.import`：`{ quiz, mode? }`，mode 可选 easy、medium、hard，默认 medium             |
| 打开已有题集       | `quiz.open`：`{ quizId }`，不创建作答                                                   |
| 开始或继续一轮     | `quiz.start`：`{ quizId, mode? }`，保留已有未完成进度；指定不同模式时报冲突             |
| 搜索题集           | `quiz.search`：`{ query?, offset?, limit? }`                                            |
| 搜索单题           | `question.search`：`{ query?, quizId?, offset?, limit? }`，搜索题干、选项、解析和题集名 |
| 读取某题           | `question.read`：`{ quizId, questionId }`，返回完整题目及记录中的选择                   |
| 列出作答           | `quiz.attempts`：`{ quizId }`                                                           |
| 读取本次成绩       | `quiz.result`：`{ quizId, attemptId? }`，只返回已完成记录                               |
| 问卷导入和读取     | `questionnaire.import` / `questionnaire.read` / `questionnaire.open`，保持独立临时缓存  |

`quiz.import`、`quiz.start`、`questionnaire.import` 都必须带 requestId。查询默认每页 20 条，limit 为 1–50；使用 nextOffset 继续查询。先读摘要，再按 ID 读详情，不以相似标题猜测题目身份。读命令每次调用获取当前数据；不要为多次独立查询复用同一个 requestId。

用户告知答完后，问卷用 questionnaire.read 并核对 completedAt；知识测验用 quiz.result，核对题集和作答 ID。QUIZ_NOT_COMPLETED 表示最新一轮仍未提交，不能改读上一轮并当作本次成绩。用户选择历史复盘时才明确传历史 attemptId。Agent 不选择、提交答案或修改成绩。

## 快照、重连与错误

- `read <directory>`：读取 responses.json 中最近回传的活动快照，仅活动已完成时返回 `active`、`payload`、`receivedAt` 和 `live: false`。问卷在 payload.questionnaire，知识测验在 payload.attempt/result/questions。务必核对活动 ID；它是本机快照，不能称作实时数据。
- `resume <directory>`：本机进程停止或超时后沿用原端口、令牌和请求回执，返回原 previewUrl。保留的右栏会继续回传；需要重开时仍使用该网址。不同学习内容用 call 传入，不重建连接。
- `stop <directory>`：完成读取、继续辅导后结束临时进程；不要在用户答题时停止。网页题库和作答保留。
- PAGE_NOT_CONNECTED：尚无最近网页回执或页面已关闭，先恢复连接；旧回执不能证明现在在线。
- COMMAND_PENDING：请求仍在等待结果，保留原 requestId 重试，不能换新 ID 再导入。
- REQUEST_ID_CONFLICT：同 ID 的参数变了；查清原任务，新的独立操作才用新 ID。
- COMMAND_OUTCOME_UNKNOWN：浏览器在业务提交和保存回执之间中断。先用 quiz.list / quiz.attempts / questionnaire.read 核对真实数据，不盲目重发写入或自动清空回执。
- PAGE_REPLACED：同一连接在新的预览里打开了；使用最新右栏，不在旧页反复抢回连接。
- QUIZ_NOT_FOUND / QUESTIONNAIRE_NOT_FOUND：实际题库或缓存已变化，保留当前回答并核对；重试旧导入不得重新生成已删除数据，也不得覆盖新问卷。
- 旧 Web 不支持连接、宿主不能运行本机进程或无法展示交互 iframe 时，才退回已核验的页面命令或手动导入，不虚构成功。

写入回执由本机连接和当前浏览器保存，跨刷新重试复用原结果；它们不属于题库备份或成绩历史。网页正常加载资源仍访问配套服务器，题库命令及回答回传在本机完成。
