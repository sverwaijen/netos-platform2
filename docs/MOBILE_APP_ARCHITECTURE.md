# NET OS Mobile App Architecture

## Overview

The NET OS mobile app is a **React Native (Expo)** application that connects to the NET OS Platform backend. It provides members with access control (Salto KS), WiFi provisioning (UniFi Identity), parking, tickets, and all platform features on their phone.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React Native + Expo SDK 52 | Cross-platform iOS/Android |
| Navigation | Expo Router (file-based) | Native navigation |
| State | TanStack Query + Zustand | Server state + local state |
| Auth | Supabase Auth + NET OS OAuth | Unified authentication |
| Access Control | Salto KS SDK | Digital keys for doors |
| WiFi | UniFi Identity API | Auto WiFi provisioning |
| Push | Expo Notifications + FCM/APNs | Real-time alerts |
| Storage | Expo SecureStore | Credentials & tokens |
| Payments | Stripe React Native SDK | In-app payments |

## Architecture Diagram

```
┌──────────────────────────────────────────────┐
│                 Mobile App                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Expo     │ │ Supabase │ │ Native       │ │
│  │ Router   │ │ Client   │ │ Modules      │ │
│  │ (Pages)  │ │ (Realtime│ │ - Salto KS   │ │
│  │          │ │  + Auth) │ │ - NFC        │ │
│  └────┬─────┘ └────┬─────┘ │ - BLE        │ │
│       │             │       │ - WiFi       │ │
│       ▼             ▼       └──────┬───────┘ │
│  ┌──────────────────────────────────┐        │
│  │      API Layer (tRPC Client)     │        │
│  └──────────────┬───────────────────┘        │
└─────────────────┼────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│           NET OS Platform Backend            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ tRPC     │ │ Supabase │ │ Integrations │ │
│  │ Routers  │ │ Sync     │ │ - Salto KS   │ │
│  │          │ │          │ │ - UniFi      │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└──────────────────────────────────────────────┘
```

## Salto KS Integration

### How It Works

1. **Admin configures Salto KS** in NET OS Platform settings (API credentials)
2. **User opens app** → authenticates via NET OS OAuth
3. **Backend creates Salto KS mobile key** for the user via Salto KS Connect API
4. **App receives key** and stores in Salto KS SDK
5. **User taps phone on door** → Salto KS SDK handles BLE/NFC communication

### Salto KS Connect API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /users` | Create/sync user in Salto KS |
| `POST /users/{id}/mobile-keys` | Issue mobile key to user |
| `DELETE /users/{id}/mobile-keys/{keyId}` | Revoke mobile key |
| `GET /access-points` | List available doors/locks |
| `POST /access-points/{id}/online-openings` | Remote door opening |
| `GET /users/{id}/access-rights` | Check user's access rights |

### Server-Side Integration

```typescript
// server/integrations/saltoKS.ts
interface SaltoKSConfig {
  apiUrl: string;        // https://api.saltoks.com
  clientId: string;      // OAuth client ID
  clientSecret: string;  // OAuth client secret
  siteId: string;        // Salto KS site identifier
}

// Key operations:
// 1. createSaltoUser(skynetUser) → saltoUserId
// 2. issueMobileKey(saltoUserId, accessGroupId) → mobileKeyData
// 3. revokeMobileKey(saltoUserId, mobileKeyId)
// 4. listAccessPoints() → doors[]
// 5. remoteOpen(accessPointId) → success
```

### Mobile-Side Integration

```typescript
// In the Expo app:
import SaltoKS from 'react-native-salto-ks'; // Salto KS React Native SDK

// Initialize with key data from backend
await SaltoKS.initialize({
  siteId: config.siteId,
  mobileKeyData: keyFromBackend,
});

// Open door (BLE proximity)
await SaltoKS.openDoor(accessPointId);

// Listen for nearby doors
SaltoKS.onDoorDetected((door) => {
  // Show "tap to open" UI
});
```

## UniFi Identity Integration

### How It Works

1. **Admin configures UniFi Identity** in NET OS Platform (controller URL + credentials)
2. **User opens app** → backend provisions WiFi profile via UniFi Identity API
3. **App installs WiFi profile** using native WiFi configuration
4. **User auto-connects** to coworking WiFi without manual password entry

