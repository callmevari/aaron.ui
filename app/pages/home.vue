<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { usePetsStore } from '~/stores/pets'

const { t } = useI18n()
const route = useRoute()
const userStore = useUserStore()
const petsStore = usePetsStore()

// Check if coming from registration (would have pet data in query/store)
const showWelcome = ref(false)
const registeredPetName = ref('')

onMounted(async () => {
  // Check for pending notification route (cold start from notification tap)
  if (typeof window !== 'undefined') {
    const pendingRoute = sessionStorage.getItem('pendingNotificationRoute')
    if (pendingRoute) {
      sessionStorage.removeItem('pendingNotificationRoute')
      await navigateTo(pendingRoute, { replace: true })
      return
    }
  }

  // Fetch pets from store
  await petsStore.fetchPets()

  // Check if we just registered a pet (show welcome message)
  if (route.query.registered === 'true' && route.query.petName) {
    showWelcome.value = true
    registeredPetName.value = route.query.petName as string

    // Add donor role (preserves existing roles like vet/blood_bank)
    userStore.addRole('donor')

    // Clear the welcome after 5 seconds
    setTimeout(() => {
      showWelcome.value = false
    }, 5000)
  }
})

const toggleDonorAvailability = async (petId: string) => {
  await petsStore.toggleDonorAvailability(petId)
}

const getBloodTypeLabel = (bloodType: string) => {
  // Shorten blood type for display
  if (bloodType.includes('Positive') || bloodType.endsWith('+')) return bloodType.replace(' Positive', '+').replace('Positive', '+')
  if (bloodType.includes('Negative') || bloodType.endsWith('-')) return bloodType.replace(' Negative', '-').replace('Negative', '-')
  return bloodType
}

// Email verification banner handlers
const resendVerificationEmail = () => {
  // Mock: In production, this would trigger a backend API call
  console.log('📧 Resending verification email to:', userStore.auth?.email)
  alert('Verification email sent! Please check your inbox.')
}

const dismissEmailBanner = () => {
  // For now, just mark as verified (mock behavior)
  // In production, this would just hide the banner temporarily
  userStore.setEmailVerified(true)
}
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] bg-gray-50 dark:bg-gray-900 px-4 pt-safe pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between py-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ $t('home.title') }}
      </h1>
      <NuxtLink
        to="/donor/add"
        class="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700"
      >
        {{ $t('home.addPet') }}
      </NuxtLink>
    </div>

    <!-- Email Verification Banner (for vets) -->
    <div
      v-if="userStore.needsEmailVerification"
      class="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <Icon name="heroicons:envelope" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div class="flex-1">
          <p class="font-medium text-amber-800 dark:text-amber-200">
            {{ $t('emailVerification.bannerTitle') }}
          </p>
          <p class="text-sm text-amber-700 dark:text-amber-300 mb-2">
            {{ $t('emailVerification.bannerMessage') }}
          </p>
          <button
            type="button"
            class="text-sm font-medium text-amber-700 dark:text-amber-300 underline hover:no-underline"
            @click="resendVerificationEmail"
          >
            {{ $t('emailVerification.resendButton') }}
          </button>
        </div>
        <button
          type="button"
          @click="dismissEmailBanner"
          class="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Welcome Message (after registration) -->
    <Transition name="fade">
      <div
        v-if="showWelcome"
        class="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Icon name="heroicons:check-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="font-medium text-green-800 dark:text-green-200">
              {{ $t('home.welcomeTitle') }}
            </p>
            <p class="text-sm text-green-700 dark:text-green-300">
              {{ $t('home.welcomeMessage', { petName: registeredPetName }) }}
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- My Donors Section -->
    <section class="mb-6">

      <!-- Pet Cards -->
      <div v-if="petsStore.donorPets.length > 0" class="space-y-3">
        <div
          v-for="pet in petsStore.donorPets"
          :key="pet.id"
          class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <!-- Pet Avatar -->
            <div class="relative">
              <div
                v-if="pet.photoUrl"
                class="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700"
              >
                <img :src="pet.photoUrl" :alt="pet.name" class="w-full h-full object-cover" />
              </div>
              <div
                v-else
                class="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
              >
                <Icon
                  :name="pet.species === 'cat' ? 'heroicons:heart' : 'heroicons:heart'"
                  class="w-8 h-8 text-orange-600 dark:text-orange-400"
                />
              </div>
              <!-- Species badge -->
              <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-700 border-2 border-white dark:border-gray-700 flex items-center justify-center">
                <span class="text-sm">{{ pet.species === 'cat' ? '🐱' : '🐶' }}</span>
              </div>
            </div>

            <!-- Pet Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ pet.name }}
                </h3>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs font-medium rounded-full',
                    pet.isDonorActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  ]"
                >
                  {{ pet.isDonorActive ? $t('common.available') : $t('common.unavailable') }}
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('home.bloodType') }}: {{ getBloodTypeLabel(pet.bloodType) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                {{ pet.ageYears }} {{ $t('home.years') }} · {{ pet.weightKg }}kg
              </p>
            </div>

            <!-- Availability Toggle -->
            <button
              type="button"
              @click="toggleDonorAvailability(pet.id)"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                pet.isDonorActive ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-600'
              ]"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  pet.isDonorActive ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="p-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center"
      >
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Icon name="heroicons:heart" class="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 class="font-medium text-gray-900 dark:text-white mb-1">
          {{ $t('home.noDonorsTitle') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{ $t('home.noDonorsMessage') }}
        </p>
        <NuxtLink
          to="/donor/add"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white font-medium text-sm hover:bg-orange-700 transition"
        >
          <Icon name="heroicons:plus" class="w-4 h-4" />
          {{ $t('home.registerDonor') }}
        </NuxtLink>
      </div>
    </section>

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<style scoped>
.pt-safe {
  padding-top: calc(env(safe-area-inset-top) + 1rem);
}

.pb-navbar {
  padding-bottom: 5rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
