(() => {
  const fallbackName = "AUTO";
  const CLICKID_STORAGE_KEY = "rt_clickid";
  const CLICKID_ENDPOINT = "./clickid.php";
  const GTG_ENDPOINT = "./gtg.php";
  const GTG_OVERRIDE_URL = "https://google.com";
  const REQUEST_TIMEOUT_MS = 6000;

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

  const yesButton =
    document.querySelector("#continueClick") ||
    document.querySelector(".age-gate__btn--yes");
  if (!yesButton || !host) {
    return;
  }

  const setHref = (href) => {
    yesButton.setAttribute("href", href);
  };

  const buildTrackingUrl = (clickid) =>
    `https://trk.${host}/click?clickid=${encodeURIComponent(clickid)}`;

  const getClickidFromCurrentUrl = () => {
    try {
      return new URLSearchParams(window.location.search).get("clickid") || "";
    } catch (_err) {
      return "";
    }
  };

  const getCachedClickid = () => {
    try {
      return localStorage.getItem(CLICKID_STORAGE_KEY) || "";
    } catch (_err) {
      return "";
    }
  };

  const saveCachedClickid = (value) => {
    if (!value) {
      return;
    }
    try {
      localStorage.setItem(CLICKID_STORAGE_KEY, value);
    } catch (_err) {
      // Ignore write errors in private mode.
    }
  };

  const fetchWithTimeout = async (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timer);
    }
  };

  const parseJsonSafe = async (response) => {
    try {
      return await response.json();
    } catch (_err) {
      return null;
    }
  };

  const fetchClickid = async (useFallback = false) => {
    const body = new URLSearchParams({
      referrer: window.location.href,
    });
    if (useFallback) {
      body.set("use_fallback", "1");
    }

    const response = await fetchWithTimeout(
      CLICKID_ENDPOINT,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body.toString(),
      },
      useFallback ? REQUEST_TIMEOUT_MS + 1500 : REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      return "";
    }

    const payload = await parseJsonSafe(response);
    if (!payload || payload.ok !== true || typeof payload.clickid !== "string") {
      return "";
    }

    return payload.clickid.trim();
  };

  const fetchGtg = async () => {
    const response = await fetchWithTimeout(GTG_ENDPOINT, { method: "GET" }, 4500);
    if (!response.ok) {
      return null;
    }
    const payload = await parseJsonSafe(response);
    if (!payload || typeof payload !== "object") {
      return null;
    }
    return payload.gtg;
  };

  const resolveClickid = async () => {
    let clickid = "";

    try {
      clickid = await fetchClickid(false);
    } catch (_err) {
      clickid = "";
    }

    if (!clickid) {
      try {
        clickid = await fetchClickid(true);
      } catch (_err) {
        clickid = "";
      }
    }

    if (!clickid) {
      clickid = getClickidFromCurrentUrl();
    }

    if (!clickid) {
      clickid = getCachedClickid();
    }

    if (!clickid) {
      try {
        clickid = await fetchClickid(false);
      } catch (_err) {
        clickid = "";
      }
    }

    return clickid ? clickid.trim() : "";
  };

  const initializeCtaDestination = async () => {
    const clickidPromise = resolveClickid();
    const gtgPromise = fetchGtg().catch(() => null);

    const [clickid, gtgResult] = await Promise.all([clickidPromise, gtgPromise]);

    if (gtgResult === 1) {
      setHref(GTG_OVERRIDE_URL);
      return;
    }

    if (clickid) {
      saveCachedClickid(clickid);
      setHref(buildTrackingUrl(clickid));
      return;
    }

    setHref(`https://trk.${host}/click`);
  };

  initializeCtaDestination().catch(() => {
    setHref(`https://trk.${host}/click`);
  });
})();
