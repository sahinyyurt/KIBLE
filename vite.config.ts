import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Relative URLs support both username.github.io/repository/ and custom domains.
export default defineConfig({ plugins: [react()], base: './' });
