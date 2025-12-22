<script setup lang="ts">
import { usePetsStore } from '~/stores/pets'
import { useRequestsStore } from '~/stores/requests'

const { t } = useI18n()
const router = useRouter()
const petsStore = usePetsStore()
const requestsStore = useRequestsStore()

// Types
type BloodUnitStatus = 'available' | 'reserved' | 'pending' | 'expired'
type AnimalType = 'cat' | 'dog'
type RequestStatus = 'active' | 'expired' | 'cancelled'

// View mode: 'donor' (see requests needing help) or 'requester' (my blood requests)
type ViewMode = 'donor' | 'requester'
const viewMode = ref<ViewMode>('requester')

// Determine available modes based on user state
const hasDonorPets = computed(() => petsStore.hasDonors)
const hasActiveDonors = computed(() => petsStore.activeDonors.length > 0)
const hasActiveBloodRequest = computed(() => requestsStore.hasActiveBloodRequest)
const hasActiveVetRequest = computed(() => requestsStore.hasActiveVetRequest)
const hasActiveRequest = computed(() => requestsStore.hasActiveRequest)
const storeActiveBloodRequest = computed(() => requestsStore.activeBloodRequest)

// Get matching nearby requests for ACTIVE donors only
const matchingNearbyRequests = computed(() => {
  const activeDonorBloodTypes = petsStore.getDonorBloodTypes
  return requestsStore.matchingNearbyRequests(activeDonorBloodTypes)
})

// Request status derived from store
const requestStatus = computed<RequestStatus>(() => {
  if (!storeActiveBloodRequest.value) return 'cancelled'
  return storeActiveBloodRequest.value.status === 'active' ? 'active' :
         storeActiveBloodRequest.value.status === 'expired' ? 'expired' : 'cancelled'
})

// Request timing from store
const requestCreatedAt = computed(() => {
  if (!storeActiveBloodRequest.value) return Date.now()
  return new Date(storeActiveBloodRequest.value.createdAt).getTime()
})
const REQUEST_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

// Countdown timer
const timeRemaining = ref('')
const remainingMs = ref(0)
const isExpired = computed(() => requestStatus.value === 'expired')
const isCancelled = computed(() => requestStatus.value === 'cancelled')

// Can only extend when less than 8 hours remaining
const EXTEND_THRESHOLD_MS = 8 * 60 * 60 * 1000 // 8 hours
const canExtend = computed(() => remainingMs.value > 0 && remainingMs.value <= EXTEND_THRESHOLD_MS)

