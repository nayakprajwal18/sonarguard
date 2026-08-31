/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Purple Theme - SonarGuard
        'obsidian': '#0A071B',          // Deep Space Obsidian background
        'dark-purple': '#140E2D',       // Dark Purple Card Panels
        'accent-purple': '#2E1F54',     // Deep Purple Accent Borders
        'neon-violet': '#8B5CF6',       // Neon Violet Highlight
        'electric-cyan': '#06B6D4',     // Electric Cyan Target Outlines
        'lavender': '#A78BFA',          // Muted Lavender Text
        'slate-text': '#CBD5E1',        // Slate Text
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
      },
      borderRadius: {
        'glass': '12px',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
