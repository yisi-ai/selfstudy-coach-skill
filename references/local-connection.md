# Local Node service and browser connection

The bundled `scripts/study-bridge.mjs` transports learning commands and results between the agent and the user's browser. Learning data stays with the answering page; the connection uses local loopback without a website-backend relay. Use `questionnaire-bridge.mjs` only to continue an existing 0.4.16 session.

## Prepare a new session

Follow SKILL.md's route selection and session lifetime. If `node` is missing, check an already exposed host runtime once; an unavailable local runtime selects the next usable route.

```bash
node "<skill-directory>/scripts/study-bridge.mjs" start --origin "https://www.aiskillonline.com" --output "<session-parent>/study-session" --locale en
```

Use the selected companion origin and supported language (`en` or `zh-CN`). `--output` names a new directory under an existing writable parent that remains available across turns. The command starts a detached background service and returns. If an activity is already prepared, append `--request "<request.json>"` to queue it; otherwise the preview opens the learning home.

On startup failure, inspect `bridge.log`. `listen EPERM` or `EACCES` can indicate sandbox restrictions. Use the host's normal approval mechanism for loopback listening, then `resume <directory>` on the existing session. If permission is unavailable, report the limitation and use the next route.

Retain the returned `directory`, `sessionId`, and complete `previewUrl`, including its fragment. Keep session files and credentials private. Open the URL using:

- The sidebar's preview tool when available; WorkBuddy uses `present_files`.
- An available system-browser launcher in a local TUI, such as `open`, `xdg-open`, PowerShell `Start-Process`, or the existing WSL launcher. Quote the complete URL as one argument.
- The full preview link given to the user when automatic opening is unavailable; the service remains on standby.

Check readiness:

```bash
node "<skill-directory>/scripts/study-bridge.mjs" status "<directory>"
```

Allow a short readiness wait, roughly 20 seconds. `connected: true` confirms a recent page receipt; a responsive service with `connected: false` is on standby. Continue teaching while waiting and defer page commands until connected. With a queued activity, verify its matching ID, title, and state as described in SKILL.md.

Keep the outer browser or sidebar at the complete preview URL; commands navigate the embedded learning page. Preserve the same browser profile and storage. If the host requires display as its final tool call, display that same URL after verification. The newest preview owns the connection.

## Call through the existing session

Write a request JSON file, then run:

```bash
node "<skill-directory>/scripts/study-bridge.mjs" call "<directory>" "<request.json>"
```

For discovery, the file is `{ "command": "help" }`. Subsequent calls use the current command's documented arguments and the request-ID rules in [command semantics](commands.md). Import requests contain the complete activity document.

Use `call` directly for later activities. Both `call` and `status` recover a stopped listener on its original port and briefly wait for the existing preview. After displaying content, inspect `status` for the actual visible activity. Saved-but-pending operations need inspection before another write.

A closed page leaves the listener on standby. After a stopped process or machine restart, `resume`, `status`, or `call` restores the saved session when the agent next runs. `stop <directory>` is reserved for an explicit service-shutdown request.

## Read results and recover

Read current questionnaire answers with `questionnaire.read`, quiz answers with `quiz.result`, and whiteboard marks with `whiteboard.read`. Match the activity and completion before reviewing.

Current whiteboard commands, activity status, and retained completion receipts cover 2D boards only. For a [3D board](whiteboards-3d.md), keep the Node session on standby and use available browser tools on the same answering browser's unified Import page; verify its scene and read visible or copied feedback. If browser control is unavailable, use [manual handoff](manual-handoff.md) for that activity. Do not interpret Node status or a missing 3D receipt as proof of viewing completion. Discover help again before using any later-added automatic 3D operation.

The page can save answers while disconnected. Its completion outbox retries until the service writes `completions.json` and acknowledges delivery. These receipts remain available after refresh, separately from ordinary quiz history.

| CLI operation or state         | Meaning and action                                                                                                                                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read <directory> [receiptId]` | Returns a completion snapshot with `active`, `payload`, `receivedAt`, and `live: false`. Without an ID, reads only the current activity. After reload/navigation, use the matching ID from `status.completedResults`. Verify activity/attempt IDs. |
| `resume <directory>`           | Restores the original session and returns its complete preview URL.                                                                                                                                                                                |
| `PAGE_NOT_CONNECTED`           | No page receipt arrived within 60 seconds. Restore the same preview, resume the listener if needed, and retry once.                                                                                                                                |
| `COMMAND_PENDING`              | Await or retry the original request; its result has not arrived.                                                                                                                                                                                   |
| `COMMAND_OUTCOME_UNKNOWN`      | A write may have committed. Inspect the actual library/current activity before retrying.                                                                                                                                                           |
| `REQUEST_ID_CONFLICT`          | Recover the original arguments; a changed independent operation needs a new ID.                                                                                                                                                                    |
| `PAGE_REPLACED`                | A newer preview owns the connection; use that page.                                                                                                                                                                                                |

A retained receipt proves delivery, not current connectivity. Preserve session and operation details if recovery fails, then follow SKILL.md's bounded fallback. Validation errors are corrected on the current route.
