# TASK-6: Donor Registration Flow

## Objective

Complete the "I'm a donor" registration flow. Users register their pets (cats/dogs) as potential blood donors, making them available to help in emergencies nearby.

## User Role

Users completing this flow are assigned the **REGULAR** role.

## Flow Overview

```
Profile → "I'm a donor" → Cat/Dog → Donor Form → Location → Notifications → Done
```

## Flow Steps

### Step 1: Animal Type Selection (existing in profile.vue)
From "I'm a donor":
- **Cat** - Register a cat donor
- **Dog** - Register a dog donor
- **Both** - Has cats and dogs (register one, then option to add more)
- ~~Other (exotic animals)~~ - Disabled with "Coming Soon" label

### Step 2: Donor Pet Form

#### Required Fields:

| Field | Type | Notes |
|-------|------|-------|
| **Pet photo** | Image upload | Profile picture of the pet |
| **Pet name** | Text | The pet's name |
| **Age** | Number | Years (1-15 range typically) |
| **Weight** | Number | In kg (important for eligibility) |
| **Blood type** | Select | **REQUIRED - "I don't know" NOT allowed** |

Blood type options:
- **Cats**: A, B, AB
- **Dogs**: DEA 1.1 Positive, DEA 1.1 Negative, Other

#### Tipification Section:

| Field | Type | Notes |
|-------|------|-------|
| **Is the pet blood-typed/tipified?** | Select | Yes / No / I don't know |
| **If Yes: Which clinic/vet approved it?** | Search + Text | See below |

**Clinic/Vet Search Logic:**
1. User starts typing clinic/vet name
2. Search for matching Places (vets/clinics) or Users (VET role) in database
3. Show dropdown with matches
4. If match found: user selects it (creates link to Place/User)
5. If no match or "Not in list": user types manually (free text field)

### Step 3: Location Access
- Request geolocation permission
- Show map with current location
- Allow manual location search
- Set search radius (default 100km)
- Explain: "So we can notify you about blood requests nearby"

### Step 4: Notification Preferences
Main message: "Get notified when pets nearby need blood donors that match your pet"

- **Regular notifications**: New blood requests matching your pet's blood type within 100km
- **Emergency notifications (24/7)**: Critical opt-in for night emergencies - EMPHASIZE THIS
- Explain: "Your pet could save a life at any time"

### Step 5: Confirmation
- Show summary: photo, name, blood type, location
- "Donor registered successfully!"
- Option: "Add another pet" (goes back to Step 1)
- Navigate to home/dashboard

## Data Model

```typescript
interface DonorPet {
  id: string
  userId: string

  // Basic info
  name: string
  animalType: 'cat' | 'dog'
  photoUrl: string
  ageYears: number
  weightKg: number

  // Blood info (REQUIRED)
  bloodType: string // A, B, AB for cats | DEA 1.1+, DEA 1.1-, Other for dogs

  // Tipification
  isTipified: 'yes' | 'no' | 'unknown'
  tipifiedByPlaceId?: string // Link to Place if found
  tipifiedByUserId?: string  // Link to User (vet) if found
  tipifiedByManual?: string  // Manual text if not in DB

  // Status
  isAvailable: boolean // Can toggle availability
  lastDonationDate?: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

## Donor Eligibility Reference (for helper text)

Display as hints in the form:
- **Cats**: Typically 4-10 kg, 1-8 years old
- **Dogs**: Typically >25 kg, 1-8 years old
- Must be healthy and vaccinated
- Minimum 8-12 weeks between donations

## i18n Keys Required

```json
{
  "donor": {
    "title": {
      "petForm": "Register your donor",
      "selectAnimal": "What type of animal?"
    },
    "photo": "Pet photo",
    "photoHint": "Upload a photo of your pet",
    "tapToUpload": "Tap to upload photo",
    "petName": "Pet name",
    "petNamePlaceholder": "Enter your pet's name",
    "age": "Age (years)",
    "agePlaceholder": "Enter age",
    "ageHint": "Ideal donors are 1-8 years old",
    "weight": "Weight (kg)",
    "weightPlaceholder": "Enter weight",
    "weightHintDog": "Dogs should be at least 25kg",
    "weightHintCat": "Cats should be 4-10kg",
    "bloodType": "Blood type",
    "bloodTypeRequired": "Blood type is required to register as donor",
    "isTipified": "Has your pet been blood-typed by a vet?",
    "tipifiedBy": "Which clinic/vet did the blood typing?",
    "tipifiedByPlaceholder": "Search or type clinic name",
    "tipifiedByNotFound": "Not in list? Type the name manually",
    "registerDonor": "Register donor",
    "addAnother": "Add another pet",
    "registrationComplete": "Donor registered!",
    "thankYou": "Thank you for helping save lives"
  },
  "donorNotifications": {
    "title": "Stay connected",
    "description": "Get notified when pets nearby need blood donors matching {petName}.",
    "emergencyDescription": "Be available 24/7 to help in critical emergencies. Your pet could save a life.",
    "infoMessage": "You'll receive alerts for blood requests within 100km that match your pet's blood type.",
    "sendRequest": "Complete registration"
  },
  "donorLocation": {
    "description": "We need your location to notify you about blood requests nearby that match your pet's blood type."
  }
}
```

## Files to Create/Modify

```
app/pages/profile.vue           # Add donor flow steps after animal selection
i18n/locales/en.json            # Add donor translation keys
i18n/locales/es.json            # Add Spanish translations
```

## Technical Notes

- **Blood type is REQUIRED**: Unlike emergency flow, donors must know their pet's blood type
- **Photo upload**: Use Capacitor Camera plugin or file input for web
- **Clinic/Vet search**: Debounced search API call, fallback to manual text
- Reuse location/notification components from emergency flow
- Form validation: weight and age within reasonable ranges

## UI Components Needed

1. **Photo upload component**: Circular avatar with camera icon overlay
2. **Searchable dropdown**: For clinic/vet selection with manual fallback
3. **Weight/Age inputs**: Number inputs with helper text showing eligibility ranges

## Status

- [ ] Add donor form step in profile.vue (after animal selection)
- [ ] Create photo upload component
- [ ] Create clinic/vet searchable dropdown
- [ ] Add form validation (blood type required, weight/age ranges)
- [ ] Add location step for donors
- [ ] Add notification preferences for donors
- [ ] Add i18n translations (EN/ES)
- [ ] Add "Add another pet" flow
