<script setup lang="ts">
import { useRequestsStore } from '~/stores/requests'
import { usePetsStore } from '~/stores/pets'
import { useUserStore } from '~/stores/user'
import type { BloodType, AnimalType as PetAnimalType } from '~/stores/pets'

const { t } = useI18n()
const router = useRouter()
const requestsStore = useRequestsStore()
const petsStore = usePetsStore()
const userStore = useUserStore()

// Redirect if profile is already complete
onMounted(() => {
  if (userStore.isProfileComplete) {
    router.replace('/home')
  }
})

type ProfileType = 'emergency' | 'donor' | 'vet' | 'regular'
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
  | 'vet-dog-form'
  | 'vet-cat-form'
  | 'donor-dog-form'
  | 'donor-cat-form'
  | 'location-modal'
  | 'location-confirm'
  | 'notifications'

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
  bloodType: '' as '' | 'A' | 'B' | 'AB' | 'unknown',
  hasBeenTyped: '' as '' | 'yes' | 'no' | 'unknown',
  whatHappened: ''
})

const vetCatFormValid = computed(() => {
  return vetCatForm.patientName.trim() &&
         vetCatForm.hasBeenTyped
})

// Vet emergency form - Dog
const vetDogForm = reactive({
  patientName: '',
  bloodType: '' as '' | 'dea-positive' | 'dea-negative' | 'other' | 'unknown',
  hasBeenTyped: '' as '' | 'yes' | 'no' | 'unknown',
  whatHappened: ''
})

const vetDogFormValid = computed(() => {
  return vetDogForm.patientName.trim() &&
         vetDogForm.hasBeenTyped
})

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

// Location state
const userLocation = reactive({
  latitude: -34.6037, // Default to Buenos Aires
  longitude: -58.3816,
  address: '',
  isLoading: false,
  error: ''
})

const mapSearchQuery = ref('')

// Notification state
const notificationState = reactive({
  permissionStatus: 'default' as NotificationPermission | 'unsupported',
  isRequesting: false
})

// Get patient/pet name from form
const patientName = computed(() => {
  if (profileType.value === 'donor') {
    if (animalType.value === 'cat') return donorCatForm.petName
    if (animalType.value === 'dog') return donorDogForm.petName
  } else if (emergencyType.value === 'blood') {
    if (animalType.value === 'cat') return catBloodForm.patientName
    if (animalType.value === 'dog') return dogBloodForm.patientName
  } else if (emergencyType.value === 'vet') {
    if (animalType.value === 'cat') return vetCatForm.patientName
    if (animalType.value === 'dog') return vetDogForm.patientName
  }
  return ''
})

// Build subscription filters based on flow data
const getSubscriptionFilters = () => {
  const form = animalType.value === 'cat' ? catBloodForm : dogBloodForm
  const bloodType = form.bloodType

  return {
    animalType: animalType.value,
    // Only include bloodType filter if user knows their pet's blood type
    bloodType: bloodType && bloodType !== 'unknown' ? bloodType : null,
    radiusKm: searchRadius.value
  }
}

