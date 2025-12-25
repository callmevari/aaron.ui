# TASK-9: Profile Page

## Overview

Create a Profile page accessible from the bottom navbar that displays user information, notification history, and allows editing of profile fields.

---

## Requirements

### 1. Navigation
- Access via the Profile icon in the mobile bottom navbar
- Default view: Current user's profile ("My Profile")
- Future: Same template will be reused to view other users' profiles

### 2. Notification Bell (Top-Right)
- Heart/bell icon at top-right corner
- Shows badge with unread notification count
- Opens notification history panel/modal when tapped
- Notification history features:
  - List of received push notifications (replicas)
  - User can dismiss individual notifications
  - Auto-expire after 7 days
  - Types: Blood requests, donor matches, vet requests, etc.

### 3. Profile Information Display
- **Avatar**: User photo or default placeholder
- **Name**: First + Last name
- **Email**: User's email address
- **Phone**: Phone number
- **License Number (Vets only)**: Matrícula number (shown only for vet/blood bank users)

### 4. Edit Functionality
- All fields should be editable
- Inline editing or edit mode toggle
- Validation for each field
- Save/Cancel actions

### 5. Design Requirements
- Fresh, modern style consistent with the rest of the app
- Clean layout with proper spacing
- Support for dark mode
- Mobile-first responsive design

---

## Data Model

### User Profile (from user store)
```typescript
interface UserProfile {
  // Auth info
  firstName: string
  lastName: string
  email: string
  phone: string

  // Avatar
  photoUrl?: string

  // Role-specific
  profileType: 'emergency' | 'donor' | 'vet' | 'regular'
  vetType?: 'veterinary' | 'blood-bank' | 'both'
  matricula?: {
    numero: string
    country: string
    countryName?: string
  }

  // Location
  location?: {
    lat: number
    lng: number
    address: string
  }
}
```

### Notification History (new store needed)
```typescript
interface NotificationItem {
  id: string
  type: 'BLOOD_UNIT_AVAILABLE' | 'DONOR_AVAILABLE' | 'NEARBY_BLOOD_REQUEST' | 'VET_REQUEST'
  title: string
  body: string
  createdAt: string
  expiresAt: string // 7 days from creation
  isRead: boolean
  isDismissed: boolean
  extra?: Record<string, unknown>
}
```

---

## UI Structure

```
┌─────────────────────────────────────┐
│ [Back?]     My Profile      [Bell] │  <- Header with notification bell
├─────────────────────────────────────┤
│                                     │
│         ┌─────────┐                │
│         │  Avatar │                │
│         └─────────┘                │
│      First + Last Name             │
│      email@example.com             │
│                                     │
├─────────────────────────────────────┤
│  Personal Information    [Edit]    │
├─────────────────────────────────────┤
│  First Name                        │
│  ┌─────────────────────────────┐   │
│  │ John                        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Last Name                         │
│  ┌─────────────────────────────┐   │
│  │ Doe                         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Email                             │
│  ┌─────────────────────────────┐   │
│  │ john@example.com            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Phone                             │
│  ┌─────────────────────────────┐   │
│  │ +54 11 1234-5678            │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤  (Vets only)
│  Professional Information          │
├─────────────────────────────────────┤
│  License Number (Matrícula)        │
│  ┌─────────────────────────────┐   │
│  │ 12345                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Country                           │
│  ┌─────────────────────────────┐   │
│  │ Argentina                   │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  [Logout Button]                   │
└─────────────────────────────────────┘
│        Bottom Navigation           │
└─────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/pages/profile/index.vue` | Create | Main profile page (rename existing profile.vue to avoid conflict) |
| `app/stores/notifications.ts` | Create | Store for notification history |
| `app/components/NotificationHistory.vue` | Create | Notification history panel/modal |
| `app/components/ProfileAvatar.vue` | Create | Avatar component with edit capability |
| `i18n/locales/en.json` | Modify | Add profile page translations |
| `i18n/locales/es.json` | Modify | Add Spanish translations |

---

## Implementation Steps

### Phase 1: Basic Profile Page
1. Create `app/pages/profile/index.vue` with user info display
2. Add avatar display with placeholder
3. Show user fields (name, email, phone)
4. Show vet-specific fields conditionally
5. Add logout button

### Phase 2: Edit Functionality
1. Add edit mode toggle
2. Create editable form fields
3. Add validation
4. Implement save/cancel logic
5. Update user store with edit actions

### Phase 3: Notification History
1. Create notifications store
2. Create NotificationHistory component
3. Add notification bell with badge
4. Implement dismiss and auto-expire logic
5. Persist notifications in localStorage

### Phase 4: Polish
1. Add i18n translations
2. Dark mode support
3. Animations and transitions
4. Test on mobile devices

---

## Future Considerations

- **View Other Profiles**: Same template with read-only mode for viewing other users
- **Profile Verification Badge**: Show verified status for vets
- **Activity History**: Show donation history, requests made, etc.
- **Settings Section**: App preferences, language, notifications settings
- **Account Deletion**: Option to delete account

---

## Notes

- The existing `profile.vue` is the registration/onboarding flow, NOT the profile page
- Consider renaming existing `profile.vue` to `onboarding.vue` or similar to avoid confusion
- The notification history is a LOCAL replica of push notifications, not a backend feature
