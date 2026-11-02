# STYLE AI - THE ROADMAP TO A BILLION DOLLARS

This document outlines all remaining features required to transition from the MVP to a sticky, monetizable, daily-habit app.

## 1. The Wardrobe Value & Velocity Loop (Cost-Per-Wear)
- **What it is:** Tracking how much value a user gets out of their clothes. Every time a user logs an outfit, the `wear_count` increments for those specific items.
- **The Utility:** The dashboard displays a "Closet Depreciation Meter." A $200 jacket worn 10 times is $20/wear. A $80 shirt worn 0 times is $80/wear.
- **Behavioral Hook:** Triggers data investment. Users won't delete the app because their financial wardrobe history lives there.

## 2. Predictive Context Engine (Pre-emptive Styling)
- **What it is:** A background function that runs at 7:00 AM. It pings a Weather API and the user's Calendar.
- **The Utility:** Instead of waiting for a scan, it sends a push notification: "It's 11°C and raining, but you have a formal meeting at 2:00 PM. Tap to see 3 optimal combinations from your saved wardrobe."
- **Behavioral Hook:** Shifts the app from reactive (rating outfits) to proactive (telling you what to wear).

## 3. The Interactive Coarse-to-Fine Adjuster
- **What it is:** An editable slide-up sheet displaying the AI's parsed JSON after a scan. Every item is an editable tag. Tapping "Charcoal Hoodie" opens a menu: [Edit Color | Change Material | Swap Layer].
- **The Utility:** Removes frustration when the AI guesses wrong. Ensures data written to Supabase is pristine.
- **Behavioral Hook:** Gives the user total control over their digital closet.

## 4. Single-Item Gap Arbitrage (The Core Monetization)
- **What it is:** An algorithm that scans the user's database. It identifies structural limitations (e.g., user has 5 dark trousers and 4 blazers, but 0 light base layers).
- **The Utility:** The dashboard generates a micro-card: "You are missing a Cream Micro-Rib Tee. Adding this unlocks 9 new outfit configurations with items you already own."
- **Behavioral Hook:** Clicking the card opens a native checkout (affiliate link). You monetize the missing link.

## 5. Supabase Authentication & Cloud Storage
- **What it is:** Full auth (Email/OAuth). Uploading scanned images to Supabase Storage buckets. Syncing the dashboard history.
- **The Utility:** Users can log in on a new phone and their entire wardrobe is there. No more `localStorage` amnesia.

## 6. True AI Try-On (Premium Tier)
- **What it is:** Replacing the "Preview Mode" with Fal.ai/Replicate InstantID integration.
- **The Utility:** The AI literally puts the shirt on the user's body.
- **Monetization:** Lock this behind a $5/mo paywall to cover API costs.

## 7. The AI Chat Stylist
- **What it is:** A text interface where a user can say: "I have a dinner date at a rooftop bar tonight. Pick an outfit from my closet."
- **The Utility:** The AI parses their Supabase database and outputs a specific outfit combo.

## 8. Viral Onboarding & Paywall
- **What it is:** A 5-question quiz before the dashboard (Vibe, Budget, Body Type).
- **The Utility:** Cognitive dissonance. After investing 2 minutes answering questions, users convert to the $4.99/mo subscription at a much higher rate.
