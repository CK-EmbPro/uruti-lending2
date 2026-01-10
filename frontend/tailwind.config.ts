import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#0A4DAA",
        secondary: "#10B981",
        "background-light": "#F8F9FA",
        "background-dark": "#101922",
        "text-light": "#333333",
        "text-dark": "#F8F9FA",
        "subtext-light": "#555555",
        "subtext-dark": "#A0AEC0",
        "border-light": "#E2E8F0",
        "border-dark": "#2D3748",
        "text-muted-light": "#4c739a",
        "text-muted-dark": "#a0b3c6",
        "text-secondary-light": "#6c757d",
        "text-secondary-dark": "#adb5bd",
        success: "#28a745",
        warning: "#ffc107",
        danger: "#dc3545",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
export default config;

