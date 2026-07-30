"use client";

import { useEffect } from "react";

export function PushNotificationRegistrar() {
  useEffect(() => {
    let cancelled = false;

    async function registerPushNotifications() {
      try {
        const [{ Capacitor }, { PushNotifications }] = await Promise.all([
          import("@capacitor/core"),
          import("@capacitor/push-notifications"),
        ]);

        if (!Capacitor.isNativePlatform()) return;

        const existing = await PushNotifications.checkPermissions();
        const permission = existing.receive === "granted"
          ? existing
          : await PushNotifications.requestPermissions();

        if (cancelled || permission.receive !== "granted") return;

        await PushNotifications.addListener("registration", async (token) => {
          if (cancelled || !token.value) return;
          await fetch("/api/devices/push-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ push_token: token.value }),
          });
        });

        await PushNotifications.register();
      } catch {
        // Web/PWA installs do not support native push registration; keep the staff app usable.
      }
    }

    registerPushNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
