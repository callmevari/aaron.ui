# TASK-2: Sign Up Page

## Objective

Create a simple, responsive Sign Up page that works on both desktop and mobile views.

## URL

`/signup`

## Design

Simple centered layout with:
- Logo at top
- Tagline text
- Sign Up button (links to email signup flow)
- Divider with "or"
- Sign Up with Google button (prepared for future integration)
- Link to Sign In page
- Footer with year and brand

## Features

- Responsive design (mobile + desktop)
- Dark/light mode support based on system preferences (`prefers-color-scheme`)
- Uses Tailwind CSS + Preline styling approach

## Files Created/Modified

```
tailwind.config.js              # Added darkMode: 'media' for system preference support
app/pages/signup.vue            # Sign Up page component
```

## Dependencies

- `@nuxt/icon` - For Google icon (`logos:google-icon`)

## Notes

- Google Sign Up button is prepared but not functional (awaiting backend integration)
- Sign Up button links to `/signup/email` (to be implemented)
- Sign In link points to `/signin` (to be implemented)

## Status

- [x] Completed
