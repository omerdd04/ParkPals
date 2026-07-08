/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        park: {
          50: '#f1faf0', 100: '#dcf2d9', 200: '#bce6b6', 300: '#8fd485',
          400: '#5ebb52', 500: '#3ea033', 600: '#2d8125', 700: '#256620',
          800: '#21521e', 900: '#1d431b',
        },
        bark: {
          50: '#fbf7f1', 100: '#f3e9d8', 200: '#e6d0af', 300: '#d6b07f',
          400: '#c68f56', 500: '#b9793f', 600: '#a56234', 700: '#894c2d',
          800: '#703f2a', 900: '#5c3525',
        },
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
