<script setup lang="ts">
import { useRequestsStore } from '~/stores/requests'
import { useUserStore } from '~/stores/user'
import type { AnimalType as PetAnimalType } from '~/stores/pets'

const { t } = useI18n()
const router = useRouter()
const requestsStore = useRequestsStore()
const userStore = useUserStore()

type Step = 'type' | 'animal' | 'form'
type EmergencyType = 'blood' | 'vet'
type AnimalType = 'cat' | 'dog'

const step = ref<Step>('type')
const emergencyType = ref<EmergencyType | null>(null)
const animalType = ref<AnimalType | null>(null)
const isSubmitting = ref(false)

// Check if user can create requests
// Regular users can only have 1 active request (blood OR vet, not both)
const hasAnyActiveRequest = computed(() => {
  return requestsStore.hasActiveBloodRequest || requestsStore.hasActiveVetRequest
})

const canCreateBloodRequest = computed(() => {
  if (userStore.isVet || userStore.isBloodBank) return true
  return !hasAnyActiveRequest.value
})

const canCreateVetRequest = computed(() => {
  if (userStore.isVet || userStore.isBloodBank) return true
  return !hasAnyActiveRequest.value
})

// Message for why user can't create request
const activeRequestMessage = computed(() => {
  if (requestsStore.hasActiveBloodRequest) return t('sos.alreadyActiveBlood')
  if (requestsStore.hasActiveVetRequest) return t('sos.alreadyActiveVet')
  return ''
})

// Location state
const userLocation = reactive({
  latitude: -34.6037,
  longitude: -58.3816,
  address: '',
  isLoading: false,
  error: ''
})

// Blood emergency form - Cat
const catBloodForm = reactive({
  patientName: '',
  bloodType: '' as '' | 'A' | 'B' | 'AB' | 'unknown',
  hasBeenTyped: '' as '' | 'yes' | 'no' | 'unknown',
  isHospitalized: '' as '' | 'yes' | 'no' | 'unknown',
  hospitalName: '',
  hospitalAddress: '',
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
  hospitalAddress: '',
  comment: ''
})

const dogBloodFormValid = computed(() => {
  return dogBloodForm.patientName.trim() &&
         dogBloodForm.bloodType &&
         dogBloodForm.hasBeenTyped &&
         dogBloodForm.isHospitalized
})

// Vet emergency form - Cat
const vetCatForm = reactive({
  patientName: '',
  whatHappened: ''
})

const vetCatFormValid = computed(() => {
  return vetCatForm.patientName.trim()
})

// Vet emergency form - Dog
const vetDogForm = reactive({
  patientName: '',
  whatHappened: ''
})

const vetDogFormValid = computed(() => {
  return vetDogForm.patientName.trim()
})

// Blood type options
const catBloodTypeOptions = [
  { value: 'A' as const, label: 'Type A' },
  { value: 'B' as const, label: 'Type B' },
  { value: 'AB' as const, label: 'Type AB' },
  { value: 'unknown' as const, label: t('common.unknown') }
]

const dogBloodTypeOptions = [
  { value: 'dea-positive' as const, label: 'DEA 1.1 Positive' },
  { value: 'dea-negative' as const, label: 'DEA 1.1 Negative' },
  { value: 'other' as const, label: t('donor.otherUnknown') },
  { value: 'unknown' as const, label: t('common.unknown') }
]

const yesNoOptions = computed(() => [
  { value: 'yes' as const, label: t('common.yes') },
  { value: 'no' as const, label: t('common.no') },
  { value: 'unknown' as const, label: t('common.unknown') }
])

// Request location on mount and hydrate store
onMounted(async () => {
  // Hydrate store from localStorage
  requestsStore.hydrate()

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        userLocation.latitude = position.coords.latitude
        userLocation.longitude = position.coords.longitude
        // Mock address for now
        userLocation.address = 'Buenos Aires, Argentina'
      },
      (error) => {
        console.error('Geolocation error:', error)
      }
    )
  }
})

const selectEmergencyType = (type: EmergencyType) => {
  if (type === 'blood' && !canCreateBloodRequest.value) return
  if (type === 'vet' && !canCreateVetRequest.value) return
  emergencyType.value = type
  step.value = 'animal'
}

const selectAnimal = (type: AnimalType) => {
  animalType.value = type
  step.value = 'form'
}

