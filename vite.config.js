import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For https://USER.github.io/REPO/ the base must be "/REPO/".
// CI sets VITE_BASE automatically; change the default below if you rename the repo.
export default defineConfig({
  base: process.env.VITE_BASE || '/rbx-cgpa-calculator/',
  plugins: [react()],
  test: { environment: 'node' },
});
