# File or code handoff

Use this reference for the manual route selected in SKILL.md. Keep that route for later activities unless capabilities or the user's preference change.

## Deliver content

Provide one complete JSON file when attachments are supported, otherwise one complete `json` code block. Follow [quiz and questionnaire formats](quiz-format.md) or [whiteboards](whiteboards.md).

Link to [Import learning content](https://www.aiskillonline.com/app/import) and give one short instruction: import the copied code or upload the JSON file. The page identifies the quiz, questionnaire, or whiteboard and opens it. Use file upload if clipboard access is unavailable. Substitute the selected companion origin in links.

The user completes this import before the activity is available. Use actual returned evidence to establish its state. Quiz JSON includes the reference answers required for grading.

If the user returns a repair prompt, apply its error locations and format rules to the original content in the conversation, then provide the corrected complete document. Repair prompts contain diagnostics rather than the original source; retrieve only missing source needed for the correction if it is no longer available.

## Receive feedback

After the activity, ask the user to choose **Copy feedback to AI** and send it in the same conversation. This provides the information needed for the next explanation:

| Activity      | Copied feedback                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Quiz          | Questions, reference answers, actual correctness or unanswered status, and any incorrectly selected or missed options. |
| Questionnaire | Questions and the user's selected responses, including text for a selected Other choice.                               |
| 2D whiteboard | Topic, current segment, and explanations of steps marked unclear across segments, with any nonblank user remarks.      |
| 3D whiteboard | Topic, marked step numbers and explanations, with any nonblank user remarks.                                           |

Work from this concise feedback. Source JSON and drawing code are unnecessary for ordinary review. A completion message without answers provides no performance evidence; a whiteboard with no marked steps leaves understanding unknown.

For a task requiring older quiz history, request the relevant [library backup](https://www.aiskillonline.com/app/library#guide=export). Current v5 backups retain completed test selections, latest per-question results, and unfinished ordinary attempts. Resolve history against its quiz questions; older backups may contain only latest results. Questionnaires and whiteboards are separate from quiz backups.
