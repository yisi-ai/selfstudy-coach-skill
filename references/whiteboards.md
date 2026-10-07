# Animated teaching whiteboards

Use a whiteboard to explain one topic through changing pictures: a process, spatial relationship, transformation, or comparison. Let movement, position, shape, paths, and connections carry the explanation, with short labels and supporting text. A useful stage shows what changes, why it matters, and a clear state to observe.

Use a 2D board for flat diagrams and comparisons. For spatial geometry, curves, surfaces, or relationships that benefit from rotating the view, read [3D whiteboards](whiteboards-3d.md). The formats and drawing APIs differ; current `whiteboard.*` commands operate 2D boards only.

## 2D format and drawing

Read `whiteboard.help` through the prepared connection for current fields, drawing APIs, and a complete example. Public `/agent/whiteboard` supplies the same format documentation when page commands are unavailable.

The envelope is `{format:"gaga.whiteboard",schemaVersion:1,title,description?,width,height,objects?,segments}`. Create new boards at `width:800,height:600` (4:3). Limits: 1 MiB, 200 objects, 30 segments, five minutes per segment. Both supported representations render on Canvas:

| Representation                                         | Segment structure                                                                                                                                         | Replay and feedback                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Portable Canvas source, the default for new animations | `{id,label,explanation,steps:[{durationMs,explanation}],content:{kind:"canvas",source,durationMs}}`; source draws the case and steps define its timeline. | Each step replays its interval and can be marked unclear. Step durations must sum exactly to `content.durationMs`.         |
| Objects and steps                                      | `{id,label,explanation?,initial?,steps:[{durationMs,explanation,changes?,easing?}]}`; changes reference declared object IDs.                              | Each step is individually replayable and can be marked unclear. Changes within a step run together; steps run in sequence. |

Choose one representation per segment. For Canvas source, provide 1–100 ordered `steps` with durations of 0–30000 ms each; omit object `initial` and `changes`. HTML/SVG documents are not supported whiteboard formats.

Canvas `source` is the body of an ES5 drawing function using `ctx` and `frame={width,height,elapsedMs,durationMs,progress}`. Draw the entire scene from the current frame; local variables are recreated each time. The host owns the animation loop, replay, and DPI. Use `var`, functions, arrays, loops, and supported Canvas 2D operations; source is limited to 65536 characters and duration to 0–300000 ms. Consult current help for supported APIs and execution limits.

The host reserves 5% padding: an 800×600 board supplies a 740×540 inner Canvas viewport. Lay out source drawings using `frame.width`/`frame.height`; object scenes reserve the equivalent margin in board coordinates. Keep labels, strokes, arrowheads, and intermediate states inside that area. Split dense scenes into readable stages for narrow screens.

## Build understandable stages

Choose stages at meaningful changes in the explanation. Establish the starting situation, animate the relationship being explained, and leave time to observe the result. Comparisons can use a fixed reference beside the changing scene. Text explains the visible action; the drawing demonstrates it.

Segments represent distinct cases, categories, or examples; their steps explain each case in order. For linear equations, `x + 3 = 5`, `3x = 12`, and `3x + 5 = 14` belong in separate segments, with subtraction and equal division as steps inside the appropriate case. Do not turn each explanation stage into a separate segment. Give each segment a brief overview and each step its own meaningful explanation. Each segment must establish its own context so it makes sense when opened directly or replayed. Object segments restart from base objects plus their own initial changes; Canvas segments redraw from their own source and frame. Keep a useful final scene. For object steps, empty `changes` can provide a reading pause; durations are 0–30000 ms per step, up to 100 steps per segment.

All step explanations are visible from the start. Clicking one replays that step and pauses at its end; a segment button replays the whole segment. Marking a step unclear opens a multiline remark field. The user may describe what is unclear or confirm without text. Marks and remarks survive replay, segment changes, and reopening until the document is revised; removing a mark removes its remark. For Canvas, align source changes and observation pauses with cumulative step boundaries using `frame.elapsedMs`; the clock belongs to the whole segment and does not restart at each step. Generate explicit steps for every new Canvas case. Legacy Canvas documents without steps remain readable as one full-animation step. Copied feedback identifies the segment label, one-based step number, explanation, and any nonblank remark for each mark.

`whiteboard.read` returns optional `unclearSteps` and `unclearNotes`. Both are keyed by segment ID; `unclearSteps` contains zero-based step indices, and `unclearNotes[segmentId][stepIndex]` holds the corresponding nonblank user remark. A marked step may have no remark. Read the explanation and remark together; a missing remark does not cancel the mark. `whiteboard.update` clears both for the revised content.

## Operate and review

Use `whiteboard.import`, `whiteboard.read`, `whiteboard.update`, and `whiteboard.present` through the prepared route; discover exact arguments in help. Updates require the current revision. On conflict, read current content and reconcile. An intentional replay gets a new request ID; a retry keeps the original one.

Verify the visible board's ID, title, segment, explanations, and rendering. Read marked steps and their remarks to focus the next explanation; playback completion alone says nothing about understanding. Whiteboards stay in the current browser's separate library, outside quiz backups. [Web scope](web-features.md) covers library management; [manual handoff](manual-handoff.md) covers copied feedback when automatic reads are unavailable.
