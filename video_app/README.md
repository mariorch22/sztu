# Video App

A small Next.js app built for the SZTU FinTech course. It uploads MP4 and WebM clips to Supabase Storage and plays them in a public video library.

## Run locally

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env`.
2. Run [supabase/setup.sql](supabase/setup.sql) in your project's Supabase SQL Editor.
3. Start the app with Bun.

   ```bash
   bun install
   bun run dev
   ```

Open [localhost:3000](http://localhost:3000).
