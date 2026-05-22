/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dde6f4',
          200: '#b9ceea',
          300: '#86a8d8',
          400: '#4d7dc3',
          500: '#2d5fa8',
          600: '#1e4a8c',
          700: '#163870',
          800: '#0f2850',
          900: '#091a35',
          950: '#060f20',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
    },
  },
  plugins: [],
};
