(function () {
  // Set `pinned: true` on any memo you want to surface on the homepage.
  // Keep entries ordered newest to oldest; cards follow this list.
  const lifeUpdates = [
    {
      slug: "website-2",
      label: "September 2026",
      title: "Website 2",
      summary: "Another major website overhaul! This time I wanted to add more tiny components that represented me. And clear out misc things I didn’t like. I find it all real novel. Enjoy !",
      pinned: true
    },
    {
      slug: "sockeye-v1",
      label: "September 2026",
      title: "Sockeye V1",
      summary: "I have been developing a full robot deployment os and am approaching the first release. It has been very challenging and I have gone so far from where I began. I think I will name it sockeye after the red salmon.",
      pinned: true
    },
    {
      slug: "seres-start",
      label: "Jun 2026",
      title: "Joining Seres",
      summary: "I think embodied Ai has been one of the most interesting fields of AI that I have been working with. I'm excited to get more experience in building those types of systems. And I hope to learn and contribute alot during my time here.",
      media: [
        {
          type: "image",
          src: "../assets/seres-logo.svg",
          alt: "Seres logo with red lettering, black circular lines, and the Chinese name 赛力斯",
          cardPosition: "right"
        }
      ],
      pinned: false
    },
    {
      slug: "horse-bets",
      label: "May 2026",
      title: "Horse Bets",
      summary: "One of my fond memories from my childhood was going to the horse track with my family. I wanted to build a little horse betting game to capture some of that nostalgia. And after breifly playing a bit of balatro I think I have a fun idea. Release date: TBD",
      media: [
        {
          type: "video",
          src: "../assets/horse_bets.mp4",
          mimeType: "video/mp4",
          caption: "Early Dev footage"
        }
      ],
      pinned: false
    },
    {
      slug: "portfolio-rebuild",
      label: "May 2026",
      title: "My Website is Live",
      summary: "After much deliberation between what I want my site to look like, what to display and all that. I finally got around to rebuilding my site. Still much to be done and added but I have a basket to dump my projects and thoughts into now."
    },
    {
      slug: "chula-vista-2",
      label: "April 2026",
      title: "A trip to chula vista 2",
      summary: "1000 miles in 2 days for an archery tournament and I disappointed did not perform well. Most likely my last collegiate one. Was fun though >:)",
      pinned: false
    },
    {
      slug: "chula-vista",
      label: "February 2026",
      title: "A trip to chula vista",
      summary: "Never knew San Diego was so pretty. I wish I had my normal release </3",
      pinned: false
    },
    {
      slug: "mugunghwa-start",
      label: "Jan 2026",
      title: "Mugunghwa",
      cardImage: {
        src: "../assets/mugunghwa-logo.png",
        alt: "Mugunghwa flower emblem",
        wordmark: "MUGUNGHWA",
        subtitle: "KOREAN RESTAURANT"
      },
      summary: "I have never worked in food service before but here I am with a korean server job. The work is different what what I'm use to but very managable, and I get free korean food everyday. It does get kinda of busy though but the customers are cool.",
      pinned: false
    },
    {
      slug: "westies",
      label: "April 2025",
      title: "Westies",
      summary: "My first archery tournament and it is so windy! Long Beach has a big blue pyramid apparently second largest in the US after the bass pro shop.",
      pinned: false
    },
    {
    slug: "uc-berkeley-start",
    label: "Sep 2023",
    title: "Entering college",
    summary: "I like the campus very much, it is pretty. Though the food around here is not much to be desired.",
    media: [
      {
        type: "image",
        src: "../assets/berkeley-logo.png",
        alt: "Official UC Berkeley wordmark in California Gold on Berkeley Blue",
        caption: "Official UC Berkeley wordmark.",
        cardPosition: "right"
      }
    ],
    pinned: false
    }

    
  ];

  // BASE STRUCTURE FOR LIFE UPDATE OBJECTS
  // {
  //   slug: "",
  //   label: "",
  //   title: "",
  //   summary: "",
  //   details: "",
  //   media: [
  //     {
  //       type: "image",
  //       src: "../assets/example.jpg",
  //       alt: "",
  //       caption: ""
  //     },
  //     {
  //       type: "video",
  //       src: "../assets/example.mp4",
  //       mimeType: "video/mp4",
  //       poster: "",
  //       caption: ""
  //     }
  //   ],
  //   pinned: false
  // }

  const pageSize = 5;
  // The build reads these values without running any browser rendering code.
  window.AOT_LIFE_UPDATES = lifeUpdates;
  window.AOT_MEMO_PAGE_SIZE = pageSize;
  if (typeof document === "undefined") return;

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
    const card = createElement("a", "update-card");
    const cardImage = update.cardImage || update.media?.find(item => item.type === "image" && item.cardPosition);
    if (cardImage?.cardPosition === "right") card.dataset.imagePosition = "right";
    card.href = window.AOT_CONTENT_URLS.memo(update);
    card.id = update.slug;
    card.dataset.updateSlug = update.slug;
    card.tabIndex = 0;
    card.setAttribute("aria-haspopup", "dialog");

    const meta = createElement("div", "update-card-meta", update.label);
    const title = createElement("h2", "update-card-title", update.title);
    const copy = createElement("p", "update-card-copy", update.summary);

    card.appendChild(meta);
    card.appendChild(title);
    if (cardImage) card.appendChild(createMemoImage(cardImage));
    card.appendChild(copy);

    return card;
  }

  function createMemoImage(item) {
    const figure = createElement("figure", "memo-card-image" + (item.wordmark ? " memo-card-image-wordmark" : ""));
    const image = createElement("img");
    image.src = item.src;
    image.alt = item.alt || "";
    image.loading = "lazy";
    image.decoding = "async";
    figure.appendChild(image);
    if (item.wordmark) {
      const text = createElement("div", "memo-card-wordmark");
      text.appendChild(createElement("span", "memo-card-wordmark-name", item.wordmark));
      if (item.subtitle) text.appendChild(createElement("span", "memo-card-wordmark-subtitle", item.subtitle));
      figure.appendChild(text);
    }
    return figure;
  }

  function createMediaNode(item) {
    const entry = createElement("figure", "project-modal-media-entry");
    const frame = createElement("div", "project-modal-media-frame");

    if (item.type === "video") {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      window.AOT_AUDIO?.trackMedia(video);

      if (item.poster) video.poster = item.poster;

      const source = document.createElement("source");
      source.src = item.src;
      if (item.mimeType) source.type = item.mimeType;

      video.appendChild(source);
      frame.appendChild(video);
    } else {
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt || "";
      frame.appendChild(image);
    }

    entry.appendChild(frame);

    if (item.caption) {
      entry.appendChild(createElement("figcaption", "project-modal-media-caption", item.caption));
    }

    return entry;
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
    const memoModal = document.getElementById("memo-modal");
    const memoModalTag = document.getElementById("memo-modal-tag");
    const memoModalTitle = document.getElementById("memo-modal-title");
    const memoModalSummary = document.getElementById("memo-modal-summary");
    const memoModalMedia = document.getElementById("memo-modal-media");
    const memoModalDetails = document.getElementById("memo-modal-details");
    const memoModalClose = document.getElementById("memo-modal-close");

    if (!updatesList || !olderButton || !newerButton || !countLabel || !memoModal || !memoModalTag || !memoModalTitle || !memoModalSummary || !memoModalMedia || !memoModalDetails || !memoModalClose) return;
    const cards = new Map([...updatesList.querySelectorAll(".update-card")]
      .map(card => [card.dataset.updateSlug, card]));
    cards.forEach(card => card.setAttribute("aria-haspopup", "dialog"));

    let targetSlug = getHashSlug();
    let shouldScrollToTarget = Boolean(targetSlug);
    let shouldOpenTargetModal = Boolean(targetSlug);
    let lastMemoTrigger = null;
    const highlightedIndex = lifeUpdates.findIndex(function (update) {
      return update.slug === targetSlug;
    });
    let page = highlightedIndex >= 0 ? Math.floor(highlightedIndex / pageSize) : Number(updatesList.dataset.page) || 0;

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

    function openMemoModal(update, trigger) {
      memoModalTag.textContent = update.label || "";
      memoModalTitle.textContent = update.title || "";
      memoModalSummary.textContent = update.summary || "";
      memoModalMedia.replaceChildren();
      if (update.cardImage) memoModalMedia.appendChild(createMemoImage(update.cardImage));

      if (update.details) {
        memoModalDetails.textContent = update.details;
        memoModalDetails.hidden = false;
      } else {
        memoModalDetails.textContent = "";
        memoModalDetails.hidden = true;
      }

      if (update.media && update.media.length > 0) {
        update.media.forEach(function (item) {
          memoModalMedia.appendChild(createMediaNode(item));
        });
      }
      memoModalMedia.hidden = !memoModalMedia.childElementCount;

      memoModal.hidden = false;
      memoModal.querySelector(".project-modal-card").scrollTop = 0;
      document.body.classList.add("modal-open");
      lastMemoTrigger = trigger;
      memoModalClose.focus({ preventScroll: true });
    }

    function closeMemoModal() {
      memoModal.querySelectorAll("video").forEach(video => video.pause());
      memoModal.hidden = true;
      document.body.classList.remove("modal-open");
      if (lastMemoTrigger) lastMemoTrigger.focus({ preventScroll: true });
    }

    function findUpdateBySlug(slug) {
      return lifeUpdates.find(function (update) {
        return update.slug === slug;
      });
    }

    function renderPage() {
      const start = page * pageSize;
      const end = Math.min(start + pageSize, lifeUpdates.length);

      updatesList.replaceChildren();
      lifeUpdates.slice(start, end).forEach(function (update) {
        if (!cards.has(update.slug)) cards.set(update.slug, createUpdateCard(update));
        updatesList.appendChild(cards.get(update.slug));
      });

      countLabel.textContent = "Total Memos: " + lifeUpdates.length;
      [[newerButton, page === 0, page - 1], [olderButton, end >= lifeUpdates.length, page + 1]]
        .forEach(([link, disabled, next]) => {
          link.setAttribute("aria-disabled", String(disabled));
          link.tabIndex = disabled ? -1 : 0;
          link.href = window.AOT_CONTENT_URLS.memoPage(disabled ? page : Math.max(0, next));
        });

      if (shouldScrollToTarget && targetSlug) {
        requestAnimationFrame(function () {
          scrollToUpdateCard(targetSlug);
          if (shouldOpenTargetModal) {
            const selectedCard = document.getElementById(targetSlug);
            const selectedUpdate = findUpdateBySlug(targetSlug);
            if (selectedCard && selectedUpdate) {
              openMemoModal(selectedUpdate, selectedCard);
            }
            shouldOpenTargetModal = false;
          }
        });
        shouldScrollToTarget = false;
      }
    }

    newerButton.addEventListener("click", function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (page === 0) return;
      page -= 1;
      window.history.replaceState(null, "", window.AOT_CONTENT_URLS.memoPage(page));
      renderPage();
    });

    olderButton.addEventListener("click", function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if ((page + 1) * pageSize >= lifeUpdates.length) return;
      page += 1;
      window.history.replaceState(null, "", window.AOT_CONTENT_URLS.memoPage(page));
      renderPage();
    });

    updatesList.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const selectedCard = event.target.closest(".update-card");
      if (!selectedCard) return;
      event.preventDefault();

      const selectedUpdate = lifeUpdates.find(function (update) {
        return update.slug === selectedCard.dataset.updateSlug;
      });

      activateUpdateCard(selectedCard.dataset.updateSlug, false);
      shouldOpenTargetModal = false;
      if (selectedUpdate) openMemoModal(selectedUpdate, selectedCard);
    });

    updatesList.addEventListener("keydown", function (event) {
      const selectedCard = event.target.closest(".update-card");
      if (!selectedCard) return;

      if (event.key === " " && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        const selectedUpdate = lifeUpdates.find(function (update) {
          return update.slug === selectedCard.dataset.updateSlug;
        });
        activateUpdateCard(selectedCard.dataset.updateSlug, false);
        shouldOpenTargetModal = false;
        if (selectedUpdate) openMemoModal(selectedUpdate, selectedCard);
      }
    });

    memoModalClose.addEventListener("click", closeMemoModal);
    memoModal.addEventListener("click", function (event) {
      if (event.target.dataset.closeMemoModal === "true") closeMemoModal();
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
      shouldOpenTargetModal = true;
      renderPage();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !memoModal.hidden) closeMemoModal();
    });

    renderPage();
  }

  renderHomeUpdates();
  renderUpdatesPage();
})();
