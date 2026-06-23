/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        toro: {
          black: "#070707",
          panel: "#101010",
          gold: "#B77A32",
          goldLight: "#D7A35D"
        }
      },
      boxShadow: {
        gold: "0 24px 80px rgba(183, 122, 50, 0.18)"
      }
    }
  },
  plugins: []
};
