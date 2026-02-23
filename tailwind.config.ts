import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/renderer/**/*.{tsx,ts,html}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds (blue-gray palette from wireframes)
        'bg-app': '#1C2433',
        'bg-surface': '#242B38',
        'bg-surface-raised': '#2A3245',
        'bg-surface-hover': '#313B4D',
        'bg-surface-active': '#384357',
        'bg-input': '#1C2433',

        // Text (warm off-white hierarchy)
        'text-primary': '#E8E6E0',
        'text-secondary': '#8A9BB0',
        'text-tertiary': '#556070',
        'text-inverse': '#1C2433',

        // Accent (Sage Green)
        accent: '#6A9E7F',
        'accent-hover': '#7DB592',
        'accent-muted': '#6A9E7F33',

        // Status Badge Colors
        'status-active': '#4A7BA7',
        'status-waiting': '#D4956A',
        'status-blocked': '#B85C5C',
        'status-ready': '#6A9E7F',
        'status-stale': '#4A5568',
        'status-abandoned': '#4A5568',

        // PR State Colors
        'pr-open': '#6A9E7F',
        'pr-draft': '#D4956A',
        'pr-merged': '#8b6cc1',
        'pr-closed': '#556070',

        // Borders
        'border-default': '#2E3847',
        'border-subtle': '#242B38',
        'border-focus': '#6A9E7F',

        // Semantic
        success: '#6A9E7F',
        warning: '#D4956A',
        error: '#B85C5C',
        'error-hover': '#C96B6B',
        info: '#4A7BA7',
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-10': '40px',
        'space-12': '48px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          "'SF Pro'",
          'system-ui',
          'sans-serif',
        ],
        mono: [
          "'SF Mono'",
          'SFMono-Regular',
          'ui-monospace',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', fontWeight: '400' }],
        xs: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        sm: ['13px', { lineHeight: '18px', fontWeight: '400' }],
        base: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        md: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        lg: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        xl: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'mono-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'mono-base': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'mono-lg': ['18px', { lineHeight: '26px', fontWeight: '500' }],
      },
      transitionDuration: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        save: '1500ms',
      },
      transitionTimingFunction: {
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.3)',
        md: '0 10px 40px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      keyframes: {
        progress: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        progress: 'progress 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