// Request native notification permission
const requestNotificationPermission = async () => {
  notificationState.isRequesting = true

  try {
    // Check if we're on a native platform
    let isNative = false
    try {
      const { Capacitor } = await import('@capacitor/core')
      isNative = Capacitor.isNativePlatform()
    } catch {
      isNative = false
    }

    if (isNative) {
      // Native platform: use Capacitor Push Notifications
      // This triggers the native iOS/Android permission dialog
      const { Capacitor } = await import('@capacitor/core')
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const platform = Capacitor.getPlatform()

      // Request permission (this triggers the native dialog)
      console.log(`📱 [${platform}] Requesting push notification permission...`)
      const permStatus = await PushNotifications.requestPermissions()
      console.log(`📱 [${platform}] Permission result:`, permStatus.receive)

      if (permStatus.receive === 'granted') {
        // Register for push notifications after permission granted
        // NOTE: On Android, register() requires Firebase Cloud Messaging (FCM)
        // Without google-services.json, the native code crashes before JS can catch it
        // For development/testing, we skip FCM registration on Android
        if (platform === 'android') {
          // DEVELOPMENT MODE: Skip FCM registration (no Firebase configured)
          // TODO: For production, add google-services.json and uncomment the register() call
          // await PushNotifications.register()
          console.warn('⚠️ [Android] FCM registration skipped (Firebase not configured)')
          console.warn('⚠️ [Android] Add google-services.json to android/app/ for production push notifications')
          console.log('📱 [Android] Permission granted - using local notifications for testing')
        } else {
          // iOS - register normally (uses APNs, no Firebase needed)
          console.log('📱 [iOS] Registering for push notifications...')
          await PushNotifications.register()
          console.log('✅ [iOS] Push notification registration successful')
        }

        notificationState.permissionStatus = 'granted'
        console.log('✅ Push notification permission granted')
        return true
      } else {
        notificationState.permissionStatus = 'denied'
        console.log('❌ Push notification permission denied')
        return false
      }
    } else {
      // Web platform: use browser Notification API
      if (!('Notification' in window)) {
        notificationState.permissionStatus = 'unsupported'
        console.warn('Notifications not supported in this browser')
        return false
      }

      const permission = await Notification.requestPermission()
      notificationState.permissionStatus = permission

      if (permission === 'granted') {
        console.log('✅ Browser notification permission granted')
        return true
      } else {
        console.log('❌ Browser notification permission denied:', permission)
        return false
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    notificationState.permissionStatus = 'denied'
    return false
  } finally {
    notificationState.isRequesting = false
  }
}

// Location radius (default 200km)
const searchRadius = ref(200)

// Options for forms
const dogBloodTypeOptions = computed(() => [
  { value: 'dea-positive', label: t('bloodForm.dogBloodTypes.deaPositive') },
  { value: 'dea-negative', label: t('bloodForm.dogBloodTypes.deaNegative') },
  { value: 'other', label: t('bloodForm.dogBloodTypes.other') },
  { value: 'unknown', label: t('bloodForm.dogBloodTypes.unknown') }
])

const yesNoOptions = computed(() => [
  { value: 'yes', label: t('common.yes') },
  { value: 'no', label: t('common.no') },
  { value: 'unknown', label: t('common.unknown') }
])

// Donor blood type options (no 'unknown' - required for donors)
const donorDogBloodTypeOptions = computed(() => [
  { value: 'dea-positive', label: t('bloodForm.dogBloodTypes.deaPositive') },
  { value: 'dea-negative', label: t('bloodForm.dogBloodTypes.deaNegative') },
  { value: 'other', label: t('bloodForm.dogBloodTypes.other') }
])

const donorCatBloodTypeOptions = computed(() => [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'AB', label: 'AB' }
])

// Navigation
const selectProfile = (type: ProfileType) => {
  profileType.value = type
  if (type === 'emergency') {
    step.value = 'emergency-type'
  } else if (type === 'donor') {
    step.value = 'donor-animal'
  } else if (type === 'vet') {
    step.value = 'vet-type'
  } else if (type === 'regular') {
    // Regular user flow - go directly to location then home
    step.value = 'location-modal'
  }
}

const selectEmergencyType = (type: EmergencyType) => {
  emergencyType.value = type
  step.value = 'emergency-animal'
}

const selectAnimal = (type: AnimalType) => {
  animalType.value = type

  // Blood emergency flow - needs blood form first
  if (emergencyType.value === 'blood') {
    if (type === 'dog') {
      step.value = 'blood-dog-form'
    } else if (type === 'cat') {
      step.value = 'blood-cat-form'
    }
    return
  }

  // Vet emergency flow - needs vet form first
  if (emergencyType.value === 'vet') {
    if (type === 'dog') {
      step.value = 'vet-dog-form'
    } else if (type === 'cat') {
      step.value = 'vet-cat-form'
    }
    return
  }

  // Donor flow - needs donor form
  if (profileType.value === 'donor') {
    if (type === 'dog') {
      step.value = 'donor-dog-form'
    } else if (type === 'cat') {
      step.value = 'donor-cat-form'
    }
    return
  }

  // TODO: Navigate to next step or save profile
  console.log('Profile complete:', { profileType: profileType.value, emergencyType: emergencyType.value, animalType: type })
}

const submitCatBloodForm = () => {
  if (!catBloodFormValid.value) return
  console.log('Cat blood emergency data:', {
    profileType: profileType.value,
    emergencyType: emergencyType.value,
    animalType: animalType.value,
    ...catBloodForm
  })
  step.value = 'location-modal'
}

const submitDogBloodForm = () => {
  if (!dogBloodFormValid.value) return
  console.log('Dog blood emergency data:', {
    profileType: profileType.value,
    emergencyType: emergencyType.value,
    animalType: animalType.value,
    ...dogBloodForm
  })
  step.value = 'location-modal'
}

const submitVetCatForm = () => {
  if (!vetCatFormValid.value) return
  console.log('Vet cat emergency data:', {
    profileType: profileType.value,
    emergencyType: emergencyType.value,
    animalType: animalType.value,
    ...vetCatForm
  })
  step.value = 'location-modal'
}

const submitVetDogForm = () => {
  if (!vetDogFormValid.value) return
  console.log('Vet dog emergency data:', {
    profileType: profileType.value,
    emergencyType: emergencyType.value,
    animalType: animalType.value,
    ...vetDogForm
  })
  step.value = 'location-modal'
}

const submitDonorCatForm = () => {
  if (!donorCatFormValid.value) return
  console.log('Donor cat data:', {
    profileType: profileType.value,
    animalType: animalType.value,
    ...donorCatForm
  })
  step.value = 'location-modal'
}

const submitDonorDogForm = () => {
  if (!donorDogFormValid.value) return
  console.log('Donor dog data:', {
    profileType: profileType.value,
    animalType: animalType.value,
    ...donorDogForm
  })
  step.value = 'location-modal'
}

// Photo upload for donor forms
const handlePhotoUpload = async (event: Event, formType: 'cat' | 'dog') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Convert to base64 for now (in production, upload to storage)
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

const requestLocation = async () => {
  userLocation.isLoading = true
  userLocation.error = ''

  if (!navigator.geolocation) {
    userLocation.error = t('location.errors.notSupported')
    userLocation.isLoading = false
    return
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })

    userLocation.latitude = position.coords.latitude
    userLocation.longitude = position.coords.longitude
    await reverseGeocode(position.coords.latitude, position.coords.longitude)
  } catch (error: any) {
    console.error('Geolocation error:', error)
    if (error.code === 1) {
      userLocation.error = t('location.errors.denied')
    } else if (error.code === 2) {
      userLocation.error = t('location.errors.unavailable')
    } else if (error.code === 3) {
      userLocation.error = t('location.errors.timeout')
    } else {
      userLocation.error = t('location.errors.generic')
    }
  }

  userLocation.isLoading = false
}

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    // Using Nominatim (OpenStreetMap) for free reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } }
    )
    const data = await response.json()
    if (data.display_name) {
      userLocation.address = data.display_name
    }
  } catch (error) {
    console.error('Reverse geocode error:', error)
  }
}

