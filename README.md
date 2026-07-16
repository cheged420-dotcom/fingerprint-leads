# Fingerprint Builders — Lead Management

Internal lead management app for Fingerprint Builders, built with Next.js, Supabase, and Vercel.

## Environment variables

Set these in Vercel (Project Settings → Environment Variables) and, if running locally, in a `.env.local` file:

- `SUPABASE_URL` — the Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase service role (secret) key

These are server-side only and are never exposed to the browser.

## Database

The `leads` table schema lives in `supabase/migrations/0001_create_leads.sql`. Run it in the Supabase SQL Editor to set up the table.
