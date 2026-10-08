# Quiz formats

Create one complete JSON document in the user's language. A file or a fenced `json` block is accepted. Use the prepared route to import and display it.

## Knowledge quiz

```json
{
  "format": "gaga.quiz",
  "schemaVersion": 1,
  "title": "Fractions practice",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "stem": "What is $\\frac{1}{2}+\\frac{1}{2}$?",
      "options": [
        { "id": "a", "text": "One whole" },
        { "id": "b", "text": "Two wholes" }
      ],
      "answer": { "optionIds": ["a"] },
      "explanation": "Two halves make one whole."
    }
  ]
}
```

- Envelope: `format`, `schemaVersion`, `title`, `questions`, optional `description` and `metadata`.
- Questions: `id`, `type`, `stem`, `options`, `answer`, optional `explanation` and `metadata`. Each option has `id` and `text`.
- `type` is `single_choice` or `multiple_choice`. `answer.optionIds` references distinct existing options: exactly one for single choice, at least two for multiple choice.
- A quiz has 1–20 questions, 2–6 options per question, and a total size of at most 256 KiB. Text limits: title 1–100, description 1–1000, stem 1–5000, option text 1–2000, explanation 1–8000 characters; optional text fields may be omitted.
- IDs use 1–64 English letters, digits, underscores, or hyphens. Question IDs are unique within a quiz; option IDs within a question. Additional descriptive data belongs in quiz/question `metadata`.
- Imported quizzes retain question order for initial attempts and retakes; options are shuffled for each new attempt. Mixed practice may change question order. Keep questions self-contained and refer to option content in explanations so the wording remains accurate after shuffling.

`stem`, option `text`, and `explanation` support Markdown and MathJax base/AMS LaTeX in both schema versions. Inline math uses `$...$` or `\( ... \)`; display math uses `$$...$$` or `\[ ... \]` on separate lines. Escape backslashes and newlines in JSON strings, as in the example. Code blocks preserve literal text. A formula inside text does not require visual fields or schema version 2.

## Unscored learning questionnaire

Use `gaga.questionnaire`, schema version 1, for goals, background, preferences, and difficulties. It shares the quiz's question-count, option-count, ID, and text-length limits. The envelope supports optional `description` and `metadata`; each question has only `id`, `type`, `stem`, `options`, and optional `metadata`. Both choice types are supported. Questions collect responses without `answer` or `explanation` fields.

Questionnaires preserve imported question and option order. The client adds an **Other** choice and a free-text field to every question, so generate 2–6 substantive options without adding a generic Other option or the reserved ID `$other`. Legacy standalone Other labels are hidden from the displayed choices without changing the original imported document. Selected Other responses are returned as `optionIds` containing `$other` and optional `otherText`, at most 2000 characters. Other counts as answered only with nonblank text; completed feedback includes that text. See [storage](storage.md#independent-questionnaire-cache) for unfinished drafts.

```json
{
  "format": "gaga.questionnaire",
  "schemaVersion": 1,
  "title": "Everyday English goals",
  "questions": [
    {
      "id": "goal",
      "type": "single_choice",
      "stem": "Where would you most like to use English?",
      "options": [
        { "id": "travel", "text": "While travelling" },
        { "id": "conversation", "text": "In everyday conversations" },
        { "id": "unsure", "text": "I am still exploring" }
      ]
    }
  ]
}
```

`questionnaire.import` takes `{ questionnaire }` and opens the first question directly. Read actual selections and `completedAt` with `questionnaire.read`. A new import replaces the single temporary questionnaire; it is separate from quiz scores, history, and backups. Use a knowledge quiz for assessed questions.

## Visual quiz fields

Use `schemaVersion: 2` for visual nodes when supported by current help. Questions may add `visuals` and `explanationVisuals`; options may add `visuals`. Each array holds at most four nodes. Keep essential conditions in text and give each node an accurate `alt` of 1–500 characters.

| Kind         | Fields and limits                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `canvas`     | `width`, `height`, `source`, `alt`. Dimensions are integers 200–2000; ES5 source at most 65536 characters. A complete static drawing.      |
| `formula`    | `capabilityVersion: 1`, `latex`, `alt`. Raw base/AMS LaTeX without dollar delimiters, at most 2000 characters; escape backslashes in JSON. |
| `math_scene` | `templateVersion: 1`, `template`, `params`, `alt`, optional supported `animation`. Use the templates below.                                |
| `image`      | `url`, `alt`. A complete HTTPS image URL supplied in the conversation; the image needs network access.                                     |

For example, a formula node is `{"kind":"formula","capabilityVersion":1,"latex":"\\frac{1}{2}","alt":"One half"}`. Formulas may also appear directly in quiz text as above.

Prefer Canvas source for new diagrams. Generate question and explanation diagrams at 800×600, and option diagrams at 400×300. After the host's 5% padding, `frame.width`/`frame.height` are 740×540 or 370×270. The host scales uniformly, with display caps of 360×270 screen pixels for question diagrams and 240×180 for option diagrams. Keep comparable option pictures at the same scale; keep labels readable, avoid option letters in the drawing, and do not reveal the correct choice.

Canvas `source` is an ES5 drawing-function body using `ctx` and `frame.width`/`frame.height`. Use `var`, functions, loops, arrays, and Math to draw the complete static picture. The Canvas 2D APIs in current `whiteboard.help` also apply, including `ctx.measureFormula` / `ctx.drawFormula` for raw LaTeX; quiz nodes have no animation, segments, steps, or playback fields. Do not create a canvas or use HTML, SVG, DOM, wx, WebGL, imports, timers, network, or image/pixel APIs. Per drawing, stay within 100000 interpreter steps, 10000 drawing calls, and save depth 64. The whole quiz still must fit within 256 KiB.

For example, a static diagram node is:

```json
{
  "kind": "canvas",
  "width": 800,
  "height": 600,
  "source": "ctx.strokeStyle='#1858f5'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(frame.width*0.15,frame.height*0.75); ctx.lineTo(frame.width*0.85,frame.height*0.25); ctx.stroke();",
  "alt": "A line rising from left to right"
}
```

Existing `math_scene` nodes remain readable with the following templates; use original Canvas diagrams for new drawings.

| Geometry template     | Numeric `params`                                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `right_triangle`      | `base`, `height`: 1–10.                                                                                                                                                                                   |
| `quadratic`           | `a`, `b`, `c`: -4–4, with nonzero `a`. Visible range: x -3–3, y -5–5.                                                                                                                                     |
| `parallelogram_shear` | `base`, `height`: 1–10; `offset`: -2–2. Optional `animation` has `parameter: "offset"`, `from` equal to the initial offset, `to` within -2–2, and `durationMs` 500–20000. Playback starts on user action. |

Use finite numeric parameters and keep essential features in the visible range. These visual fields apply to quizzes; questionnaires remain at schema version 1. Quiz backups preserve visual fields; see [storage](storage.md) for retained results and history.
