module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Light Mode - Medical/Tech Palette */
        'ivory': '#fffefe',
        'light-cyan': '#E0FBFC',
        'sky-blue': '#8ebcca',
        'steel-blue': '#4b7a9f',
        'aqua-mist': '#ccede6',
        'medical-red': '#cc0000',
        
        /* Dark Mode - Medical/Tech Palette */
        'deep-navy': '#0f172a',
        'slate-surface': '#1e293b',
        'muted-steel': '#334155',
        'cool-gray': '#64748b',
        'sky-accent': '#8ebcca',
        'red-accent': '#cc0000',
        
        /* Semantic Colors */
        primary: {
          DEFAULT: '#4b7a9f',
          light: '#8ebcca',
          dark: '#334155',
        },
        accent: {
          DEFAULT: '#8ebcca',
          light: '#E0FBFC',
          dark: '#64748b',
        },
        danger: {
          DEFAULT: '#cc0000',
          light: '#ff4444',
          dark: '#aa0000',
        },
        background: {
          light: '#fffefe',
          dark: '#0f172a',
        },
        surface: {
          light: '#E0FBFC',
          dark: '#1e293b',
        },
      },
      borderRadius: {
        'medical': '1.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Nunito Sans', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        'medical': '500ms',
      },
      transitionTimingFunction: {
        'medical': 'ease-in-out',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(142, 188, 202, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(142, 188, 202, 0.8)' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      boxShadow: {
        'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medical-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    }
  },
  plugins: []
}
