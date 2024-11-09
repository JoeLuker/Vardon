/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			spacing: {
				'18': '4.5rem',
				'22': '5.5rem',
			},
			colors: {
				'primary': {
					DEFAULT: '#c19a6b',
					dark: '#a67b4b',
					light: '#d4b38d',
				}
			}
		}
	},
	plugins: []
};
