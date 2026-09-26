# Local Node connection to the right sidebar

This is the preferred route. It requires Node.js 22+ on the user's computer and a host tool that displays a real interactive webpage in the right sidebar. Browser evaluation, click tools, CDP, and browser MCP configuration are unnecessary. A cloud container's terminal or loopback URL does not qualify. If `node` is absent, check an already exposed host runtime once; do not ask the learner to install one or repeatedly search the machine.

The self-contained `scripts/study-bridge.mjs` handles all questionnaires, quizzes, whiteboards, searches, and result reads through one connection. The webpage holds the learning data; this local service transports commands and receipts without a website-backend relay. The legacy `questionnaire-bridge.mjs` is only for existing 0.4.16 sessions.

## Prepare the session once

If the current task record already names a session directory, reuse it. Do not run `start` again for later topics or activities.

For a new session, run:

```bash
node "<skill-directory>/scripts/study-bridge.mjs" start --origin "https://www.aiskillonline.com" --output "<session-parent>/study-session" --locale en
```

Use the installed skill's companion origin and the user's supported language (`en` or `zh-CN`). `--output` names a new directory under an existing parent. When the first activity is already prepared, append `--request "<request.json>"` to queue that initial operation before opening the panel. Otherwise omit it: the connection opens the learning home without importing placeholder content. Do not automatically switch between local and production origins.

Retain the returned `directory`, `previewUrl`, and `sessionId` in the task record. Pass the **complete `previewUrl`** to the host's right-sidebar preview tool; WorkBuddy uses `present_files`. Then run:

```bash
node "<skill-directory>/scripts/study-bridge.mjs" status "<directory>"
```

Allow a short readiness wait, up to roughly 20 seconds. `connected: true` confirms a recent receipt from the actual embedded page. With no activity yet, a ready learning home is sufficient for preparation. With a queued activity, verify its matching ID and title: questionnaires/quizzes must be `running`; whiteboards may be `ready`, `running`, or `completed` depending on the selected segment. Opening the preview alone does not establish readiness.

The right panel must stay on this connection's `previewUrl`. Do not replace it with an internal activity URL or use an external browser. If the host requires its display tool to be the final tool call, display the **same preview URL** again after verification. The newest preview acquires the connection; use that panel rather than reclaiming it from an older one. Keep `session.json` and its token local; do not attach them to the conversation.

After connection, query `help` once through `call` below and retain the relevant capabilities with the prepared session. No Skill/Web version comparison is needed. If the right panel cannot load this connection after one recovery attempt, return to SKILL.md's next route rather than asking the user to copy content.

## Operate through the same connection

Write the request to a local JSON file and call it:

```bash
node "<skill-directory>/scripts/study-bridge.mjs" call "<directory>" "<request.json>"
```

For discovery the file contains `{ "command": "help" }`. A basic quiz import looks like this; replace `quiz` with the complete document:

```json
{
  "command": "quiz.import",
  "requestId": "lesson-1",
  "args": { "quiz": {}, "mode": "medium" }
}
```

Questionnaires use `questionnaire.import` with `{ "questionnaire": <document> }`; whiteboards use the current `whiteboard.import` contract. Use [command semantics](commands.md) for discovery, result fields, and combining operations. New capabilities are sent through this same `call`; do not rewrite scripts for each command. A new write gets a new `requestId`; retries keep the original ID and arguments. Read-only calls normally omit `requestId` so they retrieve current data.

For later actions, call the existing session directly. `status` and `call` automatically restart a stopped listener on its original port and briefly wait for the existing preview. Do not add a separate environment check or reconnection before every command. After operations that display new content, inspect `status` to verify the visible activity and answering or rendering state. A saved-but-pending operation needs page inspection, not another import. All preparation and navigation are the agent's job; the user only learns and answers.

The service has no fixed expiry. Leave it running while the user is away and during later learning tasks. End it with `stop <directory>` only when the learning session explicitly ends. Do not close the panel or service merely because the agent is waiting or has read one result.

## Read results and resume

After the user reports completion, use the same `call` for `questionnaire.read` with its ID or `quiz.result` with quiz and attempt IDs. Check actual completion before analysis; unfinished work must not be replaced with an older result. Do not select answers, submit for the user, or change grades.

The Web page can continue accepting and saving answers while disconnected. Completed answers are saved in its outbox with the final answer transaction. It retries delivery until the local service writes `completions.json` and acknowledges receipt. Only then is that outbox item removed. Local completion receipts remain available for Agent reads after refresh, separately from the quiz library's latest per-question results.

- `read <directory> [receiptId]`: Return a completed snapshot with `active`, `payload`, `receivedAt`, and `live: false`. Without a receipt ID it selects only the current activity. After a reload or navigation, inspect `status.completedResults` and pass the matching receipt ID explicitly. Verify quiz/attempt or questionnaire IDs; this is a delivered snapshot, not evidence of current connectivity.
- `resume <directory>`: Restore the original connection and return its original preview URL. Normally `status` and `call` already recover a stopped service. Use explicit resume when the display address is needed again.
- `PAGE_NOT_CONNECTED`: No page receipt arrived within 60 seconds. Bring back the same right-sidebar preview and retry the existing operation once. If necessary, resume the same directory first. A webpage cannot start a stopped Node process itself. The CLI does not replace a slow listener or one that rejects authentication.
- `COMMAND_PENDING`: The result has not arrived. Retry with the original request ID; do not issue another import.
- `COMMAND_OUTCOME_UNKNOWN`: A write may have committed before its receipt was saved. Read the actual library/current questionnaire before any retry. Do not clear receipts or generate another write ID blindly.
- `REQUEST_ID_CONFLICT`: Different arguments reused an ID. Recover the original operation; a changed independent operation needs its own ID.
- `PAGE_REPLACED`: A newer preview owns the connection. Use the latest right panel.
- Missing activity: Check the current ID and stored data. Reconnection does not justify recreating a deleted quiz or replacing a newer questionnaire.

Returning to the foreground triggers immediate reporting. Hard-mode quiz deadlines keep their existing rules. If recovery genuinely fails, preserve the session and operation details, return to SKILL.md, and select the next usable route once. A content-validation error stays on this route and is corrected using the current command's help.
