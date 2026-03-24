/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0E1A", // Midnight Blue Base
        surface: {
          DEFAULT: "#131313",
          low: "#1B1B1B",
          container: "#20201F",
          high: "#353535",
        },
        primary: {
          DEFAULT: "#73D9B5",
          container: "#148C6C",
          fixed: "#8FF6D0",
        },
        secondary: {
          DEFAULT: "#C3C6D7",
          container: "#454957",
        },
        accent: "#98FFD9",
      },
      fontFamily: {
        serif: ["Noto Serif", "serif"],
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
