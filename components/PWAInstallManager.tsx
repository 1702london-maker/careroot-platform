"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PWAInstallManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [manualHelp, setManualHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability still works without blocking the app UI.
      });
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
      setManualHelp(false);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setManualHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setManualHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setInstallPrompt(null);
  }

  if (installed || dismissed) return null;

  return (
    <div className="fixed right-3 top-[76px] z-[60] md:right-6">
      <div className="rounded-full border border-cr-forest/15 bg-white/95 p-1.5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={install}
            className="flex items-center justify-center gap-1.5 rounded-full bg-cr-forest px-3 py-1.5 text-xs font-bold text-white"
          >
            <Download size={13} />
            Install app
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-cr-slate"
            aria-label="Dismiss install prompt"
          >
            <X size={13} />
          </button>
        </div>
        {manualHelp && (
          <p className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs font-body text-cr-slate shadow-lg">
            If no prompt opens, use Chrome menu then Add to Home screen.
          </p>
        )}
      </div>
    </div>
  );
}
