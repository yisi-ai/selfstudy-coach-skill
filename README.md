[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

# Self-Study Tutor

**Self-Study Tutor** is a skill for your AI agent that helps you study independently and review what you have learned. It guides you step-by-step through complex subjects directly within your AI chat interface, while collaborating on demand with its companion web application ([aiskillonline.com](https://www.aiskillonline.com)) for learning questionnaires, animated whiteboards, and quizzes. Tell it your goal, preferred language, and current experience; you choose the pace and what to learn next.

## Installation & Setup

Install the skill using the standard command:

```bash
npx skills add yisi-ai/selfstudy-coach-skill --skill selfstudy-coach
```

- **Target Agent Selection**: During installation, select the AI agent you want to use.
- **Scope**: By default, the skill installs into your current project folder. Add the `--global` flag to install it across all projects.
- **Reference**: For more installation flags, see the official [Skills CLI installation documentation](https://github.com/vercel-labs/skills#install-a-skill).
- **Invocation**: Call the skill inside your chat using `$selfstudy-coach`.

### Environment Requirements

- **CLI Installation & Management**: Requires a local installation of Node.js and npm.
- **Direct Local Host Connection**: Requires **Node.js 22+** when connecting your local chat environment directly to the companion web app via a local bridge.
- **Browser-Only Use**: If you open and operate the companion web application manually in your browser, no local Node.js installation is required.

> **Updating Notice**: Before updating, back up your installed skill and preserve any custom changes. You can ask your agent to help; do not rely on the update command to merge your edits.

## Core Learning Scenarios

Try one of these requests in your chat:

### 1. Goal Setting & Study Roadmaps

```text
$selfstudy-coach I want to self-study linear algebra for machine learning from scratch over the next two months. Help me plan each week, ask about my background and goals in a short questionnaire, and suggest where to start.
```

### 2. Deconstructing Tough Concepts

```text
$selfstudy-coach I am struggling to grasp "closures" in JavaScript. Please explain the concept step-by-step with practical analogies, and prepare a visual breakdown on the whiteboard.
```

### 3. Reviewing Personal Notes & Self-Testing

```text
$selfstudy-coach Here are my summary notes from today's economics reading on supply-demand elasticity. Please quiz me on the core mechanisms and highlight areas where my understanding might be shaky.
```

## Companion Web App Integration

When helpful, the skill collaborates with [https://www.aiskillonline.com](https://www.aiskillonline.com):

- **Learning questionnaires**: Share your goals, background, and difficulties through unscored questions.
- **Animated whiteboards**: Explore 2D or 3D explanations, replay stages, and mark steps you do not understand.
- **Quizzes**: Answer single-choice and multiple-choice questions yourself. Your agent uses your actual answers to explain mistakes and guide review.

### Connection Modes

Your agent prepares a connection during its first learning response, using the first available option below. When connected, it prepares activities and reads the results; you fill in questionnaires and answer quizzes.

1. **Local Node.js 22+ Bridge**: Directly links with a sidebar panel or system browser window.
2. **Browser Automation Tools**: Connects via agent-driven browser integrations controlling the visible web page.
3. **Manual Transfer**: Provides a JSON file or code block for you to import or paste into the web app.

*Note*: When a local bridge service is launched, it remains on standby in the background even if you close the browser tab, until you explicitly tell your agent to shut it down.

## Data Boundaries & Session Continuation

- **Local Study Library**: Quiz history and study library records remain stored inside the specific browser where you completed the tasks. The project does not provide automated cross-device syncing.
- **Original Content Handling**: Your original note photos stay in the conversation. Derived learning content, such as quizzes and whiteboards, goes to the web app.
- **Resuming Sessions Across Chats**: Study plans and progress summaries reside inside your conversation history. When starting a fresh conversation, paste the most recent progress summary from your previous chat to give the tutor the context needed to continue.

## Further Reference

- Detailed skill definitions and triggers: [`SKILL.md`](SKILL.md)
- Update considerations: [`references/version-update.md`](references/version-update.md)
- Maintenance guidelines: [`MAINTAINING.md`](MAINTAINING.md)
