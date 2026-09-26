# Single-topic teaching whiteboards

Use a whiteboard when spatial changes, comparisons or intermediate steps clarify the user's current question. The agent may choose this teaching aid without waiting for the user to request a whiteboard. Keep one topic per board; its buttons represent cases, questions or stages within that topic. Use a separate board for another topic. Explanations are text, without speech or a whole-presentation player.

## Discover and create

Use the Web connection or sidebar already prepared in SKILL.md. Discover `whiteboard.help` through the current host's `help`. The public Web `/agent/whiteboard` endpoint returns the same current format documentation and complete JSON example without requiring browser control. `/agent/commands` lists commands. These endpoints contain no user content.

The data discriminator is `format: "gaga.whiteboard"`, with an independent `schemaVersion`. A document contains a title, logical canvas dimensions, identified drawing objects, and identified segments. Build scenes freely from supported primitives; do not restrict explanations to preset subject templates. Each segment defines initial object changes and a sequence of timed changes with explanatory text. Intermediate motion, simultaneous changes and pauses for reading can all be composed. Call current help for supported properties, limits, interpolation rules and examples; compatible additions need no Skill update.

Through the prepared Web route, import with `whiteboard.import`, read with `whiteboard.read`, and modify the returned document using `whiteboard.update` with its current revision. Discover exact arguments from help. Updates can modify any objects or segments. On a revision conflict, read current content and reconcile; never overwrite blindly. `whiteboard.present` restarts a selected segment on an already open board. Use a fresh request ID for each intentional replay and the original ID when retrying the same request.

Each segment restores base objects plus its own initial changes. Selecting a later stage must establish all context needed to understand it. Repeating a segment must not depend on the previous segment's final state. Use intermediate steps and readable text to explain the mechanism, rather than merely showing two endpoints. The final scene remains visible.

Check the actual visible board's title, ID, selected segment, explanatory text and rendering. Web receipts report `active.kind: "whiteboard"`, its revision and segment, plus current step and elapsed time; `ready` means it is displayed, `running` means a segment is demonstrating, and `completed` means that segment ended, not that the user mastered the topic. This is not quiz grading or a learning result. Keep the same answering/preview host and local connection rules used for other learning activities.

## Data and storage

Use the current `/agent/whiteboard` documentation when available. If live documentation cannot be read, use the stable baseline example below without guessing unsupported extensions. Deliver through the already selected route; lack of browser controls alone does not make an existing Node connection unavailable.

Web stores boards in this browser's local database. The **Whiteboards** navigation opens `/app/whiteboards`, which supports opening, renaming and deleting. **Add whiteboard** opens `/app/open` to read the clipboard or upload a file. There is no account sync or inclusion in quiz backups.

## Baseline file example

This complete baseline demonstrates two cases of the same concept. Coordinates use the declared canvas dimensions. Numeric changes interpolate over each duration; explanations appear at step boundaries and remain visible. Clicking a revealed explanation replays only its corresponding step and pauses at its final scene, keeping the other revealed text. Segment buttons restart the entire segment and its text sequence. Add reading pauses with empty `changes`. Text objects use `kind: "text"`, `text`, `fontSize` and a wrapping `width`; paths use local `[x,y]` points. Detailed drawing capabilities remain in live help.

```json
{
  "format": "gaga.whiteboard",
  "schemaVersion": 1,
  "title": "Constant speed",
  "description": "Compare equal time intervals in either direction.",
  "width": 400,
  "height": 260,
  "objects": [
    {
      "id": "ball",
      "kind": "ellipse",
      "x": 30,
      "y": 100,
      "width": 40,
      "height": 40,
      "fill": "#1858f5"
    }
  ],
  "segments": [
    {
      "id": "right",
      "label": "Move right",
      "steps": [
        {
          "durationMs": 1500,
          "easing": "linear",
          "explanation": "In one interval, the ball travels 140 units.",
          "changes": [{ "id": "ball", "x": 170 }]
        },
        { "durationMs": 1000, "explanation": "Observe the halfway position.", "changes": [] },
        {
          "durationMs": 1500,
          "easing": "linear",
          "explanation": "Another equal interval produces an equal distance.",
          "changes": [{ "id": "ball", "x": 310 }]
        }
      ]
    },
    {
      "id": "left",
      "label": "Move left",
      "initial": [{ "id": "ball", "x": 310 }],
      "steps": [
        {
          "durationMs": 1500,
          "easing": "linear",
          "explanation": "The direction is reversed; the distance per interval is unchanged.",
          "changes": [{ "id": "ball", "x": 170 }]
        },
        {
          "durationMs": 1500,
          "easing": "linear",
          "explanation": "The next equal interval covers the same distance again.",
          "changes": [{ "id": "ball", "x": 30 }]
        }
      ]
    }
  ]
}
```
