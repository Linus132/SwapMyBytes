import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    supportFolder: false,
    supportFile: false,
    specPattern: "src/__tests__/e2e/**/*.cy.ts",
    baseUrl: process.env.VITE_BACKEND_LOCATION,
    env: {
      VITE_BACKEND_LOCATION: process.env.VITE_BACKEND_LOCATION || "localhost:5090",
      SMB_FRONTEND_PORT_EXTERNAL: process.env.SMB_FRONTEND_PORT_EXTERNAL || "5080",
    },
  },
});
