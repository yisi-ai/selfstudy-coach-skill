# Reading data and stored records

Use the route already prepared in SKILL.md. Current command help defines available reads and retention. Prefer focused questionnaire/result/search reads; use `snapshot.read` only when a full library snapshot is needed. This reference describes data and storage, not another execution route.

Snapshots carry `live: false` when read from a local completion receipt. Check activity/attempt IDs and `receivedAt`; a delivered result does not prove that the page is currently connected. The Node route explains how to select a retained completion after a reload. File-delivery users supply actual evidence through their selected handoff instructions.

The legacy snapshot script is read-only and performs no network calls, writes, or automatic answering; execution is documented in the browser-control route. `practice: true` produces no separate mixed backup records because grading is written back to source quizzes. A supplied quiz backup corresponds to the snapshot's `backup` object and need not contain the outer snapshot metadata or a questionnaire.

`WRONG_ORIGIN` indicates a mismatched page; `QUIZ_STORAGE_UNSUPPORTED` indicates missing browser storage locks. Unknown/corrupt formats do not imply an empty library. Never clear data to make a read succeed.

## Output structure

The outer object has `format: gaga.learn.snapshot`, `schemaVersion: 1`, and fields `origin`, `release` (the supplied skill version), `versionCheck`, `practice`, `backup`, and separate `questionnaire`.

