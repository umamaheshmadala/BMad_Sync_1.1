/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0f14',
        foreground: '#e6e7eb',
        primary: {
          DEFAULT: '#7c5cff',
          foreground: '#0b0f14',
        },
        accent: '#5eead4',
        muted: '#151a22',
        card: '#10151c',
        border: '#1e2632',
      },
      boxShadow: {
        glow: '0 0 32px rgba(124, 92, 255, 0.25)',
      },
    },
  },
  plugins: [],
};


