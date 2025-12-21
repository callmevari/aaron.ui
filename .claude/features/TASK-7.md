# TASK-7: Internationalization (i18n)

## Objective
Add multi-language support to the app with Spanish as the default language and English as secondary.

## Requirements

### Language Detection Priority
1. Phone/device language (via Capacitor)
2. Browser/navigator language
3. Default to Spanish (es)

### Supported Languages
- **Spanish (es)** - Default, for Argentina launch
- **English (en)** - Current app language

### Implementation
- Use `@nuxtjs/i18n` module
- Create `/i18n/locales/` folder with:
  - `es.json` - Spanish translations
  - `en.json` - English translations
- Translate all user-facing strings in:
  - `profile.vue` - Profile flow, forms, notifications
  - `request/index.vue` - Blood request results

### Status: COMPLETED
- Installed @nuxtjs/i18n module
- Configured nuxt.config.ts with Spanish as default locale
- Created es.json and en.json with all translations
- Updated profile.vue and request/index.vue to use $t() for all strings

### Notes
- App launches in Argentina first (Spanish-speaking)
- All current English text should be extracted to en.json
- Spanish translations should be provided in es.json
