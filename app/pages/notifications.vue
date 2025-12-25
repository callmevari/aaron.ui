<script setup lang="ts">
import { useNotificationsStore } from '~/stores/notifications'

const { t } = useI18n()
const notificationsStore = useNotificationsStore()

// Initialize store on mount
onMounted(() => {
  notificationsStore.init()
  // Mark all as read when viewing the page
  notificationsStore.markAllAsRead()
})

// Get time remaining until expiry
const getExpiryText = (expiresAt: string) => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return t('common.expired')
  if (diffDays === 1) return `${t('request.expiresIn', { days: 1 })}`
  return `${t('request.expiresIn', { days: diffDays })}`
}

// Get time ago text
const getTimeAgo = (createdAt: string) => {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return t('notificationsPage.justNow')
  if (diffMins < 60) return t('notificationsPage.minutesAgo', { count: diffMins })
  if (diffHours < 24) return t('notificationsPage.hoursAgo', { count: diffHours })
  return t('notificationsPage.daysAgo', { count: diffDays })
}

// Get icon for notification type
const getIcon = (type: string) => {
  switch (type) {
    case 'BLOOD_UNIT_AVAILABLE':
      return 'heroicons:beaker'
    case 'DONOR_AVAILABLE':
      return 'heroicons:heart'
    case 'NEARBY_BLOOD_REQUEST':
      return 'heroicons:exclamation-triangle'
    case 'VET_REQUEST':
      return 'heroicons:building-office-2'
    default:
      return 'heroicons:bell'
  }
}

// Dismiss notification
const dismissNotification = (id: string, event: Event) => {
  event.stopPropagation() // Prevent navigation when dismissing
  notificationsStore.dismiss(id)
}

// Handle notification click - navigate to appropriate page
const handleNotificationClick = (type: string) => {
  if (type === 'VET_REQUEST') {
    navigateTo('/request/vet')
  } else {
    navigateTo('/request')
  }
}

// Go back to previous page
const router = useRouter()
const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 pt-safe">
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="goBack"
          class="p-1 -ml-1 text-gray-500 dark:text-gray-400"
        >
          <Icon name="heroicons:arrow-left" class="w-6 h-6" />
        </button>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('notificationsPage.title') }}</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Empty State -->
      <div
        v-if="notificationsStore.activeNotifications.length === 0"
        class="flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Icon name="heroicons:bell-slash" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">{{ $t('notificationsPage.empty') }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('notificationsPage.emptyDesc') }}
        </p>
      </div>

      <!-- Notifications List -->
      <div v-else class="bg-white dark:bg-gray-800">
        <button
          v-for="notification in notificationsStore.activeNotifications"
          :key="notification.id"
          type="button"
          @click="handleNotificationClick(notification.type)"
          class="w-full text-left px-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Icon :name="getIcon(notification.type)" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ notification.title }}
                </h4>
                <!-- Dismiss button -->
                <button
                  type="button"
                  @click="dismissNotification(notification.id, $event)"
                  class="flex-shrink-0 p-1 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {{ notification.body }}
              </p>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                <span>{{ getTimeAgo(notification.createdAt) }}</span>
                <span class="text-gray-300 dark:text-gray-600">•</span>
                <span>{{ getExpiryText(notification.expiresAt) }}</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top);
}
</style>
