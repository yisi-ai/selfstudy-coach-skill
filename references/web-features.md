# Web feature scope

Current `help` and the actual answering page define available operations. This reference covers the companion Web app's learning pages and storage boundaries.

## Learning activities

- **Quizzes:** single/multiple choice with reference answers, explanations, Markdown and LaTeX, optional visual nodes, unfinished progress, and completed history.
- **Questionnaires:** unscored single/multiple choice. One current questionnaire and its responses; the next import replaces it.
- **Whiteboards:** one-topic Canvas demonstrations, using portable source or object steps. Explanations can be replayed and marked unclear. See [whiteboards](whiteboards.md) for stage design and feedback.

Quiz commands default to medium and open the first question. Easy mode gives immediate feedback and locks submitted answers. Medium gives feedback at completion. Hard has a fixed deadline of question count × 30 seconds; resuming preserves it. Medium/hard allow revising selections before submission. Questionnaires open directly without a score or timer.

## Pages

| Path                       | Purpose                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/app`                     | Learning home, random quiz, and mixed practice using up to 20 existing questions.                                                                            |
| `/app/prompts`             | Learning goals and prompts. The locally saved topic, desired ability, and current situation are included in copied prompts.                                  |
| `/app/import`              | Unified import of quiz, questionnaire, or whiteboard JSON from the clipboard or a file. `/app/open` and `/app/whiteboards/import` remain compatible entries. |
| `/app/library`             | Local quiz library, history, backup, and restore.                                                                                                            |
| `/app/whiteboards`         | Local whiteboard library and links to individual players.                                                                                                    |
| `/app/questionnaires/<id>` | The current questionnaire.                                                                                                                                   |

Prompt-page goals are local user input, not a saved curriculum or an implied Agent command. Use goals available in the conversation or actual returned data.

## Retention and discovery

Activities use browser-local IndexedDB; prompt-page goals use local browser storage. Different browser contexts can have separate data even at the same origin. Learning commands and the Node connection do not upload the library to the website backend or synchronize it across devices.

Quiz backups retain completed ordinary and mixed histories, latest per-question results, and unfinished ordinary progress. Questionnaires and whiteboards are separate. Node also retains delivered completion receipts. See [storage](storage.md) for exact semantics.

Current command definitions are available through `help` and public `/agent/commands`; whiteboard formats through `whiteboard.help` and `/agent/whiteboard`. Public documentation contains capability metadata only. Learning plans and conversational exercises stay in the conversation; the app provides neither curriculum storage nor automatic reminders.
