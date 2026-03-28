/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          600: '#1e3a8a',
          700: '#1e40af',
          800: '#1a3472',
          900: '#0f2356',
          950: '#0a1628'
        }
      }
    }
  },
  plugins: []
}
