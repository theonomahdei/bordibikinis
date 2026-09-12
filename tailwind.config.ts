import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-archivo)', 'sans-serif'],
      },
      colors: {
        ink: '#000000',
        paper: '#ffffff',
        offwhite: '#F7F6F5',
        smoke: '#E5E5E5',
        stone: '#979696',
        sand: '#EFE7DC',
        blush: '#F6DFD4',
        error: '#DD001B',
      },
      letterSpacing: {
        loose: '0.03em',
        wider2: '0.048em',
        widest2: '0.1em',
      },
    },
  },
  plugins: [],
};
export default config;
