# Security Audit Notes

Last updated: 2026-05-10

## Completed Launch-Blocking Security Work

- Removed obsolete `resend-waitlist` worker from the repo. It contained an exposed Resend API key and is no longer needed for launch.
- Revoked/deleted the exposed Resend waitlist API key in the Resend dashboard.
- Added Firestore rules to the repo so Firebase access policy can be reviewed and versioned.
- Deployed Firestore rules to `grimoire-f420b`; Firebase CLI reported successful compile, upload, and release to Cloud Firestore.
- Hardened account deletion so Firebase re-authentication happens before deleting user data.
- Switched Firebase Auth from memory-only sessions to AsyncStorage-backed persistence so testers stay signed in between app launches.
- Added privacy policy and Play Data Safety drafts for publishing preparation.

## Manual Follow-Up Required

- Confirm Firebase Auth authorized domains and disable unused sign-in providers.
- Review Firebase usage/budget alerts before tester rollout.
- `npm audit --omit=dev` still reports 14 advisories after the safe fix path: 1 high in Firebase's `undici` dependency chain and 13 moderate Expo/PostCSS advisories. The remaining automated fix path is breaking and should be handled as a deliberate Firebase/Expo upgrade pass, not a fast-track patch.

## Deferred Until Before Paid Launch

- Move subscription entitlement changes to a trusted backend or Firebase custom claims. Client-side subscription fields are not sufficient for real paid enforcement.
- Add Firebase App Check or equivalent abuse controls if Firebase cost exposure grows.
