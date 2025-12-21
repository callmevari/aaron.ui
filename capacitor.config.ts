import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'pet.aaron.app',
  appName: 'Aaron.pet',
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
