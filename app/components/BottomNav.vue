<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const tabs = computed(() => [
  {
    name: 'donors',
    path: '/home',
    icon: 'heroicons:heart',
    label: t('nav.myDonors')
  },
  {
    name: 'requests',
    path: '/request',
    icon: 'heroicons:bell-alert',
    label: t('nav.requests')
  },
  {
    name: 'sos',
    path: '/sos',
    icon: 'heroicons:exclamation-triangle',
    label: t('nav.sos'),
    isEmergency: true
  },
  {
    name: 'vets',
    path: '/request/vet',
    icon: 'heroicons:building-office-2',
    label: t('nav.vets')
  },
  {
    name: 'profile',
    path: '/me',
    icon: 'heroicons:user-circle',
    label: t('nav.profile')
  }
])

const isActive = (path: string) => {
  // Exact match
  if (route.path === path) return true

  // For /request/vet, only match exactly (don't let /request also be active)
  if (path === '/request/vet') return route.path === '/request/vet'

  // For /request, match /request but NOT /request/vet
  if (path === '/request') {
    return route.path === '/request' || (route.path.startsWith('/request/') && !route.path.startsWith('/request/vet'))
  }

  // Default: check if path is a prefix
  return route.path.startsWith(path + '/')
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 pb-safe">
    <div class="flex items-center justify-around h-16 px-4">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.path"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          tab.isEmergency
            ? 'text-red-600 dark:text-red-400'
            : isActive(tab.path)
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <div
          v-if="tab.isEmergency"
          class="w-10 h-10 -mt-3 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-lg"
        >
          <Icon :name="tab.icon" class="w-5 h-5 text-white" />
        </div>
        <span v-if="tab.isEmergency" class="text-xs mt-0.5 text-red-600 dark:text-red-400 font-medium">{{ tab.label }}</span>
        <template v-else>
          <Icon :name="tab.icon" class="w-6 h-6" />
          <span class="text-xs mt-1">{{ tab.label }}</span>
        </template>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
