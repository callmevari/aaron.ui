import { useNotificationsStore } from '~/stores/notifications'

export default defineNuxtPlugin(() => {
  // Initialize notifications store on app start
  const notificationsStore = useNotificationsStore()
  notificationsStore.init()
})
