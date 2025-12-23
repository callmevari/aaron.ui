export default defineNuxtPlugin(async () => {
  try {
    const { Capacitor } = await import('@capacitor/core')

    if (!Capacitor.isNativePlatform()) {
      return
    }

    const { LocalNotifications } = await import('@capacitor/local-notifications')

    // Listen for notification taps
    await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('📱 Notification tapped:', JSON.stringify(notification))

      const extra = notification.notification.extra

      // Store the pending navigation in sessionStorage for cold start scenarios
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingNotificationRoute', '/request')
      }

      // Try immediate navigation
      navigateTo('/request', { replace: true })

      // Also try with delays as fallback
      setTimeout(() => {
        navigateTo('/request', { replace: true })
      }, 200)

      setTimeout(() => {
        if (window.location.pathname !== '/request') {
          window.location.href = '/request'
        }
      }, 500)
    })

    // Check for pending notification route on startup (cold start handling)
    if (typeof window !== 'undefined') {
      const pendingRoute = sessionStorage.getItem('pendingNotificationRoute')
      if (pendingRoute) {
        sessionStorage.removeItem('pendingNotificationRoute')
        setTimeout(() => {
          navigateTo(pendingRoute, { replace: true })
        }, 300)
      }
    }

    console.log('📱 Notification tap listener registered')
  } catch (error) {
    console.error('Failed to setup notification listener:', error)
  }
})
