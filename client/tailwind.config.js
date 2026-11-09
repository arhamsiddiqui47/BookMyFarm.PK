/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f7f1', 100: '#dcecdf', 500: '#2f7a46', 600: '#25633a', 700: '#1d4e2e' },
      },
    },
  },
  plugins: [],
};