const goBack = () => {
  if (step.value === 'form') {
    step.value = 'animal'
    animalType.value = null
  } else if (step.value === 'animal') {
    step.value = 'type'
    emergencyType.value = null
  } else {
    router.back()
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    if (emergencyType.value === 'blood') {
      const form = animalType.value === 'cat' ? catBloodForm : dogBloodForm
      const formValid = animalType.value === 'cat' ? catBloodFormValid.value : dogBloodFormValid.value

      if (!formValid) return

      const species = animalType.value as PetAnimalType

      await requestsStore.createBloodRequest({
        type: 'blood',
        petName: form.patientName,
        species,
        bloodType: form.bloodType as any,
        isHospitalized: form.isHospitalized === 'yes',
        hospitalName: form.hospitalName || undefined,
        hospitalAddress: form.hospitalAddress || undefined,
        additionalDetails: form.comment || undefined,
        location: {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          address: userLocation.address
        }
      })

      console.log('Blood request created')
      navigateTo('/request')
    } else if (emergencyType.value === 'vet') {
      const form = animalType.value === 'cat' ? vetCatForm : vetDogForm
      const formValid = animalType.value === 'cat' ? vetCatFormValid.value : vetDogFormValid.value

      if (!formValid) return

      const species = animalType.value as PetAnimalType

      await requestsStore.createVetRequest({
        type: 'vet',
        species,
        description: form.whatHappened || undefined,
        location: {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          address: userLocation.address
        }
      })

      console.log('Vet request created')
      navigateTo({
        path: '/request/vet',
        query: { type: animalType.value }
      })
    }
  } catch (error) {
    console.error('Failed to create request:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700 pt-safe">
      <button
        type="button"
        @click="goBack"
        class="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <Icon name="heroicons:arrow-left" class="w-6 h-6" />
      </button>
      <h1 class="flex-1 text-center text-lg font-semibold text-gray-900 dark:text-white pr-8">
        {{ $t('sos.title') }}
      </h1>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-6 pb-24">
      <div class="max-w-sm mx-auto">
        <Transition name="fade" mode="out-in">
          <!-- Step: Emergency Type Selection -->
          <div v-if="step === 'type'" key="type" class="space-y-4">
            <div class="text-center mb-6">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $t('sos.whatDoYouNeed') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                {{ $t('sos.selectEmergencyType') }}
              </p>
            </div>

            <!-- Blood Request Option -->
            <button
              type="button"
              @click="selectEmergencyType('blood')"
              :disabled="!canCreateBloodRequest"
              :class="[
                'w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4',
                canCreateBloodRequest
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-400 dark:hover:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
              ]"
            >
              <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon name="heroicons:heart" class="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div class="text-left flex-1">
                <p class="font-semibold text-gray-900 dark:text-white">{{ $t('sos.needBlood') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('sos.needBloodDesc') }}</p>
                <p v-if="!canCreateBloodRequest" class="text-xs text-red-500 dark:text-red-400 mt-1">
                  {{ activeRequestMessage }}
                </p>
              </div>
              <Icon v-if="canCreateBloodRequest" name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <!-- Vet Request Option -->
            <button
              type="button"
              @click="selectEmergencyType('vet')"
              :disabled="!canCreateVetRequest"
              :class="[
                'w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4',
                canCreateVetRequest
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-400 dark:hover:border-orange-500'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
              ]"
            >
              <div class="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Icon name="heroicons:building-office-2" class="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="text-left flex-1">
                <p class="font-semibold text-gray-900 dark:text-white">{{ $t('sos.needVet') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('sos.needVetDesc') }}</p>
                <p v-if="!canCreateVetRequest" class="text-xs text-red-500 dark:text-red-400 mt-1">
                  {{ activeRequestMessage }}
                </p>
              </div>
              <Icon v-if="canCreateVetRequest" name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <!-- Step: Animal Selection -->
          <div v-else-if="step === 'animal'" key="animal" class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">
              {{ $t('emergency.selectAnimal') }}
            </p>

            <button
              type="button"
              @click="selectAnimal('dog')"
              class="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-400 dark:hover:border-orange-500 transition-all flex items-center gap-4"
            >
              <div class="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-3xl">
                🐕
              </div>
              <div class="text-left">
                <p class="font-semibold text-gray-900 dark:text-white">{{ $t('emergency.dog') }}</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400 ml-auto" />
            </button>

            <button
              type="button"
              @click="selectAnimal('cat')"
              class="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-400 dark:hover:border-orange-500 transition-all flex items-center gap-4"
            >
              <div class="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-3xl">
                🐈
              </div>
              <div class="text-left">
                <p class="font-semibold text-gray-900 dark:text-white">{{ $t('emergency.cat') }}</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400 ml-auto" />
            </button>
          </div>

          <!-- Step: Blood Form - Dog -->
          <div v-else-if="step === 'form' && emergencyType === 'blood' && animalType === 'dog'" key="blood-dog" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="dogBloodForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholder')"
                autocomplete="off"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.bloodType') }}
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="option in dogBloodTypeOptions"
                  :key="option.value"
                  type="button"
                  @click="dogBloodForm.bloodType = option.value"
                  :class="[
                    'py-3 px-4 text-sm font-medium rounded-lg border-2 transition-all',
                    dogBloodForm.bloodType === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Has Been Typed -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.hasBeenTyped') }}
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
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Is Hospitalized -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.isHospitalized') }}
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
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Hospital Info (if hospitalized) -->
            <div v-if="dogBloodForm.isHospitalized === 'yes'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('bloodForm.hospitalName') }}
                </label>
                <input
                  v-model="dogBloodForm.hospitalName"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalNamePlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('bloodForm.hospitalAddress') }}
                </label>
                <input
                  v-model="dogBloodForm.hospitalAddress"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalAddressPlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <!-- Additional Comments -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.additionalDetails') }}
              </label>
              <textarea
                v-model="dogBloodForm.comment"
                rows="3"
                :placeholder="$t('bloodForm.additionalDetailsPlaceholder')"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!dogBloodFormValid || isSubmitting"
              class="w-full py-3.5 px-4 mb-6 inline-flex justify-center items-center gap-x-2 text-base font-semibold rounded-xl border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isSubmitting">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ $t('common.sending') }}
              </template>
              <template v-else>
                <Icon name="heroicons:bell-alert" class="w-5 h-5" />
                {{ $t('sos.sendAlert') }}
              </template>
            </button>
          </div>

          <!-- Step: Blood Form - Cat -->
          <div v-else-if="step === 'form' && emergencyType === 'blood' && animalType === 'cat'" key="blood-cat" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="catBloodForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholder')"
                autocomplete="off"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.bloodType') }}
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="option in catBloodTypeOptions"
                  :key="option.value"
                  type="button"
                  @click="catBloodForm.bloodType = option.value"
                  :class="[
                    'py-3 px-4 text-sm font-medium rounded-lg border-2 transition-all',
                    catBloodForm.bloodType === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Has Been Typed -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.hasBeenTyped') }}
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
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Is Hospitalized -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.isHospitalized') }}
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
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Hospital Info (if hospitalized) -->
            <div v-if="catBloodForm.isHospitalized === 'yes'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('bloodForm.hospitalName') }}
                </label>
                <input
                  v-model="catBloodForm.hospitalName"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalNamePlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('bloodForm.hospitalAddress') }}
                </label>
                <input
                  v-model="catBloodForm.hospitalAddress"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalAddressPlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <!-- Additional Comments -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.additionalDetails') }}
              </label>
              <textarea
                v-model="catBloodForm.comment"
                rows="3"
                :placeholder="$t('bloodForm.additionalDetailsPlaceholder')"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!catBloodFormValid || isSubmitting"
              class="w-full py-3.5 px-4 mb-6 inline-flex justify-center items-center gap-x-2 text-base font-semibold rounded-xl border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isSubmitting">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ $t('common.sending') }}
              </template>
              <template v-else>
                <Icon name="heroicons:bell-alert" class="w-5 h-5" />
                {{ $t('sos.sendAlert') }}
              </template>
            </button>
          </div>

          <!-- Step: Vet Form - Dog -->
          <div v-else-if="step === 'form' && emergencyType === 'vet' && animalType === 'dog'" key="vet-dog" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="vetDogForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholder')"
                autocomplete="off"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- What Happened -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('vetForm.whatHappened') }}
              </label>
              <textarea
                v-model="vetDogForm.whatHappened"
                rows="4"
                :placeholder="$t('vetForm.whatHappenedPlaceholder')"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!vetDogFormValid || isSubmitting"
              class="w-full py-3.5 px-4 mb-6 inline-flex justify-center items-center gap-x-2 text-base font-semibold rounded-xl border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isSubmitting">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ $t('common.sending') }}
              </template>
              <template v-else>
                <Icon name="heroicons:bell-alert" class="w-5 h-5" />
                {{ $t('sos.findVet') }}
              </template>
            </button>
          </div>

          <!-- Step: Vet Form - Cat -->
          <div v-else-if="step === 'form' && emergencyType === 'vet' && animalType === 'cat'" key="vet-cat" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="vetCatForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholder')"
                autocomplete="off"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- What Happened -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('vetForm.whatHappened') }}
              </label>
              <textarea
                v-model="vetCatForm.whatHappened"
                rows="4"
                :placeholder="$t('vetForm.whatHappenedPlaceholder')"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!vetCatFormValid || isSubmitting"
              class="w-full py-3.5 px-4 mb-6 inline-flex justify-center items-center gap-x-2 text-base font-semibold rounded-xl border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isSubmitting">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ $t('common.sending') }}
              </template>
              <template v-else>
                <Icon name="heroicons:bell-alert" class="w-5 h-5" />
                {{ $t('sos.findVet') }}
              </template>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNav />
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
</style>
