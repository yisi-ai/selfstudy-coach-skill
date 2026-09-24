// apps/web/skills/selfstudy-coach/tools/study-bridge.ts
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path2 from "node:path";
import { fileURLToPath } from "node:url";

// packages/consumer-core/src/quiz.ts
var QUIZ_FORMAT = "gaga.quiz";
var QUIZ_VERSION = 1;
var QUIZ_MAX_BYTES = 256 * 1024;
var QUIZ_IMPORT_MAX_BYTES = 4 * 1024 * 1024;
var QUIZ_MAX_QUESTIONS = 100;
var QuizError = class extends Error {
  constructor(code, message, path3 = "") {
    super(path3 ? `${message}\uFF08${path3}\uFF09` : message);
    this.code = code;
    this.path = path3;
    this.name = "QuizError";
  }
  code;
  path;
};
function quizAssert(condition, message, path3 = "") {
  if (!condition) throw new QuizError("INVALID_DATA", message, path3);
}
function quizObject(value, path3) {
  quizAssert(value && typeof value === "object" && !Array.isArray(value), "\u5E94\u4E3A\u5BF9\u8C61", path3);
  return value;
}
function quizFields(value, fields, path3) {
  for (const key of Object.keys(value)) {
    quizAssert(fields.includes(key), "\u5B58\u5728\u672A\u5B9A\u4E49\u7684\u5B57\u6BB5", path3 ? `${path3}.${key}` : key);
  }
}
function quizText(value, max, path3) {
  quizAssert(typeof value === "string" && value.trim().length > 0, "\u8BF7\u586B\u5199\u975E\u7A7A\u6587\u672C", path3);
  quizAssert(value.length <= max, `\u6587\u672C\u4E0D\u80FD\u8D85\u8FC7 ${String(max)} \u5B57\u7B26`, path3);
  return value;
}
function quizId(value, path3) {
  const id = quizText(value, 64, path3);
  quizAssert(/^[a-zA-Z0-9_-]+$/.test(id), "ID \u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\u548C\u77ED\u6A2A\u7EBF", path3);
  return id;
}
function quizBytes(value) {
  let bytes = 0;
  for (const char of value) {
    const point = char.charCodeAt(0);
    bytes += char.length === 2 ? 4 : point <= 127 ? 1 : point <= 2047 ? 2 : 3;
  }
  return bytes;
}
function readQuizVersion(input, field, target, validators, migrations) {
  let value = input;
  const version = quizObject(value, "")[field];
  quizAssert(Number.isInteger(version) && Number(version) > 0, "\u7F3A\u5C11\u6709\u6548\u7248\u672C\u53F7", field);
  if (Number(version) > target) {
    throw new QuizError("FUTURE_VERSION", "\u6B64\u6570\u636E\u7531\u66F4\u65B0\u7248\u672C\u751F\u6210\uFF0C\u8BF7\u66F4\u65B0\u5C0F\u7A0B\u5E8F\u540E\u518D\u6253\u5F00", field);
  }
  for (let current = Number(version); current <= target; current += 1) {
    const validate = validators[current];
    if (!validate)
      throw new QuizError("MIGRATION_MISSING", "\u6682\u65F6\u7F3A\u5C11\u6B64\u7248\u672C\u7684\u8FC1\u79FB\u89C4\u5219\uFF0C\u539F\u6570\u636E\u5DF2\u4FDD\u7559");
    value = validate(value);
    if (current === target) return value;
    const migrate = migrations[current];
    if (!migrate)
      throw new QuizError("MIGRATION_MISSING", "\u6682\u65F6\u7F3A\u5C11\u6B64\u7248\u672C\u7684\u8FC1\u79FB\u89C4\u5219\uFF0C\u539F\u6570\u636E\u5DF2\u4FDD\u7559");
    value = migrate(JSON.parse(JSON.stringify(value)));
    quizAssert(quizObject(value, "")[field] === current + 1, "\u8FC1\u79FB\u540E\u7684\u7248\u672C\u53F7\u4E0D\u6B63\u786E", field);
  }
  throw new QuizError("INVALID_VERSION", "\u7248\u672C\u53F7\u4E0D\u6B63\u786E", field);
}
function validateMetadata(value, path3, depth = 0) {
  quizAssert(depth <= 10, "\u9644\u52A0\u4FE1\u606F\u5D4C\u5957\u8FC7\u6DF1", path3);
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    quizAssert(Number.isFinite(value), "\u6570\u503C\u65E0\u6548", path3);
    return;
  }
  const object2 = Array.isArray(value) ? value : quizObject(value, path3);
  for (const [key, child] of Object.entries(object2))
    validateMetadata(child, `${path3}.${key}`, depth + 1);
}
function optionalMetadata(object2, path3) {
  if (object2.metadata !== void 0) {
    quizObject(object2.metadata, `${path3}.metadata`);
    validateMetadata(object2.metadata, `${path3}.metadata`);
  }
}
function readChoiceQuestion(input, path3) {
  const q = quizObject(input, path3);
  const id = quizId(q.id, `${path3}.id`);
  quizAssert(
    q.type === "single_choice" || q.type === "multiple_choice",
    "\u5F53\u524D\u4EC5\u652F\u6301\u5355\u9009\u9898\u548C\u591A\u9009\u9898",
    `${path3}.type`
  );
  quizText(q.stem, 5e3, `${path3}.stem`);
  quizAssert(
    Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 12,
    "\u6BCF\u9898\u9700\u8981 2\uFF5E12 \u4E2A\u9009\u9879",
    `${path3}.options`
  );
  const optionIds = /* @__PURE__ */ new Set();
  q.options.forEach((inputOption, optionIndex) => {
    const optionPath = `${path3}.options[${String(optionIndex)}]`;
    const option = quizObject(inputOption, optionPath);
    quizFields(option, ["id", "text"], optionPath);
    const optionId = quizId(option.id, `${optionPath}.id`);
    quizAssert(!optionIds.has(optionId), "\u9009\u9879 ID \u91CD\u590D", `${optionPath}.id`);
    optionIds.add(optionId);
    quizText(option.text, 2e3, `${optionPath}.text`);
  });
  optionalMetadata(q, path3);
  return {
    id,
    type: q.type,
    stem: q.stem,
    options: q.options,
    ...q.metadata === void 0 ? {} : { metadata: q.metadata }
  };
}
function checkChoiceSelection(question, ids) {
  quizAssert(Array.isArray(ids), "\u4F5C\u7B54\u5E94\u4E3A\u9009\u9879\u6570\u7EC4");
  quizAssert(
    new Set(ids).size === ids.length && ids.every((id) => question.options.some((option) => option.id === id)),
    "\u4F5C\u7B54\u5305\u542B\u91CD\u590D\u6216\u4E0D\u5B58\u5728\u7684\u9009\u9879",
    question.id
  );
  quizAssert(
    question.type !== "single_choice" || ids.length <= 1,
    "\u5355\u9009\u9898\u53EA\u80FD\u9009\u62E9\u4E00\u4E2A\u9009\u9879",
    question.id
  );
}
function validateQuizV1(input) {
  const value = quizObject(input, "");
  quizFields(
    value,
    ["format", "schemaVersion", "title", "description", "questions", "metadata"],
    ""
  );
  quizAssert(value.format === QUIZ_FORMAT, "\u8FD9\u4E0D\u662F\u95EE\u7B54\u6D4B\u9A8C\u9898\u96C6", "format");
  quizText(value.title, 100, "title");
  if (value.description !== void 0) quizText(value.description, 1e3, "description");
  optionalMetadata(value, "\u9898\u96C6");
  quizAssert(
    Array.isArray(value.questions) && value.questions.length > 0,
    "\u9898\u96C6\u81F3\u5C11\u9700\u8981\u4E00\u9053\u9898",
    "questions"
  );
  quizAssert(
    value.questions.length <= QUIZ_MAX_QUESTIONS,
    `\u6BCF\u4EFD\u9898\u96C6\u6700\u591A ${String(QUIZ_MAX_QUESTIONS)} \u9053\u9898`,
    "questions"
  );
  const questionIds = /* @__PURE__ */ new Set();
  const questions = value.questions.map((inputQuestion, index) => {
    const path3 = `questions[${String(index)}]`;
    const q = quizObject(inputQuestion, path3);
    quizFields(q, ["id", "type", "stem", "options", "answer", "explanation", "metadata"], path3);
    const question = readChoiceQuestion(q, path3);
    quizAssert(!questionIds.has(question.id), "\u9898\u76EE ID \u91CD\u590D", `${path3}.id`);
    questionIds.add(question.id);
    const optionIds = new Set(question.options.map((option) => option.id));
    const answer = quizObject(q.answer, `${path3}.answer`);
    quizFields(answer, ["optionIds"], `${path3}.answer`);
    quizAssert(
      Array.isArray(answer.optionIds),
      "\u6B63\u786E\u7B54\u6848\u5E94\u4E3A\u9009\u9879 ID \u6570\u7EC4",
      `${path3}.answer.optionIds`
    );
    const ids = answer.optionIds;
    quizAssert(
      q.type === "single_choice" ? ids.length === 1 : ids.length >= 2,
      "\u5355\u9009\u9700\u8981\u4E00\u4E2A\u6B63\u786E\u7B54\u6848\uFF0C\u591A\u9009\u81F3\u5C11\u9700\u8981\u4E24\u4E2A",
      `${path3}.answer.optionIds`
    );
    quizAssert(
      new Set(ids).size === ids.length && ids.every((item) => typeof item === "string" && optionIds.has(item)),
      "\u7B54\u6848\u5305\u542B\u91CD\u590D\u6216\u4E0D\u5B58\u5728\u7684\u9009\u9879 ID",
      `${path3}.answer.optionIds`
    );
    if (q.explanation !== void 0) quizText(q.explanation, 8e3, `${path3}.explanation`);
    optionalMetadata(q, path3);
    return { ...q, answer };
  });
  const result = { ...value, questions };
  quizAssert(
    quizBytes(JSON.stringify(result)) <= QUIZ_MAX_BYTES,
    "\u5355\u4EFD\u9898\u96C6\u8D85\u8FC7 256 KiB\uFF0C\u8BF7\u62C6\u5206\u540E\u5BFC\u5165"
  );
  return result;
}
function readQuiz(input) {
  const format = quizObject(input, "").format;
  quizAssert(format === QUIZ_FORMAT, "\u8FD9\u4E0D\u662F\u95EE\u7B54\u6D4B\u9A8C\u9898\u96C6", "format");
  return readQuizVersion(input, "schemaVersion", QUIZ_VERSION, { 1: validateQuizV1 }, {});
}
function gradeQuizQuestion(question, selectedIds) {
  const correct = question.answer.optionIds;
  if (correct.length === 0) return null;
  return new Set(selectedIds).size === selectedIds.length && selectedIds.length === correct.length && correct.every((id) => selectedIds.includes(id));
}

// packages/consumer-core/src/questionnaire.ts
var QUESTIONNAIRE_FORMAT = "gaga.questionnaire";
function readQuestionnaire(input) {
  return readQuizVersion(
    input,
    "schemaVersion",
    1,
    {
      1: (input2) => {
        const value = quizObject(input2, "questionnaire");
        quizFields(
          value,
          ["format", "schemaVersion", "title", "description", "questions", "metadata"],
          "questionnaire"
        );
        quizAssert(value.format === QUESTIONNAIRE_FORMAT, "\u8FD9\u4E0D\u662F\u95EE\u5377", "format");
        quizText(value.title, 100, "title");
        if (value.description !== void 0) quizText(value.description, 1e3, "description");
        optionalMetadata(value, "questionnaire");
        quizAssert(
          Array.isArray(value.questions) && value.questions.length > 0 && value.questions.length <= QUIZ_MAX_QUESTIONS,
          "\u95EE\u5377\u9700\u8981 1\uFF5E100 \u4E2A\u95EE\u9898",
          "questions"
        );
        const ids = /* @__PURE__ */ new Set();
        const questions = value.questions.map((input3, index) => {
          const path3 = `questions[${String(index)}]`;
          quizFields(quizObject(input3, path3), ["id", "type", "stem", "options", "metadata"], path3);
          const question = readChoiceQuestion(input3, path3);
          quizAssert(!ids.has(question.id), "\u9898\u76EE ID \u91CD\u590D", path3);
          ids.add(question.id);
          return question;
        });
        const result = { ...value, questions };
        quizAssert(quizBytes(JSON.stringify(result)) <= QUIZ_MAX_BYTES, "\u5355\u4EFD\u95EE\u5377\u8D85\u8FC7 256 KiB");
        return JSON.parse(JSON.stringify(result));
      }
    },
    {}
  );
}
function readQuestionnaireSession(input) {
  const value = quizObject(input, "session");
  quizFields(
    value,
    [
      "schemaVersion",
      "id",
      "questionnaire",
      "createdAt",
      "updatedAt",
      "completedAt",
      "currentIndex",
      "answers"
    ],
    "session"
  );
  quizAssert(value.schemaVersion === 1, "\u95EE\u5377\u7F13\u5B58\u7248\u672C\u65E0\u6548");
  quizId(value.id, "session.id");
  const questionnaire = readQuestionnaire(value.questionnaire);
  for (const key of [
    "createdAt",
    "updatedAt",
    ...value.completedAt === null ? [] : ["completedAt"]
  ])
    quizAssert(Number.isSafeInteger(value[key]) && Number(value[key]) >= 0, "\u65F6\u95F4\u8BB0\u5F55\u65E0\u6548", key);
  quizAssert(Number(value.updatedAt) >= Number(value.createdAt), "\u65F6\u95F4\u8BB0\u5F55\u987A\u5E8F\u65E0\u6548");
  quizAssert(
    Number.isInteger(value.currentIndex) && Number(value.currentIndex) >= 0 && Number(value.currentIndex) < questionnaire.questions.length,
    "\u5F53\u524D\u9898\u76EE\u4F4D\u7F6E\u65E0\u6548"
  );
  quizAssert(
    Array.isArray(value.answers) && value.answers.length === questionnaire.questions.length,
    "\u4F5C\u7B54\u6570\u91CF\u65E0\u6548"
  );
  value.answers.forEach((input2, index) => {
    const answer = quizObject(input2, "answer");
    const question = questionnaire.questions[index];
    quizAssert(question, "\u95EE\u9898\u4E0D\u5B58\u5728");
    quizFields(answer, ["questionId", "optionIds"], "answer");
    quizAssert(answer.questionId === question.id, "\u4F5C\u7B54\u5173\u8054\u9898\u76EE\u65E0\u6548");
    checkChoiceSelection(question, answer.optionIds);
    if (value.completedAt !== null) quizAssert(answer.optionIds.length > 0, "\u95EE\u5377\u5C1A\u672A\u7B54\u5B8C");
  });
  if (value.completedAt !== null)
    quizAssert(
      Number(value.completedAt) >= Number(value.createdAt) && Number(value.completedAt) <= Number(value.updatedAt),
      "\u5B8C\u6210\u65F6\u95F4\u65E0\u6548"
    );
  return JSON.parse(JSON.stringify({ ...value, questionnaire }));
}

