# File or code handoff

Read this only when neither local Node nor browser tools can operate the actual right-sidebar Web page, or when the user explicitly asks for a file or code. A browser-based chat UI or lack of clicking tools alone does not select this route; apply SKILL.md's capability order once. Reading public webpages or running code in a cloud container does not grant access to the user's answering page.

## Deliver complete content

Provide one complete JSON file when attachments are supported, otherwise one complete JSON code block. Follow [quiz and questionnaire formats](quiz-format.md) or [whiteboards](whiteboards.md). Use the installed skill's companion origin for all links; the examples below use the production site.

Give the full [learning content importer](https://www.aiskillonline.com/app/open) URL and one short instruction: upload the file, or copy the complete code and click **Read clipboard**. If clipboard permission is unavailable, provide a JSON file for upload. It detects `gaga.quiz`, `gaga.questionnaire`, and `gaga.whiteboard` and opens the corresponding activity. There is no prompt-copying step. Do not send already-generated content back through `/app/import#guide=import`.

State honestly that the user still needs to import the content. Opening a URL or producing a file does not mean the activity was saved, displayed in a sidebar, or started. Do not invent activity IDs or answering URLs. Never ask the user to execute JavaScript or open developer tools. Complete quiz JSON contains reference answers; do not separately reveal solutions or claim those fields are hidden from the user.

## Receive actual answers

After a questionnaire, ask the user to expand its completed questions and return the actual selected responses. After a quiz, prefer the visible result and relevant answer details; when a library backup is needed, give the full [library backup entry](https://www.aiskillonline.com/app/library#guide=export) and ask for its file or copied content. Backups retain each question's latest correctness and time, not full completed attempts or questionnaire history. Do not promise that a backup recovers every selected option.

“I finished” provides no answer data in this route. Analyze only returned evidence, not imagined sidebar state. An old-question search can use supplied quizzes or backups, but cannot claim to have searched the user's browser storage. After a whiteboard, continue the explanation and use a comprehension question rather than treating animation completion as a score.

Keep the recorded file-delivery mode for subsequent tasks in this session. Reassess only if host capabilities change or the user requests another mode; do not repeatedly attempt unavailable local runtimes or browser tools.
