/** @type {import('tailwindcss').Config} */

// Every colour is a CSS variable holding a space-separated RGB triple, wrapped
// so Tailwind's opacity modifiers still work (text-ink/70, bg-primary/10, ...).
// The variables get redefined under `.dark` in index.css, which means the whole
// app themes itself without a single `dark:` utility in the components.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: v('--c-ink'),
        surface: v('--c-surface'),
        card: v('--c-card'),
        line: v('--c-line'),
        // Text/icon colour that sits on top of a filled primary button.
        onprimary: v('--c-on-primary'),
        primary: {
          DEFAULT: v('--c-primary'),
          dark: v('--c-primary-dark'),
          light: v('--c-primary-light'),
        },
        accent: {
          DEFAULT: v('--c-accent'),
          dark: v('--c-accent-dark'),
        },
        danger: {
          DEFAULT: v('--c-danger'),
          dark: v('--c-danger-dark'),
        },
      },
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        ripple: {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--c-accent) / 0.45)' },
          '100%': { boxShadow: '0 0 0 18px rgb(var(--c-accent) / 0)' },
        },
        flow: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '48px 0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        ripple: 'ripple 1.8s ease-out infinite',
        flow: 'flow 1.2s linear infinite',
        'slide-up': 'slide-up 0.25s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};