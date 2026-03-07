/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'redbull-red': '#DC0032',
        'redbull-dark-blue': '#0A1931',
        'redbull-silver': '#C0C0C0',
        'redbull-navy': '#16213E',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'redbull-glow': '0 0 20px rgba(220, 0, 50, 0.15)',
        'redbull-glow-lg': '0 0 30px rgba(220, 0, 50, 0.2)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        'gradient-redbull': 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)',
        'gradient-redbull-subtle': 'linear-gradient(135deg, rgba(220, 0, 50, 0.03) 0%, rgba(10, 25, 49, 0.02) 100%)',
      },
    },
  },
  plugins: [],
};
