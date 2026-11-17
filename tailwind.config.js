/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
     screens:{
      'xs':'320px',
   
     },
      colors: {
        admin: {
          canvas: "var(--admin-canvas)",
          surface: "var(--admin-surface)",
          ink: "var(--admin-ink)",
          muted: "var(--admin-muted)",
          border: "var(--admin-border)",
          sidebar: "var(--admin-sidebar)",
          "sidebar-deep": "var(--admin-sidebar-deep)",
          primary: "var(--admin-primary)",
          accent: "var(--admin-accent)",
          "accent-hover": "var(--admin-accent-hover)",
          "accent-soft": "var(--admin-accent-soft)",
          success: "var(--admin-success)",
          warning: "var(--admin-warning)",
          danger: "var(--admin-danger)",
          info: "var(--admin-info)",
        },
      },
      boxShadow: {
        'admin-sm': "var(--admin-shadow-sm)",
        admin: "var(--admin-shadow)",
        'admin-lg': "var(--admin-shadow-lg)",
      },
      borderRadius: {
        admin: "16px",
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        shimmer: 'shimmer 1.8s linear infinite',
      },
      // fontFamily: {
      //   sans: ['var(--font-cairo)', 'sans-serif'],
      //   Cairo: ['var(--font-cairo)'],
      // },
    },
  },
  plugins: [],
};
