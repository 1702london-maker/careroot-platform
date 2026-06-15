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
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
