# 浏览器操作

先按 SKILL.md 分流：网页版 AI 和只有云端工具的宿主使用 [指导与提醒链接](browser-handoff.md#网页版指导与提醒链接)，不执行本页自动操作。桌面 Agent 有用户本机终端时优先使用 [本机连接](local-connection.md)；已有可靠页面 JavaScript 求值工具时也可用 [前端命令](commands.md)。以下按钮流程用于没有命令接口但可以可靠操作用户实际页面的情况。

问卷使用同一个导入表单，但确认后进入独立 `/app/questionnaires/<questionnaireId>`，直接显示 `#questionnaire-run` 第一题，无准备页。完成区为 `#questionnaire-result`，展开题目只展示用户所选内容；没有难度、计时、评分、历史或重答。用户提交后按页面提示告诉 AI，再读取独立缓存。下文的模式、题集和成绩操作仅用于知识测验。

按 [版本提示与更新](version-update.md) 静默比较声明版本，同版本直接继续，仅需要更新 Skill 时提示且更新需用户同意。使用真实 HTML 选择器；浏览器快照里的临时 uid 不能写死。工具只接受 uid 时，读取当前快照并将实际元素对应到当次 uid。

| 目标               | 选择器                                    | 完成条件                                      |
| ------------------ | ----------------------------------------- | --------------------------------------------- |
| 首页首次引导       | `#quiz-onboarding-skip`                   | 仅首页出现，导入与具体题集直达页不拦截        |
| JSON 输入          | `#quiz-import-text`                       | 输入值与题集全文一致                          |
| 本地 JSON/TXT 文件 | `#quiz-import-file`                       | 文件工具设置后，全文进入文本框                |
| 校验               | `#quiz-import-check`                      | 预览出现，或出现错误提示                      |
| 预览               | `#quiz-import-preview`                    | 核对标题、题数及是否为备份恢复                |
| 确认导入           | `#quiz-import-confirm`                    | 导航到题集 /run 地址，准备区出现              |
| 准备区             | `#quiz-ready`                             | 核对本次题集标题与题数                        |
| 模式               | `input[name="quiz-mode"][value="medium"]` | Agent 默认选择中等；用户指定时按其要求        |
| 开始按钮           | `#quiz-start`                             | 出现准备页时由 Agent 点击；知识测验先选择中等 |
| 作答区             | `#quiz-run`                               | 用户正在作答，停止输入操作                    |
| 结果区             | `#quiz-result`                            | 可记录地址中的 attemptId，并读取存档          |
| 错误提示           | `[data-quiz-notice="error"]`              | 读取提示并处理，不把超时当作成功              |

打开 `/app/import`，应直接出现导入输入框。若出现首次引导，核对版本和地址；不要进入示例来代替本次练习。使用浏览器工具的 fill/input 设置文本，触发正常输入事件；不要只设置 DOM value 而遗漏 React 状态更新。文件使用工具的文件输入能力，不要求网页按本地路径自行读文件，也不需要先上传到服务器。

若工具报告 fill 成功，但校验仍针对旧文本或预览未更新，聚焦文本框、全选后使用键盘输入工具替换全文，再重新校验；也可改用文件输入。已经在 Chrome DevTools 的替换输入场景验证这一差异，不要仅凭输入工具回执确认成功。

等待按钮可见且可用后校验，核对预览后确认。每一步等待实际页面状态，避免固定延时。若确认后工具超时，先检查当前地址和存档是否已出现刚导入的题集，不要盲目再次确认或重新导入。

知识测验确认后继续等待本次题集的 `/run` 页。知识测验若显示 `#quiz-ready`，先核对标题，再选择 `input[name="quiz-mode"][value="medium"]` 并确认已选中，点击 `#quiz-start`，等待 `#quiz-run` 显示第一题再交接；用户明确指定其他难度时按其要求操作。问卷确认后等待独立问卷地址和 `#questionnaire-run`，无需开始按钮。若已有作答区，保留原模式和进度，不重复开始，也不替用户选答案。自动路径不得只返回 JSON、首页链接或导入页链接。打开方式遵循 [网页打开与答题交接](browser-handoff.md) 中的宿主分流；展示页面与导入所用浏览器须为同一存储上下文。

问卷地址：`/app/questionnaires/<questionnaireId>`，ID 由网页返回。知识测验正式地址：`/app/library`、`/app/import`、`/app/quizzes/<quizId>`、`/app/quizzes/<quizId>/run`、`/app/quizzes/<quizId>/results/<attemptId>`。题集 ID 由网页生成，不是标题，也不是题目 ID。混合练习地址携带 `practice=1`，读取时也需指定 practice。

存档操作支持恢复原进度。不要使用 `fresh=1` 重开或触发删除，除非用户明确要求。刷新或打开新标签不代表拥有另一份独立进度。同一浏览器配置和同一网站来源共享正式题库。
