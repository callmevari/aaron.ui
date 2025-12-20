import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'pet.aaron.app',
  appName: 'Aaron.pet',
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
  },
}

export default config
