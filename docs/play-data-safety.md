# Google Play Data Safety Worksheet

Last updated: 2026-05-10

Use this as the source of truth when filling Google Play's Data safety form. Keep it aligned with `docs/privacy-policy.md`.

## Data Collected

### Personal Info

- Email address
- Purpose: account management, authentication, support
- Required: yes for account use
- Shared: service provider processing through Firebase/Google

### User IDs

- Firebase UID
- Purpose: account management, data ownership/security, support
- Required: yes
- Shared: service provider processing through Firebase/Google

### User Content

- Recipes, ingredients, cooking steps, inventory items, expiry dates, profile nickname, character/equipment selections, feedback messages
- Purpose: app functionality, account management, support, app improvement
- Required: recipes/inventory/profile are required for core features; feedback is optional
- Shared: service provider processing through Firebase/Google

### App Activity / Preferences

- Language, sound settings, recent recipe IDs, local shopping list state
- Purpose: app functionality and personalization
- Required: no
- Shared: no for local-only data

## Data Not Currently Collected

- Precise location
- Contacts
- Photos/videos
- Audio recordings
- Health data
- Payment information
- Advertising ID
- Device contacts or SMS

## Security Practices To Declare

- Data is encrypted in transit by Firebase/Google services.
- Users can request/delete their data through in-app account deletion.
- Data is not sold.

## Internal Testing Notes

- Feedback collection stores message, UID, app version, platform, and timestamp.
- The current subscription screen is informational/disabled; no billing provider is active.
- The waitlist worker was removed before publishing because the waitlist is no longer part of the launch path.
