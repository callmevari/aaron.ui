<script setup lang="ts">
type ProfileType = 'emergency' | 'donor' | 'vet'
type EmergencyType = 'blood' | 'vet'
type AnimalType = 'cat' | 'dog' | 'both' | 'other'
type VetType = 'veterinary' | 'blood-bank' | 'both'

type Step =
  | 'profile'
  | 'emergency-type'
  | 'emergency-animal'
  | 'donor-animal'
  | 'vet-type'

const step = ref<Step>('profile')
const profileType = ref<ProfileType | null>(null)
const emergencyType = ref<EmergencyType | null>(null)
const animalType = ref<AnimalType | null>(null)
const vetType = ref<VetType | null>(null)

// Navigation
const selectProfile = (type: ProfileType) => {
  profileType.value = type
  if (type === 'emergency') {
    step.value = 'emergency-type'
  } else if (type === 'donor') {
    step.value = 'donor-animal'
  } else if (type === 'vet') {
    step.value = 'vet-type'
  }
}

const selectEmergencyType = (type: EmergencyType) => {
  emergencyType.value = type
  step.value = 'emergency-animal'
}

const selectAnimal = (type: AnimalType) => {
  animalType.value = type
  // TODO: Navigate to next step or save profile
  console.log('Profile complete:', { profileType: profileType.value, emergencyType: emergencyType.value, animalType: type })
}

const selectVetType = (type: VetType) => {
  vetType.value = type
  // TODO: Navigate to next step or save profile
  console.log('Profile complete:', { profileType: profileType.value, vetType: type })
}

const goBack = () => {
  if (step.value === 'emergency-type') {
    step.value = 'profile'
    profileType.value = null
  } else if (step.value === 'emergency-animal') {
    step.value = 'emergency-type'
    emergencyType.value = null
  } else if (step.value === 'donor-animal') {
    step.value = 'profile'
    profileType.value = null
  } else if (step.value === 'vet-type') {
    step.value = 'profile'
    profileType.value = null
  }
}

const canGoBack = computed(() => step.value !== 'profile')

const stepTitle = computed(() => {
  switch (step.value) {
    case 'profile': return 'Which is your profile?'
    case 'emergency-type': return 'What do you need?'
    case 'emergency-animal': return 'What type of animal?'
    case 'donor-animal': return 'What type of animal?'
    case 'vet-type': return 'What type of service?'
    default: return ''
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="flex items-center px-4 py-4 pt-safe">
      <button
        v-if="canGoBack"
        type="button"
        @click="goBack"
        class="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <Icon name="heroicons:arrow-left" class="w-6 h-6" />
      </button>
      <div v-else class="w-10"></div>
      <h1 class="flex-1 text-center text-xl font-bold text-gray-900 dark:text-white pr-10">
        {{ stepTitle }}
      </h1>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col justify-center px-4 py-8">
      <div class="w-full max-w-sm mx-auto">
        <Transition name="fade" mode="out-in">
          <!-- Step: Profile Selection -->
          <div v-if="step === 'profile'" key="profile" class="space-y-4">
            <!-- Emergency -->
            <button
              type="button"
              @click="selectProfile('emergency')"
              class="emergency-pulse w-full p-5 flex items-center gap-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:exclamation-triangle" class="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-red-700 dark:text-red-300">I have an emergency</p>
                <p class="text-sm text-red-600/70 dark:text-red-400/70">Need urgent help now</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-red-400" />
            </button>

            <!-- Donor -->
            <button
              type="button"
              @click="selectProfile('donor')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:heart" class="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">I'm a donor</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Help save lives</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <!-- Vet / Blood Bank -->
            <button
              type="button"
              @click="selectProfile('vet')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:building-office-2" class="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">I'm a vet / blood bank</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Professional services</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <!-- Step: Emergency Type -->
          <div v-else-if="step === 'emergency-type'" key="emergency-type" class="space-y-4">
            <button
              type="button"
              @click="selectEmergencyType('blood')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:beaker" class="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">I need blood</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Blood transfusion needed</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <button
              type="button"
              @click="selectEmergencyType('vet')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:map-pin" class="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">I need a vet</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Find nearby veterinary</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <!-- Step: Emergency Animal -->
          <div v-else-if="step === 'emergency-animal'" key="emergency-animal" class="space-y-4">
            <button
              type="button"
              @click="selectAnimal('cat')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform text-3xl">
                🐱
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Cat</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <button
              type="button"
              @click="selectAnimal('dog')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform text-3xl">
                🐶
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Dog</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <!-- Only show "Other" for vet emergencies -->
            <button
              v-if="emergencyType === 'vet'"
              type="button"
              @click="selectAnimal('other')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform text-3xl">
                🦜
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Other</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Exotic animals</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <!-- Step: Donor Animal -->
          <div v-else-if="step === 'donor-animal'" key="donor-animal" class="space-y-4">
            <button
              type="button"
              @click="selectAnimal('cat')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform text-3xl">
                🐱
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Cat</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <button
              type="button"
              @click="selectAnimal('dog')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform text-3xl">
                🐶
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Dog</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <button
              type="button"
              @click="selectAnimal('both')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform text-2xl">
                🐱🐶
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Both</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">I have cats and dogs</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <!-- Step: Vet Type -->
          <div v-else-if="step === 'vet-type'" key="vet-type" class="space-y-4">
            <button
              type="button"
              @click="selectVetType('veterinary')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:user" class="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">I'm a veterinary</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Doctor or clinic</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <button
              type="button"
              @click="selectVetType('blood-bank')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:building-library" class="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Blood Bank</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Blood storage facility</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <button
              type="button"
              @click="selectVetType('both')"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
            >
              <div class="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="heroicons:building-office" class="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-900 dark:text-white">Both</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Veterinary with blood bank</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pt-safe {
  padding-top: calc(env(safe-area-inset-top) + 1rem);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.emergency-pulse {
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.3);
  }
}
</style>
