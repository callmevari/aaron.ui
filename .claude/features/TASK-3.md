# TASK-3: Sign In Page

## Objective

Create a simple Sign In page that allows users to log in with email/password or Google.

## URL

`/signin`

## Design

Page layout from top to bottom:
- Header with back arrow (navigates to /signup) and "Sign In" title
- Email input field
- Password input field
- Sign In button (disabled until form is valid)
- Divider with "or"
- Sign In with Google button
- "Forgot your password?" link
- "Don't have an account? Sign Up" link
- Footer with year and brand

## Features

- Responsive design (mobile + desktop)
- Dark/light mode support
- Safe area insets for mobile (status bar + home indicator)
- Form validation (both fields required)
- Links to signup page

## Files Created/Modified

```
app/pages/signin.vue    # Sign In page component
```

## Navigation

- Back arrow → `/signup`
- "Sign Up" link → `/signup`
- "Forgot your password?" → `#` (to be implemented)

## Notes

- Google Sign In button is prepared but not functional (awaiting backend integration)
- Form submission logs to console (awaiting API integration)
- "Forgot your password?" flow to be implemented later

## Status

- [x] Completed