// packages/consumer-core/src/quiz-session.ts
var QUIZ_MODES = ["easy", "medium", "hard"];
var QUIZ_MODE_NAMES = {
  easy: "\u7B80\u5355",
  medium: "\u4E2D\u7B49",
  hard: "\u56F0\u96BE"
};
var QUIZ_SETTINGS = {
  modeNames: { ...QUIZ_MODE_NAMES }
};
var QUIZ_GRADING_RULE = "exact-set-v1";
function timestamp(value, path3) {
  quizAssert(Number.isSafeInteger(value) && Number(value) >= 0, "\u65F6\u95F4\u8BB0\u5F55\u65E0\u6548", path3);
  return value;
}
function checkSelection(quiz, index, ids) {
  const q = quiz.questions[index];
  quizAssert(q, "\u9898\u76EE\u4E0D\u5B58\u5728");
  checkChoiceSelection(q, ids);
}
function readQuizAttempt(input, quiz) {
  const value = quizObject(input, "attempt");
  quizFields(
    value,
    [
      "id",
      "startedAt",
      "updatedAt",
      "completedAt",
      "mode",
      "feedbackMode",
      "deadlineAt",
      "finishReason",
      "gradingRule",
      "currentIndex",
      "answers"
    ],
    "attempt"
  );
  quizId(value.id, "attempt.id");
  const start = timestamp(value.startedAt, "attempt.startedAt");
  const updated = timestamp(value.updatedAt, "attempt.updatedAt");
  quizAssert(updated >= start, "\u6D4B\u9A8C\u65F6\u95F4\u987A\u5E8F\u65E0\u6548");
  quizAssert(QUIZ_MODES.includes(value.mode), "\u672A\u77E5\u7B54\u9898\u96BE\u5EA6");
  quizAssert(
    value.feedbackMode === (value.mode === "easy" ? "immediate" : "after_finish") && value.gradingRule === QUIZ_GRADING_RULE,
    "\u5F53\u524D\u7248\u672C\u4E0D\u652F\u6301\u6B64\u6D4B\u9A8C\u7684\u53CD\u9988\u6216\u8BA1\u5206\u89C4\u5219"
  );
  if (value.mode === "hard") {
    quizAssert(
      timestamp(value.deadlineAt, "attempt.deadlineAt") === start + quiz.questions.length * 3e4,
      "\u9650\u65F6\u6D4B\u9A8C\u7684\u622A\u6B62\u65F6\u95F4\u65E0\u6548"
    );
  } else quizAssert(value.deadlineAt === null, "\u6B64\u96BE\u5EA6\u4E0D\u5E94\u6709\u9650\u65F6\u8BBE\u7F6E");
  const completed = value.completedAt === null ? null : timestamp(value.completedAt, "attempt.completedAt");
  const timedOut = value.finishReason === "timeout";
  if (completed === null) quizAssert(value.finishReason === null, "\u672A\u5B8C\u6210\u6D4B\u9A8C\u4E0D\u80FD\u5DF2\u6709\u7ED3\u675F\u539F\u56E0");
  else {
    quizAssert(completed >= start && completed <= updated, "\u5B8C\u6210\u65F6\u95F4\u65E0\u6548");
    quizAssert(value.finishReason === "answered" || timedOut, "\u6D4B\u9A8C\u7ED3\u675F\u539F\u56E0\u65E0\u6548");
    if (timedOut)
      quizAssert(value.mode === "hard" && completed === value.deadlineAt, "\u8D85\u65F6\u4EA4\u5377\u8BB0\u5F55\u65E0\u6548");
    else if (value.mode === "hard")
      quizAssert(completed < Number(value.deadlineAt), "\u5DF2\u8D85\u8FC7\u7B54\u9898\u65F6\u9650");
  }
  quizAssert(
    Number.isInteger(value.currentIndex) && Number(value.currentIndex) >= 0 && Number(value.currentIndex) < quiz.questions.length,
    "\u5F53\u524D\u9898\u76EE\u4F4D\u7F6E\u65E0\u6548"
  );
  quizAssert(
    Array.isArray(value.answers) && value.answers.length === quiz.questions.length,
    "\u4F5C\u7B54\u8BB0\u5F55\u4E0E\u9898\u76EE\u6570\u91CF\u4E0D\u4E00\u81F4"
  );
  let firstUnsubmitted = quiz.questions.length;
  value.answers.forEach((inputAnswer, index) => {
    const path3 = `answers[${String(index)}]`;
    const question = quiz.questions[index];
    quizAssert(question, "\u4F5C\u7B54\u5173\u8054\u9898\u76EE\u4E0D\u5B58\u5728", path3);
    const answer = quizObject(inputAnswer, path3);
    quizFields(answer, ["questionId", "optionIds", "submittedAt", "correct"], path3);
    quizAssert(answer.questionId === question.id, "\u4F5C\u7B54\u8BB0\u5F55\u5173\u8054\u4E86\u4E0D\u540C\u9898\u76EE", path3);
    checkSelection(quiz, index, answer.optionIds);
    if (answer.submittedAt === null) {
      firstUnsubmitted = Math.min(firstUnsubmitted, index);
      quizAssert(answer.correct === null, "\u672A\u63D0\u4EA4\u7684\u9898\u76EE\u4E0D\u80FD\u5DF2\u6709\u6210\u7EE9", path3);
      if (value.mode === "easy" && index > firstUnsubmitted)
        quizAssert(answer.optionIds.length === 0, "\u5B58\u5728\u8D8A\u8FC7\u5F53\u524D\u9898\u76EE\u7684\u4F5C\u7B54", path3);
    } else {
      const submitted = timestamp(answer.submittedAt, `${path3}.submittedAt`);
      if (value.mode === "easy")
        quizAssert(firstUnsubmitted === quiz.questions.length, "\u5B58\u5728\u8DF3\u8FC7\u672A\u63D0\u4EA4\u9898\u76EE\u7684\u8BB0\u5F55", path3);
      quizAssert(
        submitted >= start && submitted <= updated && (completed === null || submitted <= completed),
        "\u63D0\u4EA4\u8BB0\u5F55\u65E0\u6548",
        path3
      );
      if (value.mode === "hard")
        quizAssert(
          submitted < Number(value.deadlineAt) || timedOut && submitted === value.deadlineAt,
          "\u5B58\u5728\u8D85\u65F6\u540E\u7684\u4F5C\u7B54",
          path3
        );
      quizAssert(
        answer.optionIds.length > 0 || timedOut && submitted === value.deadlineAt,
        "\u63D0\u4EA4\u8BB0\u5F55\u7F3A\u5C11\u7B54\u6848",
        path3
      );
      const expected = value.mode === "easy" || completed !== null ? gradeQuizQuestion(question, answer.optionIds) : null;
      quizAssert(answer.correct === expected, "\u6210\u7EE9\u4E0E\u539F\u8BA1\u5206\u89C4\u5219\u4E0D\u4E00\u81F4", path3);
    }
  });
  if (value.mode === "easy")
    quizAssert(Number(value.currentIndex) <= firstUnsubmitted, "\u5F53\u524D\u4F4D\u7F6E\u8D8A\u8FC7\u4E86\u672A\u63D0\u4EA4\u7684\u9898\u76EE");
  quizAssert(
    firstUnsubmitted === quiz.questions.length === (completed !== null),
    "\u5B8C\u6210\u72B6\u6001\u4E0E\u4F5C\u7B54\u8BB0\u5F55\u4E0D\u4E00\u81F4"
  );
  return value;
}
function quizAttemptResult(attempt) {
  const submitted = attempt.answers.filter((a) => a.submittedAt !== null).length;
  const correct = attempt.answers.filter((a) => a.correct === true).length;
  return {
    total: attempt.answers.length,
    submitted,
    correct,
    incorrect: submitted - correct,
    accuracy: Math.round(correct / attempt.answers.length * 100)
  };
}

