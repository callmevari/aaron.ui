import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (Capacitor.isNativePlatform()) {
    // Show the accessory bar (toolbar with Done button) so users can dismiss keyboard
    Keyboard.setAccessoryBarVisible({ isVisible: true })

    // Enable scroll behavior
    Keyboard.setScroll({ isDisabled: false })

    // Scroll focused element into view when keyboard shows
    Keyboard.addListener('keyboardWillShow', (info) => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    })

    // Pre-warm iOS keyboards to avoid delay on first input focus
    setTimeout(() => {
      const container = document.createElement('div')
      container.style.cssText = 'position:absolute;top:-9999px;left:-9999px;opacity:0;pointer-events:none;'
      document.body.appendChild(container)

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
          input.focus()
          input.blur()
          input.remove()
        }, index * 50)
      })

      setTimeout(() => {
        container.remove()
      }, 300)
    }, 300)
  }
})
