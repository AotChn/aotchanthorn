// OWNER SETTINGS — edit this file, save, and refresh the page to preview.
// Publish this file with the site to apply your settings for every visitor.
// There are no visitor controls or browser-saved overrides for these settings.
//
// NODES
//   note        = text typed below the graph on selection (omit the ">" prefix)
//   color       = node fill color (hex)
//   outputColor = outgoing pulse / arrival ring color (hex)
//   interval    = seconds between outputs (use a positive value, e.g. 2–30)
//   phase       = seconds before the first output (0 or greater)
//   hitPitch    = optional mechanical hit pitch in Hz; omit for an automatic pitch
//   x, y        = position on the 1280 × 860 canvas
//
// EDGES
//   label       = hover title; leave "" for no title
//   subcaption  = hover text below the title; leave "" for no subcaption
//   from / to   = source and destination node IDs; this sets flow direction
//   color       = idle line color (hex)
//   activeColor = pulse color (hex), or null to inherit the source's outputColor
//   via         = [x, y] bends, ordered from source to destination
window.AOT_SYSTEM_GRAPH = {
  background: "#000000",
  labelColor: "#eeeeee",
  nodeOutline: "#858585",
  flowSpeed: 210, // SVG units per second
  dimmedOpacity: 0.12, // Unrelated nodes/edges when a node is selected (0–1)
  entrance: {
    enabled: true,
    blankDuration: 180, // Milliseconds showing only the buttons before nodes appear
    nodeDropDuration: 620,
    nodeStagger: 35, // Milliseconds between each node's drop
    dropDistance: 160, // SVG units above each node's final position
    edgeBuildDuration: 900,
    edgeStagger: 20, // Milliseconds between connections growing from their source
    titleFadeDuration: 1800, // Milliseconds for the title to fade in while the edges draw
    returnDuration: 750, // Blank screen and wind before returning from another page
    soundEnabled: true, // Wind on a Home click; direct visits remain silent
    windVolume: 0.22
  },
  pageTransition: {
    enabled: true,
    destinations: [
      { href: "about.html", node: "satisfaction", label: "About" },
      { href: "work.html", node: "project", label: "Work" },
      { href: "writing.html", node: "experience", label: "Memos" },
      { href: "contact.html", node: "relationship", label: "Contact" }
    ],
    collapseDuration: 1800, // Milliseconds for the graph to flow into the destination's node
    settleDuration: 180, // Brief charge after every node and edge has arrived
    waveDuration: 900, // Milliseconds for the outward wave to reveal the page
    waveColor: "#c8b89a", // Wave outline and glow
    waveFillColor: "#181713", // Subtle warm charcoal wash against the black background
    soundEnabled: true, // Wind during collapse, then a pop as the wave starts
    windVolume: 0.22, // Wind volume (0–1)
    popVolume: 0.24 // Pop volume (0–1)
  },
  hitSound: {
    enabled: true, // Only the selected node's connections or selected edge sound
    volume: 0.16, // Hit volume (0–1); independent of the typing sound
    duration: 0.12, // Short, dry impact decay in seconds
    basePitch: 330 // Mechanical pitch in Hz, with small variations per node
  },
  typing: {
    characterDelay: 32, // Milliseconds per letter; increase for slower typing
    punctuationDelay: 160, // Extra pause after punctuation, in milliseconds
    soundEnabled: true, // Set false for silent typing
    volume: 0.16 // Typing sound volume (0–1); matches the pinball volume
  },
  nodes: [
    {
      id: "needs", label: "Needs",
      note: "Bear necessities.",
      color: "#eeeeee", outputColor: "#f3f33c",
      interval: 7, phase: 1.2,
      x: 210, y: 70
    },
    {
      id: "wants", label: "Wants",
      note: "Good Food, Good Company, and Good Times. >:)",
      color: "#eeeeee", outputColor: "#f3f33c",
      interval: 8, phase: 3.4,
      x: 210, y: 140
    },
    {
      id: "assets", label: "Assets",
      note: "The things acquired to meet needs and fulfill wants.",
      color: "#eeeeee", outputColor: "#f3f33c",
      interval: 8, phase: 2.8,
      x: 25, y: 105
    },
    {
      id: "money", label: "Money",
      note: "Currency in this world that buys me tangibles.",
      color: "#eeeeee", outputColor: "#f6b7bd",
      interval: 8, phase: 0.3,
      x: 550, y: 200
    },
    {
      id: "time", label: "Time",
      note: "Time is unique, It is only expended and cannot be recouped. For humans, it is a finite resource. For me, it is ever fleeting.",
      color: "#eeeeee", outputColor: "#ff616b",
      interval: 6, phase: 0.6,
      x: 210, y: 238
    },
    {
      id: "rest", label: "Rest",
      note: "Zzzzzz",
      color: "#eeeeee", outputColor: "#b8d9ce",
      interval: 9, phase: 2.4,
      x: 390, y: 238
    },
    {
      id: "energy", label: "Energy",
      note: "Energy is capacity. All things done sap it. And it must be expended to get more. The lifeforce to all directed action I take. ",
      color: "#eeeeee", outputColor: "#ff616b",
      interval: 6.5, phase: 1.6,
      x: 185, y: 365
    },
    {
      id: "investment", label: "Investment",
      note: "Time, energy, and resources directed toward future growth.",
      color: "#eeeeee", outputColor: "#c379ff",
      interval: 7, phase: 1,
      x: 450, y: 450
    },
    {
      id: "professional", label: "Professional",
      note: "A pursuit to sell my abilities. In exchange for all I know I get resources to do it all again.",
      color: "#a5c4f0", outputColor: "#ffc353",
      interval: 8, phase: 2,
      x: 740, y: 295
    },
    {
      id: "hobbies", label: "Hobbies",
      note: "A pursuit to express my will upon the world. To give meaning for the time spared to me by the universe.",
      color: "#a5c4f0", outputColor: "#ffc353",
      interval: 9, phase: 3.3,
      x: 740, y: 417
    },
    {
      id: "education", label: "Education",
      note: "A pursuit to obtain competency. To learn a methodidology and a way.",
      color: "#a5c4f0", outputColor: "#ffc353",
      interval: 8.5, phase: 4.8,
      x: 740, y: 539
    },
    {
      id: "project", label: "Project",
      note: "The tangible result of my expenditure of life.",
      color: "#eeeeee", outputColor: "#fa70ff",
      interval: 9, phase: 0.9,
      x: 1095, y: 295
    },
    {
      id: "product", label: "Product",
      note: "A finished output that can feed resources back into the system.",
      color: "#eeeeee", outputColor: "#c8d1e4",
      interval: 10, phase: 4.2,
      x: 1190, y: 153
    },
    {
      id: "travel", label: "Travel",
      note: "Environments that contain a subset of people, perspectives, sights, and scenes.",
      color: "#eeeeee", outputColor: "#fa70ff",
      interval: 10, phase: 2.8,
      x: 1230, y: 492
    },
    {
      id: "relationship", label: "Relationship",
      note: "An Exchange of life.",
      color: "#eeeeee", outputColor: "#5ce0de",
      interval: 8, phase: 3.8,
      x: 450, y: 675
    },
    {
      id: "experience", label: "Experience",
      note: "Experience, It shapes what we know and how to interface with our relationships, Derived from projects (what we've done) and Travel (environments we've been). Often a compass to what we will do.",
      color: "#eeeeee", outputColor: "#5ce0de",
      interval: 9, phase: 1.8,
      x: 1095, y: 675
    },
    {
      id: "knowledge", label: "Knowledge",
      note: "To know and to understand. ",
      color: "#eeeeee", outputColor: "#e4e890",
      interval: 9.5, phase: 3,
      x: 575, y: 721
    },
    {
      id: "satisfaction", label: "Satisfaction",
      note: "Satisfaction is a self defined metric. A sum of a life well lived as perscribe by me, myself, and I.",
      color: "#eeeeee", outputColor: "#f3f33c",
      interval: 8, phase: 4,
      x: 95, y: 814
    }
  ],
  edges: [
    { from: "money", to: "needs", label: "", subcaption: "", via: [[377,200],[377,70]], color: "#cfb9bf", activeColor: null },
    { from: "money", to: "wants", label: "", subcaption: "", via: [[377,200],[377,140]], color: "#cfb9bf", activeColor: null },
    { from: "needs", to: "assets", label: "", subcaption: "", via: [[148,70],[148,105]], color: "#8f70e8", activeColor: "#c4b4ff" },
    { from: "wants", to: "assets", label: "", subcaption: "", via: [[148,140],[148,105]], color: "#8f70e8", activeColor: "#c4b4ff" },
    { from: "assets", to: "satisfaction", label: "", subcaption: "", via: [[25,459],[95,459]], color: "#e8e800", activeColor: null },
    { from: "time", to: "satisfaction", label: "", subcaption: "", via: [[95,238]], color: "#e8e800", activeColor: "#f3f33c" },
    { from: "energy", to: "satisfaction", label: "", subcaption: "", via: [[95,365]], color: "#e8e800", activeColor: "#f3f33c" },
    { from: "relationship", to: "satisfaction", label: "", subcaption: "", via: [[95,675]], color: "#e8e800", activeColor: "#f3f33c" },
    { from: "knowledge", to: "satisfaction", label: "", subcaption: "", via: [[95,721]], color: "#e8e800", activeColor: "#f3f33c" },
    { from: "time", to: "rest", label: "", subcaption: "", via: [], color: "#5f6068", activeColor: null },
    { from: "rest", to: "energy", label: "", subcaption: "", via: [[390,321],[185,321]], color: "#5f6068", activeColor: null },
    { from: "money", to: "investment", label: "", subcaption: "", via: [[550,325],[450,325]], color: "#ff2639", activeColor: null },
    { from: "time", to: "investment", label: "", subcaption: "", via: [[210,316],[450,316]], color: "#ff2639", activeColor: null },
    { from: "energy", to: "investment", label: "", subcaption: "", via: [[318,365],[318,450]], color: "#ff2639", activeColor: null },
    { from: "time", to: "relationship", label: "", subcaption: "", via: [[207,238],[207,465],[447,465],[447,675]], color: "#00b9c1", activeColor: "#5ce0de" },
    { from: "energy", to: "relationship", label: "", subcaption: "", via: [[185,520],[447,520],[447,675]], color: "#00b9c1", activeColor: "#5ce0de" },
    { from: "relationship", to: "energy", label: "", subcaption: "", via: [[441,675],[441,527],[179,527],[179,365]], color: "#008c94", activeColor: null },
    { from: "relationship", to: "investment", label: "", subcaption: "", via: [], color: "#606169", activeColor: null },
    { from: "knowledge", to: "investment", label: "", subcaption: "", via: [[575,626],[455,626],[455,450]], color: "#ff2639", activeColor: "#ff7581" },
    { from: "investment", to: "professional", label: "", subcaption: "", via: [[595,450],[595,295]], color: "#ad32ff", activeColor: null },
    { from: "investment", to: "hobbies", label: "", subcaption: "", via: [[595,450],[595,417]], color: "#ad32ff", activeColor: null },
    { from: "investment", to: "education", label: "", subcaption: "", via: [[595,450],[595,539]], color: "#ad32ff", activeColor: null },
    { from: "professional", to: "project", label: "", subcaption: "", via: [], color: "#ffaa00", activeColor: null },
    { from: "hobbies", to: "project", label: "", subcaption: "", via: [[917,417],[917,295]], color: "#ffaa00", activeColor: null },
    { from: "education", to: "project", label: "", subcaption: "", via: [[917,539],[917,295]], color: "#ffaa00", activeColor: null },
    { from: "professional", to: "travel", label: "", subcaption: "", via: [[740,355],[1230,355]], color: "#3737ff", activeColor: "#8b8bff" },
    { from: "hobbies", to: "travel", label: "", subcaption: "", via: [[740,461],[1230,461]], color: "#3737ff", activeColor: "#8b8bff" },
    { from: "education", to: "travel", label: "", subcaption: "", via: [[740,591],[985,591],[985,461],[1230,461]], color: "#3737ff", activeColor: "#8b8bff" },
    { from: "project", to: "product", label: "", subcaption: "", via: [[1190,295]], color: "#63636b", activeColor: "#c8d1e4" },
    { from: "product", to: "money", label: "", subcaption: "", via: [[872,153],[872,200]], color: "#28c76f", activeColor: "#85f5b5" },
    { from: "project", to: "experience", label: "", subcaption: "", via: [], color: "#d52bfa", activeColor: null },
    { from: "travel", to: "experience", label: "", subcaption: "", via: [[1230,675]], color: "#d52bfa", activeColor: null },
    { from: "travel", to: "relationship", label: "", subcaption: "", via: [[1230,682],[450,682]], color: "#00bdc3", activeColor: "#5ce0de" },
    { from: "experience", to: "relationship", label: "", subcaption: "", via: [], color: "#00bdc3", activeColor: null },
    { from: "experience", to: "knowledge", label: "", subcaption: "", via: [[1095,721]], color: "#00bdc3", activeColor: null }
  ]
};
