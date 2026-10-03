/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // `dark:` variants follow <html data-theme="dark"> set by ThemeContext
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Theme tokens live as RGB channels in src/assets/styles/index.css (:root)
      colors: {
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        primaryDark: 'rgb(var(--c-primary-dark) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        background: 'rgb(var(--c-background) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        foreground: 'rgb(var(--c-foreground) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        float: 'var(--shadow-float)',
        shell: 'var(--shadow-shell)',
        'primary-glow': '0 6px 24px rgb(var(--c-primary) / 0.35)',
        'success-glow': '0 6px 24px rgb(var(--c-success) / 0.30)',
        'input-focus': '0 0 0 3px rgb(var(--c-primary) / 0.25)',
      },
      borderRadius: {
        app: '12px',
        card: '18px',
        pill: '50px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, rgb(var(--c-primary)) 0%, rgb(var(--c-primary-dark)) 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, rgb(var(--c-primary)) 0%, rgb(var(--c-primary-dark) / 0.85) 100%)',
        'gradient-surface': 'linear-gradient(180deg, rgb(var(--c-card)) 0%, rgb(var(--c-background)) 100%)',
        'gradient-hero': 'linear-gradient(135deg, rgb(var(--c-primary) / 0.18) 0%, rgb(var(--c-primary) / 0.08) 50%, rgb(var(--c-background)) 100%)',
      },
      keyframes: {
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-heart': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'wave-bar': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'section-reveal': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.75)', opacity: '0' },
          '60%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.35' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'scale-in': 'scale-in 0.45s ease-out',
        'pulse-heart': 'pulse-heart 1.8s ease-in-out infinite',
        'wave-bar': 'wave-bar 0.9s ease-in-out infinite',
        'slide-up-fade': 'slide-up-fade 0.35s ease-out both',
        'section-reveal': 'section-reveal 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 2s linear infinite',
        'typing-dot': 'typing-dot 1.2s ease-in-out infinite',
        'toast-in': 'toast-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
