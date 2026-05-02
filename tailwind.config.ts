import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.js",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        customBlue: "#1c638b",
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-tertiary": "var(--surface-tertiary)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
      },
      backgroundImage: {
        "hero-pattern": "url('/images/hero-section.jpeg')",
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite ease-in-out',
        'wiggle': 'wiggle 0.6s ease-in-out infinite',
      },
        fontFamily: {
            league: ["'League Spartan'", "sans-serif"],
        },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
      },
    },
  },
  plugins: [ function ({ addUtilities }) {
    addUtilities({
      '.no-scrollbar::-webkit-scrollbar': {
        'width': '0px',
        'height': '0px',
      },
      '.no-scrollbar': {
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
      },
    });
  },
  ],
} satisfies Config;
