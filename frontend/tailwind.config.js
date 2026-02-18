/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme palette
        'midnight': {
          900: '#0a0a0f',
          800: '#0f1019',
          700: '#151723',
          600: '#1c1f2e',
        },
        // Neon accent colors
        'neon': {
          cyan: '#00f5ff',
          violet: '#a855f7',
          amber: '#fbbf24',
          emerald: '#10b981',
          rose: '#f43f5e',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 245, 255, 0.3)',
        'glow-violet': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.3)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
