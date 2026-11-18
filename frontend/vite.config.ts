import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import fontScalePlugin from './font-scale-plugin.ts';
import criticalStartupPlugin from './scripts/critical-startup-plugin.mjs';
// Keep previously published hashed chunks: an already-open tab may import them after a release.
export default defineConfig({base:'/next/',plugins:[react(),tailwind(),criticalStartupPlugin()],css:{postcss:{plugins:[fontScalePlugin()]}},build:{outDir:'../web/dist/next',emptyOutDir:false,chunkSizeWarningLimit:700},server:{proxy:{'/api':'http://127.0.0.1:8793','/v2':'http://127.0.0.1:8793'}}});
