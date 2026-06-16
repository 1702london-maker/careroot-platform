"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultConfig, buildWhiteLabelConfig, type WhiteLabelConfig } from "@/lib/white-label";

const WhiteLabelContext = createContext<WhiteLabelConfig>(defaultConfig);

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("users")
        .select("organisation_id")
        .eq("id", user.id)
        .single()
        .then(({ data: userRecord }) => {
          if (!userRecord?.organisation_id) return;
          supabase
            .from("organisations")
            .select("white_label,wl_app_name,wl_logo_url,wl_primary_colour,wl_secondary_colour,wl_accent_colour,wl_domain,wl_email_from,wl_support_email,wl_package_tier")
            .eq("id", userRecord.organisation_id)
            .single()
            .then(({ data: org }) => {
              if (!org) return;
              const cfg = buildWhiteLabelConfig(org as Record<string, unknown>);
              setConfig(cfg);
              // Update document title
              document.title = cfg.appName;
              // Inject CSS custom properties for white label colours
              if (cfg.isWhiteLabel) {
                const root = document.documentElement;
                root.style.setProperty("--cr-forest", cfg.primaryColour);
                root.style.setProperty("--cr-sage", cfg.secondaryColour);
                root.style.setProperty("--cr-gold", cfg.accentColour);
              }
            });
        });
    });
  }, []);

  return (
    <WhiteLabelContext.Provider value={config}>
      {children}
    </WhiteLabelContext.Provider>
  );
}
