import { defineStore } from 'pinia'

export type AnimalType = 'dog' | 'cat'
export type DogBloodType = 'DEA 1.1+' | 'DEA 1.1-' | 'DEA 1.2+' | 'DEA 1.2-' | 'Unknown'
export type CatBloodType = 'A' | 'B' | 'AB' | 'Unknown'
export type BloodType = DogBloodType | CatBloodType

export interface Pet {
  id: string
  name: string
  species: AnimalType
  photoUrl: string
  ageYears: number
  weightKg: number
  bloodType: BloodType
  isDonor: boolean
  isDonorActive: boolean
  lastDonationDate: string | null
  createdAt: string
}

interface PetsState {
  pets: Pet[]
  isLoading: boolean
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const usePetsStore = defineStore('pets', {
  state: (): PetsState => ({
    pets: [],
    isLoading: false
  }),

  getters: {
    donorPets: (state) => state.pets.filter(p => p.isDonor),
    activeDonors: (state) => state.pets.filter(p => p.isDonor && p.isDonorActive),
    hasDonors: (state) => state.pets.some(p => p.isDonor),
    getPetById: (state) => (id: string) => state.pets.find(p => p.id === id),
    getDonorBloodTypes: (state) => {
      return state.pets
        .filter(p => p.isDonor && p.isDonorActive)
        .map(p => ({ species: p.species, bloodType: p.bloodType, petName: p.name }))
    }
  },

  actions: {
    async fetchPets() {
      this.isLoading = true
      await delay(300) // Simulate API call

      // For demo, return empty if no pets registered yet
      // Pets will be added via registerDonor
      this.isLoading = false
    },

    async registerDonor(petData: Omit<Pet, 'id' | 'createdAt' | 'isDonor' | 'isDonorActive' | 'lastDonationDate'>) {
      this.isLoading = true
      await delay(500) // Simulate API call

      const newPet: Pet = {
        ...petData,
        id: crypto.randomUUID(),
        isDonor: true,
        isDonorActive: true,
        lastDonationDate: null,
        createdAt: new Date().toISOString()
      }

      this.pets.push(newPet)
      this.isLoading = false
      return newPet
    },

    async toggleDonorAvailability(petId: string) {
      const pet = this.pets.find(p => p.id === petId)
      if (pet) {
        await delay(200)
        pet.isDonorActive = !pet.isDonorActive
      }
    },

    async removePet(petId: string) {
      await delay(300)
      this.pets = this.pets.filter(p => p.id !== petId)
    }
  }
})
