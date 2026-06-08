/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#17253d',
          teal: '#0f9f9a',
          sky: '#3b82f6',
          amber: '#d97706'
        }
      }
    }
  },
  plugins: []
};

