// Plugin to detect native device language and set i18n locale
export default defineNuxtPlugin({
  name: 'i18n-device-locale',
  dependsOn: ['i18n:plugin'],
  async setup(nuxtApp) {
    const supportedLocales = ['es', 'en']
    let targetLocale = 'es'

    try {
      const { Capacitor } = await import('@capacitor/core')

      if (Capacitor.isNativePlatform()) {
        const { Device } = await import('@capacitor/device')
        const info = await Device.getLanguageCode()
        const deviceLang = info.value?.split('-')[0] || 'es'
        targetLocale = supportedLocales.includes(deviceLang) ? deviceLang : 'es'
      } else {
        const browserLang = navigator.language?.split('-')[0] || 'es'
        targetLocale = supportedLocales.includes(browserLang) ? browserLang : 'es'
      }
    } catch {
      const browserLang = navigator.language?.split('-')[0] || 'es'
      targetLocale = supportedLocales.includes(browserLang) ? browserLang : 'es'
    }

    const i18n = nuxtApp.$i18n
    if (i18n && i18n.locale.value !== targetLocale) {
      await i18n.setLocale(targetLocale)
    }
  }
})