const updateCountdown = () => {
  if (requestStatus.value !== 'active' || !storeActiveBloodRequest.value) {
    timeRemaining.value = '0h 0m'
    remainingMs.value = 0
    return
  }

  const expiresAt = new Date(storeActiveBloodRequest.value.expiresAt).getTime()
  const remaining = expiresAt - Date.now()

  if (remaining <= 0) {
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

onMounted(async () => {
  // Hydrate store from localStorage
  requestsStore.hydrate()

  // If user has an active vet request, redirect to vet request page
  if (hasActiveVetRequest.value) {
    const vetRequest = requestsStore.activeVetRequest
    router.replace({
      path: '/request/vet',
      query: { type: vetRequest?.species || 'dog' }
    })
    return
  }

  // Set default view mode based on what user has
  if (hasActiveBloodRequest.value) {
    viewMode.value = 'requester'
  } else if (hasDonorPets.value) {
    viewMode.value = 'donor'
  } else {
    viewMode.value = 'requester' // Default to requester view
  }

  // Fetch nearby requests if user has donors
  if (hasDonorPets.value) {
    const donorBloodTypes = petsStore.getDonorBloodTypes
    await requestsStore.fetchNearbyRequests(donorBloodTypes)
  }

  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 60000) // Update every minute
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

// Watch for active blood request changes
watch(hasActiveBloodRequest, (newValue) => {
  if (newValue) {
    viewMode.value = 'requester'
  }
}, { immediate: true })

// Actions
const extendRequest = async () => {
  if (storeActiveBloodRequest.value) {
    await requestsStore.extendRequest(storeActiveBloodRequest.value.id)
    updateCountdown()
  }
}

const cancelRequest = async () => {
  if (storeActiveBloodRequest.value) {
    await requestsStore.resolveRequest(storeActiveBloodRequest.value.id)

    // Refresh nearby requests if user has active donors
    if (hasActiveDonors.value) {
      const donorBloodTypes = petsStore.getDonorBloodTypes
      await requestsStore.fetchNearbyRequests(donorBloodTypes)

      // Switch to donor view if there are matching requests
      if (matchingNearbyRequests.value.length > 0) {
        viewMode.value = 'donor'
      }
    }
  }
}

const rebroadcastRequest = () => {
  // Navigate to SOS to create a new request
  navigateTo('/sos')
}

type BloodProductType = 'whole blood' | 'packed red blood cells'

interface BloodUnit {
  id: string
  animalType: AnimalType
  bloodType: string
  status: BloodUnitStatus
  provider: string
  distance: number // km
  expiresIn?: number // days
  units: number
  volume?: number // ml (optional)
  productType?: BloodProductType // optional
}

interface Donor {
  id: string
  animalType: AnimalType
  petName: string
  bloodType: string
  distance: number // km
  lastDonation?: string // date
  isAvailable: boolean
  isVerified: boolean
}

// Mock data - Blood Units
const bloodUnits = ref<BloodUnit[]>([
  {
    id: '1',
    animalType: 'cat',
    bloodType: 'A',
    status: 'available',
    provider: 'Central Veterinary Blood Bank',
    distance: 12,
    expiresIn: 21,
    units: 2,
    volume: 50,
    productType: 'whole blood'
  },
  {
    id: '2',
    animalType: 'cat',
    bloodType: 'A',
    status: 'available',
    provider: 'Pet Emergency Center',
    distance: 28,
    expiresIn: 14,
    units: 1,
    volume: 25,
    productType: 'packed red blood cells'
  },
  {
    id: '3',
    animalType: 'cat',
    bloodType: 'B',
    status: 'reserved',
    provider: 'Animal Care Hospital',
    distance: 35,
    expiresIn: 7,
    units: 1,
    volume: 60
    // no productType - optional
  },
  {
    id: '4',
    animalType: 'cat',
    bloodType: 'AB',
    status: 'pending',
    provider: 'University Vet Clinic',
    distance: 45,
    units: 1
    // no volume or productType - both optional
  },
  {
    id: '5',
    animalType: 'dog',
    bloodType: 'DEA 1.1+',
    status: 'available',
    provider: 'Central Veterinary Blood Bank',
    distance: 12,
    expiresIn: 28,
    units: 3,
    volume: 250,
    productType: 'whole blood'
  },
  {
    id: '6',
    animalType: 'dog',
    bloodType: 'DEA 1.1-',
    status: 'available',
    provider: 'Metro Animal Hospital',
    distance: 18,
    expiresIn: 10,
    units: 2,
    productType: 'packed red blood cells'
    // no volume - optional
  }
])

// Mock data - Donors
const donors = ref<Donor[]>([
  {
    id: '1',
    animalType: 'cat',
    petName: 'Luna',
    bloodType: 'A',
    distance: 5,
    lastDonation: '2024-10-15',
    isAvailable: true,
    isVerified: true
  },
  {
    id: '2',
    animalType: 'cat',
    petName: 'Milo',
    bloodType: 'A',
    distance: 8,
    lastDonation: '2024-09-20',
    isAvailable: true,
    isVerified: true
  },
  {
    id: '3',
    animalType: 'cat',
    petName: 'Whiskers',
    bloodType: 'B',
    distance: 15,
    isAvailable: true,
    isVerified: false
  },
  {
    id: '4',
    animalType: 'cat',
    petName: 'Shadow',
    bloodType: 'A',
    distance: 22,
    lastDonation: '2024-11-01',
    isAvailable: false,
    isVerified: true
  },
  {
    id: '5',
    animalType: 'dog',
    petName: 'Max',
    bloodType: 'DEA 1.1+',
    distance: 3,
    lastDonation: '2024-10-20',
    isAvailable: true,
    isVerified: true
  },
  {
    id: '6',
    animalType: 'dog',
    petName: 'Bella',
    bloodType: 'DEA 1.1+',
    distance: 11,
    isAvailable: true,
    isVerified: true
  },
  {
    id: '7',
    animalType: 'dog',
    petName: 'Rocky',
    bloodType: 'DEA 1.1-',
    distance: 25,
    lastDonation: '2024-08-15',
    isAvailable: true,
    isVerified: false
  }
])

// Filter data based on request
const matchingBloodUnits = computed(() => {
  return bloodUnits.value
    .filter(unit => unit.animalType === requestType.value)
    .sort((a, b) => {
      // Available first, then by distance
      if (a.status === 'available' && b.status !== 'available') return -1
      if (a.status !== 'available' && b.status === 'available') return 1
      return a.distance - b.distance
    })
})

const matchingDonors = computed(() => {
  return donors.value
    .filter(donor => donor.animalType === requestType.value)
    .sort((a, b) => {
      // Available and verified first, then by distance
      if (a.isAvailable && a.isVerified && !(b.isAvailable && b.isVerified)) return -1
      if (!(a.isAvailable && a.isVerified) && b.isAvailable && b.isVerified) return 1
      if (a.isAvailable && !b.isAvailable) return -1
      if (!a.isAvailable && b.isAvailable) return 1
      return a.distance - b.distance
    })
})

const availableUnitsCount = computed(() => {
  return matchingBloodUnits.value.filter(u => u.status === 'available').length
})

const availableDonorsCount = computed(() => {
  return matchingDonors.value.filter(d => d.isAvailable).length
})

// Status helpers
const statusConfig = computed(() => ({
  available: { label: t('common.available'), class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  reserved: { label: t('common.reserved'), class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: t('common.pending'), class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  expired: { label: t('common.expired'), class: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' }
}))

// Get route query params
const route = useRoute()
const requestType = computed<AnimalType>(() => {
  if (storeActiveBloodRequest.value) return storeActiveBloodRequest.value.species
  return (route.query.type as AnimalType) || 'cat'
})
const requestBloodType = computed(() => {
  if (storeActiveBloodRequest.value) return formatBloodType(storeActiveBloodRequest.value.bloodType)
  return (route.query.bloodType as string) || 'A'
})
const patientName = computed(() => {
  if (storeActiveBloodRequest.value) return storeActiveBloodRequest.value.petName
  return (route.query.patient as string) || 'Your pet'
})

// Format blood type for display
const formatBloodType = (bloodType: string) => {
  const typeMap: Record<string, string> = {
    'deaPositive': 'DEA 1.1+',
    'deaNegative': 'DEA 1.1-',
    'DEA 1.1 Positive': 'DEA 1.1+',
    'DEA 1.1 Negative': 'DEA 1.1-',
    'unknown': 'Unknown'
  }
  return typeMap[bloodType] || bloodType
}

// Helper to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'Just now'
}

// Active tab
const activeTab = ref<'units' | 'donors'>('units')
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900 md:bg-white md:dark:bg-gray-800 md:mx-24 lg:mx-48 pb-20">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 pt-safe md:mt-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('nav.requests') }}</h1>
        </div>
      </div>

      <!-- View Mode Toggle (if user has both donor pets and active blood request) -->
      <div v-if="hasDonorPets && hasActiveBloodRequest" class="mt-3 flex gap-2">
        <button
          type="button"
          @click="viewMode = 'donor'"
          :class="[
            'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition',
            viewMode === 'donor'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          ]"
        >
          {{ $t('request.nearbyNeedHelp') }}
        </button>
        <button
          type="button"
          @click="viewMode = 'requester'"
          :class="[
            'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition',
            viewMode === 'requester'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          ]"
        >
          {{ $t('request.myRequest') }}
        </button>
      </div>
    </div>

    <!-- DONOR VIEW: Nearby requests needing help -->
    <template v-if="viewMode === 'donor'">
      <div class="flex-1 overflow-y-auto px-4 py-4">
        <!-- New request notification (only show if there are matching requests for active donors) -->
        <div
          v-if="requestsStore.hasNewNearbyRequest && matchingNearbyRequests.length > 0"
          class="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <Icon name="heroicons:bell-alert" class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-red-800 dark:text-red-200">
                {{ $t('request.newNearbyAlert') }}
              </p>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ $t('request.petsNeedHelp', { count: matchingNearbyRequests.length }) }}
              </p>
            </div>
            <button
              type="button"
              @click="requestsStore.clearNewRequestNotification()"
              class="text-red-400 hover:text-red-600"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Nearby requests list (only show matching requests for active donors) -->
        <div v-if="matchingNearbyRequests.length > 0" class="space-y-3">
          <div
            v-for="request in matchingNearbyRequests"
            :key="request.id"
            class="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-red-200 dark:border-red-800/50 transition-all"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xl">{{ request.species === 'cat' ? '🐱' : '🐶' }}</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ request.petName }}</span>
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {{ $t('request.urgent') }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('request.needsBloodType', { type: formatBloodType(request.bloodType) }) }}
                </p>
                <p v-if="request.hospitalName" class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {{ request.hospitalName }}
                </p>
                <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500 flex-nowrap">
                  <span class="flex items-center gap-1 whitespace-nowrap shrink-0">
                    <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
                    {{ request.distance }}{{ $t('common.km') }}
                  </span>
                  <span class="flex items-center gap-1 whitespace-nowrap shrink-0">
                    <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                    {{ formatTimeAgo(request.createdAt) }}
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                {{ $t('common.contact') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state: has active donors but no matching requests -->
        <div
          v-else-if="hasActiveDonors"
          class="text-center py-12"
        >
          <Icon name="heroicons:check-circle" class="w-12 h-12 text-green-400 dark:text-green-600 mx-auto mb-3" />
          <h3 class="font-medium text-gray-900 dark:text-white mb-1">
            {{ $t('request.noNearbyRequests') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            {{ $t('request.noNearbyRequestsDesc') }}
          </p>
        </div>

        <!-- Empty state: has donors but none active -->
        <div
          v-else-if="hasDonorPets && !hasActiveDonors"
          class="text-center py-12"
        >
          <Icon name="heroicons:pause-circle" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 class="font-medium text-gray-900 dark:text-white mb-1">
            {{ $t('request.noDonorsActive') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
            {{ $t('request.noDonorsActiveDesc') }}
          </p>
          <NuxtLink
            to="/home"
            class="inline-flex px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition"
          >
            {{ $t('request.activateDonor') }}
          </NuxtLink>
        </div>

        <!-- No donors registered -->
        <div
          v-else
          class="text-center py-12"
        >
          <Icon name="heroicons:heart" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 class="font-medium text-gray-900 dark:text-white mb-1">
            {{ $t('request.registerDonorFirst') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
            {{ $t('request.registerDonorFirstDesc') }}
          </p>
          <NuxtLink
            to="/home"
            class="inline-flex px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition"
          >
            {{ $t('home.registerDonor') }}
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- REQUESTER VIEW: My blood request -->
    <template v-else-if="viewMode === 'requester' && hasActiveBloodRequest">
      <!-- Only show content when request is active -->
      <template v-if="requestStatus === 'active'">
      <!-- Request info subheader -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('request.forPet', { petName: patientName, animalType: requestType === 'cat' ? $t('animals.cat') : $t('animals.dog'), bloodType: requestBloodType }) }}
          </p>
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
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Icon name="heroicons:beaker" class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ availableUnitsCount }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('request.bloodUnits') }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Icon name="heroicons:heart" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ availableDonorsCount }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('request.donorsNearby') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="px-4">
      <div class="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          type="button"
          @click="activeTab = 'units'"
          :class="[
            'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all',
            activeTab === 'units'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          {{ $t('request.tabUnits') }}
        </button>
        <button
          type="button"
          @click="activeTab = 'donors'"
          :class="[
            'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all',
            activeTab === 'donors'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          {{ $t('request.tabDonors') }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-4 py-4 overflow-y-auto pb-40">
      <!-- Blood Units List -->
      <div v-if="activeTab === 'units'" class="space-y-3">
        <div
          v-for="unit in matchingBloodUnits"
          :key="unit.id"
          :class="[
            'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all',
            unit.status === 'available'
              ? 'border-green-200 dark:border-green-800/50'
              : 'border-gray-200 dark:border-gray-700'
          ]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('request.type', { type: unit.bloodType }) }}
                </span>
                <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[unit.status].class]">
                  {{ statusConfig[unit.status].label }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ unit.provider }}</p>
              <!-- Volume and Product Type -->
              <div v-if="unit.volume || unit.productType" class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span v-if="unit.volume" class="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {{ unit.volume }}ml
                </span>
                <span v-if="unit.productType" class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {{ unit.productType === 'whole blood' ? $t('request.productTypes.wholeBlood') : $t('request.productTypes.packedRedBloodCells') }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500 flex-nowrap">
                <span class="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
                  {{ unit.distance }}{{ $t('common.km') }}
                </span>
                <span v-if="unit.expiresIn" class="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                  {{ $t('request.expiresIn', { days: unit.expiresIn }) }}
                </span>
                <span class="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Icon name="heroicons:beaker" class="w-3.5 h-3.5" />
                  {{ unit.units }} {{ $t('common.units', unit.units) }}
                </span>
              </div>
            </div>
            <button
              v-if="unit.status === 'available'"
              type="button"
              class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
            >
              {{ $t('common.contact') }}
            </button>
            <button
              v-else
              type="button"
              disabled
              class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            >
              {{ $t('common.unavailable') }}
            </button>
          </div>
        </div>

        <div v-if="matchingBloodUnits.length === 0" class="text-center py-12">
          <Icon name="heroicons:beaker" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">{{ $t('request.noBloodUnits') }}</p>
        </div>
      </div>

      <!-- Donors List -->
      <div v-if="activeTab === 'donors'" class="space-y-3">
        <div
          v-for="donor in matchingDonors"
          :key="donor.id"
          :class="[
            'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all',
            donor.isAvailable && donor.isVerified
              ? 'border-green-200 dark:border-green-800/50'
              : donor.isAvailable
                ? 'border-orange-200 dark:border-orange-800/50'
                : 'border-gray-200 dark:border-gray-700'
          ]"
        >
          <div class="flex justify-between gap-3">
            <!-- Left Column: Avatar + Info -->
            <div class="flex-1 min-w-0">
              <!-- Row 1: Avatar + Name/Blood Type -->
              <div class="flex items-start gap-3 mb-2">
                <div :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0',
                  donor.isAvailable
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                ]">
                  {{ requestType === 'cat' ? '🐱' : '🐶' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-semibold text-gray-900 dark:text-white truncate">{{ donor.petName }}</span>
                    <span v-if="donor.isVerified" class="text-blue-500 shrink-0" title="Verified donor">
                      <Icon name="heroicons:check-badge" class="w-4 h-4" />
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ $t('request.type', { type: donor.bloodType }) }}
                  </p>
                </div>
              </div>
              <!-- Row 2: Info labels -->
              <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 flex-nowrap">
                <span class="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
                  {{ donor.distance }}{{ $t('common.km') }}
                </span>
                <span v-if="donor.lastDonation" class="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Icon name="heroicons:calendar" class="w-3.5 h-3.5" />
                  {{ $t('request.lastDonation', { date: new Date(donor.lastDonation).toLocaleDateString() }) }}
                </span>
              </div>
            </div>

            <!-- Right Column: Badge + Button -->
            <div class="flex flex-col items-end gap-2 shrink-0">
              <span v-if="donor.isAvailable" class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                {{ $t('common.available') }}
              </span>
              <span v-else class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 whitespace-nowrap">
                {{ $t('common.unavailable') }}
              </span>
              <button
                v-if="donor.isAvailable"
                type="button"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                {{ $t('common.contact') }}
              </button>
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

        <div v-if="matchingDonors.length === 0" class="text-center py-12">
          <Icon name="heroicons:heart" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">{{ $t('request.noDonors') }}</p>
        </div>
      </div>
    </div>
    </template>

    <!-- Bottom Action -->
    <div class="fixed bottom-20 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 pb-safe md:left-24 md:right-24 lg:left-48 lg:right-48 z-40">
      <!-- Active Request Status -->
      <div v-if="requestStatus === 'active'" class="space-y-3">
        <!-- Status with countdown -->
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

        <!-- Action buttons -->
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
    </template>

    <!-- NO ACTIVE REQUEST: Show empty state -->
    <template v-else-if="viewMode === 'requester' && !hasActiveBloodRequest">
      <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="text-center">
          <Icon name="heroicons:megaphone" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 class="font-medium text-gray-900 dark:text-white mb-1">
            {{ $t('request.noActiveRequest') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
            {{ $t('request.noActiveRequestDesc') }}
          </p>
          <NuxtLink
            to="/sos"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          >
            <Icon name="heroicons:exclamation-triangle" class="w-4 h-4" />
            {{ $t('home.sendSOS') }}
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Bottom Navigation -->
    <BottomNav />
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
