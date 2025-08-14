import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/flowbite-react/lib/**/*.js', // Path ke Flowbite
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin'), // Plugin Flowbite
  ],
}

export default config