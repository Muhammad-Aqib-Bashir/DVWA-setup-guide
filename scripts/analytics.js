/* ============================================
   Shared Google Analytics setup + helpers.
   Include on every page, in this order:
     <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q8MJM8LBXM"></script>
     <script src="./analytics.js"></script>
   ============================================ */

window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-Q8MJM8LBXM");

/**
 * Fires a GA4 event exactly once, the first time the element with the given
 * id scrolls into view (50% visible). Used to measure how far people
 * actually get through a guide — e.g. fire "tutorial_begin" on the first
 * step and "tutorial_complete" on the last step, then in GA4 the
 * completion rate is simply tutorial_complete / tutorial_begin.
 *
 * Handles content that renders asynchronously (e.g. steps injected by JS
 * after the page loads) by polling briefly for the element to appear.
 */
function trackOnView(elementId, eventName, eventParams) {
  function start() {
    let attempts = 0;
    const maxAttempts = 20;

    function tryObserve() {
      const el = document.getElementById(elementId);
      if (!el) {
        attempts++;
        if (attempts < maxAttempts) setTimeout(tryObserve, 150);
        return;
      }

      let fired = false;
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !fired) {
              fired = true;
              gtag("event", eventName, eventParams || {});
              observer.disconnect();
            }
          });
        },
        { threshold: 0.5 },
      );
      observer.observe(el);
    }

    tryObserve();
  }

  // NOTE: "DOMContentLoaded" only ever fires once. The original version of
  // this function always did `document.addEventListener("DOMContentLoaded", ...)`,
  // which silently did nothing if called after the page had already finished
  // loading. That's fine for the existing call sites below (they run inline,
  // before the event fires), but the new per-step funnel tracking further
  // down this file calls trackOnView() from a MutationObserver callback that
  // can run *after* DOMContentLoaded has already happened — so we check
  // readyState and run immediately in that case instead of waiting forever.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}

/* ============================================
   EXTENDED USER-BEHAVIOR TRACKING
   ============================================
   Everything below adds more detailed GA4 events on top of the setup above,
   without changing any page content. All events use readable snake_case
   names and readable parameter values so they're easy to find and filter
   in the GA4 UI (Reports → Engagement → Events, or Explore).

   EVENT CATALOG
   -------------
   session_source        Fired once per browser session (first page hit).
                          Tells you where a visit came from: referrer domain,
                          and utm_source / utm_medium / utm_campaign from the
                          URL if present. Also stored so later events in the
                          same session (e.g. a star click) can be tagged with
                          the same "where they came from" info.

   guide_step_view        Fired once per guide step / troubleshooting section
                          the first time it scrolls into view. Works for
                          every <section class="step" id="..."> on any page,
                          including the install guide's steps which are
                          rendered by JS after the page loads. Use this to
                          build a step-by-step drop-off funnel — i.e. exactly
                          "how far people get through the guide."

   scroll_depth           Fired once each at 25/50/75/100% scrolled down the
                          page. A simple, page-agnostic read-through metric.

   copy_command_click      Fired when someone clicks "Copy" on a terminal
                          command block. The strongest "they're actually
                          following along" signal. A step can contain more
                          than one command (e.g. "check Apache status" and
                          "check MySQL status" are two separate copy buttons
                          inside step 1), so each button gets its own
                          command_id ("step1_cmd1", "step1_cmd2", ...) and a
                          readable command_preview (the command's first line)
                          — these aren't collapsed into one count per step.

   github_btn_hover /
   github_btn_click        Fired for the "Star on GitHub" buttons (header
                          button and homepage CTA button). Kept under their
                          existing event names for continuity with any
                          history already in this GA4 property, but now also
                          carries button_id (which button — "from where" on
                          the page), guide_page (which page), and the
                          session's referrer_host / utm_source ("from where"
                          the visitor originally came).

   profile_link_click      Fired when someone clicks a link to a *person's*
                          profile: the author's site, or the DVWA creator's
                          GitHub profile. profile_name identifies which one.

   resource_link_click      Fired for links to named external resources/tools
                          referenced by the guide (DVWA repo, OWASP, MySQL,
                          PHP, Ubuntu/Kali downloads, GitHub issues, Google's
                          privacy/opt-out pages, etc). resource_name is a
                          readable identifier for each.

   internal_nav_click     Fired for links to other pages on this same site
                          (nav bar, footer, "Back to guide", the
                          troubleshooting callout box, etc).

   toc_click               Fired for in-page "jump to section" links inside
                          the "Quick Navigation" box or the left sidebar.

   outbound_link_click      Fallback for any other external link not covered
                          by the categories above, so nothing goes untracked.

   Every click event also carries:
     guide_page   — "install_guide" | "troubleshooting" | "privacy_policy"
     location     — where on the page the link lives ("header", "hero",
                    "footer", "quick_nav", "sidebar_nav",
                    "troubleshoot_callout", or "content")
   ============================================ */

function getGuidePage() {
  var path = window.location.pathname;
  if (path.indexOf("troubleshooting") !== -1) return "troubleshooting";
  if (path.indexOf("privacy") !== -1) return "privacy_policy";
  return "install_guide";
}

