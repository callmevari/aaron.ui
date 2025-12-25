<script setup lang="ts">
import { usePetsStore } from '~/stores/pets'
import { useRequestsStore } from '~/stores/requests'
import { useNotificationsStore } from '~/stores/notifications'
import { Capacitor } from '@capacitor/core'
import type { BloodType, AnimalType as PetAnimalType } from '~/stores/pets'

const { t } = useI18n()
const router = useRouter()
const petsStore = usePetsStore()
const requestsStore = useRequestsStore()
const notificationsStore = useNotificationsStore()

// Trigger notification for matching nearby requests
const triggerNearbyRequestNotification = async (matchingCount: number, species: PetAnimalType) => {
  const title = species === 'cat'
    ? t('notifications.nearbyRequest.catTitle', { count: matchingCount })
    : t('notifications.nearbyRequest.dogTitle', { count: matchingCount })
  const body = t('notifications.nearbyRequest.body')

  try {
    if (Capacitor.isNativePlatform()) {
      // Native platform: use Local Notifications
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      // Check permissions first
      const permResult = await LocalNotifications.checkPermissions()
      if (permResult.display !== 'granted') {
        console.log('Notification permission not granted')
        return
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) }
        }]
      })
    } else {
      // Web platform: use browser Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body })
      }
    }

    // Also add to notifications store for history
    notificationsStore.addNotification({
      type: 'NEARBY_BLOOD_REQUEST',
      title,
      body,
      extra: { species, matchingCount }
    })
  } catch (e) {
    console.error('Failed to trigger notification:', e)
  }
}

type Step = 'animal' | 'form'
type AnimalType = 'cat' | 'dog'

const step = ref<Step>('animal')
const animalType = ref<AnimalType | null>(null)
const isSubmitting = ref(false)

// Donor form - Cat
const donorCatForm = reactive({
  petName: '',
  photoUrl: '',
  ageYears: null as number | null,
  weightKg: null as number | null,
  bloodType: '' as '' | 'A' | 'B' | 'AB',
  isTipified: '' as '' | 'yes' | 'no' | 'unknown',
  tipifiedBy: ''
})

const donorCatFormValid = computed(() => {
  return donorCatForm.petName.trim() &&
         donorCatForm.ageYears !== null &&
         donorCatForm.ageYears > 0 &&
         donorCatForm.weightKg !== null &&
         donorCatForm.weightKg > 0 &&
         donorCatForm.bloodType &&
         donorCatForm.isTipified
})

// Donor form - Dog
const donorDogForm = reactive({
  petName: '',
  photoUrl: '',
  ageYears: null as number | null,
  weightKg: null as number | null,
  bloodType: '' as '' | 'dea-positive' | 'dea-negative' | 'other',
  isTipified: '' as '' | 'yes' | 'no' | 'unknown',
  tipifiedBy: ''
})

const donorDogFormValid = computed(() => {
  return donorDogForm.petName.trim() &&
         donorDogForm.ageYears !== null &&
         donorDogForm.ageYears > 0 &&
         donorDogForm.weightKg !== null &&
         donorDogForm.weightKg > 0 &&
         donorDogForm.bloodType &&
         donorDogForm.isTipified
})

// Blood type options
const donorCatBloodTypeOptions = [
  { value: 'A' as const, label: 'Type A' },
  { value: 'B' as const, label: 'Type B' },
  { value: 'AB' as const, label: 'Type AB' }
]

const donorDogBloodTypeOptions = [
  { value: 'dea-positive' as const, label: 'DEA 1.1 Positive' },
  { value: 'dea-negative' as const, label: 'DEA 1.1 Negative' },
  { value: 'other' as const, label: t('donor.otherUnknown') }
]

const yesNoOptions = computed(() => [
  { value: 'yes' as const, label: t('common.yes') },
  { value: 'no' as const, label: t('common.no') },
  { value: 'unknown' as const, label: t('common.unknown') }
])

// Photo upload handler
const handlePhotoUpload = async (event: Event, formType: 'cat' | 'dog') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    if (formType === 'cat') {
      donorCatForm.photoUrl = base64
    } else {
      donorDogForm.photoUrl = base64
    }
  }
  reader.readAsDataURL(file)
}

