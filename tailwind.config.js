// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ---- ADD THIS LINE ----
  darkMode: 'class', // Enables class-based dark mode (e.g., <html class="dark">)
  // -----------------------
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Your existing content configuration
  ],
  theme: {
    extend: {
      fontFamily: { // Your existing font family extension
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // You can add more theme extensions here later if needed
      // e.g., specific colors for dark mode
      // colors: {
      //   'primary-dark': '#somecolor',
      // }
    },
  },
  plugins: [
      // You might add plugins later, like @tailwindcss/forms
  ],
}