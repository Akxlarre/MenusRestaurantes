# AION Loyalty System - Setup Guide

## 🚀 Quick Start

This guide will help you set up the AION Secure NFC Loyalty System in **DEV mode** for immediate testing with QR codes.

---

## Step 1: Database Setup (Supabase)

### 1.1 Run Migrations

In your Supabase project dashboard:

1. Go to **SQL Editor**
2. Run the following migrations in order:

```bash
# 1. Core schema
supabase/migrations/001_loyalty_schema.sql

# 2. Security policies
supabase/migrations/002_rls_policies.sql

# 3. Test devices (optional, for QR testing)
scripts/seed-test-devices.sql
```

### 1.2 Verify Tables

Check that these tables were created:
- `nfc_devices` - Hardware inventory
- `loyalty_transactions` - Transaction ledger
- `user_loyalty_balance` - User balances

---

## Step 2: Deploy Edge Function

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Link to Your Project

```bash
supabase link --project-ref [YOUR_PROJECT_ID]
```

### 2.3 Deploy Function

```bash
supabase functions deploy verify-tap
```

### 2.4 Set Environment Variables

In Supabase Dashboard → **Edge Functions** → **Settings**:

```bash
NFC_MASTER_KEY=your_aes_128_key_hex  # For future NFC cards (optional now)
```

---

## Step 3: Generate QR Test Cards

### 3.1 Generate URLs

```bash
cd scripts
node generate-test-urls.js --base-url=https://[YOUR_PROJECT].supabase.co/functions/v1/verify-tap
```

This will output 5 URLs for test devices (PROTO_001 through PROTO_005).

### 3.2 Create QR Codes

1. Open `scripts/generate-qr-cards.html` in your browser
2. Paste your Edge Function URL in the input field
3. Click "Generar Tarjetas QR"
4. Click "Imprimir Tarjetas" to print

### 3.3 Printing Tips

**For Premium Look:**
- Use black cardstock (300gsm)
- Print in landscape orientation (CR80 size: 85.6mm × 53.98mm)
- Optional: Laminate with matte finish

**Quick Testing:**
- Print on regular paper
- Cut to credit card size
- Test immediately!

---

## Step 4: Test the Flow

### 4.1 Scan QR Code

1. Use your smartphone camera to scan the QR code
2. You should be redirected to: `/verify-tap`
3. After validation (~500ms), redirect to: `/puntos?status=success&stamps=1`

### 4.2 Verify Database

Check `loyalty_transactions` table for new entry:
```sql
select * from loyalty_transactions order by created_at desc limit 1;
```

### 4.3 Test Anti-Replay

Scan the same QR code again immediately → Should show error message.

---

## Step 5: Frontend Integration

The FloatingLoyaltyButton is already connected to Supabase:

- Shows current stamps for authenticated users
- Displays lifetime total
- Links to `/puntos` rewards page

**To test authenticated flow:**
1. Create a test user in Supabase Auth
2. Login on your site
3. Scan QR → Point should be automatically credited

---

## 🔧 Configuration

### Enable/Disable DEV Mode

In Edge Function (`supabase/functions/verify-tap/index.ts`):

```typescript
// DEV mode: QR testing (default for now)
const url = `${baseUrl}?uid=PROTO_001&mode=dev`

// PROD mode: Real NFC cards (when chips arrive)
const url = `${baseUrl}?uid=${uid}&counter=${counter}&cmac=${signature}`
```

### Adjust Stamps Required

In `src/pages/puntos.astro`:

```typescript
const STAMPS_REQUIRED = 10; // Change to 5, 15, etc.
```

---

## 📊 Admin Panel (Optional)

Create an admin view to:
- See all active devices
- View transaction history
- Revoke lost/stolen cards
- Award bonus points

Example query:
```sql
-- View device usage stats
select 
  d.uid_hex,
  count(t.id) as total_taps,
  max(t.created_at) as last_used
from nfc_devices d
left join loyalty_transactions t on t.device_id = d.id
group by d.uid_hex
order by total_taps desc;
```

---

## 🚨 Troubleshooting

### QR doesn't redirect
- Check Edge Function logs in Supabase Dashboard
- Verify device ID exists in `nfc_devices` table
- Ensure URL includes `?uid=XXX&mode=dev`

### "Device not found" error
- Run seed script: `scripts/seed-test-devices.sql`
- Or manually insert: `insert into nfc_devices (uid_hex, device_type) values ('PROTO_001', 'qr_mock');`

### "Replay attack" immediately
- Counter validation is working!
- Wait 60 seconds (rate limit)
- Or use a different test device (PROTO_002, etc.)

### Stamps not showing in FloatingLoyaltyButton
- Check authentication status
- Verify `user_loyalty_balance` table has data
- Check browser console for errors

---

## 🎯 Next Steps

Once QR testing is successful:

1. **Restaurant Pilot**: Test with real customers for 1-2 weeks
2. **Order NFC Cards**: Purchase NTAG 424 DNA cards + ACR122U reader
3. **Enable Production Mode**: Remove `mode=dev` parameter
4. **Deploy**: Launch premium NFC experience

---

## 📚 Resources

- [NTAG 424 DNA Datasheet](https://www.nxp.com/docs/en/data-sheet/NT4H2421Gx.pdf)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Implementation Plan](./implementation_plan.md)

---

**Questions?** Check the implementation plan or review the Edge Function logs.