// Format blood type for storage
const formatBloodTypeForStorage = (bloodType: string, species: PetAnimalType): BloodType => {
  if (species === 'dog') {
    if (bloodType === 'dea-positive') return 'DEA 1.1+' as BloodType
    if (bloodType === 'dea-negative') return 'DEA 1.1-' as BloodType
    return bloodType as BloodType
  }
  return bloodType as BloodType
}

const selectAnimal = (type: AnimalType) => {
  animalType.value = type
  step.value = 'form'
}

const goBack = () => {
  if (step.value === 'form') {
    step.value = 'animal'
    animalType.value = null
  } else {
    router.back()
  }
}

const handleSubmit = async () => {
  const isDog = animalType.value === 'dog'
  const donorForm = isDog ? donorDogForm : donorCatForm
  const formValid = isDog ? donorDogFormValid.value : donorCatFormValid.value

  if (!formValid) return

  isSubmitting.value = true

  try {
    const species = animalType.value as PetAnimalType
    const formattedBloodType = formatBloodTypeForStorage(donorForm.bloodType, species)

    await petsStore.registerDonor({
      name: donorForm.petName,
      species,
      photoUrl: donorForm.photoUrl || '',
      ageYears: donorForm.ageYears || 3,
      weightKg: donorForm.weightKg || 25,
      bloodType: formattedBloodType
    })

    console.log('Donor registered:', donorForm.petName)

    // Fetch nearby requests that match the new donor's blood type
    const donorBloodTypes = petsStore.getDonorBloodTypes
    await requestsStore.fetchNearbyRequests(donorBloodTypes)

    // Trigger notification if there are matching requests
    const matchingRequests = requestsStore.matchingNearbyRequests(donorBloodTypes)
    if (matchingRequests.length > 0) {
      await triggerNearbyRequestNotification(matchingRequests.length, species)
    }

    navigateTo({
      path: '/home',
      query: {
        registered: 'true',
        petName: donorForm.petName,
        species: animalType.value,
        bloodType: formattedBloodType
      }
    })
  } catch (error) {
    console.error('Failed to register donor:', error)
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
        {{ $t('donor.addDonor') }}
      </h1>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-6 pb-8">
      <div class="max-w-sm mx-auto">
        <Transition name="fade" mode="out-in">
          <!-- Step: Animal Selection -->
          <div v-if="step === 'animal'" key="animal" class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">
              {{ $t('donor.selectAnimalType') }}
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
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('donor.registerDog') }}</p>
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
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('donor.registerCat') }}</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400 ml-auto" />
            </button>
          </div>

          <!-- Step: Dog Form -->
          <div v-else-if="step === 'form' && animalType === 'dog'" key="dog-form" class="space-y-5">
            <!-- Photo Upload -->
            <div class="flex justify-center">
              <label class="relative cursor-pointer">
                <div :class="[
                  'w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed transition-all',
                  donorDogForm.photoUrl
                    ? 'border-orange-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'
                ]">
                  <img
                    v-if="donorDogForm.photoUrl"
                    :src="donorDogForm.photoUrl"
                    alt="Pet photo"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="text-center">
                    <Icon name="heroicons:camera" class="w-8 h-8 text-gray-400 mx-auto" />
                    <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{{ $t('donor.tapToUpload') }}</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handlePhotoUpload($event, 'dog')"
                />
                <div v-if="donorDogForm.photoUrl" class="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Icon name="heroicons:pencil" class="w-4 h-4 text-white" />
                </div>
              </label>
            </div>

            <!-- Pet Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.petName') }}
              </label>
              <input
                v-model="donorDogForm.petName"
                type="text"
                :placeholder="$t('donor.petNamePlaceholder')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Age and Weight Row -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('donor.age') }}
                </label>
                <input
                  v-model.number="donorDogForm.ageYears"
                  type="number"
                  min="1"
                  max="15"
                  :placeholder="$t('donor.agePlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('donor.ageHint') }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('donor.weight') }}
                </label>
                <input
                  v-model.number="donorDogForm.weightKg"
                  type="number"
                  min="1"
                  max="100"
                  :placeholder="$t('donor.weightPlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('donor.weightHintDog') }}</p>
              </div>
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.bloodType') }} <span class="text-red-500">*</span>
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ $t('donor.bloodTypeRequired') }}</p>
              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="option in donorDogBloodTypeOptions"
                  :key="option.value"
                  type="button"
                  @click="donorDogForm.bloodType = option.value"
                  :class="[
                    'py-3 px-4 text-sm font-medium rounded-lg border-2 transition-all text-left',
                    donorDogForm.bloodType === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Is Tipified -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.isTipified') }}
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="donorDogForm.isTipified = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    donorDogForm.isTipified === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Tipified By -->
            <div v-if="donorDogForm.isTipified === 'yes'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.tipifiedBy') }}
              </label>
              <input
                v-model="donorDogForm.tipifiedBy"
                type="text"
                :placeholder="$t('donor.tipifiedByPlaceholder')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('donor.tipifiedByHint') }}</p>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!donorDogFormValid || isSubmitting"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isSubmitting">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ $t('common.saving') }}
              </template>
              <template v-else>
                <Icon name="heroicons:plus" class="w-4 h-4" />
                {{ $t('donor.registerDonor') }}
              </template>
            </button>
          </div>

          <!-- Step: Cat Form -->
          <div v-else-if="step === 'form' && animalType === 'cat'" key="cat-form" class="space-y-5">
            <!-- Photo Upload -->
            <div class="flex justify-center">
              <label class="relative cursor-pointer">
                <div :class="[
                  'w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed transition-all',
                  donorCatForm.photoUrl
                    ? 'border-orange-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'
                ]">
                  <img
                    v-if="donorCatForm.photoUrl"
                    :src="donorCatForm.photoUrl"
                    alt="Pet photo"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="text-center">
                    <Icon name="heroicons:camera" class="w-8 h-8 text-gray-400 mx-auto" />
                    <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{{ $t('donor.tapToUpload') }}</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handlePhotoUpload($event, 'cat')"
                />
                <div v-if="donorCatForm.photoUrl" class="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Icon name="heroicons:pencil" class="w-4 h-4 text-white" />
                </div>
              </label>
            </div>

            <!-- Pet Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.petName') }}
              </label>
              <input
                v-model="donorCatForm.petName"
                type="text"
                :placeholder="$t('donor.petNamePlaceholder')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Age and Weight Row -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('donor.age') }}
                </label>
                <input
                  v-model.number="donorCatForm.ageYears"
                  type="number"
                  min="1"
                  max="15"
                  :placeholder="$t('donor.agePlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('donor.ageHint') }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('donor.weight') }}
                </label>
                <input
                  v-model.number="donorCatForm.weightKg"
                  type="number"
                  min="1"
                  max="20"
                  :placeholder="$t('donor.weightPlaceholder')"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('donor.weightHintCat') }}</p>
              </div>
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.bloodType') }} <span class="text-red-500">*</span>
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ $t('donor.bloodTypeRequired') }}</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in donorCatBloodTypeOptions"
                  :key="option.value"
                  type="button"
                  @click="donorCatForm.bloodType = option.value"
                  :class="[
                    'py-3 px-4 text-sm font-medium rounded-lg border-2 transition-all',
                    donorCatForm.bloodType === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Is Tipified -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.isTipified') }}
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="donorCatForm.isTipified = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    donorCatForm.isTipified === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Tipified By -->
            <div v-if="donorCatForm.isTipified === 'yes'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('donor.tipifiedBy') }}
              </label>
              <input
                v-model="donorCatForm.tipifiedBy"
                type="text"
                :placeholder="$t('donor.tipifiedByPlaceholder')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('donor.tipifiedByHint') }}</p>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!donorCatFormValid || isSubmitting"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isSubmitting">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ $t('common.saving') }}
              </template>
              <template v-else>
                <Icon name="heroicons:plus" class="w-4 h-4" />
                {{ $t('donor.registerDonor') }}
              </template>
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
</style>
