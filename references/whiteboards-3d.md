# Interactive 3D whiteboards

Use a 3D board when rotating a spatial scene helps explain geometry, vectors, curves, surfaces, or another spatial relationship. Keep each stage focused on a visible change and allow time to observe it. The host supplies rotation, zoom, play, pause, replay, fit, and previous/next-step controls.

## Format

Create one complete JSON document in the conversation's language:

```json
{
  "format": "gaga.whiteboard-3d",
  "schemaVersion": 1,
  "title": "A vector in space",
  "durationMs": 4000,
  "steps": [
    { "atMs": 0, "text": "Observe the starting vector." },
    { "atMs": 2000, "text": "Watch its endpoint move upward while its horizontal position stays fixed." }
  ],
  "source": "var y=0.5+Math.max(0,Math.min(1,(frame.elapsedMs-2000)/1500)); scene.axes({size:2.5}); scene.vector({from:[0,0,0],to:[1.5,y,0.8],color:'#436fb3'}); scene.label({position:[1.5,y,0.8],text:'A',color:'#436fb3',fontSize:22});"
}
```

- `title` is at most 120 characters; optional `description` at most 2000.
- `durationMs` is 0–300000 milliseconds. Use 0 for a static scene, where `frame.progress` is 1.
- Generate 1–100 meaningful `steps`; the first `atMs` is 0, subsequent values strictly increase and stay within `durationMs`. Each `text` is nonblank and at most 2000 characters. Previous/next controls seek to a step and pause. Legacy documents without steps remain readable using `scene.caption` for an explanation.
- `source` is an ES5 function body, at most 65536 characters, executed anew each frame with `scene` and `frame={elapsedMs,durationMs,progress}`. Use `var`, functions, loops, arrays, and Math. Recreate the entire scene from the frame; do not depend on earlier playback or random state. No imports, HTML, DOM, wx, network, timers, external models, Three.js, or custom rendering loop.

## Drawing API

Positions are `[x,y,z]` in a right-handed coordinate system with y up; each component is between -10000 and 10000. Colors are `#rrggbb`; opacity is 0–1. Widths and radii are spatial units.

| Method | Arguments |
| ------ | --------- |
| `scene.axes` | `{size:2.5}`; optional coordinate axes. |
| `scene.point` | `{position,radius:0.06,color,label?,opacity?}`. |
| `scene.line` | `{from,to,width:0.015,color,opacity?}`. |
| `scene.vector` | `{from,to,width:0.025,headLength:0.22,color,label?,opacity?}`; spatial arrow. |
| `scene.polyline` | `{points,closed:false,width,color,opacity?}`; 2–1000 positions. Sample curves with loops and Math. |
| `scene.mesh` | `{vertices,faces,color,opacity?}`; each array at most 5000 entries. Faces use zero-based vertex indices and contain triangles or convex polygons with 3–100 vertices. |
| `scene.label` | `{position,text,color,fontSize:22}`; text at most 160 characters. Use `latex` instead of `text` for math. |
| `scene.caption` | A string providing the current explanation when steps are absent. |

Group transforms use paired `scene.save()` / `scene.restore()`, with nesting at most 32. Between them, use `scene.translate(x,y,z)`, `scene.rotate(rx,ry,rz)` in radians, and `scene.scale(s)` or `scene.scale(x,y,z)`.

Math labels use raw MathJax base/AMS LaTeX without dollar delimiters, at most 2000 characters. Use `\frac`, `\sqrt`, and `\vec` for fractions, roots, and vectors. Escape backslashes in JavaScript strings, then escape source again in JSON. Labels follow spatial positions and remain upright at a fixed screen size. Generate `fontSize` 20–24 pixels, within 18–48; put longer explanations in steps or description.

Per frame, stay within 100000 interpreter steps, 2000 drawing calls, 10000 triangles, and 80 labels. Each line segment creates multiple triangles, so limit curve sampling. The camera fits the start, midpoint, and end; keep other moments within the same spatial range. Leave room around labels and split dense information into stages. Verify rendering through actual display evidence before claiming readability.

## Operation and feedback

The unified `/app/import` accepts this format and opens `/app/whiteboards-3d/<id>`. Both 2D and 3D boards appear in `/app/whiteboards`. Current `whiteboard.help`, `whiteboard.import`, and the other `whiteboard.*` commands cover `gaga.whiteboard` only; do not send this format to them. Follow the selected [Node](local-connection.md) or [browser-control](browser-control.md) route for its current 3D coverage, or the already selected [manual route](manual-handoff.md).

Verify the title, displayed scene, step explanations, and controls. Marking a step unclear opens an optional multiline remark field; confirming an empty field still marks the step. Marks and remarks survive replay and reopening; removing a mark removes its remark. Copied feedback includes the topic, one-based marked step numbers, explanations, and any nonblank remarks, without the drawing source. Use this evidence to address the learner's difficulty. Playback completion or an absence of marks does not prove understanding.
