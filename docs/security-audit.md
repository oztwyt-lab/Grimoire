# Security Audit Notes

Last updated: 2026-05-10

## Current Launch-Blocking Findings

- Removed obsolete `resend-waitlist` worker from the repo. It contained an exposed Resend API key and is no longer needed for launch.
- Added Firestore rules to the repo so Firebase access policy can be reviewed, versioned, and deployed.
- Hardened account deletion so Firebase re-authentication happens before deleting user data.
- Switched Firebase Auth from memory-only sessions to AsyncStorage-backed persistence so testers stay signed in between app launches.
- Added privacy policy and Play Data Safety drafts for publishing preparation.

## Manual Follow-Up Required

- Revoke/rotate the exposed Resend API key in the Resend dashboard. The key existed in git history.
- Deploy Firestore rules with `firebase deploy --only firestore:rules` after final review.
- Confirm Firebase Auth authorized domains and disable unused sign-in providers.
- Review Firebase usage/budget alerts before tester rollout.
- `npm audit --omit=dev` still reports 14 advisories after the safe fix path: 1 high in Firebase's `undici` dependency chain and 13 moderate Expo/PostCSS advisories. The remaining automated fix path is breaking and should be handled as a deliberate Firebase/Expo upgrade pass, not a fast-track patch.

## Deferred Until Before Paid Launch

- Move subscription entitlement changes to a trusted backend or Firebase custom claims. Client-side subscription fields are not sufficient for real paid enforcement.
- Add Firebase App Check or equivalent abuse controls if Firebase cost exposure grows.
