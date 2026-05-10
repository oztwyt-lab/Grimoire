# Internal Testing Runbook

Last updated: 2026-05-10

## Current Status

- Security rules are deployed to Firebase project `grimoire-f420b`.
- The exposed Resend waitlist key was revoked and the waitlist worker was removed.
- Remembered login is enabled through Firebase Auth persistence.
- Brand display name is `Grimor`.
- Android package is locked as `com.slingbladestudios.grimoire`.

## Before Building

- Run `npx.cmd tsc --noEmit`.
- Confirm `app.json` keeps `newArchEnabled: true`.
- Confirm `android.versionCode` is higher than any previously uploaded Play artifact.
- Confirm Play upload artifact uses the `production` profile, not the dev-client APK.

## Build Command

```powershell
npx.cmd eas build --platform android --profile production
```

Expected artifact: Android App Bundle (`.aab`).

## Smoke Test Checklist

- Fresh install opens without red runtime errors.
- Register a new account.
- Log out and log back in.
- Close/reopen app and confirm remembered login works.
- Create character.
- Create recipe with ingredients and steps.
- Edit recipe.
- Add inventory item.
- Start Cook Mode from a recipe.
- Complete a boss fight.
- Confirm ingredients are consumed on done.
- Submit feedback from Settings.
- Confirm admin feedback inbox works for admin email.
- Confirm EN/TR language toggle works.
- Delete test account and confirm app returns to auth flow.

## Play Console Internal Testing

- Upload the `.aab` to Testing > Internal testing.
- Add tester emails.
- Add app access instructions because the app requires login.
- Use `docs/privacy-policy.md` and `docs/play-data-safety.md` while filling the Play forms.
- Keep screenshots and feature graphic as placeholders only if Play allows them for internal testing; replace before closed testing.

## Known Risk To Track

- `npm audit --omit=dev` still reports advisories that require a breaking Firebase/Expo upgrade path. Do not run `npm audit fix --force` during fast-track testing prep.
