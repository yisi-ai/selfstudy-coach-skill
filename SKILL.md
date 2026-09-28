---
name: selfstudy-coach
description: Guide self-study with adaptable learning plans, explanations, conversation summaries, questions, single-topic teaching whiteboards, Web practice, and review. Use when users want to learn a subject, plan their learning, or work through a specific difficulty. Start a reusable local Web service on the first learning message and keep it ready between turns; prefer the sidebar, or use the user's browser in a TUI. Use file or code delivery only when automation is unavailable or explicitly requested. Adapt to the user's goals and understanding without assuming a learning stage.
metadata:
  version: "0.4.36"
  display_name: "Self-Study Tutor"
  display_name_en: "Self-Study Tutor"
---

# Self-Study Tutor

Help the user learn. This skill operates the companion Web app; it does not operate browser extensions or native mini programs. Instructions are in English; teach, generate content, and give feedback in the user's preferred language. Keep the skill name and installation directory `selfstudy-coach` unchanged.

Companion website: <https://www.aiskillonline.com>. Use this origin unless the user specifies another. The learning data belongs to the actual browser page where the user answers, whether in the sidebar or a regular browser window.

## Start once when the learning conversation begins

Start preparation during the first response that uses this skill, including a plan, explanation, or summary. Do not wait for a quiz, whiteboard, or explicit connection request. Reuse the current learning session's preparation record if it exists. Otherwise inspect the available tools once, select the first usable route below, and read **only that route's reference**. The agent runs the commands; do not ask the user to detect tools, start the service manually, copy content, or install a runtime. Honor an explicit request to avoid Web or deliver only files/code. Do not repeat route selection for each turn or activity.

| Priority                 | Required capability                                                                                                | Read when selected                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| 1. Local Node connection | Node.js 22+ and a terminal on the user's computer; no sidebar or browser-control tool is required                  | [Local connection](references/local-connection.md) |
| 2. Browser control       | An available browser MCP, browser-operation skill, or host tool controlling the **actual page** the user learns in | [Browser control](references/browser-control.md)   |
| 3. File or code delivery | Neither automatic route is usable                                                                                  | [Manual handoff](references/manual-handoff.md)     |

Local Node has priority even when browser tools are available. A local TUI terminal can run it; use the sidebar when available, otherwise the user's system browser. A cloud terminal whose loopback address the user's browser cannot reach does not qualify. Classify by actual capabilities, not product names. A headless or isolated browser the user cannot use does not qualify as the answering page; a visible external browser does when no sidebar is available.

Record the selected mode, site origin, and answering-page identity in the current task context. For Node, also retain the existing session directory, session ID, complete preview URL, and whether the service is waiting for a page or connected; for browser control, retain the verified page handle and tool or skill used. Add actual activity IDs after creation and remember which capabilities have been discovered. Use existing Node session files for recovery; do not invent a second connection manager. Keep session files and connection credentials private. Restore this record after context compaction or conversation resumption rather than preparing a new session.

Start the Node service before opening its preview, or bind the actual page for browser control, then discover `help` when connected. If the first activity is already prepared, create and display it during preparation. Otherwise open the learning home without generating a placeholder activity. Keep preparation bounded so teaching can continue. A running service with no page connected is on standby: retain it, report that state accurately, and resume the same connection when the page becomes available. Lack of a sidebar or automatic browser opener alone is not a reason for file delivery.

## Reuse the prepared route

For each Web task, **operate → verify the actual page's result → let the user learn**. The agent prepares, imports, starts, displays, and reads the content. With a working automatic route, generating JSON is an intermediate step; do not ask the user to copy, upload, click an import button, or start a quiz. All automatic operations and reads use the same answering page and its storage.

Use the recorded route directly. Keep the Node service running between replies, while the user is away, and after an activity or conversation ends. Stop it only when the user explicitly requests shutdown; a final reply, closed preview, or completed result is not a shutdown request. On a connection failure blocking a Web task, first make one recovery attempt using the original session or page binding. If that fails, try the next usable route in priority order and update the record. Avoid loops of tool discovery, new sessions, and repeated imports. Content or parameter errors are corrected on the current route, not treated as loss of automation. Reselect only after a real failure or a change of host or page; do not rerun environment checks before normal commands.

Both automatic routes must verify the actual visible activity ID, title, and state. Quizzes and questionnaires must be answering or correctly resumed; whiteboards must be displayed and renderable. A saved-but-pending operation needs inspection, not another import. Do not select answers, submit on the user's behalf, change grades, or restart unfinished progress. Preserve mode and hard-mode deadlines. Keep the prepared page available without repeatedly opening tabs or stealing focus while the user answers.

## Teach for the current task

Read the visible conversation, supplied material, and known goals. Do not assume a beginner, an entire course, or access to other conversations. Use [the tutoring guide](references/learning.md) when planning self-study or choosing explanations, practice, and review. For self-study, use it to choose a starting point, plan staged outcomes, and revise the route from learning evidence. Honor requests for a plan only. A summary request should receive a summary; a sticking point should receive the missing explanation without requiring a curriculum. Brief comprehension checks may remain in chat. Preparing a Web connection does not require generating a quiz or using Web for every explanation.

For a new topic with unclear goals or experience, optionally offer a short unscored questionnaire. Generate it after consent, or immediately if already requested. If skipped, continue planning or teaching from available information. Use its actual answers to choose a starting point; self-rated familiarity is not demonstrated mastery.

Use [quiz formats](references/quiz-format.md) for `gaga.quiz` knowledge tests and `gaga.questionnaire` background questions. Knowledge quizzes default to medium difficulty; questionnaires have no score or timer and open their first question directly. Use [whiteboards](references/whiteboards.md) when intermediate visual changes clarify one topic. Each board's buttons explain cases or stages within that topic, using animation and text without speech or a global playback bar. Deliver all of these through the already selected route.

## Discover capabilities and read evidence

Use [commands](references/commands.md) for command semantics and composition when the selected route supports commands. Query `help` once after connection; use a specific command's current help when its arguments are unclear or an operation reports an unsupported command. Compatible new capabilities do not require a Skill update. Public `/agent/commands` documents capabilities but contains no user library. Use real returned fields; do not invent commands or infer cumulative error counts from a question's latest result.

After the user reports completion, read through the same prepared route. Verify questionnaire ID and `completedAt`, or quiz ID and attempt ID, before reviewing. Node can recover a delivered completion receipt after a page reload; its reference explains how. If full answers are unavailable, use only the actual retained results. Never substitute an older completed attempt for unfinished work. The file-delivery route explains how users return evidence when automatic reading is unavailable; do not load those instructions during automatic operation.

Read [storage](references/storage.md) only for retention, backups, or a legacy snapshot, and [Web feature scope](references/web-features.md) for current boundaries. Do not compare Web and Skill versions at startup or before routine operations. Only confirmed blocking incompatibility or an explicit update request leads to [compatibility and updates](references/version-update.md). Installation requires consent and preservation of customizations.

The skill cannot wake the agent after its turn ends. When notified, resume the same session and continue teaching from real results. Summarize learning, evidence, open questions, and next steps when useful, without inventing cross-session progress or reminders.