// packages/quiz-react/locales/en/common.json
var common_default = {
  skillUi: {
    brand: "GAGA learn",
    skills: "Explore",
    favorites: "Saved",
    language: "Language",
    intro: "A little help from AI",
    listTitle: "Find your next small step",
    empty: "No skills here yet.",
    loading: "Loading skills\u2026",
    retry: "Try again",
    details: "About this skill",
    configure: "Make it yours",
    back: "All skills",
    favorite: "Save skill",
    unfavorite: "Remove from saved",
    localNote: "Saved on this browser. No account needed.",
    configureHint: "Choose what works for you, then take the prompt to your AI chat.",
    generate: "Create prompt",
    generating: "Creating\u2026",
    generated: "Ready",
    failed: "Could not create prompt",
    copy: "Copy prompt",
    copying: "Copying\u2026",
    copied: "Copied",
    copyFailed: "Select and copy the text",
    prompt: "Your prompt",
    previous: "Previous",
    next: "Next"
  },
  skillState: {
    savedTitle: "Your saved skills",
    savedEmpty: "Save a skill to find it here next time.",
    contentLanguage: "Content: {{language}}",
    fallback: "English is not available for this skill. Showing the complete Chinese version.",
    unavailable: "This skill is currently unavailable.",
    unavailableSaved: "Currently unavailable. Your saved reference is kept.",
    loadFailed: "Could not load content. Check your connection and try again.",
    storageFailed: "Could not read or save favorites. Your existing data has been kept.",
    languageSaveFailed: "Your language could not be saved on this browser.",
    contentChanged: "This skill has been updated. Review the current options and create the prompt again.",
    resourceInvalid: "The prompt resource could not be verified. Please try again.",
    configInvalid: "Check the highlighted fields before continuing.",
    yes: "Yes",
    no: "No",
    choose: "Choose an option",
    requiredMark: "Required",
    skip: "Skip to content",
    notFound: "This page could not be found."
  },
  validation: {
    required: "Please complete this field.",
    number: "Enter a valid number.",
    minimum: "Use at least {{minimum}}.",
    maximum: "Use at most {{maximum}}.",
    step: "Use increments of {{step}}.",
    date: "Enter a valid date.",
    past_date: "Choose today or a future date.",
    future_date: "Choose today or a past date.",
    boolean: "Choose yes or no.",
    option: "Choose an available option.",
    options: "Choose available options.",
    chat_record: "Paste a valid chat record."
  },
  homeUi: {
    eyebrow: "MAKE ROOM FOR WHAT YOU LEARN",
    headline: "AI-powered quizzes.\nLearn through practice.",
    intro: "Turn your AI conversations into quizzes with GAGA learn. Practice at your own pace, review explanations, and keep your progress in this browser.",
    cta: "Start a quiz",
    howLink: "See how it works",
    promise: "No account needed. Your quizzes stay in your browser.",
    howTitle: "From a good chat to a little practice.",
    howIntro: "Bring the conversation you already have. We help you turn it into something you remember.",
    stepOneTitle: "Let your AI write the questions",
    stepOneBody: "Copy our prompt into the AI conversation you want to revisit. Your AI creates a quiz from what you discussed.",
    stepTwoTitle: "Bring your quiz back",
    stepTwoBody: "Paste the reply or open a JSON file. Preview the quiz before adding it to your library.",
    stepThreeTitle: "Find out what stuck",
    stepThreeBody: "Choose a practice mode, answer at your own pace, and revisit the explanations when you finish.",
    modesTitle: "A pace for every kind of practice.",
    easyTitle: "Learn as you go",
    easyBody: "Get feedback and an explanation after each answer. No timer, no rush.",
    mediumTitle: "See the whole picture",
    mediumBody: "Answer the full quiz before seeing your results. Keep your focus on the questions.",
    hardTitle: "Add a little challenge",
    hardBody: "A shared time limit of 30 seconds per question. Use your time wherever you need it most.",
    aboutTitle: "Learning starts with a question.",
    aboutBody: "GAGA learn is a place to make AI part of everyday learning. Our quiz workspace turns conversations into personal practice: a library of your own, saved progress, and a clearer picture of what to revisit.",
    faqTitle: "A few things to know.",
    faqOneQuestion: "Does GAGA learn generate the quiz for me?",
    faqOneAnswer: "You use the provided prompt in your own AI conversation, then import its reply. GAGA learn checks the quiz format and handles practice and scoring. AI-written questions can contain mistakes; check them against your source material.",
    faqTwoQuestion: "Where are my quizzes and answers stored?",
    faqTwoAnswer: "In this browser, on this device. They are not uploaded to an account. Export a library backup before clearing browser data or moving to another device.",
    faqThreeQuestion: "Can I bring a quiz from the WeChat app?",
    faqThreeAnswer: "Yes. Import a quiz file or a compatible library backup from the WeChat app. Restoring a backup adds its quizzes and attempts without replacing your existing library.",
    closing: "Keep a little more from your next conversation.",
    seoTitle: "GAGA learn \u2014 AI-Powered Quizzes & Practice",
    seoDescription: "Turn AI conversations into practice quizzes with GAGA learn. Import questions, choose a practice mode, and review answers. No account needed.",
    privacy: "Privacy",
    terms: "Terms",
    sampleLabel: "Sample question",
    sampleQuestion: "What helps a new idea stick?",
    sampleAnswer: "Try recalling it before checking the answer.",
    sampleNote: "A small example of learning through practice.",
    copyrightNotice: "Copyright \xA9 2026 \u58F9\u601D AI",
    icpRegistration: "ICP\u5907\u6848/\u8BB8\u53EF\u8BC1\u53F7\uFF1A\u8700ICP\u59072026036163\u53F7-1",
    policeRegistration: "\u5DDD\u516C\u7F51\u5B89\u590751180202512085\u53F7"
  },
  quizUi: {
    home: "Quiz workspace",
    library: "My library",
    newQuiz: "Add a quiz",
    dashboardTitle: "A little practice\ngoes a long way.",
    dashboardIntro: "Bring a conversation. Take a quiz. Make what you learn your own.",
    answered: "Answers submitted",
    localNote: "Saved on this device. Back up your library to keep a copy.",
    loading: "Opening your library\u2026",
    retry: "Try reading again",
    importTitle: "Bring your conversation to life.",
    importIntro: "Send the prompt to your AI, then bring its full reply back here.",
    copyPrompt: "Copy quiz prompt",
    chatGptRecommendation: "Recommended: ChatGPT",
    chatGptRecommendationLabel: "Recommended: ChatGPT \u2014 official website (opens in a new tab)",
    promptCopied: "Quiz prompt copied",
    pasteLabel: "AI reply or quiz JSON",
    pastePlaceholder: "Paste the full AI reply here\u2026",
    paste: "Read clipboard",
    file: "Choose a JSON or TXT file",
    check: "Check and preview",
    example: "Try the sample quiz",
    preview: "Ready to bring this in?",
    questionCount: "{{count}} questions",
    backupCount: "{{sets}} quizzes \xB7 {{attempts}} saved attempts",
    save: "Save and choose a mode",
    cancel: "Cancel",
    repair: "Copy a repair prompt",
    repairCopied: "Repair prompt copied. Send it to the same AI conversation.",
    storageError: "We could not read or save this library. Your existing data has been kept. Try again, or free some browser storage.",
    unsupported: "This browser cannot safely save quizzes. Open this site over HTTPS in a current browser.",
    clipboardError: "Clipboard access failed. You can paste the text into the box instead.",
    copyError: "Copying failed. Select the prompt below and copy it manually.",
    fileError: "We could not read that file. Choose a UTF-8 JSON or TXT file under 4 MiB.",
    parseError: "The JSON is incomplete or malformed. Copy the full AI reply, or use a repair prompt.",
    invalidQuiz: "Check the quiz fields and answer references, or ask your AI to repair the quiz.",
    errorAt: "Check this field: {{path}}",
    futureVersion: "This file uses a newer format. Keep the original and update {{brand}} before importing it.",
    largeImport: "The import is too large. Use a file or reply no larger than 4 MiB.",
    multipleJson: "More than one JSON object was found. Keep only the quiz or backup you want to import.",
    noJson: "No quiz JSON was found. Copy the AI reply containing the quiz, not the prompt you sent.",
    empty: "Your next good question belongs here.",
    emptyBody: "Add a quiz from an AI conversation, or try the sample to see how it works.",
    quizzes: "Quizzes in your library",
    completed: "Completed attempts",
    best: "Best accuracy",
    notStarted: "Not started yet",
    sortTime: "Newest imports",
    sortAccuracy: "Highest accuracy",
    practiceSingle: "Pick a random quiz",
    practiceMixed: "Mix my quizzes",
    mixedTitle: "Mixed practice",
    mixedDescription: "{{count}} questions drawn from {{sets}} quizzes.",
    practiceHistory: "Mixed practice history",
    backup: "Download library backup",
    copyBackup: "Copy backup text",
    backupCopied: "Backup text copied. Paste it into a file and save it.",
    restore: "Restore a library backup",
    restoreIntro: "Preview your backup, then add its quizzes and saved attempts to this library. Existing quizzes are kept.",
    restoreConfirm: "Add backup to library",
    backupNote: "Library backups include your imported quizzes and their attempts. Mixed practice history is stored separately.",
    delete: "Delete quiz",
    deleteConfirm: "Delete this quiz and its saved attempts? Export a backup first if you want to keep them.",
    download: "Download quiz file",
    resume: "Continue attempt",
    start: "Start a new attempt",
    startMode: "Start this quiz",
    modeTitle: "Choose your pace.",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    easyHelp: "Feedback after each answer. No time limit.",
    mediumHelp: "Results after the full quiz. No time limit.",
    hardHelp: "Results at the end. A total of 30 seconds per question; the quiz submits when time runs out.",
    modeDuration: "{{seconds}} seconds total",
    questionProgress: "Question {{current}} of {{total}}",
    single: "Choose one answer",
    multiple: "Choose all correct answers",
    multipleHint: "Select every correct option. Your selection must match the full answer.",
    submit: "Check my answer",
    next: "Next question",
    previous: "Previous question",
    finish: "Finish and see results",
    results: "View results",
    correct: "Correct",
    incorrect: "Worth another look",
    yourAnswer: "Your answer",
    referenceAnswer: "Correct answer",
    explanation: "Explanation",
    locked: "Answer saved. Submitted answers stay as they are.",
    remaining: "Time remaining",
    timeUp: "Time is up. Unanswered questions count as incorrect.",
    retryFinish: "Retry saving results",
    resultTitle: "A little more understood.",
    accuracy: "Accuracy",
    rightCount: "Correct answers",
    wrongCount: "Incorrect answers",
    review: "Review your answers",
    answerStatus: "Answered",
    unanswered: "Not answered",
    selected: "Your selection",
    history: "Attempt history",
    noHistory: "Complete a quiz to see your history here.",
    restart: "Practice again",
    backLibrary: "Back to my library",
    backHome: "Back to the website",
    missing: "This quiz is not in this browser. Open your library or restore a backup on this device.",
    corrupt: "This saved quiz could not be read. Other quizzes are still available.",
    savedProgress: "Your progress saves as you go.",
    viewPrompt: "View and copy the prompt",
    completedTotal: "{{count}} completed attempts",
    copyBackupError: "Could not copy the backup. Use Download library backup instead.",
    changed: "This attempt changed in another tab. The latest progress is now shown; choose your answer again.",
    restartAttempt: "Start over",
    restartConfirm: "Replace this unfinished attempt? Completed attempts will be kept.",
    missingResult: "This result is not available here. Open this quiz to continue or view saved attempts.",
    siteHome: "Home",
    practiceNav: "Practice",
    navLabel: "Main navigation",
    wechatLabel: "Mini Program",
    wechatTitle: "Take your quizzes to WeChat",
    wechatHint: "Scan with WeChat, or save the image and select it in WeChat\u2019s scanner.",
    wechatCodeAlt: "WeChat Mini Program code for the quiz home page",
    wechatSave: "Save Mini Program code",
    wechatSearch: "Search WeChat Mini Programs for: \u560E\u560E\u5B66AI",
    questionnaireTitle: "Learning questionnaire",
    saveQuestionnaire: "Save questionnaire",
    finishQuestionnaire: "Submit questionnaire",
    questionnaireMultiple: "Select all that apply to you",
    questionnaireComplete: "Your responses are saved.",
    questionnaireHandoff: "Your responses are saved. Tell your AI \u201CI\u2019ve finished the questionnaire\u201D to continue with the next step.",
    questionnaireResponses: "Your questionnaire responses",
    noPracticeQuiz: "Import a knowledge quiz to start random practice. Questionnaires are excluded.",
    questionnaireMissing: "This questionnaire is unavailable or has been replaced. Ask your AI to provide it again.",
    questionnaireConnecting: "Opening your questionnaire\u2026",
    questionnaireConnectionError: "The connection to your AI is unavailable. Keep this page open and ask your AI to reconnect. Any saved responses remain on this page.",
    studyConnectionTitle: "AI learning",
    studyConnecting: "Connecting to your learning page\u2026"
  },
  legalUi: {
    privacyIntro: "GAGA learn\u2019s website and the AI Chat to Quiz (AI\u4F1A\u8BDD\u8F6C\u6D4B\u9A8C) Chrome extension help you turn AI conversations into personal practice quizzes. This policy covers both products. Neither requires an account.",
    storageTitle: "Website: your local library",
    storageBody: "The website stores imported quizzes, selected answers, results and saved skills in this browser on your device. This data is used to manage your library, save progress, show results and restore backups. The website does not upload your quiz content or practice records to a server. Website storage and extension storage are separate; there is no automatic synchronization. You can move quizzes yourself using export and import.",
    requestsTitle: "Website requests and cookies",
    requestsBody: "When you visit the website, page requests and image downloads reach our website and asset servers. Servers may process technical information such as your IP address and request logs to deliver the service and investigate faults. Your website language choice is saved in a cookie. These website requests are separate from the extension\u2019s local quiz storage.",
    aiTitle: "Sharing and external AI services",
    aiBody: "We do not receive or sell your quiz content or practice records, use them for advertising or transfer them to third parties. You decide whether to copy the quiz prompt into an external AI conversation, such as ChatGPT, Claude, Gemini, DeepSeek or Kimi, and bring the reply back. The extension does not automatically read or send your conversations. Opening an external website or sending it content is a separate action; that service handles the visit and content under its own privacy policy. Imported replies are processed locally by the website or extension.",
    termsIntro: "GAGA learn offers a way to turn AI conversations into personal practice quizzes. Use the service and imported content responsibly.",
    accuracyTitle: "Questions and answers",
    accuracyBody: "Quiz scores compare your choices with the answers in the imported file. They do not independently verify whether an AI-generated answer is correct. Check questionable content against the original material.",
    backupTitle: "Keeping your work",
    backupBody: "Your data is local to this browser. Export a backup before clearing browser data or moving devices. The service does not provide account-based recovery or automatic device synchronization.",
    useTitle: "Responsible use",
    useBody: "Only import content you are entitled to use. Do not use the service for unlawful activity, harassment, fraud, or infringement. Product features and these explanations may change as the service develops.",
    extensionTitle: "Chrome extension: AI Chat to Quiz",
    extensionBody: "The extension processes the quizzes, answers, explanations and backups you choose to import, along with your selected answers, results, practice history and preferences. It saves your library, progress, language choice and introduction-completed flag in this Chrome profile on your device. This data is used only for importing, practising, reviewing and backing up your quizzes, and for remembering your settings. The extension does not collect account details, read webpages or browsing history, upload quiz data or include analytics. It does not synchronize your data with an account or other devices.",
    clipboardTitle: "Clipboard and files",
    clipboardBody: "On both the website and extension, clipboard access happens only when you press a copy or read-clipboard button. There is no background clipboard monitoring. Selected files are read locally; exported quiz files and backups are saved by your browser. Content you paste or import is used only for the quiz and backup functions you choose.",
    introductionTitle: "The three-question introduction",
    introductionBody: "The optional first-visit example runs in page memory on both the website and extension. Its three questions, your answers and the results are never added to your library, history, statistics or backups. They are discarded when you finish or leave the introduction. Completing or skipping it saves only a flag that you have seen the introduction, separately for the website and extension.",
    retentionTitle: "Keeping and deleting data",
    retentionBody: "Saved quiz data stays on this device until you delete it or remove the relevant browser storage. Deleting a quiz removes that quiz and its saved attempts. Clearing website data removes the website\u2019s local records and preferences; uninstalling the extension removes its local data. Export a backup first if you want to keep your quizzes. Exported files and copied clipboard text remain outside the app\u2019s storage, so delete those files or replace the clipboard text separately. We do not provide account-based recovery."
  },
  onboardingUi: {
    welcomeEyebrow: "A quick hello",
    welcomeTitle: "Welcome to {{brand}}",
    welcomeIntro: "Try 3 short questions to learn how to choose answers and read explanations. No setup needed.",
    start: "Try the 3-question example",
    skip: "Skip introduction",
    exampleTitle: "Your first 3 questions",
    memoryNote: "Just a walkthrough. Your answers and results will not be saved.",
    finish: "Finish the example",
    preferenceError: "We couldn\u2019t remember this introduction on this device. It may appear again next time.",
    q1Stem: "Which action helps you check what you remember?",
    q1A: "Try answering a question before checking the answer.",
    q1B: "Look at the answer without trying the question.",
    q1C: "Skip every question.",
    q1Explanation: "Choose one option, then submit it to see the correct answer and explanation. Getting it wrong is part of learning.",
    q2Stem: "Which two habits make good use of a practice quiz?",
    q2A: "Read the explanation after answering.",
    q2B: "Return to questions you found difficult.",
    q2C: "Always choose the first option.",
    q2Explanation: "For multiple-choice questions, select every correct option and no incorrect ones. Here, reading explanations and revisiting difficult questions both help.",
    q3Stem: "What happens to the answers from this introduction?",
    q3A: "They appear in your quiz history.",
    q3B: "They are discarded when you leave the introduction.",
    q3C: "They are added to your quiz library.",
    q3Explanation: "These 3 questions are only a walkthrough. They do not create a quiz or a history entry. Only a flag that you\u2019ve seen the introduction is saved."
  },
  extensionUi: {
    brand: "AI Chat to Quiz",
    welcomeIntro: "Turn conversations with ChatGPT, Claude, Gemini, DeepSeek or Kimi into self-tests. Try 3 questions to see how it works."
  },
  articleUi: {
    title: "Articles",
    intro: "Guides, ideas, and practical ways to learn with AI.",
    empty: "No articles are available in this language yet.",
    allArticles: "All articles",
    published: "Published",
    updated: "Updated",
    by: "By",
    translations: "Available languages",
    previous: "Previous articles",
    next: "Next articles",
    home: "Website home",
    language: "Article directory language",
    unavailable: "Articles are temporarily unavailable.",
    retry: "Reload articles"
  },
  guideUi: {
    title: "Continue your learning",
    paste: "Copy the complete quiz JSON from your AI conversation and paste it here (Ctrl+V on Windows, Command+V on Mac).",
    check: "Check the pasted quiz. If an error appears, correct the text using the message on this page.",
    confirm: "Check the title and question count, then confirm the import. The quiz will be saved in this browser.",
    start: "Review the introduction, choose a mode if available, then start when you are ready.",
    export: "Copy your library backup and paste it into your AI conversation for review. If copying is unavailable, use Download library backup. Import a quiz first if your library is empty.",
    close: "Close guide"
  }
};

