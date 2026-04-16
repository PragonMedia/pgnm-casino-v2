(() => {
  const fallbackName = "AUTO";

  const host = (window.location.hostname || "")
    .toLowerCase()
    .replace(/^www\./, "");

  const name =
    (host.split(".")[0] || fallbackName).replace(/[^a-z0-9-]/g, "").toUpperCase() ||
    fallbackName;

  document.querySelectorAll("[data-company-name]").forEach((el) => {
    el.textContent = name;
  });

  document.querySelectorAll("[data-company-domain]").forEach((el) => {
    el.textContent = name;
  });
})();
