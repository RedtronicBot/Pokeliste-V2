import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.redtronic.pokeliste",
  appName: "Pokeliste",
  webDir: "dist",
  plugins: {
    App: {
      customUrlScheme: "pokeliste",
    },
  },
}

export default config
