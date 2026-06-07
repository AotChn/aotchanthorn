(function () {
  // Set `pinned: true` on any memo you want to surface on the homepage.
  const lifeUpdates = [
    {
      slug: "seres-start",
      label: "Jun 2026 · Internship",
      title: "Joining Seres",
      summary: "I think embodied Ai has been one of the most interesting fields of AI that I have been working with. I'm excited to get more experience in building those types of systems. And I hope to learn and contribute alot during my time here.",
      pinned: true
    },
    {
      slug: "horse-bets",
      label: "May 2026 · Game",
      title: "Horse Bets",
      summary: "One of my fond memories from my childhood was going to the horse track with my family. I wanted to build a little horse betting game to capture some of that nostalgia. And after breifly playing a bit of balatro I think I have a fun idea. Release date: IDEALLY AUG 2026",
      pinned: true
    },
    {
      slug: "portfolio-rebuild",
      label: "May 2026 · Personal",
      title: "Website Live",
      summary: "After much deliberation between what I want my site to look like, what to display and all that. I finally got around to rebuilding my site. Still much to be done and added but I have a basket to dump my projects and thoughts into now."
    },
    {
      slug: "mugunghwa-start",
      label: "Jan 2026 · Employment",
      title: "Mugunghwa",
      summary: "I have never worked in food service before but here I am with a korean server job. The work is different what what I'm use to but very managable, and I get free korean food everyday. It does get kinda of busy though but the customers are cool.",
      pinned: false
    },
    {
    slug: "uc-berkeley-start",
    label: "Sep 2023 · Education",
    title: "Entering UC Berkeley",
    summary: "I like the campus very much, it is pretty. Though the food around here is not much to be desired.",
    pinned: false
    }

    
  ];

  // BASE STRUCTURE FOR LIFE UPDATE OBJECTS
  // {
  //   slug: "",
  //   label: "",
  //   title: "",
  //   summary: "",
  //   pinned: false
  // }

  const pageSize = 5;

  function getHashSlug() {
    return window.location.hash.replace("#", "");
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function createHomeCard(update, index) {
    const link = createElement("a", "feature-card feature-card-link");
    link.href = "writing.html#" + update.slug;

    const label = createElement("div", "feature-label", "★");
    const title = createElement("h2", "feature-title", update.title);
    const copy = createElement("p", "feature-copy", update.summary);

    link.appendChild(label);
    link.appendChild(title);
    link.appendChild(copy);

    return link;
  }

  function createUpdateCard(update) {
    const card = createElement("article", "update-card");
    card.id = update.slug;
    card.dataset.updateSlug = update.slug;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Open life update: " + update.title);

    const meta = createElement("div", "update-card-meta", update.label);
    const title = createElement("h2", "update-card-title", update.title);
    const copy = createElement("p", "update-card-copy", update.summary);

    card.appendChild(meta);
    card.appendChild(title);
    card.appendChild(copy);

    return card;
  }

  function renderHomeUpdates() {
    const homeContainer = document.querySelector("[data-home-updates]");
    const pinnedUpdates = lifeUpdates.filter(function (update) {
      return update.pinned;
    });

    if (!homeContainer) return;

    homeContainer.replaceChildren();
    pinnedUpdates.forEach(function (update, index) {
      homeContainer.appendChild(createHomeCard(update, index));
    });
  }

  function renderUpdatesPage() {
    const updatesList = document.querySelector("[data-life-updates-list]");
    const olderButton = document.querySelector("[data-updates-older]");
    const newerButton = document.querySelector("[data-updates-newer]");
    const countLabel = document.querySelector("[data-updates-count]");

    if (!updatesList || !olderButton || !newerButton || !countLabel) return;

    let targetSlug = getHashSlug();
    let shouldScrollToTarget = Boolean(targetSlug);
    const highlightedIndex = lifeUpdates.findIndex(function (update) {
      return update.slug === targetSlug;
    });
    let page = highlightedIndex >= 0 ? Math.floor(highlightedIndex / pageSize) : 0;

    function scrollToUpdateCard(slug) {
      const selectedCard = document.getElementById(slug);
      const siteNav = document.querySelector("nav");
      const navOffset = siteNav ? siteNav.offsetHeight + 24 : 24;

      if (!selectedCard) return;

      document.querySelectorAll(".update-card-active").forEach(function (card) {
        card.classList.remove("update-card-active");
      });

      selectedCard.classList.add("update-card-active");

      window.scrollTo({
        top: selectedCard.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: "smooth"
      });
    }

    function activateUpdateCard(slug, shouldScroll) {
      targetSlug = slug;

      if (window.location.hash !== "#" + slug) {
        window.history.replaceState(null, "", "#" + slug);
      }

      if (shouldScroll) {
        scrollToUpdateCard(slug);
        return;
      }

      const selectedCard = document.getElementById(slug);
      if (!selectedCard) return;

      document.querySelectorAll(".update-card-active").forEach(function (card) {
        card.classList.remove("update-card-active");
      });

      selectedCard.classList.add("update-card-active");
    }

    function renderPage() {
      const start = page * pageSize;
      const end = Math.min(start + pageSize, lifeUpdates.length);

      updatesList.replaceChildren();
      lifeUpdates.slice(start, end).forEach(function (update) {
        updatesList.appendChild(createUpdateCard(update));
      });

      countLabel.textContent = "Total Memos: " + lifeUpdates.length;
      newerButton.disabled = page === 0;
      olderButton.disabled = end >= lifeUpdates.length;

      if (shouldScrollToTarget && targetSlug) {
        requestAnimationFrame(function () {
          scrollToUpdateCard(targetSlug);
        });
        shouldScrollToTarget = false;
      }
    }

    newerButton.addEventListener("click", function () {
      if (page === 0) return;
      page -= 1;
      renderPage();
    });

    olderButton.addEventListener("click", function () {
      if ((page + 1) * pageSize >= lifeUpdates.length) return;
      page += 1;
      renderPage();
    });

    updatesList.addEventListener("click", function (event) {
      const selectedCard = event.target.closest(".update-card");
      if (!selectedCard) return;
      activateUpdateCard(selectedCard.dataset.updateSlug, false);
    });

    updatesList.addEventListener("keydown", function (event) {
      const selectedCard = event.target.closest(".update-card");
      if (!selectedCard) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateUpdateCard(selectedCard.dataset.updateSlug, false);
      }
    });

    window.addEventListener("hashchange", function () {
      const nextSlug = getHashSlug();
      const nextIndex = lifeUpdates.findIndex(function (update) {
        return update.slug === nextSlug;
      });

      if (nextIndex < 0) return;

      targetSlug = nextSlug;
      page = Math.floor(nextIndex / pageSize);
      shouldScrollToTarget = true;
      renderPage();
    });

    renderPage();
  }

  renderHomeUpdates();
  renderUpdatesPage();
})();
