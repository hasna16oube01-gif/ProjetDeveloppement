/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        fredoka: ['Fredoka One', 'cursive'],
      },
      colors: {
        primary: { 400: '#4f8ef7', 500: '#3b7ef4', 600: '#2563eb' },
        secondary: { 400: '#f97bf5', 500: '#e879f9', 600: '#c026d3' },
        accent: { 400: '#fbbf24', 500: '#f59e0b' },
        success: '#22c55e',
        danger: '#ef4444',
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem', '3xl': '2rem' },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        pop: 'pop 0.3s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%,100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
