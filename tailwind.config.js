/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        oled: '#000000',
        darkCard: '#0d0f12',
        darkCardHover: '#14171d',
        darkBorder: '#1e232d',
        neon: {
          DEFAULT: '#10b981', // Neon Emerald
          mint: '#34d399',    // Mint Green
          glow: 'rgba(16, 185, 129, 0.25)',
          dark: '#059669'
        },
        cyan: {
          neon: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.25)',
          deep: '#0891b2'
        },
        amber: {
          neon: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.25)'
        },
        violet: {
          neon: '#8b5cf6',
          glow: 'rgba(139, 92, 246, 0.25)'
        }
      },
      boxShadow: {
        'neon': '0 4px 20px rgba(16, 185, 129, 0.3)',
        'neon-lg': '0 8px 30px rgba(16, 185, 129, 0.45)',
        'cyan-glow': '0 4px 20px rgba(6, 182, 212, 0.3)',
        'amber-glow': '0 4px 20px rgba(245, 158, 11, 0.3)',
        'violet-glow': '0 4px 20px rgba(139, 92, 246, 0.3)',
        'card-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.45)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orb-contract': 'orbContract 1.5s ease-in-out infinite alternate',
        'orb-expand': 'orbExpand 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.88', transform: 'scale(1.02)' },
        },
        orbContract: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.88)' },
        },
        orbExpand: {
          '0%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1.08)' },
        }
      }
    },
  },
  plugins: [],
}
