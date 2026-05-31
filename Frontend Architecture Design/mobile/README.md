# GreenLens Kids — React Native (Expo)

Main home screen UI for children ages 4–8. **Frontend only** — mock data, no API calls.

## Run

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) or press `a` / `i` for emulator.

## Main screen sections (top → bottom)

1. **GreetingCard** — personalized welcome
2. **StreakDisplay** — daily streak with bonus XP badge
3. **XPProgress** — level + XP progress bar
4. **ScanButton** — large “Scan & Learn!” CTA
5. **GameCardsSection** — horizontal quiz/game cards
6. **DailyMission** — today’s mission + progress

## Bottom tabs

Home · Games · Progress · Profile · Parents (placeholders except Home)

## Structure

```
mobile/src/
├── components/     # Reusable UI (GreetingCard, GameCard, …)
├── screens/        # HomeScreen + placeholders
├── navigation/     # Bottom tab navigator
├── data/           # mockData.ts
└── theme/          # colors, spacing, radius
```

## Design notes

- Large tap targets (min ~48–72pt)
- Playful palette aligned with GreenLens web prototype
- `ScrollView` for small screens; safe area aware
- Press feedback via `Pressable` scale/opacity
