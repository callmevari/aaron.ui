export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  // Prevent pinch zoom
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault()
  }, { passive: false })

  document.addEventListener('gesturechange', (e) => {
    e.preventDefault()
  }, { passive: false })

  document.addEventListener('gestureend', (e) => {
    e.preventDefault()
  }, { passive: false })

  // Prevent double-tap zoom
  let lastTouchEnd = 0
  document.addEventListener('touchend', (e) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      e.preventDefault()
    }
    lastTouchEnd = now
  }, { passive: false })

  // Reset viewport on input blur (fixes iOS zoom staying stuck)
  document.addEventListener('blur', (e) => {
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement) {
      // Reset viewport
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content',
          'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover'
        )
      }
      // Scroll to reset any zoom
      window.scrollTo(0, 0)
    }
  }, true)
})
