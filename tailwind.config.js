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
        dark: {
          950: '#09090b',
          900: '#111115',
          850: '#16161c',
          800: '#1f1f27',
          750: '#262631',
          700: '#323241',
        },
        gold: {
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
        },
        brand: {
          gold: '#CBAC57',
          goldLight: '#E6CF8A',
          goldDark: '#9F802A',
          red: '#E11D48',
          redDark: '#BE123C',
          orange: '#F97316'
        },
        buffet: {
          bg: '#202630',
          dark: '#15191F',
          card: '#1A202A',
          cardHover: '#232B37',
          border: '#2E3744',
          borderLight: '#3D495B',
          gold: '#D8B85A',
          goldLight: '#E8D58A',
          goldDark: '#B3913A',
          cream: '#F4F0E5',
          creamCard: '#FAF7F0',
          creamBorder: '#E5DEC9',
          textDark: '#252A31',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Cinzel', '"Playfair Display"', 'serif'],
        serif: ['"Playfair Display"', 'Cinzel', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        body: ['"Plus Jakarta Sans"', 'Poppins', 'sans-serif']
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(203, 172, 87, 0.35)',
        'glow-buffet': '0 0 30px -5px rgba(216, 184, 90, 0.30)',
        'glow-buffet-sm': '0 0 15px -3px rgba(216, 184, 90, 0.25)',
        'glow-red': '0 0 25px -5px rgba(225, 29, 72, 0.35)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
        'buffet-card': '0 12px 35px -8px rgba(10, 14, 20, 0.65)',
        'buffet-luxury': '0 20px 50px -12px rgba(0, 0, 0, 0.85), 0 0 20px rgba(216, 184, 90, 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-shimmer': 'linear-gradient(135deg, #D8B85A 0%, #F5E7B2 50%, #D8B85A 100%)',
      }
    },
  },
  plugins: [],
}
