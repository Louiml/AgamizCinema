/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Mode-driven tokens ── `data-canvas` (from the Light/Dark setting)
        // decides which palette is active. Both "dark" and "light" token
        // variants resolve to the same active semantic var so components that
        // hardcode either track render in the chosen mode.
        ink: {
          DEFAULT: "rgb(var(--text) / <alpha-value>)",
          deep: "rgb(var(--canvas) / <alpha-value>)",
          raise: "rgb(var(--canvas-elev) / <alpha-value>)",
          float: "rgb(var(--canvas-elev) / <alpha-value>)",
          overlay: "rgb(var(--surface-elev) / <alpha-value>)",
        },
        "on-primary": "rgb(var(--text) / <alpha-value>)",
        canvas: {
          night: "rgb(var(--canvas) / <alpha-value>)",
          "night-elevated": "rgb(var(--canvas-elev) / <alpha-value>)",
          light: "rgb(var(--canvas-elev) / <alpha-value>)",
          cream: "rgb(var(--canvas) / <alpha-value>)",
        },
        "surface-elevated-dark": "rgb(var(--surface-elev) / <alpha-value>)",
        hairline: {
          light: "rgb(var(--hairline) / <alpha-value>)",
          dark: "rgb(var(--hairline) / <alpha-value>)",
        },
        shade: {
          30: "#d4d4d8",
          40: "#a1a1aa",
          50: "#71717a",
          60: "#52525b",
          70: "#3f3f46",
        },
        aloe: "rgb(var(--accent-soft) / <alpha-value>)",
        pistachio: "rgb(var(--accent-soft) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-on": "rgb(var(--accent-on) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        "accent-soft-on": "rgb(var(--accent-soft-on) / <alpha-value>)",
        contrast: "rgb(var(--contrast) / <alpha-value>)",
        "on-contrast": "rgb(var(--on-contrast) / <alpha-value>)",
        link: {
          cool1: "#9dabad",
          cool2: "#9797a2",
          cool3: "#bdbdca",
          mint: "#99b3ad",
        },
        // ── Legacy compat aliases (unreferenced; tree-shaken) ──
        paper: "#ffffff",
        ash: {
          DEFAULT: "#a1a1aa",
          dim: "#71717a",
        },
        mint: {
          300: "#c1fbd4",
          400: "#d4f9e0",
          500: "#1e2c31",
          600: "#3f3f46",
          700: "#52525b",
        },
        abyss: {
          DEFAULT: "#000000",
          deep: "#000000",
          dark: "#0a0a0a",
        },
        forest: {
          DEFAULT: "#0a0a0a",
          mid: "#0a0a0a",
          light: "#1e2c31",
        },
        cream: "#fbfbf5",
        mist: "#a1a1aa",
      },
      borderRadius: {
        xs: "4px",
        sm: "5px",
        md: "8px",
        lg: "12px",
        xl: "20px",
        pill: "9999px",
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
          "Inter Display",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-xxl": ["96px", { lineHeight: "1.0", letterSpacing: "2.4px" }],
        "display-xl": ["70px", { lineHeight: "1.0" }],
        "display-lg": ["55px", { lineHeight: "1.16" }],
        "display-md": ["48px", { lineHeight: "1.14" }],
        "heading-xl": ["28px", { lineHeight: "1.28", letterSpacing: "0.42px" }],
        "heading-lg": ["24px", { lineHeight: "1.14", letterSpacing: "0.36px" }],
        "heading-md": ["20px", { lineHeight: "1.4", letterSpacing: "0.3px" }],
        "heading-sm": ["18px", { lineHeight: "1.25", letterSpacing: "0.72px" }],
        "body-lg": ["18px", { lineHeight: "1.56" }],
        "body-md": ["16px", { lineHeight: "1.5" }],
        caption: ["14px", { lineHeight: "1.49", letterSpacing: "0.28px" }],
        micro: ["13px", { lineHeight: "1.5", letterSpacing: "-0.13px" }],
        "eyebrow-cap": ["12px", { lineHeight: "1.2", letterSpacing: "0.72px" }],
      },
      fontWeight: {
        thin330: "330",
        body420: "420",
        body550: "550",
      },
      spacing: {
        xxs: "2px",
        xs: "4px",
        md: "12px",
        xxl: "32px",
        huge: "64px",
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
        "elev-1": "0 1px 2px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
        "elev-2":
          "0 0 0 1px rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.3), 0 5px 10px rgba(0,0,0,0.2)",
        "elev-3":
          "0 8px 8px rgba(0,0,0,0.1), 0 4px 4px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.1)",
        "elev-4": "0 25px 50px -12px rgba(0,0,0,0.25)",
        "edge-light": "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
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
