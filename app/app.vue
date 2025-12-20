<template>
  <NuxtPage />
</template>

<style>
html {
  background-color: #f9fafb; /* gray-50 */
}

@media (prefers-color-scheme: dark) {
  html {
    background-color: #111827; /* gray-900 */
  }
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
