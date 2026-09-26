# Quiz formats

These constraints describe learning content. Create it for the route already selected in SKILL.md; do not choose another execution mode or stop at JSON during an automatic task.

Provide one complete JSON object; the website also accepts a complete fenced JSON block. Do not insert instructional prose into the data. Example:

```json
{
  "format": "gaga.quiz",
  "schemaVersion": 1,
  "title": "Photosynthesis practice",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "stem": "Which gas do plants primarily absorb during photosynthesis?",
      "options": [
        { "id": "a", "text": "Oxygen" },
        { "id": "b", "text": "Carbon dioxide" }
      ],
      "answer": { "optionIds": ["b"] },
      "explanation": "Photosynthesis uses carbon dioxide and water to produce organic matter and releases oxygen."
    }
  ]
}
```

Knowledge quizzes (`gaga.quiz`) support `single_choice` and `multiple_choice`. Each question has 2–12 options. Single choice has exactly one correct option; multiple choice has at least two. A quiz contains 1–100 questions and is at most 256 KiB. Maximum character counts: title 100, optional description 1000, stem 5000, option text 2000, and explanation 8000.

Question IDs must be unique within the quiz; option IDs must be unique within their question. Use 1–64 English letters, digits, underscores, or hyphens. `answer.optionIds` must reference real options without duplicates. A quiz or question may have a descriptive `metadata` object. Do not add invented fields elsewhere.

Stems, options, and explanations are plain text, not executable HTML. Quiz schema versions are independent of the skill operation version; do not set `schemaVersion` to the skill version. New exercises may identify sources and learning goals, but must not fabricate user answer records. Write learning content in the user's preferred language; the English examples do not set a required output language.

## Unscored learning questionnaire

Use `format: "gaga.questionnaire"` and `schemaVersion: 1` to learn about goals, experience, difficulties, and available study time. It supports only `single_choice` and `multiple_choice` with the same question, text, option, and ID limits above. Each question allows only `id`, `type`, `stem`, `options`, and optional `metadata`. Do not include `answer`, `explanation`, difficulty, scoring, or history fields; even an empty `answer` is rejected.

```json
{
  "format": "gaga.questionnaire",
  "schemaVersion": 1,
  "title": "Your Python learning goals",
  "questions": [
    {
      "id": "goal",
      "type": "single_choice",
      "stem": "What would you most like to use Python for right now?",
      "options": [
        { "id": "work", "text": "Automating repetitive work tasks" },
        { "id": "data", "text": "Analyzing and organizing data" },
        { "id": "explore", "text": "Exploring programming before choosing a goal" }
      ]
    }
  ]
}
```

Pass `{ questionnaire }` to the separate `questionnaire.import` command through the prepared route. After validation and saving, it opens the first question at `/app/questionnaires/<questionnaireId>`. Only one temporary questionnaire is cached. There is no difficulty, timer, score, library entry, backup, or history; a new questionnaire replaces the current cache. After submission, the page asks the user to notify the AI. Read `answers` and `completedAt` with `questionnaire.read` to continue; see [the independent cache](storage.md#independent-questionnaire-cache). Use a separate `gaga.quiz` for knowledge diagnostics. If an older site lacks independent questionnaires, retain the JSON and explain the limitation; do not invent correct answers or bypass it with `quiz.import`.

## Visual quizzes

Use the format below when the connected Web page declares visual support in its current capability descriptions. Older clients may reject it; do not remove required visuals to force an import. Visual v2 retains v1 question, answer, and length limits and does not apply to questionnaires. Import prompts describe the same supported capabilities.

Shared rules:

- Use `schemaVersion: 2` when including visuals. Plain-text quizzes remain at version 1 and omit all visual fields.
- Questions may include `visuals` for the stem and `explanationVisuals` for the explanation; options may include `visuals`. Each array contains at most four items. Stems and options must still contain meaningful standalone text.
- Every visual needs a nonempty `alt` of at most 500 characters accurately describing its content. Stem and option descriptions must not reveal the solution. Do not embed LaTeX or Markdown images in `stem`, `text`, or `explanation`; place formulas in the corresponding visual arrays.
- Formula: `{"kind":"formula","capabilityVersion":1,"latex":"\\frac{1}{2}","alt":"One half"}`. Store raw LaTeX without dollar delimiters, at most 2000 characters and 24 nested brace levels. Escape backslashes in JSON. Supported notation includes frac/dfrac/tfrac, sqrt, subscripts and superscripts, left/right, sum/prod, int, lim, trigonometric functions, Greek letters, binom, vec/hat/bar/overline, and aligned/gathered/cases/matrix/pmatrix/bmatrix/vmatrix/Vmatrix/array environments. Put Chinese text in ordinary text or `alt`, not in formulas. Do not use custom macros, external packages, HTML, or scripts.
- Right triangle: `{"kind":"math_scene","templateVersion":1,"template":"right_triangle","params":{"base":3,"height":4},"alt":"A right triangle with legs of length three and four"}`. `base` and `height` range from 1 to 10.
- Quadratic: `{"kind":"math_scene","templateVersion":1,"template":"quadratic","params":{"a":1,"b":0,"c":-1},"alt":"An upward-opening parabola with vertex at zero, negative one"}`. `a`, `b`, and `c` range from -4 to 4, with nonzero `a`. The viewport is x from -3 to 3 and y from -5 to 5; keep essential features within it.
- Parallelogram: `{"kind":"math_scene","templateVersion":1,"template":"parallelogram_shear","params":{"base":4,"height":3,"offset":0},"alt":"A parallelogram with base four and height three"}`. Base and height range from 1 to 10; `offset` ranges from -2 to 2. Optional `animation:{"parameter":"offset","from":0,"to":2,"durationMs":4000}` requires `from` to equal `offset`, both endpoints within -2 to 2, and duration from 500 to 20000 milliseconds. The user starts playback manually.
- Image: `{"kind":"image","url":"https://example.com/diagram.png","alt":"Description of the diagram"}`. This is a URL-format example, not an image source for a real quiz. Use only complete HTTPS image URLs actually supplied by the user or in this conversation; never invent URLs. Store only the URL and description, without persistent image downloads, Base64, file paths, SVG source, or `assetId`. Images require a network connection; include essential problem conditions in text too.
- All parameters must be finite numbers. Expressions, arbitrary drawing code, event handlers, and invented templates are not accepted. Explain unsupported requirements instead of dropping essential mathematical conditions to pass validation.

For example, add formula or geometry nodes to a question's `visuals` array and change the quiz's `schemaVersion` to 2. Geometry stores templates and numeric parameters without running user drawing scripts. Formulas and geometry render offline; URL images need network access. The existing v3 JSON backup preserves all visual fields and latest answer results.
