import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        rojo: {
          principal: '#C0272D',
          hover: '#A01E23',
          suave: '#F5E0E0',
        },
        gris: {
          oscuro: '#1E1E1E',
          medio: '#4A4A4A',
          claro: '#B0B0B0',
          fondo: '#F4F4F4',
        },
      },
      fontFamily: {
        barlow: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/container-queries')],
}

export default config
