# 出题格式

以下约束只针对写入题集文件或网页输入框的数据，不是 Agent 最终回复的格式要求。已选择 Web 测验时，生成数据后继续执行 SKILL.md 的导入和交接：知识测验默认以中等难度直接开始，不计分问卷直接打开第一题；自动模式不能在生成 JSON 后结束。只有文字/网页打开能力时按主指引交付 JSON 和带指引链接，让用户粘贴。仅讲解或总结时无需出题。

题集数据是一个完整 JSON 对象（网页也接受完整 JSON 代码围栏），数据内部不混入讲解文案。示例：

```json
{
  "format": "gaga.quiz",
  "schemaVersion": 1,
  "title": "光合作用练习",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "stem": "植物进行光合作用时，主要吸收哪种气体？",
      "options": [
        { "id": "a", "text": "氧气" },
        { "id": "b", "text": "二氧化碳" }
      ],
      "answer": { "optionIds": ["b"] },
      "explanation": "光合作用利用二氧化碳和水合成有机物，并释放氧气。"
    }
  ]
}
```

知识测验 `gaga.quiz` 支持 single_choice 和 multiple_choice。每题 2–12 个选项；单选恰好一个正确选项，多选至少两个。题集 1–100 题且不超过 256 KiB。题集标题不超过 100 字符，可选 description 不超过 1000；题干 5000、选项文本 2000、解析 8000 字符以内。

题目 ID 在题集内唯一，选项 ID 在题目内唯一，均使用 1–64 位英文字母、数字、下划线或短横线。answer.optionIds 必须指向实际选项，不能重复。题集和题目可带描述性的 metadata 对象；不要在其他位置添加自造字段。

题干、选项和解析是纯文本，不执行 HTML。题集格式版本与 Skill 操作版本独立，不能把 schemaVersion 改成 Skill 操作版本。新练习可以注明来源和学习目标，但不要伪造用户作答记录。

## 不计分的学习情况问卷

首次了解学习目标、经验、卡点和时间安排时使用 `format: "gaga.questionnaire"`、`schemaVersion: 1`。同样只支持 `single_choice`、`multiple_choice`，沿用上述题数、文本、选项与 ID 限制。每题只允许 id、type、stem、options 和可选 metadata；禁止 answer、explanation、难度、评分或历史字段（空 answer 也不接受）。

```json
{
  "format": "gaga.questionnaire",
  "schemaVersion": 1,
  "title": "了解你的 Python 学习目标",
  "questions": [
    {
      "id": "goal",
      "type": "single_choice",
      "stem": "你目前最希望用 Python 做什么？",
      "options": [
        { "id": "work", "text": "自动处理工作中的重复任务" },
        { "id": "data", "text": "分析和整理数据" },
        { "id": "explore", "text": "先了解编程，目标还不确定" }
      ]
    }
  ]
}
```

通过独立 `questionnaire.import` 命令传入 `{ questionnaire }`，或在导入页粘贴，确认后直接打开 `/app/questionnaires/<questionnaireId>` 第一题。它只有当前一份临时缓存，没有难度、时限、分数、题集条目、备份或历史；新问卷替换当前缓存。提交后提示用户告知 AI，再用 `questionnaire.read` 读取 `answers` 和 `completedAt` 继续学习，详见 [读取方法](storage.md#独立问卷缓存)。知识诊断另建 `gaga.quiz`。旧网页没有独立问卷能力时保留 JSON 并说明限制，不能伪造正确答案或使用 quiz.import 绕过。

## 微信小程序图文题集

仅在用户使用已支持图文的小程序时生成；Web 和 Chrome 仍使用上述纯文本格式。图文 v2 沿用 v1 的题目、答案和长度限制，不适用于问卷。导入提示词也会给出相同能力范围。

图文规则（仅适用于微信小程序）：

- 有图文时 schemaVersion 使用 2；纯文本题集继续使用 1 并省略所有图文字段。
- 题目可以增加 visuals（题干图文）、explanationVisuals（解析图文）；选项可以增加 visuals。每个数组最多 4 项。题干和选项仍须有可独立理解的文字。
- 每个节点须有非空 alt（最多 500 字符），准确描述图中信息；题干与选项的 alt 不得泄露解题结论。不要在 stem、text 或 explanation 中内嵌 LaTeX/Markdown 图片，公式放入对应图文数组。
- 公式：{"kind":"formula","capabilityVersion":1,"latex":"\\frac{1}{2}","alt":"二分之一"}。latex 保存原文，最多 2000 字符、24 层花括号，不加美元分隔符；JSON 中反斜杠须转义。支持 frac/dfrac/tfrac、sqrt、上下标、left/right、sum/prod、int、lim、三角函数、希腊字母、binom、vec/hat/bar/overline，以及 aligned/gathered/cases/matrix/pmatrix/bmatrix/vmatrix/Vmatrix/array 环境。中文放在文字或 alt，不放进公式；不使用自定义宏、外部包、HTML 或脚本。
- 直角三角形：{"kind":"math_scene","templateVersion":1,"template":"right_triangle","params":{"base":3,"height":4},"alt":"两条直角边为三和四的直角三角形"}。base、height 在 1～10 之间。
- 二次函数：{"kind":"math_scene","templateVersion":1,"template":"quadratic","params":{"a":1,"b":0,"c":-1},"alt":"开口向上、顶点为零负一的抛物线"}。a、b、c 在 -4～4 之间，a 不为零；视野横轴 -3～3、纵轴 -5～5，关键特征应位于视野内。
- 平行四边形：{"kind":"math_scene","templateVersion":1,"template":"parallelogram_shear","params":{"base":4,"height":3,"offset":0},"alt":"底四高三的平行四边形"}。底、高在 1～10 之间，offset 在 -2～2 之间。可添加 animation:{"parameter":"offset","from":0,"to":2,"durationMs":4000}，from 必须等于 offset，from/to 在 -2～2 之间，时长在 500～20000 毫秒之间。动画需用户手动播放。
- 普通图片：{"kind":"image","url":"https://example.com/diagram.png","alt":"图中内容说明"}。这只是网址格式示例，不能把示例地址用于出题。只使用用户或本次会话实际提供的完整 HTTPS 图片网址，不能编造网址。仅保存网址和说明，不下载持久保存图片，不使用 Base64、文件路径、SVG 源码或 assetId。图片显示需要网络；重要题目条件同时写入文字。
- 所有参数须为有限数值，不接受表达式、任意绘图源码、事件处理器或自造模板。超出支持能力时先说明缺口，不删除必需数学条件来强行通过校验。

示例：在上述题目的 `visuals` 数组中放入公式或图形节点，同时把题集的 `schemaVersion` 改为 2。几何保存模板和数值参数，不执行用户绘图脚本。公式与几何离线绘制，普通图片需要网络。备份为原有 v3 JSON，完整保留图文字段和最近作答结果。