function classifyLinkLocation(el) {
  if (el.closest("header")) return "header";
  if (el.closest(".troubleshoot-callout")) return "troubleshoot_callout";
  if (el.closest(".sidebar-toc")) return "sidebar_nav";
  if (el.closest("nav.toc")) return "quick_nav";
  if (el.closest(".hero")) return "hero";
  if (el.closest("footer")) return "footer";
  return "content";
}

/* ---- Acquisition / "where did this visitor come from" ---- */

function getFirstTouch() {
  var fallback = {
    referrer_host: "(direct)",
    utm_source: "(none)",
    utm_medium: "(none)",
    utm_campaign: "(none)",
  };
  try {
    var raw = sessionStorage.getItem("dvwa_first_touch");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* sessionStorage unavailable (e.g. private browsing) — use fallback */
  }
  return fallback;
}

(function initAcquisitionTracking() {
  try {
    if (sessionStorage.getItem("dvwa_first_touch")) return; // already captured this session

    var qs = new URLSearchParams(window.location.search);
    var referrer = document.referrer || "";
    var referrerHost = "(direct)";
    if (referrer) {
      try {
        referrerHost = new URL(referrer).hostname || "(direct)";
      } catch (e) {
        referrerHost = "(unknown)";
      }
    }

    var firstTouch = {
      referrer_host: referrerHost,
      utm_source: qs.get("utm_source") || "(none)",
      utm_medium: qs.get("utm_medium") || "(none)",
      utm_campaign: qs.get("utm_campaign") || "(none)",
    };

    sessionStorage.setItem("dvwa_first_touch", JSON.stringify(firstTouch));

    gtag(
      "event",
      "session_source",
      Object.assign({}, firstTouch, {
        full_referrer: referrer || "(direct)",
        landing_page: window.location.pathname,
        guide_page: getGuidePage(),
      }),
    );

    // Also register it as a user property so it can be joined against any
    // other event for this visitor inside GA4, not just this one event.
    gtag("set", "user_properties", {
      traffic_source: referrerHost,
      first_utm_source: firstTouch.utm_source,
    });
  } catch (e) {
    /* fail silently — analytics should never break the page */
  }
})();

/* ---- Star-button tracking (called from index.html, troubleshooting.html,
   and privacy-policy.html in place of raw gtag() calls, so every star
   button on every page reports through the same enriched event). ---- */

function trackStarHover(buttonId) {
  var ft = getFirstTouch();
  gtag("event", "github_btn_hover", {
    button_id: buttonId,
    guide_page: getGuidePage(),
    referrer_host: ft.referrer_host,
    utm_source: ft.utm_source,
  });
}

function trackStarClick(buttonId) {
  var ft = getFirstTouch();
  gtag("event", "github_btn_click", {
    button_id: buttonId,
    guide_page: getGuidePage(),
    referrer_host: ft.referrer_host,
    utm_source: ft.utm_source,
  });
}

/* ---- Per-step / per-section "how far did they get" funnel ---- */

(function initSectionFunnelTracking() {
  var seen = {};

  function processSection(sec) {
    if (!sec.id || seen[sec.id]) return;
    seen[sec.id] = true;
    var heading = sec.querySelector("h2");
    var label = heading ? heading.textContent.trim() : sec.id;
    trackOnView(sec.id, "guide_step_view", {
      event_category: "guide_progress",
      guide_page: getGuidePage(),
      section_id: sec.id,
      section_label: label,
    });
  }

  function scan() {
    document.querySelectorAll("section.step[id]").forEach(processSection);
  }

  document.addEventListener("DOMContentLoaded", function () {
    scan(); // catches static sections (troubleshooting & privacy pages)

    // The install guide renders its steps with JS after the page loads, so
    // watch for them being added and pick up any new ones as they appear.
    var container = document.getElementById("stepsContainer");
    if (container) {
      new MutationObserver(scan).observe(container, {
        childList: true,
        subtree: true,
      });
    }
  });
})();

/* ---- Scroll depth (page-agnostic read-through signal) ---- */

(function initScrollDepthTracking() {
  var thresholds = [25, 50, 75, 100];
  var fired = {};
  window.addEventListener(
    "scroll",
    function () {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      var pct = Math.round((scrollTop / docHeight) * 100);
      thresholds.forEach(function (t) {
        if (pct >= t && !fired[t]) {
          fired[t] = true;
          gtag("event", "scroll_depth", {
            depth_percent: t,
            guide_page: getGuidePage(),
          });
        }
      });
    },
    { passive: true },
  );
})();

/* ---- Copy-command clicks (delegated, so it works on the copy buttons
   that each page's own script creates dynamically) ---- */

