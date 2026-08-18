/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js}", "./components/**/*.{ts,tsx,js}"],
  // Your original app has no dark mode — "class" (never toggled) means any
  // leftover dark: utility never activates, instead of "media" which was
  // flipping pages dark based on the visitor's OS theme.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // AzureMed Hub report palette (Figure 6.1)
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#60a5fa",
          lighter: "#93c5fd",
          muted: "#d1d5db",
        },
      },
    },
  },
  plugins: [],
};
