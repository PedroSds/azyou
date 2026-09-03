/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          bg: "#FFFFFF",      // Branco puro
          dark: "#000000",    // Preto
          card: "#FFFFFF",    // Branco
          border: "#E5E7EB",  // Cinza muito claro para bordas
          purple: "#B39EB5",  // Roxo específico
          blue: "#B39EB5",    // Roxo específico
          accent: "#B39EB5",  // Roxo específico
          violet: "#B39EB5",  // Roxo específico
          lilac: "#B39EB5",   // Roxo específico
          gold: "#B39EB5",    // Roxo específico (sem dourado extra)
          goldLight: "#B39EB5",
          star: "#000000",    // Preto (textos principais)
          muted: "#000000",   // Preto (tudo preto conforme solicitado)
          text: "#000000",    // Preto
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"], // Primária
        serif: ["'Inter'", "system-ui", "sans-serif"], // Removendo a cursiva dos cabeçalhos padrão
        cursive: ["'Story Script'", "cursive"], // Fonte Story Script do Google Fonts
      },
      backgroundImage: {
        "cosmic-gradient": "radial-gradient(ellipse at top, #2D1B69 0%, #050510 60%)",
        "card-gradient": "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(15,37,87,0.3) 100%)",
        "gold-gradient": "linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)",
        "violet-gradient": "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "twinkle": "twinkle 2s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124,58,237,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(124,58,237,0.6)" },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "cosmic": "0 0 30px rgba(124,58,237,0.2), 0 0 60px rgba(124,58,237,0.1)",
        "gold": "0 0 20px rgba(212,175,55,0.3)",
        "card": "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
