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

## Account Types

- **Blood seeker**: "I'm looking for blood" (Cat/Dog)
- **Donor**: "I'm a donor" (Cat/Dog) - can have multiple pets
- **Veterinary/Blood Bank**: Can be Vet, Blood Bank, or Both; Cat, Dog, or Both

All account types can send emergency blood requests.

## Critical Features

1. **Location**: Geolocation with manual city fallback
2. **Emergency notifications (24/7)**: Crucial opt-in for night emergencies - this is the core network feature
3. **Regular notifications**: New donors, blood units, nearby requests

## Current Scope (MMVP)

- Auth screens (login/signup with user/pass, prepared for Google auth)
- Account type selection
- Basic navigation between core screens

## Development Rules

- Wait for explicit instructions before implementing
- Don't anticipate or pre-implement features
- Keep components simple and reusable
- Clearly indicate files created/modified
