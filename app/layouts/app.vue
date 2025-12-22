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
    name: 'places',
    path: '/places',
    icon: 'heroicons:map-pin',
    label: t('nav.places')
  },
  {
    name: 'profile',
    path: '/me',
    icon: 'heroicons:user-circle',
    label: t('nav.profile')
  }
])

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto pb-24">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 pb-safe">
      <div class="flex items-center justify-around h-16">
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
            class="w-12 h-12 -mt-4 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-lg"
          >
            <Icon :name="tab.icon" class="w-6 h-6 text-white" />
          </div>
          <template v-else>
            <Icon :name="tab.icon" class="w-6 h-6" />
            <span class="text-xs mt-1">{{ tab.label }}</span>
          </template>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