const searchLocation = async () => {
  if (!mapSearchQuery.value.trim()) return

  userLocation.isLoading = true
  try {
    // Using Nominatim for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery.value)}&limit=1`,
      { headers: { 'Accept-Language': 'es' } }
    )
    const data = await response.json()
    if (data.length > 0) {
      userLocation.latitude = parseFloat(data[0].lat)
      userLocation.longitude = parseFloat(data[0].lon)
      userLocation.address = data[0].display_name
      userLocation.error = ''
    } else {
      userLocation.error = t('location.errors.notFound')
    }
  } catch (error) {
    userLocation.error = t('location.errors.searchFailed')
  }
  userLocation.isLoading = false
}

const confirmLocation = () => {
  // Save location with default 200km radius and proceed to notifications
  console.log('Location confirmed:', {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    address: userLocation.address,
    radiusKm: searchRadius.value
  })
  step.value = 'notifications'
}

// Submission state
const isSubmitting = ref(false)

// Mock API calls for the blood request flow
const mockApi = {
  // Create blood request and notify potential helpers (donors, vets, blood banks)
  async createBloodRequest(data: any) {
    const notificationType = data.animalType === 'cat' ? 'CAT_BLOOD_REQUEST' : 'DOG_BLOOD_REQUEST'

    console.log(`📤 Creating blood request...`)
    console.log(`🔔 Broadcasting ${notificationType} to helpers within ${data.radiusKm}km...`)
    console.log('Request payload:', {
      type: notificationType,
      notification: {
        title: data.animalType === 'cat' ? '🐱 Urgent: Cat Blood Needed' : '🐶 Urgent: Dog Blood Needed',
        body: `${data.patientName} needs ${data.bloodType || 'any'} blood type. ${data.radiusKm}km away.`
      },
      data: {
        requestId: crypto.randomUUID(),
        ...data,
        timestamp: new Date().toISOString()
      }
    })

    await new Promise(resolve => setTimeout(resolve, 800))
    return { success: true, requestId: crypto.randomUUID(), notifiedHelpers: Math.floor(Math.random() * 50) + 10 }
  },

  // Subscribe user to receive notifications about available blood/donors
  async subscribeToNotifications(filters: any) {
    console.log('📱 Registering notification subscriptions...')
    console.log('Filters:', filters)

    // In production: register with push notification service (FCM/APNs)
    // Topics to subscribe:
    // - BLOOD_UNIT_AVAILABLE_{animalType}_{bloodType?}
    // - DONOR_AVAILABLE_{animalType}_{bloodType?}

    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  }
}

