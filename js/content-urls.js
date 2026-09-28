(function () {
  "use strict";
  // Shared by the browser and build so entry links always agree.
  window.AOT_CONTENT_URLS = {
    projectSlug(project) {
      return project.slug || project.title.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    },
    project(project) { return "projects/" + this.projectSlug(project) + ".html"; },
    memo(memo) { return "memos/" + memo.slug + ".html"; },
    memoPage(page) { return page === 0 ? "writing.html" : "writing-page-" + (page + 1) + ".html"; }
  };
})();
