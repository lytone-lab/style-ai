# STYLE.AI

A waitlist landing page built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
3. Run `supabase/schema.sql` in the Supabase SQL Editor to create the `waitlist` table and its insert-only policy.
4. Start the app with `npm run dev`.

The API uses the Supabase anon key on the server. Row-level security restricts access to inserts; never place a service-role key in the browser or commit credentials.
