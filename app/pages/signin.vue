<script setup lang="ts">
import logoLight from '~/assets/img/new-logo.png'
import logoDark from '~/assets/img/new-logo-dark.png'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const router = useRouter()

// Redirect if already authenticated
onMounted(() => {
  if (userStore.isAuthenticated) {
    if (userStore.isProfileComplete) {
      router.replace('/home')
    } else {
      router.replace('/profile')
    }
  }
})

const currentYear = new Date().getFullYear()

const form = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)

const formValid = computed(() => {
  return form.email.trim() && form.password.trim()
})

const handleSubmit = () => {
  if (!formValid.value) return
  // Mock sign in - in real app would verify credentials
  // For demo, we just sign in with entered email
  userStore.signUp({
    email: form.email.trim(),
    firstName: 'User',
    lastName: '',
    phone: ''
  })

  if (userStore.isProfileComplete) {
    navigateTo('/home')
  } else {
    navigateTo('/profile')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-sm flex flex-col items-center">
      <!-- Logo -->
      <img
        :src="logoLight"
        alt="Aaron.pet"
        class="h-56 w-auto mb-6 dark:hidden"
      />
      <img
        :src="logoDark"
        alt="Aaron.pet"
        class="h-56 w-auto mb-6 hidden dark:block"
      />

      <!-- Form -->
      <div class="w-full space-y-4">
        <!-- Email -->
        <input
          v-model="form.email"
          type="email"
          :placeholder="$t('auth.emailPlaceholder')"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          data-form-type="other"
          class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
        />

        <!-- Password -->
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="$t('auth.passwordPlaceholder')"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-form-type="other"
            class="py-3 px-4 pr-12 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
          </button>
        </div>

        <!-- Sign In Button -->
        <button
          type="button"
          @click="handleSubmit"
          :disabled="!formValid"
          class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ $t('auth.signIn') }}
        </button>

        <!-- Divider -->
        <div class="flex items-center">
          <div class="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
          <span class="px-4 text-sm text-gray-500 dark:text-gray-400">{{ $t('auth.or') }}</span>
          <div class="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
        </div>

        <!-- Google Sign In -->
        <button
          type="button"
          class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 transition"
        >
          <Icon name="logos:google-icon" class="w-5 h-5" />
          {{ $t('auth.signInWithGoogle') }}
        </button>
      </div>

      <!-- Forgot Password -->
      <p class="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <a href="#" class="text-orange-600 dark:text-orange-400 hover:underline">
          {{ $t('auth.forgotPassword') }}
        </a>
      </p>

      <!-- Sign Up Link -->
      <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {{ $t('auth.noAccount') }}
        <NuxtLink
          to="/signup"
          class="text-orange-600 dark:text-orange-400 hover:underline font-medium"
        >
          {{ $t('auth.signUp') }}
        </NuxtLink>
      </p>

      <!-- Footer -->
      <p class="mt-auto pt-12 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {{ currentYear }} Aaron.pet
      </p>
    </div>
  </div>
</template>
