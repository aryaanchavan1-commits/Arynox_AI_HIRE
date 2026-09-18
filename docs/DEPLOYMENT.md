# Deployment

## Frontend (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

## Backend (Node.js)

1. Build: `cd server && npm run build`
2. Deploy to any Node.js hosting (Railway, Render, Fly.io)
3. Set environment variables
4. Run: `node dist/index.js`

## Database (Supabase)

1. Create Supabase project
2. Run migrations in SQL Editor
3. Enable RLS policies
4. Set up storage buckets

## Environment Variables

Set all required variables in your hosting platform:
- NEXT_PUBLIC_* for frontend
- All others for backend
- Never expose service role key to frontend
