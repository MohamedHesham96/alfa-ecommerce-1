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
          canvas: "#f3f5f9",
          surface: "#ffffff",
          ink: "#101828",
          muted: "#667085",
          border: "#e4e8f0",
          sidebar: "#0e2239",
          "sidebar-deep": "#0a192c",
          primary: "#163b5f",
          accent: "#cf4356",
          "accent-hover": "#b63548",
          "accent-soft": "#fceef1",
          success: "#0e8a5f",
          warning: "#b7791f",
          danger: "#c2415a",
          info: "#2563eb",
        },
      },
      boxShadow: {
        'admin-sm': "0 1px 2px rgba(16,24,40,0.04)",
        admin: "0 1px 3px rgba(16,24,40,0.06), 0 18px 40px -24px rgba(15,23,42,0.28)",
        'admin-lg': "0 30px 80px -20px rgba(2,12,27,0.45)",
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
