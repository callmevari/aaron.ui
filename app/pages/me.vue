<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useNotificationsStore } from '~/stores/notifications'

const { t } = useI18n()
const userStore = useUserStore()
const notificationsStore = useNotificationsStore()

// Initialize notifications store
onMounted(() => {
  notificationsStore.init()
})

// User data
const user = computed(() => userStore.auth)
const isVet = computed(() => userStore.isVet)
const isBloodBank = computed(() => userStore.isBloodBank)
const matricula = computed(() => userStore.matricula)
const needsEmailVerification = computed(() => !userStore.isEmailVerified)

// Edit mode
const isEditing = ref(false)
const editForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  photoUrl: '',
  matriculaNumero: '',
  matriculaCountry: '',
  matriculaCountryName: ''
})

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null)

// Initialize edit form with current values
const startEditing = () => {
  if (user.value) {
    editForm.firstName = user.value.firstName
    editForm.lastName = user.value.lastName
    editForm.email = user.value.email
    editForm.phone = user.value.phone
    editForm.photoUrl = user.value.photoUrl || ''
  }
  if (matricula.value) {
    editForm.matriculaNumero = matricula.value.numero
    editForm.matriculaCountry = matricula.value.country
    editForm.matriculaCountryName = matricula.value.countryName || ''
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveChanges = () => {
  userStore.updateProfile({
    firstName: editForm.firstName,
    lastName: editForm.lastName,
    email: editForm.email,
    phone: editForm.phone,
    photoUrl: editForm.photoUrl
  })
  // Update matricula if user is vet/blood bank
  if (isVet.value || isBloodBank.value) {
    userStore.setMatricula({
      numero: editForm.matriculaNumero,
      country: editForm.matriculaCountry,
      countryName: editForm.matriculaCountryName || undefined,
      documentPhotos: matricula.value?.documentPhotos || []
    })
  }
  isEditing.value = false
}

// Handle avatar upload
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // Convert to base64 for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // If not in edit mode, start editing first
      if (!isEditing.value) {
        startEditing()
      }
      // Then set the photo (after startEditing so it doesn't get overwritten)
      editForm.photoUrl = result
    }
    reader.readAsDataURL(file)
  }
}

// Computed for current avatar display
const currentAvatar = computed(() => {
  if (isEditing.value && editForm.photoUrl) {
    return editForm.photoUrl
  }
  return user.value?.photoUrl || ''
})

// Logout
const handleLogout = () => {
  userStore.logout()
  navigateTo('/signin')
}

// Country options
const countryOptions = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'PE', name: 'Perú' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'OTHER', name: 'Other' }
]

// Get country display name
const getCountryName = (code: string, customName?: string) => {
  if (code === 'OTHER' && customName) return customName
  const country = countryOptions.find(c => c.code === code)
  return country?.name || code
}

