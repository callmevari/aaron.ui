# iOS Push Notifications – Local Testing Guide (Nuxt + Capacitor)

This document describes **step by step** how to **locally test native iOS push notification permissions** using:

- MacBook Pro
- Physical iPhone (e.g. iPhone 13)
- USB cable
- Xcode
- Nuxt 4 + Capacitor.js

> ⚠️ **Important**: Push notifications **do NOT work properly on the iOS simulator**. You must always use a **physical device**.

---

## 0. Prerequisites

- macOS with Xcode installed
- Valid Apple ID (free account is enough)
- iPhone connected via USB cable
- Nuxt + Capacitor project already initialized

---

## 1. Correct plugin (mandatory)

Use **@capacitor/push-notifications** (do NOT use Web APIs).

```bash
npm install @capacitor/push-notifications
npx cap sync ios
```

Verify `capacitor.config.ts`:

```ts
export default {
  appId: 'com.yourcompany.yourapp', // DO NOT change later
  appName: 'YourApp',
  webDir: '.output/public',
}
```

⚠️ Changing `appId` after the first build will break entitlements and permissions.

---

## 2. Minimal JS code to request permissions

⚠️ **Must be executed from a user interaction** (e.g. button click).

```ts
import { PushNotifications } from '@capacitor/push-notifications'

export async function requestPushPermissions() {
  const permStatus = await PushNotifications.requestPermissions()

  if (permStatus.receive === 'granted') {
    await PushNotifications.register()
  } else {
    console.log('Push notification permission rejected')
  }
}
```

❌ Do NOT run inside `onMounted`
❌ Do NOT run automatically on app launch

---

## 3. Open the iOS project in Xcode

From the project root:

```bash
npx cap open ios
```

This opens the **native iOS project** in Xcode.

---

## 4. Mandatory Xcode configuration

### 4.1 Signing & Capabilities

In Xcode:

1. Select the app **Target**
2. Go to **Signing & Capabilities**
3. Select your **Team (Apple ID)**
4. Enable:
   - ✅ Push Notifications
   - ✅ Background Modes
     - ☑️ Remote notifications

⚠️ If this is not enabled → **iOS will never show the permission popup**.

---

### 4.2 Info.plist (optional but recommended)

If you use Firebase or want to avoid conflicts:

```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

ℹ️ iOS **does NOT use** `NSPushNotificationsUsageDescription` (unlike Android).

---

## 5. Run the app on the physical iPhone

1. Connect the iPhone via USB
2. In Xcode (top bar), select your iPhone as the run destination
3. Press ▶️ **Run**

The app will be installed on the device.

---

## 6. Test the permission correctly

1. Open the app on the iPhone
2. Tap the button that calls:

```ts
requestPushPermissions()
```

3. The **native iOS permission popup** should appear

---

## 7. Reset permissions (critical for debugging)

⚠️ iOS **will not show the popup again** once a decision has been made.

### Option A – App-specific settings

```
Settings → Notifications → YourApp → Allow Notifications
```

### Option B – Full reset (debugging)

```
Settings → General → Transfer or Reset → Reset → Reset Location & Privacy
```

---

## 8. Verify entitlements are correctly applied

From JS or Xcode console:

```ts
await PushNotifications.register()
```

- ✅ No error → configuration is correct
- ❌ Error like `Missing entitlement` → issue in **Signing & Capabilities**

---

## 9. Common mistakes (90% of issues)

❌ Testing on simulator
❌ Requesting permission without user interaction
❌ Push Notifications not enabled in Xcode
❌ Changing `appId` after initial build
❌ Using Web Notification APIs instead of Capacitor plugin

---

## 10. Summary

- Use Capacitor Push Notifications
- Always test on physical iPhone
- Enable Push Notifications in Xcode
- Request permission from a user gesture
- Reset permissions when debugging

---

This file is intended to be used as **reference documentation for AI-assisted coding tools** or onboarding developers.

