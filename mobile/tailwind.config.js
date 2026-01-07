/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: '#FF6B6B',
          light: '#FF8E8E',
        },
        mint: {
          DEFAULT: '#4ECDC4',
          light: '#95E1D3',
        },
        cream: '#FFF9F5',
        charcoal: '#2D2A32',
        muted: '#8E8A94',
        border: '#F0EBE7',
        surface: '#F5F0EC',
      },
    },
  },
  plugins: [],
};
