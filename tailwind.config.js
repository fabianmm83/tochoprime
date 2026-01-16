/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tocho-primary': '#1a56db',
        'tocho-secondary': '#7e3af2',
        'tocho-success': '#0e9f6e',
        'tocho-danger': '#f05252',
        'tocho-warning': '#f59e0b',
        'tocho-info': '#3f83f8',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}