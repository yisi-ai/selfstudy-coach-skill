# 三端入口与数据范围

Skill 操作版本 0.4.19。Web、Chrome 扩展和微信小程序复用同一题集、作答和问卷规则，各端资料独立保存在本机。首次三题体验只保存在内存；正式自学入门题集三端使用同一版本。

## 选择用户实际使用的端

- Web：继续使用现有浏览器命令 `window.studyWeb.execute(request)` 或学习本机连接。连接脚本只服务 Web；当前回答以实际答题浏览器为准。
- Chrome 扩展：在已打开的扩展侧栏页面上下文调用 `window.studyWeb.execute(request)`，先调用 `version`、`help` 核验。不能在普通网站标签页调用并假设它访问扩展资料。无需开放网络权限；侧栏没有 Web 的 localhost 连接服务。
- 微信小程序：通过已连接的微信 IDE 运行时调用 `getApp().executeStudyCommand(request)`，先调用 `version`、`help`。运行时不可用时，交付共同 JSON，让用户从小程序导入页导入；完成问卷后可复制回答交回 AI。不把 IDE 命令可用当作手机自动连接可用。

三端命令包括 `quiz.import/list/search/open/start/attempts/result`、`question.search/read`、`questionnaire.import/read/open` 和 `snapshot.read`。导入测验默认中等模式并打开第一题；继续作答保留现有选择、难度和截止时间。Agent 不替用户选答案。问卷独立保留当前一份；新问卷替换当前缓存，不计分，不写题库或成绩。

写命令携带稳定 `requestId`。直接运行时入口在当前进程内去重；Web 学习本机连接另有跨刷新回执。扩展侧栏或微信进程重启后，若前次结果不明确，先查询已保存资料，不能自动重放导入。读取命令不修改资料。`snapshot.read` 保留普通/混合选择，问卷单独返回；它不是完整学习备份文件。

## 当前交付格式

正式生成仍使用文字 `gaga.quiz` v1 或 `gaga.questionnaire` v1。正式备份仍是普通题库 `gaga.quiz.backup` v2（可读旧版）；混合练习和问卷不在当前备份文件内。不要声称一个旧备份包含它们。

完整学习备份、公式原文、真实图片和数学图示的 P2/P3 合同仍处于候选验证，未启用正式生成/写入。不能生成这些候选字段给已发布客户端，也不能将媒体静默删成文字后称为完整导入。微信真机与扩展侧栏媒体验收通过后再更新本说明和格式版本。
