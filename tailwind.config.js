/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
	  extend: {
		colors: {
		  parchment: {
			DEFAULT: '#fffef0',
			dark: '#f3e5ab',
			light: '#fffff5'
		  },
		  primary: {
			DEFAULT: '#8b4513',
			dark: '#5c2d0e',
			light: '#a65d1e'
		  },
		  accent: {
			DEFAULT: '#c41e3a',
			light: '#dc143c',
			dark: '#8b1428'
		  },
		  ink: {
			DEFAULT: '#2d3748',
			light: '#4a5568',
			dark: '#1a202c'
		  }
		},
		fontFamily: {
		  serif: ['Cinzel', 'serif'],
		  sans: ['Inter', 'system-ui', 'sans-serif']
		},
		spacing: {
		  18: '4.5rem',
		  22: '5.5rem'
		},
		animation: {
		  'fade-in': 'fadeIn 0.3s ease-out',
		  'slide-up': 'slideUp 0.4s ease-out',
		  'scale-in': 'scaleIn 0.3s ease-out'
		},
		keyframes: {
		  fadeIn: {
			'0%': { opacity: '0' },
			'100%': { opacity: '1' }
		  },
		  slideUp: {
			'0%': { transform: 'translateY(10px)', opacity: '0' },
			'100%': { transform: 'translateY(0)', opacity: '1' }
		  },
		  scaleIn: {
			'0%': { transform: 'scale(0.95)', opacity: '0' },
			'100%': { transform: 'scale(1)', opacity: '1' }
		  }
		}
	  }
	},
	plugins: [
	  require('@tailwindcss/typography')
	]
  };