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
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
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
        'redbull-glow': '0 0 20px rgba(220, 0, 50, 0.3)',
        'redbull-glow-lg': '0 0 30px rgba(220, 0, 50, 0.4)',
      },
      backgroundImage: {
        'gradient-redbull': 'linear-gradient(135deg, #DC0032 0%, #0A1931 100%)',
        'gradient-redbull-subtle': 'linear-gradient(135deg, rgba(220, 0, 50, 0.1) 0%, rgba(10, 25, 49, 0.1) 100%)',
      },
    },
  },
  plugins: [],
};
