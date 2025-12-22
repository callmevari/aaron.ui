# TASK-5: "I Need a Vet" Emergency Flow

## Objective

Create the emergency veterinary assistance flow for users who need immediate vet help. This flow broadcasts a medical emergency alert to nearby vets/clinics who can quickly contact the patient to offer services.

## URL

`/request/vet` (results page)

## Flow Steps

### Step 1: Animal Type Selection (in profile.vue)
From "I have an emergency" → "I need a vet":
- **Cat** - Find vets that treat cats
- **Dog** - Find vets that treat dogs
- ~~Other (exotic animals)~~ - Disabled with "Coming Soon" label

### Step 2: Location Access
- Request geolocation permission
- Show map with current location
- Allow manual location search
- Set search radius (default 100km)

### Step 3: Notification Permission
- Request push notification permission
- Explain: vets will contact you directly
- Emergency 24/7 notifications opt-in

### Step 4: Broadcast & Results
- Create vet emergency request
- Broadcast alert to nearby vets/clinics matching:
  - Location within radius
  - Animal type (cat/dog/both)
  - 24/7 availability filter option
- Show results page with:
  - List of nearby vets/clinics
  - Distance, rating, 24/7 status
  - Contact button for each
  - Request countdown timer (24h)

## Results Page Features

### Vet/Clinic Card
- Clinic name
- Distance (km)
- 24/7 badge (if applicable)
- Animal types served (cat/dog/both icons)
- Rating (optional)
- Contact button

### Filters
- 24/7 Open Now toggle
- Animal type (already filtered from selection)

### Request Management
- **Extend 24h** button - DISABLED until request is < 8h from expiring
- **Cancel/Resolved** button
- **Rebroadcast** button (when expired)
- Countdown timer showing time remaining

## Mock Data

```typescript
interface VetClinic {
  id: string
  name: string
  distance: number // km
  is24Hours: boolean
  animalTypes: ('cat' | 'dog')[]
  rating?: number // 1-5
  phone: string
  address: string
  isAvailable: boolean
}
```

## i18n Keys Required

Add to `es.json` and `en.json`:
- `vetRequest.title` - "Veterinary Emergency"
- `vetRequest.findingVets` - "Finding nearby vets..."
- `vetRequest.nearbyVets` - "Nearby Vets"
- `vetRequest.is24Hours` - "24/7"
- `vetRequest.openNow` - "Open Now"
- `vetRequest.filter24h` - "Only 24/7 clinics"
- `vetRequest.treatsAnimals` - "Treats: {animals}"
- `vetRequest.noVetsFound` - "No vets found nearby"
- `vetRequest.extendDisabled` - "Can extend when < 8h remaining"
- `profile.comingSoon` - "Coming Soon"

## Files to Create/Modify

```
app/pages/profile.vue         # Add vet flow steps, disable exotic animals
app/pages/request/vet.vue     # New results page for vet requests
i18n/locales/en.json          # Add new translation keys
i18n/locales/es.json          # Add Spanish translations
```

## Technical Notes

- Reuse location/notification logic from blood request flow
- Similar broadcast mechanism but for vet emergencies
- Extend button disabled when `timeRemaining > 8 hours`
- Filter results by `is24Hours` and `animalTypes`

## Status

- [ ] Disable "Exotic Animals" option with "Coming Soon"
- [ ] Add vet flow steps in profile.vue
- [ ] Create /request/vet results page
- [ ] Add i18n translations
- [ ] Implement extend button 8h restriction
