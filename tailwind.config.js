/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          deep: "#050607",
          DEFAULT: "#0a0d0f",
          raise: "#101416",
          float: "#161b1e",
          overlay: "#1c2226",
        },
        mint: {
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        paper: "#f3f6f4",
        ash: {
          DEFAULT: "#9aa5a1",
          dim: "#6b7572",
        },
        abyss: {
          DEFAULT: "#0a0d0f",
          deep: "#050607",
          dark: "#101416",
        },
        forest: {
          DEFAULT: "#101416",
          mid: "#161b1e",
          light: "#1c2226",
        },
        cream: "#f3f6f4",
        mist: "#9aa5a1",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Sora",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        "spring-bounce": "cubic-bezier(0.34, 1.3, 0.4, 1)",
        "spring-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        press: "100ms",
        ui: "240ms",
        surface: "400ms",
      },
      boxShadow: {
        "glow-mint": "0 0 32px -10px rgba(16, 185, 129, 0.45)",
        "glow-soft": "0 0 20px -8px rgba(52, 211, 153, 0.3)",
        "card-hover":
          "0 18px 44px -14px rgba(0, 0, 0, 0.7), 0 0 24px -8px rgba(16, 185, 129, 0.22)",
        "glass-inset": "inset 0 1px 0 0 rgba(255, 255, 255, 0.07)",
        "edge-light": "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
        pop: "0 24px 60px -16px rgba(0, 0, 0, 0.75)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.32, 0.72, 0, 1) both",
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "toast-in": "toastIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-slow": "pulse 3.5s ease-in-out infinite",
        "spin-slow": "spin 1.2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
