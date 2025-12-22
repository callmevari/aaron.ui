# Aaron.pet - Project Context

**Read ROADMAP.md for full details on each new session.**

## What is Aaron.pet?

A web and mobile app for veterinary blood emergencies. Connects people needing animal blood (cats/dogs) with donors, clinics, and blood banks.

## Tech Stack

- **Frontend**: Nuxt 3 + Vue 3 (Composition API)
- **Mobile**: Capacitor (web + Android + iOS)
- **Styling**: Tailwind CSS + Preline (basic layout/forms only)
- **Auth**: JWT via API
- **Backend**: PostgreSQL, Prisma, Redis (docker-compose)

## Core Principles

1. **Speed, clarity, reliability** over design polish
2. **Emergency flows first** - minimize friction
3. **Simple, purposeful screens** - no dashboards or analytics
4. **One feature at a time** - fully functional before moving on

## Profile Types (Registration)

Users choose one of 4 profile types when registering:

1. **"I have an emergency"** → Blood or vet request flow
2. **"I'm a donor"** → Register pet as blood donor
3. **"I'm a vet / blood bank"** → Professional registration
4. **"Regular user"** → Browse, help add info, register pets later

## User Roles

Users can have **multiple roles** (not mutually exclusive):

- **REGULAR**: Individuals (from emergency/donor/regular flows)
- **VET**: Veterinary clinics or doctors
- **BLOOD_BANK**: Blood storage facilities

Example: A vet clinic with blood bank services has both VET + BLOOD_BANK roles.

All roles can send emergency blood requests.

## Role-Based Request Visibility

| Role | Sees Blood Requests | Sees Vet Emergencies |
|------|--------------------|--------------------|
| REGULAR | Only if has matching donor | No |
| VET | Yes | Yes |
| BLOOD_BANK | Yes | No |

- **VET**: Receives both blood requests AND general vet emergencies
- **BLOOD_BANK**: Only blood-related requests (donors, blood units)
- **REGULAR with donor**: Blood requests matching their pet's blood type

## Data Model: Entities Users Can Register

### Pets (with optional Donor activation)
- Cats or Dogs owned by user
- **Basic info**: name, species, photo, age, weight
- **Donor info (optional)**: blood type, is tipified, tipified by, availability toggle, last donation
- A pet becomes a "donor" when blood type is set and availability is ON
- Users can register pets first, then activate as donors later
- **Duplicates allowed** - focus on emergencies, not pet identity
- Multiple pets per account

### Places (Vets, Clinics, Blood Banks)
- **Duplicate suggestion**: Show possible matches, ask user "Is this your place?" - no blocking
- Required: phone, city, country
- Optional: full address
- Additional: hours, animal types (dog/cat/both), 24/7 status

## UI-Only Project

This is a **frontend-only project**. All data is mocked/logged to console. Backend integration will come later. Design all flows with the data model in mind, but don't implement persistence.

## Critical Features

1. **Location**: Geolocation with manual city fallback (200km default radius)
2. **Emergency notifications (24/7)**: Crucial opt-in for night emergencies - this is the core network feature
3. **Regular notifications**: New donors, blood units, nearby requests

## Post-Registration Navigation

Bottom navigation with 5 tabs:

| Tab | Icon | Purpose |
|-----|------|---------|
| **My Donors** | Heart | My registered donor pets, add pet |
| **Requests** | Bell | Blood requests / vet emergencies nearby (role-based) |
| **SOS** | Alert | Send emergency request (prominent, center) |
| **Places** | Map pin | Search vets, clinics, blood banks |
| **Profile** | User | My account, settings, notifications |

All users can: register donors, send emergency requests, respond to nearby requests, add/suggest places.

## Current Scope (MMVP)

- Auth screens (login/signup with user/pass, prepared for Google auth)
- Account type selection
- Basic navigation between core screens

## Development Rules

- Wait for explicit instructions before implementing
- Don't anticipate or pre-implement features
- Keep components simple and reusable
- Clearly indicate files created/modified
