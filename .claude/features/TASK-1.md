# TASK-1: Project Setup

## Objective

Set up the base UI project with all foundational dependencies.

## Tech Stack

| Package | Purpose |
|---------|---------|
| Nuxt 4.2.2 | Vue 3 framework with SSR/SSG |
| @pinia/nuxt | State management |
| @nuxtjs/tailwindcss | Utility-first CSS |
| Preline | UI components for Tailwind |
| @nuxt/icon | Iconify-based icon system |
| @vueuse/nuxt | Utility composables |
| Capacitor 8.x | Native mobile shell (iOS + Android) |

## Configuration Details

- **Node version**: 22.x LTS (configured via `.nvmrc`)
- **App ID**: `pet.aaron.app`
- **App Name**: Aaron.pet
- **Platforms**: Web, iOS, Android

## Files Created/Modified

```
.nvmrc                          # Node version (22)
.gitignore                      # Git ignore rules
package.json                    # Dependencies and scripts
nuxt.config.ts                  # Nuxt configuration
tailwind.config.js              # Tailwind + Preline content paths
capacitor.config.ts             # Capacitor app config
app/
  app.vue                       # Root component
  pages/
    index.vue                   # Home page
  plugins/
    preline.client.ts           # Preline auto-init
  assets/
    css/
      main.css                  # Tailwind directives
ios/                            # Capacitor iOS project
android/                        # Capacitor Android project
```

## NPM Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run generate     # Generate static site
npm run cap:sync     # Generate + sync to native
npm run cap:ios      # Open Xcode
npm run cap:android  # Open Android Studio
```

## Status

- [x] Completed
