/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          300: '#b4e1fa',
          400: '#9cdcfe',
          500: '#569cd6', // Soft Sky Blue
          600: '#4a8cc7',
          700: '#3a72a5',
          800: '#2c5882',
          900: '#1e3d5e',
        },
        pink: {
          400: '#d19bc9',
          500: '#c586c0', // Muted Rose Pink
          600: '#a86da3',
        },
        gray: {
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
        },
        background: '#1e1e1e', // Charcoal background
        sidebar: '#252526',
        card: '#252526',
        border: '#333333',
        textMain: '#cccccc',
        accent: '#569cd6'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
