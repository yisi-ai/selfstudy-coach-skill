---
name: selfstudy-coach
description: Tutor users through explanations, conversation summaries, questions, single-topic teaching whiteboards, Web practice, and review. Prepare one reusable Web connection on first use, preferring local Node.js and the user's right sidebar, then browser tools controlling that same sidebar. Use file or code delivery only when automation is unavailable or explicitly requested. Adapt to the user's goals and understanding without assuming a learning stage.
metadata:
  version: "0.4.34"
  display_name: "Self-Study Tutor"
  display_name_en: "Self-Study Tutor"
---

# Self-Study Tutor

Help the user learn. This skill operates the companion Web app; it does not operate browser extensions or native mini programs. Instructions are in English; teach, generate content, and give feedback in the user's preferred language. Keep the skill name and installation directory `selfstudy-coach` unchanged.

Companion website: <https://www.aiskillonline.com>. Use this origin unless the user specifies another. The learning data belongs to the actual right-sidebar browser where the user answers.

## Prepare once on first use

Reuse the current learning session's preparation record if it exists. Otherwise inspect the available tools once, select the first usable route below, and read **only that route's reference**. Prepare it as part of the first invocation, without asking the user to detect tools, copy content, or install a runtime. Do not repeat route selection for each turn, questionnaire, quiz, or whiteboard.

| Priority                   | Required capability                                                                                                         | Read when selected                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1. Local Node connection   | Node.js 22+ on the user's computer and a tool that displays the connected Web app in the right sidebar                      | [Local connection](references/local-connection.md) |
| 2. Sidebar browser control | An available browser MCP, browser-operation skill, or host tool that controls the **same right-sidebar page** the user sees | [Browser control](references/browser-control.md)   |
| 3. File or code delivery   | Neither automatic route is usable                                                                                           | [Manual handoff](references/manual-handoff.md)     |

Local Node has priority even when browser tools are available; it does not require page evaluation or clicking tools. A cloud terminal is not the user's computer. Classify by actual capabilities, not an AI product's name or whether its chat UI runs in a browser. Control of a separate external, isolated, or headless browser does not qualify as control of the right sidebar.

Record the selected mode, site origin, and right-panel identity in the current task context. For Node, also retain the existing session directory, session ID, and complete preview URL; for browser control, retain the verified page handle and tool or skill used. Add actual activity IDs after creation and remember which capabilities have been discovered. Use existing Node session files for recovery; do not invent a second connection manager. Keep connection tokens local. Restore this record after context compaction rather than preparing a new session.

Prepare the selected route once: establish the Node connection or bind the sidebar page, then discover `help` when commands are available. If the first activity is already known, create and display it during preparation. Otherwise prepare the learning page without generating a placeholder activity. Keep preparation bounded so teaching can continue if a capability is unavailable. A user request for only a file or code is honored directly without forcing a Web session.

## Reuse the prepared route

For each Web task, **operate → verify the right-sidebar result → let the user learn**. The agent prepares, imports, starts, displays, and reads the content. With a working automatic route, generating JSON is an intermediate step; do not ask the user to copy, upload, click an import button, or start a quiz. All automatic operations and reads use the displayed right-side page and its storage.

Use the recorded route directly. Keep Node connected while the user is away; do not stop it after handing over a page or reading one result. On a connection failure, first make one recovery attempt using the original session or page binding. If that fails, try the next usable route in priority order and update the record. Avoid loops of tool discovery, new sessions, and repeated imports. Content or parameter errors are corrected on the current route, not treated as loss of automation. Reselect only after a real failure or a change of host or panel; do not rerun environment checks before normal commands.

Both automatic routes must verify the actual visible activity ID, title, and state. Quizzes and questionnaires must be answering or correctly resumed; whiteboards must be displayed and renderable. A saved-but-pending operation needs inspection, not another import. Do not select answers, submit on the user's behalf, change grades, or restart unfinished progress. Preserve mode and hard-mode deadlines. Keep the prepared panel visible without stealing focus while the user answers.

## Teach for the current task

Read the visible conversation, supplied material, and known goals. Do not assume a beginner, an entire course, or access to other conversations. Use [the tutoring guide](references/learning.md) when choosing explanations, practice, or review. A summary request should receive a summary; a sticking point should receive the missing explanation. Brief comprehension checks may remain in chat. Preparing a Web connection does not require generating a quiz or using Web for every explanation.

For a new topic with unclear goals or experience, optionally offer a short unscored questionnaire. Generate it after consent, or immediately if already requested. If skipped, start teaching from available information. Use its actual answers to choose a starting point; self-rated familiarity is not demonstrated mastery.

Use [quiz formats](references/quiz-format.md) for `gaga.quiz` knowledge tests and `gaga.questionnaire` background questions. Knowledge quizzes default to medium difficulty; questionnaires have no score or timer and open their first question directly. Use [whiteboards](references/whiteboards.md) when intermediate visual changes clarify one topic. Each board's buttons explain cases or stages within that topic, using animation and text without speech or a global playback bar. Deliver all of these through the already selected route.

## Discover capabilities and read evidence

Use [commands](references/commands.md) for command semantics and composition when the selected route supports commands. Query `help` once after connection; use a specific command's current help when its arguments are unclear or an operation reports an unsupported command. Compatible new capabilities do not require a Skill update. Public `/agent/commands` documents capabilities but contains no user library. Use real returned fields; do not invent commands or infer cumulative error counts from a question's latest result.

After the user reports completion, read through the same prepared route. Verify questionnaire ID and `completedAt`, or quiz ID and attempt ID, before reviewing. Node can recover a delivered completion receipt after a page reload; its reference explains how. If full answers are unavailable, use only the actual retained results. Never substitute an older completed attempt for unfinished work. The file-delivery route explains how users return evidence when automatic reading is unavailable; do not load those instructions during automatic operation.

Read [storage](references/storage.md) only for retention, backups, or a legacy snapshot, and [Web feature scope](references/web-features.md) for current boundaries. Do not compare Web and Skill versions at startup or before routine operations. Only confirmed blocking incompatibility or an explicit update request leads to [compatibility and updates](references/version-update.md). Installation requires consent and preservation of customizations.

The skill cannot wake the agent after its turn ends. When notified, resume the same session and continue teaching from real results. Summarize learning, evidence, open questions, and next steps when useful, without inventing cross-session progress or reminders.
