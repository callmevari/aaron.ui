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
  | 'blood-dog-form'
  | 'blood-cat-form'

const step = ref<Step>('profile')
const profileType = ref<ProfileType | null>(null)
const emergencyType = ref<EmergencyType | null>(null)
const animalType = ref<AnimalType | null>(null)
const vetType = ref<VetType | null>(null)

// Blood emergency form - Cat
const catBloodForm = reactive({
  patientName: '',
  bloodType: '' as '' | 'A' | 'B' | 'AB' | 'unknown',
  hasBeenTyped: '' as '' | 'yes' | 'no' | 'unknown',
  isHospitalized: '' as '' | 'yes' | 'no' | 'unknown',
  hospitalName: '',
  hospitalAddress: 'Argentina',
  comment: ''
})

const catBloodFormValid = computed(() => {
  return catBloodForm.patientName.trim() &&
         catBloodForm.bloodType &&
         catBloodForm.hasBeenTyped &&
         catBloodForm.isHospitalized
})

// Blood emergency form - Dog
const dogBloodForm = reactive({
  patientName: '',
  bloodType: '' as '' | 'dea-positive' | 'dea-negative' | 'other' | 'unknown',
  hasBeenTyped: '' as '' | 'yes' | 'no' | 'unknown',
  isHospitalized: '' as '' | 'yes' | 'no' | 'unknown',
  hospitalName: '',
  hospitalAddress: 'Argentina',
  comment: ''
})

const dogBloodFormValid = computed(() => {
  return dogBloodForm.patientName.trim() &&
         dogBloodForm.bloodType &&
         dogBloodForm.hasBeenTyped &&
         dogBloodForm.isHospitalized
})

// Options for forms
const dogBloodTypeOptions = [
  { value: 'dea-positive', label: 'DEA 1.1 Positive' },
  { value: 'dea-negative', label: 'DEA 1.1 Negative' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: "I don't know" }
] as const

const yesNoOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: "I don't know" }
] as const

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

  // Blood emergency flow
  if (emergencyType.value === 'blood') {
    if (type === 'dog') {
      step.value = 'blood-dog-form'
    } else if (type === 'cat') {
      step.value = 'blood-cat-form'
    }
    return
  }

  // TODO: Navigate to next step or save profile
  console.log('Profile complete:', { profileType: profileType.value, emergencyType: emergencyType.value, animalType: type })
}

const submitCatBloodForm = () => {
  if (!catBloodFormValid.value) return
  // TODO: Submit to API
  console.log('Cat blood emergency submitted:', {
    profileType: profileType.value,
    emergencyType: emergencyType.value,
    animalType: animalType.value,
    ...catBloodForm
  })
}

const submitDogBloodForm = () => {
  if (!dogBloodFormValid.value) return
  // TODO: Submit to API
  console.log('Dog blood emergency submitted:', {
    profileType: profileType.value,
    emergencyType: emergencyType.value,
    animalType: animalType.value,
    ...dogBloodForm
  })
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
  } else if (step.value === 'blood-dog-form' || step.value === 'blood-cat-form') {
    step.value = 'emergency-animal'
    animalType.value = null
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
    case 'blood-dog-form': return 'Dog blood request'
    case 'blood-cat-form': return 'Cat blood request'
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

          <!-- Step: Blood Dog Form -->
          <div v-else-if="step === 'blood-dog-form'" key="blood-dog-form" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Patient name (pet name)
              </label>
              <input
                v-model="dogBloodForm.patientName"
                type="text"
                placeholder="Enter your dog's name"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type of blood
              </label>
              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="option in dogBloodTypeOptions"
                  :key="option.value"
                  type="button"
                  @click="dogBloodForm.bloodType = option.value"
                  :class="[
                    'py-3 px-4 text-sm font-medium rounded-lg border-2 transition-all text-left',
                    dogBloodForm.bloodType === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Has Been Typed -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Has the dog been blood typed?
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="dogBloodForm.hasBeenTyped = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    dogBloodForm.hasBeenTyped === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Is Hospitalized -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Is the animal currently hospitalized?
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="dogBloodForm.isHospitalized = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    dogBloodForm.isHospitalized === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Hospital Details (shown if hospitalized) -->
            <div v-if="dogBloodForm.isHospitalized === 'yes'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hospital name (optional)
                </label>
                <input
                  v-model="dogBloodForm.hospitalName"
                  type="text"
                  placeholder="Enter hospital or clinic name"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address / City / Country (optional)
                </label>
                <input
                  v-model="dogBloodForm.hospitalAddress"
                  type="text"
                  placeholder="Enter location"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <!-- Comment -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional details (optional)
              </label>
              <textarea
                v-model="dogBloodForm.comment"
                rows="3"
                placeholder="Add whatever detail you want, like if the animal has a disease"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="submitDogBloodForm"
              :disabled="!dogBloodFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find nearby help
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Blood Cat Form -->
          <div v-else-if="step === 'blood-cat-form'" key="blood-cat-form" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Patient name (pet name)
              </label>
              <input
                v-model="catBloodForm.patientName"
                type="text"
                placeholder="Enter your cat's name"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type of blood
              </label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="type in ['A', 'B', 'AB', 'unknown'] as const"
                  :key="type"
                  type="button"
                  @click="catBloodForm.bloodType = type"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    catBloodForm.bloodType === type
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ type === 'unknown' ? "I don't know" : type }}
                </button>
              </div>
            </div>

            <!-- Has Been Typed -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Has the cat been blood typed?
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="catBloodForm.hasBeenTyped = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    catBloodForm.hasBeenTyped === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Is Hospitalized -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Is the animal currently hospitalized?
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="catBloodForm.isHospitalized = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    catBloodForm.isHospitalized === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Hospital Details (shown if hospitalized) -->
            <div v-if="catBloodForm.isHospitalized === 'yes'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hospital name (optional)
                </label>
                <input
                  v-model="catBloodForm.hospitalName"
                  type="text"
                  placeholder="Enter hospital or clinic name"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address / City / Country (optional)
                </label>
                <input
                  v-model="catBloodForm.hospitalAddress"
                  type="text"
                  placeholder="Enter location"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <!-- Comment -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional details (optional)
              </label>
              <textarea
                v-model="catBloodForm.comment"
                rows="3"
                placeholder="Add whatever detail you want, like if the animal has a disease"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="submitCatBloodForm"
              :disabled="!catBloodFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find nearby help
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
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
