// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  output: 'server',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), icon()],

  // Prefetch para navegación más rápida
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover'
  }
});