// packages/quiz-react/locales/zh-CN/common.json
var common_default2 = {
  skillUi: {
    brand: "\u560E\u560E\u5B66\u4E60",
    skills: "\u53D1\u73B0",
    favorites: "\u6536\u85CF",
    language: "\u8BED\u8A00",
    intro: "\u7528 AI\uFF0C\u7ED9\u751F\u6D3B\u4E00\u70B9\u5C0F\u5E2E\u52A9",
    listTitle: "\u627E\u5230\u4ECA\u5929\u7684\u4E00\u5C0F\u6B65",
    empty: "\u8FD9\u91CC\u8FD8\u6CA1\u6709\u6280\u80FD\u3002",
    loading: "\u6B63\u5728\u52A0\u8F7D\u6280\u80FD\u2026",
    retry: "\u91CD\u8BD5",
    details: "\u6280\u80FD\u4ECB\u7ECD",
    configure: "\u6309\u4F60\u7684\u9700\u8981\u914D\u7F6E",
    back: "\u5168\u90E8\u6280\u80FD",
    favorite: "\u6536\u85CF\u6280\u80FD",
    unfavorite: "\u53D6\u6D88\u6536\u85CF",
    localNote: "\u6536\u85CF\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\uFF0C\u65E0\u9700\u767B\u5F55\u3002",
    configureHint: "\u9009\u597D\u9002\u5408\u4F60\u7684\u53C2\u6570\uFF0C\u628A\u751F\u6210\u7684\u63D0\u793A\u8BCD\u5E26\u5230 AI \u5BF9\u8BDD\u91CC\u3002",
    generate: "\u751F\u6210\u63D0\u793A\u8BCD",
    generating: "\u6B63\u5728\u751F\u6210\u2026",
    generated: "\u5DF2\u751F\u6210",
    failed: "\u751F\u6210\u5931\u8D25",
    copy: "\u590D\u5236\u63D0\u793A\u8BCD",
    copying: "\u6B63\u5728\u590D\u5236\u2026",
    copied: "\u5DF2\u590D\u5236",
    copyFailed: "\u8BF7\u9009\u4E2D\u6587\u5B57\u590D\u5236",
    prompt: "\u4F60\u7684\u63D0\u793A\u8BCD",
    previous: "\u4E0A\u4E00\u9875",
    next: "\u4E0B\u4E00\u9875"
  },
  skillState: {
    savedTitle: "\u4F60\u6536\u85CF\u7684\u6280\u80FD",
    savedEmpty: "\u6536\u85CF\u4E00\u4E2A\u6280\u80FD\uFF0C\u4E0B\u6B21\u53EF\u4EE5\u5728\u8FD9\u91CC\u627E\u5230\u5B83\u3002",
    contentLanguage: "\u5185\u5BB9\u8BED\u8A00\uFF1A{{language}}",
    fallback: "\u8BE5\u6280\u80FD\u6682\u65E0\u82F1\u6587\u7248\u672C\uFF0C\u6B63\u5728\u4F7F\u7528\u5B8C\u6574\u4E2D\u6587\u5185\u5BB9\u3002",
    unavailable: "\u8FD9\u4E2A\u6280\u80FD\u6682\u65F6\u4E0D\u53EF\u7528\u3002",
    unavailableSaved: "\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u5DF2\u4FDD\u7559\u4F60\u7684\u6536\u85CF\u8BB0\u5F55\u3002",
    loadFailed: "\u5185\u5BB9\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5\u3002",
    storageFailed: "\u65E0\u6CD5\u8BFB\u53D6\u6216\u4FDD\u5B58\u6536\u85CF\uFF0C\u539F\u6709\u6570\u636E\u5DF2\u4FDD\u7559\u3002",
    languageSaveFailed: "\u65E0\u6CD5\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4FDD\u5B58\u8BED\u8A00\u9009\u62E9\u3002",
    contentChanged: "\u6280\u80FD\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u68C0\u67E5\u5F53\u524D\u9009\u9879\u540E\u91CD\u65B0\u751F\u6210\u63D0\u793A\u8BCD\u3002",
    resourceInvalid: "\u63D0\u793A\u8BCD\u8D44\u6E90\u6821\u9A8C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    configInvalid: "\u8BF7\u68C0\u67E5\u6807\u51FA\u7684\u5B57\u6BB5\u540E\u7EE7\u7EED\u3002",
    yes: "\u662F",
    no: "\u5426",
    choose: "\u8BF7\u9009\u62E9",
    requiredMark: "\u5FC5\u586B",
    skip: "\u8DF3\u5230\u4E3B\u8981\u5185\u5BB9",
    notFound: "\u6CA1\u6709\u627E\u5230\u8FD9\u4E2A\u9875\u9762\u3002"
  },
  validation: {
    required: "\u8BF7\u5B8C\u6210\u6B64\u9879\u3002",
    number: "\u8BF7\u8F93\u5165\u6709\u6548\u6570\u5B57\u3002",
    minimum: "\u4E0D\u80FD\u5C0F\u4E8E {{minimum}}\u3002",
    maximum: "\u4E0D\u80FD\u5927\u4E8E {{maximum}}\u3002",
    step: "\u8BF7\u6309 {{step}} \u7684\u6B65\u957F\u8F93\u5165\u3002",
    date: "\u8BF7\u8F93\u5165\u6709\u6548\u65E5\u671F\u3002",
    past_date: "\u8BF7\u9009\u62E9\u4ECA\u5929\u6216\u4E4B\u540E\u7684\u65E5\u671F\u3002",
    future_date: "\u8BF7\u9009\u62E9\u4ECA\u5929\u6216\u4E4B\u524D\u7684\u65E5\u671F\u3002",
    boolean: "\u8BF7\u9009\u62E9\u662F\u6216\u5426\u3002",
    option: "\u8BF7\u9009\u62E9\u6709\u6548\u9009\u9879\u3002",
    options: "\u8BF7\u9009\u62E9\u6709\u6548\u7684\u9009\u9879\u7EC4\u5408\u3002",
    chat_record: "\u8BF7\u7C98\u8D34\u6709\u6548\u804A\u5929\u8BB0\u5F55\u3002"
  },
  homeUi: {
    eyebrow: "\u8BA9\u5B66\u8FC7\u7684\u77E5\u8BC6\uFF0C\u771F\u6B63\u7559\u4E0B\u6765",
    headline: "\u7528 AI \u51FA\u9898\uFF0C\n\u5728\u7EC3\u4E60\u4E2D\u638C\u63E1\u77E5\u8BC6\u3002",
    intro: "\u7528\u560E\u560E\u5B66\u4E60\u628A AI \u4F1A\u8BDD\u53D8\u6210\u53EF\u4EE5\u53CD\u590D\u7EC3\u4E60\u7684\u9898\u96C6\u3002\u6309\u81EA\u5DF1\u7684\u8282\u594F\u7B54\u9898\u3001\u67E5\u770B\u89E3\u6790\uFF0C\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4FDD\u7559\u5B66\u4E60\u8FDB\u5EA6\u3002",
    cta: "\u5F00\u59CB\u6D4B\u9A8C",
    howLink: "\u770B\u770B\u5982\u4F55\u4F7F\u7528",
    promise: "\u65E0\u9700\u6CE8\u518C\uFF0C\u9898\u96C6\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u3002",
    howTitle: "\u4ECE\u4E00\u6B21\u597D\u5BF9\u8BDD\uFF0C\u5230\u4E00\u6B21\u5C0F\u7EC3\u4E60\u3002",
    howIntro: "\u4ECE\u5DF2\u7ECF\u804A\u8FC7\u7684\u5185\u5BB9\u5F00\u59CB\uFF0C\u8BA9\u5B66\u4E60\u4E0D\u53EA\u505C\u7559\u5728\u5BF9\u8BDD\u91CC\u3002",
    stepOneTitle: "\u8BA9 AI \u6839\u636E\u539F\u4F1A\u8BDD\u51FA\u9898",
    stepOneBody: "\u628A\u51FA\u9898\u63D0\u793A\u8BCD\u53D1\u56DE\u60F3\u590D\u4E60\u7684 AI \u4F1A\u8BDD\uFF0C\u8BA9 AI \u6839\u636E\u5DF2\u6709\u5185\u5BB9\u751F\u6210\u9898\u96C6\u3002",
    stepTwoTitle: "\u628A\u751F\u6210\u7684\u9898\u96C6\u5E26\u56DE\u6765",
    stepTwoBody: "\u7C98\u8D34\u5B8C\u6574\u56DE\u590D\uFF0C\u6216\u9009\u62E9 JSON \u6587\u4EF6\u3002\u68C0\u67E5\u6982\u8981\u540E\uFF0C\u4FDD\u5B58\u5230\u4F60\u7684\u9898\u96C6\u5E93\u3002",
    stepThreeTitle: "\u770B\u770B\u81EA\u5DF1\u771F\u6B63\u8BB0\u4F4F\u4E86\u4EC0\u4E48",
    stepThreeBody: "\u9009\u62E9\u7B54\u9898\u6A21\u5F0F\uFF0C\u5B8C\u6210\u7EC3\u4E60\uFF0C\u518D\u901A\u8FC7\u89E3\u6790\u590D\u76D8\u7406\u89E3\u4E2D\u7684\u9057\u6F0F\u3002",
    modesTitle: "\u4E3A\u4E0D\u540C\u7684\u7EC3\u4E60\uFF0C\u9009\u4E00\u4E2A\u5408\u9002\u8282\u594F\u3002",
    easyTitle: "\u8FB9\u7B54\u8FB9\u5B66",
    easyBody: "\u6BCF\u9898\u63D0\u4EA4\u540E\u67E5\u770B\u53CD\u9988\u4E0E\u89E3\u6790\uFF0C\u4E0D\u9650\u65F6\uFF0C\u6162\u6162\u6765\u3002",
    mediumTitle: "\u5B8C\u6210\u540E\u518D\u770B\u5168\u8C8C",
    mediumBody: "\u6574\u573A\u5B8C\u6210\u540E\u7EDF\u4E00\u8BC4\u5206\uFF0C\u8BA9\u6CE8\u610F\u529B\u7559\u5728\u95EE\u9898\u4E0A\u3002",
    hardTitle: "\u7ED9\u81EA\u5DF1\u4E00\u70B9\u6311\u6218",
    hardBody: "\u603B\u65F6\u957F\u4E3A\u6BCF\u9898 30 \u79D2\uFF0C\u81EA\u7531\u5206\u914D\u6574\u573A\u65F6\u95F4\uFF0C\u5230\u65F6\u81EA\u52A8\u4EA4\u5377\u3002",
    aboutTitle: "\u5B66\u4E60\uFF0C\u4ECE\u4E00\u4E2A\u95EE\u9898\u5F00\u59CB\u3002",
    aboutBody: "\u560E\u560E\u5B66\u4E60\u5E0C\u671B\u8BA9 AI \u6210\u4E3A\u65E5\u5E38\u5B66\u4E60\u7684\u4E00\u90E8\u5206\u3002\u95EE\u7B54\u6D4B\u9A8C\u628A\u5BF9\u8BDD\u53D8\u6210\u81EA\u5DF1\u7684\u7EC3\u4E60\uFF0C\u4FDD\u7559\u9898\u96C6\u548C\u8FDB\u5EA6\uFF0C\u4E5F\u8BA9\u4E0B\u4E00\u6B21\u590D\u4E60\u66F4\u6709\u65B9\u5411\u3002",
    faqTitle: "\u5F00\u59CB\u524D\uFF0C\u4F60\u53EF\u80FD\u60F3\u77E5\u9053",
    faqOneQuestion: "\u560E\u560E\u5B66\u4E60\u4F1A\u76F4\u63A5\u751F\u6210\u9898\u76EE\u5417\uFF1F",
    faqOneAnswer: "\u8BF7\u628A\u63D0\u4F9B\u7684\u63D0\u793A\u8BCD\u53D1\u5230\u81EA\u5DF1\u7684 AI \u4F1A\u8BDD\uFF0C\u518D\u5BFC\u5165\u56DE\u590D\u3002\u560E\u560E\u5B66\u4E60\u8D1F\u8D23\u683C\u5F0F\u68C0\u67E5\u3001\u6D4B\u9A8C\u4E0E\u5224\u5206\u3002AI \u9898\u76EE\u53EF\u80FD\u6709\u8BEF\uFF0C\u8BF7\u7ED3\u5408\u539F\u8D44\u6599\u6838\u5BF9\u3002",
    faqTwoQuestion: "\u9898\u96C6\u548C\u7B54\u6848\u4FDD\u5B58\u5728\u54EA\u91CC\uFF1F",
    faqTwoAnswer: "\u4FDD\u5B58\u5728\u5F53\u524D\u8BBE\u5907\u7684\u6D4F\u89C8\u5668\u4E2D\uFF0C\u4E0D\u4E0A\u4F20\u5230\u8D26\u53F7\u3002\u6E05\u7406\u6D4F\u89C8\u5668\u6570\u636E\u6216\u66F4\u6362\u8BBE\u5907\u524D\uFF0C\u8BF7\u5BFC\u51FA\u9898\u96C6\u5E93\u5907\u4EFD\u3002",
    faqThreeQuestion: "\u53EF\u4EE5\u4ECE\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F\u5E26\u6765\u9898\u96C6\u5417\uFF1F",
    faqThreeAnswer: "\u53EF\u4EE5\u5BFC\u5165\u5C0F\u7A0B\u5E8F\u5BFC\u51FA\u7684\u9898\u96C6\u6587\u4EF6\u6216\u517C\u5BB9\u7684\u9898\u96C6\u5E93\u5907\u4EFD\u3002\u6062\u590D\u4EE5\u8FFD\u52A0\u65B9\u5F0F\u4FDD\u5B58\u9898\u96C6\u548C\u6D4B\u9A8C\u8BB0\u5F55\uFF0C\u4E0D\u8986\u76D6\u73B0\u6709\u9898\u96C6\u5E93\u3002",
    closing: "\u8BA9\u4E0B\u4E00\u6B21\u5BF9\u8BDD\uFF0C\u591A\u7559\u4E0B\u4E00\u70B9\u6536\u83B7\u3002",
    seoTitle: "\u560E\u560E\u5B66\u4E60 \u2014 AI \u95EE\u7B54\u6D4B\u9A8C\u4E0E\u81EA\u4E3B\u7EC3\u4E60",
    seoDescription: "\u7528\u560E\u560E\u5B66\u4E60\u628A AI \u4F1A\u8BDD\u53D8\u6210\u95EE\u7B54\u6D4B\u9A8C\u3002\u5BFC\u5165\u9898\u96C6\uFF0C\u9009\u62E9\u4E09\u79CD\u7EC3\u4E60\u6A21\u5F0F\uFF0C\u67E5\u770B\u7B54\u6848\u89E3\u6790\u4E0E\u5386\u53F2\u8BB0\u5F55\uFF1B\u9898\u96C6\u548C\u8FDB\u5EA6\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\uFF0C\u65E0\u9700\u6CE8\u518C\u3002",
    privacy: "\u9690\u79C1\u8BF4\u660E",
    terms: "\u4F7F\u7528\u6761\u6B3E",
    sampleLabel: "\u793A\u4F8B\u9898\u76EE",
    sampleQuestion: "\u600E\u6837\u628A\u65B0\u77E5\u8BC6\u8BB0\u5F97\u66F4\u7262\uFF1F",
    sampleAnswer: "\u5148\u8BD5\u7740\u56DE\u60F3\uFF0C\u518D\u67E5\u770B\u7B54\u6848\u3002",
    sampleNote: "\u901A\u8FC7\u7EC3\u4E60\u52A0\u6DF1\u7406\u89E3\uFF0C\u4E00\u4E2A\u5C0F\u5C0F\u7684\u793A\u4F8B\u3002",
    copyrightNotice: "Copyright \xA9 2026 \u58F9\u601D AI",
    icpRegistration: "ICP\u5907\u6848/\u8BB8\u53EF\u8BC1\u53F7\uFF1A\u8700ICP\u59072026036163\u53F7-1",
    policeRegistration: "\u5DDD\u516C\u7F51\u5B89\u590751180202512085\u53F7"
  },
  quizUi: {
    home: "\u6D4B\u9A8C\u4E3B\u9875",
    library: "\u6211\u7684\u9898\u96C6",
    newQuiz: "\u65B0\u589E\u9898\u96C6",
    dashboardTitle: "\u804A\u8FC7\u7684\u77E5\u8BC6\uFF0C\n\u503C\u5F97\u518D\u6D4B\u4E00\u6D4B\u3002",
    dashboardIntro: "\u628A\u5BF9\u8BDD\u53D8\u6210\u9898\u96C6\uFF0C\u7528\u4E00\u6B21\u6D4B\u9A8C\uFF0C\u5DE9\u56FA\u771F\u6B63\u7406\u89E3\u7684\u77E5\u8BC6\u3002",
    answered: "\u7D2F\u8BA1\u7B54\u9898",
    localNote: "\u4FDD\u5B58\u5728\u5F53\u524D\u8BBE\u5907\uFF0C\u5BFC\u51FA\u5907\u4EFD\u53EF\u989D\u5916\u4FDD\u7559\u4E00\u4EFD\u3002",
    loading: "\u6B63\u5728\u6253\u5F00\u9898\u96C6\u5E93\u2026",
    retry: "\u91CD\u65B0\u8BFB\u53D6",
    importTitle: "\u628A\u5BF9\u8BDD\uFF0C\u53D8\u6210\u9898\u96C6\u3002",
    importIntro: "\u628A\u63D0\u793A\u8BCD\u53D1\u56DE\u60F3\u590D\u4E60\u7684 AI \u4F1A\u8BDD\uFF0C\u518D\u628A\u5B8C\u6574\u56DE\u590D\u5E26\u56DE\u6765\u3002",
    copyPrompt: "\u590D\u5236\u51FA\u9898\u63D0\u793A\u8BCD",
    chatGptRecommendation: "\u63A8\u8350\u7528 ChatGPT \u51FA\u9898",
    chatGptRecommendationLabel: "\u63A8\u8350\u7528 ChatGPT \u51FA\u9898\uFF1A\u524D\u5F80\u5B98\u7F51\uFF08\u65B0\u6807\u7B7E\u9875\uFF09",
    promptCopied: "\u51FA\u9898\u63D0\u793A\u8BCD\u5DF2\u590D\u5236",
    pasteLabel: "AI \u56DE\u590D\u6216\u9898\u96C6 JSON",
    pastePlaceholder: "\u5728\u8FD9\u91CC\u7C98\u8D34 AI \u7684\u5B8C\u6574\u56DE\u590D\u2026",
    paste: "\u8BFB\u53D6\u526A\u8D34\u677F",
    file: "\u9009\u62E9 JSON \u6216 TXT \u6587\u4EF6",
    check: "\u68C0\u67E5\u5E76\u9884\u89C8",
    example: "\u4F53\u9A8C\u793A\u4F8B\u9898\u96C6",
    preview: "\u786E\u8BA4\u5BFC\u5165\u8FD9\u4EFD\u8D44\u6599\uFF1F",
    questionCount: "{{count}} \u9053\u9898",
    backupCount: "{{sets}} \u4EFD\u9898\u96C6 \xB7 {{attempts}} \u6B21\u6D4B\u9A8C\u8BB0\u5F55",
    save: "\u4FDD\u5B58\u5E76\u9009\u62E9\u96BE\u5EA6",
    cancel: "\u53D6\u6D88",
    repair: "\u590D\u5236\u4FEE\u6B63\u63D0\u793A\u8BCD",
    repairCopied: "\u4FEE\u6B63\u63D0\u793A\u8BCD\u5DF2\u590D\u5236\uFF0C\u8BF7\u53D1\u7ED9\u539F AI \u4F1A\u8BDD\u3002",
    storageError: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6216\u4FDD\u5B58\u9898\u96C6\u5E93\uFF0C\u5DF2\u6709\u6570\u636E\u4F1A\u4FDD\u7559\u3002\u8BF7\u91CD\u8BD5\uFF0C\u6216\u91CA\u653E\u4E00\u4E9B\u6D4F\u89C8\u5668\u5B58\u50A8\u7A7A\u95F4\u3002",
    unsupported: "\u5F53\u524D\u6D4F\u89C8\u5668\u65E0\u6CD5\u53EF\u9760\u4FDD\u5B58\u9898\u96C6\uFF0C\u8BF7\u4F7F\u7528\u65B0\u7248\u6D4F\u89C8\u5668\uFF0C\u901A\u8FC7 HTTPS \u6253\u5F00\u7F51\u7AD9\u3002",
    clipboardError: "\u65E0\u6CD5\u8BBF\u95EE\u526A\u8D34\u677F\uFF0C\u4F60\u53EF\u4EE5\u76F4\u63A5\u628A\u6587\u5B57\u7C98\u8D34\u5230\u8F93\u5165\u6846\u4E2D\u3002",
    copyError: "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u9009\u4E2D\u4E0B\u65B9\u63D0\u793A\u8BCD\u624B\u52A8\u590D\u5236\u3002",
    fileError: "\u65E0\u6CD5\u8BFB\u53D6\u6587\u4EF6\uFF0C\u8BF7\u9009\u62E9\u5C0F\u4E8E 4 MiB \u7684 UTF-8 JSON \u6216 TXT \u6587\u4EF6\u3002",
    parseError: "JSON \u4E0D\u5B8C\u6574\u6216\u683C\u5F0F\u6709\u8BEF\uFF0C\u8BF7\u590D\u5236 AI \u7684\u5B8C\u6574\u56DE\u590D\uFF0C\u6216\u4F7F\u7528\u4FEE\u6B63\u63D0\u793A\u8BCD\u3002",
    invalidQuiz: "\u8BF7\u68C0\u67E5\u9898\u96C6\u5B57\u6BB5\u548C\u7B54\u6848\u5F15\u7528\uFF0C\u6216\u8BA9\u539F AI \u4F1A\u8BDD\u4FEE\u6B63\u9898\u96C6\u3002",
    errorAt: "\u8BF7\u68C0\u67E5\u5B57\u6BB5\uFF1A{{path}}",
    futureVersion: "\u8FD9\u4EFD\u6587\u4EF6\u4F7F\u7528\u4E86\u66F4\u65B0\u683C\u5F0F\uFF0C\u8BF7\u4FDD\u7559\u539F\u6587\u4EF6\uFF0C\u66F4\u65B0{{brand}}\u540E\u518D\u5BFC\u5165\u3002",
    largeImport: "\u5BFC\u5165\u5185\u5BB9\u8FC7\u5927\uFF0C\u8BF7\u4F7F\u7528\u4E0D\u8D85\u8FC7 4 MiB \u7684\u6587\u4EF6\u6216\u56DE\u590D\u3002",
    multipleJson: "\u68C0\u6D4B\u5230\u591A\u4EFD JSON\uFF0C\u8BF7\u53EA\u4FDD\u7559\u9700\u8981\u5BFC\u5165\u7684\u4E00\u4EFD\u9898\u96C6\u6216\u5907\u4EFD\u3002",
    noJson: "\u6CA1\u6709\u627E\u5230\u9898\u96C6 JSON\uFF0C\u8BF7\u590D\u5236 AI \u8FD4\u56DE\u7684\u9898\u96C6\uFF0C\u4E0D\u8981\u590D\u5236\u4F60\u53D1\u51FA\u7684\u63D0\u793A\u8BCD\u3002",
    empty: "\u628A\u4E0B\u4E00\u4E2A\u597D\u95EE\u9898\uFF0C\u653E\u8FDB\u9898\u96C6\u5E93\u3002",
    emptyBody: "\u4ECE AI \u4F1A\u8BDD\u5BFC\u5165\u9898\u96C6\uFF0C\u6216\u5148\u7528\u793A\u4F8B\u4F53\u9A8C\u4E00\u6B21\u3002",
    quizzes: "\u5E93\u4E2D\u7684\u9898\u96C6",
    completed: "\u5DF2\u5B8C\u6210\u6D4B\u9A8C",
    best: "\u6700\u9AD8\u6B63\u786E\u7387",
    notStarted: "\u5C1A\u672A\u5F00\u59CB",
    sortTime: "\u6309\u5BFC\u5165\u65F6\u95F4",
    sortAccuracy: "\u6309\u6700\u9AD8\u6B63\u786E\u7387",
    practiceSingle: "\u968F\u673A\u7EC3\u4E00\u4EFD",
    practiceMixed: "\u6DF7\u5408\u62BD\u9898\u7EC3\u4E60",
    mixedTitle: "\u6DF7\u5408\u7EC3\u4E60",
    mixedDescription: "\u4ECE {{sets}} \u4EFD\u9898\u96C6\u4E2D\u62BD\u53D6 {{count}} \u9053\u9898\u3002",
    practiceHistory: "\u6DF7\u5408\u7EC3\u4E60\u8BB0\u5F55",
    backup: "\u4E0B\u8F7D\u9898\u96C6\u5E93\u5907\u4EFD",
    copyBackup: "\u590D\u5236\u5907\u4EFD\u6587\u672C",
    backupCopied: "\u5907\u4EFD\u5168\u6587\u5DF2\u590D\u5236\uFF0C\u8BF7\u7C98\u8D34\u5230\u6587\u4EF6\u4E2D\u4FDD\u5B58\u3002",
    restore: "\u6062\u590D\u9898\u96C6\u5E93\u5907\u4EFD",
    restoreIntro: "\u9884\u89C8\u5907\u4EFD\u540E\u8FFD\u52A0\u6062\u590D\u9898\u96C6\u4E0E\u6D4B\u9A8C\u8BB0\u5F55\uFF0C\u73B0\u6709\u9898\u96C6\u4F1A\u4FDD\u7559\u3002",
    restoreConfirm: "\u8FFD\u52A0\u6062\u590D\u5230\u9898\u96C6\u5E93",
    backupNote: "\u9898\u96C6\u5E93\u5907\u4EFD\u5305\u542B\u5BFC\u5165\u7684\u9898\u96C6\u53CA\u5176\u6D4B\u9A8C\u8BB0\u5F55\uFF1B\u6DF7\u5408\u7EC3\u4E60\u8BB0\u5F55\u5355\u72EC\u4FDD\u5B58\u3002",
    delete: "\u5220\u9664\u9898\u96C6",
    deleteConfirm: "\u5220\u9664\u8FD9\u4EFD\u9898\u96C6\u53CA\u5176\u6D4B\u9A8C\u8BB0\u5F55\uFF1F\u5982\u9700\u4FDD\u7559\uFF0C\u8BF7\u5148\u5BFC\u51FA\u5907\u4EFD\u3002",
    download: "\u4E0B\u8F7D\u9898\u96C6\u6587\u4EF6",
    resume: "\u7EE7\u7EED\u672A\u5B8C\u6210\u6D4B\u9A8C",
    start: "\u5F00\u59CB\u65B0\u7684\u6D4B\u9A8C",
    startMode: "\u5F00\u59CB\u672C\u6B21\u6D4B\u9A8C",
    modeTitle: "\u9009\u4E00\u4E2A\u9002\u5408\u81EA\u5DF1\u7684\u8282\u594F\u3002",
    easy: "\u7B80\u5355",
    medium: "\u4E2D\u7B49",
    hard: "\u56F0\u96BE",
    easyHelp: "\u6BCF\u9898\u63D0\u4EA4\u540E\u67E5\u770B\u53CD\u9988\uFF0C\u4E0D\u9650\u65F6\u3002",
    mediumHelp: "\u6574\u573A\u5B8C\u6210\u540E\u7EDF\u4E00\u8BC4\u5206\uFF0C\u4E0D\u9650\u65F6\u3002",
    hardHelp: "\u6574\u573A\u5B8C\u6210\u540E\u8BC4\u5206\uFF0C\u603B\u65F6\u957F\u4E3A\u6BCF\u9898 30 \u79D2\uFF0C\u5230\u65F6\u81EA\u52A8\u4EA4\u5377\u3002",
    modeDuration: "\u6574\u573A {{seconds}} \u79D2",
    questionProgress: "\u7B2C {{current}} / {{total}} \u9898",
    single: "\u9009\u62E9\u4E00\u4E2A\u7B54\u6848",
    multiple: "\u9009\u62E9\u6240\u6709\u6B63\u786E\u7B54\u6848",
    multipleHint: "\u9009\u62E9\u6240\u6709\u6B63\u786E\u9009\u9879\uFF0C\u6240\u9009\u9879\u9700\u8981\u4E0E\u5B8C\u6574\u7B54\u6848\u4E00\u81F4\u3002",
    submit: "\u63D0\u4EA4\u5E76\u68C0\u67E5\u7B54\u6848",
    next: "\u4E0B\u4E00\u9053\u9898",
    previous: "\u4E0A\u4E00\u9053\u9898",
    finish: "\u4EA4\u5377\u5E76\u67E5\u770B\u7ED3\u679C",
    results: "\u67E5\u770B\u672C\u6B21\u7ED3\u679C",
    correct: "\u56DE\u7B54\u6B63\u786E",
    incorrect: "\u518D\u590D\u4E60\u4E00\u4E0B\u8FD9\u9053\u9898",
    yourAnswer: "\u4F60\u7684\u4F5C\u7B54",
    referenceAnswer: "\u53C2\u8003\u7B54\u6848",
    explanation: "\u9898\u76EE\u89E3\u6790",
    locked: "\u7B54\u6848\u5DF2\u4FDD\u5B58\uFF0C\u63D0\u4EA4\u540E\u4E0D\u80FD\u6539\u5199\u672C\u6B21\u7B54\u6848\u3002",
    remaining: "\u5269\u4F59\u65F6\u95F4",
    timeUp: "\u65F6\u95F4\u5230\uFF0C\u672A\u7B54\u9898\u8BA1\u5165\u9519\u8BEF\u3002",
    retryFinish: "\u91CD\u8BD5\u4FDD\u5B58\u4EA4\u5377\u7ED3\u679C",
    resultTitle: "\u53C8\u591A\u7406\u89E3\u4E86\u4E00\u70B9\u3002",
    accuracy: "\u672C\u6B21\u6B63\u786E\u7387",
    rightCount: "\u7B54\u5BF9\u9898\u6570",
    wrongCount: "\u7B54\u9519\u9898\u6570",
    review: "\u590D\u76D8\u672C\u6B21\u4F5C\u7B54",
    answerStatus: "\u5DF2\u56DE\u7B54",
    unanswered: "\u672A\u4F5C\u7B54",
    selected: "\u4F60\u9009\u62E9\u4E86\u6B64\u9879",
    history: "\u5386\u53F2\u6D4B\u9A8C\u8BB0\u5F55",
    noHistory: "\u5B8C\u6210\u6D4B\u9A8C\u540E\uFF0C\u53EF\u4EE5\u5728\u8FD9\u91CC\u67E5\u770B\u5386\u53F2\u8BB0\u5F55\u3002",
    restart: "\u518D\u7EC3\u4E00\u6B21",
    backLibrary: "\u8FD4\u56DE\u6211\u7684\u9898\u96C6",
    backHome: "\u8FD4\u56DE\u9879\u76EE\u9996\u9875",
    missing: "\u5F53\u524D\u6D4F\u89C8\u5668\u6CA1\u6709\u8FD9\u4EFD\u9898\u96C6\uFF0C\u8BF7\u6253\u5F00\u9898\u96C6\u5E93\uFF0C\u6216\u5728\u6B64\u8BBE\u5907\u6062\u590D\u5907\u4EFD\u3002",
    corrupt: "\u8FD9\u4EFD\u5B58\u6863\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u5176\u4F59\u9898\u96C6\u4ECD\u53EF\u4F7F\u7528\u3002",
    savedProgress: "\u7B54\u9898\u8FDB\u5EA6\u4F1A\u968F\u64CD\u4F5C\u4FDD\u5B58\u3002",
    viewPrompt: "\u67E5\u770B\u5E76\u624B\u52A8\u590D\u5236\u63D0\u793A\u8BCD",
    completedTotal: "\u5DF2\u5B8C\u6210 {{count}} \u6B21\u6D4B\u9A8C",
    copyBackupError: "\u5907\u4EFD\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u4F7F\u7528\u4E0B\u8F7D\u9898\u96C6\u5907\u4EFD\u3002",
    changed: "\u53E6\u4E00\u6807\u7B7E\u9875\u66F4\u65B0\u4E86\u672C\u6B21\u6D4B\u9A8C\uFF0C\u5DF2\u663E\u793A\u6700\u65B0\u8FDB\u5EA6\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u7B54\u6848\u3002",
    restartAttempt: "\u91CD\u65B0\u5F00\u59CB",
    restartConfirm: "\u66FF\u6362\u672C\u6B21\u672A\u5B8C\u6210\u7684\u4F5C\u7B54\uFF1F\u5DF2\u5B8C\u6210\u7684\u5386\u53F2\u6D4B\u9A8C\u4F1A\u4FDD\u7559\u3002",
    missingResult: "\u5F53\u524D\u6D4F\u89C8\u5668\u6CA1\u6709\u8FD9\u4EFD\u6210\u7EE9\uFF0C\u8BF7\u6253\u5F00\u9898\u96C6\u7EE7\u7EED\u4F5C\u7B54\u6216\u67E5\u770B\u5DF2\u4FDD\u5B58\u7684\u5386\u53F2\u6D4B\u9A8C\u3002",
    siteHome: "\u9996\u9875",
    practiceNav: "\u7EC3\u4E60",
    navLabel: "\u4E3B\u5BFC\u822A",
    wechatLabel: "\u5C0F\u7A0B\u5E8F",
    wechatTitle: "\u5728\u5FAE\u4FE1\u4E2D\u4F7F\u7528\u95EE\u7B54\u6D4B\u9A8C",
    wechatHint: "\u7528\u5FAE\u4FE1\u626B\u4E00\u626B\uFF0C\u6216\u4FDD\u5B58\u56FE\u7247\u540E\u5728\u5FAE\u4FE1\u626B\u4E00\u626B\u4E2D\u4ECE\u76F8\u518C\u8BC6\u522B\u3002",
    wechatCodeAlt: "\u626B\u7801\u8FDB\u5165\u95EE\u7B54\u6D4B\u9A8C\u7684\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F\u7801",
    wechatSave: "\u4FDD\u5B58\u5C0F\u7A0B\u5E8F\u7801",
    wechatSearch: "\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F\u641C\u7D22\uFF1A\u560E\u560E\u5B66AI",
    questionnaireTitle: "\u5B66\u4E60\u60C5\u51B5\u95EE\u5377",
    saveQuestionnaire: "\u4FDD\u5B58\u95EE\u5377",
    finishQuestionnaire: "\u63D0\u4EA4\u95EE\u5377",
    questionnaireMultiple: "\u9009\u62E9\u6240\u6709\u7B26\u5408\u4F60\u60C5\u51B5\u7684\u9009\u9879",
    questionnaireComplete: "\u95EE\u5377\u56DE\u7B54\u5DF2\u4FDD\u5B58",
    questionnaireHandoff: "\u56DE\u7B54\u5DF2\u4FDD\u5B58\u3002\u8BF7\u544A\u8BC9 AI\u300C\u6211\u5DF2\u56DE\u7B54\u5B8C\u6BD5\u300D\uFF0C\u7EE7\u7EED\u4E0B\u4E00\u6B65\u5B66\u4E60\u3002",
    questionnaireResponses: "\u4F60\u7684\u95EE\u5377\u56DE\u7B54",
    noPracticeQuiz: "\u8BF7\u5148\u5BFC\u5165\u77E5\u8BC6\u6D4B\u9A8C\u518D\u5F00\u59CB\u968F\u673A\u7EC3\u4E60\uFF0C\u60C5\u51B5\u95EE\u5377\u4E0D\u53C2\u4E0E\u62BD\u9898\u3002",
    questionnaireMissing: "\u8FD9\u4EFD\u95EE\u5377\u7684\u7F13\u5B58\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u65B0\u95EE\u5377\u66FF\u6362\uFF0C\u8BF7\u8BA9 AI \u91CD\u65B0\u63D0\u4F9B\u95EE\u5377\u3002",
    questionnaireConnecting: "\u6B63\u5728\u6253\u5F00\u95EE\u5377\u2026",
    questionnaireConnectionError: "\u6682\u65F6\u65E0\u6CD5\u8FDE\u63A5 AI\u3002\u8BF7\u4FDD\u7559\u6B64\u9875\u9762\uFF0C\u8BA9 AI \u91CD\u65B0\u8FDE\u63A5\uFF1B\u5DF2\u4FDD\u5B58\u7684\u56DE\u7B54\u4ECD\u4FDD\u7559\u5728\u7F51\u9875\u4E2D\u3002",
    studyConnectionTitle: "AI \u5B66\u4E60",
    studyConnecting: "\u6B63\u5728\u8FDE\u63A5\u5B66\u4E60\u9875\u9762\u2026"
  },
  legalUi: {
    privacyIntro: "\u560E\u560E\u5B66\u4E60\u7F51\u7AD9\u4E0E AI\u4F1A\u8BDD\u8F6C\u6D4B\u9A8C\uFF08AI Chat to Quiz\uFF09Chrome \u6269\u5C55\u5E2E\u52A9\u4F60\u628A AI \u4F1A\u8BDD\u53D8\u6210\u4E2A\u4EBA\u7EC3\u4E60\u9898\u96C6\u3002\u672C\u9690\u79C1\u8BF4\u660E\u540C\u65F6\u9002\u7528\u4E8E\u8FD9\u4E24\u4E2A\u4EA7\u54C1\uFF0C\u4F7F\u7528\u5747\u65E0\u9700\u6CE8\u518C\u8D26\u53F7\u3002",
    storageTitle: "\u7F51\u7AD9\uFF1A\u672C\u5730\u9898\u96C6",
    storageBody: "\u7F51\u7AD9\u5728\u5F53\u524D\u8BBE\u5907\u7684\u6D4F\u89C8\u5668\u4E2D\u4FDD\u5B58\u5BFC\u5165\u7684\u9898\u96C6\u3001\u4F5C\u7B54\u3001\u6210\u7EE9\u548C\u6280\u80FD\u6536\u85CF\uFF0C\u7528\u4E8E\u7BA1\u7406\u9898\u5E93\u3001\u4FDD\u5B58\u8FDB\u5EA6\u3001\u5C55\u793A\u7ED3\u679C\u548C\u6062\u590D\u5907\u4EFD\uFF0C\u4E0D\u5C06\u9898\u96C6\u5185\u5BB9\u6216\u7EC3\u4E60\u8BB0\u5F55\u4E0A\u4F20\u5230\u670D\u52A1\u5668\u3002\u7F51\u7AD9\u4E0E\u6269\u5C55\u7684\u5B58\u50A8\u76F8\u4E92\u72EC\u7ACB\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u540C\u6B65\uFF1B\u4F60\u53EF\u4EE5\u81EA\u884C\u901A\u8FC7\u5BFC\u51FA\u3001\u5BFC\u5165\u8FC1\u79FB\u9898\u96C6\u3002",
    requestsTitle: "\u7F51\u7AD9\u8BF7\u6C42\u4E0E Cookie",
    requestsBody: "\u8BBF\u95EE\u7F51\u7AD9\u65F6\uFF0C\u9875\u9762\u4E0E\u56FE\u7247\u8BF7\u6C42\u4F1A\u53D1\u9001\u81F3\u7F51\u7AD9\u548C\u8D44\u6E90\u670D\u52A1\u5668\u3002\u670D\u52A1\u5668\u53EF\u80FD\u5904\u7406 IP \u5730\u5740\u3001\u8BF7\u6C42\u65E5\u5FD7\u7B49\u5FC5\u8981\u6280\u672F\u4FE1\u606F\uFF0C\u4EE5\u63D0\u4F9B\u8BBF\u95EE\u548C\u6392\u67E5\u6545\u969C\u3002\u7F51\u7AD9\u7684\u8BED\u8A00\u9009\u62E9\u901A\u8FC7 Cookie \u4FDD\u5B58\u3002\u8FD9\u4E9B\u7F51\u7AD9\u8BF7\u6C42\u4E0E\u6269\u5C55\u7684\u672C\u5730\u9898\u5E93\u5B58\u50A8\u76F8\u4E92\u72EC\u7ACB\u3002",
    aiTitle: "\u6570\u636E\u5171\u4EAB\u4E0E\u5916\u90E8 AI \u670D\u52A1",
    aiBody: "\u6211\u4EEC\u4E0D\u63A5\u6536\u6216\u51FA\u552E\u4F60\u7684\u9898\u5E93\u5185\u5BB9\u4E0E\u7EC3\u4E60\u8BB0\u5F55\uFF0C\u4E0D\u5C06\u5176\u7528\u4E8E\u5E7F\u544A\uFF0C\u4E5F\u4E0D\u5411\u7B2C\u4E09\u65B9\u4F20\u8F93\u3002\u7531\u4F60\u51B3\u5B9A\u662F\u5426\u5C06\u51FA\u9898\u63D0\u793A\u8BCD\u590D\u5236\u5230 ChatGPT\u3001Claude\u3001Gemini\u3001DeepSeek\u3001Kimi \u7B49\u5916\u90E8 AI \u4F1A\u8BDD\uFF0C\u518D\u5C06\u56DE\u590D\u5E26\u56DE\u3002\u6269\u5C55\u4E0D\u4F1A\u81EA\u52A8\u8BFB\u53D6\u6216\u53D1\u9001\u4F60\u7684\u4F1A\u8BDD\u3002\u6253\u5F00\u5916\u90E8\u7F51\u7AD9\u6216\u5411\u5176\u53D1\u9001\u5185\u5BB9\u662F\u4F60\u53E6\u884C\u8FDB\u884C\u7684\u64CD\u4F5C\uFF0C\u8BE5\u670D\u52A1\u6309\u81EA\u8EAB\u9690\u79C1\u653F\u7B56\u5904\u7406\u8BBF\u95EE\u548C\u5185\u5BB9\uFF1B\u5BFC\u5165\u7684\u56DE\u590D\u7531\u7F51\u7AD9\u6216\u6269\u5C55\u5728\u672C\u5730\u5904\u7406\u3002",
    termsIntro: "\u560E\u560E\u5B66\u4E60\u5E2E\u52A9\u4F60\u5C06 AI \u5BF9\u8BDD\u6574\u7406\u4E3A\u4E2A\u4EBA\u7EC3\u4E60\u9898\u96C6\uFF0C\u8BF7\u5408\u7406\u4F7F\u7528\u670D\u52A1\u53CA\u5BFC\u5165\u5185\u5BB9\u3002",
    accuracyTitle: "\u9898\u76EE\u4E0E\u7B54\u6848",
    accuracyBody: "\u6D4B\u9A8C\u6839\u636E\u5BFC\u5165\u6587\u4EF6\u4E2D\u7684\u53C2\u8003\u7B54\u6848\u8BC4\u5206\uFF0C\u4E0D\u4F1A\u72EC\u7ACB\u6838\u5B9E AI \u751F\u6210\u7B54\u6848\u662F\u5426\u6B63\u786E\u3002\u9047\u5230\u7591\u95EE\uFF0C\u8BF7\u56DE\u5230\u539F\u59CB\u6750\u6599\u6838\u5BF9\u3002",
    backupTitle: "\u4FDD\u7559\u4F60\u7684\u8BB0\u5F55",
    backupBody: "\u6570\u636E\u4EC5\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u3002\u6E05\u7406\u6D4F\u89C8\u5668\u6216\u66F4\u6362\u8BBE\u5907\u524D\u8BF7\u5BFC\u51FA\u5907\u4EFD\u3002\u670D\u52A1\u4E0D\u63D0\u4F9B\u8D26\u53F7\u6062\u590D\u6216\u8BBE\u5907\u95F4\u81EA\u52A8\u540C\u6B65\u3002",
    useTitle: "\u5408\u7406\u4F7F\u7528",
    useBody: "\u8BF7\u53EA\u5BFC\u5165\u4F60\u6709\u6743\u4F7F\u7528\u7684\u5185\u5BB9\uFF0C\u4E0D\u5F97\u7528\u4E8E\u8FDD\u6CD5\u3001\u9A9A\u6270\u3001\u6B3A\u8BC8\u6216\u4FB5\u6743\u884C\u4E3A\u3002\u4EA7\u54C1\u529F\u80FD\u548C\u76F8\u5173\u8BF4\u660E\u53EF\u80FD\u968F\u670D\u52A1\u53D1\u5C55\u800C\u8C03\u6574\u3002",
    extensionTitle: "Chrome \u6269\u5C55\uFF1AAI\u4F1A\u8BDD\u8F6C\u6D4B\u9A8C",
    extensionBody: "\u6269\u5C55\u5904\u7406\u4F60\u4E3B\u52A8\u5BFC\u5165\u7684\u9898\u76EE\u3001\u7B54\u6848\u3001\u89E3\u6790\u3001\u5907\u4EFD\uFF0C\u4EE5\u53CA\u4F60\u7684\u4F5C\u7B54\u3001\u6210\u7EE9\u3001\u7EC3\u4E60\u8BB0\u5F55\u548C\u504F\u597D\u3002\u9898\u5E93\u3001\u8FDB\u5EA6\u3001\u8BED\u8A00\u9009\u62E9\u4E0E\u5F15\u5BFC\u5B8C\u6210\u6807\u8BB0\u4FDD\u5B58\u5728\u5F53\u524D\u8BBE\u5907\u7684 Chrome \u914D\u7F6E\u4E2D\uFF0C\u4EC5\u7528\u4E8E\u5BFC\u5165\u3001\u7EC3\u4E60\u3001\u590D\u76D8\u3001\u5907\u4EFD\u548C\u8BB0\u4F4F\u8BBE\u7F6E\u3002\u6269\u5C55\u4E0D\u6536\u96C6\u8D26\u53F7\u4FE1\u606F\uFF0C\u4E0D\u8BFB\u53D6\u7F51\u9875\u6216\u6D4F\u89C8\u5386\u53F2\uFF0C\u4E0D\u4E0A\u4F20\u9898\u5E93\u6570\u636E\uFF0C\u4E5F\u4E0D\u5305\u542B\u7EDF\u8BA1\u8FFD\u8E2A\uFF1B\u4E0D\u4F1A\u901A\u8FC7\u8D26\u53F7\u6216\u8DE8\u8BBE\u5907\u540C\u6B65\u4F60\u7684\u6570\u636E\u3002",
    clipboardTitle: "\u526A\u8D34\u677F\u4E0E\u6587\u4EF6",
    clipboardBody: "\u7F51\u7AD9\u4E0E\u6269\u5C55\u90FD\u53EA\u5728\u4F60\u70B9\u51FB\u590D\u5236\u6216\u8BFB\u53D6\u526A\u8D34\u677F\u6309\u94AE\u65F6\u8BBF\u95EE\u526A\u8D34\u677F\uFF0C\u4E0D\u5728\u540E\u53F0\u76D1\u542C\u526A\u8D34\u677F\u3002\u4F60\u9009\u62E9\u7684\u6587\u4EF6\u5728\u672C\u673A\u8BFB\u53D6\uFF0C\u5BFC\u51FA\u7684\u9898\u96C6\u548C\u5907\u4EFD\u7531\u6D4F\u89C8\u5668\u4FDD\u5B58\u3002\u7C98\u8D34\u6216\u5BFC\u5165\u7684\u5185\u5BB9\u4EC5\u7528\u4E8E\u4F60\u4E3B\u52A8\u9009\u62E9\u7684\u6D4B\u9A8C\u548C\u5907\u4EFD\u529F\u80FD\u3002",
    introductionTitle: "\u4E09\u9898\u9996\u6B21\u5F15\u5BFC",
    introductionBody: "\u7F51\u7AD9\u4E0E\u6269\u5C55\u7684\u9996\u6B21\u793A\u4F8B\u5747\u4E3A\u53EF\u9009\u4F53\u9A8C\uFF0C\u4EC5\u5728\u9875\u9762\u5185\u5B58\u4E2D\u8FD0\u884C\u3002\u4E09\u9053\u793A\u4F8B\u9898\u3001\u4F60\u7684\u7B54\u6848\u548C\u7ED3\u679C\u4E0D\u52A0\u5165\u9898\u5E93\u3001\u5386\u53F2\u3001\u7EDF\u8BA1\u6216\u5907\u4EFD\uFF0C\u5B8C\u6210\u6216\u79BB\u5F00\u5F15\u5BFC\u540E\u5373\u4E22\u5F03\u3002\u5B8C\u6210\u6216\u8DF3\u8FC7\u5F15\u5BFC\u53EA\u4FDD\u5B58\u4E00\u4E2A\u5DF2\u770B\u8FC7\u6807\u8BB0\uFF0C\u7F51\u7AD9\u548C\u6269\u5C55\u5206\u522B\u4FDD\u5B58\u3002",
    retentionTitle: "\u6570\u636E\u4FDD\u7559\u4E0E\u5220\u9664",
    retentionBody: "\u5DF2\u4FDD\u5B58\u7684\u9898\u5E93\u6570\u636E\u4FDD\u7559\u5728\u5F53\u524D\u8BBE\u5907\uFF0C\u76F4\u5230\u4F60\u5220\u9664\u6570\u636E\u6216\u6E05\u9664\u76F8\u5E94\u7684\u6D4F\u89C8\u5668\u5B58\u50A8\u3002\u5220\u9664\u9898\u96C6\u4F1A\u540C\u65F6\u5220\u9664\u8BE5\u9898\u96C6\u53CA\u5176\u7EC3\u4E60\u8BB0\u5F55\uFF1B\u6E05\u9664\u7F51\u7AD9\u6570\u636E\u4F1A\u5220\u9664\u7F51\u7AD9\u7684\u672C\u5730\u8BB0\u5F55\u548C\u504F\u597D\uFF0C\u5378\u8F7D\u6269\u5C55\u4F1A\u5220\u9664\u6269\u5C55\u7684\u672C\u5730\u6570\u636E\u3002\u5982\u9700\u4FDD\u7559\u9898\u96C6\uFF0C\u8BF7\u63D0\u524D\u5BFC\u51FA\u5907\u4EFD\u3002\u5DF2\u5BFC\u51FA\u7684\u6587\u4EF6\u548C\u5DF2\u590D\u5236\u7684\u526A\u8D34\u677F\u6587\u672C\u4F4D\u4E8E\u5E94\u7528\u5B58\u50A8\u4E4B\u5916\uFF0C\u9700\u8981\u4F60\u81EA\u884C\u5220\u9664\u6587\u4EF6\u6216\u66FF\u6362\u526A\u8D34\u677F\u5185\u5BB9\u3002\u6211\u4EEC\u4E0D\u63D0\u4F9B\u8D26\u53F7\u6062\u590D\u529F\u80FD\u3002"
  },
  onboardingUi: {
    welcomeEyebrow: "\u5148\u7528 3 \u9053\u9898\u8BA4\u8BC6\u4E00\u4E0B",
    welcomeTitle: "\u6B22\u8FCE\u6765\u5230{{brand}}",
    welcomeIntro: "\u7528 3 \u9053\u7B80\u5355\u7684\u793A\u4F8B\u9898\uFF0C\u4F53\u9A8C\u9009\u62E9\u7B54\u6848\u548C\u67E5\u770B\u89E3\u6790\u3002\u65E0\u9700\u51C6\u5907\u9898\u96C6\uFF0C\u73B0\u5728\u5C31\u80FD\u8BD5\u8BD5\u3002",
    start: "\u4F53\u9A8C 3 \u9053\u793A\u4F8B\u9898",
    skip: "\u8DF3\u8FC7\u5F15\u5BFC",
    exampleTitle: "\u7B2C\u4E00\u6B21\u7B54\u9898\u4F53\u9A8C",
    memoryNote: "\u8FD9\u53EA\u662F\u4E00\u6B21\u5F15\u5BFC\uFF0C\u793A\u4F8B\u7B54\u6848\u548C\u7ED3\u679C\u4E0D\u4F1A\u4FDD\u5B58\u3002",
    finish: "\u5B8C\u6210\u793A\u4F8B",
    preferenceError: "\u6682\u65F6\u65E0\u6CD5\u5728\u6B64\u8BBE\u5907\u8BB0\u4F4F\u5F15\u5BFC\u72B6\u6001\uFF0C\u4E0B\u6B21\u8BBF\u95EE\u65F6\u53EF\u80FD\u4F1A\u518D\u6B21\u51FA\u73B0\u3002",
    q1Stem: "\u60F3\u68C0\u9A8C\u81EA\u5DF1\u8BB0\u4F4F\u4E86\u591A\u5C11\uFF0C\u54EA\u79CD\u505A\u6CD5\u66F4\u5408\u9002\uFF1F",
    q1A: "\u5148\u5C1D\u8BD5\u7B54\u9898\uFF0C\u518D\u67E5\u770B\u7B54\u6848\u3002",
    q1B: "\u4E0D\u5C1D\u8BD5\u7B54\u9898\uFF0C\u76F4\u63A5\u770B\u7B54\u6848\u3002",
    q1C: "\u8DF3\u8FC7\u6BCF\u4E00\u9053\u9898\u3002",
    q1Explanation: "\u5355\u9009\u9898\u9009\u62E9\u4E00\u4E2A\u9009\u9879\uFF0C\u63D0\u4EA4\u540E\u5C31\u80FD\u770B\u5230\u6B63\u786E\u7B54\u6848\u548C\u89E3\u6790\u3002\u7B54\u9519\u4E5F\u6CA1\u5173\u7CFB\uFF0C\u8FD9\u6B63\u662F\u5B66\u4E60\u7684\u8FC7\u7A0B\u3002",
    q2Stem: "\u4F7F\u7528\u9898\u96C6\u7EC3\u4E60\u65F6\uFF0C\u54EA\u4E24\u79CD\u4E60\u60EF\u6709\u5E2E\u52A9\uFF1F",
    q2A: "\u7B54\u5B8C\u540E\u9605\u8BFB\u89E3\u6790\u3002",
    q2B: "\u56DE\u987E\u4E4B\u524D\u89C9\u5F97\u56F0\u96BE\u7684\u9898\u76EE\u3002",
    q2C: "\u6BCF\u6B21\u90FD\u9009\u7B2C\u4E00\u4E2A\u9009\u9879\u3002",
    q2Explanation: "\u591A\u9009\u9898\u9700\u8981\u9009\u4E2D\u6240\u6709\u6B63\u786E\u9009\u9879\uFF0C\u5E76\u4E14\u4E0D\u9009\u9519\u8BEF\u9009\u9879\u3002\u8FD9\u9053\u9898\u4E2D\uFF0C\u9605\u8BFB\u89E3\u6790\u548C\u56DE\u987E\u96BE\u9898\u90FD\u662F\u6709\u5E2E\u52A9\u7684\u4E60\u60EF\u3002",
    q3Stem: "\u8FD9\u6B21\u5F15\u5BFC\u4E2D\u7684\u7B54\u9898\u7ED3\u679C\u4F1A\u600E\u6837\u5904\u7406\uFF1F",
    q3A: "\u663E\u793A\u5728\u7B54\u9898\u5386\u53F2\u4E2D\u3002",
    q3B: "\u9000\u51FA\u5F15\u5BFC\u540E\u5C31\u4F1A\u4E22\u5F03\u3002",
    q3C: "\u6DFB\u52A0\u5230\u6211\u7684\u9898\u5E93\u4E2D\u3002",
    q3Explanation: "\u8FD9 3 \u9053\u9898\u53EA\u7528\u4E8E\u4F53\u9A8C\uFF0C\u4E0D\u4F1A\u521B\u5EFA\u9898\u96C6\u6216\u7B54\u9898\u8BB0\u5F55\u3002\u8BBE\u5907\u4E0A\u53EA\u4F1A\u4FDD\u5B58\u4E00\u4E2A\u201C\u5DF2\u770B\u8FC7\u5F15\u5BFC\u201D\u7684\u6807\u8BB0\u3002"
  },
  extensionUi: {
    brand: "AI\u4F1A\u8BDD\u8F6C\u6D4B\u9A8C",
    welcomeIntro: "\u628A ChatGPT\u3001Claude\u3001Gemini\u3001DeepSeek\u3001Kimi \u7B49 AI \u4F1A\u8BDD\u53D8\u6210\u81EA\u6D4B\u81EA\u68C0\u7684\u9898\u96C6\u3002\u5148\u7528 3 \u9053\u793A\u4F8B\u9898\u4F53\u9A8C\u7B54\u9898\u548C\u89E3\u6790\u3002"
  },
  articleUi: {
    title: "\u6587\u7AE0",
    intro: "\u63A2\u7D22 AI \u5B66\u4E60\u65B9\u6CD5\u3001\u5B9E\u7528\u6307\u5357\u4E0E\u5177\u4F53\u5B9E\u8DF5\u3002",
    empty: "\u5F53\u524D\u8BED\u8A00\u6682\u65E0\u6587\u7AE0\u3002",
    allArticles: "\u5168\u90E8\u6587\u7AE0",
    published: "\u53D1\u5E03\u4E8E",
    updated: "\u66F4\u65B0\u4E8E",
    by: "\u4F5C\u8005",
    translations: "\u53EF\u9605\u8BFB\u7684\u8BED\u8A00",
    previous: "\u4E0A\u4E00\u9875\u6587\u7AE0",
    next: "\u4E0B\u4E00\u9875\u6587\u7AE0",
    home: "\u7F51\u7AD9\u9996\u9875",
    language: "\u6587\u7AE0\u76EE\u5F55\u8BED\u8A00",
    unavailable: "\u6587\u7AE0\u6682\u65F6\u65E0\u6CD5\u52A0\u8F7D\u3002",
    retry: "\u91CD\u65B0\u52A0\u8F7D\u6587\u7AE0"
  },
  guideUi: {
    title: "\u7EE7\u7EED\u4F60\u7684\u5B66\u4E60",
    paste: "\u590D\u5236 AI \u4F1A\u8BDD\u63D0\u4F9B\u7684\u5B8C\u6574\u9898\u96C6 JSON\uFF0C\u7C98\u8D34\u5230\u8FD9\u91CC\uFF08Windows \u4F7F\u7528 Ctrl+V\uFF0CMac \u4F7F\u7528 Command+V\uFF09\u3002",
    check: "\u70B9\u51FB\u6821\u9A8C\u9898\u96C6\u3002\u5982\u679C\u51FA\u73B0\u9519\u8BEF\uFF0C\u8BF7\u6839\u636E\u9875\u9762\u63D0\u793A\u4FEE\u6539\u5185\u5BB9\u3002",
    confirm: "\u6838\u5BF9\u9898\u96C6\u6807\u9898\u548C\u9898\u6570\uFF0C\u518D\u786E\u8BA4\u5BFC\u5165\u3002\u9898\u96C6\u5C06\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4E2D\u3002",
    start: "\u5148\u67E5\u770B\u8BF4\u660E\uFF1B\u5982\u6709\u96BE\u5EA6\u9009\u9879\uFF0C\u53EF\u6309\u9700\u9009\u62E9\uFF0C\u51C6\u5907\u597D\u540E\u70B9\u51FB\u5F00\u59CB\u3002",
    export: "\u590D\u5236\u9898\u5E93\u5907\u4EFD\uFF0C\u7C98\u8D34\u56DE AI \u4F1A\u8BDD\u8FDB\u884C\u590D\u76D8\u3002\u65E0\u6CD5\u590D\u5236\u65F6\uFF0C\u53EF\u4E0B\u8F7D\u9898\u5E93\u5907\u4EFD\uFF1B\u9898\u5E93\u4E3A\u7A7A\u65F6\uFF0C\u8BF7\u5148\u5BFC\u5165\u9898\u96C6\u3002",
    close: "\u5173\u95ED\u64CD\u4F5C\u6307\u5F15"
  }
};

