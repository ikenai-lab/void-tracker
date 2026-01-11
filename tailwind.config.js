/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Void & Vapor Palette
        'void-blue': '#021a24',
        'bio-orange': '#ffb347',
        'mist': '#eeeeee',
        // Dawn Gradient colors
        'dawn-cyan': '#e0f7fa',
        'dawn-peach': '#fbe9e7',
      },
      fontFamily: {
        'mono': ['SpaceMono_400Regular'],
        'mono-bold': ['SpaceMono_700Bold'],
        'sans': ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
      },
      borderRadius: {
        'organic': '32px',
      },
    },
  },
  plugins: [],
};
