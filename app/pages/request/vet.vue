<script setup lang="ts">
const { t } = useI18n()

// Types
type AnimalType = 'cat' | 'dog'
type RequestStatus = 'active' | 'expired' | 'cancelled'

// Mock request state - simulates a request created 30 minutes ago
const requestCreatedAt = ref(Date.now() - 30 * 60 * 1000)
const requestStatus = ref<RequestStatus>('active')
const REQUEST_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

// Countdown timer
const timeRemaining = ref('')
const remainingMs = ref(0)

// Can only extend when less than 8 hours remaining
const EXTEND_THRESHOLD_MS = 8 * 60 * 60 * 1000
const canExtend = computed(() => remainingMs.value > 0 && remainingMs.value <= EXTEND_THRESHOLD_MS)

const updateCountdown = () => {
  if (requestStatus.value !== 'active') return

  const elapsed = Date.now() - requestCreatedAt.value
  const remaining = REQUEST_DURATION_MS - elapsed

  if (remaining <= 0) {
    requestStatus.value = 'expired'
    timeRemaining.value = '0h 0m'
    remainingMs.value = 0
    return
  }

  remainingMs.value = remaining
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
  timeRemaining.value = `${hours}h ${minutes}m`
}

// Update countdown every minute
let countdownInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 60000)
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

// Actions
const extendRequest = () => {
  if (!canExtend.value) return
  requestCreatedAt.value = Date.now()
  requestStatus.value = 'active'
  updateCountdown()
}

const cancelRequest = () => {
  requestStatus.value = 'cancelled'
}

const rebroadcastRequest = () => {
  requestCreatedAt.value = Date.now()
  requestStatus.value = 'active'
  updateCountdown()
}

// Filter state
const show24HoursOnly = ref(false)

interface VetClinic {
  id: string
  name: string
  distance: number
  is24Hours: boolean
  animalTypes: AnimalType[]
  rating?: number
  phone: string
  address: string
  isOpen: boolean
}

// Mock data - Vet Clinics
const vetClinics = ref<VetClinic[]>([
  {
    id: '1',
    name: 'Central Veterinary Hospital',
    distance: 2.5,
    is24Hours: true,
    animalTypes: ['cat', 'dog'],
    rating: 4.8,
    phone: '+54 11 4567-8901',
    address: 'Av. Corrientes 1234',
    isOpen: true
  },
  {
    id: '2',
    name: 'Pet Emergency Center',
    distance: 4.2,
    is24Hours: true,
    animalTypes: ['cat', 'dog'],
    rating: 4.6,
    phone: '+54 11 5678-9012',
    address: 'Av. Santa Fe 5678',
    isOpen: true
  },
  {
    id: '3',
    name: 'Happy Paws Clinic',
    distance: 5.8,
    is24Hours: false,
    animalTypes: ['cat', 'dog'],
    rating: 4.9,
    phone: '+54 11 6789-0123',
    address: 'Calle Florida 910',
    isOpen: true
  },
  {
    id: '4',
    name: 'Cat Care Specialists',
    distance: 6.3,
    is24Hours: false,
    animalTypes: ['cat'],
    rating: 4.7,
    phone: '+54 11 7890-1234',
    address: 'Av. Callao 456',
    isOpen: false
  },
  {
    id: '5',
    name: 'Canine Health Center',
    distance: 7.1,
    is24Hours: true,
    animalTypes: ['dog'],
    rating: 4.5,
    phone: '+54 11 8901-2345',
    address: 'Av. Rivadavia 789',
    isOpen: true
  },
  {
    id: '6',
    name: 'Night Vet Emergency',
    distance: 8.5,
    is24Hours: true,
    animalTypes: ['cat', 'dog'],
    rating: 4.4,
    phone: '+54 11 9012-3456',
    address: 'Av. Belgrano 321',
    isOpen: true
  },
  {
    id: '7',
    name: 'Animal Wellness Clinic',
    distance: 12.0,
    is24Hours: false,
    animalTypes: ['cat', 'dog'],
    rating: 4.3,
    phone: '+54 11 0123-4567',
    address: 'Calle Lavalle 654',
    isOpen: false
  }
])

// Get route query params
const route = useRoute()
const requestType = computed<AnimalType>(() => (route.query.type as AnimalType) || 'cat')

// Filter clinics
const filteredClinics = computed(() => {
  return vetClinics.value
    .filter(clinic => {
      // Filter by animal type
      if (!clinic.animalTypes.includes(requestType.value)) return false
      // Filter by 24h if enabled
      if (show24HoursOnly.value && !clinic.is24Hours) return false
      return true
    })
    .sort((a, b) => {
      // Open + 24h first, then by distance
      if (a.isOpen && a.is24Hours && !(b.isOpen && b.is24Hours)) return -1
      if (!(a.isOpen && a.is24Hours) && b.isOpen && b.is24Hours) return 1
      if (a.isOpen && !b.isOpen) return -1
      if (!a.isOpen && b.isOpen) return 1
      return a.distance - b.distance
    })
})

