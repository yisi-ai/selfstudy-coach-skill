# Browser control in the right sidebar

Read this only when local Node cannot provide the right-sidebar connection and this route was selected in SKILL.md. Use an available browser MCP, browser-operation skill, or host page tool. Follow that tool or skill's actual interface; no particular provider, tool name, port, or browser package is required. Do not install or configure another browser merely to run this workflow.

## Bind once

Open the companion site's `/app` in the user's right sidebar and bind the tool to that exact page. Use the host's page handle, explicit current-panel context, or a verified mapping between the sidebar and browser target. The same URL or title in a different browser does not prove control. If the available tools control only a separate external or invisible browser, this route is unavailable; return to the selection rule in SKILL.md.

Record the page handle, origin, and browser tool or skill in the current session. Reuse them for import, navigation, demonstration, and reads. Rebind only if the right panel is recreated or the tool reports that the target is gone. Do not give an activity URL from another browser to the sidebar: that does not transfer its local library.

## Operate and display

If the tool can evaluate JavaScript in the bound page, use `scripts/command.js` and [command semantics](commands.md). Read its entire function and pass `{ origin, request }` with the exact site origin, including scheme and port. If only function text is supported, use `"async () => await (" + scriptSource.trim() + ")(" + JSON.stringify(options) + ")"`; the terminal may construct this text, but execution happens in the bound page. The supplied function verifies navigation state in addition to performing the command. Discover `help`, import the full content, and let the page navigate to the actual activity. Use structured arguments, or a trusted function wrapper with JSON-serialized parameters; never interpolate raw content as executable code.

Without page JavaScript, use the available clicking, input, and file-upload tools yourself. For new AI content, open `/app/open` in the same sidebar, upload the generated JSON file, or write the complete JSON to the clipboard if the browser tool supports it and click **Read clipboard**. The agent performs these actions; the user does not copy or paste. Read current controls through a fresh page snapshot rather than assuming fixed positions or reusing stale element IDs. The page validates the document, identifies its format, and opens the activity. If a task cannot be completed with the exposed controls, diagnose that actual limitation before changing routes.

A prepared handoff requires:

- Quiz: matching ID and title, with `#quiz-run` visible. If a ready page appears, choose medium unless another difficulty was requested, then start it yourself. Preserve an existing unfinished attempt and its mode.
- Questionnaire: matching ID and title, with `#questionnaire-run` visible. There is no extra start action.
- Whiteboard: matching ID, title and segment, with the canvas ready or demonstrating. Use the board's buttons or current commands for the requested demonstration.

Successful imports, tool clicks, and opened URLs alone do not establish these states. Inspect a saved-but-pending activity in the same sidebar; do not import it again. Keep the resulting right-side page visible. The user chooses and submits answers; the agent never does that on their behalf.

## Read and recover

After the user reports completion, read current results through the same page commands. With UI-only tools, inspect the visible completed answers or result details yourself. Do not ask for copied results when the tool can read them. Verify activity and attempt IDs and actual completion. An unfinished quiz is not a completed result, and a whiteboard animation ending is not evidence of mastery.

If the page target is lost, restore or rebind the original right panel once and inspect its current content. After a page reload, check existing data before retrying a write: direct page-command deduplication lasts only for the current page process. Retain the original request ID and content for a retry; do not use a new import as reconnection. If the expected resource is absent, confirm the correct panel and origin before acting. A deleted quiz or replaced questionnaire must not be silently recreated.

Content validation errors stay on this route: inspect the error, correct the content, and use the actual command or controls. If the sidebar genuinely cannot be controlled after recovery, record that failure and return to SKILL.md's next route. Do not cycle through unrelated browsers or claim that an external browser's success means the right panel is ready.

If an older page lacks command-based snapshot reads, `scripts/read-snapshot.js` can run through the same verified page-evaluation tool with `{ origin, release: { version: <Skill metadata.version> }, practice: false }`. This is a read-only fallback, not a version comparison. Use [storage](storage.md) to interpret the returned data; prefer focused commands when available.
