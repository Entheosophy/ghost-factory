/* // tailwind.config.js */
import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  
  // FIX #1: Add index.html to the content array.
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],

  // FIX #2: Force Tailwind to always generate the holographic-border class.
  safelist: [
    'holographic-border'
  ],

  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        spin: 'spin 4s linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};