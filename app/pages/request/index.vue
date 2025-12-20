<script setup lang="ts">
// Types
type BloodUnitStatus = 'available' | 'reserved' | 'pending' | 'expired'
type AnimalType = 'cat' | 'dog'

interface BloodUnit {
  id: string
  animalType: AnimalType
  bloodType: string
  status: BloodUnitStatus
  provider: string
  distance: number // km
  expiresIn?: number // days
  units: number
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
    units: 2
  },
  {
    id: '2',
    animalType: 'cat',
    bloodType: 'A',
    status: 'available',
    provider: 'Pet Emergency Center',
    distance: 28,
    expiresIn: 14,
    units: 1
  },
  {
    id: '3',
    animalType: 'cat',
    bloodType: 'B',
    status: 'reserved',
    provider: 'Animal Care Hospital',
    distance: 35,
    expiresIn: 7,
    units: 1
  },
  {
    id: '4',
    animalType: 'cat',
    bloodType: 'AB',
    status: 'pending',
    provider: 'University Vet Clinic',
    distance: 45,
    units: 1
  },
  {
    id: '5',
    animalType: 'dog',
    bloodType: 'DEA 1.1+',
    status: 'available',
    provider: 'Central Veterinary Blood Bank',
    distance: 12,
    expiresIn: 28,
    units: 3
  },
  {
    id: '6',
    animalType: 'dog',
    bloodType: 'DEA 1.1-',
    status: 'available',
    provider: 'Metro Animal Hospital',
    distance: 18,
    expiresIn: 10,
    units: 2
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
const statusConfig = {
  available: { label: 'Available', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  reserved: { label: 'Reserved', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Pending', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  expired: { label: 'Expired', class: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' }
}

// Get route query params
const route = useRoute()
const requestType = computed<AnimalType>(() => (route.query.type as AnimalType) || 'cat')
const requestBloodType = computed(() => (route.query.bloodType as string) || 'A')
const patientName = computed(() => (route.query.patient as string) || 'Your pet')

// Active tab
const activeTab = ref<'units' | 'donors'>('units')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 pt-safe">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">Blood Request</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            For {{ patientName }} ({{ requestType === 'cat' ? 'Cat' : 'Dog' }} - Type {{ requestBloodType }})
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span class="text-sm font-medium text-red-600 dark:text-red-400">Active</span>
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
              <p class="text-xs text-gray-500 dark:text-gray-400">Blood units</p>
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
              <p class="text-xs text-gray-500 dark:text-gray-400">Donors nearby</p>
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
          Blood Units
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
          Donors
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-4 py-4 overflow-y-auto pb-safe">
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
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-gray-900 dark:text-white">
                  Type {{ unit.bloodType }}
                </span>
                <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[unit.status].class]">
                  {{ statusConfig[unit.status].label }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ unit.provider }}</p>
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
                  {{ unit.distance }} km
                </span>
                <span v-if="unit.expiresIn" class="flex items-center gap-1">
                  <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                  Expires in {{ unit.expiresIn }}d
                </span>
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:beaker" class="w-3.5 h-3.5" />
                  {{ unit.units }} unit{{ unit.units > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <button
              v-if="unit.status === 'available'"
              type="button"
              class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
            >
              Contact
            </button>
            <button
              v-else
              type="button"
              disabled
              class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            >
              Unavailable
            </button>
          </div>
        </div>

        <div v-if="matchingBloodUnits.length === 0" class="text-center py-12">
          <Icon name="heroicons:beaker" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">No blood units found nearby</p>
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
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div :class="[
                'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                donor.isAvailable
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              ]">
                {{ requestType === 'cat' ? '🐱' : '🐶' }}
              </div>
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="font-semibold text-gray-900 dark:text-white">{{ donor.petName }}</span>
                  <span v-if="donor.isVerified" class="text-blue-500" title="Verified donor">
                    <Icon name="heroicons:check-badge" class="w-4 h-4" />
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Type {{ donor.bloodType }}
                </p>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
                    {{ donor.distance }} km
                  </span>
                  <span v-if="donor.lastDonation" class="flex items-center gap-1">
                    <Icon name="heroicons:calendar" class="w-3.5 h-3.5" />
                    Last: {{ new Date(donor.lastDonation).toLocaleDateString() }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span v-if="donor.isAvailable" class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Available
              </span>
              <span v-else class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500">
                Unavailable
              </span>
              <button
                v-if="donor.isAvailable"
                type="button"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                Contact
              </button>
            </div>
          </div>
        </div>

        <div v-if="matchingDonors.length === 0" class="text-center py-12">
          <Icon name="heroicons:heart" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">No donors found nearby</p>
        </div>
      </div>
    </div>

    <!-- Bottom Action -->
    <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 pb-safe">
      <button
        type="button"
        class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
      >
        <Icon name="heroicons:megaphone" class="w-5 h-5" />
        Broadcast Emergency Request
      </button>
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
