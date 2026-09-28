# Updating your website

Edit the entries at the top of the JavaScript files below. Save and refresh your local preview to see changes. Both lists display in the order you write them; dates do not automatically sort entries.

The build now turns those same entries into complete HTML. It generates project and memo pages, memo archive pages, a static homepage graph, and a sitemap. Keep editing the source files below; `dist/` is generated and should not be edited or committed.

## Add or edit a memo

Open [js/life-updates.js](js/life-updates.js). Add this object immediately after `const lifeUpdates = [` to put it first, then replace the example text:

```js
{
  slug: "my-new-memo",
  label: "Sep 2026 · Personal",
  title: "My new memo",
  summary: "The short text shown on the memo card.",
  details: "Optional longer text shown when someone opens the memo.",
  pinned: false,
  media: []
},
```

- Use a unique, lowercase, hyphenated `slug`. It is the memo's link identifier, such as `writing.html#my-new-memo`. Keep existing slugs unchanged to preserve shared links.
- Each memo also gets a shareable page at `/html/memos/my-new-memo.html`. Normal card clicks still open the popup; opening the link in a new tab shows the full page.
- `label` is free-form display text: a month/year and category work well.
- Set `pinned: true` to also show the memo under Current Happenings on Home.
- `details` and `media` are optional. Memo text is plain text.
- Total Memos and pagination update automatically. The page shows five entries at a time; `pageSize` in this file controls that number.

To edit an existing memo, find its `title` and change that object's fields. To remove one, delete its entire object.

## Add or edit a project

Open [js/projects.js](js/projects.js). Edit the matching object inside `const projects = [`, or insert this object at the top for a new first row:

```js
{
  slug: "my-new-project",
  title: "My new project",
  type: "personal",
  lastUpdated: "2026-09-27",
  function: "A short description of what this project does.",
  tag: "Robotics · Simulation",
  summary: "What I built and why. This appears in the popup.",
  details: "Optional extra information about the project.",
  chips: ["Python", "MuJoCo"],
  stack: "",
  nodeColor: "#eeeeee",
  media: []
},
```

| Field | Where it appears / accepted values |
| --- | --- |
| `title` | Project name in both the table and popup. |
| `slug` | Optional stable URL name, such as `"my-new-project"`, for `/html/projects/my-new-project.html`. Without it, the URL is derived from the title. Set it before renaming a project if you want its link to stay unchanged. |
| `type` | `"work"`, `"personal"`, or `"school"`. Controls the Type column, filtering, and timeline branch. `""` shows an em dash. |
| `lastUpdated` | Manually set a real date in `YYYY-MM-DD` format. `""` shows an em dash. |
| `function` | The short Function column text. |
| `tag` | Small category text in the popup. |
| `summary` | Main popup description. Existing entries use `description` as a fallback when `summary` is empty. |
| `details` | Additional popup text. |
| `chips` | Technology names used for the popup's technology list. |
| `stack` | Custom technology-list text. Leave empty to use `chips`; the existing `"$%^"` value also uses `chips`. |
| `nodeColor` | The resting node's fill and glow. Keep `"#eeeeee"` for white; `highlightColor` farther down the file controls the active green node. |
| `media` | Images or videos shown in the popup. |

Updating a project does not automatically change its `lastUpdated` date or its position. Edit the date and move the entire object when needed. Project counts and timeline nodes update automatically.

## Add images or videos to either list

Put files in [assets/](assets/), then replace an entry's `media: []` with:

```js
media: [
  {
    type: "image",
    src: "../assets/my-photo.jpg",
    alt: "A description of the image"
  },
  {
    type: "video",
    src: "../assets/my-video.mp4",
    mimeType: "video/mp4"
  }
]
```

Include whichever media items you need. Memo media additionally supports `caption`; memo videos also support `poster: "../assets/preview.jpg"`.

Keep commas between objects and fields. For a double quote inside a string, write `\"`, or use backticks around longer text. Asset names and paths must match exactly, including capitalization.

## Preview and publish

From the repository folder, check your edited files and build:

```sh
node --check js/life-updates.js
node --check js/projects.js
node --test tests/static-content.test.mjs
node scripts/build-site.mjs
python3 -m http.server 8001 --directory dist
```

Open `http://localhost:8001/html/portfolio.html` and check your changed cards, popups, and full entry pages. Rebuild after each content edit when previewing `dist/`. Stop the preview server with Ctrl+C when finished.

Commit the source files you edited, plus any new assets, and push to `main`. The linked Vercel project runs the build and deploys that push automatically. You can do this through VS Code Source Control or the terminal; stage only the files you intend to publish.

Slugs must be unique within each list and use lowercase words separated by hyphens. The build reports invalid or duplicate slugs instead of publishing conflicting pages. Archive links update automatically when memos grow beyond `pageSize`.

The footer date is separate from project dates. To change it again, replace `Current as of September 27, 2026` in the five page files under [html/](html/).