// Schedule simulated notifications (for testing purposes)
const scheduleSimulatedNotifications = async (patientName: string, animalType: string) => {
  try {
    const { Capacitor } = await import('@capacitor/core')

    // Web fallback using Web Notifications API
    if (!Capacitor.isNativePlatform()) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const iconUrl = `${window.location.origin}/img/app-icon.png`

        setTimeout(() => {
          new Notification(`🩸 ${t('notifications.simulated.bloodUnitsTitle')}`, {
            body: t('notifications.simulated.bloodUnitsBody', { petName: patientName }),
            icon: iconUrl
          })
        }, 10000)

        setTimeout(() => {
          new Notification(`${animalType === 'cat' ? '🐱' : '🐶'} ${t('notifications.simulated.donorsTitle')}`, {
            body: t('notifications.simulated.donorsBody', { petName: patientName }),
            icon: iconUrl
          })
        }, 15000)
      }
      return
    }

    const { LocalNotifications } = await import('@capacitor/local-notifications')

    const now = Date.now()

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title: `🩸 ${t('notifications.simulated.bloodUnitsTitle')}`,
          body: t('notifications.simulated.bloodUnitsBody', { petName: patientName }),
          schedule: { at: new Date(now + 10000) }, // 10 seconds
          sound: 'default',
          extra: {
            type: 'BLOOD_UNIT_AVAILABLE',
            animalType: animalType
          }
        },
        {
          id: Math.floor(Math.random() * 100000),
          title: `${animalType === 'cat' ? '🐱' : '🐶'} ${t('notifications.simulated.donorsTitle')}`,
          body: t('notifications.simulated.donorsBody', { petName: patientName }),
          schedule: { at: new Date(now + 15000) }, // 15 seconds (5 seconds after first)
          sound: 'default',
          extra: {
            type: 'DONOR_AVAILABLE',
            animalType: animalType
          }
        }
      ]
    })

    console.log('📱 Simulated notifications scheduled: 10s (blood units) and 15s (donors)')
  } catch (error) {
    console.error('Failed to schedule simulated notifications:', error)
  }
}

// Convert form blood type values to display format
const formatBloodTypeForStorage = (bloodType: string, species: string): BloodType => {
  if (species === 'dog') {
    const dogTypeMap: Record<string, BloodType> = {
      'dea-positive': 'DEA 1.1+',
      'dea-negative': 'DEA 1.1-',
      'other': 'Unknown'
    }
    return dogTypeMap[bloodType] || bloodType as BloodType
  }
  // Cat blood types are already correct (A, B, AB)
  return bloodType as BloodType
}

const finalSubmit = async () => {
  isSubmitting.value = true

  const form = animalType.value === 'cat' ? catBloodForm : dogBloodForm
  const filters = getSubscriptionFilters()

  try {
    // For blood request flow
    if (profileType.value === 'emergency' && emergencyType.value === 'blood') {
      // 1. Create the blood request in the store
      const species = animalType.value as PetAnimalType
      const bloodType = form.bloodType as BloodType

      await requestsStore.createBloodRequest({
        type: 'blood',
        petName: form.patientName,
        species,
        bloodType,
        isHospitalized: form.isHospitalized === 'yes',
        hospitalName: form.hospitalName || undefined,
        hospitalAddress: form.hospitalAddress || undefined,
        additionalDetails: form.comment || undefined,
        location: {
          lat: userLocation.latitude || 0,
          lng: userLocation.longitude || 0,
          address: userLocation.address || ''
        }
      })

      console.log('✅ Blood request created in store')

      // 2. Subscribe this user to receive notifications about available blood/donors
      if (notificationState.permissionStatus === 'granted') {
        await mockApi.subscribeToNotifications(filters)
        console.log('✅ Subscribed to blood availability notifications')

        // 3. Schedule simulated notifications for testing (10s and 15s delay)
        await scheduleSimulatedNotifications(form.patientName, animalType.value || 'pet')
      }

      // Mark profile flow as complete
      userStore.completeProfileFlow('emergency')

      // Navigate to request results
      navigateTo('/request')
    } else if (profileType.value === 'emergency' && emergencyType.value === 'vet') {
      // Vet emergency flow - create vet request in store
      const vetForm = animalType.value === 'cat' ? vetCatForm : vetDogForm
      const species = animalType.value as PetAnimalType

      await requestsStore.createVetRequest({
        type: 'vet',
        species,
        description: vetForm.whatHappened || undefined,
        location: {
          lat: userLocation.latitude || 0,
          lng: userLocation.longitude || 0,
          address: userLocation.address || ''
        }
      })

      console.log('✅ Vet request created in store')

      // Mark profile flow as complete
      userStore.completeProfileFlow('emergency')

      // Navigate to vet request results
      navigateTo({
        path: '/request/vet',
        query: {
          type: animalType.value
        }
      })
    } else if (profileType.value === 'donor') {
      // Donor registration flow - use petsStore
      const isDog = animalType.value === 'dog'
      const donorForm = isDog ? donorDogForm : donorCatForm
      const species = animalType.value as PetAnimalType
      const formattedBloodType = formatBloodTypeForStorage(donorForm.bloodType, species)

      await petsStore.registerDonor({
        name: donorForm.petName,
        species,
        photoUrl: '',
        ageYears: donorForm.ageYears || 3,
        weightKg: donorForm.weightKg || 25,
        bloodType: formattedBloodType
      })

      console.log('✅ Donor registered in store')

      // Mark profile flow as complete
      userStore.completeProfileFlow('donor')

      // Navigate to home with registration success info
      navigateTo({
        path: '/home',
        query: {
          registered: 'true',
          petName: donorForm.petName,
          species: animalType.value,
          bloodType: formattedBloodType
        }
      })
    } else if (profileType.value === 'regular') {
      // Regular user flow - just go to home
      console.log('👤 Regular user registration complete')
      console.log('📍 Location:', userLocation.address)

      // Mark profile flow as complete
      userStore.completeProfileFlow('regular')

      navigateTo('/home')
    } else {
      // Other flows - go to home for now
      userStore.completeProfileFlow(profileType.value)
      navigateTo('/home')
    }
  } catch (error) {
    console.error('Submission failed:', error)
  } finally {
    isSubmitting.value = false
  }
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
  } else if (step.value === 'vet-dog-form' || step.value === 'vet-cat-form') {
    step.value = 'emergency-animal'
    animalType.value = null
  } else if (step.value === 'donor-dog-form' || step.value === 'donor-cat-form') {
    step.value = 'donor-animal'
    animalType.value = null
  } else if (step.value === 'location-modal') {
    // Go back to the appropriate form based on flow type
    if (profileType.value === 'regular') {
      step.value = 'profile'
      profileType.value = null
    } else if (profileType.value === 'donor') {
      step.value = animalType.value === 'cat' ? 'donor-cat-form' : 'donor-dog-form'
    } else if (emergencyType.value === 'blood') {
      step.value = animalType.value === 'cat' ? 'blood-cat-form' : 'blood-dog-form'
    } else if (emergencyType.value === 'vet') {
      step.value = animalType.value === 'cat' ? 'vet-cat-form' : 'vet-dog-form'
    }
  } else if (step.value === 'location-confirm') {
    step.value = 'location-modal'
  } else if (step.value === 'notifications') {
    step.value = 'location-confirm'
  }
}

