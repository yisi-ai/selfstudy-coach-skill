# Web command semantics

## Capability discovery and composition

Query `{ "command": "help" }` once after connecting. It describes command names, parameters, results, examples, and `write` flags. For a specific operation, use `{ "command": "help", "args": { "command": "question.search" } }`, or the full list if individual lookup is unavailable. Public `/agent/commands` provides capability documentation without user data or execution.

Current help and returned fields define available operations, including compatible additions absent from this skill. Prefer available filters and pagination, then combine actual results. For example, `latestResult` and `answeredAt` identify a question's latest grade and time; cumulative mistake counts require real history or statistics.

## Requests and results

A request is `{ command, args?, requestId? }`. Each independent write needs a new nonempty request ID of at most 128 characters. Retry the same operation with its original ID and arguments; changed arguments return `REQUEST_ID_CONFLICT`. Read-only calls normally omit the ID to obtain fresh data.

Success is `{ ok: true, command, data }`; failure is `{ ok: false, command, error: { code, message, path? } }`. Preserve returned activity IDs and URLs. The learner selects and submits answers; the host computes grades.

| Learning action              | Basic operation                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| Create a quiz                | `quiz.import` with `{ quiz, mode? }`; defaults to medium and opens the first question. |
| Resume a quiz                | `quiz.open` / `quiz.start`; preserve unfinished progress, mode, and deadlines.         |
| Create a questionnaire       | `questionnaire.import` with `{ questionnaire }`; opens the first question.             |
| Read questionnaire responses | `questionnaire.read` with `{ questionnaireId }`; verify `completedAt`.                 |
| Read quiz results            | `quiz.result` with `{ quizId, attemptId? }`; verify the matching completion.           |
| Explain with animation       | `whiteboard.help`, then import/read/update/present using its current contract.         |
| Find material or mistakes    | Discover search and read operations and combine their returned fields.                 |

Node retains write receipts across refreshes. Direct page evaluation deduplicates only within the current page process; after reload, inspect the saved operation before retrying a write.

## Interpret the actual state

| State or error                            | Action                                                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `running`                                 | Quiz/questionnaire answering or whiteboard playback is underway.                                                                                          |
| `ready`                                   | Start a requested quiz with `quiz.start`; a whiteboard or the learning home may already be ready to use.                                                  |
| `completed`                               | Read the matching quiz/questionnaire result; whiteboard completion indicates playback only.                                                               |
| `pending` or `navigationRequested: false` | Inspect the same page: saving may have succeeded. Node keeps its outer preview URL; browser control may open the returned activity URL in its bound page. |
| `QUIZ_NOT_COMPLETED`                      | Retain the unfinished attempt and wait for the learner.                                                                                                   |
| Missing activity                          | Confirm page, origin, and record. A replaced questionnaire is outside quiz history.                                                                       |
| `COMMAND_BRIDGE_UNAVAILABLE`              | Check page initialization and follow the prepared route's recovery instructions. Browser control may use available UI tools.                              |
| Content/argument error                    | Correct the reported `code`, `message`, and `path`, consulting current help as needed.                                                                    |

Read [storage](storage.md) when the task needs retention details, older history, or backups.
