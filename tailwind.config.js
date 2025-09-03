/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-blue': '#00f5ff',
        'cyber-purple': '#8b5cf6',
        'cyber-green': '#10b981',
        'cyber-dark': '#0a0a0a',
        'cyber-gray': '#1a1a1a',
        'cyber-light-gray': '#2a2a2a',
      },
      fontFamily: {
        'cyber': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 245, 255, 0.3)',
        'cyber-hover': '0 0 30px rgba(0, 245, 255, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 245, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 245, 255, 0.8)' },
        }
      }
    },
  },
  plugins: [],
} 