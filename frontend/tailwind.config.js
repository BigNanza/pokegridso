// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // React/Vite
    "./components/**/*.{js,ts,jsx,tsx}", // shadcn components
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['"Roboto"', "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
