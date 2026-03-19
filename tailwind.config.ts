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
        background: "var(--background)",
        foreground: "var(--foreground)",
        tickr: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          text: "#1a1a1a",
          secondary: "#6b6b6b",
          muted: "#9a9a9a",
          border: "#E8E8E8",
          "border-light": "#F0F0F0",
        },
      },
      fontFamily: {
        serif: ["var(--font-noto-serif)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
