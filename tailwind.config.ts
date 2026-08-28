export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6f8",
          100: "#d6ebee",
          200: "#aed6dd",
          300: "#7cbbc6",
          400: "#4a9bab",
          500: "#2f7e8f",
          600: "#246573",
          700: "#1f5260",
          800: "#1c424d",
          900: "#19363f",
        },
        verified: "#15803d",
        breach: "#b91c1c",
        pending: "#b45309",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