// Get user roles
const userRoles = computed(() => {
  const roles: string[] = []
  if (userStore.isDonor) roles.push('Donor')
  if (isVet.value) roles.push('Vet')
  if (isBloodBank.value) roles.push('Blood Bank')
  return roles
})
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900 pb-24">
    <!-- Hidden file input for avatar -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Simple Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 pt-safe">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('nav.profile') }}</h1>
    </div>

    <!-- Email Verification Banner -->
    <div
      v-if="needsEmailVerification"
      class="mx-4 mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="heroicons:exclamation-triangle" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span class="text-sm font-medium text-amber-800 dark:text-amber-200">
            {{ $t('emailVerification.bannerTitle') }}
          </span>
        </div>
        <button
          type="button"
          class="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
        >
          Resend email
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Profile Header -->
      <div class="mx-4 mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-5">
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div class="relative">
            <button
              type="button"
              @click="triggerFileInput"
              class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-semibold text-gray-600 dark:text-gray-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <img
                v-if="currentAvatar"
                :src="currentAvatar"
                alt="Avatar"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ user?.firstName?.charAt(0) || 'U' }}{{ user?.lastName?.charAt(0) || '' }}</span>
            </button>
            <button
              type="button"
              @click="triggerFileInput"
              class="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-sm"
            >
              <Icon name="heroicons:camera" class="w-3.5 h-3.5" />
            </button>
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {{ user?.firstName }} {{ user?.lastName }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
              {{ user?.email }}
            </p>
            <div v-if="userRoles.length > 0" class="flex flex-wrap gap-1.5 mt-1.5">
              <span
                v-for="role in userRoles"
                :key="role"
                class="px-2.5 py-0.5 text-xs font-medium rounded-full"
                :class="{
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': role === 'Donor',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': role === 'Vet',
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': role === 'Blood Bank'
                }"
              >
                {{ role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Personal Information -->
      <div class="mx-4 mt-4 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ $t('profilePage.personalInfo') }}
          </h3>
          <button
            v-if="!isEditing"
            type="button"
            @click="startEditing"
            class="text-sm font-medium text-orange-500"
          >
            {{ $t('profilePage.edit') }}
          </button>
          <div v-else class="flex gap-4">
            <button
              type="button"
              @click="cancelEditing"
              class="text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {{ $t('profilePage.cancel') }}
            </button>
            <button
              type="button"
              @click="saveChanges"
              class="text-sm font-medium text-orange-500"
            >
              {{ $t('profilePage.save') }}
            </button>
          </div>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          <!-- First Name -->
          <div class="px-4 py-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('auth.firstName') }}</label>
            <input
              v-if="isEditing"
              v-model="editForm.firstName"
              type="text"
              class="w-full py-2 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p v-else class="text-base text-gray-900 dark:text-white">{{ user?.firstName || '-' }}</p>
          </div>

          <!-- Last Name -->
          <div class="px-4 py-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('auth.lastName') }}</label>
            <input
              v-if="isEditing"
              v-model="editForm.lastName"
              type="text"
              class="w-full py-2 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p v-else class="text-base text-gray-900 dark:text-white">{{ user?.lastName || '-' }}</p>
          </div>

          <!-- Email -->
          <div class="px-4 py-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('auth.emailPlaceholder') }}</label>
            <input
              v-if="isEditing"
              v-model="editForm.email"
              type="email"
              class="w-full py-2 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p v-else class="text-base text-gray-900 dark:text-white">{{ user?.email || '-' }}</p>
          </div>

          <!-- Phone -->
          <div class="px-4 py-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('auth.phoneNumber') }}</label>
            <input
              v-if="isEditing"
              v-model="editForm.phone"
              type="tel"
              class="w-full py-2 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p v-else class="text-base text-gray-900 dark:text-white">{{ user?.phone || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- Professional Information (Vets only) -->
      <div v-if="isVet || isBloodBank" class="mx-4 mt-4 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ $t('profilePage.professionalInfo') }}
          </h3>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          <!-- License Number -->
          <div class="px-4 py-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('matricula.numeroLabel') }}</label>
            <input
              v-if="isEditing"
              v-model="editForm.matriculaNumero"
              type="text"
              class="w-full py-2 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p v-else class="text-base text-gray-900 dark:text-white">{{ matricula?.numero || '-' }}</p>
          </div>

          <!-- Country -->
          <div class="px-4 py-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('matricula.countryLabel') }}</label>
            <select
              v-if="isEditing"
              v-model="editForm.matriculaCountry"
              class="w-full h-[42px] py-2 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option v-for="country in countryOptions" :key="country.code" :value="country.code">
                {{ country.name }}
              </option>
            </select>
            <p v-else class="text-base text-gray-900 dark:text-white">{{ matricula ? getCountryName(matricula.country, matricula.countryName) : '-' }}</p>
          </div>

          <!-- Country Name (when OTHER is selected) -->
          <div v-if="isEditing && editForm.matriculaCountry === 'OTHER'" class="px-4 py-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('matricula.countryNamePlaceholder') }}</label>
            <input
              v-model="editForm.matriculaCountryName"
              type="text"
              :placeholder="$t('matricula.countryNamePlaceholder')"
              class="w-full py-2 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <!-- Logout -->
      <div class="mx-4 mt-6 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          @click="handleLogout"
          class="w-full px-4 py-3.5 flex items-center justify-center gap-2 text-red-600 dark:text-red-400"
        >
          <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          <span class="text-base font-medium">{{ $t('profilePage.logout') }}</span>
        </button>
      </div>

      <!-- Bottom spacing -->
      <div class="h-6"></div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top);
}
</style>
