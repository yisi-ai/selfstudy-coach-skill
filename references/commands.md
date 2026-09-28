# Web command semantics

Use commands through the route already prepared in SKILL.md. This reference explains the common protocol; it does not select another execution mode or require a Node-connected agent to acquire browser tools.

## Capability discovery and composition

Query `{ "command": "help" }` once after connection. The response describes command names, parameters, results, examples, and `write` flags. For an unfamiliar or failed operation, request `{ "command": "help", "args": { "command": "question.search" } }`, or use the full list if individual lookup is unavailable. Refresh discovery after a real capability change; do not repeat environment selection or check versions on normal calls.

Public `/agent/commands` provides the same capability documentation without user data or execution. Prefer the connected page's help for actual operations. Compatible new commands can be called through the existing channel even when absent from this skill. Current results and descriptions take precedence over old examples.

Prefer Web filters, then combine or filter actual returned data. Follow pagination when needed. For example, an incorrect-answer search and `answeredAt` can locate questions last marked wrong before a date. A cumulative wrong-answer count requires real returned statistics or sufficient history; it cannot be inferred from `latestResult`. Capability documentation does not authorize answering for the user, changing grades, or deleting data.

## Requests and results

A request is `{ command, args?, requestId? }`. Each independent write requires a new nonempty request ID of at most 128 characters; retry the same operation with the original ID and arguments. Read-only requests normally omit it. Reusing an explicit ID can return its old receipt instead of current data. Changed arguments under the same ID return `REQUEST_ID_CONFLICT`.

Success is `{ ok: true, command, data }`; failure is `{ ok: false, command, error: { code, message, path? } }`. Preserve returned IDs and URLs. Never derive quiz IDs from titles, fabricate successful URLs, or write storage directly.

| Learning action                   | Basic operation                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Create a knowledge quiz           | `quiz.import` with `{ quiz, mode? }`; medium by default; opens the first question                |
| Open or resume a saved quiz       | `quiz.open` / `quiz.start`; preserve unfinished progress, mode, and deadlines                    |
| Create a background questionnaire | `questionnaire.import` with `{ questionnaire }`; opens the first question without a start action |
| Read questionnaire responses      | `questionnaire.read` with `{ questionnaireId }`; verify `completedAt`                            |
| Read quiz results                 | `quiz.result` with `{ quizId, attemptId? }`; verify current completion                           |
| Explain with a whiteboard         | Discover `whiteboard.help`, then import/open/update/present using its current contract           |
| Find material and mistakes        | Discover search and read operations and combine their actual returned fields                     |

Questionnaires have a single independent cache, no difficulty, timer, score, library entry, or quiz backup. A new questionnaire replaces the current cache. Knowledge quizzes use easy, medium, or hard mode. See [storage semantics](storage.md) only when retention or backups matter.

Send requests through the already prepared route. The Node connection retains write receipts across refreshes. Direct page evaluation deduplicates within the current page process; after a reload, inspect the existing operation's result before resending it.

## Interpret the actual state

- `running`: A quiz/questionnaire is answering or resumed; a whiteboard segment is demonstrating. Let the user answer.
- `ready`: For a quiz, start with `quiz.start` if practice was requested; for a whiteboard, it is displayed and ready to demonstrate. A prepared home page may also be ready before an activity exists.
- `completed`: Read the matching quiz/questionnaire result; a completed whiteboard segment is not a grade or proof of understanding.
- `pending` or `navigationRequested: false`: The save may have succeeded. Inspect the same answering page without reimporting. Node keeps the outer preview URL and navigates through commands; direct browser control may open the returned real URL in the bound page.
- `QUIZ_NOT_COMPLETED`: Keep the current unfinished attempt; do not substitute old scores.
- Missing quiz/questionnaire: Confirm the answering page, origin, and actual record. A replaced questionnaire is not in quiz history. Do not silently recreate missing content as a recovery step.
- `COMMAND_BRIDGE_UNAVAILABLE`: Check that the prepared page has initialized. Browser control may use its available UI tools; Node follows its connection recovery. Follow SKILL.md's route order only when the current route actually fails.
- Content/argument errors: Correct the indicated `code`, `message`, and `path` on the existing route, consulting current help as needed.

Read only data needed for the learning task. Do not compare `skillOperationVersion` or `protocolVersion` during routine calls. Use [compatibility diagnosis](version-update.md) only for confirmed blocking incompatibility or an explicit user request.
