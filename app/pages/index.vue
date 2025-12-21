<script setup lang="ts">
if (import.meta.client) {
  await navigateTo('/signup', { replace: true })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <p class="text-gray-400">{{ $t('auth.redirecting') }}</p>
  </div>
</template>
