"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

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

  if (installed) return null;

  return (
    <div className="mb-3 flex flex-col items-center">
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#1A3C2E]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#1A3C2E] shadow-sm transition-colors hover:bg-[#E8F5EE]"
      >
        <Download size={13} />
        Install now
      </button>
        {manualHelp && (
          <p className="mt-2 max-w-xs text-xs font-body text-[#6B7280]">
            If no prompt opens, use Chrome menu then Add to Home screen.
          </p>
        )}
    </div>
  );
}
