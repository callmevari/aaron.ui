<script setup lang="ts">
import { useUserStore } from '~/stores/user'

if (import.meta.client) {
  const userStore = useUserStore()

  if (userStore.isAuthenticated) {
    if (userStore.isProfileComplete) {
      await navigateTo('/home', { replace: true })
    } else {
      await navigateTo('/profile', { replace: true })
    }
  } else {
    await navigateTo('/signup', { replace: true })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <p class="text-gray-400">{{ $t('auth.redirecting') }}</p>
  </div>
</template>
