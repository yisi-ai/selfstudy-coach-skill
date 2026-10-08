# Web feature scope

Current `help` and the actual answering page define available operations. This reference covers the companion Web app's learning pages and storage boundaries.

## Learning activities

- **Quizzes:** single/multiple choice with reference answers, explanations, Markdown and LaTeX, optional static Canvas and other visual nodes, unfinished progress, and completed history. Imported question order is preserved; new attempts shuffle options. Mixed practice may shuffle questions.
- **Questionnaires:** unscored single/multiple choice, preserving question and option order, with a client-added Other choice and free-text field. One current questionnaire and its responses; the next import replaces it.
- **Whiteboards:** one-topic 2D Canvas demonstrations using portable source or object steps, and interactive 3D scenes. Explanations can be replayed and marked unclear with an optional multiline remark, included in copied feedback. See [whiteboards](whiteboards.md) for stage design and feedback.

Quiz commands default to medium and open the first question. Easy mode gives immediate feedback and locks submitted answers. Medium gives feedback at completion. Hard has a fixed deadline of question count × 30 seconds; resuming preserves it. Medium/hard allow revising selections before submission. Questionnaires open directly without a score or timer.

## Pages

| Path                       | Purpose                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/app`                     | Learning home, random quiz, and mixed practice using up to 20 existing questions.                                                                                  |
| `/app/prompts`             | Learning goals and prompts. The locally saved topic, desired ability, and current situation are included in copied prompts.                                        |
| `/app/import`              | Unified import of quiz, questionnaire, or 2D/3D whiteboard JSON from the clipboard or a file. `/app/open` and `/app/whiteboards/import` remain compatible entries. |
| `/app/library`             | Local quiz library, history, backup, and restore.                                                                                                                  |
| `/app/whiteboards`         | Local 2D/3D whiteboard library, management, and links to individual players.                                                                                       |
| `/app/whiteboards/<id>`    | A 2D whiteboard player.                                                                                                                                            |
| `/app/whiteboards-3d/<id>` | An interactive 3D whiteboard player.                                                                                                                               |
| `/app/questionnaires/<id>` | The current questionnaire.                                                                                                                                         |

Prompt-page goals are local user input, not a saved curriculum or an implied Agent command. Use goals available in the conversation or actual returned data.

The whiteboard library's **Manage** button reveals checkboxes on the left of each item. Select boards, choose **Delete**, and confirm to remove them from this browser. **Done** exits management and clears the selection. This UI supports both board types; it does not imply a bulk-delete command. Do not delete learning content automatically to make space.

## Retention and discovery

Activities use browser-local IndexedDB; prompt-page goals use local browser storage. Different browser contexts can have separate data even at the same origin. Learning commands and the Node connection do not upload the library to the website backend or synchronize it across devices.

Quiz backups retain completed ordinary and mixed histories, latest per-question results, and unfinished ordinary progress. Questionnaires and whiteboards are separate. Node also retains delivered completion receipts. See [storage](storage.md) for exact semantics.

Current command definitions are available through `help` and public `/agent/commands`; the 2D whiteboard format through `whiteboard.help` and `/agent/whiteboard`. Current automatic commands and Node completion receipts do not cover 3D boards; see [3D whiteboards](whiteboards-3d.md). Public documentation contains capability metadata only. Learning plans and conversational exercises stay in the conversation; the app provides neither curriculum storage nor automatic reminders.
