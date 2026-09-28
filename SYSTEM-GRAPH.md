# Front-page system graph

The homepage uses a native SVG graph, without a build step or runtime dependencies.

- Hover, tap, or keyboard-focus a node to reveal its title.
- Click a node (or press Enter/Space while focused) to animate and sound only its incoming/outgoing paths, keeping their endpoints bright while fading the rest. Click an edge to isolate just that connection and show the titles beside both endpoint nodes until the selection changes or clears. Select another node or edge to switch focus. Click empty space, outside the graph, the selected component again, or press Escape to restore the full, silent animation.
- Selecting a node types its note below the graph as `> ...`, with a keyboard sound. Changing the selection replaces the note; clearing it stops typing and sound. Hovering only shows the title. You can click or select the note's text without clearing it.
- Flow animates automatically and silently until a node or edge is selected, and respects reduced-motion preferences.
- While a node or edge is selected, each pulse arriving along its isolated connections plays a short mechanical hit. Selection starts a pulse immediately on each isolated edge; subsequent pulses follow the source node's interval. Hovering or clicking the background does not enable sound. Switching or clearing selection stops existing hit sounds and packets. Hit sounds also stop when the graph or page is hidden.
- On narrow screens, swipe horizontally across the graph to explore it.
- Every Home visit starts with buttons on black, then staggered node drops, followed by connections drawing from source to destination while the full title slowly fades in. Regular flow and exploration start once both the edges and fade finish. Browser Back replays the entrance too. The title fade is silent and independent of the node notes' typing effect.
- Clicking Home (including a logo or Back Home link) from another page blanks the page and plays wind before loading the entrance. The About video pauses during this departure. New-tab/modifier clicks keep their usual behavior; reduced motion skips the entrance and wind.
- Navigation from Home gathers the entire graph into view and collapses it into the destination's node: About → Satisfaction, Work → Project, Memos → Experience, and Contact → Relationship. The destination page appears through an expanding wave from that point. Reduced-motion preferences and opening a new tab use normal navigation.

All graph parameters are controlled by the site owner in **`js/system-graph-config.js`**. Visitors can explore the graph; there are no settings or playback controls. Previously saved browser color overrides are ignored.

## Editing the graph

Edit the config file, save it, and refresh the page to preview. Publish the file with your site to apply your settings for everyone. No build step is needed.

For example, find the **Money** node and edit these values:

```js
{
  id: "money", label: "Money",
  note: "A resource that supports needs, wants, and future investment.",
  color: "#eeeeee", outputColor: "#f6b7bd",
  interval: 8, phase: 0.3,
  x: 550, y: 200
}
```

