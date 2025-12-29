import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Modern Amis palette
        primary: '#E63946', // Amis Red
        secondary: '#1D3557', // Ocean Blue
        background: '#F1FAEE', // Off-white/Beige
        surface: '#FFFFFF', // Card Bg
        text: {
          DEFAULT: '#1F2937', // Soft black
          muted: '#6B7280', // Gray
        },
        accent: {
          yellow: '#FFB703', // Ornaments
          green: '#2A9D8F', // Nature
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', ...defaultTheme.fontFamily.sans],
        heading: ['Inter', 'Noto Sans TC', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        surface: '0 8px 24px rgba(0,0,0,0.06)',
      },
      keyframes: {
        press: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' },
        },
        flipIn: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '100%': { transform: 'rotateY(180deg)', opacity: '1' },
        },
      },
      animation: {
        press: 'press 150ms ease-out',
        flip: 'flipIn 300ms cubic-bezier(0.4, 0.2, 0.2, 1)',
      },
      borderRadius: {
        lg: '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
