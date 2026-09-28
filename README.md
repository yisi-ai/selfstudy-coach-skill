# Self-Study Tutor Skill

Use `$selfstudy-coach` for adaptable self-study plans, explanations, conversation summaries, questions, single-topic teaching whiteboards, Web practice, and review based on the user's goals and understanding. This skill targets the companion Web app. Instructions are in English; tutoring and generated content follow the user's preferred language.

## Install

Ask an agent with local file access to install the complete release:

```text
Install the Self-Study Tutor skill from https://github.com/yisi-ai/selfstudy-coach-skill into your host's skill directory under selfstudy-coach. Verify the installation. If already installed, back it up and preserve my customizations.
```

The release repository is named `selfstudy-coach-skill`; the installed directory and invocation name are `selfstudy-coach`. Install the repository-root content without `.git/`. Runtime scripts are compiled and included. Updates require user consent and preservation of customizations; see [update guidance](references/version-update.md). Read [SKILL.md](SKILL.md) to use the skill without installing another copy when the host supports that workflow.

## Use

During the first learning response, including a plan or explanation, the agent selects and prepares one route in this order:

1. [Local Node connection](references/local-connection.md), started from a local terminal with Node.js 22+. Use the sidebar when available; a TUI opens the system browser instead and needs no browser MCP.
2. [Browser control](references/browser-control.md), through an available browser MCP, browser-operation skill, or host tool controlling the actual visible page where the user answers.
3. [File or code handoff](references/manual-handoff.md), only when both automatic routes are unavailable or the user explicitly requests files/code.

The agent records the selected route and session, then reuses it. It restores a failed connection before changing routes and does not ask the user to copy or import content while automation works. Without an automatic browser opener, it provides the existing preview link and leaves the service on standby. A headless browser or another browser's storage does not replace the user's answering page. Product names and browser-based chat interfaces do not determine tool capabilities.

The user answers questions and makes learning choices; the agent handles startup, preparation, import, display, and reads. The local service stays running between replies, while the user is away, and after the conversation ends, until the user explicitly asks to stop it. Closing the page leaves the service on standby; reopening its preview restores the connection. A stopped process or restarted computer requires the agent to resume the saved session. Complete answers awaiting synchronization are saved locally and delivered when the connection returns; hard-mode quiz deadlines retain their normal rules.

Example requests:

- “Help me plan how to learn statistics for my work with three hours a week. Give me the plan first.”
- “Use $selfstudy-coach to explain this concept and help me apply it.”
- “Summarize the concepts and open questions in this conversation.”
- “Explain HTTP caching, then prepare three questions in the right sidebar. After I finish, review my mistakes.”
- “Show how this mechanism changes step by step with a whiteboard.”
- “Read these note photos and help me practise the key ideas. Keep the photos out of Web.”

Web activities are optional teaching aids; preparing a connection does not force a quiz on every invocation. New-topic questionnaires are optional and use actual responses without scoring them. Automatically imported knowledge quizzes default to medium. Whiteboards focus on one topic and use buttons for its cases or stages.

For note photos, the agent uses the host's image-understanding capability and adapts its organization to the material and your goal. It clarifies consequential ambiguities and distinguishes notes from added explanations. Only derived learning content goes to Web; source photos are not uploaded or embedded. See [image-note guidance](references/image-notes.md).

Self-study plans connect stage goals to practice, progress checks, and a concrete next task, with pacing adjusted to the user's time and actual learning evidence. Plans and pause summaries stay in the conversation; Web does not store learning plans or send automatic reminders. Bring the summary when continuing in a new conversation.

The agent discovers current capabilities through `help`, without startup version comparisons. Compatible additions do not require Skill updates. Public `/agent/commands` contains documentation, not the user's library. Browser-local data is not automatically synchronized across devices; review uses actual results, not inferred history.

Maintenance source is `apps/web/skills/selfstudy-coach/` in the main project. Formal and local installation directories are generated under Git-ignored `dist/`; export to the independent release repository follows [MAINTAINING.md](MAINTAINING.md). Do not overwrite a user's installed customizations merely because a new package exists.
