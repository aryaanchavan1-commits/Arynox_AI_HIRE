# Local Setup Guide

## Prerequisites

- Windows 10/11
- Node.js 18+ (https://nodejs.org/)
- npm 9+ (comes with Node.js)

## Quick Setup

1. Clone or download the project
2. Run `setup.bat`
3. Edit `.env` with your API keys
4. Run `run.bat`

## Without API Keys (Mock Mode)

The app works fully in mock mode without any API keys. You'll see "LOCAL MOCK MODE" in the UI.

## Setting Up Supabase (Optional)

1. Create a free Supabase project at https://supabase.com
2. Get your URL and keys from Settings > API
3. Run the SQL migration in the SQL Editor
4. Add keys to `.env`

## Setting Up Groq (Optional)

1. Get a free API key from https://console.groq.com
2. Add to `.env` as `GROQ_API_KEY`
3. The AI interviewer will use real LLM responses

## Troubleshooting

### Port already in use
Run `stop.bat` first, then `run.bat`.

### npm install fails
Delete `node_modules` folders and run `setup.bat` again.

### Frontend won't start
Check that all dependencies installed: `cd frontend && npm install`
