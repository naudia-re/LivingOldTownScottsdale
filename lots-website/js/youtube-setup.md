# YouTube Auto-Update Setup

The video strip on the homepage can refresh automatically every time you publish a new YouTube video. Here's how to wire it up — takes about 5 minutes, and is **free** within YouTube's daily limits (you'll use ~24 of 10,000 free API calls per day).

## Step 1 — Create a Google Cloud project

1. Go to https://console.cloud.google.com/
2. Sign in with the Google account that owns your YouTube channel
3. Top-left dropdown → **New Project** → name it `Living Old Town Scottsdale`
4. Click **Create**

## Step 2 — Enable the YouTube Data API

1. In the search bar at the top, type **YouTube Data API v3**
2. Click the result → **Enable**

## Step 3 — Create an API key

1. Left sidebar → **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **API key**
3. Copy the key that appears (looks like `AIzaSy...`)
4. Click **Edit API key** to restrict it (important for security):
   - **Application restrictions** → **HTTP referrers**
   - Add these referrers (one per line):
     ```
     https://livingoldtownscottsdale.com/*
     https://www.livingoldtownscottsdale.com/*
     http://localhost:*/*
     ```
   - **API restrictions** → **Restrict key** → check **YouTube Data API v3**
   - **Save**

## Step 4 — Add the key to the site

1. Open `lots-website/index.html`
2. Search for `LOTS_YT_CONFIG` (it's in the YouTube strip section)
3. Paste your key between the quotes:
   ```js
   window.LOTS_YT_CONFIG = {
     apiKey: 'AIzaSy...your-key-here...',
     channelId: 'UCdlfRlfFRFJZq5dSb72hkUA',
     maxResults: 8,
     cacheMinutes: 60
   };
   ```
4. Save and refresh the site — your latest 8 videos will load automatically.

## How it works

- On page load, the script fetches your 8 most recent videos from YouTube
- Results are cached in the visitor's browser for **60 minutes** (saves API quota)
- If the API ever fails or hits a limit, the page falls back to the hardcoded videos that were there at build time — so the strip never breaks
- Every time you publish a new video, it shows up on the site within 60 minutes (or instantly for new visitors)

## Quota math

- YouTube gives you **10,000 quota units/day** for free
- One `search` call = 100 units
- With a 60-minute cache, even 1,000 daily visitors only triggers ~24 API calls/day = 2,400 units. You'll never hit the limit.

## Channel ID reference

Your channel ID is hardcoded as `UCdlfRlfFRFJZq5dSb72hkUA`. If you ever change channels, find your new ID at https://www.youtube.com/account_advanced.
