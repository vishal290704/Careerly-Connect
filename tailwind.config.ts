import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink))",
        teal: "hsl(var(--teal))",
        canvas: "hsl(var(--canvas))",
        surface: "hsl(var(--surface))",
        secondary: "hsl(var(--secondary))",
        line: "hsl(var(--line))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        newsreader: ["var(--font-newsreader)", "serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(24, 42, 54, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
