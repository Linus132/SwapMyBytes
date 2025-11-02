import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export default defineConfig({
    plugins: [react()],
    server: {
        host: process.env.VITE_HOST,
        open: false,
        port: parseInt(process.env.VITE_PORT, 10),
    },
    build: {
        outDir: './build',
    },
});
