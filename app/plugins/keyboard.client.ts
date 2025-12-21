import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (Capacitor.isNativePlatform()) {
    // Hide the accessory bar (toolbar with Done button) to prevent constraint conflicts
    Keyboard.setAccessoryBarVisible({ isVisible: false })

    // Optional: Set scroll behavior
    Keyboard.setScroll({ isDisabled: false })

    // Pre-warm iOS keyboards to avoid delay on first input focus
    // This triggers iOS to initialize all keyboard types early
    setTimeout(() => {
      const container = document.createElement('div')
      container.style.cssText = 'position:absolute;top:-9999px;left:-9999px;opacity:0;pointer-events:none;'
      document.body.appendChild(container)

      // Create inputs for each keyboard type
      const inputTypes = [
        { type: 'text', inputmode: 'text' },
        { type: 'tel', inputmode: 'numeric' },
        { type: 'email', inputmode: 'email' },
      ]

      inputTypes.forEach(({ type, inputmode }, index) => {
        setTimeout(() => {
          const input = document.createElement('input')
          input.type = type
          input.inputMode = inputmode
          input.autocomplete = 'off'
          input.setAttribute('readonly', 'readonly')
          container.appendChild(input)

          // Brief focus to initialize this keyboard type
          input.focus()
          input.blur()
          input.remove()
        }, index * 50)
      })

      // Clean up container after all keyboards warmed
      setTimeout(() => {
        container.remove()
      }, 300)
    }, 300)
  }
})
