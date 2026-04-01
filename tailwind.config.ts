import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PE brand palette — deep navy + gold accents
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#1e1b4b",
          950: "#0f0e2e",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        surface: {
          DEFAULT: "#0f0e2e",
          50: "#f8f9fe",
          100: "#f0f1fd",
          800: "#1a1940",
          900: "#0f0e2e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-pe": "linear-gradient(135deg, #0f0e2e 0%, #1e1b4b 50%, #1a1940 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,.04), 0 4px 24px 0 rgba(0,0,0,.06)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,.08), 0 8px 32px 0 rgba(0,0,0,.1)",
      },
    },
  },
  plugins: [],
};

export default config;
