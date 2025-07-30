/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
      },
      keyframes: {
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
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
      },
      fontFamily: {
        'google-sans': ['Google Sans', 'Roboto', 'Arial', 'sans-serif'],
        'roboto': ['Roboto', 'Arial', 'sans-serif'],
        'melodrama-light': ['Melodrama-Light', 'sans-serif'],
        'melodrama-regular': ['Melodrama-Regular', 'sans-serif'],
        'melodrama-medium': ['Melodrama-Medium', 'sans-serif'],
        'melodrama-semibold': ['Melodrama-Semibold', 'sans-serif'],
        'melodrama-bold': ['Melodrama-Bold', 'sans-serif'],
        'melodrama-variable': ['Melodrama-Variable', 'sans-serif'],
      },
      borderRadius: {
        'google': '8px',
      },
      boxShadow: {
        'google': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'google-hover': '0 4px 6px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  plugins: [],
}
