/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta diseñada para accesibilidad TEA
        primary: {
          DEFAULT: '#4A90E2', // Azul calmado
          light: '#6AA8F0',
          dark: '#3178C6',
        },
        secondary: {
          DEFAULT: '#7ED321', // Verde suave
          light: '#96E03F',
          dark: '#6ABC1B',
        },
        'neutral-white': '#FFFFFF',
        'neutral-gray': '#333333', // Textos
        'neutral-gray-light': '#F5F7FA', // Fondos alternos
        'neutral-gray-medium': '#9CA3AF',
        'status-warning': '#F5A623',  // Naranja suave
        'status-error': '#D0021B',    // Rojo suave
        'status-success': '#7ED321',  // Verde (igual a secondary)
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      spacing: {
        // Espaciado generoso para accesibilidad
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
      },
      minHeight: {
        'touch': '2.75rem', // 44px mínimo para elementos táctiles
      },
      minWidth: {
        'touch': '2.75rem', // 44px mínimo para elementos táctiles
      },
      screens: {
        // Breakpoints responsive
        'mobile': '320px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
    },
  },
  plugins: [],
}