| Parameter | What it changes |
| --- | --- |
| Node `color` | Circle fill |
| Node `outputColor` | Outgoing pulse color and the node's arrival ring |
| Node `interval` | Seconds between outputs; use a positive value, such as 2–30 |
| Node `phase` | Seconds before the first output; use 0 or greater |
| Node `hitPitch` | Optional per-node impact pitch in Hz (80–4000); defaults to a small variation of the base pitch |
| Node `label` | Hover label |
| Node `note` | Text typed below the graph on selection; edit the starter text, without the `>` prefix. An empty string hides the note. |
| Node `x`, `y` | Position on the 1280 × 860 canvas |
| Edge `color` | Idle line color |
| Edge `label`, `subcaption` | Hover title and secondary text; currently `""` on every edge. When both are empty, no tooltip appears. |
| Edge `activeColor` | Pulse color; `null` inherits the source node's `outputColor` |
| Edge `from`, `to` | Source and destination node IDs; this sets flow direction |
| Edge `via` | Right-angle bends, ordered from source to destination |
| Global `flowSpeed` | Pulse travel speed in SVG units per second; must be positive |
| Global `dimmedOpacity` | Opacity of unrelated nodes and edges during isolation (0–1; default `0.12`) |
| Global `background`, `labelColor`, `nodeOutline` | Graph background, heading/focus color, and node borders |
| `entrance.enabled` | Enable the Home entrance and return wind; `false` shows the full graph immediately |
| `entrance.blankDuration` | Initial time with only buttons visible, in milliseconds (default `180`) |
| `entrance.nodeDropDuration`, `entrance.nodeStagger` | Drop duration and spacing between node drops, in milliseconds (`620`, `35`) |
| `entrance.dropDistance` | How far above its position each node begins, in SVG units (`160`) |
| `entrance.edgeBuildDuration`, `entrance.edgeStagger` | Edge drawing duration and stagger, in milliseconds (`900`, `20`) |
| `entrance.titleFadeDuration` | Full title fade-in time, starting with the edges, in milliseconds (default `1800`) |
| `entrance.returnDuration` | Blank screen and wind duration before navigating Home (`750` milliseconds) |
| `entrance.soundEnabled`, `entrance.windVolume` | Enable return wind and set its volume (`true`, `0.22`) |
| `typing.characterDelay` | Milliseconds between letters (default `32`; minimum `16`) |
| `typing.punctuationDelay` | Extra milliseconds after punctuation (default `160`) |
| `typing.soundEnabled` | `true` for typing sounds; `false` for silent text |
| `typing.volume` | Sound volume from `0` (silent) to `1`; default `0.16`, matching the pinball volume setting |
| `hitSound.enabled` | Enable/disable mechanical hit sounds independently of typing sounds |
| `hitSound.volume` | Pinball volume from `0` to `1`; default `0.16` |
| `hitSound.duration` | Impact decay in seconds (`0.05`–`1`; default `0.12`) |
| `hitSound.basePitch` | Base pitch in Hz (`80`–`4000`; default `330`); nodes use small, non-melodic pitch variations |
| `pageTransition.enabled` | Enable collapse and page reveal; `false` uses ordinary navigation |
| `pageTransition.destinations` | Each entry sets a page `href`, convergence `node` ID, and accessible `label` |
| `pageTransition.collapseDuration` | Collapse time in milliseconds (default `1800`) |
| `pageTransition.settleDuration` | Charge time at the destination's node after the collapse (default `180`) |
| `pageTransition.waveDuration` | Outward reveal time in milliseconds (default `900`) |
| `pageTransition.waveColor` | The destination node's glow and outward wave color (default `"#c8b89a"`) |
| `pageTransition.waveFillColor` | Subtle expanding wave fill, fading back to the black page background (default `"#181713"`) |
| `pageTransition.soundEnabled` | Wind during collapse and a pop when the node emits its wave; `false` makes the transition silent |
| `pageTransition.windVolume` | Wind volume from `0` to `1` (default `0.22`) |
| `pageTransition.popVolume` | Pop volume from `0` to `1` (default `0.24`) |

An explicit edge `activeColor` takes priority over the source's `outputColor`. Set it to `null` if that connection should follow the node's color. Keep IDs unique; connection endpoints must match a node ID.

The typing sound is generated locally with Web Audio after a node is activated; it uses no audio downloads. Text still works when audio is unavailable or blocked. Reduced-motion preferences show the full note immediately, silently. Typing and sound pause when the page or graph is hidden, and resume when visible. Screen readers receive the complete note once instead of a stream of letters.

Mechanical impacts are synthesized locally using a falling tone, a short buzzy strike, and a low-pass filter. Each selected connection sounds once when the pulse head reaches its destination, synchronized with the node's arrival ring. Simultaneous hits are compressed, with at most twelve impact tails playing at once. These settings do not change node notes or typing sounds.

The page transition synthesizes filtered wind that swells as the graph collapses, followed by a short pop at the wave's release. It unlocks audio on the navigation click and lets the pop finish before changing pages, so the new page does not have to autoplay the effect. Reduced-motion navigation skips these sounds. Leaving the page or returning with Back clears the transition audio.

Collapse routes prefer the configured flow direction. A node that cannot reach the destination that way retraces existing connections instead, which lets terminal branches converge on Project, Experience, or Relationship. Normal graph playback keeps its configured direction. All pages share Home's plain black background.

The graph contains 18 named nodes and 35 directed edges. It follows the white flow reference, arranged in the style of the black reference, with an added Assets node where Needs and Wants converge. Those two nodes now flow into Assets, which flows onward to Satisfaction. Satisfaction is a terminal node with no outgoing edges. The Energy/Relationship feedback is represented by two separately directed paths.

Each source emits on its own clock. Pulses traverse only its outgoing edges and illuminate the destination on arrival. Arrivals do not trigger recursive emissions; feedback loops remain bounded. Multiple pulses can travel along a long connection at once. The animation sleeps when the graph is offscreen or the page is hidden.

Run locally with `python3 -m http.server 8000`, then open `http://localhost:8000/`.
