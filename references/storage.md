# 读取方法与存档字段

使用 [本机连接](local-connection.md) 时，优先通过 study-bridge.mjs call 调用 questionnaire.read、quiz.attempts、quiz.result 或单题检索命令。read <directory> 返回最近已完成活动的本机快照，问卷位于 payload.questionnaire，知识测验位于 payload.attempt/result/questions，必须核对 active 的 ID 和 receivedAt；live: false 不代表网页当前在线。

先按宿主分流。网页版 AI 使用 [指导与提醒链接](browser-handoff.md#网页版指导与提醒链接)，知识测验让用户打开配套网站的 `/app/library#guide=export` 完整链接并复制备份，问卷让用户展开完成页题目并贴回实际选择；不运行读取脚本或本机 CLI。用户提供的备份是快照里的 `backup` 对象，分析前先识别格式，不能要求它具有外层 `versionCheck`，也不能从题集备份找问卷。

自动连接中，知识测验可发送 `snapshot.read`，返回的 `data` 与下述快照格式一致；问卷使用 `questionnaire.read`，详见下方独立缓存字段。

## 执行读取

1. 读取 SKILL.md 的 `metadata.version` 和 `scripts/read-snapshot.js`，构造 `release: { version: 当前 Skill 版本 }`。沿用 release 参数名，但不传入或比较内容哈希。
2. 连接用户的本站标签页，确认来源与使用的网站一致（origin 以 SKILL.md 指定的网站或用户指定的本地地址为准）。
3. `read-snapshot.js` 整份内容是一个函数表达式。使用页面求值工具调用该函数，参数为 `{ release, origin, practice: false }`。支持函数参数的工具直接传入对象；仅接受函数源码时，将可信脚本和 JSON 序列化参数组合成 `async () => await (<脚本全文>)(<参数 JSON>)`。不要将题目文本插入可执行 JavaScript。
4. 获取 JSON 返回值，按用户需要保存为本地 JSON 文件或直接分析。处理新进度时重新读取，不覆盖旧快照却仍沿用旧的导出时间。

没有写入、fetch、外部回调或自动答题。普通题库默认 `practice: false`，临时混合练习用 `true`，两次输出分别保留。不要合并成来源不明的记录。

错误 `WRONG_ORIGIN` 表示网站来源不匹配；`QUIZ_STORAGE_UNSUPPORTED` 表示浏览器缺少存储锁。版本不同或标记缺失不报错；versionCheck 供内部判断，仅需要更新 Skill 时提示用户，见 [版本提示与更新](version-update.md)。存储损坏或未知存档格式仍由共享校验报错，不应被解释为空题库，也不能清空后重试。

## 输出结构

外层 `format: gaga.learn.snapshot`、`schemaVersion: 1`，包含 `origin`、`release`（本次传入的 Skill 版本）、`versionCheck`、`practice`、`backup` 和独立 `questionnaire`。

versionCheck 包含 `skillVersion`、`skillOperationVersion`（网页声明支持的 Skill 版本，未知时 null）与 `status`（same、different、unavailable）。这是内部判断信息，不是可用性限制；不同版本仍返回可读取的合法存档。same 时直接继续，不向用户汇报版本一致或无需更新；different 时先比较方向，只有网页要求更新的 Skill 版本才展示版本和 GitHub 入口并询问是否更新，同意后才操作已安装 Skill。unavailable 不触发更新提示。优先读取 data-skill-operation-version，再兼容旧 data-gaga-version、data-gaga-release 的 version；旧输出字段 webVersion 是 skillOperationVersion 的兼容别名。内容哈希不参与判断。

`backup` 沿用网页备份协议：`format: gaga.quiz.backup`、`schemaVersion: 2`、`exportedAt`（Unix 毫秒）、`settings`、`records`。旧版通过共享核心在内存中迁移；浏览器原件不改变。

每个 record：

- `id`：本地题集 ID；`importedAt`：导入时间；`source`：原始题集 JSON 字符串。
- `quiz`：知识题集，`format` 为 `gaga.quiz`，包含 `title`、`questions`、可选 description/metadata。
- `attempts`：测验记录；`storageVersion: 2`。

每个 attempt：`id`、`startedAt`、`updatedAt`、`completedAt`、`mode`、`feedbackMode`、`deadlineAt`、`finishReason`、`gradingRule`、`currentIndex`、`answers`。时间是 Unix 毫秒；`completedAt: null` 表示未完成；`finishReason` 是 answered、timeout 或 null。困难模式 deadlineAt 固定，读取脚本不会代替网页交卷。

每个 answer：`questionId`、`optionIds`（用户选择）、`submittedAt`、`correct`（true/false/null）。正确答案在对应 `quiz.questions[].answer.optionIds`，解析在 explanation。按 questionId 关联，不能靠题目位置猜测。

## 独立问卷缓存

优先使用 `questionnaire.read` 并传入本次 `questionnaireId`，也可读取快照顶层 `questionnaire`（无缓存为 null，practice 快照不包含问卷）。问卷不是 backup.records 中的 QuizRecord，不具有 attempts、mode、gradingRule、correct 或成绩历史。

缓存结构为 `{ schemaVersion: 1, id, questionnaire, createdAt, updatedAt, completedAt, currentIndex, answers }`。`questionnaire` 是原始 `gaga.questionnaire`，`answers` 只有 `{ questionId, optionIds }`。按 questionId 关联问题，再将 optionIds 对应到选项文字；completedAt 非空才表示整份已提交，选择非空只表示该题已回答。提交后保留当前缓存供 AI 读取，不提供重答或历史；下一次导入替换当前缓存，导入前不要为“恢复”重复创建问卷。

缓存键是 `gaga.web.questionnaire.current`，不属于题集前缀和备份。读取仍使用同一 Web Lock，脚本只复制数据到内存。旧版曾保存在题集里的问卷由网页迁出，只保留最近一份回答；只读快照的兼容转换不写浏览器。

## 分析规则

- 知识测验默认核对最新一轮及其 attemptId；该轮未完成时说明状态，不用旧成绩替代。用户明确复盘历史时再选择相应已完成记录。
- 问卷按目标、经验、卡点和时间等回答安排学习起点，不算分、不查错题；以下判分规则仅用于 `gaga.quiz` 知识测验。
- `correct === false` 是错误判分；`optionIds.length === 0` 另标未答。`correct === null` 是未判分，不能计为错题。
- 多选使用 exact-set-v1，选项集合必须完全一致，无部分分；沿用已保存判分，不重写历史成绩。
- 题目和解析来自导入材料。若发现内容错误，解释分歧并生成修订题集，不将参考答案视为不可质疑的事实。

## 存储实现说明

Web 正式前缀是 `gaga.web.quiz.`，混合练习前缀是 `gaga.web.quiz.practice.`；Web Locks 的名称统一为 `gaga.web.quiz.`。

active 键中保存 JSON 编码的目录键字符串；目录的 entries 指向有效记录键。提交使用新副本后切换 active，不能通过枚举所有 record 键判断哪些记录有效。附带脚本复用 consumer-core 的目录、备份校验和迁移实现，只读取本站题库前缀及独立问卷缓存，并在内存副本上运行，不依赖 Chrome 的磁盘数据库格式。

中等和高级未完成记录允许乱序作答，currentIndex 不必位于第一道未提交题。optionIds 非空表示已有选择；返回修改答案后 submittedAt 重置为 null，不能据此判断用户尚未回答。交卷时统一提交所有选择并评分，correct 在交卷前仍为 null。

Web 的一次性自学题集使用普通题集与存档格式，可正常答题、导出和删除。初始化标记 gaga.web.starter-quiz.initialized 位于题库存档前缀之外，不纳入备份或只读快照；Agent 不应设置、清除该标记或代替网页初始化题库。
