/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e1a47',
          light: '#4b2d6f',
        },
        secondary: '#6b46c1',
        accent: '#ff7e5f',
        warning: '#f6ad55',
        success: '#48bb78',
        error: '#e53e3e',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 