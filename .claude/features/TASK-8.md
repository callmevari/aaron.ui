# TASK-8: Vet Registration Flow

## Objective

Complete the "I'm a vet / blood bank" sign up flow with professional license (matrícula) registration.

## Implementation Summary

### 1. Vet Type Selection

After selecting "I'm a vet / blood bank", users see:
- **Veterinary** - Active, navigates to matrícula form
- **Blood Bank** - Disabled with "Coming Soon" label
- **Both** - Disabled with "Coming Soon" label

### 2. Matrícula Registration Flow

```
Profile Selection → "I'm a vet / blood bank" → Vet Type Selection
                                                     │
                                                     ▼
                                              Matrícula Form
                                              (License number + optional photos)
                                                     │
                                                     ▼
                                              Location → Notifications → Home
                                                                           │
                                                                           ▼
                                                              Email Verification Banner
```

### 3. Role Capabilities

| Role | Can Send SOS | Max Active SOS | Receives Blood Requests | Receives Vet Requests |
|------|-------------|----------------|------------------------|----------------------|
| **REGULAR** | Blood + Vet | 1 | Only if has matching donor | No |
| **VET** | Blood only | 5 | No | Yes |
| **BLOOD_BANK** | Blood only | 5 | Yes | No |
| **VET + BLOOD_BANK** | Blood only | 5 | Yes | Yes |

*Vets don't send "Vet requests" because they ARE vets.

### 4. Files Modified

| File | Changes |
|------|---------|
| `app/pages/profile.vue` | Fixed avatar bug; disabled Blood Bank/Both with "Coming Soon"; added matrícula form step; removed DNI/selfie verification |
| `app/stores/user.ts` | Replaced `MockVerification` with `MatriculaData`; added `setMatricula()` action; added `isEmailVerified` state; added `needsEmailVerification` getter |
| `app/pages/home.vue` | Added email verification banner for vets |
| `app/pages/sos.vue` | Updated limits: 5 blood requests max for vets/blood banks; vets can't request vet services |
| `i18n/locales/en.json` | Replaced `verification` section with `matricula`; added `emailVerification` section |
| `i18n/locales/es.json` | Replaced `verification` section with `matricula`; added `emailVerification` section |

### 5. Bug Fixes

- **Avatar bug fixed**: In donor registration flow, the avatar photo was being lost because `photoUrl: ''` was hardcoded instead of using `donorForm.photoUrl`

### 6. Matrícula Form Fields

```typescript
const matriculaForm = reactive({
  numero: '',           // Required - Professional license number
  documentPhotos: []    // Optional - Photos of license documents (base64)
})
```

### 7. Email Verification

- Vets see an amber banner at the top of the home page prompting to verify their email
- Banner includes:
  - Title: "Verify your email"
  - Message explaining why verification is needed
  - "Resend verification email" button (mocked)
  - Dismiss button (marks as verified for now)

### 8. User Store State

```typescript
interface UserState {
  // ... existing fields
  matricula: MatriculaData | null
  isEmailVerified: boolean
}

interface MatriculaData {
  numero: string
  documentPhotos: string[]  // base64 photos (optional)
}
```

## Status

- [x] Avatar bug fix
- [x] Blood Bank and Both options disabled with "Coming Soon"
- [x] Matrícula form step (license number + optional photos)
- [x] User store updated for matrícula data
- [x] SOS limits (5 for vets, disable vet requests for vets)
- [x] i18n translations (EN/ES)
- [x] Email verification banner for vets

## Future Considerations

1. **Blood Bank Registration** - Enable blood bank flow with specific fields
2. **Didit SDK Integration** - Add optional identity verification
3. **Place Registration** - Collect clinic/blood bank details (name, address, hours)
4. **Professional License Verification** - Verify actual vet license with official database
5. **Admin Dashboard** - Review pending registrations
6. **Real Email Verification** - Backend integration for email verification flow