document.addEventListener("click", function (e) {
  var btn = e.target.closest && e.target.closest(".copy-btn");
  if (!btn) return;

  var block = btn.closest(".code-block");
  var section = btn.closest("section[id]");
  var heading = section ? section.querySelector("h2") : null;
  var sectionId = section ? section.id : "(unknown)";
  var sectionLabel = heading ? heading.textContent.trim() : "(unknown)";

  // A single step/section can hold several separate commands (e.g. step 1
  // has "check Apache status", "check MySQL status", then a start command
  // for each) — each one is its own .code-block with its own Copy button.
  // Index it within its section so every command gets its own identifier
  // instead of all of them reporting the same section_id.
  var commandIndex = 1;
  if (section && block) {
    var blocksInSection = section.querySelectorAll(".code-block");
    for (var i = 0; i < blocksInSection.length; i++) {
      if (blocksInSection[i] === block) {
        commandIndex = i + 1;
        break;
      }
    }
  }

  var codeEl = block ? block.querySelector("pre code") : null;
  var fullCommand = codeEl ? codeEl.textContent.trim() : "";
  var firstLine = fullCommand.split("\n")[0] || "";
  var commandPreview =
    firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine;

  gtag("event", "copy_command_click", {
    guide_page: getGuidePage(),
    section_id: sectionId,
    section_label: sectionLabel,
    command_id: sectionId + "_cmd" + commandIndex,
    command_index: commandIndex,
    command_preview: commandPreview || "(empty)",
  });
});

/* ---- Site-wide link classification (delegated, covers every <a> on every
   page, present now or added later, without needing per-link markup) ---- */

document.addEventListener("click", function (e) {
  var link = e.target.closest && e.target.closest("a[href]");
  if (!link) return;

  // The "Star on GitHub" buttons already report through trackStarHover /
  // trackStarClick (see the inline handlers on those specific elements) —
  // skip them here so a single click isn't counted twice.
  if (link.classList.contains("github-btn") || link.id === "cta-star-btn") {
    return;
  }

  var href = link.getAttribute("href") || "";
  var label = (link.textContent || "").trim().replace(/\s+/g, " ") || href;
  var location = classifyLinkLocation(link);
  var guidePage = getGuidePage();
  var ft = getFirstTouch();
  var base = {
    guide_page: guidePage,
    location: location,
    referrer_host: ft.referrer_host,
  };

  function fire(eventName, extra) {
    gtag("event", eventName, Object.assign({}, base, extra));
  }

  // In-page "jump to a section" links (Quick Navigation box, sidebar TOC).
  if (href.charAt(0) === "#") {
    fire("toc_click", {
      target_section: href.slice(1),
      link_label: label,
      nav_type: location === "sidebar_nav" ? "sidebar" : "quick_nav",
    });
    return;
  }

  // Same-site pages (relative links: index.html, troubleshooting.html,
  // privacy-policy.html, sitemap.xml, the logo, "Back to guide", etc).
  if (!/^https?:\/\//i.test(href)) {
    fire("internal_nav_click", {
      destination: href,
      link_label: label,
    });
    return;
  }

  // From here on, href is a full external http(s) URL — classify it.

  // 1. Links to a *person's* profile.
  if (/muhammadaqibbashir\.netlify\.app/i.test(href)) {
    fire("profile_link_click", {
      profile_name: "author_portfolio",
      link_label: "author site",
      link_url: href,
    });
    return;
  }
  if (/^https?:\/\/(www\.)?github\.com\/digininja\/?(\?.*)?$/i.test(href)) {
    fire("profile_link_click", {
      profile_name: "digininja_github",
      link_label: "digininja (DVWA creator, GitHub profile)",
      link_url: href,
    });
    return;
  }

  // 2. Named resources referenced by the guide.
  var resourceRules = [
    [
      /github\.com\/digininja\/DVWA/i,
      "dvwa_official_repo",
      "DVWA Official Repository",
    ],
    [
      /github\.com\/Muhammad-Aqib-Bashir\/DVWA-setup-guide\/issues/i,
      "github_issues_feedback",
      "GitHub Issues (feedback)",
    ],
    [/owasp\.org\/www-project-top-ten/i, "owasp_top_10", "OWASP Top 10"],
    [/owasp\.org/i, "owasp", "OWASP"],
    [/mysql\.com/i, "mysql_docs", "MySQL Documentation"],
    [/php\.net/i, "php_official", "PHP Official Site"],
    [/ubuntu\.com\/download/i, "ubuntu_download", "Ubuntu Download"],
    [/kali\.org\/downloads/i, "kali_download", "Kali Linux Download"],
    [/apache\.org/i, "apache_httpd", "Apache HTTP Server"],
    [
      /policies\.google\.com\/privacy/i,
      "google_privacy_policy",
      "Google Privacy Policy",
    ],
    [
      /docs\.github\.com.*privacy/i,
      "github_privacy_statement",
      "GitHub Privacy Statement",
    ],
    [
      /tools\.google\.com\/dlpage\/gaoptout/i,
      "google_analytics_optout",
      "Google Analytics Opt-out Tool",
    ],
  ];
  for (var i = 0; i < resourceRules.length; i++) {
    if (resourceRules[i][0].test(href)) {
      fire("resource_link_click", {
        resource_name: resourceRules[i][1],
        link_label: resourceRules[i][2],
        link_url: href,
      });
      return;
    }
  }

  // 3. Anything else external falls through to a generic outbound event, so
  //    "pick all elements" holds even for links added after this was written.
  fire("outbound_link_click", {
    link_label: label,
    link_url: href,
  });
});
