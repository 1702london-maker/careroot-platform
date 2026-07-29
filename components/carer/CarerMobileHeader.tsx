"use client";

import { useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  fullName: string;
  today: string;
};

export function CarerMobileHeader({ fullName, today }: Props) {
  const supabase = createClient();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    const ok = window.confirm("Sign out of the staff app?");
    if (!ok) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function handleHeaderTap() {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 1400);

    if (tapCount.current >= 4) {
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      void signOut();
    }
  }

  return (
    <header
      onClick={handleHeaderTap}
      className="md:hidden fixed top-0 left-0 right-0 z-[80] bg-cr-forest text-white flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 touch-manipulation"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-body text-white/50 uppercase tracking-widest">Staff Portal</p>
        <p className="font-display font-semibold text-base leading-tight truncate">{fullName}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="hidden min-[380px]:block text-xs font-body text-white/60">{today}</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void signOut();
          }}
          disabled={signingOut}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white active:scale-95 disabled:opacity-60"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
