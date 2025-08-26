/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Georgia', 'Times New Roman', 'serif'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      colors: {
        // Medium.com inspired color palette
        'medium-green': '#1a8917',
        'medium-gray': {
          50: '#f8f9fa',
          100: '#f2f3f5',
          200: '#e6e8eb',
          300: '#c4c8cc',
          400: '#9aa0a6',
          500: '#6b7280',
          600: '#545962',
          700: '#3c4142',
          800: '#242526',
          900: '#191a1a'
        },
        'medium-text': '#292929',
        'medium-light': '#757575',
        'medium-border': '#e6e6e6'
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'Georgia, serif',
            lineHeight: '1.58',
            fontSize: '21px',
            color: '#292929',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
