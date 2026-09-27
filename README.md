# Self-Study Tutor Skill

Use `$selfstudy-coach` for adaptable self-study plans, explanations, conversation summaries, questions, single-topic teaching whiteboards, Web practice, and review based on the user's goals and understanding. This skill targets the companion Web app. Instructions are in English; tutoring and generated content follow the user's preferred language.

## Install

Ask an agent with local file access to install the complete release:

```text
Install the Self-Study Tutor skill from https://github.com/yisi-ai/selfstudy-coach-skill into your host's skill directory under selfstudy-coach. Verify the installation. If already installed, back it up and preserve my customizations.
```

The release repository is named `selfstudy-coach-skill`; the installed directory and invocation name are `selfstudy-coach`. Install the repository-root content without `.git/`. Runtime scripts are compiled and included. Updates require user consent and preservation of customizations; see [update guidance](references/version-update.md). Read [SKILL.md](SKILL.md) to use the skill without installing another copy when the host supports that workflow.

## Use

On first invocation, the agent selects and prepares one route in this order:

1. [Local Node connection](references/local-connection.md), with Node.js 22+ on the user's computer and the real Web app displayed in the right sidebar.
2. [Browser control](references/browser-control.md), through an available browser MCP, browser-operation skill, or host tool controlling that same right-side page.
3. [File or code handoff](references/manual-handoff.md), only when both automatic routes are unavailable or the user explicitly requests files/code.

The agent records the selected route and session, then reuses it. It restores a failed connection before changing routes and does not ask the user to copy or import content while automation works. Control of a separate browser does not count as control of the right sidebar. Product names and browser-based chat interfaces do not determine tool capabilities.

The user answers questions and makes learning choices; the agent handles preparation, import, display, and reads. A connection remains open while the user is away. Complete answers awaiting synchronization are saved locally and delivered when it returns; hard-mode quiz deadlines retain their normal rules.

Example requests:

- “Help me plan how to learn statistics for my work with three hours a week. Give me the plan first.”
- “Use $selfstudy-coach to explain this concept and help me apply it.”
- “Summarize the concepts and open questions in this conversation.”
- “Explain HTTP caching, then prepare three questions in the right sidebar. After I finish, review my mistakes.”
- “Show how this mechanism changes step by step with a whiteboard.”

Web activities are optional teaching aids; preparing a connection does not force a quiz on every invocation. New-topic questionnaires are optional and use actual responses without scoring them. Automatically imported knowledge quizzes default to medium. Whiteboards focus on one topic and use buttons for its cases or stages.

Self-study plans connect stage goals to practice, progress checks, and a concrete next task, with pacing adjusted to the user's time and actual learning evidence. Plans and pause summaries stay in the conversation; Web does not store learning plans or send automatic reminders. Bring the summary when continuing in a new conversation.

The agent discovers current capabilities through `help`, without startup version comparisons. Compatible additions do not require Skill updates. Public `/agent/commands` contains documentation, not the user's library. Browser-local data is not automatically synchronized across devices; review uses actual results, not inferred history.

Maintenance source is `apps/web/skills/selfstudy-coach/` in the main project. Formal and local installation directories are generated under Git-ignored `dist/`; export to the independent release repository follows [MAINTAINING.md](MAINTAINING.md). Do not overwrite a user's installed customizations merely because a new package exists.
