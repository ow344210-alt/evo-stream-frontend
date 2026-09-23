import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        evo: {
          red: {
            DEFAULT: "#FF2A1B",
            hover: "#E01C0E",
            light: "#FFF1F0",
            glow: "rgba(255, 42, 27, 0.25)",
            border: "rgba(255, 42, 27, 0.15)",
          },
          dark: {
            DEFAULT: "#0F1117",
            card: "#161922",
            border: "#232733",
            text: "#0A0D14",
            muted: "#6B7280",
          },
          cream: "#FAFAFA",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'evo-card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'evo-hover': '0 20px 30px -10px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'evo-button': '0 8px 24px -4px rgba(255, 42, 27, 0.35)',
        'evo-button-hover': '0 12px 28px -2px rgba(255, 42, 27, 0.45)',
        'evo-glow': '0 0 40px -10px rgba(255, 42, 27, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
