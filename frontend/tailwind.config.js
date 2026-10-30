/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#30415f',
          teal: '#0f9f9a',
          sky: '#3b82f6',
          amber: '#d97706',
          coral: '#e76f51',
          cream: '#fff4df'
        }
      }
    }
  },
  plugins: []
};

