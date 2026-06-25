import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cr-forest": "#1A3C2E",
        "cr-sage": "#4A7C5E",
        "cr-mint": "#E8F5EE",
        "cr-ivory": "#F9F7F4",
        "cr-charcoal": "#1C1C1E",
        "cr-slate": "#6B7280",
        "cr-gold": "#C9A84C",
        "cr-red": "#DC2626",
        "cr-amber": "#F59E0B",
        "cr-white": "#FFFFFF",
      },
      fontFamily: {
        sans: ["DM Sans", "var(--font-dm-sans)", "sans-serif"],
        display: ["Cormorant Garamond", "var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        "card-lg": "16px",
        btn: "8px",
        pill: "100px",
        phone: "36px",
      },
      fontSize: {
        display: ["48px", { lineHeight: "56px", fontWeight: "700" }],
        h1: ["36px", { lineHeight: "44px", fontWeight: "700" }],
        h2: ["26px", { lineHeight: "34px", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "26px", fontWeight: "600" }],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        nav: "0 1px 3px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
