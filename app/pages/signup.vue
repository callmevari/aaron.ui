<script setup lang="ts">
import logoLight from '~/assets/img/new-logo.png'
import logoDark from '~/assets/img/new-logo-dark.png'

const currentYear = new Date().getFullYear()
const step = useState<'initial' | 'form'>('signup-step', () => 'initial')

// Form data
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  countryCode: '+54',
  phone: '',
  acceptTerms: false
})

const showPassword = ref(true)

// Country codes with flags
const countryCodes = [
  { code: '+1', flag: '🇺🇸', name: 'US' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+34', flag: '🇪🇸', name: 'ES' },
  { code: '+33', flag: '🇫🇷', name: 'FR' },
  { code: '+49', flag: '🇩🇪', name: 'DE' },
  { code: '+39', flag: '🇮🇹', name: 'IT' },
  { code: '+52', flag: '🇲🇽', name: 'MX' },
  { code: '+55', flag: '🇧🇷', name: 'BR' },
  { code: '+54', flag: '🇦🇷', name: 'AR' },
  { code: '+57', flag: '🇨🇴', name: 'CO' },
  { code: '+56', flag: '🇨🇱', name: 'CL' },
  { code: '+81', flag: '🇯🇵', name: 'JP' },
  { code: '+86', flag: '🇨🇳', name: 'CN' },
  { code: '+91', flag: '🇮🇳', name: 'IN' },
  { code: '+61', flag: '🇦🇺', name: 'AU' },
]

// Track touched fields for validation display
const touched = reactive({
  email: false,
  password: false
})

// Email validation
const emailValid = computed(() => {
  const email = form.email.trim()
  if (!email) return false
  // Basic email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
})

// Password validation
const passwordValid = computed(() => {
  const p = form.password
  return p.length >= 8 &&
         /[a-z]/.test(p) &&
         /[A-Z]/.test(p) &&
         /[0-9]/.test(p)
})

// Show validation errors only after field is touched and has content
const showEmailError = computed(() => touched.email && form.email.length > 0 && !emailValid.value)
const showPasswordError = computed(() => touched.password && form.password.length > 0 && !passwordValid.value)

// Phone input - only numbers
const onPhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  form.phone = target.value.replace(/\D/g, '')
}

// Form validation
const formValid = computed(() => {
  return form.firstName.trim() &&
         form.lastName.trim() &&
         emailValid.value &&
         passwordValid.value &&
         form.phone.trim() &&
         form.acceptTerms
})

const handleSubmit = () => {
  if (!formValid.value) return
  // TODO: Submit to API
  console.log('Form submitted:', form)
  navigateTo('/profile')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <Transition name="fade" mode="out-in">
      <!-- Step 1: Initial -->
      <div v-if="step === 'initial'" key="initial" class="flex-1 flex flex-col items-center justify-center px-4 py-8">
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

          <!-- Tagline -->
          <p class="text-center text-gray-600 dark:text-gray-400 mb-8 text-lg">
            {{ $t('auth.tagline') }}
          </p>

          <!-- Sign Up Buttons -->
          <div class="w-full space-y-4">
            <button
              type="button"
              @click="step = 'form'"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition"
            >
              {{ $t('auth.signUp') }}
            </button>

            <!-- Divider -->
            <div class="flex items-center">
              <div class="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
              <span class="px-4 text-sm text-gray-500 dark:text-gray-400">{{ $t('auth.or') }}</span>
              <div class="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
            </div>

            <button
              type="button"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 transition"
            >
              <Icon name="logos:google-icon" class="w-5 h-5" />
              {{ $t('auth.signUpWithGoogle') }}
            </button>
          </div>

          <!-- Sign In Link -->
          <p class="mt-8 text-sm text-gray-600 dark:text-gray-400">
            {{ $t('auth.hasAccount') }}
            <NuxtLink
              to="/signin"
              class="text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              {{ $t('auth.signIn') }}
            </NuxtLink>
          </p>

          <!-- Footer -->
          <p class="mt-auto pt-12 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {{ currentYear }} Aaron.pet
          </p>
        </div>
      </div>

      <!-- Step 2: Form -->
      <div v-else key="form" class="flex-1 flex flex-col">
        <!-- Header -->
        <div class="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700 pt-safe">
          <button
            type="button"
            @click="step = 'initial'"
            class="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Icon name="heroicons:arrow-left" class="w-6 h-6" />
          </button>
          <h1 class="flex-1 text-center text-lg font-semibold text-gray-900 dark:text-white pr-8">
            {{ $t('auth.signUp') }}
          </h1>
        </div>

        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto px-4 py-6">
          <div class="max-w-sm mx-auto space-y-5">
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              {{ $t('auth.completeFields') }}
            </p>

            <!-- First Name & Last Name -->
            <div class="flex gap-3">
              <input
                v-model="form.firstName"
                type="text"
                :placeholder="$t('auth.firstName')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="flex-1 py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
              <input
                v-model="form.lastName"
                type="text"
                :placeholder="$t('auth.lastName')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="flex-1 py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

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
              @blur="touched.email = true"
              :class="[
                'py-3 px-4 block w-full border rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
                showEmailError
                  ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
            />

            <!-- Password -->
            <div>
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
                  @blur="touched.password = true"
                  :class="[
                    'py-3 px-4 pr-12 block w-full border rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
                    showPasswordError
                      ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
                  ]"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
                </button>
              </div>
              <p :class="['mt-1 text-xs', showPasswordError ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400']">
                {{ $t('auth.passwordHint') }}
              </p>
            </div>

            <!-- Phone -->
            <div class="flex gap-2">
              <select
                v-model="form.countryCode"
                autocomplete="off"
                class="py-3 px-3 block w-28 border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-orange-500"
              >
                <option v-for="country in countryCodes" :key="country.code" :value="country.code">
                  {{ country.flag }} {{ country.code }}
                </option>
              </select>
              <input
                :value="form.phone"
                @input="onPhoneInput"
                type="tel"
                inputmode="numeric"
                :placeholder="$t('auth.phoneNumber')"
                autocomplete="off"
                autocorrect="off"
                data-form-type="other"
                class="flex-1 py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Terms Checkbox -->
            <label class="flex items-start gap-3">
              <input
                v-model="form.acceptTerms"
                type="checkbox"
                class="mt-1 shrink-0 border-gray-300 dark:border-gray-700 rounded text-orange-600 focus:ring-orange-500 dark:bg-gray-800 dark:checked:bg-orange-600"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('auth.acceptTerms') }}
                <a href="#" class="text-orange-600 dark:text-orange-400 hover:underline">{{ $t('auth.privacyPolicy') }}</a>
                {{ $t('auth.and') }}
                <a href="#" class="text-orange-600 dark:text-orange-400 hover:underline">{{ $t('auth.termsConditions') }}</a>
              </span>
            </label>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-700 pb-safe">
          <div class="max-w-sm mx-auto">
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!formValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('auth.signUp') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pt-safe {
  padding-top: calc(env(safe-area-inset-top) + 1rem);
}

.pb-safe {
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
