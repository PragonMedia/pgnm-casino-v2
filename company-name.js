(() => {
  const fallback = "AUTO";

  const host = (window.location.hostname || "")
    .toLowerCase()
    .replace(/^www\./, "");

  const company = (host.split(".")[0] || fallback)
    .replace(/[^a-z0-9-]/g, "")
    .toUpperCase() || fallback;

  document.querySelectorAll("[data-company-name]").forEach((el) => {
    el.textContent = company;
  });
})();
