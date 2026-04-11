/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Archive Industrial — Material Dynamic Color (FIDELITY variant, seed #E5A443)
        surface: {
          DEFAULT: '#151311',
          dim: '#151311',
          bright: '#3b3936',
          container: {
            lowest: '#100e0c',
            low: '#1d1b19',
            DEFAULT: '#211f1d',
            high: '#2c2927',
            highest: '#373432',
          },
          variant: '#373432',
          tint: '#feba56',
        },
        primary: {
          DEFAULT: '#ffc169',
          container: '#e5a443',
          dim: '#feba56',
          fixed: { DEFAULT: '#ffddb4', dim: '#feba56' },
        },
        secondary: {
          DEFAULT: '#c2c9b4',
          container: '#454b3b',
          fixed: { DEFAULT: '#dee5cf', dim: '#c2c9b4' },
        },
        tertiary: {
          DEFAULT: '#cecbc6',
          container: '#b2b0ab',
          fixed: { DEFAULT: '#e5e2dc', dim: '#c9c6c1' },
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        outline: {
          DEFAULT: '#9e8e7d',
          variant: '#514536',
        },
        'on-surface': '#e7e1de',
        'on-surface-variant': '#d5c4b1',
        'on-primary': '#452b00',
        'on-primary-container': '#5e3c00',
        'on-secondary': '#2c3323',
        'on-secondary-container': '#b4bba6',
        'on-tertiary': '#31312d',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',
        'on-background': '#e7e1de',
        background: '#151311',
        'inverse-surface': '#e7e1de',
        'inverse-on-surface': '#32302e',
        'inverse-primary': '#835500',
      },
      borderRadius: {
        DEFAULT: '0px',
        lg: '0px',
        xl: '0px',
        full: '9999px',
      },
      fontFamily: {
        headline: ['Newsreader', 'serif'],
        body: ['Space Grotesk', 'monospace'],
        label: ['Space Grotesk', 'monospace'],
      },
    },
  },
  plugins: [],
};
