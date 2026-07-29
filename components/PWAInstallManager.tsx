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
    <div className="fixed left-3 right-3 bottom-20 z-[60] md:left-auto md:right-5 md:bottom-5 md:w-80">
      <div className="rounded-2xl border border-cr-forest/20 bg-white shadow-xl p-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={install}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cr-forest px-4 py-3 text-sm font-bold text-white"
          >
            <Download size={16} />
            Install app
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-cr-slate"
            aria-label="Dismiss install prompt"
          >
            <X size={16} />
          </button>
        </div>
        {manualHelp && (
          <p className="mt-2 text-xs font-body text-cr-slate">
            If no prompt opens, use Chrome menu then Add to Home screen.
          </p>
        )}
      </div>
    </div>
  );
}
