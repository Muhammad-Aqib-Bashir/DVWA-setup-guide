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
  document.addEventListener("DOMContentLoaded", function () {
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
  });
}
