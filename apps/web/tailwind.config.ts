import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
        },
        pitch: {
          50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a',
        },
        score: {
          live: '#ef4444',
          ft: '#6b7280',
          scheduled: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
