import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10151B",
        steel: "#2A333D",
        steelLight: "#3E4A57",
        fog: "#F2F4F3",
        fogDark: "#E4E8E7",
        amber: "#E8A93C",
        amberDark: "#C98A20",
        signal: {
          go: "#2F8F46",
          goBg: "#E6F3E8",
          warn: "#C98A20",
          warnBg: "#FCF1DD",
          stop: "#C33D3D",
          stopBg: "#FBE9E9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-up": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "scale-up": "scale-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
