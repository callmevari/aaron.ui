FRONTEND ROADMAP — Aaron.pet (Nuxt 3 + Capacitor)

You are acting as a senior frontend engineer specialized in Nuxt 3, Vue 3 (Composition API), and Capacitor.
You will work on a new project called aaron.pet.

Project goal

Aaron.pet is a web and mobile application focused on veterinary medical emergencies.
Its purpose is to quickly connect people who need blood for animals (cats or dogs) with nearby donors, veterinary clinics, and blood banks.
Speed, clarity, and reliability are more important than design or visual polish.

Technical constraints

Use Nuxt 3 with the Composition API.
The app must be compatible with Capacitor (web + Android + iOS).
Use Tailwind CSS with Preline only for basic layout and form components.
Do not focus on theming, branding, or advanced UI design.
Avoid unnecessary libraries and abstractions.
Assume authentication is handled via API (JWT).

Product principles

Prioritize emergency flows.
Minimize friction for users.
Every screen should be simple and purposeful.
No dashboards, analytics, or secondary features unless explicitly requested.

Core user flows (high level)

When registering a new account, users can choose from 4 profile types:

1. **"I have an emergency"** → Blood or vet request flow
2. **"I'm a donor"** → Register pet as blood donor
3. **"I'm a vet / blood bank"** → Professional registration
4. **"Regular user"** → Browse, help add missing info, register pets later

All flows end with:
- Location permission request
- Notification preferences (regular + 24/7 emergency opt-in)

The 24/7 emergency notification is crucial - it's the core network feature for night emergencies.

Required behaviors

During signup, request user location (geolocation if possible, fallback to manual city input and a default radius).
Ask all users for explicit consent to receive emergency notifications at any time (24/7) - explained above.

Development approach

Implement one feature at a time.
Do not anticipate or pre-implement future features.
Each feature must be fully functional and self-contained.
Clearly indicate which files are created or modified.
Keep components simple and reusable.

**UI-Only Project**: This is a frontend-only project. All data is mocked/logged to console. Backend integration will come later. Design all flows with the data model in mind, but don't implement persistence.

User Roles

Users can have **multiple roles** (not mutually exclusive):
- **REGULAR**: Individuals (from emergency/donor/regular flows)
- **VET**: Veterinary clinics or doctors
- **BLOOD_BANK**: Blood storage facilities

Example: A vet clinic with blood bank services has both VET + BLOOD_BANK roles.

### Role-Based Request Visibility

| Role | Sees Blood Requests | Sees Vet Emergencies |
|------|--------------------|--------------------|
| REGULAR | Only if has matching donor | No |
| VET | Yes | Yes |
| BLOOD_BANK | Yes | No |

- **VET**: Receives both blood requests AND general vet emergencies (medical attention)
- **BLOOD_BANK**: Only blood-related requests (donors, blood units needed)
- **REGULAR with donor**: Blood requests matching their pet's blood type within radius

Data Model: What Users Can Register

All users (regardless of role) can register two types of entities:

### 1. Pets (with optional Donor activation)
- Cats or Dogs owned by user
- Linked to user account
- **Basic info** (always): name, species (cat/dog), photo, age, weight
- **Donor info** (optional): blood type, is tipified, tipified by, availability toggle, last donation date
- A pet becomes a "donor" when:
  - Blood type is set (required for donor status)
  - Availability toggle is ON
- Users can register pets first, then activate as donors later when they know the blood type
- **Duplicates allowed**: Focus is on resolving emergencies quickly, not pet identity management
- Multiple pets per account supported

### 2. Places (Veterinaries, Clinics, Blood Banks)
- Professional locations that can help in emergencies
- **Duplicate suggestion**: When registering, show possible matches and ask "Is this your place?" - user decides, no blocking
- Required fields:
  - Phone number (required)
  - City and Country (required for proper listing)
- Optional fields:
  - Full address
- Additional info:
  - Days and attention hours
  - Animal types: Dogs / Cats / Both
  - 24/7 availability
  - Blood bank services (if applicable)

Current scope (MMVP)

The initial scope focuses on:
Authentication screens (login / signup) with user/pass and let it prepare to google sign up / sign in also).
Account type (need blood, donor, vet, blood bank).
Each account is represented by an individual or a place like a veterinary/blood bank, so the accounts could hold many resources, for example an account of type "donor" can have multiple donors in its profile (cats and dogs). All the account types are allowed to send "emergency blood requests" (core push-notification features over nights)
Basic navigation between core screens.

How to proceed

Wait for explicit instructions before implementing anything.
Each instruction will describe one specific feature to build.
Do not implement features that are not explicitly requested.

Post-Registration Experience

After completing any registration flow, users land on the Home screen with bottom navigation.

### Bottom Navigation (5 tabs)

| Tab | Icon | Purpose |
|-----|------|---------|
| **My Donors** | ❤️ | My registered donor pets, add pet |
| **Requests** | 🔔 | Blood requests / vet emergencies nearby (role-based) |
| **SOS** | 🚨 | Send emergency request (prominent, center) |
| **Places** | 📍 | Search vets, clinics, blood banks |
| **Profile** | 👤 | My account, settings, notifications |

### Home Screen

Shows based on user's registered content:
- **Has donors**: Pet cards with availability toggle, "Add another pet" button
- **No donors yet**: Prompt to register first donor or send emergency request
- **Has active requests**: Show request status cards

### Key Actions Available to All Users

1. **Register donor pets** - Add cats/dogs as blood donors
2. **Send emergency requests** - Request blood for any animal
3. **Respond to nearby requests** - Help others (if donor registered)
4. **Add/suggest places** - Contribute vet clinics, blood banks info

---

Future enhancements (not in current scope)

Location update for active requests:
- When user opens the app, check if they are outside their last saved 100km radius
- If outside: prompt "Update my location?" to update the search center for their active requests
- If inside: silently keep using the last saved location (no prompt needed)
- This allows users who travel (e.g., from clinic to home) to keep receiving relevant matches
- Does NOT require "Always" location permission - "While Using App" is sufficient since the check happens when app is opened