### UniFi Identity API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login` | Authenticate with controller |
| `GET /api/s/{site}/rest/user` | List WiFi users |
| `POST /api/s/{site}/rest/user` | Create WiFi user |
| `PUT /api/s/{site}/rest/user/{id}` | Update user (VLAN, bandwidth) |
| `POST /api/s/{site}/cmd/stamgr` | Authorize/de-authorize device |

### Server-Side Integration

```typescript
// server/integrations/unifiIdentity.ts
interface UniFiConfig {
  controllerUrl: string;  // https://unifi.yoursite.com
  username: string;
  password: string;
  site: string;           // default: 'default'
}

// Key operations:
// 1. createWiFiUser(email, name) → userId, password
// 2. getWiFiProfile(userId) → { ssid, password, eapConfig }
// 3. setUserBandwidth(userId, upKbps, downKbps)
// 4. setUserVlan(userId, vlanId)
// 5. disconnectUser(userId)
```

### Mobile-Side WiFi Provisioning

```typescript
// iOS: Use NEHotspotConfiguration
import { NativeModules } from 'react-native';
const { WiFiProvisioning } = NativeModules;

// Android: Use WifiNetworkSuggestion API
await WiFiProvisioning.configureWiFi({
  ssid: profile.ssid,
  password: profile.password,
  eapMethod: profile.eapMethod, // PEAP, TLS
  identity: profile.identity,
});
```

## App Screens

### Tab Navigation

| Tab | Screen | Features |
|-----|--------|----------|
| Home | Dashboard | Welcome, quick actions, presence status |
| Access | Door Control | Salto KS keys, nearby doors, open button |
| Parking | Parking | Active session, reserve spot, history |
| Services | Butler & More | Order food/drinks, book rooms, WiFi |
| Profile | Account | Settings, wallet, tickets, notifications |

### Screen Details

1. **Home Dashboard**
   - Welcome message with user name
   - Quick action cards (Open door, Reserve parking, Order coffee)
   - Today's bookings
   - Credit balance
   - Presence: who's in the space

2. **Access Control**
   - List of available doors (from Salto KS)
   - "Tap to Open" button for nearby doors
   - Access history log
   - WiFi status and auto-connect

3. **Parking**
   - Active parking session with timer
   - Reserve a spot (with day-before discount)
   - Scan license plate
   - Payment (credits or Stripe)
   - History

4. **Services**
   - Butler Kiosk (order food/drinks)
   - Book meeting room
   - Add catering to booking
   - Submit support ticket
   - View announcements

5. **Profile**
   - Account settings
   - Wallet & credits
   - My tickets
   - Notification preferences
   - WiFi settings
   - Salto key management

## API Connection

The mobile app connects to the NET OS Platform via two channels:

1. **tRPC over HTTPS** - All CRUD operations, authentication, business logic
2. **Supabase Realtime** - Live updates for parking, tickets, presence

```typescript
// Mobile tRPC client setup
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/routers';

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${SKYNET_PLATFORM_URL}/api/trpc`,
      headers: () => ({
        Authorization: `Bearer ${getStoredToken()}`,
      }),
    }),
  ],
});
```

## Push Notifications

| Event | Notification |
|-------|-------------|
| Ticket reply | "Your ticket TK-XXX has a new reply" |
| Parking expiring | "Your parking session expires in 15 min" |
| Door access granted | "Access to Meeting Room 3 granted" |
| Order ready | "Your coffee order is ready for pickup" |
| Booking reminder | "Meeting in Room A starts in 10 min" |
| Credit low | "Your credit balance is below €10" |

## Security

- All API calls over HTTPS
- JWT tokens stored in Expo SecureStore (encrypted)
- Salto KS keys stored in device secure enclave
- Biometric authentication for door access
- Certificate pinning for production builds
- Supabase RLS policies enforce data isolation

## Build & Deploy

```bash
# Development
npx expo start

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Environment Variables (Mobile)

```env
EXPO_PUBLIC_SKYNET_URL=https://your-skynet-platform.manus.space
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SALTO_SITE_ID=your-salto-site-id
```
