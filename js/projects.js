(function () {
  // Add, remove, or reorder projects here. Each object powers both the list card and the popup.
  const projects = [
    {
      tag: "Locomotion · Robotics",
      title: "Robot Reinforcement Training",
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
      displayTitleHtml: "Evolution <em>N.E.A.T</em> Simulator",
      description:
        "Implemented NeuroEvolution of Augmenting Topologies (NEAT) from scratch, evolving neural network structure and weights without backpropagation",
      summary:
        "Implemented NeuroEvolution of Augmenting Topologies (NEAT) from scratch, evolving neural network structure and weights without backpropagation",
      details:
        "",
      chips: ["C++", "SDL3", "NEAT"],
      stack: "",
      media: []
    }
    // {
    //   tag: "",
    //   title: "",
    //   displayTitleHtml: "c <em>x</em> c",
    //   description:
    //     "",
    //   summary:
    //     "",
    //   details:
    //     "",
    //   chips: [],
    //   stack: "",
    //   media: []
    // }
  ];

  const projectsList = document.querySelector("[data-projects-list]");
  const projectModal = document.getElementById("project-modal");
  const modalTitle = document.getElementById("project-modal-title");
  const modalTag = document.getElementById("project-modal-tag");
  const modalSummary = document.getElementById("project-modal-summary");
  const modalMedia = document.getElementById("project-modal-media");
  const modalDetails = document.getElementById("project-modal-details");
  const modalStack = document.getElementById("project-modal-stack");
  const modalCloseButton = document.querySelector(".project-modal-close");

  let lastProjectTrigger = null;

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function createProjectItem(project, index) {
    const article = createElement("article", "project-item");
    const number = createElement("span", "proj-num", String(index + 1).padStart(2, "0"));
    const body = createElement("div", "proj-body");
    const tag = createElement("div", "proj-tag", project.tag);
    const title = createElement("div", "proj-title");
    const description = createElement("div", "proj-desc", project.description);
    const chips = createElement("div", "proj-chips");
    const arrow = createElement("span", "proj-arrow", "→");

    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-haspopup", "dialog");
    article.setAttribute("aria-label", "Open project: " + project.title);
    article.dataset.projectIndex = String(index);

    title.innerHTML = project.displayTitleHtml || project.title;

    project.chips.forEach(function (chipLabel) {
      chips.appendChild(createElement("span", "chip", chipLabel));
    });

    body.appendChild(tag);
    body.appendChild(title);
    body.appendChild(description);
    body.appendChild(chips);

    article.appendChild(number);
    article.appendChild(body);
    article.appendChild(arrow);

    return article;
  }

  function createMediaNode(item) {
    const frame = createElement("div", "project-modal-media-frame");

    if (item.type === "video") {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";

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

  function openProjectModal(project, trigger) {
    modalTitle.textContent = project.title || "";
    modalTag.textContent = project.tag || "";
    modalSummary.textContent = project.summary || "";
    modalDetails.textContent = project.details || "";
    modalStack.textContent = project.stack || "";
    modalMedia.replaceChildren();

    if (project.media && project.media.length > 0) {
      project.media.forEach(function (item) {
        modalMedia.appendChild(createMediaNode(item));
      });
      modalMedia.hidden = false;
    } else {
      modalMedia.hidden = true;
    }

    projectModal.hidden = false;
    document.body.classList.add("modal-open");
    lastProjectTrigger = trigger;
    modalCloseButton.focus();
  }

  function closeProjectModal() {
    projectModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastProjectTrigger) lastProjectTrigger.focus();
  }

  function renderProjects() {
    if (!projectsList) return;

    projectsList.replaceChildren();
    projects.forEach(function (project, index) {
      projectsList.appendChild(createProjectItem(project, index));
    });
  }

  if (!projectsList || !projectModal || !modalCloseButton) return;

  renderProjects();

  projectsList.addEventListener("click", function (event) {
    const projectTrigger = event.target.closest(".project-item");
    if (!projectTrigger) return;

    const projectIndex = Number(projectTrigger.dataset.projectIndex);
    openProjectModal(projects[projectIndex], projectTrigger);
  });

  projectsList.addEventListener("keydown", function (event) {
    const projectTrigger = event.target.closest(".project-item");
    if (!projectTrigger) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const projectIndex = Number(projectTrigger.dataset.projectIndex);
      openProjectModal(projects[projectIndex], projectTrigger);
    }
  });

  modalCloseButton.addEventListener("click", closeProjectModal);
  projectModal.addEventListener("click", function (event) {
    if (event.target.dataset.closeModal === "true") closeProjectModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !projectModal.hidden) closeProjectModal();
  });
})();
