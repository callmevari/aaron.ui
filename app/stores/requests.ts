import { defineStore } from 'pinia'
import type { AnimalType, BloodType } from './pets'

export type RequestStatus = 'active' | 'expired' | 'resolved'
export type RequestType = 'blood' | 'vet'

export interface BloodRequest {
  id: string
  type: 'blood'
  petName: string
  species: AnimalType
  bloodType: BloodType
  status: RequestStatus
  isHospitalized: boolean
  hospitalName?: string
  hospitalAddress?: string
  additionalDetails?: string
  location: {
    lat: number
    lng: number
    address: string
  }
  createdAt: string
  expiresAt: string
  ownerId: string // 'me' for user's own requests
  distance?: number // km, for nearby requests
}

export interface VetRequest {
  id: string
  type: 'vet'
  species: AnimalType
  patientName: string
  description?: string
  status: RequestStatus
  location: {
    lat: number
    lng: number
    address: string
  }
  createdAt: string
  expiresAt: string
  ownerId: string
}

// Union type for any emergency request
export type EmergencyRequest = BloodRequest | VetRequest

export interface BloodUnit {
  id: string
  species: AnimalType
  bloodType: BloodType
  status: 'available' | 'reserved' | 'pending' | 'expired'
  provider: string
  distance: number
  expiresIn: number
  units: number
  volume?: number
  productType?: 'wholeBlood' | 'packedRedBloodCells'
}

export interface NearbyDonor {
  id: string
  petName: string
  species: AnimalType
  bloodType: BloodType
  distance: number
  lastDonation: string | null
  isAvailable: boolean
}

interface RequestsState {
  // User's own blood requests
  myBloodRequests: BloodRequest[]
  // User's own vet requests
  myVetRequests: VetRequest[]
  // Nearby requests that match user's donor pets
  nearbyRequests: BloodRequest[]
  // Blood units for user's active request
  bloodUnits: BloodUnit[]
  // Nearby donors for user's active request
  nearbyDonors: NearbyDonor[]
  isLoading: boolean
  hasNewNearbyRequest: boolean
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Storage key for persistence
const STORAGE_KEY = 'aaron_requests_state'

// Load initial state from localStorage
const loadPersistedState = (): Partial<RequestsState> => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load requests state from localStorage:', e)
  }
  return {}
}

// Save state to localStorage
const persistState = (state: RequestsState) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      myBloodRequests: state.myBloodRequests,
      myVetRequests: state.myVetRequests
    }))
  } catch (e) {
    console.error('Failed to persist requests state:', e)
  }
}

