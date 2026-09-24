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