`versionCheck` contains `skillVersion`, `skillOperationVersion` (the webpage's declared supported skill version, or null), and `status` (`same`, `different`, or `unavailable`). It is diagnostic metadata, not an access restriction: valid readable data is returned across version differences. None of these statuses triggers an update prompt. Normal reads do not analyze version direction; use the fields only for actual compatibility diagnosis or an explicit user request. Prefer `data-skill-operation-version`, with legacy fallbacks to `data-gaga-version` and `data-gaga-release.version`. Legacy `webVersion` aliases `skillOperationVersion`. Content hashes play no role.

`backup` uses `format: gaga.quiz.backup`, `schemaVersion: 5`, `exportedAt` (Unix milliseconds), `settings`, `records`, and `histories`. Versions 1–4 are readable. Genuine legacy completions retain their selections; v3 latest-result-only data cannot reconstruct past tests. Read-only conversion leaves originals unchanged. Older clients cannot read v5.

Each record contains:

- `storageVersion: 4`, `id` (local quiz ID), and `importedAt`.
- `quiz`: the complete `gaga.quiz` v1 or supported visual v2, including raw formulas, geometry parameters, and image URLs, but no image files. The original source JSON is not duplicated separately.
- `results`: a map from question ID to `{ correct: boolean, answeredAt: number }`, with Unix-millisecond timestamps. Only the latest actually answered and graded result is saved. A missing key means no grade, not an incorrect answer.
- `attempts`: at most one unfinished attempt for resumption, empty after completion. Compact completed tests live separately in `histories`; full attempts and difficulty are not retained there.

`histories` contains each completed test once: `{ id, completedAt, type: "quiz" | "mixed", answers: [{ quizId, questionId, optionIds }] }`. Selections use the original option IDs; an empty selection means unanswered. Resolve questions against `records` by quiz ID and question ID, then use exact-set grading. No difficulty, option snapshots or explanations are duplicated in history. Mixed tests appear in every contributing quiz and contain all selected questions, not only the current quiz's subset. Deleting a source quiz also deletes histories referring to it.

Discover `quiz.history` and `quiz.history.read` through current `help` to inspect compact history and computed correctness. History detail is read-only and shows stems and correctness; selected option IDs are available to the Agent. Dates in the UI use local calendar days (today, yesterday, N days ago); stored timestamps remain Unix milliseconds.

An unfinished attempt retains `id`, `startedAt`, `updatedAt`, `completedAt: null`, `mode`, `feedbackMode`, `deadlineAt`, `finishReason`, `gradingRule`, `currentIndex`, and `answers`. Each answer has `questionId`, `optionIds`, `submittedAt`, and `correct`. New attempts shuffle the `answers` array and store each question's option IDs in `optionOrder`; resolve content by IDs, not source-array positions. Resuming preserves both orders and the hard-mode deadline. Legacy attempts without `optionOrder` retain source option order. Completed history does not retain presentation order.

`quiz.result` can read the complete just-finished result during the current page process. After refresh, the Node connection may retain a separately delivered completion receipt. In ordinary library reads, omitting `attemptId` returns each question's latest result; requesting a vanished attempt ID returns `QUIZ_ATTEMPT_NOT_FOUND`. An ongoing attempt returns `QUIZ_NOT_COMPLETED`; do not present earlier results as the current score.

## Independent questionnaire cache

Prefer `questionnaire.read` with this `questionnaireId`. Alternatively read the snapshot's top-level `questionnaire`, which is null if absent and excluded from practice snapshots. A questionnaire is not a QuizRecord in `backup.records` and has no `attempts`, `mode`, `gradingRule`, `correct`, or score history.

The cache is `{ schemaVersion: 1, id, questionnaire, createdAt, updatedAt, completedAt, currentIndex, answers }`. `questionnaire` is the original `gaga.questionnaire`; answers contain only `{ questionId, optionIds }`. Match `questionId` to questions and `optionIds` to option text. Non-null `completedAt` means the whole questionnaire was submitted; nonempty selections mean only that a question was answered. Submission retains the current cache for AI reading, without retakes or history. The next import replaces it, so do not repeatedly create a questionnaire to “restore” it.

The cache key is `gaga.web.questionnaire.current`, outside the quiz prefix and backup. Reads use the same Web Lock and copy data into memory only. The webpage migrates older questionnaires out of quiz storage, retaining only the latest responses; read-only snapshot compatibility conversion does not write to the browser.

## Analysis rules

- Verify this quiz's `quizId` / `attemptId`. For older sessions, read the matching completed history and its saved option IDs. If no history exists, analyze only `latestResult` and `answeredAt`; do not infer missing choices.
- Use questionnaire responses about goals, experience, difficulties, and time to choose a starting point. Do not score them or search for incorrect responses. The grading rules below apply only to `gaga.quiz`.
- `correct === false` is an incorrect grade. Separately mark `optionIds.length === 0` as unanswered. `correct === null` is ungraded and must not count as incorrect.
- Multiple choice uses `exact-set-v1`: the option set must match exactly, without partial credit. Use shared computed correctness for histories and saved grading for the active attempt.
- Questions and explanations come from imported material. If they are wrong, explain the discrepancy and generate a revised quiz. Reference answers are not unquestionable facts.

## Storage implementation

Web uses the `storage` object store in IndexedDB database `gaga-learning`. The ordinary prefix is `gaga.web.quiz.`, the current mixed-reference cache is `gaga.web.quiz.mix.`, and the Web Lock is named `gaga.web.quiz.`. Initial migration from localStorage removes old copies only after successful publication and retains originals on failure. Legacy `gaga.web.quiz.practice.` data with no reliable source mapping is preserved for separate export, not matched by title for writeback.

The active key stores a catalog-key string; the catalog's `entries` reference valid record keys. Commits write a new copy, then switch the active pointer. Enumerating every record key does not establish which records are active. The supplied scripts reuse consumer-core catalog, backup-validation, and migration logic, read only this site's quiz prefixes and independent questionnaire cache, and operate on memory copies. They do not depend on the browser's on-disk database format.

Medium and hard unfinished attempts allow answering out of order; `currentIndex` need not point to the first unsubmitted question. Nonempty `optionIds` indicate a selection. Editing an answer resets `submittedAt` to null, which does not mean unanswered. Final submission submits and grades all selections together; `correct` stays null before then.

The one-time starter quiz uses ordinary quiz and storage formats and supports normal answering, export, and deletion. Its initialization flag, `gaga.web.starter-quiz.initialized`, is outside the quiz record prefix and excluded from backups and read-only snapshots. Do not set or clear it or initialize the library on the webpage's behalf.

## Capacity notices and full storage

Web IndexedDB has no artificial library-size budget. Respect actual browser capacity and preserve committed data on write failure. The library explains that data stays in this browser without automatic synchronization. Do not delete data automatically to make an import succeed.

Backup v4 has no legacy 4 MiB total-file limit. Individual quiz content still obeys the 100-question and 256 KiB rules; those validate content rather than cap library capacity. Legacy mixed history may be exported separately. Regular backups include completed ordinary and mixed histories, plus latest results written back from mixed practice, but exclude questionnaires and unfinished mixed sessions.
