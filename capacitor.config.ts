import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.belajarindonesian.app",
  appName: "Belajar",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
};

export default config;