// apps/web/skills/selfstudy-coach/tools/bridge-runtime.ts
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, renameSync, openSync, closeSync } from "node:fs";
import path from "node:path";
var filename = (directory, name) => path.join(directory, name + ".json");
var load = (file) => JSON.parse(readFileSync(file, "utf8"));
function save(file, value) {
  writeFileSync(file + ".tmp", JSON.stringify(value, null, 2) + "\n", { mode: 384 });
  renameSync(file + ".tmp", file);
}
var object = (value) => value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
async function body(request, maximum = 8 * 1024 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maximum) throw new Error("RESPONSE_TOO_LARGE");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function launch(directory, entry) {
  const existing = load(filename(directory, "session"));
  const describe = (session) => console.log(
    JSON.stringify({
      directory,
      previewUrl: `http://127.0.0.1:${session.port}/#${session.token}`,
      responsesFile: filename(directory, "responses"),
      sessionId: session.id
    })
  );
  if (existing.port) {
    try {
      const response = await fetch(`http://127.0.0.1:${existing.port}/status`, {
        headers: { Authorization: `Bearer ${existing.token}` },
        signal: AbortSignal.timeout(1500)
      });
      if (response.ok) {
        describe(existing);
        return;
      }
      throw new Error("The local port is occupied by another service");
    } catch (error2) {
      if (error2 instanceof Error && error2.message.includes("occupied")) throw error2;
    }
  }
  const ready = filename(directory, "ready");
  save(ready, { listening: false });
  const log = openSync(path.join(directory, "bridge.log"), "a", 384);
  const child = spawn(process.execPath, [entry, "serve", directory], {
    detached: true,
    stdio: ["ignore", log, log],
    windowsHide: true
  });
  closeSync(log);
  child.unref();
  let error;
  child.once("error", (value) => {
    error = value;
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (error) throw error;
    const session = load(filename(directory, "session"));
    if (session.port && object(load(ready)).listening === true) {
      describe(session);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local connection did not start. Read " + path.join(directory, "bridge.log"));
}

// apps/web/skills/selfstudy-coach/tools/study-bridge.ts
var writes = /* @__PURE__ */ new Set(["quiz.import", "quiz.start", "questionnaire.import"]);
var literal = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
function bridgePage(session) {
  const copy = (session.locale === "zh-CN" ? common_default2 : common_default).quizUi;
  return `<!doctype html><html lang="${session.locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>${copy.studyConnectionTitle}</title>
<style>html,body{height:100%;margin:0}iframe{width:100%;height:100%;border:0;display:block}#status{position:fixed;inset:0 0 auto;padding:16px;background:#fff8e8;color:#392f19;font:16px/1.5 system-ui;z-index:1}#status[hidden]{display:none}</style>
<div id="status" role="status">${copy.studyConnecting}</div><iframe title="${copy.studyConnectionTitle}" referrerpolicy="no-referrer" allow="clipboard-write"></iframe>
<script>
const token = location.hash.slice(1), site = ${literal(session.origin)}, id = ${literal(session.id)};
const frame = document.querySelector('iframe'), status = document.getElementById('status');
const clientId = crypto.randomUUID();
const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-Study-Client': clientId };
let stopped = false, latest, sending = false, webSeen = 0;
const replies = new Map();
const fail = () => { status.textContent = ${literal(copy.questionnaireConnectionError)}; status.hidden = false; };
async function request(url, value) {
  const response = await fetch(url, { headers, ...(value === undefined ? {} : { method: 'POST', body: JSON.stringify(value) }) });
  const data = await response.json();
  if (!response.ok) {
    if (data.error === 'PAGE_REPLACED') stopped = true;
    throw Error(data.error || 'CONNECTION_FAILED');
  }
  return data;
}
async function flush() {
  if (stopped || sending) return;
  sending = true;
  try {
    for (const [callId, reply] of replies) {
      await request('/result', reply);
      if (replies.get(callId) === reply) replies.delete(callId);
    }
    if (latest) {
      const state = latest;
      await request('/state', state);
      if (latest === state) latest = undefined;
      status.hidden = state.pageState !== 'error' && state.pageState !== 'pending';
      if (state.pageState === 'error') fail();
    }
  } catch { fail(); }
  finally { sending = false; }
}
window.addEventListener('message', (event) => {
  const value = event.data;
  if (event.source !== frame.contentWindow || event.origin !== site || !value || value.id !== id || value.token !== token) return;
  webSeen = Date.now();
  if (value.type === 'gaga.study.state') latest = value;
  if (value.type === 'gaga.study.result' && typeof value.callId === 'string') replies.set(value.callId, value);
  void flush();
});
async function poll() {
  if (stopped) return;
  try {
    const data = await request('/poll');
    if (data.command && Date.now() - webSeen < 6000)
      frame.contentWindow.postMessage({ type: 'gaga.study.command', token, id, callId: data.command.id, request: data.command.request }, site);
    await flush();
    if (Date.now() - webSeen > 10000) fail();
  } catch { fail(); }
  finally { if (!stopped) setTimeout(poll, 1000); }
}
request('/connect', { clientId }).then((setup) => {
  const url = new URL(setup.path, site);
  url.hash = new URLSearchParams({ studyBridge: '1', bridgeToken: token, bridgeOrigin: location.origin, bridgeId: id });
  frame.src = url.href;
  void poll();
}).catch(fail);
</script></html>`;
}
function commandJob(input) {
  const request = object(input);
  if (typeof request.command !== "string" || !request.command.trim() || request.args !== void 0 && (request.args === null || typeof request.args !== "object" || Array.isArray(request.args)))
    throw new Error("INVALID_COMMAND");
  if (writes.has(request.command) && !request.requestId) throw new Error("REQUEST_ID_REQUIRED");
  if (request.requestId !== void 0 && (typeof request.requestId !== "string" || !request.requestId.trim() || request.requestId.length > 128))
    throw new Error("INVALID_REQUEST_ID");
  const id = typeof request.requestId === "string" ? request.requestId : randomUUID();
  return { id, request: { command: request.command, args: request.args ?? {}, requestId: id } };
}
function checkedState(input, session) {
  if (input.type !== "gaga.study.state" || input.id !== session.id || input.token !== session.token || typeof input.skillOperationVersion !== "string")
    throw new Error("INVALID_RESPONSE");
  const url = new URL(String(input.url));
  if (url.origin !== session.origin || !/^\/app(?:\/|$)/.test(url.pathname) || url.hash || !["ready", "pending", "running", "completed", "error"].includes(String(input.pageState)))
    throw new Error("INVALID_PAGE_STATE");
  const active = object(input.active);
  const payload = object(input.payload);
  if (active.kind === "questionnaire") {
    const questionnaire = readQuestionnaireSession(payload.questionnaire);
    if (questionnaire.id !== active.id || active.title !== questionnaire.questionnaire.title || active.questionCount !== questionnaire.answers.length || active.completedAt !== questionnaire.completedAt || url.pathname !== `/app/questionnaires/${questionnaire.id}` || input.pageState === "completed" && questionnaire.completedAt === null || input.pageState === "running" && questionnaire.completedAt !== null)
      throw new Error("WRONG_QUESTIONNAIRE");
  } else if (active.kind === "quiz") {
    if (typeof active.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(active.id) || !new RegExp(`^/app/quizzes/${active.id}(?:/run|/results/[a-zA-Z0-9_-]{1,64})?$`).test(
      url.pathname
    ))
      throw new Error("WRONG_QUIZ");
    if (input.pageState === "completed") {
      if (!Array.isArray(payload.questions)) throw new Error("INVALID_COMPLETION");
      const quiz = readQuiz({
        format: "gaga.quiz",
        schemaVersion: 1,
        title: payload.title,
        questions: payload.questions.map((item) => object(item).question)
      });
      const attempt = readQuizAttempt(payload.attempt, quiz);
      if (payload.quizId !== active.id || attempt.id !== active.attemptId || attempt.completedAt === null || active.completedAt !== attempt.completedAt || url.pathname !== `/app/quizzes/${active.id}/results/${attempt.id}` || JSON.stringify(quizAttemptResult(attempt)) !== JSON.stringify(payload.result))
        throw new Error("INVALID_COMPLETION");
    }
  } else if (["running", "completed"].includes(String(input.pageState)))
    throw new Error("INVALID_ACTIVITY");
  return {
    pageState: input.pageState,
    url: url.href,
    active: input.active ?? null,
    ...input.payload ? { payload: input.payload } : {},
    ...input.error ? { error: input.error } : {},
    skillOperationVersion: input.skillOperationVersion,
    sessionId: session.id
  };
}
async function serveStudyBridge(directory, requestedPort = 0) {
  const session = load(filename(directory, "session"));
  const commandFile = filename(directory, "commands");
  const jobs = new Map(
    (existsSync(commandFile) ? load(commandFile) : []).map((job) => [job.id, job])
  );
  const responseFile = filename(directory, "responses");
  let state = existsSync(responseFile) ? object(load(responseFile)) : { pageState: "waiting" };
  let lastSeenAt = 0;
  const waiters = /* @__PURE__ */ new Map();
  const persist = () => save(
    commandFile,
    [...jobs.values()].filter((job) => !job.result || writes.has(String(job.request.command)))
  );
  const connected = () => lastSeenAt > 0 && Date.now() - lastSeenAt < 7e3;
  const enqueue = (input) => {
    const next = commandJob(input), previous = jobs.get(next.id);
    if (previous && JSON.stringify(previous.request) !== JSON.stringify(next.request))
      throw new Error("REQUEST_ID_CONFLICT");
    if (previous) return previous;
    jobs.set(next.id, next);
    persist();
    return next;
  };
  const server = createServer((request, response) => {
    const json = (status, value) => {
      response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify(value));
    };
    void (async () => {
      const address2 = server.address();
      if (!address2 || typeof address2 === "string") throw new Error("NO_LOCAL_ADDRESS");
      const host = `127.0.0.1:${address2.port}`;
      if (request.headers.host !== host || request.headers.origin && request.headers.origin !== `http://${host}`)
        return json(403, { error: "WRONG_ORIGIN" });
      if (request.method === "GET" && request.url === "/") {
        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff"
        });
        response.end(bridgePage(session));
        return;
      }
      if (request.headers.authorization !== `Bearer ${session.token}`)
        return json(403, { error: "INVALID_TOKEN" });
      if (request.method === "GET" && request.url === "/status") {
        const last = [...jobs.values()].at(-1);
        return json(200, {
          sessionId: session.id,
          connected: connected(),
          lastSeenAt: lastSeenAt || null,
          pageState: connected() ? state.pageState : "waiting",
          lastPageState: state.pageState,
          url: state.url,
          active: state.active,
          skillOperationVersion: state.skillOperationVersion,
          ...last ? {
            lastCommand: {
              requestId: last.id,
              command: last.request.command,
              status: last.result ? "completed" : "pending",
              ok: last.result?.ok,
              error: last.result?.error
            }
          } : {}
        });
      }
      if (request.method === "POST" && request.url === "/stop") {
        json(200, { stopped: true });
        server.close();
        return;
      }
      if (request.method === "POST" && request.url === "/call") {
        const input = await body(request);
        const candidate = commandJob(input);
        if (!connected() && !jobs.get(candidate.id)?.result)
          return json(409, { error: "PAGE_NOT_CONNECTED", requestId: candidate.id });
        const job = enqueue(candidate.request);
        const replayed = !!job.result;
        if (!job.result)
          await new Promise((resolve) => {
            const callbacks = waiters.get(job.id) ?? /* @__PURE__ */ new Set();
            const finish = () => {
              clearTimeout(timer);
              callbacks.delete(finish);
              if (!callbacks.size) waiters.delete(job.id);
              resolve();
            };
            const timer = setTimeout(finish, 2e4);
            callbacks.add(finish);
            waiters.set(job.id, callbacks);
          });
        if (!job.result) return json(409, { error: "COMMAND_PENDING", requestId: job.id });
        return json(200, {
          ...job.result,
          connection: {
            sessionId: session.id,
            requestId: job.id,
            receivedAt: job.receivedAt,
            replayed,
            connected: connected()
          }
        });
      }
      if (request.method === "POST" && request.url === "/connect") {
        const input = object(await body(request));
        if (typeof input.clientId !== "string" || !/^[a-f0-9-]{36}$/.test(input.clientId))
          throw new Error("INVALID_CLIENT");
        session.clientId = input.clientId;
        lastSeenAt = 0;
        save(filename(directory, "session"), session);
        const url = new URL(
          typeof state.url === "string" ? state.url : "/app/import",
          session.origin
        );
        url.searchParams.delete("fresh");
        return json(200, { path: url.pathname + url.search });
      }
      if (!session.clientId || request.headers["x-study-client"] !== session.clientId)
        return json(409, { error: "PAGE_REPLACED" });
      if (request.method === "GET" && request.url === "/poll") {
        const job = [...jobs.values()].find((item) => !item.result);
        return json(200, { command: job ? { id: job.id, request: job.request } : null });
      }
      if (request.method === "POST" && request.url === "/state") {
        const value = checkedState(object(await body(request)), session);
        const { receivedAt: _previousTime, ...previous } = state;
        if (JSON.stringify(previous) !== JSON.stringify(value)) {
          state = { ...value, receivedAt: Date.now() };
          save(responseFile, state);
        }
        lastSeenAt = Date.now();
        return json(200, { saved: true });
      }
      if (request.method === "POST" && request.url === "/result") {
        const input = object(await body(request)), result = object(input.result), job = jobs.get(String(input.callId));
        if (input.type !== "gaga.study.result" || input.id !== session.id || input.token !== session.token || typeof result.ok !== "boolean" || typeof result.command !== "string" || !result.ok && typeof object(result.error).code !== "string")
          throw new Error("INVALID_RESULT");
        if (!job) return json(200, { saved: false, obsolete: true });
        if (result.command !== job.request.command) throw new Error("INVALID_RESULT");
        if (!job.result) {
          job.result = result;
          job.receivedAt = Date.now();
          persist();
        }
        for (const done of waiters.get(job.id) ?? []) done();
        const reads = [...jobs.values()].filter(
          (item) => item.result && !writes.has(String(item.request.command))
        );
        for (const old of reads.slice(0, -32)) jobs.delete(old.id);
        return json(200, { saved: true });
      }
      json(404, { error: "NOT_FOUND" });
    })().catch(
      (error) => json(400, { error: error instanceof Error ? error.message : "INVALID_REQUEST" })
    );
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(requestedPort, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("NO_LOCAL_ADDRESS");
  session.port = address.port;
  save(filename(directory, "session"), session);
  const lifetime = setTimeout(
    () => {
      server.close();
    },
    2 * 60 * 60 * 1e3
  );
  lifetime.unref();
  server.on("close", () => {
    clearTimeout(lifetime);
    for (const callbacks of waiters.values()) for (const done of callbacks) done();
  });
  return server;
}
async function main(args) {
  const [command, ...parameters] = args;
  if (command === "start") {
    const option = (name) => parameters.includes(name) ? parameters[parameters.indexOf(name) + 1] : void 0;
    const origin = option("--origin");
    if (!origin) throw new Error("--origin must specify the website from the installed Skill");
    const target = new URL(origin);
    if (target.origin !== origin || target.protocol !== "https:" && (target.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(target.hostname)))
      throw new Error("Use an HTTPS web origin, or localhost for local testing");
    const output = option("--output"), locale = option("--locale") ?? "en";
    if (!output) throw new Error("--output must name a new session directory");
    if (!["en", "zh-CN"].includes(locale)) throw new Error("Invalid locale");
    const requestFile = option("--request");
    const initial = requestFile ? commandJob(load(path2.resolve(requestFile))) : void 0;
    const directory2 = path2.resolve(output);
    mkdirSync(directory2, { mode: 448 });
    save(filename(directory2, "session"), {
      id: randomUUID(),
      token: randomBytes(32).toString("hex"),
      origin,
      locale,
      createdAt: Date.now()
    });
    if (initial) save(filename(directory2, "commands"), [initial]);
    await launch(directory2, fileURLToPath(import.meta.url));
    return;
  }
  const file = parameters[0];
  if (!file || !["resume", "status", "read", "stop", "serve", "call"].includes(command ?? ""))
    throw new Error(
      "Usage: study-bridge.mjs start --origin <web-origin> --output <new-directory> [--request <command.json>] [--locale en|zh-CN]; resume|status|read|stop <directory>; call <directory> <command.json>"
    );
  const directory = path2.resolve(file), session = load(filename(directory, "session"));
  if (command === "serve") {
    await serveStudyBridge(directory, session.port ?? 0);
    save(filename(directory, "ready"), { listening: true });
    return;
  }
  if (command === "resume") {
    await launch(directory, fileURLToPath(import.meta.url));
    return;
  }
  if (command === "read") {
    const result2 = existsSync(filename(directory, "responses")) ? object(load(filename(directory, "responses"))) : {};
    if (result2.pageState !== "completed" || object(result2.active).completedAt == null || !result2.payload)
      throw new Error("ACTIVITY_NOT_COMPLETED");
    console.log(JSON.stringify({ ...result2, live: false }, null, 2));
    return;
  }
  const input = command === "call" ? load(path2.resolve(parameters[1] ?? "")) : void 0;
  const response = await fetch(`http://127.0.0.1:${session.port}/${command}`, {
    method: ["stop", "call"].includes(command) ? "POST" : "GET",
    headers: { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
    ...input === void 0 ? {} : { body: JSON.stringify(input) },
    signal: AbortSignal.timeout(command === "call" ? 25e3 : 5e3)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(result));
  console.log(JSON.stringify(result, null, 2));
  if (object(result).ok === false) process.exitCode = 1;
}
if (process.argv[1] && path2.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
export {
  bridgePage,
  main,
  serveStudyBridge
};