const canGoBack = computed(() => step.value !== 'profile')

const stepTitle = computed(() => {
  switch (step.value) {
    case 'profile': return t('profile.title.profile')
    case 'emergency-type': return t('profile.title.emergencyType')
    case 'emergency-animal': return t('profile.title.emergencyAnimal')
    case 'donor-animal': return t('profile.title.donorAnimal')
    case 'vet-type': return t('profile.title.vetType')
    case 'blood-dog-form': return t('profile.title.bloodDogForm')
    case 'blood-cat-form': return t('profile.title.bloodCatForm')
    case 'vet-dog-form': return t('profile.title.vetDogForm')
    case 'vet-cat-form': return t('profile.title.vetCatForm')
    case 'donor-dog-form': return t('donor.title.dogForm')
    case 'donor-cat-form': return t('donor.title.catForm')
    case 'location-modal': return t('profile.title.locationModal')
    case 'location-confirm': return t('profile.title.locationConfirm')
    case 'notifications': return t('profile.title.notifications')
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
                <p class="text-base font-semibold text-red-700 dark:text-red-300">{{ $t('profile.emergency.title') }}</p>
                <p class="text-sm text-red-600/70 dark:text-red-400/70">{{ $t('profile.emergency.subtitle') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.donor.title') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profile.donor.subtitle') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.vet.title') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profile.vet.subtitle') }}</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <!-- Regular User -->
            <div class="text-center pt-2">
              <button
                type="button"
                @click="selectProfile('regular')"
                class="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 underline underline-offset-2 transition-colors"
              >
                {{ $t('profile.regular.title') }}
              </button>
            </div>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.needBlood.title') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profile.needBlood.subtitle') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.needVet.title') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profile.needVet.subtitle') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.animal.cat') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.animal.dog') }}</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>

            <!-- Only show "Other" for vet emergencies - DISABLED -->
            <div
              v-if="emergencyType === 'vet'"
              class="w-full p-5 flex items-center gap-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed"
            >
              <div class="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl">
                🦜
              </div>
              <div class="flex-1 text-left">
                <p class="text-base font-semibold text-gray-500 dark:text-gray-400">{{ $t('profile.animal.other') }}</p>
                <p class="text-sm text-gray-400 dark:text-gray-500">{{ $t('profile.animal.otherSubtitle') }}</p>
              </div>
              <span class="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {{ $t('common.comingSoon') }}
              </span>
            </div>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.animal.cat') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.animal.dog') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.vetType.veterinary') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profile.vetType.veterinarySubtitle') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.vetType.bloodBank') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profile.vetType.bloodBankSubtitle') }}</p>
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
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $t('profile.vetType.both') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('profile.vetType.bothSubtitle') }}</p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <!-- Step: Blood Dog Form -->
          <div v-else-if="step === 'blood-dog-form'" key="blood-dog-form" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="dogBloodForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholderDog')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.bloodType') }}
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
                {{ $t('bloodForm.hasBeenTyped', { animal: $t('animals.dog').toLowerCase() }) }}
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
                  {{ $t('bloodForm.hospitalName') }} <span class="text-gray-400">({{ $t('common.optional') }})</span>
                </label>
                <input
                  v-model="dogBloodForm.hospitalName"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalNamePlaceholder')"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-form-type="other"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('bloodForm.hospitalAddress') }} <span class="text-gray-400">({{ $t('common.optional') }})</span>
                </label>
                <input
                  v-model="dogBloodForm.hospitalAddress"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalAddressPlaceholder')"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-form-type="other"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <!-- Comment -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.additionalDetails') }} <span class="text-gray-400">({{ $t('common.optional') }})</span>
              </label>
              <textarea
                v-model="dogBloodForm.comment"
                rows="3"
                :placeholder="$t('bloodForm.additionalDetailsPlaceholder')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @mousedown.prevent="submitDogBloodForm"
              @touchend.prevent="submitDogBloodForm"
              :disabled="!dogBloodFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('bloodForm.findNearbyHelp') }}
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Blood Cat Form -->
          <div v-else-if="step === 'blood-cat-form'" key="blood-cat-form" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="catBloodForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholderCat')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.bloodType') }}
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
                  {{ type === 'unknown' ? $t('common.unknown') : type }}
                </button>
              </div>
            </div>

            <!-- Has Been Typed -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.hasBeenTyped', { animal: $t('animals.cat').toLowerCase() }) }}
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
                  {{ $t('bloodForm.hospitalName') }} <span class="text-gray-400">({{ $t('common.optional') }})</span>
                </label>
                <input
                  v-model="catBloodForm.hospitalName"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalNamePlaceholder')"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-form-type="other"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('bloodForm.hospitalAddress') }} <span class="text-gray-400">({{ $t('common.optional') }})</span>
                </label>
                <input
                  v-model="catBloodForm.hospitalAddress"
                  type="text"
                  :placeholder="$t('bloodForm.hospitalAddressPlaceholder')"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-form-type="other"
                  class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <!-- Comment -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.additionalDetails') }} <span class="text-gray-400">({{ $t('common.optional') }})</span>
              </label>
              <textarea
                v-model="catBloodForm.comment"
                rows="3"
                :placeholder="$t('bloodForm.additionalDetailsPlaceholder')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @mousedown.prevent="submitCatBloodForm"
              @touchend.prevent="submitCatBloodForm"
              :disabled="!catBloodFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('bloodForm.findNearbyHelp') }}
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Vet Dog Form -->
          <div v-else-if="step === 'vet-dog-form'" key="vet-dog-form" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="vetDogForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholderDog')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Has Been Blood Typed -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.hasBeenTyped', { animal: $t('animals.dog').toLowerCase() }) }}
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="vetDogForm.hasBeenTyped = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    vetDogForm.hasBeenTyped === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.bloodType') }}
              </label>
              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="option in dogBloodTypeOptions"
                  :key="option.value"
                  type="button"
                  @click="vetDogForm.bloodType = option.value"
                  :class="[
                    'py-3 px-4 text-sm font-medium rounded-lg border-2 transition-all text-left',
                    vetDogForm.bloodType === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
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
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @mousedown.prevent="submitVetDogForm"
              @touchend.prevent="submitVetDogForm"
              :disabled="!vetDogFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('vetForm.findNearbyVet') }}
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Vet Cat Form -->
          <div v-else-if="step === 'vet-cat-form'" key="vet-cat-form" class="space-y-5">
            <!-- Patient Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.patientName') }}
              </label>
              <input
                v-model="vetCatForm.patientName"
                type="text"
                :placeholder="$t('bloodForm.patientNamePlaceholderCat')"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <!-- Has Been Blood Typed -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.hasBeenTyped', { animal: $t('animals.cat').toLowerCase() }) }}
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in yesNoOptions"
                  :key="option.value"
                  type="button"
                  @click="vetCatForm.hasBeenTyped = option.value"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    vetCatForm.hasBeenTyped === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Blood Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('bloodForm.bloodType') }}
              </label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="type in ['A', 'B', 'AB', 'unknown'] as const"
                  :key="type"
                  type="button"
                  @click="vetCatForm.bloodType = type"
                  :class="[
                    'py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all',
                    vetCatForm.bloodType === type
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  {{ type === 'unknown' ? $t('common.unknown') : type }}
                </button>
              </div>
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
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                class="py-3 px-4 block w-full border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500 resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @mousedown.prevent="submitVetCatForm"
              @touchend.prevent="submitVetCatForm"
              :disabled="!vetCatFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('vetForm.findNearbyVet') }}
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Donor Dog Form -->
          <div v-else-if="step === 'donor-dog-form'" key="donor-dog-form" class="space-y-5">
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

            <!-- Blood Type (Required) -->
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

            <!-- Tipified By (shown if isTipified is yes) -->
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
              @mousedown.prevent="submitDonorDogForm"
              @touchend.prevent="submitDonorDogForm"
              :disabled="!donorDogFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('common.continue') }}
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Donor Cat Form -->
          <div v-else-if="step === 'donor-cat-form'" key="donor-cat-form" class="space-y-5">
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

            <!-- Blood Type (Required) -->
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

            <!-- Tipified By (shown if isTipified is yes) -->
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
              @mousedown.prevent="submitDonorCatForm"
              @touchend.prevent="submitDonorCatForm"
              :disabled="!donorCatFormValid"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('common.continue') }}
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Location Modal -->
          <div v-else-if="step === 'location-modal'" key="location-modal" class="flex flex-col items-center text-center space-y-6">
            <div class="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Icon name="heroicons:map-pin" class="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>

            <div class="space-y-3">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ $t('location.title') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ profileType === 'regular'
                  ? $t('location.regularDescription')
                  : profileType === 'donor'
                    ? $t('location.donorDescription')
                    : emergencyType === 'vet'
                      ? $t('location.vetDescription')
                      : $t('location.description')
                }}
              </p>
            </div>

            <button
              type="button"
              @click="step = 'location-confirm'; requestLocation()"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition"
            >
              {{ $t('common.continue') }}
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Location Confirm -->
          <div v-else-if="step === 'location-confirm'" key="location-confirm" class="space-y-4">
            <!-- Loading State -->
            <div v-if="userLocation.isLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
              <div class="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
              <p class="text-gray-600 dark:text-gray-400">{{ $t('location.gettingLocation') }}</p>
            </div>

            <!-- Map and Location Info -->
            <template v-else>
              <!-- Map Container -->
              <div class="relative w-full h-48 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                <iframe
                  :src="`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.longitude - 0.01},${userLocation.latitude - 0.01},${userLocation.longitude + 0.01},${userLocation.latitude + 0.01}&layer=mapnik&marker=${userLocation.latitude},${userLocation.longitude}`"
                  class="w-full h-full border-0"
                  loading="lazy"
                ></iframe>
                <a
                  :href="`https://www.openstreetmap.org/?mlat=${userLocation.latitude}&mlon=${userLocation.longitude}#map=16/${userLocation.latitude}/${userLocation.longitude}`"
                  target="_blank"
                  class="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <Icon name="heroicons:arrows-pointing-out" class="w-4 h-4" />
                </a>
              </div>

              <!-- Current Address -->
              <div v-if="userLocation.address" class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                <div class="flex items-start gap-3">
                  <Icon name="heroicons:map-pin" class="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {{ userLocation.address }}
                  </p>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="userLocation.error" class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div class="flex items-start gap-3">
                  <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <p class="text-sm text-red-700 dark:text-red-300">
                    {{ userLocation.error }}
                  </p>
                </div>
              </div>

              <!-- Search Location -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ $t('location.searchDifferent') }}
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="mapSearchQuery"
                    type="text"
                    :placeholder="$t('location.searchPlaceholder')"
                    @keyup.enter="searchLocation"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    data-form-type="other"
                    class="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    @click="searchLocation"
                    :disabled="userLocation.isLoading"
                    class="px-4 py-3 inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Retry Location Button -->
              <button
                type="button"
                @click="requestLocation"
                class="w-full py-2 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <Icon name="heroicons:arrow-path" class="w-4 h-4" />
                {{ $t('location.useCurrentLocation') }}
              </button>

              <!-- Confirm Button -->
              <button
                type="button"
                @click="confirmLocation"
                class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition"
              >
                {{ $t('location.confirmLocation') }}
                <Icon name="heroicons:check" class="w-4 h-4" />
              </button>
            </template>
          </div>

          <!-- Step: Notifications -->
          <div v-else-if="step === 'notifications'" key="notifications" class="space-y-6">
            <!-- Header Icon -->
            <div class="flex justify-center">
              <div class="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center">
                <Icon name="heroicons:bell-alert" class="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            <!-- Intro Text -->
            <div class="text-center space-y-2">
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ profileType === 'regular'
                  ? $t('regularNotifications.description')
                  : profileType === 'donor'
                    ? $t('donorNotifications.description', { petName: patientName || 'your pet' })
                    : emergencyType === 'vet'
                      ? $t('vetNotifications.description', { petName: patientName || 'your pet' })
                      : $t('notifications.description', { petName: patientName || 'your pet' })
                }}
              </p>
            </div>

            <!-- Permission Request Section -->
            <div v-if="notificationState.permissionStatus === 'default'" class="space-y-4">
              <button
                type="button"
                @click="requestNotificationPermission"
                :disabled="notificationState.isRequesting"
                class="w-full py-4 px-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium transition hover:bg-orange-100 dark:hover:bg-orange-900/30 disabled:opacity-50"
              >
                <template v-if="notificationState.isRequesting">
                  <div class="w-5 h-5 border-2 border-orange-400/30 border-t-orange-600 rounded-full animate-spin"></div>
                  {{ $t('notifications.requestingPermission') }}
                </template>
                <template v-else>
                  <Icon name="heroicons:bell" class="w-6 h-6" />
                  {{ $t('notifications.enableButton') }}
                </template>
              </button>
              <p v-if="emergencyType === 'blood' || profileType === 'donor'" class="text-center text-sm text-gray-500 dark:text-gray-400">
                {{ profileType === 'donor' ? $t('donorNotifications.emergencyDescription') : $t('notifications.onlyMatchingBlood') }}
              </p>
            </div>

            <!-- Permission Granted -->
            <div v-else-if="notificationState.permissionStatus === 'granted'" class="space-y-4">
              <!-- Success Badge -->
              <div class="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Icon name="heroicons:check-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
                <span class="text-base font-medium text-green-700 dark:text-green-300">{{ $t('notifications.enabled') }}</span>
              </div>

              <p class="text-sm text-center text-gray-500 dark:text-gray-400">
                {{ profileType === 'regular'
                  ? $t('regularNotifications.enabledDescription')
                  : profileType === 'donor'
                    ? $t('donorNotifications.enabledDescription')
                    : emergencyType === 'vet'
                      ? $t('vetNotifications.enabledDescription')
                      : $t('notifications.enabledDescription')
                }}
              </p>
            </div>

            <!-- Permission Denied -->
            <div v-else-if="notificationState.permissionStatus === 'denied'" class="space-y-4">
              <div class="flex items-start gap-3 py-3 px-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">{{ $t('notifications.blocked') }}</p>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {{ $t('notifications.blockedDescription') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Unsupported -->
            <div v-else-if="notificationState.permissionStatus === 'unsupported'" class="space-y-4">
              <div class="flex items-start gap-3 py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Icon name="heroicons:information-circle" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('notifications.unsupported') }}
                </p>
              </div>
            </div>

            <!-- Info Message (hide for donor flow when notifications are granted to avoid duplicate) -->
            <div
              v-if="!(profileType === 'donor' && notificationState.permissionStatus === 'granted')"
              class="p-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700"
            >
              <div class="flex gap-3">
                <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {{ profileType === 'regular'
                    ? $t('regularNotifications.infoMessage')
                    : profileType === 'donor'
                      ? $t('donorNotifications.infoMessage')
                      : emergencyType === 'vet'
                        ? $t('vetNotifications.infoMessage', { recipients: $t('vetNotifications.recipients') })
                        : $t('notifications.infoMessage', { recipients: $t('notifications.recipients') })
                  }}
                </p>
              </div>
            </div>

            <!-- Legend for vet flow -->
            <div v-if="emergencyType === 'vet'" class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div class="flex gap-3">
                <Icon name="heroicons:building-office-2" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  {{ $t('vetNotifications.legend') }}
                </p>
              </div>
            </div>

            <!-- Continue Button -->
            <button
              type="button"
              @click="finalSubmit"
              :disabled="isSubmitting"
              class="w-full py-3.5 px-4 inline-flex justify-center items-center gap-x-2 text-base font-semibold rounded-xl border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isSubmitting">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ $t('notifications.sendingRequest') }}
              </template>
              <template v-else>
                {{ profileType === 'regular' ? $t('regularNotifications.sendRequest') : profileType === 'donor' ? $t('donorNotifications.sendRequest') : emergencyType === 'vet' ? $t('vetNotifications.sendRequest') : $t('notifications.sendRequest') }}
                <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
              </template>
            </button>

            <p v-if="isSubmitting" class="text-center text-sm text-orange-600 dark:text-orange-400">
              {{ $t('notifications.notifyingArea') }}
            </p>

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

.emergency-pulse-icon {
  animation: pulse-icon 2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.2);
  }
}
</style>
