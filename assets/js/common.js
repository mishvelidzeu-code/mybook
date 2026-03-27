(function () {
  function initPanelLinks() {
    document.querySelectorAll("[data-target-url]").forEach((element) => {
      if (element.dataset.panelLinkBound === "true") {
        return;
      }

      const targetUrl = element.getAttribute("data-target-url");
      if (!targetUrl) {
        return;
      }

      element.dataset.panelLinkBound = "true";
      element.classList.add("panel-link");

      if (!element.hasAttribute("tabindex")) {
        element.tabIndex = 0;
      }

      if (!element.hasAttribute("role")) {
        element.setAttribute("role", "link");
      }

      const isInteractiveTarget = (target) => target.closest("a, button, input, select, textarea, label, summary, [role='button'], [role='link']");

      element.addEventListener("click", (event) => {
        if (event.defaultPrevented || isInteractiveTarget(event.target)) {
          return;
        }

        window.location.href = targetUrl;
      });

      element.addEventListener("keydown", (event) => {
        if (isInteractiveTarget(event.target)) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.location.href = targetUrl;
        }
      });
    });
  }

  function initPullToRefresh() {
    if (!("ontouchstart" in window)) {
      return;
    }

    const indicator = document.createElement("div");
    indicator.className = "pull-refresh-indicator";
    indicator.innerHTML = '<span class="pull-refresh-text">ქვევით ჩამოსქროლე გასაახლებლად</span>';
    document.body.appendChild(indicator);

    let startY = 0;
    let startX = 0;
    let pulling = false;
    let armed = false;

    const resetIndicator = () => {
      indicator.classList.remove("is-visible", "is-ready", "is-loading");
      indicator.style.setProperty("--pull-offset", "0px");
      armed = false;
      pulling = false;
    };

    const canStartPull = (target) => {
      if (window.scrollY > 0) {
        return false;
      }

      if (target.closest(".author-strip")) {
        return false;
      }

      if (target.closest("input, textarea, select")) {
        return false;
      }

      return true;
    };

    document.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1 || !canStartPull(event.target)) {
        resetIndicator();
        return;
      }

      startY = event.touches[0].clientY;
      startX = event.touches[0].clientX;
      pulling = true;
      indicator.classList.add("is-visible");
      indicator.style.setProperty("--pull-offset", "0px");
    }, { passive: true });

    document.addEventListener("touchmove", (event) => {
      if (!pulling || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const deltaY = touch.clientY - startY;
      const deltaX = Math.abs(touch.clientX - startX);

      if (deltaY <= 0 || deltaX > deltaY) {
        resetIndicator();
        return;
      }

      const offset = Math.min(deltaY * 0.58, 104);
      indicator.style.setProperty("--pull-offset", `${offset}px`);
      indicator.classList.add("is-visible");

      armed = offset >= 72;
      indicator.classList.toggle("is-ready", armed);

      if (deltaY > 12) {
        event.preventDefault();
      }
    }, { passive: false });

    const finishPull = () => {
      if (!pulling) {
        return;
      }

      if (armed) {
        indicator.classList.add("is-loading");
        indicator.classList.remove("is-ready");
        setTimeout(() => {
          window.location.reload();
        }, 140);
        return;
      }

      resetIndicator();
    };

    document.addEventListener("touchend", finishPull, { passive: true });
    document.addEventListener("touchcancel", resetIndicator, { passive: true });
  }

  function initCommon() {
    initPanelLinks();
    initPullToRefresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCommon, { once: true });
  } else {
    initCommon();
  }
})();
