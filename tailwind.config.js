/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
	  extend: {
		fontFamily: {
		  serif: ['Cinzel', 'serif'],
		  sans: ['Inter', 'system-ui', 'sans-serif'],
		  display: ['"Pirata One"', 'cursive'],
		  decorative: ['"Bilbo Swash Caps"', 'cursive'],
		  special: ['Morris', 'serif'],
		  pirata: ['Pirata One', 'cursive'],
		  cinzel: ['Cinzel', 'serif'],
		  bilbo: ['Bilbo Swash Caps', 'cursive'],
		},
		colors: {
		  parchment: {
			50: '#fffefb',
			100: '#fffeef',  // light
			200: '#fffef0',  // DEFAULT
			300: '#f3e5ab',  // dark
			400: '#e6d492',
		  },
		  primary: {
			DEFAULT: '#c19a6b',  // This adds support for bg-primary
			50: '#f3e8dc',
			100: '#e7d1b9',
			200: '#d4b48c',  // light
			300: '#c19a6b',  // DEFAULT
			400: '#a67b4b',  // dark
			500: '#8b5e2f',
		  },
		  accent: {
			50: '#f5e6dc',
			100: '#ebc7b0',
			200: '#a65d2b',  // light
			300: '#8b4513',  // DEFAULT
			400: '#5c2d0e',  // dark
			500: '#3a1c09',
		  },
		  ink: {
			50: '#f5f2f1',
			100: '#4a2f23',  // light
			200: '#2b1810',  // DEFAULT
			300: '#1a0f0a',  // dark
			400: '#0d0705',
		  },
		},
		spacing: {
		  18: '4.5rem',
		  22: '5.5rem'
		},
		animation: {
		  'fade-in': 'fadeIn 0.3s ease-out',
		  'slide-up': 'slideUp 0.4s ease-out',
		  'scale-in': 'scaleIn 0.3s ease-out',
		  'grain': 'grain 8s steps(10) infinite',
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
		  },
		  grain: {
			'0%, 100%': { transform: 'translate(0, 0)' },
			'10%': { transform: 'translate(-5%, -10%)' },
			'20%': { transform: 'translate(-15%, 5%)' },
			'30%': { transform: 'translate(7%, -25%)' },
			'40%': { transform: 'translate(-5%, 25%)' },
			'50%': { transform: 'translate(-15%, 10%)' },
			'60%': { transform: 'translate(15%, 0%)' },
			'70%': { transform: 'translate(0%, 15%)' },
			'80%': { transform: 'translate(3%, 35%)' },
			'90%': { transform: 'translate(-10%, 10%)' }
		  }
		}
	  },
	},
	plugins: [
	  require('@tailwindcss/typography'),
	]
  };