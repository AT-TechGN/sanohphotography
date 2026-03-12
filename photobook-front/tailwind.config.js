import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import aspectRatio from '@tailwindcss/aspect-ratio';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design colors from HTML
        ink: '#0e0e0e',
        cream: '#f5f0ea',
        gold: '#c9a84c',
        red: '#E94560',
        dark: '#1A1A2E',
        mid: '#2a2a3e',
        muted: '#8a8a9a',
        // Keep existing colors
        sage: {
          50: '#f3f7f4',
          100: '#e6f0e8',
          200: '#cfe1cf',
          300: '#b6d2b0',
          400: '#8fb589',
          500: '#6b9766',
          600: '#4d6f4d',
          700: '#335244',
          800: '#22382f',
          900: '#0f1d18',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fade-up': 'fadeUp 0.6s ease both',
        'fade-in': 'fadeIn 0.6s ease both',
        'scroll-pulse': 'scrollPulse 2s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scrollPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scaleY(1)' },
          '50%': { opacity: '1', transform: 'scaleY(1.1)' },
        },
      },
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
}

