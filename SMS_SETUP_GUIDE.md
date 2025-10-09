# SMS Notifications Setup Guide

## ⚠️ Issue Found
The `event_notifications` table doesn't exist in your database yet. This is why you're getting the "Failed to save verification code" error.

## 🛠️ Fix - Follow These Steps

### Step 1: Create the Database Table

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `CREATE_NOTIFICATIONS_TABLE.sql` (in this folder)
5. Click **Run** to execute the SQL

This will create:
- ✅ `event_notifications` table with all required columns
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Auto-update trigger for `updated_at` column
- ✅ Foreign key constraints

### Step 2: Verify the Table Was Created

In the Supabase SQL Editor, run:

```sql
SELECT * FROM event_notifications LIMIT 1;
```

You should see an empty result (no error) which confirms the table exists.

### Step 3: Test the SMS Flow Again

1. Restart your dev server: `npm run dev`
2. Go to an event voting page
3. Check "Get notified by text when plan is locked in"
4. Enter your phone number
5. Click "Send Code"
6. You should receive an SMS with a 6-digit code!

---

## 📋 What Changed

### 1. Created Database Table
- **File**: `CREATE_NOTIFICATIONS_TABLE.sql`
- **Table**: `event_notifications`
- **Columns**:
  - `id` (UUID, primary key)
  - `event_id` (foreign key to events)
  - `cookie_id` (foreign key to user_cookies)
  - `phone_number` (E.164 format: +15551234567)
  - `verified` (boolean, default false)
  - `verification_code` (6-digit code, nullable)
  - `code_expires_at` (timestamp, 10-min expiry)
  - `created_at` / `updated_at` (timestamps)

### 2. Updated Supabase Client
- **File**: `/lib/supabase.ts`
- **Added**: `supabaseAdmin` export
- Uses `SUPABASE_SERVICE_ROLE_KEY` for write operations
- Bypasses Row Level Security for API routes

### 3. Updated API Routes
All three SMS routes now use `supabaseAdmin` for database operations:
- `/app/api/events/[id]/request-verification/route.ts`
- `/app/api/events/[id]/verify-code/route.ts`
- `/app/api/events/[id]/lock-in/route.ts`

---

## 🔐 Security Notes

### Service Role Key vs Anon Key

**Anon Key** (client-side):
- Used in browser/client code
- Restricted by Row Level Security (RLS)
- Safe to expose publicly

**Service Role Key** (server-side):
- Used in API routes only
- **Bypasses all RLS policies**
- Should **NEVER** be exposed to the client
- Has full database access

### Why We Need Service Role Key

The `event_notifications` table contains sensitive data (phone numbers), so we use the service role key in API routes to:
1. Write to the table (anon key might not have write access)
2. Query all verified numbers for notifications
3. Ensure proper access control

### Environment Variables Required

Make sure you have these in your `.env.local`:

```env
# Supabase (both needed)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

---

## 🧪 Testing Checklist

After running the SQL migration:

- [ ] Table `event_notifications` exists in Supabase
- [ ] Can enter phone number and click "Send Code"
- [ ] Receive SMS with 6-digit verification code
- [ ] Can enter code and click "Verify"
- [ ] See success checkmark: "✓ You'll get a text when this is finalized"
- [ ] When organizer locks in, verified users receive notification SMS

---

## 🐛 Troubleshooting

### Still Getting "Failed to save verification code"?

1. **Check if table exists**:
   ```sql
   \d event_notifications
   ```

2. **Check service role key is set**:
   - In terminal: `echo $SUPABASE_SERVICE_ROLE_KEY`
   - Should not be empty

3. **Check API route logs**:
   - Look in your terminal for `console.error` messages
   - They'll show the exact Supabase error

### Not Receiving SMS?

1. **Check Twilio credentials**:
   - Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
   - Check Twilio dashboard for errors

2. **Phone number format**:
   - Should be 10 digits (US numbers)
   - Automatically formatted to E.164: `+15551234567`

3. **Twilio trial account**:
   - If using trial, you can only send to verified numbers
   - Add your number to Twilio's verified caller IDs

### Code Expired Error?

- Codes expire after 10 minutes
- Click "Resend Code" to get a new one

---

## 📞 Support

If you continue to have issues:

1. Check browser console for errors
2. Check terminal/server logs for API errors
3. Verify all environment variables are set
4. Make sure the SQL migration ran successfully

The system should work once the database table is created! 🎉

