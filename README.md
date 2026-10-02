# Self-Study Tutor Skill

## Install

Copy this message to your agent:

```text
Use npx skills add yisi-ai/selfstudy-coach-skill --skill selfstudy-coach to install selfstudy-coach for the current agent and verify it is available; if already installed, back it up and preserve my customizations.
```

Or run:

```bash
npx skills add yisi-ai/selfstudy-coach-skill --skill selfstudy-coach
```

Choose your current agent when prompted. Installation is project-local by default; add `--global` for use across projects. See the [skills CLI documentation](https://github.com/vercel-labs/skills#install-a-skill) for options.

The release repository is `selfstudy-coach-skill`; the installation directory and invocation name are `selfstudy-coach`. Runtime scripts are included. Install repository-root content without `.git/`. Updates preserve your customizations; see [update guidance](references/version-update.md). Hosts supporting direct use may read [SKILL.md](SKILL.md) without installing another copy.

## Use

Invoke `$selfstudy-coach` to start learning, explain a difficulty, learn from supplied notes, or review earlier work. Tell the agent what you want to learn, what you want to be able to do, and anything useful about your current situation. It teaches in your preferred language and uses questionnaires, animated whiteboards, and quizzes where they help.

For example: “Use $selfstudy-coach to help me learn everyday English for travel. I know some words but find conversations difficult.” For review: “Use $selfstudy-coach to review these notes and help me understand my mistakes.”

The agent prepares the companion Web connection during the first learning response. It prefers Node.js 22+ on your computer with a sidebar or system browser, then available tools controlling your visible browser, then JSON file/code delivery. It handles preparation and result reads when connected; you answer and choose your learning direction.

The local service remains available between replies and after the conversation ends until you ask to stop it. Closing the page leaves it on standby. Your library stays in the browser where you answered, without automatic cross-device synchronization. Source note photos remain in the conversation; derived learning content goes to Web.

Learning plans and continuation summaries stay in the conversation. Bring the summary when continuing in a new conversation. Current capabilities are discovered through `help`; compatible additions do not require a Skill update.

Maintenance source: `apps/web/skills/selfstudy-coach/` in the main project. Installation directories are generated under Git-ignored `dist/`; see [MAINTAINING.md](MAINTAINING.md) for validation and export to the independent release repository.
