/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0040CC',
        'brand-blue-dark': '#002F99',
        'brand-orange': '#FF8000',
        'brand-yellow': '#FFE600',
        'brand-text': '#4D4D4D',
        'brand-muted': '#8C8C8C',
        'brand-danger': '#CC5200',
        'brand-success': '#149E60',
        'brand-panel': '#F5F6F7',
        border: '#DCDDE0'
      },
      fontFamily: {
        sans: ['Century Gothic', 'CenturyGothic', 'AppleGothic', 'Segoe UI', 'sans-serif'],
        mono: ['Century Gothic', 'CenturyGothic', 'AppleGothic', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
