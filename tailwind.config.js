/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f8f7",
          100: "#d9eeea",
          200: "#b5ded7",
          300: "#86c6bd",
          400: "#5ba79e",
          500: "#3d8b82",
          600: "#2d6f68",
          700: "#176c68",
          800: "#144c4a",
          900: "#11262a",
        },
      },
    },
  },
  plugins: [],
};
