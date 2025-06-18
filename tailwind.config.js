/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xxl: '1366px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'pastel-background': 'hsl(var(--pastel-background))',
        'pastel-text': 'hsl(var(--pastel-text))',
        'pastel-card': 'hsl(var(--pastel-card))',
        'pastel-card-alt': 'hsl(var(--pastel-card-alt))',
        'pastel-primary': {
          DEFAULT: 'hsl(var(--pastel-primary-raw))',
          hover: 'hsl(var(--pastel-primary-raw) / 0.9)',
          text: 'hsl(var(--pastel-primary-text))',
        },
        'pastel-secondary': {
          DEFAULT: 'hsl(var(--pastel-secondary-raw))',
          hover: 'hsl(var(--pastel-secondary-raw) / 0.9)',
          text: 'hsl(var(--pastel-secondary-text))',
        },
        'pastel-tertiary': {
          DEFAULT: 'hsl(var(--pastel-tertiary-raw))',
          hover: 'hsl(var(--pastel-tertiary-raw) / 0.9)',
          text: 'hsl(var(--pastel-tertiary-text))',
        },
        'pastel-accent': {
          DEFAULT: 'hsl(var(--pastel-accent-raw))',
          hover: 'hsl(var(--pastel-accent-raw) / 0.9)',
          text: 'hsl(var(--pastel-accent-text))',
        },
        'pastel-muted': 'hsl(var(--pastel-muted))',
        'pastel-muted-foreground': 'hsl(var(--pastel-muted-foreground))',
        'pastel-highlight': 'hsl(var(--pastel-highlight-raw))',
        'pastel-highlight-border': 'hsl(var(--pastel-highlight-border))',
        'pastel-active-border': 'hsl(var(--pastel-active-border))',
        'pastel-border': 'hsl(var(--pastel-border))',
        'pastel-input': 'hsl(var(--pastel-input))',
        'pastel-input-border': 'hsl(var(--pastel-input-border))',
        'pastel-input-focus-border': 'hsl(var(--pastel-input-focus-border))',
        'pastel-ring': 'hsl(var(--pastel-ring))',
        'pastel-day-lundi': 'hsl(var(--pastel-day-lundi-raw))',
        'pastel-day-mardi': 'hsl(var(--pastel-day-mardi-raw))',
        'pastel-day-mercredi': 'hsl(var(--pastel-day-mercredi-raw))',
        'pastel-day-jeudi': 'hsl(var(--pastel-day-jeudi-raw))',
        'pastel-day-vendredi': 'hsl(var(--pastel-day-vendredi-raw))',
        'pastel-day-samedi': 'hsl(var(--pastel-day-samedi-raw))',
        'pastel-day-dimanche': 'hsl(var(--pastel-day-dimanche-raw))',
        'pastel-day-text': 'hsl(var(--pastel-day-text-raw))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        'pastel-soft': '0 4px 12px 0 hsla(var(--pastel-shadow-raw), 0.08)',
        'pastel-medium': '0 6px 18px 0 hsla(var(--pastel-shadow-raw), 0.12)',
        'pastel-strong': '0 8px 24px 0 hsla(var(--pastel-shadow-raw), 0.16)',
        'pastel-button': '0 2px 4px 0 hsla(var(--pastel-shadow-raw), 0.1), 0 1px 2px 0 hsla(var(--pastel-shadow-raw), 0.06)',
        'pastel-button-hover': '0 3px 6px 0 hsla(var(--pastel-shadow-raw), 0.12), 0 2px 4px 0 hsla(var(--pastel-shadow-raw), 0.08)',
        'pastel-button-inset': 'inset 0 1px 3px 0 hsla(var(--pastel-shadow-raw), 0.15)',
        'pastel-input': '0 1px 2px 0 hsla(var(--pastel-shadow-raw), 0.05)',
        'pastel-input-focus': '0 0 0 2px hsla(var(--pastel-ring), 0.4), 0 1px 2px 0 hsla(var(--pastel-shadow-raw), 0.05)',
        'pastel-card-item': '0 2px 6px 0 hsla(var(--pastel-shadow-raw), 0.06)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}