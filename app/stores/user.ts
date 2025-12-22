import { defineStore } from 'pinia'

export type UserRole = 'donor' | 'emergency' | 'vet' | 'blood_bank' | 'regular'
export type ProfileType = 'emergency' | 'donor' | 'vet' | 'regular' | null

export interface UserAuth {
  email: string
  firstName: string
  lastName: string
  phone: string
}

interface UserState {
  // Auth state
  isAuthenticated: boolean
  auth: UserAuth | null
  // Profile flow completion state
  isProfileComplete: boolean
  profileType: ProfileType
  // Legacy registration state
  isRegistered: boolean
  roles: UserRole[]
  location: {
    lat: number | null
    lng: number | null
    address: string
  } | null
}

// Storage key for persistence
const STORAGE_KEY = 'aaron_user_state'

// Load initial state from localStorage
const loadPersistedState = (): Partial<UserState> => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load user state from localStorage:', e)
  }
  return {}
}

// Save state to localStorage
const persistState = (state: UserState) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isAuthenticated: state.isAuthenticated,
      auth: state.auth,
      isProfileComplete: state.isProfileComplete,
      profileType: state.profileType,
      isRegistered: state.isRegistered,
      roles: state.roles,
      location: state.location
    }))
  } catch (e) {
    console.error('Failed to persist user state:', e)
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    const persisted = loadPersistedState()
    return {
      isAuthenticated: persisted.isAuthenticated ?? false,
      auth: persisted.auth ?? null,
      isProfileComplete: persisted.isProfileComplete ?? false,
      profileType: persisted.profileType ?? null,
      isRegistered: persisted.isRegistered ?? false,
      roles: persisted.roles ?? [],
      location: persisted.location ?? null
    }
  },

  getters: {
    isDonor: (state) => state.roles.includes('donor'),
    isVet: (state) => state.roles.includes('vet'),
    isBloodBank: (state) => state.roles.includes('blood_bank'),
    hasLocation: (state) => state.location !== null,
    userDisplayName: (state) => state.auth ? `${state.auth.firstName} ${state.auth.lastName}` : ''
  },

  actions: {
    // Sign up / create account
    signUp(authData: UserAuth) {
      this.isAuthenticated = true
      this.auth = authData
      persistState(this.$state)
    },

    // Complete profile flow
    completeProfileFlow(profileType: ProfileType) {
      this.isProfileComplete = true
      this.profileType = profileType
      persistState(this.$state)
    },

    completeRegistration(roles: UserRole[], location?: { lat: number; lng: number; address: string }) {
      this.isRegistered = true
      this.roles = roles
      if (location) {
        this.location = location
      }
      persistState(this.$state)
    },

    addRole(role: UserRole) {
      if (!this.roles.includes(role)) {
        this.roles.push(role)
      }
      persistState(this.$state)
    },

    setLocation(location: { lat: number; lng: number; address: string }) {
      this.location = location
      persistState(this.$state)
    },

    logout() {
      this.isAuthenticated = false
      this.auth = null
      this.isProfileComplete = false
      this.profileType = null
      this.isRegistered = false
      this.roles = []
      this.location = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }
})
