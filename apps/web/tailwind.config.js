// Configuration Tailwind v3.4 — reprise de design/implementation.md (tailwind.config.ts converti en JS).
// Les couleurs pointent vers les variables CSS de src/index.css (tokens du design system).
import defaultTheme from 'tailwindcss/defaultTheme';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1256px' } },
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        h1: ['24px', { lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.012em' }],
        h2: ['20px', { lineHeight: '28px', fontWeight: '600', letterSpacing: '-0.01em' }],
        h3: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px' }],
        small: ['13px', { lineHeight: '18px' }],
        caption: ['12px', { lineHeight: '16px' }],
        label: ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          subtle: 'hsl(var(--primary-subtle))',
          text: 'hsl(var(--primary-text))',
          border: 'hsl(var(--primary-border))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
          strong: 'hsl(var(--muted-strong))',
        },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          subtle: 'hsl(var(--danger-subtle))',
          text: 'hsl(var(--danger-text))',
          border: 'hsl(var(--danger-border))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          subtle: 'hsl(var(--success-subtle))',
          text: 'hsl(var(--success-text))',
          border: 'hsl(var(--success-border))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          subtle: 'hsl(var(--warning-subtle))',
          text: 'hsl(var(--warning-text))',
          border: 'hsl(var(--warning-border))',
        },
        neutral: { dot: 'hsl(var(--neutral-dot))' },
        panel: {
          DEFAULT: 'hsl(var(--panel))',
          foreground: 'hsl(var(--panel-foreground))',
          muted: 'hsl(var(--panel-muted))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)' /* 10px — cartes, dialogs, toasts */,
        md: 'calc(var(--radius) - 4px)' /* 6px — boutons, inputs */,
        sm: 'calc(var(--radius) - 6px)' /* 4px — segmented items, miniatures */,
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
        DEFAULT: '0 1px 2px rgba(15, 23, 42, 0.06)',
      },
      spacing: { sidebar: '248px', header: '64px', touch: '44px' },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};
