# TASK-4: Profile Selection

## Objective

Create a profile selection flow after sign up to determine user type and needs.

## URL

`/profile`

## Design

Multi-step flow with no escape from first screen:

### Step 1: Profile Type
- Title: "Which is your profile?"
- Red button: "I have an emergency"
- Regular button: "I'm a donor"
- Regular button: "I'm a vet / blood bank"

### Flow 1: Emergency
**Step 2a: Emergency Type**
- "I need blood"
- "I need a vet"

**Step 3a: Animal Type**
- "Cat"
- "Dog"
- "Other (exotic animals)" - only for "I need a vet"

### Flow 2: Donor
**Step 2b: Animal Type**
- "Cat"
- "Dog"
- "Both"

### Flow 3: Vet/Blood Bank
**Step 2c: Service Type**
- "I'm a veterinary"
- "Blood Bank"
- "Both"

## Features

- No back button on initial profile selection (cannot escape)
- Back navigation available on subsequent steps
- Fade transitions between steps
- Safe area insets for mobile
- Dark/light mode support

## Files Created

```
app/pages/profile.vue    # Profile selection page
```

## State Management

Stores selections in component refs:
- `profileType`: 'emergency' | 'donor' | 'vet'
- `emergencyType`: 'blood' | 'vet'
- `animalType`: 'cat' | 'dog' | 'both' | 'other'
- `vetType`: 'veterinary' | 'blood-bank' | 'both'

## Notes

- Final step logs selection to console (awaiting API integration)
- Should be navigated to after successful sign up
- Future: save profile to backend and navigate to main app

## Status

- [x] Completed
