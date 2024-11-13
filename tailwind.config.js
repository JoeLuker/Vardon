// tailwind.config.js
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
			DEFAULT: '#c19a6b',
			dark: '#a67b4b',
			light: '#d4b38d'
		  }
		},
		fontFamily: {
		  serif: ['Cinzel', 'serif'],
		},
		spacing: {
		  18: '4.5rem',
		  22: '5.5rem'
		}
	  }
	},
	plugins: [
	  require('@tailwindcss/typography')
	]
  };
  