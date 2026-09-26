# Web feature scope

This reference describes the companion Web app. Use the operation route already prepared in SKILL.md; this is not another host-selection guide. Current `help` and actual page behavior define available compatible capabilities.

## Learning activities

- Knowledge quizzes: single and multiple choice, reference answers and explanations, formulas, parameterized geometry, HTTPS images, three difficulty modes, and saved unfinished progress.
- Background questionnaires: unscored single and multiple choice, one current questionnaire and its answers, no timer, quiz-library entry, or quiz backup. The next import replaces the current cache.
- Teaching whiteboards: one topic, independent buttons for cases or stages, intermediate animation and explanatory text. Web saves boards locally; the **Whiteboards** navigation opens `/app/whiteboards`, where **Add whiteboard** opens the universal importer at `/app/open`. No voice narration, global progress slider, or inclusion in quiz backups.
- Review: completed test histories with saved selections, current results, per-question latest correctness/time, library searches and backups. Retention details are in [storage](storage.md); do not infer unrecorded history or cumulative counts.

The user chooses all answers. Quiz commands default to medium and open the first question; questionnaires also open their first question directly. A whiteboard demonstration ending is not an assessment. Flashcards and free-response Web exercises are not implemented; short recall questions may remain in the conversation.

Easy mode gives feedback after each submitted answer and locks it. Medium gives feedback at completion. Hard has a fixed total limit of question count × 30 seconds and submits at its deadline. Medium and Hard allow changing selections and navigating through numbered question controls before submission; resumption and refresh never extend the hard-mode deadline.

## Pages and storage

`/app` is the learning home; random practice chooses an existing quiz and mixed practice combines up to 20 questions with source-result writeback. `/app/library` manages local quizzes. `/app/open` is the universal **Import learning content** page: **Read clipboard** and **Upload file** identify existing AI content as a quiz, questionnaire or whiteboard; `/app/import` remains a separate prompt-generation/legacy import page. Use the selected route to operate these pages; merely opening an import page does not complete an automatic handoff.

The library can back up and restore quizzes. It retains compact completed test histories, each question's latest correctness/time and unfinished progress. Completed mixed tests are stored once in the ordinary backup and linked to every contributing source quiz; `practice: true` addresses only the active mixed session. History details show all questions and correctness, marking those from the current source quiz. Deletion and restarting require the user's intent; preserving progress is the default.

Web uses browser-local IndexedDB, with no account or automatic cross-device synchronization. Different sidebar/browser storage contexts may have different libraries even at the same origin. Normal page resources load from the website; learning commands and the Node connection do not upload library data to its backend. The local connection retains delivered completion receipts independently of ordinary quiz history.

The English and Chinese UI adapts to narrow right-side panels without changing the browser identity or URLs. Direct activity URLs enter the requested feature. Home-page onboarding and the optional starter quiz are not substitutes for requested content; verify the actual activity's ID and title.

## Discovery and maintenance

Commands and compatible additions are discovered through `help` or public `/agent/commands`, not a fixed list in this file. Whiteboard format documentation is also available at `/agent/whiteboard`. Public metadata has no access to the user's saved content.

Do not compare Web and Skill versions at startup. Diagnose connection, parameter, and data errors first; [update guidance](version-update.md) applies only to confirmed incompatible basics or explicit requests. Skill source and tools live in `apps/web/skills/selfstudy-coach/`. Follow [maintenance rules](../MAINTAINING.md) when changing connection basics, teaching principles, or host support.
