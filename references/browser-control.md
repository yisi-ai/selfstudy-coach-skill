# Browser control of the answering page

Use the selected browser MCP, browser-operation skill, or host page tool through its actual interface.

## Bind the visible page

Open the selected companion origin's `/app` in the user's sidebar or visible browser. Bind to that exact page through a page handle or verified target mapping. Another browser at the same URL may have different storage.

Record the page handle, origin, and tool, and reuse them for imports, navigation, and reads. Rebind when the page is recreated or the tool loses its target.

## Operate and display

With page JavaScript, execute the entire supplied `scripts/command.js` function in the bound page, passing `{ origin, request }`. Include the exact scheme and port. If the tool accepts only function text, construct `"async () => await (" + scriptSource.trim() + ")(" + JSON.stringify(options) + ")"`. Structured arguments or this JSON-serialized wrapper keep activity content separate from executable code. Execution occurs in the browser, even if a terminal prepares the wrapper.

Discover `help`, send the complete activity through its command, and let the page navigate. The supplied function also checks navigation state; [command semantics](commands.md) describes results and retries.

With UI-only tools, open `/app/import` in the same page and use file upload or the clipboard import control. Read current controls from a fresh snapshot. The agent performs the import and navigation.

Verify the prepared activity:

- Quiz: matching ID/title and visible `#quiz-run`. Start a ready quiz in medium unless another mode was requested; preserve an unfinished attempt's mode and progress.
- Questionnaire: matching ID/title and visible `#questionnaire-run`; import opens the first question directly.
- Whiteboard: matching ID/title/segment, explanatory text, and a renderable canvas.

Inspect a saved-but-pending operation in the same page before another import. Keep the resulting activity visible for the learner to answer.

## Read and recover

Read completed results through page commands or inspect visible result details with UI tools. Match activity/attempt IDs and completion before reviewing. Read whiteboard marks to find unclear steps.

If the target is lost, restore the original page once and inspect its current content. Page-command deduplication lasts only within one page process, so check existing data after reload before retrying a write with the original ID and arguments. Confirm origin and record when expected content is missing.

Correct validation errors through the same commands or controls. If the actual answering page remains unavailable, preserve the session details and follow SKILL.md's next route.

For an older page without command-based snapshot reads, execute `scripts/read-snapshot.js` through the same page tool with `{ origin, release: { version: <Skill metadata.version> }, practice: false }`. This read-only fallback is interpreted using [storage](storage.md).
