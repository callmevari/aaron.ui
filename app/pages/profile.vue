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
  isRequesting: false,
  // Subscription preferences (for blood seekers: what they want to be notified about)
  subscriptions: {
    bloodUnitsAvailable: true, // Notify when matching blood units are available
    donorsAvailable: true      // Notify when matching donors are available
  }
})

// Get patient name from form
const patientName = computed(() => {
  if (animalType.value === 'cat') return catBloodForm.patientName
  if (animalType.value === 'dog') return dogBloodForm.patientName
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
      const { PushNotifications } = await import('@capacitor/push-notifications')

      // Request permission (this triggers the native dialog)
      console.log('📱 Requesting push notification permission...')
      const permStatus = await PushNotifications.requestPermissions()
      console.log('📱 Permission result:', permStatus.receive)

      if (permStatus.receive === 'granted') {
        // Register for push notifications after permission granted
        console.log('📱 Registering for push notifications...')
        await PushNotifications.register()
        notificationState.permissionStatus = 'granted'
        console.log('✅ Push notification permission granted and registered')
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

// Location radius (default 100km)
const searchRadius = ref(100)

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

const requestLocation = async () => {
  userLocation.isLoading = true
  userLocation.error = ''

  if (!navigator.geolocation) {
    userLocation.error = 'Geolocation is not supported. Please enter your location manually.'
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
      userLocation.error = 'Location permission denied. Please enter your location manually.'
    } else if (error.code === 2) {
      userLocation.error = 'Location unavailable. Please enter your location manually.'
    } else if (error.code === 3) {
      userLocation.error = 'Location request timed out. Please try again or enter manually.'
    } else {
      userLocation.error = 'Could not get your location. Please enter it manually.'
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
      userLocation.error = 'Location not found. Try a different search.'
    }
  } catch (error) {
    userLocation.error = 'Search failed. Please try again.'
  }
  userLocation.isLoading = false
}

const confirmLocation = () => {
  // Save location with default 100km radius and proceed to notifications
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
  async subscribeToNotifications(subscriptions: any, filters: any) {
    console.log('📱 Registering notification subscriptions...')
    console.log('Subscriptions:', subscriptions)
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
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Simulated notifications skipped (not on native platform)')
      return
    }

    const { LocalNotifications } = await import('@capacitor/local-notifications')

    const now = Date.now()

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title: `🩸 Blood units available nearby!`,
          body: `Good news! A blood bank within 15km has compatible blood for ${patientName}. Tap to view details.`,
          schedule: { at: new Date(now + 10000) }, // 10 seconds
          sound: 'default',
          extra: {
            type: 'BLOOD_UNIT_AVAILABLE',
            animalType: animalType
          }
        },
        {
          id: Math.floor(Math.random() * 100000),
          title: `${animalType === 'cat' ? '🐱' : '🐶'} Matching donors nearby!`,
          body: `Great news! 3 compatible donors are available within 20km and ready to help ${patientName}.`,
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

const finalSubmit = async () => {
  isSubmitting.value = true

  const form = animalType.value === 'cat' ? catBloodForm : dogBloodForm
  const filters = getSubscriptionFilters()

  try {
    // For blood request flow
    if (profileType.value === 'emergency' && emergencyType.value === 'blood') {
      // 1. Create the blood request (broadcasts to helpers: donors, vets, blood banks)
      const requestResult = await mockApi.createBloodRequest({
        animalType: animalType.value,
        bloodType: filters.bloodType,
        patientName: form.patientName,
        isHospitalized: form.isHospitalized,
        hospitalName: form.hospitalName,
        hospitalAddress: form.hospitalAddress,
        comment: form.comment,
        location: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: userLocation.address
        },
        radiusKm: filters.radiusKm
      })

      console.log(`✅ Blood request created. Notified ${requestResult.notifiedHelpers} potential helpers.`)

      // 2. Subscribe this user to receive notifications about available blood/donors
      if (notificationState.permissionStatus === 'granted') {
        await mockApi.subscribeToNotifications(notificationState.subscriptions, filters)
        console.log('✅ Subscribed to blood availability notifications')

        // 3. Schedule simulated notifications for testing (10s and 15s delay)
        await scheduleSimulatedNotifications(form.patientName, animalType.value || 'pet')
      }

      // Navigate to request results
      navigateTo({
        path: '/request',
        query: {
          type: animalType.value,
          bloodType: form.bloodType,
          patient: form.patientName
        }
      })
    } else {
      // Other flows - go to home for now
      navigateTo('/')
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
  } else if (step.value === 'location-modal') {
    step.value = animalType.value === 'cat' ? 'blood-cat-form' : 'blood-dog-form'
  } else if (step.value === 'location-confirm') {
    step.value = 'location-modal'
  } else if (step.value === 'notifications') {
    step.value = 'location-confirm'
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
    case 'location-modal': return 'Location needed'
    case 'location-confirm': return 'Confirm your location'
    case 'notifications': return 'Stay connected'
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

          <!-- Step: Location Modal -->
          <div v-else-if="step === 'location-modal'" key="location-modal" class="flex flex-col items-center text-center space-y-6">
            <div class="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Icon name="heroicons:map-pin" class="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>

            <div class="space-y-3">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                We need your location
              </h2>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                To match your request with nearby donors and blood banks, we need to know your location. This helps us find help as quickly as possible.
              </p>
            </div>

            <button
              type="button"
              @click="step = 'location-confirm'; requestLocation()"
              class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition"
            >
              Continue
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step: Location Confirm -->
          <div v-else-if="step === 'location-confirm'" key="location-confirm" class="space-y-4">
            <!-- Loading State -->
            <div v-if="userLocation.isLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
              <div class="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
              <p class="text-gray-600 dark:text-gray-400">Getting your location...</p>
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
                  Search a different location
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="mapSearchQuery"
                    type="text"
                    placeholder="Enter address or city"
                    @keyup.enter="searchLocation"
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
                Use my current location
              </button>

              <!-- Confirm Button -->
              <button
                type="button"
                @click="confirmLocation"
                class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition"
              >
                Confirm location
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
                Get notified instantly when blood becomes available for {{ patientName || 'your pet' }}.
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
                  Requesting permission...
                </template>
                <template v-else>
                  <Icon name="heroicons:bell" class="w-6 h-6" />
                  Enable notifications
                </template>
              </button>
              <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                We'll only notify you about matching blood availability.
              </p>
            </div>

            <!-- Permission Granted -->
            <div v-else-if="notificationState.permissionStatus === 'granted'" class="space-y-4">
              <!-- Success Badge -->
              <div class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
                <span class="text-sm font-medium text-green-700 dark:text-green-300">Notifications enabled</span>
              </div>

              <!-- Subscription Options -->
              <div class="space-y-3">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Notify me when:</p>

                <!-- Blood Units Available -->
                <label
                  :class="[
                    'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    notificationState.subscriptions.bloodUnitsAvailable
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  ]"
                >
                  <input
                    v-model="notificationState.subscriptions.bloodUnitsAvailable"
                    type="checkbox"
                    class="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
                  />
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-white">Blood units available</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Blood banks have matching blood in stock
                    </p>
                  </div>
                  <Icon name="heroicons:beaker" class="w-5 h-5 text-red-500" />
                </label>

                <!-- Donors Available -->
                <label
                  :class="[
                    'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    notificationState.subscriptions.donorsAvailable
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  ]"
                >
                  <input
                    v-model="notificationState.subscriptions.donorsAvailable"
                    type="checkbox"
                    class="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
                  />
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-white">Donors available</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Nearby donors ready to help
                    </p>
                  </div>
                  <Icon name="heroicons:heart" class="w-5 h-5 text-orange-500" />
                </label>
              </div>
            </div>

            <!-- Permission Denied -->
            <div v-else-if="notificationState.permissionStatus === 'denied'" class="space-y-4">
              <div class="flex items-start gap-3 py-3 px-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Notifications blocked</p>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Please enable notifications in your device settings to receive alerts when blood becomes available.
                  </p>
                </div>
              </div>
            </div>

            <!-- Unsupported -->
            <div v-else-if="notificationState.permissionStatus === 'unsupported'" class="space-y-4">
              <div class="flex items-start gap-3 py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Icon name="heroicons:information-circle" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Push notifications are not supported in this environment. You can still track your request in the app.
                </p>
              </div>
            </div>

            <!-- Info Message -->
            <div class="p-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div class="flex gap-3">
                <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your request will be sent to <span class="font-medium text-gray-900 dark:text-white">donors, veterinaries, and blood banks</span> within 100km of your location.
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
                Sending request...
              </template>
              <template v-else>
                Send blood request
                <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
              </template>
            </button>

            <p v-if="isSubmitting" class="text-center text-sm text-orange-600 dark:text-orange-400">
              Notifying donors and blood banks in your area...
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
