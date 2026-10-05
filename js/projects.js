(function () {
  // OWNER SETTINGS — add, remove, or reorder projects here.
  // type: "work" (Professional), "personal", "school", or "competition"; leave "" to show an em dash.
  // lastUpdated: "YYYY-MM-DD" or readable date text like "July 2026"; "" shows an em dash.
  // function: short description in the history row. Full details stay in the popup.
  // nodeColor: resting node fill and glow. The active row uses highlightColor below.
  // All projects share one timeline; type controls the label and filter.
  // Locked types show an access-code prompt when opened. "work" means Professional.
  // Add locked: true to an individual project to lock it outside these types.
  const lockedProjectTypes = ["work"];
  const isProjectLocked = project => lockedProjectTypes.includes(project.type) || project.locked === true;

  const projects = [
    {
      title: "IMU Transform Visualizer",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "July 2026",
      function: "Visualize effects of Matrix transforms on live IMU",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Robot Telemetry and Diagnostics GUI",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "July 2026",
      function: "Live robot telemetry and diagnostics over network",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Sockeye V1",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "September 2026",
      function: "Custom Hardware agnostic robot OS (non-ROS)",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Stochastic Data Scheduler",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "September 2026",
      function: "Method for optimized observation freshness for Multi-Rate robot systems",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Joint-IMU Data Synchronizer",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "September 2026",
      function: "Method for minimizing joint-IMU time sync",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Robot State Estimator",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "August 2026",
      function: "Method for robotic state corrections from errored data",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Module Manager System",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "August 2026",
      function: "Manages dependencies, compatibilities, and resolves paths modules in the Sockeye V1 system",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Robot Upper Body Motion Recorder",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "August 2026",
      function: "Records upper body motions that can be used in real deployment",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      title: "Motion Policy Control Switcher",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "September 2026",
      function: "Allows for runtime switching of locomotion policies",
      tag: "",
      description: "",
      summary: "",
      details: "",
      chips: [],
      stack: "",
      media: []
    },
    {
      tag: "Locomotion · Robotics",
      title: "Robot Reinforcement Training",
      type: "school",
      nodeColor: "#eeeeee",
      lastUpdated: "May 2026",
      function: "Train robot policies from video demonstrations.",
      displayTitleHtml: "Robot <em>Reinforcement</em> Training",
      description:
        "Assembled an end-to-end video-to-robot learning pipeline (Video2Robot, PromptHMR, MJLab) to train policies from raw video demonstrations using imitation learning techniques",
      summary:
        "Assembled an end-to-end video-to-robot learning pipeline (Video2Robot, PromptHMR, MJLab) to train policies from raw video demonstrations using imitation learning techniques",
      details:
        "",
      chips: ["NVIDIA H100", "Python", "MuJoCo", "Domain Randomization"],
      stack: "NVIDIA H100 · PyTorch · MuJoCo · Domain Randomization",
      media: []
    },
    {
      tag: "Gradient Descent · Pokemon",
      title: "Voltorb Flip Machine Learning Solver",
      type: "personal",
      nodeColor: "#eeeeee",
      lastUpdated: "2025",
      function: "Optimize Voltorb Flip moves under uncertainty.",
      displayTitleHtml: "Voltorb Flip <em>Machine Learning</em> Solver",
      description:
        "Constructed a probabilistic decision-making engine using stochastic gradient methods to optimize move selection under uncertainty in the Pokémon mini-game Voltorb Flip.",
      summary:
        "Constructed a probabilistic decision-making engine using stochastic gradient methods to optimize move selection under uncertainty in the Pokémon mini-game Voltorb Flip.",
      details:
        "",
      chips: ["C++", "Python", "Excel", "SFML"],
      stack: "C++ · Python · Excel · SFML",
      media: []
    },
    {
      tag: "Neuroevolution · Neural Networks",
      title: "Evolution N.E.A.T Simulator",
      type: "work",
      nodeColor: "#eeeeee",
      lastUpdated: "2024",
      function: "Evolve neural network structures and weights.",
      displayTitleHtml: "Evolution <em>N.E.A.T</em> Simulator",
      description:
        "Implemented NeuroEvolution of Augmenting Topologies (NEAT) from scratch, evolving neural network structure and weights without backpropagation",
      summary:
        "Implemented NeuroEvolution of Augmenting Topologies (NEAT) from scratch, evolving neural network structure and weights without backpropagation",
      details:
        "",
      chips: ["C++", "SDL3", "NEAT"],
      stack: "$%^",
      media: []
    },
    {
      tag: "",
      title: "Guppy AI Speech Trainer",
      type: "competition",
      nodeColor: "#eeeeee",
      lastUpdated: "2025",
      function: "AI-assisted speech training.",
      displayTitleHtml: "Guppy <em>AI</em> Speech Trainer",
      description:
        "To be updated",
      summary:
        "",
      details:
        "",
      chips: ["Whisper", "Flask"],
      stack: "",
      media: []
    },
    {
      tag: "",
      title: "Navify Map Pathfinder ",
      type: "competition",
      nodeColor: "#eeeeee",
      lastUpdated: "2023",
      function: "Find routes on a map.",
      displayTitleHtml: "Navify <em>Map</em> Pathfinder ",
      description:
        "To be updated",
      summary:
        "",
      details:
        "",
      chips: ["C++", "Flask", "OpenCV"],
      stack: "$%^",
      media: []
    },
    {
      tag: "",
      title: "Chip8 Emulator",
      type: "personal",
      nodeColor: "#eeeeee",
      lastUpdated: "2023",
      function: "Emulate CHIP-8 programs.",
      displayTitleHtml: "Chip8 <em>Emulator</em>",
      description:
        "To be updated",
      summary:
        "",
      details:
        "",
      chips: ["C++", "SFML"],
      stack: "",
      media: []
    },
    {
      tag: "",
      title: "SQL from Scratch",
      type: "school",
      nodeColor: "#eeeeee",
      lastUpdated: "2023",
      function: "Run SQL queries in a custom C++ database engine.",
      displayTitleHtml: "<em>SQL</em> from scratch",
      description:
        "Built a primative terminal based SQL engine in c++ that supports basic select, insert, update, and delete statements with indexing and query optimization. Utilizes custom B+ tree, array implementation",
      summary:
        "",
      details:
        "",
      chips: ["C++", "B+ Tree", "Query Optimization"],
      stack: "$%^",
      media: []
    },
    {
      tag: "",
      title: "Maze Mini Game",
      type: "school",
      nodeColor: "#eeeeee",
      lastUpdated: "2024",
      function: "Explore a maze in 2D and first person.",
      displayTitleHtml: "Maze Mini <em>Game<em>",
      description:
        "Using Princetons Standard Java library, built a simple top down maze game with mini maps, sprite animation rendering, as well as raycasting and supports pseudo 3D first person view",
      summary:
        "",
      details:
        "",
      chips: ["Java", "Princeton StdLib"],
      stack: "$%^",
      media: []
    },
    
    {
      tag: "",
      title: "Graphing Calculator App",
      type: "school",
      nodeColor: "#eeeeee",
      lastUpdated: "2023",
      function: "Parse functions and plot interactive graphs.",
      displayTitleHtml: "Graphing Calculator",
      description:
        "Built fully functional graphing calculator with full interface and support for complex natural language text parsing and compound functions. Implemented custom expression parser and evaluator with support for variables, functions, and order of operations. Supports function saving and loading as well as graph plotting with custom windowing, scaling, zooming, and panning.",
      summary:
        "",
      details:
        "",
      chips: ["C++", "SFML"],
      stack: "$%^",
      media: []
    },

    // {
    //   tag: "",
    //   title: "",
    //   displayTitleHtml: "c <em>x</em> c",
    //   description:
    //     "To be updated",
    //   summary:
    //     "",
    //   details:
    //     "",
    //   chips: [],
    //   stack: "$%^",
    //   media: []
    // }

    //if "$%^" for stack then copy chip
  ];

  // The static build reads this same list; keep editing the entries above.
  window.AOT_PROJECTS = projects;
  window.AOT_IS_PROJECT_LOCKED = isProjectLocked;
  if (typeof document === "undefined") return;

  const projectsList = document.querySelector("[data-projects-list]");
  const historyTable = document.querySelector("[data-project-history]");
  const historyGraph = document.querySelector("[data-project-history-graph]");
  const projectFilter = document.querySelector("[data-project-filter]");
  const projectSort = document.querySelector("[data-project-sort]");
  const projectCount = document.querySelector("[data-project-count]");
  const projectEmpty = document.querySelector("[data-project-empty]");
  const projectRows = new Map([...projectsList?.querySelectorAll(".project-row") || []]
    .map(row => [Number(row.dataset.projectIndex), row]));
  projectRows.forEach(row => row.querySelector(".project-title-button").setAttribute("aria-haspopup", "dialog"));
  const projectModal = document.getElementById("project-modal");
  const modalCard = projectModal?.querySelector(".project-modal-card");
  const modalContent = document.getElementById("project-modal-content");
  const modalLock = document.getElementById("project-modal-lock");
  const modalAccessCode = document.getElementById("project-access-code");
  const modalTitle = document.getElementById("project-modal-title");
  const modalTag = document.getElementById("project-modal-tag");
  const modalSummary = document.getElementById("project-modal-summary");
  const modalMedia = document.getElementById("project-modal-media");
  const modalDetails = document.getElementById("project-modal-details");
  const modalStack = document.getElementById("project-modal-stack");
  const modalCloseButton = document.querySelector(".project-modal-close");

  let lastProjectTrigger = null;
  let hoveredProject = null, focusedProject = null, selectedProject = null;
  const highlightColor = "#a4ffcb";
  const projectTypes = { work: "Professional", personal: "Personal", school: "School", competition: "Competition" };
  const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function highlightProjectNode() {
    const highlighted = selectedProject ?? hoveredProject ?? focusedProject;
    historyGraph?.querySelectorAll(".project-history-node").forEach(node => {
      const index = node.dataset.projectIndex;
      node.classList.toggle("is-highlighted", index === highlighted);
      node.style.setProperty("--project-node-color", index === highlighted
        ? highlightColor : projects[Number(index)].nodeColor || "#eeeeee");
    });
  }

  function createProjectItem(project, index) {
    const row = createElement("tr", "project-row");
    const type = Object.hasOwn(projectTypes, project.type) ? project.type : "unset";
    row.dataset.projectIndex = String(index);
    row.dataset.projectType = type;

    const graph = createElement("td", "project-graph-cell");
    const typeCell = createElement("td", "project-type-cell");
    typeCell.append(createElement("span", "project-mobile-label", "Type"));
    typeCell.append(createElement("span", type === "unset" ? "project-unset" : "project-type-badge", projectTypes[type] || "—"));

    const nameCell = createElement("td", "project-name-cell");
    const title = createElement("a", "project-title-button", project.title.trim());
    title.href = window.AOT_CONTENT_URLS.project(project);
    title.setAttribute("aria-haspopup", "dialog");
    title.setAttribute("aria-label", "Open project: " + project.title.trim());
    nameCell.append(title);

    const functionCell = createElement("td", "project-function-cell");
    functionCell.append(createElement("span", "project-mobile-label", "Function"));
    functionCell.append(createElement("p", "project-function-copy", project.function || project.description || "—"));

    const updatedCell = createElement("td", "project-updated-cell");
    updatedCell.append(createElement("span", "project-mobile-label", "Last updated"));
    const dateText = String(project.lastUpdated ?? "").trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? new Date(dateText + "T00:00:00Z") : null;
    const validDate = date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateText;
    const updated = createElement(validDate ? "time" : "span", "project-updated", validDate ? dateFormatter.format(date) : dateText || "—");
    if (validDate) updated.dateTime = dateText;
    updatedCell.append(updated);
    row.append(graph, typeCell, nameCell, functionCell, updatedCell);
    return row;
  }

  function drawHistoryGraph() {
    if (!historyGraph || !historyTable) return;
    historyGraph.replaceChildren();
    const rows = [...projectsList.querySelectorAll(".project-row")];
    if (!rows.length) { historyTable.projectEntrance?.refresh(); return; }
    const bounds = historyTable.getBoundingClientRect();
    const width = historyGraph.getBoundingClientRect().width;
    historyGraph.setAttribute("viewBox", "0 0 " + width + " " + bounds.height);
    const nodeX = width * .4;
    const points = rows.map(row => {
      const title = row.querySelector(".project-title-button").getBoundingClientRect();
      const project = projects[Number(row.dataset.projectIndex)];
      return { color: project.nodeColor || "#eeeeee", index: row.dataset.projectIndex,
        y: title.top + title.height / 2 - bounds.top };
    });
    function draw(tag, attributes, parent = historyGraph) {
      const shape = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attributes).forEach(([key, value]) => shape.setAttribute(key, value));
      parent.append(shape);
      return shape;
    }
    const top = Math.max(0, points[0].y - 22), bottom = Math.min(bounds.height, points.at(-1).y + 22);
    draw("path", { class: "project-history-trunk", d: `M${nodeX} ${top} V${bottom}` });
    points.forEach((point, index) => {
      const node = draw("g", { class: "project-history-node", transform: `translate(${nodeX} ${point.y})`,
        "data-node-x": nodeX, "data-node-y": point.y, "data-project-index": point.index });
      node.style.setProperty("--project-node-color", point.color);
      node.style.setProperty("--project-pulse-delay", (-index * .4) + "s");
      draw("circle", { class: "project-history-halo", r: 8 }, node);
      draw("circle", { class: "project-history-dot", r: 5 }, node);
      draw("circle", { class: "project-history-dot-core", r: 1.3 }, node);
    });
    highlightProjectNode();
    historyTable.projectEntrance?.refresh();
  }

  function createMediaNode(item) {
    const frame = createElement("div", "project-modal-media-frame");

    if (item.type === "video") {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      window.AOT_AUDIO?.trackMedia(video);

      const source = document.createElement("source");
      source.src = item.src;
      if (item.mimeType) source.type = item.mimeType;

      video.appendChild(source);
      frame.appendChild(video);
      return frame;
    }

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt || "";
    frame.appendChild(image);
    return frame;
  }

  function getProjectStackText(project) {
    if (project.stack === "$%^" || !project.stack) {
      return (project.chips || []).join(" · ");
    }

    return project.stack || "";
  }

  function openProjectModal(project, trigger) {
    selectedProject = trigger.closest(".project-row").dataset.projectIndex;
    highlightProjectNode();
    const locked = isProjectLocked(project);
    modalCard.classList.toggle("is-locked", locked);
    modalContent.hidden = locked;
    modalLock.hidden = !locked;
    // Placeholder only: codes are not submitted, stored, or validated yet.
    modalAccessCode.value = "";
    if (locked) {
      modalCard.removeAttribute("aria-labelledby");
      modalCard.setAttribute("aria-label", project.title.trim() + " — details locked");
    } else {
      modalCard.removeAttribute("aria-label");
      modalCard.setAttribute("aria-labelledby", "project-modal-title");
    }
    modalTitle.textContent = locked ? "" : project.title || "";
    modalTag.textContent = locked ? "" : project.tag || "";
    modalSummary.textContent = locked ? "" : project.summary || project.description || "";
    modalDetails.textContent = locked ? "" : project.details || "";
    modalStack.textContent = locked ? "" : getProjectStackText(project);
    modalMedia.querySelectorAll("video").forEach(video => video.pause());
    modalMedia.replaceChildren();

    if (!locked && project.media && project.media.length > 0) {
      project.media.forEach(function (item) {
        modalMedia.appendChild(createMediaNode(item));
      });
      modalMedia.hidden = false;
    } else {
      modalMedia.hidden = true;
    }

    projectModal.hidden = false;
    modalCard.scrollTop = 0;
    document.body.classList.add("modal-open");
    lastProjectTrigger = trigger;
    modalCloseButton.focus({ preventScroll: true });
  }

  function closeProjectModal() {
    projectModal.querySelectorAll("video").forEach(video => video.pause());
    modalAccessCode.value = "";
    projectModal.hidden = true;
    document.body.classList.remove("modal-open");
    selectedProject = null;
    if (lastProjectTrigger) lastProjectTrigger.focus({ preventScroll: true });
    highlightProjectNode();
  }

  function renderProjects() {
    if (!projectsList) return;

    hoveredProject = focusedProject = null;
    projectsList.replaceChildren();
    let count = 0;
    window.AOT_SORT_PROJECTS(projects, projectSort?.value || "newest").forEach(function ({ project, index }) {
      if (projectFilter && projectFilter.value !== "all" && project.type !== projectFilter.value) return;
      if (!projectRows.has(index)) projectRows.set(index, createProjectItem(project, index));
      projectsList.appendChild(projectRows.get(index));
      count++;
    });
    if (projectCount) projectCount.textContent = count + (count === 1 ? " project" : " projects");
    if (projectEmpty) {
      projectEmpty.textContent = count ? "" : "No projects match this type.";
      projectEmpty.hidden = count !== 0;
    }
    drawHistoryGraph();
  }

  if (!projectsList || !projectModal || !modalCloseButton) return;

  renderProjects();
  if (projectFilter) projectFilter.disabled = false;
  if (projectSort) projectSort.disabled = false;
  historyTable.projectEntrance = window.createProjectsEntrance?.(historyTable.closest("main"), historyTable);
  projectFilter?.addEventListener("change", renderProjects);
  projectSort?.addEventListener("change", renderProjects);
  if ("ResizeObserver" in window) new ResizeObserver(drawHistoryGraph).observe(historyTable);
  else window.addEventListener("resize", drawHistoryGraph);
  document.fonts?.ready.then(drawHistoryGraph);

  projectsList.addEventListener("pointerover", event => {
    if (event.pointerType === "touch") return;
    hoveredProject = event.target.closest(".project-row")?.dataset.projectIndex ?? null;
    highlightProjectNode();
  });
  projectsList.addEventListener("pointerout", event => {
    if (event.pointerType === "touch") return;
    hoveredProject = event.relatedTarget?.closest(".project-row")?.dataset.projectIndex ?? null;
    highlightProjectNode();
  });
  projectsList.addEventListener("focusin", event => {
    focusedProject = event.target.closest(".project-row")?.dataset.projectIndex ?? null;
    highlightProjectNode();
  });
  projectsList.addEventListener("focusout", event => {
    focusedProject = event.relatedTarget?.closest(".project-row")?.dataset.projectIndex ?? null;
    highlightProjectNode();
  });

  projectsList.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const row = event.target.closest(".project-row");
    if (!row) return;
    event.preventDefault();
    openProjectModal(projects[Number(row.dataset.projectIndex)], row.querySelector(".project-title-button"));
  });
  projectsList.addEventListener("keydown", function (event) {
    if (event.key !== " " || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const title = event.target.closest(".project-title-button");
    if (!title) return;
    event.preventDefault();
    const row = title.closest(".project-row");
    openProjectModal(projects[Number(row.dataset.projectIndex)], title);
  });

  modalCloseButton.addEventListener("click", closeProjectModal);
  projectModal.addEventListener("click", function (event) {
    if (event.target.dataset.closeModal === "true") closeProjectModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !projectModal.hidden) closeProjectModal();
  });
})();
