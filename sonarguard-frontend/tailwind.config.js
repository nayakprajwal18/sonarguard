/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marine Surveillance Command Center Theme
        'navy-950': '#0F1419',          // Deep navy background (near-black)
        'navy-900': '#1A1F2E',          // Dark navy for panels
        'navy-800': '#252D3D',          // Slightly lighter navy for borders
        'navy-700': '#303A52',          // Navy for hover states
        
        // Cyan/Teal - Primary data/sonar accent
        'cyan-500': '#06B6D4',          // Main cyan (sonar data)
        'cyan-400': '#22D3EE',          // Light cyan (highlights)
        'cyan-600': '#0891B2',          // Dark cyan (borders)
        
        // Greens - Verified/safe states
        'emerald-500': '#10B981',       // Verified/confirmed
        'emerald-600': '#059669',       // Deep emerald
        'emerald-400': '#34D399',       // Light emerald
        
        // Orange - Pending/review states
        'amber-500': '#F59E0B',         // Pending review
        'amber-600': '#D97706',         // Deep amber
        'amber-400': '#FBBF24',         // Light amber
        
        // Red - High-priority/alert states
        'red-500': '#EF4444',           // High priority
        'red-600': '#DC2626',           // Deep red
        'red-400': '#F87171',           // Light red
        
        // Yellow - Uncertain/anomaly states
        'yellow-500': '#EAB308',        // Anomaly/uncertain
        'yellow-600': '#CA8A04',        // Deep yellow
        'yellow-400': '#FACC15',        // Light yellow
        
        // Purples - Brand accent (subtle)
        'purple-600': '#7C3AED',        // Brand accent
        'purple-500': '#A855F7',        // Lighter accent
        'purple-400': '#C084FC',        // Subtle accent
        
        // Text colors
        'text-primary': '#F1F5F9',      // White/light gray
        'text-secondary': '#CBD5E1',    // Slate gray
        'text-muted': '#94A3B8',        // Muted gray
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.25)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.25)',
        'sonar-ring': '0 0 30px rgba(6, 182, 212, 0.15)',
      },
      borderRadius: {
        'glass': '12px',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Courier New', 'monospace'],
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'scan-line': 'scan-line 4s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'radar-sweep': 'radar-sweep 20s linear infinite',
      },
    },
  },
  plugins: [],
}
