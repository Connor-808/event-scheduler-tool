# Mapbox Places API Setup

## Get Your Free Mapbox Token

1. **Sign up for Mapbox** (Free tier includes 100,000 requests/month)
   - Go to: https://account.mapbox.com/auth/signup/
   - Create a free account

2. **Get Your Access Token**
   - After signup, you'll be redirected to your account dashboard
   - Or go to: https://account.mapbox.com/access-tokens/
   - Copy your **Default public token** (starts with `pk.`)

3. **Add Token to Your Environment**
   - Open `.env.local` in your project root
   - Add this line:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-token-here
   ```

4. **Restart Your Dev Server**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

## What You Get

✅ **100,000 free requests per month**
✅ **Real business/venue search** (finds clubs, restaurants, bars, etc.)
✅ **POI (Point of Interest) data** - much better than OpenStreetMap for businesses
✅ **USA-focused results** with proximity to NYC

## Example Searches

Once configured, you can search for:
- "Nebula" → Finds Nebula nightclub in NYC
- "Starbucks" → Finds nearby Starbucks locations
- "Central Park" → Finds the actual park
- Any business name or address in the USA

## Pricing (if you exceed free tier)

- First 100,000 requests: **FREE**
- After 100,000: **$0.75 per 1,000 requests**

For comparison, you'd need ~130 event creations per day to hit the free limit!

