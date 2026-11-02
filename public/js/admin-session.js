(function () {
  "use strict";

  const remainingAtRender = Number(window.VIP_ADMIN_SESSION_REMAINING_MS);
  if (!Number.isFinite(remainingAtRender) || remainingAtRender <= 0) return;

  const deadline = performance.now() + remainingAtRender;
  const channelName = "vip-admin-session-lifecycle";
  const storageKey = "vip_admin_session_expired_signal";
  let redirecting = false;
  let channel;

  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(channelName);
      channel.addEventListener("message", (event) => {
        if (event.data?.type === "expired") expire(false);
      });
    }
  } catch (_) {}

  const notifyOtherTabs = () => {
    try { channel?.postMessage({ type: "expired" }); } catch (_) {}
    try {
      localStorage.setItem(storageKey, String(Date.now()));
      localStorage.removeItem(storageKey);
    } catch (_) {}
  };

  const expire = (notify = true) => {
    if (redirecting) return;
    redirecting = true;
    if (notify) notifyOtherTabs();
    try {
      window.fetch("/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
    window.location.replace("/?session=expired");
  };

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey && event.newValue) expire(false);
  });

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);
    if (response.status === 401 && response.headers.get("X-Admin-Session-Status") === "expired") {
      expire();
    }
    return response;
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    this.addEventListener("load", function () {
      if (this.status === 401 && this.getResponseHeader("X-Admin-Session-Status") === "expired") {
        expire();
      }
    });
    return originalXhrOpen.apply(this, args);
  };

  const checkDeadline = () => {
    const left = deadline - performance.now();
    if (left <= 0) return expire();
    window.setTimeout(checkDeadline, Math.min(left, 10_000));
  };
  checkDeadline();
})();