// Mock nearby requests data
const mockNearbyRequests: BloodRequest[] = [
  {
    id: 'nearby-1',
    type: 'blood',
    petName: 'Luna',
    species: 'dog',
    bloodType: 'DEA 1.1-',
    status: 'active',
    isHospitalized: true,
    hospitalName: 'Pet Emergency Center',
    hospitalAddress: 'Av. Santa Fe 1234',
    location: { lat: -34.59, lng: -58.41, address: 'Buenos Aires' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user-123',
    distance: 3.2
  },
  {
    id: 'nearby-2',
    type: 'blood',
    petName: 'Michi',
    species: 'cat',
    bloodType: 'A',
    status: 'active',
    isHospitalized: true,
    hospitalName: 'Veterinaria Central',
    location: { lat: -34.60, lng: -58.38, address: 'Buenos Aires' },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user-456',
    distance: 5.8
  },
  {
    id: 'nearby-3',
    type: 'blood',
    petName: 'Rocky',
    species: 'dog',
    bloodType: 'DEA 1.1+',
    status: 'active',
    isHospitalized: false,
    additionalDetails: 'Urgent surgery needed',
    location: { lat: -34.58, lng: -58.42, address: 'Buenos Aires' },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user-789',
    distance: 8.1
  }
]

// Helper to generate mock blood units based on request
const generateMockBloodUnits = (species: AnimalType, bloodType: BloodType): BloodUnit[] => {
  return [
    {
      id: '1',
      species,
      bloodType,
      status: 'available',
      provider: 'Central Blood Bank',
      distance: 12,
      expiresIn: 5,
      units: 2,
      volume: 450,
      productType: 'wholeBlood'
    },
    {
      id: '2',
      species,
      bloodType,
      status: 'available',
      provider: 'Pet Hospital Norte',
      distance: 25,
      expiresIn: 12,
      units: 1,
      volume: 250,
      productType: 'packedRedBloodCells'
    },
    {
      id: '3',
      species,
      bloodType,
      status: 'pending',
      provider: 'Veterinary Clinic Sur',
      distance: 18,
      expiresIn: 8,
      units: 1,
      volume: 300,
      productType: 'wholeBlood'
    }
  ]
}

// Helper to generate mock nearby donors based on request
const generateMockNearbyDonors = (species: AnimalType, bloodType: BloodType): NearbyDonor[] => {
  const dogNames = ['Thor', 'Buddy', 'Max', 'Rocky']
  const catNames = ['Luna', 'Michi', 'Whiskers', 'Felix']
  const names = species === 'cat' ? catNames : dogNames

  return [
    {
      id: '1',
      petName: names[0],
      species,
      bloodType,
      distance: 8,
      lastDonation: '2024-10-15',
      isAvailable: true
    },
    {
      id: '2',
      petName: names[1],
      species,
      bloodType,
      distance: 15,
      lastDonation: null,
      isAvailable: true
    },
    {
      id: '3',
      petName: names[2],
      species,
      bloodType,
      distance: 22,
      lastDonation: '2024-09-20',
      isAvailable: true
    }
  ]
}

export const useRequestsStore = defineStore('requests', {
  state: (): RequestsState => {
    const persisted = loadPersistedState()
    return {
      myBloodRequests: persisted.myBloodRequests ?? [],
      myVetRequests: persisted.myVetRequests ?? [],
      nearbyRequests: [],
      bloodUnits: [],
      nearbyDonors: [],
      isLoading: false,
      hasNewNearbyRequest: false
    }
  },

  getters: {
    // Active blood request (first one for backwards compatibility)
    activeBloodRequest: (state) => state.myBloodRequests.find(r => r.status === 'active'),
    hasActiveBloodRequest: (state) => state.myBloodRequests.some(r => r.status === 'active'),
    // All active blood requests (for vets with multiple)
    activeBloodRequests: (state) => state.myBloodRequests.filter(r => r.status === 'active'),
    activeBloodRequestCount: (state) => state.myBloodRequests.filter(r => r.status === 'active').length,

    // Active vet request
    activeVetRequest: (state) => state.myVetRequests.find(r => r.status === 'active'),
    hasActiveVetRequest: (state) => state.myVetRequests.some(r => r.status === 'active'),

    // Any active request (blood or vet)
    activeRequest: (state): EmergencyRequest | undefined => {
      const bloodReq = state.myBloodRequests.find(r => r.status === 'active')
      if (bloodReq) return bloodReq
      return state.myVetRequests.find(r => r.status === 'active')
    },
    hasActiveRequest: (state) => {
      return state.myBloodRequests.some(r => r.status === 'active') ||
             state.myVetRequests.some(r => r.status === 'active')
    },

    // Get nearby requests that match user's donor blood types
    matchingNearbyRequests: (state) => {
      return (donorBloodTypes: { species: AnimalType; bloodType: BloodType }[]) => {
        return state.nearbyRequests.filter(request => {
          return donorBloodTypes.some(
            donor => donor.species === request.species && donor.bloodType === request.bloodType
          )
        })
      }
    },

    nearbyRequestsCount: (state) => state.nearbyRequests.length
  },

  actions: {
    async fetchMyRequests() {
      this.isLoading = true
      await delay(300)
      // My requests are stored locally, nothing to fetch for mock
      this.isLoading = false
    },

    async fetchNearbyRequests(donorBloodTypes: { species: AnimalType; bloodType: BloodType }[]) {
      this.isLoading = true
      await delay(500)

      // Filter mock data based on matching blood types
      if (donorBloodTypes.length > 0) {
        this.nearbyRequests = mockNearbyRequests.filter(request => {
          return donorBloodTypes.some(
            donor => donor.species === request.species && donor.bloodType === request.bloodType
          )
        })

        // Simulate new request notification
        if (this.nearbyRequests.length > 0) {
          this.hasNewNearbyRequest = true
        }
      } else {
        this.nearbyRequests = []
      }

      this.isLoading = false
    },

    async fetchBloodUnitsAndDonors(species: AnimalType, bloodType: BloodType) {
      this.isLoading = true
      await delay(400)

      // Generate mock data matching the request's species and blood type
      this.bloodUnits = generateMockBloodUnits(species, bloodType)
      this.nearbyDonors = generateMockNearbyDonors(species, bloodType)

      this.isLoading = false
    },

    async createBloodRequest(requestData: Omit<BloodRequest, 'id' | 'createdAt' | 'expiresAt' | 'ownerId' | 'status'>) {
      this.isLoading = true
      await delay(600)

      const newRequest: BloodRequest = {
        ...requestData,
        id: crypto.randomUUID(),
        status: 'active',
        ownerId: 'me',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      this.myBloodRequests.push(newRequest)
      persistState(this.$state)

      // Also fetch blood units and donors for this request
      await this.fetchBloodUnitsAndDonors(requestData.species, requestData.bloodType)

      this.isLoading = false
      return newRequest
    },

    async createVetRequest(requestData: Omit<VetRequest, 'id' | 'createdAt' | 'expiresAt' | 'ownerId' | 'status'>) {
      this.isLoading = true
      await delay(600)

      const newRequest: VetRequest = {
        ...requestData,
        id: crypto.randomUUID(),
        status: 'active',
        ownerId: 'me',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      this.myVetRequests.push(newRequest)
      persistState(this.$state)

      this.isLoading = false
      return newRequest
    },

    async extendRequest(requestId: string) {
      // Check in blood requests first, then vet requests
      let request: BloodRequest | VetRequest | undefined = this.myBloodRequests.find(r => r.id === requestId)
      if (!request) {
        request = this.myVetRequests.find(r => r.id === requestId)
      }
      if (request) {
        await delay(300)
        request.expiresAt = new Date(
          new Date(request.expiresAt).getTime() + 24 * 60 * 60 * 1000
        ).toISOString()
        persistState(this.$state)
      }
    },

    async resolveRequest(requestId: string) {
      // Check in blood requests first, then vet requests
      let request: BloodRequest | VetRequest | undefined = this.myBloodRequests.find(r => r.id === requestId)
      if (!request) {
        request = this.myVetRequests.find(r => r.id === requestId)
      }
      if (request) {
        await delay(300)
        request.status = 'resolved'
        persistState(this.$state)
      }
    },

    clearNewRequestNotification() {
      this.hasNewNearbyRequest = false
    },

    // Hydrate state from localStorage (call on client-side mount)
    hydrate() {
      if (typeof window === 'undefined') return
      const persisted = loadPersistedState()
      if (persisted.myBloodRequests) {
        this.myBloodRequests = persisted.myBloodRequests
      }
      if (persisted.myVetRequests) {
        this.myVetRequests = persisted.myVetRequests
      }
    }
  }
})