const availableClinicsCount = computed(() => {
  return filteredClinics.value.filter(c => c.isOpen).length
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 md:bg-white md:dark:bg-gray-800 md:mx-24 lg:mx-48">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 pt-safe md:mt-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('vetRequest.title') }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('vetRequest.forAnimal', { animalType: requestType === 'cat' ? $t('animals.cat') : $t('animals.dog') }) }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span class="text-sm font-medium text-red-600 dark:text-red-400">{{ $t('request.active') }}</span>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="px-4 py-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Icon name="heroicons:building-office-2" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ availableClinicsCount }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('vetRequest.clinicsNearby') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="px-4 pb-4">
      <label class="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
        <input
          v-model="show24HoursOnly"
          type="checkbox"
          class="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
        />
        <div class="flex items-center gap-2">
          <Icon name="heroicons:clock" class="w-5 h-5 text-orange-500" />
          <span class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('vetRequest.filter24h') }}</span>
        </div>
      </label>
    </div>

    <!-- Clinics List -->
    <div class="flex-1 px-4 pb-40 overflow-y-auto">
      <div class="space-y-3">
        <div
          v-for="clinic in filteredClinics"
          :key="clinic.id"
          :class="[
            'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all',
            clinic.isOpen && clinic.is24Hours
              ? 'border-green-200 dark:border-green-800/50'
              : clinic.isOpen
                ? 'border-orange-200 dark:border-orange-800/50'
                : 'border-gray-200 dark:border-gray-700'
          ]"
        >
          <div class="flex justify-between gap-3">
            <!-- Left Column -->
            <div class="flex-1 min-w-0">
              <!-- Row 1: Name + badges -->
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="font-semibold text-gray-900 dark:text-white">{{ clinic.name }}</span>
                <span v-if="clinic.is24Hours" class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                  24/7
                </span>
              </div>
              <!-- Row 2: Address -->
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ clinic.address }}
              </p>
              <!-- Row 3: Info labels -->
              <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 flex-wrap">
                <span class="flex items-center gap-1 whitespace-nowrap">
                  <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
                  {{ clinic.distance }}{{ $t('common.km') }}
                </span>
                <span v-if="clinic.rating" class="flex items-center gap-1 whitespace-nowrap">
                  <Icon name="heroicons:star" class="w-3.5 h-3.5 text-yellow-500" />
                  {{ clinic.rating }}
                </span>
                <span class="flex items-center gap-1 whitespace-nowrap">
                  <span v-if="clinic.animalTypes.includes('cat')">🐱</span>
                  <span v-if="clinic.animalTypes.includes('dog')">🐶</span>
                </span>
              </div>
            </div>

            <!-- Right Column -->
            <div class="flex flex-col items-end gap-2 shrink-0">
              <span v-if="clinic.isOpen" class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                {{ $t('vetRequest.open') }}
              </span>
              <span v-else class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 whitespace-nowrap">
                {{ $t('vetRequest.closed') }}
              </span>
              <a
                v-if="clinic.isOpen"
                :href="`tel:${clinic.phone}`"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                {{ $t('common.contact') }}
              </a>
              <button
                v-else
                type="button"
                disabled
                class="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              >
                {{ $t('common.unavailable') }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredClinics.length === 0" class="text-center py-12">
          <Icon name="heroicons:building-office-2" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">{{ $t('vetRequest.noClinics') }}</p>
        </div>
      </div>
    </div>

    <!-- Bottom Action -->
    <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 pb-safe md:left-24 md:right-24 lg:left-48 lg:right-48">
      <!-- Active Request Status -->
      <div v-if="requestStatus === 'active'" class="space-y-3">
        <div class="flex items-center justify-between py-3 px-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span class="text-sm font-medium text-orange-700 dark:text-orange-300">{{ $t('request.requestActive') }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400">
            <Icon name="heroicons:clock" class="w-4 h-4" />
            <span>{{ $t('request.expiresIn2', { time: timeRemaining }) }}</span>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            @click="extendRequest"
            :disabled="!canExtend"
            :class="[
              'flex-1 py-2.5 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border transition',
              canExtend
                ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            ]"
          >
            <Icon name="heroicons:arrow-path" class="w-4 h-4" />
            {{ canExtend ? $t('request.extend24h') : $t('request.extendDisabled') }}
          </button>
          <button
            type="button"
            @click="cancelRequest"
            class="flex-1 py-2.5 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
            {{ $t('request.cancelRequest') }}
          </button>
        </div>
      </div>

      <!-- Expired Request -->
      <div v-else-if="requestStatus === 'expired'" class="space-y-3">
        <div class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span class="text-sm font-medium text-yellow-700 dark:text-yellow-300">{{ $t('request.requestExpired') }}</span>
        </div>

        <button
          type="button"
          @click="rebroadcastRequest"
          class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
        >
          <Icon name="heroicons:megaphone" class="w-5 h-5" />
          {{ $t('request.rebroadcast') }}
        </button>
      </div>

      <!-- Cancelled Request -->
      <div v-else-if="requestStatus === 'cancelled'" class="space-y-3">
        <div class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
          <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('request.requestResolved') }}</span>
        </div>

        <button
          type="button"
          @click="rebroadcastRequest"
          class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
        >
          <Icon name="heroicons:megaphone" class="w-5 h-5" />
          {{ $t('request.newRequest') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
