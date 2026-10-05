(function () {
  "use strict";

  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

  function dateKey(value) {
    const text = String(value ?? "").trim().toLowerCase();
    const iso = text.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    let year, month, day;
    if (iso) {
      [, year, month = "01", day = "01"] = iso;
    } else {
      const named = text.match(/^([a-z]+)\.?\s+(\d{4})$/);
      if (!named) return null;
      const monthIndex = months.findIndex(name => name === named[1] || name.slice(0, 3) === named[1] || (name === "september" && named[1] === "sept"));
      if (monthIndex < 0) return null;
      year = named[2];
      month = String(monthIndex + 1).padStart(2, "0");
      day = "01";
    }
    // Partial dates sort at the start of their month/year; their display stays unchanged.
    const canonical = `${year}-${month}-${day}`;
    const date = new Date(canonical + "T00:00:00Z");
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === canonical ? date.getTime() : null;
  }

  // Preserve original indices for row reuse, project popups, and node highlights.
  window.AOT_SORT_PROJECTS = function (projects, order = "newest") {
    return projects.map((project, index) => ({ project, index, date: dateKey(project.lastUpdated) }))
      .sort((a, b) => {
        if (a.date === null && b.date !== null) return 1;
        if (b.date === null && a.date !== null) return -1;
        return (order === "oldest" ? a.date - b.date : b.date - a.date) || a.index - b.index;
      })
      .map(({ project, index }) => ({ project, index }));
  };
})();
