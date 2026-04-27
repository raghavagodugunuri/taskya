// TASKYA Service Worker — Phase 1 notifications
// Place this file at /public/sw.js in your Vercel project

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { taskId } = event.notification.data || {};
  const userAction = event.action || "view";

  // Snooze: re-fire notification in 15 minutes (best-effort while SW alive)
  if (userAction === "snooze") {
    const title = event.notification.title;
    const body  = event.notification.body;
    const tag   = event.notification.tag;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: "(Snoozed) " + body,
        icon: "/taskya-icon-192.png",
        badge: "/taskya-badge-72.png",
        tag: tag + "-snoozed",
        data: { taskId, action: "view" },
        actions: taskId ? [
          { action: "complete",   title: "✓ Complete"     },
          { action: "reschedule", title: "📅 Reschedule"  },
        ] : [],
        requireInteraction: !!taskId,
      });
    }, 15 * 60 * 1000);

    // Open app to show snooze feedback
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((wins) => {
        if (wins.length > 0) {
          wins[0].postMessage({ type: "SNOOZED", taskId });
          return wins[0].focus();
        }
        return clients.openWindow("/?snoozed=1");
      })
    );
    return;
  }

  // Complete or reschedule — open app with URL params
  const url = taskId
    ? `/?taskNotify=${taskId}&action=${userAction}`
    : "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((wins) => {
      // Focus existing window if open
      for (const win of wins) {
        if (win.url.startsWith(self.location.origin)) {
          win.postMessage({ type: "NOTIF_ACTION", taskId, action: userAction });
          return win.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
